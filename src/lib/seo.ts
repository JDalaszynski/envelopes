import { CONTACT_DETAILS } from './orders';
import { DEFAULT_PRICING, DELIVERY_COST, round2 } from './pricing';
import {
  AVAILABLE_FORMATS,
  COLORS,
  FORMATS,
  FORMAT_MAP,
  hasSurfaceFinish,
  maxInsertSize,
  weightLabel,
  type EnvelopeColor,
  type FormatId,
} from './catalog';
import { colorPagePath, hasColorPage } from './color-pages';
import { pageUpdated } from './page-updated';
import { INDUSTRY_SHOTS, PERSONALIZATION_SHOTS, shotByFile, showcaseSrc } from './showcase';
import type { BlogPost } from './blog';

/** Dane strukturalne JSON-LD (pkt 8.3). */

/**
 * Adres kanoniczny serwisu. Zasila sitemapę, robots.txt, wszystkie JSON-LD
 * i adresy zwrotne Przelewy24.
 *
 * Fallback wskazuje na produkcję świadomie: brak zmiennej na hostingu nie
 * może skutkować sitemapą i danymi strukturalnymi wskazującymi na localhost.
 * Do pracy lokalnej ustaw `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
 * w `.env.local` — inaczej webhook P24 pojedzie na produkcję.
 */
/*
 * Końcowy ukośnik jest ucinany, bo **każde** użycie tej stałej ma postać
 * `${SITE_URL}/ścieżka`. Wartość `https://envelopes.pl/` dawała adresy
 * z podwójnym ukośnikiem (`https://envelopes.pl//koperty-dl`) w sitemapie,
 * w `robots.host`, w `image` danych strukturalnych, w linkach e-mail
 * i w adresach powrotnych Przelewy24. Dla wyszukiwarki to inny adres niż
 * kanoniczny, więc normalizujemy w jednym miejscu zamiast pilnować zapisu
 * zmiennej na każdym środowisku osobno.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envelopes.pl').replace(
  /\/+$/,
  ''
);

/**
 * Obraz wyróżniający dla karty w wynikach wyszukiwania i w podglądzie
 * odnośnika (`summary_large_image`, Facebook, LinkedIn, komunikatory).
 *
 * Pliki leżą w `public/images/og/` w proporcji 1,91:1 — wymaganej przez duży
 * podgląd. Kwadratowe zdjęcia produktowe są w tej karcie przycinane w pionie,
 * więc kadr OG komponujemy osobno, zamiast wskazywać zdjęcie z katalogu.
 *
 * Adres podajemy względny: `metadataBase` w `layout.tsx` rozwija go do adresu
 * bezwzględnego, którego wymagają crawlery społecznościowe.
 */
export function ogImage(slug: string, alt: string) {
  return { url: `/images/og/${slug}.jpg`, width: 1200, height: 630, alt };
}

/* ── Graf encji ────────────────────────────────────────────────────────── */

/**
 * Adresy węzłów, na które wskazują wszystkie pozostałe bloki danych.
 *
 * Bez nich każdy blok był osobną, niepowiązaną wzmianką: `Product.seller`
 * mówił „Organization o nazwie Envelopes", `Article.publisher` to samo,
 * a `WebSite.publisher` jeszcze raz — trzy anonimowe węzły zamiast trzech
 * odwołań do jednej firmy. Wyszukiwarka i model językowy scalają encję po
 * `@id`, więc dane rejestrowe, logo i adres wystarczy podać **raz**.
 *
 * Węzeł firmy renderuje `layout.tsx` na każdej stronie serwisu, więc żadna
 * referencja nie zostaje bez definicji — również na wpisach blogowych.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const BRAND_ID = `${SITE_URL}/#brand`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_ID = `${SITE_URL}/#logo`;

/**
 * Logo firmy. Wymiary są wpisane, bo `ImageObject` bez `width` i `height`
 * jest przez Google traktowany jako niepełny — muszą odpowiadać plikowi
 * `public/images/logo-icon.png` (295 × 221 px). Podmiana pliku wymaga
 * poprawienia tych dwóch liczb.
 *
 * Wcześniej `articleJsonLd()` wskazywał tu na `${SITE_URL}/logo.svg`, którego
 * w `public/` nigdy nie było — każdy wpis blogowy wysyłał do Google 404
 * w polu wymaganym dla wyniku rozszerzonego `Article`.
 */
const LOGO = { path: '/images/logo-icon.png', width: 295, height: 221 };

/** Odwołanie do węzła firmy — używane wszędzie zamiast powielania danych. */
const organizationRef = { '@id': ORGANIZATION_ID };

/**
 * To samo odwołanie, ale z typem i nazwą. Wytyczne Google dla `Article`
 * wymagają `publisher.name`, więc blok artykułu niesie je wprost i pozostaje
 * czytelny nawet dla parsera, który nie rozwiązuje referencji po `@id`.
 */
const organizationRefNamed = {
  '@id': ORGANIZATION_ID,
  '@type': 'Organization',
  name: 'Envelopes',
};

const brandRef = { '@id': BRAND_ID, '@type': 'Brand', name: 'Envelopes' };

