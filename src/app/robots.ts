import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/seo';

/** robots.txt — rozdziela strony publiczne od prywatnych (pkt 8.3). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/koszyk',
          '/zamowienie',
          '/zamowienia',
          '/profil',
          '/logowanie',
          '/rejestracja',
          '/akceptacja',
          '/admin',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
