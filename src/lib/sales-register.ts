import {
  addDays,
  buyerName,
  formatDay,
  invoiceDeadline,
  invoiceLines,
  normalizeNip,
  orderPaidDay,
  p24TransactionNumber,
  toGrosze,
  warsawDay,
  type InvoiceLine,
} from './accounting';
import { ORDER_NUMBER_PATTERN, isDeferredInvoice, isGatewayPayment } from './orders';
import type { Order, OrderInvoice, PaymentMethod } from './types';

/**
 * Ewidencja sprzedaży — miesięczne zestawienie, które wiąże trzy niezależne
 * zapisy tej samej sprzedaży: zamówienie w sklepie, fakturę w inFakt
 * i transakcję w Przelewy24. Każdy wiersz to jedna sprzedaż; obok niej stoją
 * kontrole zgodności, a pod tabelą wszystko, czego nie udało się powiązać.
 *
 * **Do którego miesiąca należy sprzedaż:** rozstrzyga data sprzedaży
 * z faktury. Dopóki faktury nie ma, opłacone zamówienie stoi w miesiącu
 * wpłaty — z błędem „brak faktury”, żeby nie zniknęło z pola widzenia.
 * Zamówienia nieopłacone i bez faktury sprzedażą jeszcze nie są: mają osobną
 * listę i nie wchodzą do sum.
 *
 * Moduł jest czysty: dostaje zamówienia i faktury, oddaje gotowe zestawienie.
 * Pobieraniem danych z inFakt i Przelewy24 zajmuje się trasa `/api/ewidencja`.
 */

export type CheckLevel = 'blad' | 'uwaga';

export interface RegisterCheck {
  code: string;
  level: CheckLevel;
  message: string;
}

export interface RegisterPayment {
  method: PaymentMethod;
  label: string;
  gateway: boolean;
  paid: boolean;
  paidDay: string | null;
  /** Termin zapłaty przy sprzedaży jeszcze nieopłaconej */
  dueDay: string | null;
  /** Numer transakcji w Przelewy24 */
  transaction: string | null;
  /** Status wg bramki: 0 brak wpłaty, 1 przedpłata, 2 dokonana, 3 zwrócona */
  p24Status: number | null;
  /** Kwota wg bramki, w złotych */
  p24Amount: number | null;
  statement: string | null;
  batchId: number | null;
  /** Transakcję potwierdzono odczytem z Przelewy24, a nie samym zapisem sklepu */
  verified: boolean;
}

export interface RegisterRow {
  lp: number;
  /** Dzień, wg którego sprzedaż należy do miesiąca */
  day: string;
  basis: 'faktura' | 'zaplata';
  orderNumber: string;
  orderDay: string;
  buyer: { name: string; nip: string; address: string; email: string };
  lines: InvoiceLine[];
  /** Kwoty wg faktury, a przed jej wystawieniem wg zamówienia — w złotych */
  net: number;
  vat: number;
  gross: number;
  orderGross: number;
  invoice: OrderInvoice | null;
  payment: RegisterPayment;
  checks: RegisterCheck[];
}

export interface UnlinkedInvoice {
  uuid: string;
  number: string;
  invoiceDate: string;
  saleDate: string;
  client: string;
  nip: string;
  net: number;
  vat: number;
  gross: number;
  status: string;
  /** Zamówienie, do którego faktura najpewniej należy */
  suggestion: { orderNumber: string; basis: string } | null;
}

export interface RegisterCorrection {
  number: string;
  invoiceDate: string;
  correctedNumber: string;
  /** Zamówienie, którego fakturę skorygowano */
  orderNumber: string | null;
  client: string;
  reason: string;
  /** Różnica wynikająca z korekty, w złotych */
  net: number;
  vat: number;
  gross: number;
}

export interface PendingOrder {
  orderNumber: string;
  orderDay: string;
  buyer: string;
  gross: number;
  label: string;
}

export interface Amounts {
  count: number;
  net: number;
  vat: number;
  gross: number;
}

export type SourceState = 'ok' | 'brak-konfiguracji' | 'blad';

export interface RegisterSources {
  infakt: { state: SourceState; detail?: string; sandbox?: boolean };
  p24: { state: SourceState; detail?: string };
}

