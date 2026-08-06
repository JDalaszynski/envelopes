import Link from 'next/link';

import { formatDate } from '@/lib/pricing';
import type { LegalDocument } from '@/lib/legal';

/** Wspólny układ stron prawnych: spis treści z kotwicami i data aktualizacji. */
export function LegalPage({
  document,
  pdfHref,
  footer,
}: {
  document: LegalDocument;
  pdfHref?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="section">
      <div className="container container-narrow">
        <nav aria-label="Ścieżka nawigacji" className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
          <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> {document.title}
        </nav>

        <h1>{document.title}</h1>
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
          Data ostatniej aktualizacji: {formatDate(document.updated)}
        </p>
        <p className="hero-lead" style={{ fontSize: 17 }}>
          {document.intro}
        </p>

        {pdfHref && (
          <a className="btn btn-secondary" href={pdfHref} style={{ marginBottom: 'var(--space-6)' }}>
            Pobierz dokument (PDF)
          </a>
        )}

        <nav className="toc" aria-label="Spis treści">
          <strong className="small">Spis treści</strong>
          <ol>
            {document.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((entry, index) => (
                    <li key={index}>{entry}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {footer}
      </div>
    </section>
  );
}
