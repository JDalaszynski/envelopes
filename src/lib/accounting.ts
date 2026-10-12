import { isDeferredInvoice, isGatewayPayment } from './orders';
import type { DeliveryMethod, Order } from './types';

/**
 * Reguły księgowe zamówienia wspólne dla faktury w inFakt i ewidencji
 * sprzedaży: dni kalendarzowe w czasie polskim, kwoty w groszach, nazwy
 * pozycji na fakturze i projekt faktury pokazywany Adminowi przed wysłaniem.
 *
 * Moduł jest czysty — nie dotyka sieci ani bazy — więc te same reguły liczą
 * podgląd w przeglądarce i dokument wysyłany z serwera.
 */

/* ── Dni i kwoty ────────────────────────────────────────────── */

const WARSAW = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function warsawParts(value: Date | string): Record<string, string> | null {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(WARSAW.formatToParts(date).map((part) => [part.type, part.value]));
}

/**
 * Dzień kalendarzowy w Polsce, RRRR-MM-DD. Serwer na Vercelu liczy w UTC,
 * a wpłata z 23:30 UTC ostatniego dnia miesiąca należy w ewidencji już do
 * następnego — dlatego żadna data księgowa nie powstaje z `toISOString()`.
 */
export function warsawDay(value: Date | string): string {
  const parts = warsawParts(value);
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : '';
}

export function warsawTime(value: Date | string): string {
  const parts = warsawParts(value);
  return parts ? `${parts.hour}:${parts.minute}` : '';
}

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDay(day: string): boolean {
  if (!DAY_PATTERN.test(day)) return false;
  const date = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day;
}