export interface SalesRegister {
  /** RRRR-MM */
  month: string;
  generatedAt: string;
  rows: RegisterRow[];
  totals: {
    sales: Amounts;
    invoiced: Amounts;
    uninvoiced: Amounts;
    corrections: Amounts;
    /** Sprzedaż po uwzględnieniu korekt */
    afterCorrections: Amounts;
    /** Wpłaty z miesiąca wg sposobu zapłaty — brutto */
    paidGateway: { count: number; gross: number };
    paidTransfer: { count: number; gross: number };
    unpaid: { count: number; gross: number };
  };
  unlinkedInvoices: UnlinkedInvoice[];
  corrections: RegisterCorrection[];
  pendingOrders: PendingOrder[];
  issues: { errors: number; warnings: number };
  sources: RegisterSources;
}

/** Faktura w kształcie z API inFakt — tyle pól, ile potrzebuje ewidencja. */
export interface SourceInvoice {
  uuid: string;
  number: string;
  status: string;
  notes: string | null;
  invoice_date: string;
  sale_date: string;
  net_price: number;
  tax_price: number;
  gross_price: number;
  client_company_name: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_tax_code: string | null;
  corrected_invoice_number?: string | null;
  correction_reason?: string | null;
}

export interface RegisterInput {
  month: string;
  /** Wszystkie zamówienia sklepu, z odświeżonymi migawkami faktur i transakcji */
  orders: Order[];
  /** Faktury VAT z inFakt z szerokiego okna dat; `null`, gdy inFakt był niedostępny */
  invoices: SourceInvoice[] | null;
  corrections: SourceInvoice[] | null;
  /** Zamówienia, dla których Przelewy24 nie zna transakcji */
  p24Unknown: ReadonlySet<string>;
  /** Zamówienia, których faktury nie ma już w inFakt */
  invoiceMissing: ReadonlySet<string>;
  ksefActive: boolean | null;
  sources: RegisterSources;
  generatedAt: string;
}

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const MONTH_NAMES = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

/** `2026-10` → „październik 2026”. */
export function monthLabel(month: string): string {
  const [year, index] = month.split('-');
  return `${MONTH_NAMES[Number(index) - 1] ?? index} ${year}`;
}

