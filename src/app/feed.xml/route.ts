import { DEFAULT_PRICING, DELIVERY_COST } from '@/lib/pricing';
import { COLORS, COLOR_MAP, FORMAT_MAP } from '@/lib/catalog';
import { SITE_URL, SKU, dlEnvelopeProductJsonLd } from '@/lib/seo';

/**
 * `/feed.xml` — feed produktowy dla Google Merchant Center (bezpłatne
 * listingi produktowe).
 *
 * **Jedna pozycja: koperta DL gładka.** To jedyna konfiguracja, która mapuje
 * się na model Merchant Center bez naciągania:
 * — minimalna ilość wynosi 1 sztukę (`moqWithoutPrint`), więc cena z feedu
 *   jest ceną, za którą kupujący realnie może złożyć zamówienie;
 * — ma stronę docelową (`/koperty-dl`), na której ta sama kwota jest widoczna
 *   w treści, a nie tylko w danych strukturalnych.
 * Koperty z nadrukiem i z personalizacją mają minimum 10 sztuk, więc cena
 * jednostkowa w feedzie byłaby ofertą, której nie da się kupić — wchodzą
 * dopiero jako pozycja wyceniona za komplet (`unit_pricing_measure`).
 *
 * **Dlaczego trasa, a nie plik wgrywany ręcznie.** Z tego samego powodu co
 * `/llms.txt`: wszystkie liczby pochodzą z `pricing.ts` i `catalog.ts`, czyli
 * z tego samego źródła co konfigurator, cennik na stronie i `Offer` w danych
 * strukturalnych. Plik wgrany raz rozjechałby się z ceną przy pierwszej
 * zmianie — a rozjazd feedu ze stroną docelową to najczęstsza przyczyna
 * odrzucenia oferty i, przy powtórzeniach, zawieszenia konta. Merchant Center
 * pobiera ten adres cyklicznie (zaplanowane pobieranie), więc wdrożenie nowej
 * ceny aktualizuje feed razem ze stroną.
 *
 * **Kiedy wejdą warianty kolorystyczne.** Strony `/koperty/[kolor]` dostają
 * własny `Offer` z symbolem `ENV-DL-<KOLOR>` i wspólnym `inProductGroupWithID`,
 * więc technicznie mogłyby zasilić feed od pierwszej opublikowanej strony.
 * Świadomie tego nie robimy: dopóki opublikowana jest część palety, wariant
 * obok pozycji zbiorczej to dwie oferty na ten sam produkt — jedna prowadząca
 * na stronę koloru, druga na stronę formatu. Warianty zastępują pozycję
 * `ENV-DL` **naraz**, gdy strony pokryją paletę; do tego czasu Shopping widzi
 * jedną ofertę obejmującą wszystkie odcienie, zamiast jednego odcienia
 * i osiemnastu niewidocznych.
 *
 * Pozycja jest **budowana z `dlEnvelopeProductJsonLd()`** — z tego samego
 * bloku, który opisuje produkt na stronie `/koperty-dl`. Dzięki temu tytuł,
 * opis, cena, zdjęcia i identyfikator nie są tu przepisane, tylko wzięte
 * z jedynego miejsca, które je definiuje.
 */

export const dynamic = 'force-static';

/** Escape XML — opisy zawierają „×", cudzysłowy drukarskie i myślniki. */
function xml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function body(): string {
  const product = dlEnvelopeProductJsonLd();
  const offer = product.offers;

  /*
   * Kadr wiodący: koperta biała. Oferta obejmuje wszystkie odcienie w jednej
   * cenie, więc zdjęcie główne nie może sugerować konkretnego koloru mocniej
   * niż tytuł — czarna koperta, która wypada pierwsza w kolejności katalogowej,
   * obiecywałaby kupującemu jeden odcień zamiast palety. Pozostałe kadry idą
   * jako `additional_image_link` i pokazują, że wybór koloru jest po stronie
   * klienta. Zestaw zdjęć pochodzi z tego samego bloku danych strukturalnych
   * co reszta pozycji — tutaj zmienia się wyłącznie kolejność.
   */
  const leadImage = `${SITE_URL}${COLOR_MAP.bialy?.images?.DL}`;
  const [mainImage, ...extraImages] = [
    leadImage,
    ...product.image.filter((image) => image !== leadImage),
  ];

  /*
   * `g:title` ma limit 150 znaków i nie może zawierać treści promocyjnej
   * („najtaniej", „promocja") ani wersalików. Liczba kolorów jest parametrem
   * oferty, nie obietnicą marketingową, i tłumaczy zestaw zdjęć.
   * Opis produktu jest ten sam, co w danych strukturalnych strony docelowej.
   */
  const title = `Koperta ozdobna DL ${FORMAT_MAP.DL.dimensions}, papier barwiony w masie, ${COLORS.length} kolorów`;

  /*
   * Identyfikatory: brak GTIN, bo koperty nie mają kodów kreskowych —
   * `g:brand` + `g:mpn` z symbolem katalogowym są tu poprawnym kompletem
   * (Envelopes jest producentem). Gdyby Merchant Center zakwestionował MPN,
   * alternatywą jest usunięcie tego pola i dodanie `g:identifier_exists`
   * o wartości `no`.
   *
   * Czas obsługi to `leadDaysPlain` — koperta gładka nie przechodzi przez
   * produkcję ani przez akceptację wizualizacji. Czas przewozu (`transit_time`)
   * świadomie pominięty, tak samo jak w danych strukturalnych: nie ma go
   * w żadnym źródle w projekcie, a Google liczy z niego obiecywaną datę
   * doręczenia (zob. „Zależności i blokady" w content-plan.md).
   */
  const items = [
    `    <item>
      <g:id>${SKU.plain}</g:id>
      <g:title>${xml(title)}</g:title>
      <g:description>${xml(product.description)}</g:description>
      <g:link>${product.url}</g:link>
      <g:image_link>${mainImage}</g:image_link>
${extraImages.map((image) => `      <g:additional_image_link>${image}</g:additional_image_link>`).join('\n')}
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${offer.price} PLN</g:price>
      <g:brand>Envelopes</g:brand>
      <g:mpn>${SKU.plain}</g:mpn>
      <g:product_type>Koperty ozdobne &gt; Koperty DL</g:product_type>
      <g:material>${xml(product.material)}</g:material>
      <g:size>${xml(product.size)}</g:size>
      <g:min_handling_time>${DEFAULT_PRICING.leadDaysPlain}</g:min_handling_time>
      <g:max_handling_time>${DEFAULT_PRICING.leadDaysPlain}</g:max_handling_time>
      <g:shipping>
        <g:country>PL</g:country>
        <g:service>Kurier</g:service>
        <g:price>${DELIVERY_COST.toFixed(2)} PLN</g:price>
      </g:shipping>
    </item>`,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Envelopes — koperty ozdobne</title>
    <link>${SITE_URL}</link>
    <description>Koperty ozdobne DL z papieru barwionego w masie. Ceny brutto w PLN, wysyłka kurierem na terenie Polski.</description>
${items.join('\n')}
  </channel>
</rss>
`;
}

export function GET() {
  return new Response(body(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