/** RRRR-MM-DD → DD.MM.RRRR, czyli zapis z faktur i wyciągów. */
export function formatDay(day: string | null | undefined): string {
  if (!day || !DAY_PATTERN.test(day)) return '—';
  const [year, month, date] = day.split('-');
  return `${date}.${month}.${year}`;
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Ostatni dzień na wystawienie faktury — 15. dzień miesiąca następującego po
 * miesiącu sprzedaży albo otrzymania zapłaty (art. 106i ustawy o VAT).
 */
export function invoiceDeadline(saleDay: string): string {
  const [year, month] = saleDay.split('-').map(Number);
  // Miesiące w `Date.UTC` liczą się od zera, więc numer miesiąca wskazuje już następny
  return new Date(Date.UTC(year, month, 15)).toISOString().slice(0, 10);
}

export function laterDay(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Kwoty w zamówieniu są w złotych, inFakt i Przelewy24 liczą w groszach. */
export function toGrosze(value: number): number {
  return Math.round(value * 100);
}

export function fromGrosze(value: number): number {
  return Math.round(value) / 100;
}

/* ── Nabywca ────────────────────────────────────────────────── */

export function buyerName(order: Order): string {
  const { customer } = order;
  return customer.isCompany && customer.firma?.trim()
    ? customer.firma.trim()
    : `${customer.imie} ${customer.nazwisko}`.trim();
}

/** NIP bez prefiksu kraju, spacji i myślników. */
export function normalizeNip(value: string | null | undefined): string {
  return (value ?? '').replace(/^\s*PL/i, '').replace(/\D/g, '');
}

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

export function isValidNip(value: string | null | undefined): boolean {
  const nip = normalizeNip(value);
  if (nip.length !== 10) return false;
  const sum = NIP_WEIGHTS.reduce((acc, weight, index) => acc + weight * Number(nip[index]), 0);
  return sum % 11 === Number(nip[9]);
}

/* ── Zapłata ────────────────────────────────────────────────── */

const PAID_ACTIONS = ['Płatność potwierdzona', 'Oznaczono jako opłacone'];

/**
 * Chwila potwierdzenia wpłaty. Zamówienia sprzed ewidencji sprzedaży nie mają
 * pola `paidAt`, ale każde potwierdzenie zostawiło wpis w historii zmian.
 */
export function orderPaidAt(order: Order): string | null {
  if (order.paymentStatus !== 'oplacone') return null;
  if (order.paidAt) return order.paidAt;
  const entry = [...order.history]
    .reverse()
    .find((item) => PAID_ACTIONS.some((action) => item.action.startsWith(action)));
  return entry?.at ?? null;
}

/**
 * Dzień zapłaty. Przy bramce rozstrzyga data z Przelewy24 — to ona stoi na
 * zestawieniu wypłat; ręczne „Oznacz jako opłacone” bywa klikane dzień później.
 */
export function orderPaidDay(order: Order): string | null {
  if (order.paymentStatus !== 'oplacone') return null;
  if (order.p24?.paidDay && order.p24.status >= 1) return order.p24.paidDay;
  const paidAt = orderPaidAt(order);
  return paidAt ? warsawDay(paidAt) || null : null;
}

/**
 * Numer transakcji w Przelewy24. `p24Reference` do chwili notyfikacji niesie
 * token rejestracji, a nie numer transakcji — numerem są same cyfry.
 */
export function p24TransactionNumber(order: Order): string | null {
  if (order.p24?.orderId) return String(order.p24.orderId);
  return order.p24Reference && /^\d+$/.test(order.p24Reference) ? order.p24Reference : null;
}

/* ── Pozycje faktury ────────────────────────────────────────── */

export interface InvoiceLine {
  name: string;
  quantity: number;
  unit: string;
  /** Wartość brutto pozycji w groszach */
  gross: number;
}

export const DELIVERY_LINE_NAME: Record<DeliveryMethod, string> = {
  kurier: 'Dostawa kurierem',
  paczkomat: 'Dostawa do Paczkomatu InPost',
};

/**
 * Pozycje faktury — te same i w tej samej kolejności co w zamówieniu, a na
 * końcu dostawa. Nazwa pozycji to ustandaryzowana nazwa produktu z zamówienia
 * (`buildProductName`), bez żadnych dopisków: kontrolujący ma zobaczyć na
 * fakturze dokładnie to, co w zamówieniu i w potwierdzeniu dla klienta.
 *
 * Dopłata ekspresowa nie ma własnej pozycji, bo zamówienie nalicza ją w cenie
 * sztuki; wartość pozycji to ilość × cena jednostkowa z zamówienia.
 */
export function invoiceLines(order: Order): InvoiceLine[] {
  const lines: InvoiceLine[] = order.items.map((item) => ({
    name: item.name,
    quantity: item.price.quantity,
    unit: 'szt.',
    gross: toGrosze(item.price.gross),
  }));
  if (order.totals.deliveryGross > 0) {
    lines.push({
      name: DELIVERY_LINE_NAME[order.delivery.method] ?? 'Dostawa',
      quantity: 1,
      unit: 'usł.',
      gross: toGrosze(order.totals.deliveryGross),
    });
  }
  return lines;
}

/* ── Projekt faktury ────────────────────────────────────────── */

export interface InvoiceBuyer {
  kind: 'company' | 'person';
  name: string;
  firstName: string;
  lastName: string;
  nip: string;
  street: string;
  postCode: string;
  city: string;
  email: string;
}

export interface InvoiceDraft {
  orderNumber: string;
  /** Dzień złożenia zamówienia */
  orderDay: string;
  buyer: InvoiceBuyer;
  lines: InvoiceLine[];
  /** Razem brutto w groszach */
  gross: number;
  invoiceDate: string;
  saleDate: string;
  /** Termin zapłaty */
  dueDate: string;
  paid: boolean;
  /** Faktyczny dzień zapłaty */
  paidDay: string | null;
  paymentMethod: 'przelewy24' | 'transfer';
  notes: string;
  /** Braki, przez które faktury nie wolno wystawić */
  blockers: string[];
  /** Rzeczy do sprawdzenia przed wystawieniem — nie blokują */
  warnings: string[];
}

function formatZl(grosze: number): string {
  return `${(grosze / 100).toFixed(2).replace('.', ',')} zł`;
}

function invoiceNotes(order: Order, paidDay: string | null): string {
  const parts = [
    `Zamówienie nr ${order.number} z ${formatDay(warsawDay(order.createdAt))} (envelopes.pl).`,
  ];
  if (isGatewayPayment(order.paymentMethod)) {
    const transaction = p24TransactionNumber(order);
    parts.push(
      [
        'Płatność: Przelewy24',
        transaction ? `transakcja nr ${transaction}` : '',
        paidDay ? `zapłacono ${formatDay(paidDay)}` : '',
      ]
        .filter(Boolean)
        .join(', ') + '.'
    );
  } else if (paidDay) {
    parts.push(`Płatność: przelew, zapłacono ${formatDay(paidDay)}.`);
  } else {
    parts.push(`Płatność: przelew, w tytule prosimy podać ${order.number}.`);
  }
  return parts.join(' ');
}

/**
 * Projekt faktury do zamówienia. Datą wystawienia jest zawsze dzień bieżący;
 * datę sprzedaży Admin może zmienić przed wystawieniem — domyślnie to dzień
 * zapłaty, bo przy przedpłacie właśnie wtedy powstaje obowiązek podatkowy.
 */
export function buildInvoiceDraft(
  order: Order,
  options: { today: string; saleDate?: string | null }
): InvoiceDraft {
  const { customer } = order;
  const blockers: string[] = [];
  const warnings: string[] = [];

  const paid = order.paymentStatus === 'oplacone';
  const paidDay = orderPaidDay(order);
  const invoiceDate = options.today;
  const saleDate = options.saleDate?.trim() || (paid && paidDay ? paidDay : invoiceDate);

  if (!isValidDay(saleDate)) blockers.push('Data sprzedaży ma nieprawidłowy format.');
  else if (saleDate > addDays(invoiceDate, 60)) {
    blockers.push('Data sprzedaży wypada później niż 60 dni po dacie wystawienia.');
  }

  const company = Boolean(customer.isCompany);
  const nip = company ? normalizeNip(customer.nip) : '';
  const buyer: InvoiceBuyer = {
    kind: company ? 'company' : 'person',
    name: buyerName(order),
    firstName: customer.imie?.trim() ?? '',
    lastName: customer.nazwisko?.trim() ?? '',
    nip,
    street: customer.ulica?.trim() ?? '',
    postCode: customer.kodPocztowy?.trim() ?? '',
    city: customer.miasto?.trim() ?? '',
    email: customer.email?.trim() ?? '',
  };

  if (company && !customer.firma?.trim()) blockers.push('Brak nazwy firmy nabywcy.');
  if (!company && (!buyer.firstName || !buyer.lastName)) {
    blockers.push('Brak imienia lub nazwiska nabywcy.');
  }
  if (!buyer.street || !buyer.postCode || !buyer.city) {
    blockers.push('Niepełny adres nabywcy — uzupełnij ulicę, kod pocztowy i miejscowość.');
  }
  if (company && !nip) {
    warnings.push('Nabywca jest firmą, ale zamówienie nie ma numeru NIP — faktura wyjdzie bez NIP.');
  } else if (company && !isValidNip(nip)) {
    warnings.push(`NIP nabywcy (${nip}) nie przechodzi kontroli poprawności — sprawdź go przed wystawieniem.`);
  }

  const lines = invoiceLines(order);
  const gross = lines.reduce((sum, line) => sum + line.gross, 0);
  const orderGross = toGrosze(order.totals.gross);
  if (lines.length === 0 || gross <= 0) blockers.push('Zamówienie nie ma pozycji do zafakturowania.');
  if (gross !== orderGross) {
    blockers.push(
      `Suma pozycji (${formatZl(gross)}) różni się od kwoty zamówienia (${formatZl(orderGross)}) — ` +
        'faktura nie zgadzałaby się z wpłatą.'
    );
  }

  let dueDate = invoiceDate;
  if (!paid) {
    if (isDeferredInvoice(order.paymentMethod) && order.paymentDueDate) {
      dueDate = laterDay(warsawDay(order.paymentDueDate) || invoiceDate, invoiceDate);
    } else {
      dueDate = addDays(invoiceDate, 7);
      warnings.push(
        'Zamówienie nie jest opłacone — faktura zostanie wystawiona jako nieopłacona, z terminem 7 dni.'
      );
    }
  } else if (!paidDay) {
    warnings.push('Zamówienie jest opłacone, ale nie udało się ustalić dnia wpłaty.');
  }

  const gateway = isGatewayPayment(order.paymentMethod);
  if (gateway && paid && !p24TransactionNumber(order)) {
    warnings.push(
      'Brak numeru transakcji Przelewy24 przy tym zamówieniu — faktura nie będzie go zawierać w uwagach.'
    );
  }

  return {
    orderNumber: order.number,
    orderDay: warsawDay(order.createdAt),
    buyer,
    lines,
    gross,
    invoiceDate,
    saleDate,
    dueDate,
    paid,
    paidDay,
    paymentMethod: gateway ? 'przelewy24' : 'transfer',
    notes: invoiceNotes(order, paid ? paidDay : null),
    blockers,
    warnings,
  };
}

/** Odpowiedź `GET /api/orders/[numer]/faktura` — stan faktury w panelu Admina. */
export interface InvoiceStatusResponse {
  configured: boolean;
  /** Klucz należy do konta testowego inFakt (sandbox) */
  sandbox: boolean;
  order: Order;
  /** Projekt faktury — tylko gdy zamówienie jej jeszcze nie ma */
  draft: InvoiceDraft | null;
  /** `null`, gdy nie udało się sprawdzić */
  ksefActive: boolean | null;
  /** Numer, który inFakt nada następnej fakturze — orientacyjnie */
  nextNumber: string | null;
  /** Przypisanej faktury nie ma już w inFakt */
  invoiceMissing: boolean;
  /** inFakt jeszcze tworzy fakturę */
  pending: boolean;
  error: string | null;
}
