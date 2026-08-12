import Link from 'next/link';

import { formatDate } from '@/lib/pricing';
import type { LegalDocument, LegalSection } from '@/lib/legal';

/**
 * Wspólny układ stron prawnych: spis treści z kotwicami, data aktualizacji
 * i treść dokumentu.
 *
 * Regulamin ma strukturę paragrafów z numerowanymi ustępami, dlatego sekcje
 * renderujemy jako listy uporządkowane — numeracja „§7 ust. 3” widoczna na
 * stronie musi zgadzać się z odesłaniami w treści i z wersją PDF.
 */
export function LegalPage({
  document,
  pdfHref,
  extraActions,
  footer,
}: {
  document: LegalDocument;
  pdfHref?: string;
  /** Dodatkowe przyciski obok pobierania PDF — np. formularz odstąpienia */
  extraActions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const main = document.sections.filter((section) => !section.annex);
  const annexes = document.sections.filter((section) => section.annex);

  return (
    <section className="section">
      <div className="container container-narrow">
        <nav
          aria-label="Ścieżka nawigacji"
          className="small muted"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> {document.title}
        </nav>

        <h1>{document.title}</h1>
        <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
          Data ostatniej aktualizacji: {formatDate(document.updated)}
        </p>
        <p className="hero-lead" style={{ fontSize: 17 }}>
          {document.intro}
        </p>

        {(pdfHref || extraActions) && (
          <div className="row" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            {pdfHref && (
              <a className="btn btn-secondary" href={pdfHref}>
                Pobierz dokument (PDF)
              </a>
            )}
            {extraActions}
          </div>
        )}

        <nav className="toc" aria-label="Spis treści">
          <strong className="small">Spis treści</strong>
          <ol>
            {main.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
          {annexes.length > 0 && (
            <ul style={{ margin: 'var(--space-3) 0 0', paddingLeft: 'var(--space-5)', fontSize: 14 }}>
              {annexes.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.heading}</a>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="prose">
          {main.map((section) => (
            <Section key={section.id} section={section} />
          ))}

          {annexes.length > 0 && (
            <>
              <hr className="legal-annex-rule" />
              {annexes.map((section) => (
                <Section key={section.id} section={section} />
              ))}
            </>
          )}
        </div>

        {footer}
      </div>
    </section>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section id={section.id}>
      <h2>{section.heading}</h2>

      {section.paragraphs?.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}

      {section.clauses && (
        <ol className="legal-clauses">
          {section.clauses.map((clause, index) => (
            <li key={index}>
              {clause.text}
              {clause.points && (
                <ol className="legal-points">
                  {clause.points.map((point, pointIndex) => (
                    <li key={pointIndex}>{point}</li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}

      {section.list && (
        <ul>
          {section.list.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="table-wrap" style={{ margin: 'var(--space-4) 0' }}>
          <table className="data legal-table">
            <thead>
              <tr>
                {section.table.headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.note && <p className="small muted legal-note">{section.note}</p>}
    </section>
  );
}
