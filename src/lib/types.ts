import type { FormatId } from './catalog';

/** Czas realizacji (Krok 6 konfiguratora) */
export type ShippingSpeed = 'standard' | 'ekspres';

/** Metoda personalizacji (pkt 1.3) */
export type PersonalizationMethod = 'reczna' | 'szablon';

export interface AddressEntry {
  imieNazwisko: string;
  firma?: string;
  ulica: string;
  kodPocztowy: string;
  miasto: string;
  kraj?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  ext: string;
  /** Ścieżka w Firebase Storage lub URL dev-fallback */
  path?: string;
  url?: string;
  status: 'przeslano' | 'weryfikacja' | 'blad';
  error?: string;
}

/** Konfiguracja jednej pozycji — wynik pracy konfiguratora */
export interface EnvelopeConfig {
  format: FormatId;
  /** id koloru z COLORS */
  color: string;
  quantity: number;
  print: boolean;
  printFiles: UploadedFile[];
  printNotes?: string;
  personalization: boolean;
  personalizationMethod?: PersonalizationMethod;
  /**
   * Treść personalizacji wpisana ręcznie — dowolny tekst, nie sztywny
   * formularz adresowy. Klient często chce nadrukować samo imię i nazwisko
   * albo krótką dedykację, a nie pełny adres.
   */
  personalizationText?: string;
  personalizationFile?: UploadedFile | null;
  shippingSpeed: ShippingSpeed;
}

export interface PriceBreakdown {
  unitBase: number;
  unitPrint: number;
  unitPersonalization: number;
  unitExpress: number;
  unitTotal: number;
  quantity: number;
  gross: number;
  net: number;
  vat: number;
}

export interface CartItem {
  id: string;
  config: EnvelopeConfig;
  /** Ustandaryzowana nazwa wg pkt 1.9 — utrwalana przy dodaniu do koszyka */
  name: string;
  price: PriceBreakdown;
  addedAt: string;
}

/* ── Zamówienie ─────────────────────────────────────────────── */

export type OrderStatus =
  | 'nowe'
  | 'w_trakcie'
  | 'czeka_na_akceptacje'
  | 'do_druku'
  | 'zrealizowane'
  | 'anulowane';

export type PaymentStatus = 'oczekuje' | 'oplacone';

export type PaymentMethod = 'p24' | 'blik' | 'przelew' | 'faktura_odroczona';

export type DeliveryMethod = 'kurier' | 'paczkomat';

export type VisualizationStatus = 'brak' | 'oczekuje' | 'zaakceptowano' | 'uwagi';

export interface CustomerData {
  email: string;
  telefon: string;
  imie: string;
  nazwisko: string;
  isCompany: boolean;
  firma?: string;
  nip?: string;
  /** Adres do faktury */
  ulica: string;
  kodPocztowy: string;
  miasto: string;
  /** Adres dostawy — jeśli inny niż fakturowy */
  deliveryDifferent: boolean;
  deliveryImieNazwisko?: string;
  deliveryUlica?: string;
  deliveryKodPocztowy?: string;
  deliveryMiasto?: string;
}

export interface InpostPoint {
  name: string;
  address: string;
  city?: string;
  postCode?: string;
}

export interface DeliveryData {
  method: DeliveryMethod;
  cost: number;
  point?: InpostPoint | null;
}

export interface VisualizationVersion {
  id: string;
  version: number;
  file: UploadedFile;
  sentAt: string;
  status: VisualizationStatus;
  customerComment?: string;
  respondedAt?: string;
}

export interface OrderHistoryEntry {
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface Order {
  /** ENV-RRRRMMDD-XXXX (pkt 1.8) */
  number: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  customer: CustomerData;
  delivery: DeliveryData;
  items: CartItem[];
  totals: {
    itemsGross: number;
    deliveryGross: number;
    gross: number;
    net: number;
    vat: number;
  };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Identyfikator transakcji zwrócony przez bramkę Przelewy24 */
  p24Reference?: string | null;
  paymentDueDate?: string | null;
  status: OrderStatus;
  /** Czy zamówienie w ogóle przechodzi przez akceptację wizualizacji (pkt 1.11) */
  requiresVisualization: boolean;
  visualizationStatus: VisualizationStatus;
  visualizations: VisualizationVersion[];
  /** Token do akceptacji wizualizacji bez logowania (pkt 1.11) */
  approvalToken: string;
  estimatedDelivery: string;
  trackingNumber?: string | null;
  history: OrderHistoryEntry[];
  marketingConsent: boolean;
}

/* ── Konto użytkownika ──────────────────────────────────────── */

export interface SavedAddress {
  id: string;
  label: string;
  isDefault: boolean;
  data: Partial<CustomerData>;
}

export interface SavedConfiguration {
  id: string;
  label: string;
  config: EnvelopeConfig;
  savedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  accountType: 'firmowe' | 'indywidualne';
  imie?: string;
  nazwisko?: string;
  firma?: string;
  nip?: string;
  telefon?: string;
  role: 'user' | 'admin';
  marketingConsent: boolean;
  /** Uprawnienie do faktury z odroczonym terminem (pkt 1.5) */
  deferredPaymentEligible: boolean;
  addresses: SavedAddress[];
  configurations: SavedConfiguration[];
  createdAt: string;
}
