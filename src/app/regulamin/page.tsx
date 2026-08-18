import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { TERMS } from '@/lib/legal';
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Regulamin sklepu',
  description: TERMS.description,
  alternates: { canonical: '/regulamin' },
};

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/regulamin',
          name: String(metadata.title),
          description: String(metadata.description),
          breadcrumb: true,
          /* Dokument prawny niesie własną datę obowiązywania — ta sama, którą
             sitemapa podaje jako `lastmod`. Rejestr `page-updated.ts` tych
             tras nie obejmuje i obejmować nie powinien. */
          dateModified: TERMS.updated,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Regulamin', url: '/regulamin' },
        ])}
      />
      <LegalPage
        document={TERMS}
        pdfHref="/api/dokumenty/regulamin"
        extraActions={
          <a className="btn btn-secondary" href="/api/dokumenty/odstapienie">
            Formularz odstąpienia (PDF)
          </a>
        }
      />
    </>
  );
}
