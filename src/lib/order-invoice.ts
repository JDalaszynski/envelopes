import 'server-only';

import {
  buildInvoiceDraft,
  laterDay,
  orderPaidDay,
  toGrosze,
  warsawDay,
} from './accounting';
import {
  InfaktError,
  createInvoiceTask,
  deliverInvoiceByEmail,
  getInvoice,
  findInvoiceByNumber,
  listInvoices,
  markInvoicePaid,
  sendInvoiceToKsef,
  toOrderInvoice,
  waitForInvoiceTask,
  type InfaktInvoice,
  type InvoiceTaskState,
} from './infakt';
import { formatPrice } from './pricing';
import { claimInvoiceTask, findOrderByInvoice, getOrder, updateOrder } from './store';
import type { Order, OrderInvoice } from './types';

/**
 * Faktura zamówienia w inFakt — wystawienie, powiązanie z fakturą już
 * istniejącą i akcje na wystawionej. Każda zmiana zostawia wpis w historii
 * zamówienia, bo to z niej odtwarza się, kto i kiedy wystawił dokument.
 */

/** Statusy KSeF, przy których wysyłka już trwa albo się powiodła */
const KSEF_STARTED = ['pending', 'sent', 'success'];

export interface InvoiceActionResult {
  order: Order;
  message: string;
  /** Rzeczy, które wymagają uwagi mimo powodzenia akcji */
  warnings: string[];
  /** inFakt jeszcze tworzy fakturę — wynik będzie przy następnym sprawdzeniu */
  pending?: boolean;
}

export class InvoiceActionError extends Error {
  constructor(
    message: string,
    readonly status = 409,
    /** Zamówienie po zmianach, jeśli akcja zdążyła coś zapisać */
    readonly order?: Order
  ) {
    super(message);
    this.name = 'InvoiceActionError';
  }
}

async function requireOrder(number: string): Promise<Order> {
  const order = await getOrder(number);
  if (!order) throw new InvoiceActionError('Nie znaleziono zamówienia.', 404);
  return order;
}

/** Zapisuje zmianę razem z wpisem w historii, na świeżo odczytanym zamówieniu. */
async function record(
  number: string,
  by: string,
  action: string,
  detail: string | undefined,
  patch: Partial<Order>
): Promise<Order> {
  const current = await requireOrder(number);
  const updated = await updateOrder(number, {
    ...patch,
    history: [
      ...current.history,
      { at: new Date().toISOString(), by, action, ...(detail ? { detail } : {}) },
    ],
  });
  return updated ?? current;
}

/**
 * Faktura, która już niesie numer tego zamówienia w uwagach. Każda faktura
 * wystawiona z panelu go zawiera, więc to pewny sposób wykrycia dokumentu,
 * który powstał w inFakt, choć odpowiedź do nas nie dotarła.
 */
