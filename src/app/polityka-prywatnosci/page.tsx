import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage } from '@/components/legal/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { PRIVACY } from '@/lib/legal';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Polityka Prywatności',
  description: PRIVACY.description,
  alternates: { canonical: '/polityka-prywatnosci' },
};

export default function PrivacyPage() {
  return (
    <>
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
            kontakt: <a href="mailto:iod@envelopes.pl">iod@envelopes.pl</a>.
          </p>
        }
      />
    </>
  );
}
