import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { TERMS } from '@/lib/legal';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Regulamin sklepu',
  description: TERMS.description,
  alternates: { canonical: '/regulamin' },
};

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Regulamin', url: '/regulamin' },
        ])}
      />
      <LegalPage document={TERMS} pdfHref="/api/dokumenty/regulamin" />
    </>
  );
}