/**
 * Węzeł firmy. Typ `OnlineStore` (podtyp `Organization`) zamiast samego
 * `Organization` — Envelopes sprzedaje wyłącznie wysyłkowo przez własny sklep,
 * a bardziej szczegółowy typ jest tym, co model językowy potrafi wykorzystać
 * przy pytaniu „gdzie kupić koperty z nadrukiem". Oba typy zostają na węźle,
 * bo pozostałe bloki odwołują się do niego jako do `Organization`.
 *
 * `sameAs` świadomie nieobecne: profili społecznościowych jeszcze nie ma,
 * a pusta tablica jest sygnałem gorszym niż brak pola (content-plan.md,
 * sekcja „Zależności i blokady").
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': ORGANIZATION_ID,
    name: 'Envelopes',
    legalName: CONTACT_DETAILS.company,
    url: SITE_URL,
    description:
      'Producent i dystrybutor kopert ozdobnych z nadrukiem firmowym i adresowaniem. Formaty DL, C6, K4 w 19 kolorach.',
    telephone: CONTACT_DETAILS.phoneHref,
    email: CONTACT_DETAILS.email,
    taxID: CONTACT_DETAILS.nip,
    vatID: `PL${CONTACT_DETAILS.nip}`,
    logo: {
      '@type': 'ImageObject',
      '@id': LOGO_ID,
      url: `${SITE_URL}${LOGO.path}`,
      contentUrl: `${SITE_URL}${LOGO.path}`,
      width: LOGO.width,
      height: LOGO.height,
      caption: 'Envelopes',
    },
    image: { '@id': LOGO_ID },
    brand: brandRef,
    areaServed: { '@type': 'Country', name: 'Polska' },
    currenciesAccepted: 'PLN',
    paymentAccepted: 'BLIK, karta płatnicza, przelew, faktura z odroczonym terminem płatności',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT_DETAILS.street,
      postalCode: CONTACT_DETAILS.postalCode,
      addressLocality: CONTACT_DETAILS.city,
      addressCountry: 'PL',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: CONTACT_DETAILS.phoneHref,
      email: CONTACT_DETAILS.email,
      contactType: 'customer service',
      areaServed: 'PL',
      availableLanguage: 'Polish',
    },
  };
}

/**
 * Identyfikatory handlowe pojedynczych ofert.
 *
 * Sklep nie prowadzi magazynu indeksowanego po symbolach — produkt powstaje
 * z konfiguracji, nie z pozycji katalogowej — więc symbole definiujemy tutaj:
 * format plus usługa, czyli dokładnie to, co odróżnia trzy oferty opisane
 * pojedynczym `Offer`. Nadaje je sprzedawca i nie muszą pochodzić z żadnego
 * rejestru zewnętrznego, ale **muszą być stałe**: po tym polu Google i Merchant
 * Center sklejają historię tej samej oferty w czasie.
 *
 * Widełki na `/` i `/koperty-na-vouchery` symbolu nie dostają — obejmują
 * kilka konfiguracji naraz, więc jeden identyfikator byłby nieprawdziwy.
 */
export const SKU = {
  plain: 'ENV-DL',
  print: 'ENV-DL-NADRUK',
  personalization: 'ENV-DL-PERS',
};

/* ── Dostawa i zwroty — pola, po których Google opisuje ofertę ─────────── */

/**
 * Data ważności ceny. Liczona przy budowaniu jako dzień budowania + rok:
 * oferta bez tego pola jest opisana gorzej, a z datą przeszłą — traktowana
 * jako nieaktualna. Wartość zamraża się w chwili budowania, więc serwis
 * niewdrażany przez rok zacznie podawać datę wsteczną; przy kadencji
 * publikacji z `content-plan.md` to nie jest realne ryzyko.
 */
const PRICE_VALID_UNTIL = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
})();

const BUSINESS_DAYS = [
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
];

/**
 * Termin dostawy w rozbiciu na czas obsługi i dni robocze.
 *
 * `transitTime` jest **świadomie pominięty**: czasu przewozu nie ma dziś
 * w żadnym źródle w projekcie — regulamin mówi tylko „za pośrednictwem firmy
 * kurierskiej", a `pricing.ts` zna wyłącznie dni realizacji. Wpisanie tu
 * „1–2 dni" byłoby deklaracją bez pokrycia, składaną w miejscu, z którego
 * Google liczy obiecywaną datę doręczenia. Sam `handlingTime` jest poprawny,
 * tylko niepełny — pole domknie się, gdy przewoźnik zostanie potwierdzony.
 *
 * Dni robocze podajemy wprost, bo `addWorkingDays()` w `pricing.ts` pomija
 * weekendy — deklaracja odpowiada temu, co faktycznie liczy kalkulator.
 */
function deliveryTime(minDays: number, maxDays: number) {
  return {
    '@type': 'ShippingDeliveryTime',
    handlingTime: {
      '@type': 'QuantitativeValue',
      minValue: minDays,
      maxValue: maxDays,
      unitCode: 'DAY',
    },
    businessDays: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: BUSINESS_DAYS,
    },
  };
}

/**
 * Warunki wysyłki. Stawka jest jedna, niezależna od przewoźnika i nakładu
 * (`DEFAULT_PRICING.delivery`), a obszar to wyłącznie Polska — wysyłka
 * zagraniczna wymaga indywidualnego uzgodnienia (§9 regulaminu), więc nie
 * deklarujemy jej jako dostępnej.
 */
function shippingDetails(handling: { min: number; max: number }) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: DELIVERY_COST.toFixed(2),
      currency: 'PLN',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'PL',
    },
    deliveryTime: deliveryTime(handling.min, handling.max),
  };
}

/**
 * Zwrot koperty gładkiej — 14 dni na odstąpienie na zasadach ogólnych
 * (§12 ust. 1 i 6 regulaminu). Bezpośrednie koszty odesłania ponosi Klient,
 * stąd `ReturnFeesCustomerResponsibility`, a nie `ReturnShippingFees`: to
 * drugie oznacza opłatę **pobieraną przez sprzedawcę** i wymagałoby podania
 * jej kwoty, której nie ma — Klient nadaje przesyłkę zwrotną sam.
 */
function plainReturnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'PL',
    returnPolicyCountry: 'PL',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    merchantReturnLink: `${SITE_URL}/regulamin`,
  };
}

/**
 * Koperty z nadrukiem i z personalizacją są wyłączone z prawa odstąpienia —
 * są rzeczą wykonaną według specyfikacji Klienta (art. 38 ust. 1 pkt 3 ustawy
 * o prawach konsumenta, §12 ust. 5 regulaminu). Deklarowanie przy nich
 * czternastu dni byłoby obietnicą, której regulamin nie pokrywa.
 */
