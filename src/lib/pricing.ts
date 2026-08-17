import type { FormatId } from './catalog';
import type { EnvelopeConfig, PriceBreakdown, DeliveryMethod } from './types';

/**
 * Konfiguracja cenowa (pkt 1.2). Wszystkie kwoty w PLN brutto.
 *
 * **`DEFAULT_PRICING` jest jedynym źródłem ceny w serwisie.** Czytają je
 * konfigurator, koszyk, cenniki na stronach filarowych, dane strukturalne
 * `Offer`, `/llms.txt` oraz serwer przy wyliczaniu wartości zamówienia.
 * Strony są budowane statycznie, więc te liczby zapisują się w HTML w chwili
 * wdrożenia — **zmiana ceny wymaga edycji tej stałej i ponownego wdrożenia**,
 * a po nim podbicia daty w `PAGE_UPDATED` (`sitemap.ts`) i zgłoszenia przez
 * `npm run indexnow`.
 *
 * Kolekcja `pricing/current` w Firestore pozostaje w warstwie danych, ale
 * **nadpisanie nie jest stosowane** — powód opisuje `resolvePricing()`.
 */
export interface PricingConfig {
  base: Record<FormatId, number>;
  print: number;
  personalization: number;
  express: number;
  /** Stawka jest identyczna dla obu przewoźników — patrz DEFAULT_PRICING */
  delivery: Record<DeliveryMethod, number>;
  vatRate: number;
  moqWithPrint: number;
  moqWithoutPrint: number;
  leadDaysStandard: number;
  leadDaysExpress: number;
  /**
   * Koperty bez nadruku i personalizacji nie przechodzą przez produkcję —
   * pakujemy je z magazynu, więc jadą w 2 dni robocze bez dopłaty i bez
   * pytania klienta o czas realizacji.
   */
  leadDaysPlain: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  // Cena zależy wyłącznie od formatu — wszystkie 19 kolorów kosztuje tyle samo
  base: { DL: 2.58, C6: 2.12, K4: 2.15 },
  print: 1.99,
  personalization: 2.99,
  express: 1.5,
  // Koszt dostawy jest stały niezależnie od przewoźnika i wartości zamówienia.
  // Brak progu darmowej dostawy i brak odbioru osobistego (pkt 1.5).
  delivery: { kurier: 19.99, paczkomat: 19.99 },
  vatRate: 0.23,
  moqWithPrint: 10,
  moqWithoutPrint: 1,
  leadDaysStandard: 5,
  leadDaysExpress: 2,
  leadDaysPlain: 2,
};

/** Stały koszt dostawy brutto — jedna stawka dla kuriera i paczkomatu. */
export const DELIVERY_COST = DEFAULT_PRICING.delivery.kurier;

/**
 * Pola nadpisania, które różnią się od stawek wkompilowanych. Zwraca ścieżki
 * (`base.DL`, `print`, `delivery.kurier`), żeby log powiedział wprost, co się
 * rozjeżdża, a nie samo „cennik się różni".
 */
export function divergentPricingFields(override: Partial<PricingConfig>): string[] {
  const fields: string[] = [];

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    const current = DEFAULT_PRICING[key as keyof PricingConfig];

    if (current === undefined) {
      fields.push(`${key} (pole spoza cennika)`);
      continue;
    }
    if (typeof current === 'object' && typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value as Record<string, number>)) {
        if ((current as Record<string, number>)[subKey] !== subValue) {
          fields.push(`${key}.${subKey}`);
        }
      }
      continue;
    }
    if (current !== value) fields.push(key);
  }
  return fields;
}

/**
 * Cennik obowiązujący serwer przy wyliczaniu wartości zamówienia.
 *
 * **Zwraca zawsze `DEFAULT_PRICING` — nadpisanie z bazy jest odrzucane.**
 * Nie jest to ostrożność, tylko jedyny sposób utrzymania niezmiennika:
 * *klient płaci dokładnie tyle, ile zobaczył*. Ceny pokazywane klientowi
 * pochodzą z HTML-a zbudowanego w chwili wdrożenia — konfigurator, koszyk,
 * tabele na stronach filarowych, `Offer` w danych strukturalnych i `/llms.txt`
 * czytają `DEFAULT_PRICING`. Dokument `pricing/current` nie zmienia żadnego
 * z tych miejsc; zmieniłby wyłącznie kwotę naliczaną po stronie serwera, więc
 * jego zastosowanie oznaczałoby obciążenie klienta ceną, której nigdzie nie
 * widział — a przy wystawieniu oferty w Merchant Center także rozjazd feedu
 * ze stroną docelową, czyli podstawę do odrzucenia oferty.
 *
 * Rozbieżność jest **logowana jako błąd**, bo cichy powrót do stawek
 * domyślnych byłby drugą pułapką tego samego rodzaju: ktoś zmieniałby cenę
 * w bazie i nie wiedział, dlaczego nic się nie dzieje.
 *
 * Mechanizm nadpisania zostaje w warstwie danych (`LocalDb.pricing`,
 * kolekcja `pricing`) i wróci do użycia dopiero wtedy, gdy cenę będzie czytać
 * z jednego źródła **cały** serwis, łącznie z warstwą prezentacji — czyli po
 * przejściu stron cenowych na render dynamiczny albo na rewalidację wyzwalaną
 * zmianą cennika. Do tego czasu jedyną drogą zmiany ceny jest edycja
 * `DEFAULT_PRICING` i wdrożenie.
 */
