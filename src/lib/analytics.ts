import { COLOR_MAP, FORMAT_MAP } from './catalog';
import { colorSku } from './seo';
import type { CartItem, EnvelopeConfig, PriceBreakdown } from './types';

/**
 * Warstwa pomiarowa GA4 — zdarzenia ścieżki zakupowej.
 *
 * **Po co to jest.** Do tej pory `gtag` był w serwisie skonfigurowany i na tym
 * kończył swoją rolę: zbierał odsłony i nic poza nimi. Odsłona mówi, że ktoś
 * wszedł na `/koperty-z-nadrukiem`, ale nie mówi, czy z tej strony ktokolwiek
 * wszedł do konfiguratora i czy cokolwiek zamówił. Bez tego planu treści
 * nie da się prowadzić na danych — każdą decyzję o kolejnym wpisie podejmuje
 * się na podstawie samych wyświetleń w Search Console, czyli w połowie drogi
 * do pieniędzy.
 *
 * **Nazwy zdarzeń są zarezerwowane przez GA4** (`add_to_cart`,
 * `begin_checkout`, `purchase`) — dzięki temu wchodzą do gotowych raportów
 * e-commerce i do ścieżek konwersji bez konfigurowania czegokolwiek w panelu.
 * Jedyny wyjątek to `configurator_start`: krok „wszedł i zaczął wybierać"
 * nie ma odpowiednika w standardzie, a jest tu najważniejszym mikrokonwersyjnym
 * sygnałem, bo konfigurator stoi na stronie głównej, a nie pod własnym adresem.
 *
 * **Zgoda jest warunkiem wysyłki, nie ozdobą.** `track()` milczy, dopóki
 * `Analytics` nie potwierdzi zgody analitycznej z banera. Wycofanie zgody
 * w trakcie sesji zamyka wysyłkę natychmiast — sam skrypt `gtag` zostaje
 * w pamięci strony do przeładowania, więc bez tej blokady zdarzenia leciałyby
 * dalej wbrew decyzji odwiedzającego.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Stan zgody analitycznej, przepisywany z banera przez komponent `Analytics`.
 *
 * Domyślnie `false` — pierwsze wejście na stronę nie wysyła nic, także wtedy,
 * gdy decyzja jeszcze nie zapadła.
 */
let analyticsAllowed = false;

/** Ustawiane wyłącznie przez `Analytics` po odczycie zgody z banera. */
export function setAnalyticsAllowed(allowed: boolean): void {
  analyticsAllowed = allowed;
}

/** Waluta sklepu — jedna dla całego serwisu, tak jak w danych strukturalnych. */
const CURRENCY = 'PLN';

export function track(name: string, params: Record<string, unknown> = {}): void {
  if (!analyticsAllowed) return;
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/**
 * Pozycja koszyka w formacie GA4.
 *
 * `item_id` to symbol handlowy wariantu z `colorSku()` — ten sam, który idzie
 * do danych strukturalnych i do Merchant Center. Zbieżność jest zamierzona:
 * dzięki niej raport sprzedaży w GA4 da się zestawić z ofertą w Shopping bez
 * mapowania identyfikatorów po nazwie produktu.
 *
 * `item_variant` niesie usługi, bo to one różnicują cenę jednostkową tego
 * samego odcienia — bez nich raport pokazałby jeden produkt w trzech cenach
 * bez wyjaśnienia, skąd ta różnica.
 */
export function gaItem(item: CartItem): Record<string, unknown> {
  return configItem(item.config, item.price, item.name);
}

export function gaItems(items: CartItem[]): Record<string, unknown>[] {
  return items.map(gaItem);
}

function configItem(
  config: EnvelopeConfig,
  price: PriceBreakdown,
  name: string
): Record<string, unknown> {
  const services = [
    config.print ? 'nadruk' : null,
    config.personalization ? 'personalizacja' : null,
  ].filter(Boolean);

  return {
    item_id: colorSku(config.color, config.format),
    item_name: name,
    item_brand: 'Envelopes',
    item_category: `Koperty ${config.format}`,
    item_category2: COLOR_MAP[config.color]?.name ?? config.color,
    item_variant: services.length ? services.join(' + ') : 'gładka',
    price: price.unitTotal,
    quantity: price.quantity,
  };
}

/** `add_to_cart` — pozycja dodana z konfiguratora. */
export function trackAddToCart(item: CartItem): void {
  track('add_to_cart', {
    currency: CURRENCY,
    value: item.price.gross,
    items: [gaItem(item)],
  });
}

/** `begin_checkout` — przejście z koszyka do formularza zamówienia. */
export function trackBeginCheckout(items: CartItem[], value: number): void {
  track('begin_checkout', {
    currency: CURRENCY,
    value,
    items: gaItems(items),
  });
}

/**
 * `configurator_start` — pierwsza zmiana konfiguracji w danej sesji strony.
 *
 * Zdarzenie mówi „ktoś tu naprawdę wszedł i zaczął wybierać", a nie „strona
 * z konfiguratorem się wyświetliła". Format jest w parametrze, bo konfigurator
 * otwiera się na DL i każde odejście od tej wartości jest samo w sobie
 * informacją o popycie na formaty, których dziś nie da się kupić.
 */
export function trackConfiguratorStart(format: string): void {
  track('configurator_start', {
    format,
    format_name: FORMAT_MAP[format as keyof typeof FORMAT_MAP]?.dimensions,
  });
}

/**
 * `purchase` — zamówienie złożone.
 *
 * `transaction_id` to numer zamówienia, czyli identyfikator, który GA4
 * wykorzystuje do odrzucania duplikatów: ekran potwierdzenia jest zwykłym
 * adresem, więc odświeżenie strony albo powrót z bramki płatniczej nie mogą
 * policzyć tej samej sprzedaży drugi raz.
 *
 * `value` obejmuje towar razem z dostawą — tak jak kwota, którą klient
 * faktycznie płaci. Koszt dostawy jest dodatkowo wystawiony osobno, żeby
 * dało się go z wartości zamówienia odjąć w raporcie.
 */
export function trackPurchase(input: {
  number: string;
  items: CartItem[];
  itemsGross: number;
  deliveryGross: number;
  gross: number;
}): void {
  track('purchase', {
    transaction_id: input.number,
    currency: CURRENCY,
    value: input.gross,
    shipping: input.deliveryGross,
    items: gaItems(input.items),
  });
}