async function findInvoiceForOrder(order: Order): Promise<InfaktInvoice | null> {
  const from = warsawDay(order.createdAt);
  const to = warsawDay(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const invoices = await listInvoices(from, to);
  return invoices.find((invoice) => invoice.notes?.includes(order.number)) ?? null;
}

async function requestKsef(order: Order, by: string): Promise<Order> {
  const invoice = order.invoice!;
  const result = await sendInvoiceToKsef(invoice.uuid);
  return record(order.number, by, 'Zlecono wysyłkę faktury do KSeF', invoice.number, {
    invoice: { ...invoice, ksefStatus: result.status ?? 'sent', syncedAt: new Date().toISOString() },
  });
}

async function attachInvoice(
  order: Order,
  invoice: InfaktInvoice,
  options: { origin: OrderInvoice['origin']; by: string; sendToKsef?: boolean; note?: string }
): Promise<InvoiceActionResult> {
  /* To samo zlecenie potrafią dokończyć dwa żądania naraz — wystawienie
     i odświeżenie karty w drugiej zakładce. Drugie nie może dopisać faktury
     ponownie ani drugi raz zlecić wysyłki do KSeF. */
  const current = await requireOrder(order.number);
  if (current.invoice?.uuid === invoice.uuid) {
    return {
      order: current,
      message: `Faktura ${invoice.number} jest przypisana do zamówienia.`,
      warnings: [],
    };
  }

  const snapshot = toOrderInvoice(invoice, {
    origin: options.origin,
    linkedAt: new Date().toISOString(),
    linkedBy: options.by,
  });
  const warnings: string[] = [];
  let updated = await record(
    order.number,
    options.by,
    options.origin === 'wystawiona' ? 'Wystawiono fakturę w inFakt' : 'Powiązano fakturę z inFakt',
    `${invoice.number} · ${formatPrice(snapshot.gross)}`,
    { invoice: snapshot, invoiceTask: null }
  );

  const mismatch = invoice.gross_price !== toGrosze(order.totals.gross);
  if (mismatch) {
    warnings.push(
      `Kwota faktury (${formatPrice(snapshot.gross)}) różni się od kwoty zamówienia ` +
        `(${formatPrice(order.totals.gross)}).` +
        (options.sendToKsef ? ' Faktura nie została wysłana do KSeF — najpierw popraw ją w inFakt.' : '')
    );
  }
  if (invoice.status === 'draft') {
    warnings.push('Faktura ma w inFakt status szkicu — zatwierdź ją w inFakt, zanim trafi do klienta.');
  }

  const ksefStarted =
    Boolean(snapshot.ksefNumber) || KSEF_STARTED.includes(snapshot.ksefStatus ?? '');
  if (options.sendToKsef && !mismatch && !ksefStarted) {
    try {
      updated = await requestKsef(updated, options.by);
    } catch (error) {
      warnings.push(
        `Faktura jest wystawiona, ale wysyłka do KSeF nie powiodła się: ${errorText(error)} ` +
          'Ponów ją przyciskiem „Wyślij do KSeF”.'
      );
    }
  }

  return {
    order: updated,
    message:
      options.note ??
      (options.origin === 'wystawiona'
        ? `Wystawiono fakturę ${invoice.number}.`
        : `Powiązano fakturę ${invoice.number} z zamówieniem.`),
    warnings,
  };
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'nieznany błąd.';
}

/**
 * Kończy zlecenie zapisane w zamówieniu: czeka na inFakt i przypisuje fakturę.
 * Przy `timeoutMs = 0` tylko sprawdza stan — tak robi podgląd zamówienia.
 */
export async function resumeInvoiceTask(
  order: Order,
  by: string,
  timeoutMs = 25_000
): Promise<InvoiceActionResult> {
  const task = order.invoiceTask;
  if (!task?.reference) {
    return { order, message: 'Brak zlecenia do dokończenia.', warnings: [] };
  }

  let state: InvoiceTaskState;
  try {
    state = await waitForInvoiceTask(task.reference, timeoutMs);
  } catch (error) {
    if (error instanceof InfaktError && error.status === 404) {
      const updated = await record(order.number, by, 'inFakt nie zna zlecenia faktury', undefined, {
        invoiceTask: null,
      });
      throw new InvoiceActionError(
        'inFakt nie zna już tego zlecenia. Sprawdź w inFakt, czy faktura powstała, i w razie potrzeby wystaw ją ponownie.',
        409,
        updated
      );
    }
    throw error;
  }

  if (state.state === 'pending') {
    return {
      order,
      pending: true,
      message: 'inFakt jeszcze tworzy fakturę — stan odświeży się za chwilę.',
      warnings: [],
    };
  }
  if (state.state === 'failed') {
    const updated = await record(order.number, by, 'inFakt odrzucił fakturę', state.message, {
      invoiceTask: null,
    });
    throw new InvoiceActionError(`inFakt odrzucił fakturę: ${state.message}`, 422, updated);
  }

  const invoice = await getInvoice(state.uuid);
  return attachInvoice(order, invoice, {
    origin: 'wystawiona',
    by: task.by || by,
    sendToKsef: task.sendToKsef,
  });
}

export async function issueInvoice(
  number: string,
  options: { by: string; saleDate?: string | null; sendToKsef?: boolean }
): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (order.invoice) {
    throw new InvoiceActionError(`Zamówienie ma już fakturę ${order.invoice.number}.`);
  }
  // Zlecenie z poprzedniej próby — kończymy je, zamiast zakładać drugie
  if (order.invoiceTask?.reference) return resumeInvoiceTask(order, options.by);

  const draft = buildInvoiceDraft(order, {
    today: warsawDay(new Date()),
    saleDate: options.saleDate,
  });
  if (draft.blockers.length > 0) throw new InvoiceActionError(draft.blockers.join(' '), 422);

  const startedAt = new Date().toISOString();
  const sendToKsef = Boolean(options.sendToKsef);
  const claim = await claimInvoiceTask(number, {
    reference: null,
    startedAt,
    by: options.by,
    sendToKsef,
  });
  if (claim === 'missing') throw new InvoiceActionError('Nie znaleziono zamówienia.', 404);
  if (claim === 'has-invoice') throw new InvoiceActionError('Zamówienie ma już fakturę.');
  if (claim === 'busy') {
    throw new InvoiceActionError(
      'Faktura do tego zamówienia jest właśnie wystawiana — odśwież stronę za chwilę.'
    );
  }

  try {
    const existing = await findInvoiceForOrder(order);
    if (existing) {
      return await attachInvoice(order, existing, {
        origin: 'powiazana',
        by: options.by,
        note: `Faktura ${existing.number} do tego zamówienia istniała już w inFakt — powiązano ją zamiast wystawiać drugą.`,
      });
    }
    const reference = await createInvoiceTask(draft);
    await updateOrder(number, {
      invoiceTask: { reference, startedAt, by: options.by, sendToKsef },
    });
  } catch (error) {
    /* Blokadę zdejmujemy tylko po jednoznacznej odmowie (4xx). Przy braku
       odpowiedzi nie wiadomo, czy inFakt przyjął zlecenie — blokada zostaje
       i wygasa sama, a ponowna próba i tak zaczyna od szukania faktury
       z numerem tego zamówienia. */
    const rejected = error instanceof InfaktError && error.status >= 400 && error.status < 500;
    if (rejected) {
      await updateOrder(number, { invoiceTask: null });
      throw error;
    }
    throw new InvoiceActionError(
      `${errorText(error)} Nie wiadomo, czy faktura powstała — sprawdź w inFakt. ` +
        'Ponowna próba będzie możliwa za 10 minut.',
      504
    );
  }

  return resumeInvoiceTask(await requireOrder(number), options.by);
}

