import { FORMAT_MAP, weightLabel, type FormatId } from '@/lib/catalog';
import { colorPages } from '@/lib/color-pages';
import { DEFAULT_PRICING, DELIVERY_COST } from '@/lib/pricing';
import { SITE_URL, colorEnvelopeProductJsonLd } from '@/lib/seo';
import { plainShotsForColor, showcaseSrc } from '@/lib/showcase';

/**
 * `/feed.xml` — feed produktowy dla Google Merchant Center (bezpłatne
 * listingi produktowe i kampanie Shopping).
 *
 * **Jedna pozycja na odcień, wszystkie w jednej grupie wariantów.** Poprzednia
 * wersja wystawiała jedną ofertę zbiorczą `ENV-DL` prowadzącą na `/koperty-dl`
 * i miała wpisany warunek wyjścia: warianty kolorystyczne zastąpią ją
 * **naraz**, gdy strony kolorów pokryją paletę. Warunek jest spełniony —
 * `color-pages.ts` ma wpis dla każdego odcienia z katalogu, więc każdy
 * wariant ma własną stronę docelową z widoczną ceną. Pozycja zbiorcza znika
 * w tym samym wdrożeniu, w którym wchodzą warianty: dwie oferty na ten sam
 * produkt, jedna prowadząca na stronę formatu i jedna na stronę koloru,
 * konkurowałyby ze sobą w Shopping i dublowały kartę produktu.
 *
 * Symbol grupy (`g:item_group_id`) to `ENV-DL`, czyli dokładnie ten symbol,
 * pod którym wcześniej szła oferta zbiorcza — zbieżność zamierzona i opisana
 * przy `colorGroupId()` w `seo.ts`. Kolor jest wariantem, format nie: koperta
 * C6 wejdzie jako osobna grupa `ENV-C6`, a nie jako rozmiar tej samej rodziny.
 *
 * **Czego w feedzie nie ma.** Kopert z nadrukiem i z personalizacją: mają
 * minimum 10 sztuk, więc cena jednostkowa byłaby ofertą, której nie da się
 * kupić. Wchodzą dopiero jako pozycja wyceniona za komplet
 * (`unit_pricing_measure`). Widełek z `/` i `/koperty-na-vouchery` też nie —
 * obejmują kilka konfiguracji naraz, więc nie mają jednej ceny ani jednego
 * symbolu.
 *
 * **Dlaczego trasa, a nie plik wgrywany ręcznie.** Wszystkie liczby pochodzą
 * z `pricing.ts` i `catalog.ts`, czyli z tego samego źródła co konfigurator,
 * cennik na stronie i `Offer` w danych strukturalnych. Plik wgrany raz
 * rozjechałby się z ceną przy pierwszej zmianie — a rozjazd feedu ze stroną
 * docelową to najczęstsza przyczyna odrzucenia oferty i, przy powtórzeniach,
 * zawieszenia konta. Merchant Center pobiera ten adres cyklicznie
 * (zaplanowane pobieranie), więc wdrożenie nowej ceny aktualizuje feed razem
 * ze stroną.
 *
 * Każda pozycja jest **budowana z `colorEnvelopeProductJsonLd()`** — z tego
 * samego bloku, który opisuje wariant na jego stronie. Tytuł, opis, cena,
 * symbol i zdjęcia nie są tu przepisane, tylko wzięte z jedynego miejsca,
 * które je definiuje, więc feed nie może powiedzieć czegoś innego niż strona
 * docelowa.
 */

export const dynamic = 'force-static';

/**
 * Format wystawiony w feedzie. Dziś `DL` jest jedynym, który da się kupić —
 * C6 i K4 mają w katalogu status „Dostępne wkrótce", a oferta na produkt,
 * którego konfigurator nie przyjmuje, jest ofertą nieprawdziwą.
 */
const FORMAT: FormatId = 'DL';
const SPEC = FORMAT_MAP[FORMAT];

/**
 * Kategoria z taksonomii produktów Google (pl-PL): „Artykuły biurowe >
 * Artykuły różne > Artykuły papiernicze > Koperty". Google przypisuje
 * kategorię także sam, ale przypisanie automatyczne bywa zgrubne, a od
 * kategorii zależy, przy jakich zapytaniach oferta w ogóle staje w szranki.
 */
const GOOGLE_PRODUCT_CATEGORY = '958';

/** Escape XML — opisy zawierają „×", cudzysłowy drukarskie i myślniki. */
function xml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * Pozycje feedu — po jednej na opublikowany odcień, w kolejności katalogowej.
 *
 * Lista odcieni pochodzi z `colorPages()`, czyli z rejestru **opublikowanych
 * stron**. Feed nie może wyprzedzić treści: oferta wskazująca adres, którego
 * nie ma, kończy się odrzuceniem pozycji i wizytą crawlera na 404.
 */