function customReturnPolicy() {
  return {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'PL',
    returnPolicyCountry: 'PL',
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    merchantReturnLink: `${SITE_URL}/regulamin`,
  };
}

/**
 * WebSite — encja serwisu dla wyszukiwarek i modeli generatywnych (pkt 6.9).
 *
 * Świadomie bez `SearchAction`: w serwisie nie ma wyszukiwarki, więc
 * deklarowanie jej byłoby fałszywym sygnałem i generowałoby ostrzeżenia.
 */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'Envelopes',
    alternateName: 'Envelopes — koperty ozdobne',
    url: SITE_URL,
    inLanguage: 'pl-PL',
    description:
      'Sklep z kopertami ozdobnymi DL w 19 kolorach, z nadrukiem logo firmowego i adresowaniem. Wysyłka na terenie Polski.',
    publisher: organizationRef,
  };
}

/**
 * Product + AggregateOffer dla strony głównej — klaster K3 („koperty ozdobne").
 *
 * Do wyliczeń wchodzą wyłącznie formaty faktycznie dostępne w sprzedaży
 * (`AVAILABLE_FORMATS`). Wcześniej `lowPrice` liczone było ze wszystkich
 * formatów, więc dane strukturalne obiecywały 2,12 zł za kopertę C6, której
 * nie da się kupić — to wprost ostrzeżenie w Search Console i rozjazd
 * z konfiguratorem.
 *
 * `highPrice` to maksymalna cena jednostkowa, jaką da się dziś skonfigurować:
 * koperta + nadruk + personalizacja + ekspres.
 */
export function productJsonLd() {
  const basePrices = AVAILABLE_FORMATS.map((f) => DEFAULT_PRICING.base[f.id]);
  const lowPrice = Math.min(...basePrices);
  const highPrice = round2(
    Math.max(...basePrices) +
      DEFAULT_PRICING.print +
      DEFAULT_PRICING.personalization +
      DEFAULT_PRICING.express
  );
  const images = COLORS.filter((color) => color.images?.DL)
    .slice(0, 8)
    .map((color) => `${SITE_URL}${color.images?.DL}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/#product`,
    name: `Koperty ozdobne DL ${FORMAT_MAP.DL.dimensions}`,
    description: `Koperty ozdobne z papieru barwionego w masie, format DL ${FORMAT_MAP.DL.dimensions}, dostępne w ${COLORS.length} kolorach w jednej cenie. Gramatura 115–140 g/m², bez okienka adresowego. Opcjonalny nadruk logo firmowego i personalizacja, czyli nadruk adresu odbiorcy.`,
    brand: brandRef,
    category: 'Koperty ozdobne',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url: `${SITE_URL}/#konfigurator`,
    /*
     * `AggregateOffer` **bez** `hasMerchantReturnPolicy` — świadomie.
     * Te widełki obejmują jednocześnie kopertę gładką (14 dni na odstąpienie)
     * i kopertę z nadrukiem (wyłączona z odstąpienia jako rzecz wykonana
     * na indywidualne zamówienie). Jedna polityka opisałaby połowę zakresu
     * fałszywie, a Google i tak czyta to pole wyłącznie z pojedynczego
     * `Offer` — tam, gdzie konfiguracja jest jednoznaczna, czyli na F1, F2
     * i F3. To samo dotyczy `priceValidUntil`, które opisuje jedną cenę.
     */
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      offerCount: COLORS.length,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysPlain,
        max: DEFAULT_PRICING.leadDaysStandard,
      }),
      seller: organizationRef,
    },
  };
}

/**
 * ItemList palety kolorów — 19 pozycji wprost z katalogu (GEO pkt 6.6).
 *
 * Odcień z opublikowaną stroną `/koperty/[kolor]` niesie `url`, bo ta lista
 * jest dla modelu i dla crawlera jedyną mapą wariantów kolorystycznych —
 * bez adresu wskazuje kolor, ale nie prowadzi do niczego. Adres bierzemy
 * z `color-pages.ts`, czyli z rejestru opublikowanych stron, więc odcień
 * bez treści zostaje przy samej nazwie i zdjęciu, zamiast linkować do 404.
 */
