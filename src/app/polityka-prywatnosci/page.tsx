import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRIVACY } from '@/lib/legal';
import { CONTACT_DETAILS } from '@/lib/orders';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Polityka Prywatności',
  description: PRIVACY.description,
  alternates: { canonical: '/polityka-prywatnosci' },
};

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/polityka-prywatnosci',
          name: String(metadata.title),
          description: String(metadata.description),
          breadcrumb: true,
          /* Dokument prawny niesie własną datę obowiązywania — ta sama, którą
             sitemapa podaje jako `lastmod`. Rejestr `page-updated.ts` tych
             tras nie obejmuje i obejmować nie powinien. */
          dateModified: PRIVACY.updated,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Polityka Prywatności', url: '/polityka-prywatnosci' },
        ])}
      />
      <LegalPage
        document={PRIVACY}
        footer={
          <p className="notice" style={{ marginTop: 'var(--space-6)' }}>
            Zasady stosowania plików cookies opisuje odrębny dokument —{' '}
            <Link href="/pliki-cookies">Polityka Cookies</Link>. W sprawach ochrony danych prosimy o
            kontakt:{' '}
            <a href={`mailto:${CONTACT_DETAILS.email}`}>{CONTACT_DETAILS.email}</a>.
          </p>
        }
      />
    </>
  );
}