export function monthBounds(month: string): { from: string; to: string } {
  const [year, index] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

export const PAYMENT_SHORT_LABEL: Record<PaymentMethod, string> = {
  p24: 'Przelewy24',
  blik: 'BLIK (Przelewy24)',
  przelew: 'Przelew',
  faktura_odroczona: 'Przelew, termin odroczony',
};

export const P24_STATUS_LABEL: Record<number, string> = {
  0: 'brak wpłaty',
  1: 'przedpłata, niezweryfikowana',
  2: 'dokonana',
  3: 'zwrócona',
};

/** Statusy KSeF, przy których faktura jest w drodze albo już przyjęta. */
const KSEF_IN_PROGRESS = ['pending', 'sent', 'success'];

function zl(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} zł`;
}

function sourceClient(invoice: SourceInvoice): string {
  return (
    invoice.client_company_name?.trim() ||
    `${invoice.client_first_name ?? ''} ${invoice.client_last_name ?? ''}`.trim()
  );
}

/** Nazwa do porównań: bez wielkości liter, znaków przestankowych i spacji. */
function nameKey(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function paymentOf(order: Order): RegisterPayment {
  const gateway = isGatewayPayment(order.paymentMethod);
  const paid = order.paymentStatus === 'oplacone';
  const snapshot = gateway ? (order.p24 ?? null) : null;
  return {
    method: order.paymentMethod,
    label: PAYMENT_SHORT_LABEL[order.paymentMethod],
    gateway,
    paid,
    paidDay: orderPaidDay(order),
    dueDay: !paid && order.paymentDueDate ? warsawDay(order.paymentDueDate) || null : null,
    transaction: gateway ? p24TransactionNumber(order) : null,
    p24Status: snapshot ? snapshot.status : null,
    p24Amount: snapshot ? snapshot.amount / 100 : null,
    statement: snapshot?.statement ?? null,
    batchId: snapshot?.batchId ?? null,
    verified: snapshot?.source === 'api',
  };
}

function checksFor(order: Order, payment: RegisterPayment, input: RegisterInput): RegisterCheck[] {
  const checks: RegisterCheck[] = [];
  const add = (level: CheckLevel, code: string, message: string) =>
    checks.push({ level, code, message });

  const invoice = order.invoice ?? null;
  const orderGross = toGrosze(order.totals.gross);

  if (!invoice) {
    if (order.invoiceTask) add('uwaga', 'faktura-w-toku', 'Faktura jest w trakcie wystawiania w inFakt.');
    else {
      add(
        'blad',
        'brak-faktury',
        payment.paidDay
          ? `Opłacone zamówienie nie ma faktury — termin wystawienia: ${formatDay(invoiceDeadline(payment.paidDay))}.`
          : 'Opłacone zamówienie nie ma faktury.'
      );
    }
  } else {
    if (invoice.invoiceDate > invoiceDeadline(invoice.saleDate)) {
      add(
        'uwaga',
        'faktura-po-terminie',
        'Faktura wystawiona po 15. dniu miesiąca następującego po miesiącu sprzedaży.'
      );
    }
    if (input.invoiceMissing.has(order.number)) {
      add('blad', 'faktura-usunieta', `Faktury ${invoice.number} nie ma już w inFakt.`);
    }
    if (toGrosze(invoice.gross) !== orderGross) {
      add(
        'blad',
        'kwota-faktury',
        `Faktura na ${zl(invoice.gross)}, zamówienie na ${zl(order.totals.gross)}.`
      );
    }
    if (invoice.status === 'draft') {
      add('uwaga', 'faktura-szkic', 'Faktura ma w inFakt status szkicu.');
    }
    if (invoice.ksefStatus === 'error' || invoice.ksefStatus === 'rejected') {
      add('blad', 'ksef-blad', 'KSeF odrzucił fakturę — szczegóły w inFakt.');
    } else if (
      input.ksefActive &&
      normalizeNip(order.customer.nip) &&
      !invoice.ksefNumber &&
      !KSEF_IN_PROGRESS.includes(invoice.ksefStatus ?? '')
    ) {
      add('uwaga', 'ksef-brak', 'Faktura na firmę nie została wysłana do KSeF.');
    }

    if (!payment.paid) {
      add(
        'uwaga',
        'nieoplacone',
        isDeferredInvoice(order.paymentMethod) && payment.dueDay
          ? `Faktura wystawiona, wpłata jeszcze nie wpłynęła (termin ${formatDay(payment.dueDay)}).`
          : 'Faktura wystawiona, zamówienie czeka na wpłatę.'
      );
    } else {
      if (invoice.status !== 'paid' && !invoice.paidDate) {
        add('uwaga', 'infakt-nieoplacona', 'W inFakt faktura nie jest oznaczona jako zapłacona.');
      }
      if (payment.paidDay && payment.paidDay.slice(0, 7) !== invoice.saleDate.slice(0, 7)) {
        add(
          'uwaga',
          'okres',
          `Wpłata (${formatDay(payment.paidDay)}) i data sprzedaży na fakturze ` +
            `(${formatDay(invoice.saleDate)}) wypadają w różnych miesiącach.`
        );
      }
    }
  }

  if (payment.gateway && payment.paid) {
    if (order.p24Reference?.startsWith('SYMULACJA')) {
      add('uwaga', 'p24-symulacja', 'Płatność zasymulowana — tryb bez kluczy bramki.');
    } else if (input.p24Unknown.has(order.number)) {
      add('blad', 'p24-brak', 'Przelewy24 nie zna transakcji dla tego zamówienia.');
    } else if (payment.p24Status === null) {
      if (input.sources.p24.state === 'ok') {
        add('uwaga', 'p24-niesprawdzona', 'Nie udało się potwierdzić transakcji w Przelewy24.');
      }
    } else {
      if (payment.p24Status === 0) {
        add('blad', 'p24-brak-wplaty', 'Wg Przelewy24 do tej transakcji nie ma wpłaty.');
      } else if (payment.p24Status === 1) {
        add(
          'uwaga',
          'p24-niezweryfikowana',
          'W Przelewy24 wpłata ma status przedpłaty — transakcja nie została zweryfikowana.'
        );
      } else if (payment.p24Status === 3) {
        add('uwaga', 'p24-zwrot', 'Wpłata została zwrócona w Przelewy24.');
      }
      if (payment.p24Amount !== null && toGrosze(payment.p24Amount) !== orderGross) {
        add(
          'blad',
          'p24-kwota',
          `Przelewy24: ${zl(payment.p24Amount)}, zamówienie: ${zl(order.totals.gross)}.`
        );
      }
    }
  }

  return checks;
}

/** Sumuje w groszach — dodawanie złotówek jako ułamków gubi grosze. */
function sum(rows: { net: number; vat: number; gross: number }[]): Amounts {
  const total = { net: 0, vat: 0, gross: 0 };
  for (const row of rows) {
    total.net += toGrosze(row.net);
    total.vat += toGrosze(row.vat);
    total.gross += toGrosze(row.gross);
  }
  return {
    count: rows.length,
    net: total.net / 100,
    vat: total.vat / 100,
    gross: total.gross / 100,
  };
}

function compareNumbers(a: string, b: string): number {
  return a.localeCompare(b, 'pl', { numeric: true });
}

/** Zamówienie, do którego należy niepowiązana faktura — tylko gdy wskazanie jest jednoznaczne. */
function suggestOrder(
  invoice: SourceInvoice,
  candidates: Order[],
  taken: Set<string>
): UnlinkedInvoice['suggestion'] {
  const free = candidates.filter((order) => !taken.has(order.number));

  const mentioned = invoice.notes?.match(/ENV-\d{8}-[A-Z0-9]{4}/g) ?? [];
  for (const number of mentioned) {
    if (ORDER_NUMBER_PATTERN.test(number) && free.some((order) => order.number === number)) {
      return { orderNumber: number, basis: 'numer zamówienia w uwagach faktury' };
    }
  }

  const nip = normalizeNip(invoice.client_tax_code);
  const client = nameKey(sourceClient(invoice));
  const matches = free.filter((order) => {
    if (toGrosze(order.totals.gross) !== invoice.gross_price) return false;
    const orderDay = warsawDay(order.createdAt);
    if (orderDay > invoice.invoice_date || addDays(orderDay, 62) < invoice.invoice_date) return false;
    const orderNip = normalizeNip(order.customer.nip);
    if (nip && orderNip) return nip === orderNip;
    const person = nameKey(`${order.customer.imie} ${order.customer.nazwisko}`);
    return Boolean(client) && (client === nameKey(buyerName(order)) || client === person);
  });
  return matches.length === 1
    ? { orderNumber: matches[0].number, basis: 'ta sama kwota i ten sam nabywca' }
    : null;
}

export function buildSalesRegister(input: RegisterInput): SalesRegister {
  const { month } = input;
  const inMonth = (day: string | null | undefined) => Boolean(day && day.startsWith(month));

  const rows: RegisterRow[] = [];
  const pendingOrders: PendingOrder[] = [];

  for (const order of input.orders) {
    const invoice = order.invoice ?? null;
    const payment = paymentOf(order);
    const day = invoice ? invoice.saleDate : payment.paid ? payment.paidDay : null;

    if (!day) {
      const orderDay = warsawDay(order.createdAt);
      if (!invoice && !payment.paid && inMonth(orderDay)) {
        pendingOrders.push({
          orderNumber: order.number,
          orderDay,
          buyer: buyerName(order),
          gross: order.totals.gross,
          label: payment.label,
        });
      }
      continue;
    }
    if (!inMonth(day)) continue;

    const { customer } = order;
    rows.push({
      lp: 0,
      day,
      basis: invoice ? 'faktura' : 'zaplata',
      orderNumber: order.number,
      orderDay: warsawDay(order.createdAt),
      buyer: {
        name: buyerName(order),
        nip: customer.isCompany ? normalizeNip(customer.nip) : '',
        address: `${customer.ulica}, ${customer.kodPocztowy} ${customer.miasto}`.trim(),
        email: customer.email,
      },
      lines: invoiceLines(order),
      net: invoice ? invoice.net : order.totals.net,
      vat: invoice ? invoice.vat : order.totals.vat,
      gross: invoice ? invoice.gross : order.totals.gross,
      orderGross: order.totals.gross,
      invoice,
      payment,
      checks: checksFor(order, payment, input),
    });
  }

  rows.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      compareNumbers(a.invoice?.number ?? '', b.invoice?.number ?? '') ||
      a.orderNumber.localeCompare(b.orderNumber)
  );
  rows.forEach((row, index) => {
    row.lp = index + 1;
  });
  pendingOrders.sort((a, b) => a.orderDay.localeCompare(b.orderDay));

  /* Faktury z inFakt, których nie przypisano do żadnego zamówienia */
  const linked = new Set(
    input.orders.map((order) => order.invoice?.uuid).filter((uuid): uuid is string => Boolean(uuid))
  );
  const withoutInvoice = input.orders.filter((order) => !order.invoice);
  const taken = new Set<string>();
  const unlinkedInvoices: UnlinkedInvoice[] = (input.invoices ?? [])
    .filter((invoice) => !linked.has(invoice.uuid) && inMonth(invoice.sale_date || invoice.invoice_date))
    .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date) || compareNumbers(a.number, b.number))
    .map((invoice) => {
      const suggestion = suggestOrder(invoice, withoutInvoice, taken);
      if (suggestion) taken.add(suggestion.orderNumber);
      return {
        uuid: invoice.uuid,
        number: invoice.number,
        invoiceDate: invoice.invoice_date,
        saleDate: invoice.sale_date || invoice.invoice_date,
        client: sourceClient(invoice),
        nip: normalizeNip(invoice.client_tax_code),
        net: invoice.net_price / 100,
        vat: invoice.tax_price / 100,
        gross: invoice.gross_price / 100,
        status: invoice.status,
        suggestion,
      };
    });

  const byInvoiceNumber = new Map(
    input.orders
      .filter((order) => order.invoice)
      .map((order) => [order.invoice!.number, order.number] as const)
  );
  const corrections: RegisterCorrection[] = (input.corrections ?? [])
    .filter((correction) => inMonth(correction.invoice_date))
    .sort((a, b) => a.invoice_date.localeCompare(b.invoice_date) || compareNumbers(a.number, b.number))
    .map((correction) => ({
      number: correction.number,
      invoiceDate: correction.invoice_date,
      correctedNumber: correction.corrected_invoice_number ?? '',
      orderNumber: byInvoiceNumber.get(correction.corrected_invoice_number ?? '') ?? null,
      client: sourceClient(correction),
      reason: correction.correction_reason ?? '',
      net: correction.net_price / 100,
      vat: correction.tax_price / 100,
      gross: correction.gross_price / 100,
    }));

  const sales = sum(rows);
  const correctionSum = sum(corrections);
  const paidRows = rows.filter((row) => row.payment.paid);
  const brutto = (subset: RegisterRow[]) => ({ count: subset.length, gross: sum(subset).gross });

  const allChecks = rows.flatMap((row) => row.checks);
  return {
    month,
    generatedAt: input.generatedAt,
    rows,
    totals: {
      sales,
      invoiced: sum(rows.filter((row) => row.invoice)),
      uninvoiced: sum(rows.filter((row) => !row.invoice)),
      corrections: correctionSum,
      afterCorrections: {
        count: sales.count,
        net: (toGrosze(sales.net) + toGrosze(correctionSum.net)) / 100,
        vat: (toGrosze(sales.vat) + toGrosze(correctionSum.vat)) / 100,
        gross: (toGrosze(sales.gross) + toGrosze(correctionSum.gross)) / 100,
      },
      paidGateway: brutto(paidRows.filter((row) => row.payment.gateway)),
      paidTransfer: brutto(paidRows.filter((row) => !row.payment.gateway)),
      unpaid: brutto(rows.filter((row) => !row.payment.paid)),
    },
    unlinkedInvoices,
    corrections,
    pendingOrders,
    issues: {
      errors: allChecks.filter((check) => check.level === 'blad').length,
      // Faktura bez zamówienia bywa zwykłą sprzedażą poza sklepem — do wyjaśnienia, nie błąd
      warnings:
        allChecks.filter((check) => check.level === 'uwaga').length + unlinkedInvoices.length,
    },
    sources: input.sources,
  };
}
