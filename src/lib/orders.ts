import type { PaymentMethod, PaymentStatus, CartItem } from './types';

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

/* ── Status płatności (pkt 1.10) ────────────────────────────── */

export const PAYMENT_STATUSES: { id: PaymentStatus; label: string }[] = [
  { id: 'oczekuje', label: 'Oczekuje na wpłatę' },
  { id: 'oplacone', label: 'Opłacone' },
];

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
  odbiorca: 'Jakub Dalaszyński',
  adres: 'ul. Geodetów 41, 64-100 Trzebiny',
  konto: 'PL 64 1020 3088 0000 8002 0171 3445',
  bank: 'PKO Bank Polski',
};

/**
 * Dane rejestrowe i kontaktowe Sprzedawcy — jedno źródło prawdy dla stopki,
 * strony kontaktu, dokumentów prawnych, faktur PDF, e-maili i JSON-LD.
 *
 * Działalność jednoosobowa wpisana do CEIDG: nie ma numeru KRS, więc nigdzie
 * go nie prezentujemy.
 */
export const CONTACT_DETAILS = {
  phone: '+48 695 527 166',
  phoneHref: '+48695527166',
  email: 'kontakt@envelopes.pl',
  ordersEmail: 'kontakt@envelopes.pl',
  hours: 'pon.–pt. 8:00–16:00',
  /** Imię i nazwisko przedsiębiorcy — jak we wpisie do CEIDG */
  company: 'Jakub Dalaszyński',
  /** Nazwa handlowa sklepu */
  brand: 'Envelopes',
  street: 'ul. Geodetów 41',
  postalCode: '64-100',
  city: 'Trzebiny',
  address: 'ul. Geodetów 41, 64-100 Trzebiny',
  nip: '6972414844',
  regon: '544772342',
  /**
   * Adres, pod który Klient odsyła towar przy odstąpieniu od umowy i przy
   * reklamacji. Trafia wprost do Regulaminu (§12 i §13) oraz do formularza
   * odstąpienia w PDF.
   *
   * TODO: podmienić na adres magazynu/drukarni — dziś zwroty kierujemy na
   * adres rejestrowy, co jest poprawne, ale niekoniecznie wygodne.
   */
  returnAddress: 'ul. Geodetów 41, 64-100 Trzebiny',
};