/** Przypisuje do zamówienia fakturę wystawioną wcześniej w inFakt. */
export async function linkInvoice(
  number: string,
  options: { by: string; invoiceNumber?: string; uuid?: string }
): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (order.invoice) {
    throw new InvoiceActionError(`Zamówienie ma już fakturę ${order.invoice.number}.`);
  }
  if (order.invoiceTask?.reference) {
    throw new InvoiceActionError('Faktura do tego zamówienia jest właśnie wystawiana.');
  }

  const wanted = options.invoiceNumber?.trim();
  if (!options.uuid && !wanted) throw new InvoiceActionError('Podaj numer faktury.', 400);
  const invoice = options.uuid ? await getInvoice(options.uuid) : await findInvoiceByNumber(wanted!);
  if (!invoice) {
    throw new InvoiceActionError(`W inFakt nie ma faktury o numerze ${wanted}.`, 404);
  }

  const other = await findOrderByInvoice(invoice.uuid);
  if (other && other.number !== number) {
    throw new InvoiceActionError(
      `Faktura ${invoice.number} jest już powiązana z zamówieniem ${other.number}.`
    );
  }
  return attachInvoice(order, invoice, { origin: 'powiazana', by: options.by });
}

/** Zdejmuje powiązanie. Faktura w inFakt zostaje nietknięta. */
export async function unlinkInvoice(number: string, by: string): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (!order.invoice) throw new InvoiceActionError('Zamówienie nie ma przypisanej faktury.');
  const updated = await record(number, by, 'Odłączono fakturę od zamówienia', order.invoice.number, {
    invoice: null,
  });
  return {
    order: updated,
    message: `Odłączono fakturę ${order.invoice.number}. W inFakt faktura pozostała bez zmian.`,
    warnings: [],
  };
}

const SNAPSHOT_FIELDS: (keyof OrderInvoice)[] = [
  'number',
  'invoiceDate',
  'saleDate',
  'paidDate',
  'status',
  'net',
  'vat',
  'gross',
  'ksefStatus',
  'ksefNumber',
];

