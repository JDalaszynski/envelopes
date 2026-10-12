import 'server-only';

import { fromGrosze, laterDay, type InvoiceDraft } from './accounting';
import { DEFAULT_PRICING } from './pricing';
import type { OrderInvoice } from './types';

/**
 * inFakt — REST API v3 (https://docs.infakt.pl).
 *
 * Klucz API (`INFAKT_API_KEY`) generuje się w inFakt: Ustawienia → Inne opcje
 * → API. Potrzebne uprawnienia klucza: `api:invoices:read` i
 * `api:invoices:write`. Klucz idzie w nagłówku `X-inFakt-ApiKey` i nigdy nie
 * opuszcza serwera.
 *
 * Kwoty w API są w groszach. Fakturę liczymy **od brutto** — każda pozycja
 * niesie samo `gross_price`, a netto i VAT wylicza inFakt. Dzięki temu suma
 * faktury jest co do grosza kwotą zamówienia, czyli kwotą transakcji
 * w Przelewy24; liczenie od netto potrafi rozjechać sumę o grosz.
 */

const API_KEY = process.env.INFAKT_API_KEY?.trim();
/** Do testów: `https://api.sandbox-infakt.pl/api/v3` z kluczem konta sandbox. */
const API_BASE = (
  process.env.INFAKT_API_URL?.trim() || 'https://api.infakt.pl/api/v3'
).replace(/\/+$/, '');

export const isInfaktConfigured = Boolean(API_KEY);
export const isInfaktSandbox = /sandbox/i.test(API_BASE);

const REQUEST_TIMEOUT_MS = 20_000;
/** Limit API: 100 rekordów na stronę */
const PAGE_SIZE = 100;
const MAX_PAGES = 30;

export class InfaktError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'InfaktError';
  }
}

/** Spłaszcza odpowiedź z błędami walidacji do jednego zdania dla Admina. */
export function describeInfaktErrors(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(describeInfaktErrors).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const nested = record.errors ?? record.invoice_errors ?? record.error ?? record.message;
    if (nested !== undefined) return describeInfaktErrors(nested);
    return Object.entries(record)
      .map(([key, entry]) => `${key}: ${describeInfaktErrors(entry)}`)
      .join('; ');
  }
  return String(value);
}

function errorMessage(status: number, body: unknown): string {
  const details = describeInfaktErrors(body);
  switch (status) {
    case 401:
      return (
        'inFakt odrzucił klucz API. Sprawdź zmienną INFAKT_API_KEY i uprawnienia klucza ' +
        '(api:invoices:read oraz api:invoices:write).'
      );
    case 402:
      return 'Plan konta inFakt nie obejmuje tej operacji albo wyczerpał się limit dokumentów.';
    case 403:
      return 'inFakt odmówił dostępu — plan konta nie obejmuje API albo adres serwera jest zablokowany.';
    case 404:
      return 'Nie znaleziono dokumentu w inFakt.';
    case 422:
      return `inFakt nie przyjął danych${details ? `: ${details}` : '.'}`;
    case 423:
      return `Dokument w inFakt jest zablokowany${details ? `: ${details}` : '.'}`;
    case 429:
    case 503:
      return 'inFakt chwilowo ogranicza liczbę zapytań — spróbuj ponownie za minutę.';
    default:
      return `inFakt odpowiedział błędem ${status}${details ? `: ${details}` : '.'}`;
  }
}

interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

