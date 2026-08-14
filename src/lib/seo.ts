import { CONTACT_DETAILS } from './orders';
import { DEFAULT_PRICING, DELIVERY_COST, round2 } from './pricing';
import { AVAILABLE_FORMATS, COLORS, FORMAT_MAP } from './catalog';
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
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://envelopes.pl';

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
 * widoczną dla użytkownika. `image` wskazuje wyłącznie na realne zdjęcia
 * kopert z nadrukiem z `public/images/prints/`.
 */
export function printedEnvelopeProductJsonLd() {
  const unitPrice = round2(DEFAULT_PRICING.base.DL + DEFAULT_PRICING.print);
  const url = `${SITE_URL}/koperty-z-nadrukiem`;
  const images = COLORS.filter((color) => color.printImages?.DL)
    .slice(0, 6)
    .map((color) => `${SITE_URL}${color.printImages?.DL}`);

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