/** Migawka faktury po odświeżeniu z inFakt; `null`, gdy nic się nie zmieniło. */
export function refreshedSnapshot(current: OrderInvoice, invoice: InfaktInvoice): OrderInvoice | null {
  const next = toOrderInvoice(invoice, current);
  return SNAPSHOT_FIELDS.some((field) => (next[field] ?? null) !== (current[field] ?? null))
    ? next
    : null;
}

/**
 * Odświeża migawkę faktury. `missing` oznacza, że faktury nie ma już
 * w inFakt (usunięto ją tam) — powiązanie trzeba wtedy zdjąć ręcznie.
 */
export async function refreshInvoice(order: Order): Promise<{ order: Order; missing: boolean }> {
  if (!order.invoice) return { order, missing: false };
  try {
    const next = refreshedSnapshot(order.invoice, await getInvoice(order.invoice.uuid));
    if (!next) return { order, missing: false };
    const updated = await updateOrder(order.number, { invoice: next });
    return { order: updated ?? order, missing: false };
  } catch (error) {
    if (error instanceof InfaktError && error.status === 404) return { order, missing: true };
    throw error;
  }
}

export async function emailInvoice(number: string, by: string): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (!order.invoice) throw new InvoiceActionError('Zamówienie nie ma przypisanej faktury.');
  const recipient = order.customer.email?.trim();
  if (!recipient) throw new InvoiceActionError('Zamówienie nie ma adresu e-mail klienta.', 422);

  await deliverInvoiceByEmail(order.invoice.uuid, recipient);
  const updated = await record(
    number,
    by,
    'Wysłano fakturę e-mailem z inFakt',
    `${order.invoice.number} → ${recipient}`,
    {}
  );
  const refreshed = await refreshInvoice(updated).catch(() => ({ order: updated }));
  return {
    order: refreshed.order,
    message: `inFakt wysyła fakturę ${order.invoice.number} na adres ${recipient}.`,
    warnings: [],
  };
}

export async function ksefInvoice(number: string, by: string): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (!order.invoice) throw new InvoiceActionError('Zamówienie nie ma przypisanej faktury.');
  if (order.invoice.ksefNumber) {
    throw new InvoiceActionError(`Faktura ma już numer KSeF ${order.invoice.ksefNumber}.`);
  }
  // Stan bierzemy prosto z inFakt — migawka w zamówieniu mogła się zestarzeć
  const current = await getInvoice(order.invoice.uuid);
  const ksef = current.ksef_data?.status ?? '';
  if (current.ksef_number || KSEF_STARTED.includes(ksef)) {
    await refreshInvoice(order);
    throw new InvoiceActionError('Ta faktura została już wysłana do KSeF.');
  }
  if (current.gross_price !== toGrosze(order.totals.gross)) {
    throw new InvoiceActionError(
      'Kwota faktury różni się od kwoty zamówienia — popraw fakturę w inFakt przed wysyłką do KSeF.'
    );
  }
  const updated = await requestKsef(order, by);
  return {
    order: updated,
    message: 'Zlecono wysyłkę do KSeF. Numer KSeF pojawi się po przetworzeniu — odśwież dane faktury.',
    warnings: [],
  };
}

/** Oznacza fakturę jako zapłaconą w inFakt, gdy zamówienie zostało opłacone po jej wystawieniu. */
export async function payInvoice(number: string, by: string): Promise<InvoiceActionResult> {
  const order = await requireOrder(number);
  if (!order.invoice) throw new InvoiceActionError('Zamówienie nie ma przypisanej faktury.');
  if (order.paymentStatus !== 'oplacone') {
    throw new InvoiceActionError('Najpierw oznacz zamówienie jako opłacone.');
  }
  const paidDate = laterDay(
    orderPaidDay(order) ?? warsawDay(new Date()),
    order.invoice.invoiceDate
  );
  await markInvoicePaid(order.invoice.uuid, paidDate);
  const updated = await record(
    number,
    by,
    'Oznaczono fakturę jako zapłaconą w inFakt',
    order.invoice.number,
    {}
  );
  const refreshed = await refreshInvoice(updated).catch(() => ({ order: updated }));
  return {
    order: refreshed.order,
    message: `Faktura ${order.invoice.number} została oznaczona w inFakt jako zapłacona.`,
    warnings: [],
  };
}
