import type {
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CartItem,
} from './types';

/* ── Numer zamówienia (pkt 1.8) ─────────────────────────────── */

/**
 * Generuje numer w formacie ENV-RRRRMMDD-XXXX, np. ENV-20260805-0147.
 * `sequence` to licznik zamówień z danego dnia (transakcyjny w Firestore).
 */
export function buildOrderNumber(date: Date, sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `ENV-${y}${m}${d}-${String(sequence).padStart(4, '0')}`;
}

export const ORDER_NUMBER_PATTERN = /^ENV-\d{8}-\d{4}$/;

export function isValidOrderNumber(value: string): boolean {
  return ORDER_NUMBER_PATTERN.test(value);
}

/* ── Statusy (pkt 1.10) ─────────────────────────────────────── */

export const ORDER_STATUSES: { id: OrderStatus; label: string; description: string }[] = [
  { id: 'nowe', label: 'Nowe', description: 'Zamówienie przyjęte, czeka na przydzielenie.' },
  { id: 'w_trakcie', label: 'W trakcie', description: 'Trwa przygotowanie zamówienia.' },
  {
    id: 'czeka_na_akceptacje',
    label: 'Czeka na akceptację',
    description: 'Wizualizacja przesłana do klienta — czekamy na zatwierdzenie projektu.',
  },
  { id: 'do_druku', label: 'Do druku', description: 'Wszystkie warunki spełnione — zamówienie skierowane do produkcji.' },
  { id: 'zrealizowane', label: 'Zrealizowane', description: 'Zamówienie wyprodukowane i wysłane.' },
  { id: 'anulowane', label: 'Anulowane', description: 'Zamówienie anulowane lub zwrócone.' },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = ORDER_STATUSES.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.label }),
  {} as Record<OrderStatus, string>
);

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  oczekuje: 'Oczekuje na wpłatę',
  oplacone: 'Opłacone',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  p24: 'Przelewy24 (karta lub szybki przelew)',
  blik: 'BLIK',
  przelew: 'Przelew tradycyjny (proforma)',
  faktura_odroczona: 'Faktura z odroczonym terminem płatności',
};

/** Metody rozliczane natychmiast przez bramkę (pkt 1.12 ścieżka A) */
export function isGatewayPayment(method: PaymentMethod): boolean {
  return method === 'p24' || method === 'blik';
}

/** Faktura z odroczonym terminem nie blokuje rozpoczęcia produkcji (pkt 1.12) */
export function isDeferredInvoice(method: PaymentMethod): boolean {
  return method === 'faktura_odroczona';
}

/* ── Reguła bramkująca status „Do druku" (pkt 1.12) ─────────── */

export interface PrintGateResult {
  allowed: boolean;
  /** Powód blokady — pokazywany jako podpowiedź przy wyszarzonej opcji */
  reason?: string;
  missingPayment: boolean;
  missingApproval: boolean;
}

export function evaluatePrintGate(order: {
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  requiresVisualization: boolean;
  visualizationStatus: Order['visualizationStatus'];
}): PrintGateResult {
  const paymentOk =
    order.paymentStatus === 'oplacone' || isDeferredInvoice(order.paymentMethod);
  const approvalOk =
    !order.requiresVisualization || order.visualizationStatus === 'zaakceptowano';

  const missingPayment = !paymentOk;
  const missingApproval = !approvalOk;

  if (paymentOk && approvalOk) {
    return { allowed: true, missingPayment: false, missingApproval: false };
  }

  const reasons: string[] = [];
  if (missingPayment) reasons.push('brak potwierdzonej wpłaty');
  if (missingApproval) reasons.push('klient nie zaakceptował jeszcze wizualizacji');

  return {
    allowed: false,
    reason: `Nie można skierować do druku: ${reasons.join(' oraz ')}.`,
    missingPayment,
    missingApproval,
  };
}

/** Czy zamówienie w ogóle przechodzi przez krok akceptacji wizualizacji (pkt 1.11) */
export function requiresVisualization(items: CartItem[]): boolean {
  return items.some((item) => item.config.print || item.config.personalization);
}

/** Token do akceptacji wizualizacji z poziomu e-maila, bez logowania (pkt 1.11) */
export function generateApprovalToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ── Dane do przelewu tradycyjnego (pkt 1.12 ścieżka B) ─────── */

export const BANK_TRANSFER_DETAILS = {
  odbiorca: 'Envelopes sp. z o.o.',
  adres: 'ul. Przykładowa 12, 00-001 Warszawa',
  konto: 'PL 00 0000 0000 0000 0000 0000 0000',
  bank: 'Bank Przykładowy S.A.',
};

export const CONTACT_DETAILS = {
  phone: '+48 22 000 00 00',
  phoneHref: '+48220000000',
  email: 'kontakt@envelopes.pl',
  ordersEmail: 'zamowienia@envelopes.pl',
  hours: 'pon.–pt. 8:00–16:00',
  company: 'Envelopes sp. z o.o.',
  address: 'ul. Przykładowa 12, 00-001 Warszawa',
  nip: '000-000-00-00',
  regon: '000000000',
  krs: '0000000000',
};
