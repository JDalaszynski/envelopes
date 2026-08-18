import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { CookieSettingsButton } from '@/components/legal/CookieSettingsButton';
import { JsonLd } from '@/components/seo/JsonLd';
import { COOKIES } from '@/lib/legal';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pliki Cookies',
  description: COOKIES.description,
  alternates: { canonical: '/pliki-cookies' },
};

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/pliki-cookies',
          name: String(metadata.title),
          description: String(metadata.description),
          breadcrumb: true,
          /* Dokument prawny niesie własną datę obowiązywania — ta sama, którą
             sitemapa podaje jako `lastmod`. Rejestr `page-updated.ts` tych
             tras nie obejmuje i obejmować nie powinien. */
          dateModified: COOKIES.updated,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Pliki Cookies', url: '/pliki-cookies' },
        ])}
      />
      <LegalPage document={COOKIES} footer={<CookieSettingsButton />} />
    </>
  );
}