function feedItems(): string[] {
  return colorPages().flatMap(({ color }) => {
    /*
     * Zdjęcia oferty: wyłącznie koperta **gładka** w tym odcieniu.
     *
     * Kadry z nadrukiem i z personalizacją, które strona koloru pokazuje niżej
     * i które wchodzą do `image` w danych strukturalnych, są tu świadomie
     * pominięte. Oferta obejmuje kopertę bez nadruku za `base.DL` — zdjęcie
     * z wydrukowanym logo obiecywałoby w karcie produktu usługę, która kosztuje
     * osobno i ma własne minimum nakładu. Dochodzi drugi powód: nazwy firm
     * widoczne na tych kadrach są przykładowe (zob. `showcase.ts`), a karta
     * produktu w Shopping to nie jest miejsce na wizualizację.
     *
     * Zostaje kadr katalogowy z `catalog.ts` — ten sam, który stoi w hero
     * strony docelowej — i kadr aranżacyjny odcienia, jeśli pokazuje kopertę
     * czystą (`plainShotsForColor()`).
     */
    const plainShots = plainShotsForColor(color.id).map(showcaseSrc);

    const images = [color.images?.[FORMAT], ...plainShots]
      .filter((path): path is string => Boolean(path))
      .map((path) => `${SITE_URL}${path}`);

    /* Oferta bez zdjęcia jest odrzucana, a podstawienie kadru w innym kolorze
       byłoby wprowadzeniem w błąd co do wyglądu papieru — odcień bez własnego
       kadru po prostu nie wchodzi do feedu. Dziś takiego w katalogu nie ma. */
    if (images.length === 0) return [];

    const product = colorEnvelopeProductJsonLd({
      colorId: color.id,
      colorName: color.name,
      format: FORMAT,
      weight: color.weight,
      finish: color.finish,
      images,
    });

    const [mainImage, ...extraImages] = images;
    const weight = color.weight ? weightLabel(color.weight) : undefined;

    /*
     * `g:title` ma limit 150 znaków i nie może zawierać treści promocyjnej
     * („najtaniej", „promocja") ani wersalików. Podajemy to, po czym kupujący
     * wybiera: rodzaj produktu, format z wymiarami, odcień i gramaturę.
     *
     * Nazwa odcienia stoi po dwukropku, bo katalog trzyma nazwy w rodzaju
     * uzgodnionym z barwą, a nie z rzeczownikiem: „Czarny", ale „Szara"
     * i „Butelkowa Zieleń". Każda konstrukcja, w której nazwa określa
     * „kopertę" albo „kolor" wprost, łamie się na połowie palety —
     * dwukropek czyta się jako etykieta pola i jest poprawny dla wszystkich.
     *
     * Liczba pojedyncza jest tu istotna: sprzedajemy od 1 sztuki i cena
     * dotyczy sztuki. Tytuł w liczbie mnogiej przy kwocie 2,58 zł czytałby
     * się jak cena opakowania.
     */
    const title = `Koperta ozdobna ${FORMAT} ${SPEC.dimensions}, kolor: ${color.name}${
      weight ? `, ${weight}` : ''
    }`;

    /*
     * Identyfikatory: brak GTIN, bo koperty nie mają kodów kreskowych —
     * `g:brand` + `g:mpn` z symbolem katalogowym są tu poprawnym kompletem
     * (Envelopes jest producentem). Gdyby Merchant Center zakwestionował MPN,
     * alternatywą jest usunięcie tego pola i dodanie `g:identifier_exists`
     * o wartości `no`.
     *
     * Czas obsługi to `leadDaysPlain` — koperta gładka nie przechodzi przez
     * produkcję ani przez akceptację wizualizacji. Czas przewozu
     * (`transit_time`) świadomie pominięty, tak samo jak w danych
     * strukturalnych: nie ma go w żadnym źródle w projekcie, a Google liczy
     * z niego obiecywaną datę doręczenia. Zadeklarujemy go w ustawieniach
     * wysyłki konta, gdy przewoźnik zostanie potwierdzony.
     */
    return [
      `    <item>
      <g:id>${product.sku}</g:id>
      <g:item_group_id>${product.inProductGroupWithID}</g:item_group_id>
      <g:title>${xml(title)}</g:title>
      <g:description>${xml(product.description)}</g:description>
      <g:link>${product.url}</g:link>
      <g:image_link>${mainImage}</g:image_link>
${extraImages.map((image) => `      <g:additional_image_link>${image}</g:additional_image_link>\n`).join('')}      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:price>${product.offers.price} PLN</g:price>
      <g:brand>Envelopes</g:brand>
      <g:mpn>${product.sku}</g:mpn>
      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>
      <g:product_type>Koperty ozdobne &gt; Koperty ${FORMAT}</g:product_type>
      <g:color>${xml(color.name)}</g:color>
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
  });
}

function body(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Envelopes — koperty ozdobne</title>
    <link>${SITE_URL}</link>
    <description>Koperty ozdobne ${FORMAT} ${SPEC.dimensions} z papieru barwionego w masie, w odcieniach katalogowych. Ceny brutto w PLN, wysyłka kurierem na terenie Polski.</description>
${feedItems().join('\n')}
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