async function send(method: string, path: string, options: RequestOptions, accept: string) {
  if (!API_KEY) {
    throw new InfaktError(
      'Integracja z inFakt nie jest skonfigurowana — brak zmiennej INFAKT_API_KEY.',
      503
    );
  }
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  try {
    return await fetch(url, {
      method,
      headers: {
        'X-inFakt-ApiKey': API_KEY,
        accept,
        ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(`[inFakt] Brak połączenia przy ${method} ${path}:`, error);
    throw new InfaktError('Brak połączenia z inFakt — spróbuj ponownie za chwilę.', 504);
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, options, 'application/json');
  const raw = await res.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw.slice(0, 300);
  }
  if (!res.ok) {
    console.error(`[inFakt] ${method} ${path} → HTTP ${res.status}: ${raw.slice(0, 500)}`);
    throw new InfaktError(errorMessage(res.status, body), res.status, body);
  }
  return body as T;
}

/* ── Kształt danych z API ───────────────────────────────────── */

export interface InfaktKsefData {
  status?: string | null;
  status_description?: string | null;
  ksef_number?: string | null;
}

export interface InfaktInvoice {
  id: number;
  uuid: string;
  number: string;
  kind: string;
  status: string;
  currency: string;
  notes: string | null;
  payment_method: string;
  invoice_date: string;
  sale_date: string;
  payment_date: string | null;
  paid_date: string | null;
  /** Kwoty w groszach */
  net_price: number;
  tax_price: number;
  gross_price: number;
  left_to_pay: number;
  client_company_name: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_tax_code: string | null;
  ksef_data?: InfaktKsefData | null;
  ksef_number?: string | null;
  /** Tylko faktury korygujące */
  corrected_invoice_number?: string | null;
  correction_reason?: string | null;
}

interface InfaktList<T> {
  metainfo?: { count?: number; total_count?: number };
  entities?: T[];
}

interface InfaktTask {
  invoice_task_reference_number?: string;
  processing_code?: number;
  processing_description?: string;
  invoice_uuid?: string;
  invoice_errors?: unknown;
}

export function infaktClientName(invoice: InfaktInvoice): string {
  return (
    invoice.client_company_name?.trim() ||
    `${invoice.client_first_name ?? ''} ${invoice.client_last_name ?? ''}`.trim()
  );
}

/** Migawka faktury zapisywana w zamówieniu. */
export function toOrderInvoice(
  invoice: InfaktInvoice,
  link: Pick<OrderInvoice, 'origin' | 'linkedAt' | 'linkedBy'>
): OrderInvoice {
  return {
    uuid: invoice.uuid,
    number: invoice.number,
    invoiceDate: invoice.invoice_date,
    saleDate: invoice.sale_date || invoice.invoice_date,
    paidDate: invoice.paid_date ?? null,
    status: invoice.status,
    net: fromGrosze(invoice.net_price),
    vat: fromGrosze(invoice.tax_price),
    gross: fromGrosze(invoice.gross_price),
    ksefStatus: invoice.ksef_data?.status ?? null,
    ksefNumber: invoice.ksef_number ?? invoice.ksef_data?.ksef_number ?? null,
    // Pola wymieniamy pojedynczo: przy odświeżaniu `link` to cała poprzednia
    // migawka i rozsmarowana w całości nadpisałaby świeże dane starymi
    origin: link.origin,
    linkedAt: link.linkedAt,
    linkedBy: link.linkedBy,
    syncedAt: new Date().toISOString(),
  };
}

/* ── Wystawianie ────────────────────────────────────────────── */

/**
 * Ciało żądania tworzącego fakturę VAT.
 *
 * Status `paid` albo `printed` (nigdy szkic): faktura od razu wchodzi do
 * księgowości w inFakt. Do KSeF wysyłamy ją osobnym żądaniem, dopiero po
 * sprawdzeniu, że inFakt policzył tę samą kwotę brutto co zamówienie —
 * faktury wysłanej do KSeF nie da się już wycofać, tylko skorygować.
 */
export function invoicePayload(draft: InvoiceDraft): { invoice: Record<string, unknown> } {
  const { buyer } = draft;
  const taxSymbol = String(Math.round(DEFAULT_PRICING.vatRate * 100));

  const invoice: Record<string, unknown> = {
    payment_method: draft.paymentMethod,
    invoice_date: draft.invoiceDate,
    sale_date: draft.saleDate,
    invoice_date_kind: 'sale_date',
    payment_date: draft.dueDate,
    notes: draft.notes,
    client_street: buyer.street,
    client_post_code: buyer.postCode,
    client_city: buyer.city,
    client_country: 'PL',
    // Numer zamówienia jako pole strukturalne — trafia też do XML-a dla KSeF
    transaction_terms: { orders: [{ date: draft.orderDay, number: draft.orderNumber }] },
    services: draft.lines.map((line) => ({
      name: line.name,
      tax_symbol: taxSymbol,
      unit: line.unit,
      quantity: line.quantity,
      gross_price: line.gross,
    })),
  };

  if (buyer.kind === 'company') {
    invoice.client_business_activity_kind = 'other_business';
    invoice.client_company_name = buyer.name;
    if (buyer.nip) invoice.client_tax_code = buyer.nip;
  } else {
    invoice.client_business_activity_kind = 'private_person';
    invoice.client_first_name = buyer.firstName;
    invoice.client_last_name = buyer.lastName;
  }

  if (draft.paid) {
    invoice.status = 'paid';
    // inFakt nie przyjmuje daty opłacenia wcześniejszej niż data wystawienia,
    // a przy przedpłacie wpłata zawsze wyprzedza fakturę. Faktyczny dzień
    // wpłaty i numer transakcji stoją w uwagach faktury i w ewidencji sprzedaży.
    invoice.paid_date = laterDay(draft.paidDay ?? draft.invoiceDate, draft.invoiceDate);
  } else {
    invoice.status = 'printed';
  }

  return { invoice };
}

/** Zleca utworzenie faktury; zwraca numer referencyjny zlecenia. */
export async function createInvoiceTask(draft: InvoiceDraft): Promise<string> {
  const task = await request<InfaktTask>('POST', '/async/invoices.json', {
    body: invoicePayload(draft),
  });
  if (!task?.invoice_task_reference_number) {
    throw new InfaktError('inFakt nie zwrócił numeru zlecenia faktury.', 502, task);
  }
  return task.invoice_task_reference_number;
}

export type InvoiceTaskState =
  | { state: 'pending' }
  | { state: 'done'; uuid: string }
  | { state: 'failed'; message: string };

/** Kody przetwarzania: 100/120/140 — w toku, 201 — utworzona, 422 — odrzucona. */
export async function invoiceTaskState(reference: string): Promise<InvoiceTaskState> {
  const task = await request<InfaktTask>(
    'GET',
    `/async/invoices/status/${encodeURIComponent(reference)}.json`
  );
  const code = task?.processing_code ?? 0;
  if (code === 201 && task.invoice_uuid) return { state: 'done', uuid: task.invoice_uuid };
  if (code >= 400) {
    return {
      state: 'failed',
      message:
        describeInfaktErrors(task.invoice_errors) ||
        task.processing_description ||
        'inFakt odrzucił fakturę.',
    };
  }
  return { state: 'pending' };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Czeka na wynik zlecenia; po upływie czasu oddaje `pending` — zlecenie biegnie dalej. */
export async function waitForInvoiceTask(
  reference: string,
  timeoutMs = 25_000
): Promise<InvoiceTaskState> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const state = await invoiceTaskState(reference);
    if (state.state !== 'pending' || Date.now() >= deadline) return state;
    await sleep(1000);
  }
}

/* ── Odczyt ─────────────────────────────────────────────────── */

export function getInvoice(uuid: string): Promise<InfaktInvoice> {
  return request<InfaktInvoice>('GET', `/invoices/${encodeURIComponent(uuid)}.json`);
}

export async function findInvoiceByNumber(number: string): Promise<InfaktInvoice | null> {
  const list = await request<InfaktList<InfaktInvoice>>('GET', '/invoices.json', {
    query: { 'q[number_eq]': number.trim(), limit: 5 },
  });
  return list?.entities?.find((entry) => entry.number === number.trim()) ?? null;
}

async function listByInvoiceDate(
  resource: 'invoices' | 'corrective_invoices',
  from: string,
  to: string
): Promise<InfaktInvoice[]> {
  const all: InfaktInvoice[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const list = await request<InfaktList<InfaktInvoice>>('GET', `/${resource}.json`, {
      query: {
        'q[invoice_date_gteq]': from,
        'q[invoice_date_lteq]': to,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      },
    });
    const entities = list?.entities ?? [];
    all.push(...entities);
    if (entities.length < PAGE_SIZE) break;
  }
  // Filtr powtarzamy u siebie: gdyby API go pominęło, lista nie może urosnąć po cichu
  return all.filter((entry) => entry.invoice_date >= from && entry.invoice_date <= to);
}

/** Faktury VAT z datą wystawienia w podanym zakresie (bez proform i korekt). */
export function listInvoices(from: string, to: string): Promise<InfaktInvoice[]> {
  return listByInvoiceDate('invoices', from, to);
}

/** Faktury korygujące z datą wystawienia w podanym zakresie. */
export function listCorrectiveInvoices(from: string, to: string): Promise<InfaktInvoice[]> {
  return listByInvoiceDate('corrective_invoices', from, to);
}

export async function nextInvoiceNumber(): Promise<string | null> {
  const res = await request<{ next_number?: string }>('GET', '/invoices/next_number.json', {
    query: { kind: 'vat' },
  });
  return res?.next_number ?? null;
}

/** Czy konto inFakt ma aktywną integrację z KSeF (konfiguruje się ją w aplikacji inFakt). */
export async function isKsefActive(): Promise<boolean> {
  const res = await request<{ active?: boolean }>('GET', '/ksef2/integration.json');
  return Boolean(res?.active);
}

/**
 * PDF faktury (oryginał). Uwaga z dokumentacji: pobranie PDF-a zmienia status
 * szkicu na „Wydrukowana”, więc szkiców nie pobieramy — patrz trasa dokumentów.
 */
export async function downloadInvoicePdf(uuid: string): Promise<Uint8Array> {
  const path = `/invoices/${encodeURIComponent(uuid)}/pdf.json`;
  const res = await send('GET', path, { query: { document_type: 'original', locale: 'pl' } }, '*/*');
  const bytes = new Uint8Array(await res.arrayBuffer());
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (!res.ok || !isPdf) {
    let body: unknown = null;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes.slice(0, 2000)));
    } catch {
      /* odpowiedź nie jest JSON-em */
    }
    console.error(`[inFakt] GET ${path} → HTTP ${res.status}, treść nie jest PDF-em`);
    throw new InfaktError(
      res.ok ? 'inFakt nie zwrócił pliku PDF.' : errorMessage(res.status, body),
      res.ok ? 502 : res.status,
      body
    );
  }
  return bytes;
}