export function resolvePricing(override: Partial<PricingConfig> | null | undefined): PricingConfig {
  const divergent = divergentPricingFields(override ?? {});

  if (divergent.length > 0) {
    console.error(
      `[cennik] Nadpisanie z bazy zostało ZIGNOROWANE. Rozjeżdżające się pola: ${divergent.join(', ')}. ` +
        'Serwer naliczyłby inne kwoty niż te, które klient widzi w konfiguratorze i w koszyku. ' +
        'Cenę zmienia się w DEFAULT_PRICING (src/lib/pricing.ts) i wdrożeniem — nie dokumentem w bazie.'
    );
  }
  return DEFAULT_PRICING;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Wylicza pełne rozbicie ceny dla jednej konfiguracji koperty. */
export function calculatePrice(
  config: EnvelopeConfig,
  pricing: PricingConfig = DEFAULT_PRICING
): PriceBreakdown {
  const unitBase = pricing.base[config.format] ?? 0;
  const unitPrint = config.print ? pricing.print : 0;
  const unitPersonalization = config.personalization ? pricing.personalization : 0;
  const unitExpress = config.shippingSpeed === 'ekspres' ? pricing.express : 0;
  const unitTotal = round2(unitBase + unitPrint + unitPersonalization + unitExpress);
  const quantity = Math.max(0, Math.floor(config.quantity || 0));
  const gross = round2(unitTotal * quantity);
  const net = round2(gross / (1 + pricing.vatRate));

  return {
    unitBase,
    unitPrint,
    unitPersonalization,
    unitExpress,
    unitTotal,
    quantity,
    gross,
    net,
    vat: round2(gross - net),
  };
}

/** Minimalna ilość dla danej konfiguracji (pkt 1.2 — MOQ). */
export function minimumQuantity(
  requiresProduction: boolean,
  pricing: PricingConfig = DEFAULT_PRICING
): number {
  return requiresProduction ? pricing.moqWithPrint : pricing.moqWithoutPrint;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} zł`;
}

/**
 * Polska liczba mnoga: 1 wiersz · 2–4 wiersze · 5+ wierszy, z wyjątkiem
 * nastek (12, 13, 14 → wierszy). Bez tego interfejs pisze „3 wierszy”.
 */
export function plural(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count) % 100;
  if (abs === 1) return one;
  if (abs >= 12 && abs <= 14) return many;
  return abs % 10 >= 2 && abs % 10 <= 4 ? few : many;
}

/** Dodaje dni robocze do daty (pomija sobotę i niedzielę). */
export function addWorkingDays(from: Date, days: number): Date {
  const date = new Date(from.getTime());
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

/**
 * Liczba dni roboczych realizacji.
 * Zamówienie bez nadruku i personalizacji nie trafia do produkcji ani na
 * akceptację wizualizacji, więc zawsze idzie w trybie 2 dni roboczych —
 * niezależnie od wyboru klienta i bez dopłaty.
 */
export function leadTimeDays(
  options: { speed: 'standard' | 'ekspres'; requiresProduction: boolean },
  pricing: PricingConfig = DEFAULT_PRICING
): number {
  if (!options.requiresProduction) return pricing.leadDaysPlain;
  return options.speed === 'ekspres' ? pricing.leadDaysExpress : pricing.leadDaysStandard;
}

export function estimatedDeliveryDate(
  options: { speed: 'standard' | 'ekspres'; requiresProduction: boolean },
  pricing: PricingConfig = DEFAULT_PRICING,
  from: Date = new Date()
): Date {
  return addWorkingDays(from, leadTimeDays(options, pricing));
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return DATE_FORMATTER.format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