export function colorPaletteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Kolory kopert ozdobnych DL — paleta ${COLORS.length} odcieni`,
    description: `Paleta ${COLORS.length} kolorów kopert ozdobnych DL ${FORMAT_MAP.DL.dimensions} w sklepie Envelopes. Każdy kolor kosztuje tyle samo — ${DEFAULT_PRICING.base.DL.toFixed(2)} PLN brutto za sztukę.`,
    numberOfItems: COLORS.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: COLORS.map((color, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `Koperta DL ${color.name}`,
      ...(color.images?.DL ? { image: `${SITE_URL}${color.images.DL}` } : {}),
      ...(hasColorPage(color.id) ? { url: `${SITE_URL}${colorPagePath(color.id)}` } : {}),
    })),
  };
}

/**
 * Product + Offer dla filara „Koperty z nadrukiem" (/koperty-z-nadrukiem).
 *
 * Cena jest liczona z `DEFAULT_PRICING`, czyli z tego samego źródła, z którego
 * strona renderuje cennik — dane strukturalne nie mogą rozjechać się z treścią
 * widoczną dla użytkownika. `image` łączy dwa zestawy: zdjęcia produktowe
 * na białym tle z `public/images/prints/` i kadry aranżacyjne
 * z `public/images/zastosowania/`. Oba pokazują ten sam produkt w dwóch
 * ujęciach, a nie dwa różne produkty — Google honoruje wiele obrazów
 * przy jednym `Product` i wybiera kadr sam.
 */
export function printedEnvelopeProductJsonLd() {
  const unitPrice = round2(DEFAULT_PRICING.base.DL + DEFAULT_PRICING.print);
  const url = `${SITE_URL}/koperty-z-nadrukiem`;
  const images = [
    ...COLORS.filter((color) => color.printImages?.DL)
      .slice(0, 6)
      .map((color) => `${SITE_URL}${color.printImages?.DL}`),
    ...INDUSTRY_SHOTS.map((shot) => `${SITE_URL}${showcaseSrc(shot)}`),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: 'Koperty DL z nadrukiem logo firmowego',
    description: `Koperta DL ${FORMAT_MAP.DL.dimensions} z nadrukiem logo firmowego, w 19 kolorach papieru ozdobnego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk, realizacja ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni w trybie ekspresowym.`,
    brand: brandRef,
    sku: SKU.print,
    category: 'Koperty firmowe z nadrukiem',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: unitPrice.toFixed(2),
      priceValidUntil: PRICE_VALID_UNTIL,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithPrint,
        unitCode: 'C62',
      },
      /* Wysyłka nie była tu dotąd opisana w ogóle, mimo że koszt dostawy
         jest taki sam jak na pozostałych stronach. */
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysExpress,
        max: DEFAULT_PRICING.leadDaysStandard,
      }),
      hasMerchantReturnPolicy: customReturnPolicy(),
      seller: organizationRef,
    },
  };
}

/**
 * Product + Offer dla filara „Koperty DL" (/koperty-dl) — klaster K4.
 *
 * Świadomie **nie duplikuje** `productJsonLd()` ze strony głównej, mimo że
 * chodzi o ten sam papier. Strona główna opisuje całą paletę jako jedną
 * ofertę zbiorczą (`AggregateOffer`, 19 wariantów, widełki cenowe od koperty
 * gładkiej po komplet z nadrukiem, personalizacją i ekspresem). Ta strona
 * opisuje **jeden konkretny wariant** — kopertę DL gładką — i dokłada to,
 * czego strona główna nie niesie: `width`, `depth` i `additionalProperty`
 * z pełną geometrią formatu. To jest ładunek, po który model przychodzi na
 * zapytanie „jakie wymiary ma koperta DL", więc musi być w danych, a nie
 * tylko w treści.
 *
 * `width` i `height` w schema.org opisują wymiary produktu, więc dla koperty
 * podajemy krótszy i dłuższy bok wprost w milimetrach.
 */
export function dlEnvelopeProductJsonLd() {
  const dl = FORMAT_MAP.DL;
  const maxInsert = maxInsertSize(dl);
  const url = `${SITE_URL}/koperty-dl`;
  const images = COLORS.filter((color) => color.images?.DL)
    .slice(0, 6)
    .map((color) => `${SITE_URL}${color.images?.DL}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: `Koperta DL ${dl.dimensions}`,
    description: `Koperta ozdobna w formacie DL o wymiarach ${dl.dimensions}. Papier barwiony w masie 115–140 g/m², bez okienka adresowego. Mieści kartkę A4 złożoną na trzy (99 × 210 mm) oraz voucher w tym samym wymiarze. Największa wkładka: ${maxInsert.short} × ${maxInsert.long} mm. Dostępna w ${COLORS.length} kolorach w jednej cenie.`,
    brand: brandRef,
    sku: SKU.plain,
    category: 'Koperty DL',
    material: 'Papier ozdobny 115–140 g/m²',
    size: dl.dimensions,
    width: { '@type': 'QuantitativeValue', value: dl.width, unitCode: 'MMT' },
    height: { '@type': 'QuantitativeValue', value: dl.height, unitCode: 'MMT' },
    image: images,
    url,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Format', value: `DL ${dl.dimensions}` },
      { '@type': 'PropertyValue', name: 'Kształt', value: 'Prostokątna, podłużna' },
      {
        '@type': 'PropertyValue',
        name: 'Największa wkładka',
        value: `${maxInsert.short} × ${maxInsert.long} mm`,
      },
      { '@type': 'PropertyValue', name: 'Okienko adresowe', value: 'Brak' },
      { '@type': 'PropertyValue', name: 'Gramatura papieru', value: '115–140 g/m²' },
      { '@type': 'PropertyValue', name: 'Liczba kolorów', value: String(COLORS.length) },
    ],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: DEFAULT_PRICING.base.DL.toFixed(2),
      priceValidUntil: PRICE_VALID_UNTIL,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      /* Koperta gładka nie przechodzi przez produkcję ani przez akceptację
         wizualizacji, więc czas obsługi jest jedną liczbą, nie widełkami. */
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysPlain,
        max: DEFAULT_PRICING.leadDaysPlain,
      }),
      /* Jedyna oferta w serwisie objęta prawem odstąpienia — koperta bez
         nadruku i bez personalizacji nie jest rzeczą wykonaną na zamówienie. */
      hasMerchantReturnPolicy: plainReturnPolicy(),
      seller: organizationRef,
    },
  };
}

/**
 * Identyfikator grupy wariantów — **jeden na format**: `ENV-DL`, `ENV-C6`,
 * `ENV-K4`. Po tym polu Google skleja odcienie w jedną rodzinę produktową
 * zamiast traktować je jako konkurujące oferty.
 *
 * Grupa nie obejmuje formatów, choć technicznie mogłaby: format zmienia cenę
 * jednostkową i zastosowanie, więc koperta C6 jest innym produktem, a nie
 * innym rozmiarem tej samej koperty. Kolor jest wariantem, format — nie.
 *
 * Dla DL wartość jest równa `SKU.plain`, czyli symbolowi pozycji zbiorczej
 * w feedzie. To zbieżność zamierzona: gdy warianty kolorystyczne zastąpią
 * pozycję zbiorczą, wejdą pod identyfikatorem grupy, który Merchant Center
 * już zna.
 */
export function colorGroupId(format: FormatId): string {
  return `ENV-${format}`;
}