/* ── Akcje na wystawionej fakturze ──────────────────────────── */

/** Wysyła fakturę e-mailem z inFakt; status faktury zmienia się na „Wysłana”. */
export async function deliverInvoiceByEmail(uuid: string, recipient: string): Promise<void> {
  await request('POST', `/invoices/${encodeURIComponent(uuid)}/deliver_via_email.json`, {
    body: { print_type: 'original', locale: 'pl', recipient, send_copy: false },
  });
}

/** Zleca wysyłkę do KSeF. Wynik przychodzi asynchronicznie — w `ksef_data` faktury. */
export async function sendInvoiceToKsef(uuid: string): Promise<InfaktKsefData> {
  const res = await request<InfaktKsefData>(
    'POST',
    `/ksef2/documents/${encodeURIComponent(uuid)}/send.json`
  );
  if (res?.status === 'rejected' || res?.status === 'error') {
    throw new InfaktError(
      res.status_description || 'Faktura nie może zostać wysłana do KSeF.',
      422,
      res
    );
  }
  return res ?? {};
}

/** Oznacza fakturę jako zapłaconą; data nie może wyprzedzać daty wystawienia. */
export async function markInvoicePaid(uuid: string, paidDate: string): Promise<void> {
  const task = await request<InfaktTask>(
    'POST',
    `/async/invoices/${encodeURIComponent(uuid)}/paid.json`,
    { body: { paid_date: paidDate } }
  );
  const reference = task?.invoice_task_reference_number;
  if (!reference) return;

  const deadline = Date.now() + 15_000;
  for (;;) {
    const status = await request<InfaktTask>(
      'GET',
      `/async/invoices/status/${encodeURIComponent(reference)}.json`
    );
    const code = status?.processing_code ?? 0;
    if (code === 200 || code === 201) return;
    if (code >= 400) {
      throw new InfaktError(
        describeInfaktErrors(status.invoice_errors) ||
          status.processing_description ||
          'Nie udało się oznaczyć faktury jako zapłaconej.',
        422,
        status
      );
    }
    // Zlecenie przyjęte — inFakt dokończy je sam, stan wróci przy odświeżeniu
    if (Date.now() >= deadline) return;
    await sleep(1000);
  }
}
