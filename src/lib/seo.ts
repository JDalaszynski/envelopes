import { CONTACT_DETAILS } from './orders';
import { DEFAULT_PRICING } from './pricing';
import { FORMATS } from './catalog';
import type { BlogPost } from './blog';

/** Dane strukturalne JSON-LD (pkt 8.3). */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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

export function productJsonLd() {
  const prices = FORMATS.filter((f) => !f.hidden).map((f) => DEFAULT_PRICING.base[f.id]);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Koperty ozdobne Envelopes',
    description:
      'Koperty ozdobne w formatach DL (110 × 220 mm), C6 (114 × 162 mm) i K4 (155 × 155 mm), dostępne w 19 kolorach. Opcjonalny nadruk firmowy i adresowanie kopert.',
    brand: { '@type': 'Brand', name: 'Envelopes' },
    category: 'Koperty ozdobne',
    url: `${SITE_URL}/#konfigurator`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: FORMATS.filter((f) => !f.hidden).length,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Envelopes' },
    },
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