/**
 * Symbol handlowy wariantu kolorystycznego — `ENV-DL-CZARNY`.
 *
 * Format jest częścią symbolu, a nie domyślną wartością pominiętą w zapisie:
 * ta sama czerń w formacie C6 będzie osobną ofertą, z osobną ceną i osobnym
 * zdjęciem, więc `ENV-C6-CZARNY` musi dać się od niej odróżnić bez migracji
 * identyfikatorów. Symbol raz zgłoszony do Merchant Center powinien zostać
 * stały — po nim sklejana jest historia oferty.
 */
export function colorSku(colorId: string, format: FormatId): string {
  return `${colorGroupId(format)}-${colorId.toUpperCase()}`;
}

/**
 * Product + Offer dla strony koloru `/koperty/[kolor]` (content-plan.md, Faza 3).
 *
 * Rozgraniczenie wobec `dlEnvelopeProductJsonLd()`: tamten blok opisuje format
 * — wymiary, geometrię, największą wkładkę — i jest właścicielem tych pól.
 * Ten opisuje **wariant kolorystyczny** i dokłada `color`, wykończenie oraz
 * gramaturę tego konkretnego odcienia. Oba biorą cenę z `DEFAULT_PRICING`,
 * więc rozjazd między nimi jest niemożliwy.
 *
 * `inProductGroupWithID` zamiast `isVariantOf`: to pole rozumie zarówno
 * schema.org, jak i Merchant Center, i nie wymaga istnienia osobnego węzła
 * `ProductGroup`, którego w serwisie nie ma — grupą jest zbiór stron kolorów.
 *
 * **Format jest parametrem, nie założeniem.** Dziś wchodzi tu wyłącznie `DL`,
 * bo tylko ten format da się kupić. Gdy ruszą C6 i K4, ta sama strona koloru
 * wystawi po jednym bloku na format — adres pozostaje kolorowy, bo wariantem
 * jest format, a nie odcień (reguła w `src/lib/color-pages.ts`). Cena, wymiary
 * i symbol handlowy schodzą wtedy z parametru, więc nie ma tu czego przepisywać.
 */
export function colorEnvelopeProductJsonLd(input: {
  colorId: string;
  colorName: string;
  format: FormatId;
  weight?: string;
  finish?: EnvelopeColor['finish'];
  images: string[];
}) {
  const spec = FORMAT_MAP[input.format];
  const url = `${SITE_URL}/koperty/${input.colorId}`;
  const weight = input.weight ? weightLabel(input.weight) : undefined;

  /*
   * Opis papieru schodzi z `finish`, a nie jest wpisany na sztywno.
   *
   * Wcześniej każdy odcień dostawał w `material` i w opisie zdanie „barwiony
   * w masie". Dla odcieni matowych to prawda i jednocześnie ich najmocniejszy
   * argument, ale dla Złotego i dla papierów perłowych składało się w opis
   * wewnętrznie sprzeczny — „barwiony w masie, wykończenie metaliczne" —
   * a połysk jest z definicji cechą powierzchni. Merchant Center czyta
   * `material` wprost i pokazuje go przy ofercie, więc odcień z wykończeniem
   * powierzchniowym opisujemy wykończeniem, a resztę palety barwieniem.
   *
   * Wyjątek świadomy: `eko` też siedzi w polu `finish`, ale opisuje rodzaj
   * papieru, a nie jego powierzchnię — barwienie w masie zostaje przy nim
   * prawdziwe i nie ma powodu go z opisu zdejmować.
   */
  const surfaceFinish = hasSurfaceFinish(input.finish);
  /* Nazwa wykończenia zostaje w mianowniku („wykończenie metaliczne"),
     bo katalog trzyma ją w tej formie. Zdanie budujemy tak, żeby nie
     wymagało jej odmiany — inaczej wyszłoby „z wykończeniem metaliczne". */
  const paperBase = surfaceFinish ? 'Papier ozdobny' : 'Papier barwiony w masie';
  const finishClause = input.finish ? `, wykończenie ${input.finish}` : '';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: `Koperta ${input.format} ${spec.dimensions} — kolor ${input.colorName}`,
    description: `Koperta ozdobna ${input.format} ${spec.dimensions} w kolorze ${input.colorName}. ${paperBase}${weight ? ` o gramaturze ${weight}` : ''}${finishClause}, bez okienka adresowego. Cena identyczna jak w pozostałych ${COLORS.length - 1} odcieniach — zależy wyłącznie od formatu. Opcjonalny nadruk logo i personalizacja, czyli nadruk danych odbiorcy.`,
    brand: brandRef,
    sku: colorSku(input.colorId, input.format),
    inProductGroupWithID: colorGroupId(input.format),
    color: input.colorName,
    category: 'Koperty ozdobne',
    material: `Papier ozdobny${weight ? ` ${weight}` : ''}${
      surfaceFinish ? `, wykończenie ${input.finish}` : ', barwiony w masie'
    }`,
    size: spec.dimensions,
    width: { '@type': 'QuantitativeValue', value: spec.width, unitCode: 'MMT' },
    height: { '@type': 'QuantitativeValue', value: spec.height, unitCode: 'MMT' },
    image: input.images,
    url,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Format', value: `${input.format} ${spec.dimensions}` },
      { '@type': 'PropertyValue', name: 'Kolor', value: input.colorName },
      /* Papier metaliczny i perłowy ma niżej własny wiersz „Wykończenie" —
         nie deklarujemy przy nim barwienia na wylot, bo tej cechy nie da się
         dla nich potwierdzić. Reszta palety, z papierem eko włącznie, dostaje
         ten wiersz jak dotąd. */
      ...(surfaceFinish
        ? []
        : [{ '@type': 'PropertyValue', name: 'Barwienie papieru', value: 'W masie, na wylot' }]),
      ...(weight
        ? [{ '@type': 'PropertyValue', name: 'Gramatura papieru', value: weight }]
        : []),
      ...(input.finish
        ? [{ '@type': 'PropertyValue', name: 'Wykończenie', value: input.finish }]
        : []),
      { '@type': 'PropertyValue', name: 'Okienko adresowe', value: 'Brak' },
    ],
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: DEFAULT_PRICING.base[input.format].toFixed(2),
      priceValidUntil: PRICE_VALID_UNTIL,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysPlain,
        max: DEFAULT_PRICING.leadDaysPlain,
      }),
      /* Koperta gładka w dowolnym kolorze podlega odstąpieniu na zasadach
         ogólnych — dopiero nadruk czyni z niej rzecz wykonaną na zamówienie. */
      hasMerchantReturnPolicy: plainReturnPolicy(),
      seller: organizationRef,
    },
  };
}

