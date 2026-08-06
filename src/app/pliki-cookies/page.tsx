import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { CookieSettingsButton } from '@/components/legal/CookieSettingsButton';
import { JsonLd } from '@/components/seo/JsonLd';
import { COOKIES } from '@/lib/legal';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pliki Cookies',
  description: COOKIES.description,
  alternates: { canonical: '/pliki-cookies' },
};

export default function CookiesPage() {
  return (
    <>
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
