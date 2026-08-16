import { CONTACT_DETAILS } from './orders';
import { DEFAULT_PRICING, DELIVERY_COST, round2 } from './pricing';
import { AVAILABLE_FORMATS, COLORS, FORMATS, FORMAT_MAP, maxInsertSize } from './catalog';
import { INDUSTRY_SHOTS, PERSONALIZATION_SHOTS, showcaseSrc } from './showcase';
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

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Envelopes',
    legalName: CONTACT_DETAILS.company,
    url: SITE_URL,
    description:
      'Producent i dystrybutor kopert ozdobnych z nadrukiem firmowym i adresowaniem. Formaty DL, C6, K4 w 19 kolorach.',
    telephone: CONTACT_DETAILS.phoneHref,
    email: CONTACT_DETAILS.email,
    taxID: CONTACT_DETAILS.nip,
    vatID: `PL${CONTACT_DETAILS.nip}`,
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
 * WebSite — encja serwisu dla wyszukiwarek i modeli generatywnych (pkt 6.9).
 *
 * Świadomie bez `SearchAction`: w serwisie nie ma wyszukiwarki, więc
 * deklarowanie jej byłoby fałszywym sygnałem i generowałoby ostrzeżenia.
 */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Envelopes',
    alternateName: 'Envelopes — koperty ozdobne',
    url: SITE_URL,
    inLanguage: 'pl-PL',
    description:
      'Sklep z kopertami ozdobnymi DL w 19 kolorach, z nadrukiem logo firmowego i adresowaniem. Wysyłka na terenie Polski.',
    publisher: { '@type': 'Organization', name: 'Envelopes', url: SITE_URL },
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
    name: `Koperty ozdobne DL ${FORMAT_MAP.DL.dimensions}`,
    description: `Koperty ozdobne z papieru barwionego w masie, format DL ${FORMAT_MAP.DL.dimensions}, dostępne w ${COLORS.length} kolorach w jednej cenie. Gramatura 115–140 g/m², bez okienka adresowego. Opcjonalny nadruk logo firmowego i personalizacja, czyli nadruk adresu odbiorcy.`,
    brand: { '@type': 'Brand', name: 'Envelopes' },
    category: 'Koperty ozdobne',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url: `${SITE_URL}/#konfigurator`,
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
      shippingDetails: {
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
      },
      seller: { '@type': 'Organization', name: 'Envelopes' },
    },
  };
}

/**
 * ItemList palety kolorów — 19 pozycji wprost z katalogu (GEO pkt 6.6).
 *
 * Pozycje nie mają własnych adresów, bo strony kolorów `/koperty/[kolor]`
 * jeszcze nie istnieją. Zmyślony `url` byłby linkiem do 404, więc podajemy
 * nazwę, zdjęcie i gramaturę — komplet faktów, który model może zacytować.
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
    name: 'Koperty DL z nadrukiem logo firmowego',
    description: `Koperta DL ${FORMAT_MAP.DL.dimensions} z nadrukiem logo firmowego, w 19 kolorach papieru ozdobnego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk, realizacja ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni w trybie ekspresowym.`,
    brand: { '@type': 'Brand', name: 'Envelopes' },
    category: 'Koperty firmowe z nadrukiem',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: unitPrice.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithPrint,
        unitCode: 'C62',
      },
      seller: { '@type': 'Organization', name: 'Envelopes' },
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
    name: `Koperta DL ${dl.dimensions}`,
    description: `Koperta ozdobna w formacie DL o wymiarach ${dl.dimensions}. Papier barwiony w masie 115–140 g/m², bez okienka adresowego. Mieści kartkę A4 złożoną na trzy (99 × 210 mm) oraz voucher w tym samym wymiarze. Największa wkładka: ${maxInsert.short} × ${maxInsert.long} mm. Dostępna w ${COLORS.length} kolorach w jednej cenie.`,
    brand: { '@type': 'Brand', name: 'Envelopes' },
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
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithoutPrint,
        unitCode: 'C62',
      },
      shippingDetails: {
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
      },
      seller: { '@type': 'Organization', name: 'Envelopes' },
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
    name: 'Personalizowane koperty DL z adresowaniem',
    description: `Koperta DL ${FORMAT_MAP.DL.dimensions} z personalizacją, czyli nadrukiem indywidualnych danych odbiorcy: imienia i nazwiska, pełnego adresu albo dedykacji. Dostępna w ${COLORS.length} kolorach papieru ozdobnego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk, realizacja ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni w trybie ekspresowym.`,
    brand: { '@type': 'Brand', name: 'Envelopes' },
    category: 'Koperty personalizowane z adresowaniem',
    material: 'Papier ozdobny 115–140 g/m²',
    size: FORMAT_MAP.DL.dimensions,
    image: images,
    url,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PLN',
      price: unitPrice.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url,
      areaServed: 'PL',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: DEFAULT_PRICING.moqWithPrint,
        unitCode: 'C62',
      },
      shippingDetails: {
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
      },
      seller: { '@type': 'Organization', name: 'Envelopes' },
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
    name: 'Koperty DL na vouchery i bony podarunkowe',
    description: `Koperty ozdobne DL ${FORMAT_MAP.DL.dimensions} do pakowania bonów podarunkowych i voucherów na usługi. Voucher drukowany na jednej trzeciej arkusza A4, czyli 99 × 210 mm, wchodzi płasko, bez zaginania. Dostępne w ${COLORS.length} kolorach, opcjonalnie z nadrukiem logo firmy i z imieniem obdarowanego. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk przy nadruku, ${DEFAULT_PRICING.moqWithoutPrint} sztuka bez nadruku.`,
    brand: { '@type': 'Brand', name: 'Envelopes' },
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
      shippingDetails: {
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
      },
      seller: { '@type': 'Organization', name: 'Envelopes' },
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.lead,
    /* Obraz wyróżniający jest w wytycznych Google warunkiem wyniku
       rozszerzonego dla `Article`. Wskazujemy ten sam kadr, który idzie
       w `og:image`, żeby wynik wyszukiwania i podgląd odnośnika pokazywały
       jedno zdjęcie; wpis bez własnego kadru dziedziczy zbiorczy obraz bloga.
       Adres bezwzględny, bo dane strukturalne nie mają `metadataBase`. */
    image: [`${SITE_URL}${ogImage(post.ogImageSlug ?? 'blog', post.title).url}`],
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Organization', name: 'Envelopes' },
    publisher: {
      '@type': 'Organization',
      name: 'Envelopes',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    articleSection: post.category,
    inLanguage: 'pl-PL',
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
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