/**
 * ItemList formatów kopert — DL, C6 i K4 z wymiarami i statusem dostępności.
 *
 * Celowo **bez** zagnieżdżonych typów `Product` i bez `Offer` dla C6 i K4.
 * Format ze statusem „Dostępne wkrótce" opisany jako produkt z ofertą byłby
 * deklaracją sprzedaży czegoś, czego konfigurator nie przyjmuje — to wprost
 * ostrzeżenie w Search Console i rozjazd z katalogiem (pkt 4.10 briefu).
 * Lista niesie sam komplet faktów: nazwę, wymiary i status.
 */
export function envelopeFormatsJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Formaty kopert w Envelopes — wymiary i dostępność',
    description: `Porównanie formatów kopert oferowanych przez Envelopes. W sprzedaży jest format DL ${FORMAT_MAP.DL.dimensions}. Pozostałe formaty mają status „Dostępne wkrótce".`,
    numberOfItems: FORMATS.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: FORMATS.map((format, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `Koperta ${format.id} ${format.dimensions}`,
      description: `Wymiary ${format.dimensions}. ${format.audience} Status w katalogu Envelopes: ${format.disabled ? 'Dostępne wkrótce' : 'dostępna w sprzedaży'}.`,
    })),
  };
}

/**
 * Product + Offer dla filara „Personalizowane koperty" (/koperty-personalizowane).
 *
 * Świadomie `Product`, a nie `Service`. Klient nie kupuje usługi
 * adresowania w oderwaniu od towaru — kupuje kopertę DL z nadrukowanymi
 * danymi odbiorcy, którą wysyłamy kurierem. Cena, MOQ i dostawa dotyczą
 * sztuki produktu, więc `Service` bez `price` za sztukę byłby sygnałem
 * niezgodnym z tym, co widzi użytkownik w konfiguratorze i na fakturze.
 *
 * Cena to koperta + personalizacja, liczone z `DEFAULT_PRICING`.
 * `image` łączy zdjęcia produktowe z `public/images/personalized/` z kadrami
 * aranżacyjnymi z `public/images/zastosowania/` — te drugie pokazują realny
 * układ nadrukowanych danych na kopercie, czego kadr na białym tle nie niesie.
 */
export function personalizedEnvelopeProductJsonLd() {
  const unitPrice = round2(DEFAULT_PRICING.base.DL + DEFAULT_PRICING.personalization);
  const url = `${SITE_URL}/koperty-personalizowane`;
  const images = [
    ...COLORS.filter((color) => color.personalizedImages?.DL)
      .slice(0, 6)
      .map((color) => `${SITE_URL}${color.personalizedImages?.DL}`),
    ...PERSONALIZATION_SHOTS.map((shot) => `${SITE_URL}${showcaseSrc(shot)}`),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: 'Personalizowane koperty DL z adresowaniem',
    description: `Koperta DL ${FORMAT_MAP.DL.dimensions} z personalizacją, czyli nadrukiem indywidualnych danych odbiorcy: imienia i nazwiska, pełnego adresu albo dedykacji. Dostępna w ${COLORS.length} kolorach papieru ozdobnego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk, realizacja ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni w trybie ekspresowym.`,
    brand: brandRef,
    sku: SKU.personalization,
    category: 'Koperty personalizowane z adresowaniem',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: unitPrice.toFixed(2),
      priceValidUntil: PRICE_VALID_UNTIL,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithPrint,
        unitCode: 'C62',
      },
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysExpress,
        max: DEFAULT_PRICING.leadDaysStandard,
      }),
      hasMerchantReturnPolicy: customReturnPolicy(),
      seller: organizationRef,
    },
  };
}

/**
 * Product + AggregateOffer dla filara „Koperty na vouchery" (/koperty-na-vouchery).
 *
 * Widełki zamiast pojedynczej ceny są tu decyzją merytoryczną, nie stylistyczną.
 * Bon pakuje się w trzech konfiguracjach i wszystkie trzy są realne: koperta
 * gładka w kolorze marki, koperta z nadrukiem logo oraz koperta z logo
 * i imieniem obdarowanego. Podanie jednej ceny wymagałoby wybrania jednej
 * z nich i przemilczenia dwóch pozostałych.
 *
 * Rozgraniczenie z sąsiadami: `productJsonLd()` na `/` opisuje cały katalog
 * (widełki do 9,06 zł, bo obejmują dopłatę ekspresową), a
 * `printedEnvelopeProductJsonLd()` na F1 — jedną konfigurację z nadrukiem
 * (4,57 zł). Tutaj zakres jest węższy niż na `/` i szerszy niż na F1, bo
 * odpowiada zestawowi konfiguracji sensownych pod voucher. Ekspres do widełek
 * nie wchodzi: to opcja terminu, a nie wariant produktu.
 */
export function voucherEnvelopeProductJsonLd() {
  const lowPrice = DEFAULT_PRICING.base.DL;
  const highPrice = round2(
    DEFAULT_PRICING.base.DL + DEFAULT_PRICING.print + DEFAULT_PRICING.personalization
  );
  const url = `${SITE_URL}/koperty-na-vouchery`;
  const images = COLORS.filter((color) => color.printImages?.DL)
    .slice(0, 6)
    .map((color) => `${SITE_URL}${color.printImages?.DL}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: 'Koperty DL na vouchery i bony podarunkowe',
    description: `Koperty ozdobne DL ${FORMAT_MAP.DL.dimensions} do pakowania bonów podarunkowych i voucherów na usługi. Voucher drukowany na jednej trzeciej arkusza A4, czyli 99 × 210 mm, wchodzi płasko, bez zaginania. Dostępne w ${COLORS.length} kolorach, opcjonalnie z nadrukiem logo firmy i z imieniem obdarowanego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk przy nadruku, ${DEFAULT_PRICING.moqWithoutPrint} sztuka bez nadruku.`,
    brand: brandRef,
    category: 'Koperty na vouchery i bony podarunkowe',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      offerCount: COLORS.length,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysPlain,
        max: DEFAULT_PRICING.leadDaysStandard,
      }),
      /* Bez `hasMerchantReturnPolicy` i bez `sku` — z tego samego powodu co
         na `/`: widełki obejmują kopertę gładką i kopertę z nadrukiem, a te
         dwie różnią się prawem odstąpienia. */
      seller: organizationRef,
    },
  };
}

/**
 * Product + AggregateOffer dla filara „Koperty premium" (/koperty-premium) — klaster K6.
 *
 * Reprezentuje ofertę kopert ozdobnych klasy premium: gramatury 115–140 g/m²,
 * barwienie w masie, szlachetne wykończenia perłowe i metaliczne bez dopłaty,
 * brak okienka foliowego i silny pasek samoprzylepny HK.
 *
 * Widełki cenowe obejmują opcje: koperta gładka (${formatPrice(DEFAULT_PRICING.base.DL)}),
 * z nadrukiem logo (+${formatPrice(DEFAULT_PRICING.print)}) oraz z personalizacją (+${formatPrice(DEFAULT_PRICING.personalization)}).
 */
export function premiumEnvelopeProductJsonLd() {
  const lowPrice = DEFAULT_PRICING.base.DL;
  const highPrice = round2(
    DEFAULT_PRICING.base.DL + DEFAULT_PRICING.print + DEFAULT_PRICING.personalization
  );
  const url = `${SITE_URL}/koperty-premium`;
  const images = [
    ...COLORS.filter(
      (color) =>
        color.finish === 'metaliczne' ||
        color.finish === 'perłowe' ||
        color.weight === '140g' ||
        color.id === 'czarny' ||
        color.id === 'granatowy'
    )
      .slice(0, 6)
      .map((color) => `${SITE_URL}${color.images?.DL}`),
    ...INDUSTRY_SHOTS.slice(0, 4).map((shot) => `${SITE_URL}${showcaseSrc(shot)}`),
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: 'Eleganckie koperty premium DL 110 × 220 mm',
    description: `Koperty ozdobne premium DL ${FORMAT_MAP.DL.dimensions} o gramaturze 115–140 g/m² z papieru barwionego w masie oraz z wykończeniem perłowym i metalicznym. Bez okienka adresowego, z paskiem samoprzylepnym HK. Dostępne w ${COLORS.length} kolorach w równej cenie, z opcjonalnym nadrukiem logo i personalizacją od ${DEFAULT_PRICING.moqWithPrint} sztuk.`,
    brand: brandRef,
    category: 'Eleganckie koperty premium',
    material: 'Papier ozdobny 115–140 g/m², wykończenia perłowe i metaliczne, barwienie w masie',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: lowPrice.toFixed(2),
      highPrice: highPrice.toFixed(2),
      offerCount: COLORS.length,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      shippingDetails: shippingDetails({
        min: DEFAULT_PRICING.leadDaysPlain,
        max: DEFAULT_PRICING.leadDaysStandard,
      }),
      seller: organizationRef,
    },
  };
}

/**
 * AboutPage dla `/o-nas` — strona, której encją główną jest **firma**,
 * a nie produkt.
 *
 * Wszystkie pozostałe bloki w tym pliku opisują kopertę i odwołują się do
 * węzła firmy jako do sprzedawcy. Tutaj kierunek jest odwrotny: `mainEntity`
 * wskazuje wprost na `#organization`, więc wyszukiwarka i model językowy
 * dostają jednoznaczną informację, że opis marki i sposobu jej pracy na tej
 * stronie dotyczy **tego samego podmiotu**, który sprzedaje na `/`.
 * Bez tego powiązania strona „O nas" jest dla parsera anonimowym tekstem.
 *
 * Świadomie **bez** `Product`, `Offer`, `HowTo` i `FAQPage`: strona nie
 * sprzedaje konfiguracji, nie opisuje procesu zamówienia i nie odpowiada na
 * pytania szczegółowe — te dane mają swoich właścicieli na `/`, F1, F2 i F3,
 * a powielenie ich tutaj tworzyłoby drugi adres konkurujący o ten sam wynik
 * rozszerzony.
 */
export function aboutPageJsonLd(input: { description: string; image: string }) {
  const url = `${SITE_URL}/o-nas`;

  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${url}#webpage`,
    url,
    name: 'O nas — marka kopert ozdobnych dla firm',
    description: input.description,
    inLanguage: 'pl-PL',
    isPartOf: { '@id': WEBSITE_ID },
    breadcrumb: { '@id': breadcrumbId('/o-nas') },
    about: organizationRef,
    mainEntity: organizationRef,
    publisher: organizationRef,
    ...(pageUpdated('/o-nas') ? { dateModified: pageUpdated('/o-nas') } : {}),
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${input.image}`,
      width: 1200,
      height: 630,
    },
  };
}

/** HowTo — proces zamówienia opisany krok po kroku (pkt 8.3, GEO pkt 6.6). */
export function howToJsonLd(input: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    inLanguage: 'pl-PL',
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function articleJsonLd(post: BlogPost) {
  const showcaseImage = post.showcaseFile
    ? `${SITE_URL}${showcaseSrc(shotByFile(post.showcaseFile))}`
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.lead,
    /* Obraz wyróżniający jest w wytycznych Google warunkiem wyniku
       rozszerzonego dla `Article`. Wskazujemy zdjęcie aranżacyjne z zastosowania
       lub dedykowany kadr OG. */
    image: [
      ...(showcaseImage ? [showcaseImage] : []),
      `${SITE_URL}${ogImage(post.ogImageSlug ?? 'blog', post.title).url}`,
    ],
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    /* Autor i wydawca to ten sam węzeł firmy, który renderuje `layout.tsx` —
       logo, dane rejestrowe i adres stoją tam raz, zamiast być powtarzane
       (i rozjeżdżać się) w każdym wpisie. */
    author: organizationRefNamed,
    publisher: organizationRefNamed,
    mainEntityOfPage: { '@id': webPageId(`/blog/${post.slug}`) },
    articleSection: post.category,
    inLanguage: 'pl-PL',
  };
}

/* ── Węzeł strony ────────────────────────────────────────── */

/** `@id` węzła strony — jeden adres, pod który podpina się wszystko na trasie. */
export function webPageId(path: string): string {
  return `${SITE_URL}${path}#webpage`;
}

/**
 * `@id` węzła produktu na danej trasie — ten sam wzorzec, który każdy blok
 * `Product` nadaje sobie sam. Strona podaje go w `mainEntity`, żeby powiedzieć
 * wprost, o czym jest, zamiast zostawiać to domysłowi parsera.
 */
export function productId(path: string): string {
  return `${SITE_URL}${path}#product`;
}

/** `@id` węzła artykułu — temat strony wpisu blogowego. */
export function articleId(slug: string): string {
  return `${SITE_URL}/blog/${slug}#article`;
}

/** `@id` węzła okruszków tej samej trasy. */
function breadcrumbId(path: string): string {
  return `${SITE_URL}${path}#breadcrumb`;
}

/**
 * `WebPage` — węzeł samej strony, czyli brakujące spoiwo grafu.
 *
 * Do tej pory każda trasa wysyłała zestaw bloków stojących obok siebie bez
 * żadnego powiązania: `Product` opisywał towar, `BreadcrumbList` ścieżkę,
 * `FAQPage` pytania — i nic nie mówiło, że to **jedna strona**, że należy ona
 * do tego serwisu i że jej tematem jest właśnie ten produkt. Parser musiał
 * się tego domyślać z adresu. Ten węzeł mówi to wprost, a `@id` pozwala
 * pozostałym blokom się do niego odwołać zamiast powtarzać dane.
 *
 * Największy zysk jest po stronie modeli generatywnych, nie wyników
 * rozszerzonych: `WebPage` żadnej gwiazdki w SERP-ie nie dodało i nie doda.
 * Model, który odpowiada na pytanie o koperty, dostaje natomiast czytelne
 * „ta strona należy do sklepu Envelopes i jest o tym produkcie" — zamiast
 * kilku anonimowych fragmentów do sklejenia na własną odpowiedzialność.
 *
 * `dateModified` schodzi z rejestru w `page-updated.ts`, czyli z tego samego
 * miejsca co `lastmod` w sitemapie. Data podana tu i tam musi być ta sama:
 * dwie różne odpowiedzi na to samo pytanie są sygnałem gorszym niż brak
 * drugiej. Trasy spoza rejestru (wpisy blogowe) podają datę wprost.
 *
 * Bloków `FAQPage` i `HowTo` świadomie **nie** podpinamy pod ten węzeł.
 * Zostają samodzielne, tak jak były — wciągnięcie ich tutaj wymagałoby nadania
 * stronie drugiego typu i byłoby przebudową działających bloków bez zysku.
 */
export function webPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  /**
   * Podtyp strony. `ItemPage` dla trasy opisującej jeden produkt,
   * `CollectionPage` dla listy, `ContactPage` dla kontaktu — typ ogólny
   * niesie mniej niż ten, który parser potrafi wykorzystać.
   */
  type?: 'WebPage' | 'ItemPage' | 'CollectionPage' | 'ContactPage';
  /** Ścieżka względna do kadru wyróżniającego — rozwijana do adresu bezwzględnego. */
  image?: string;
  /** `@id` węzła, który jest tematem strony — zwykle `Product` z tej samej trasy. */
  mainEntityId?: string;
  /** Czy trasa renderuje okruszki — wtedy węzeł wskazuje na ich blok. */
  breadcrumb?: boolean;
  datePublished?: string;
  dateModified?: string;
}) {
  const url = `${SITE_URL}${input.path}`;
  const modified = input.dateModified ?? pageUpdated(input.path);

  return {
    '@context': 'https://schema.org',
    '@type': input.type ?? 'WebPage',
    '@id': webPageId(input.path),
    url,
    name: input.name,
    description: input.description,
    inLanguage: 'pl-PL',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: organizationRef,
    ...(input.mainEntityId ? { mainEntity: { '@id': input.mainEntityId } } : {}),
    ...(input.breadcrumb ? { breadcrumb: { '@id': breadcrumbId(input.path) } } : {}),
    ...(input.image
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: `${SITE_URL}${input.image}`,
          },
        }
      : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  /* Ostatnia pozycja ścieżki to zawsze strona bieżąca, więc `@id` węzła
     wyprowadzamy z niej — zamiast prosić każde wywołanie o powtórzenie adresu,
     który już przekazało. Dzięki temu `WebPage.breadcrumb` ma na co wskazać. */
  const path = items[items.length - 1]?.url ?? '/';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': breadcrumbId(path),
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/** Metadane dla stron prywatnych/przejściowych — poza indeksem (pkt 8.3). */
export const noindexMetadata = {
  robots: { index: false, follow: false },
};
