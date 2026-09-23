import { formatBytes } from '@/components/ui/FileDropzone';
import { printSides } from '@/lib/print-sides';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Szczegóły nadruku z podziałem na strony — przód i zamknięcie — w panelu
 * klienta i w panelu Admina. Każda strona ma własny nagłówek, więc grafik
 * nie musi zgadywać, który plik idzie na klapkę, a klient widzi dokładnie to,
 * co zamówił.
 */
export function PrintSidesDetail({
  config,
  fileActionLabel,
}: {
  config: EnvelopeConfig;
  /** „Podgląd" u klienta, „Pobierz" u Admina */
  fileActionLabel: string;
}) {
  const sides = printSides(config);
  if (sides.length === 0) return null;

  return (
    <div className="print-spec-list">
      {sides.map((spec) => (
        <div className="print-spec" key={spec.side}>
          <p className="small" style={{ margin: 0 }}>
            <strong>{spec.label}</strong>
            {spec.files.length === 0 && <span className="muted"> — {spec.summary}</span>}
          </p>

          {spec.files.map((file) => (
            <div className="file-card" key={file.id}>
              <span className="file-icon" aria-hidden="true">
                {file.ext}
              </span>
              <span className="file-meta">
                <span className="file-name">{file.name}</span>
                <span className="mono-sm muted">{formatBytes(file.size)}</span>
              </span>
              {file.url && (
                <a className="btn btn-secondary btn-sm" href={file.url} target="_blank" rel="noreferrer">
                  {fileActionLabel}
                </a>
              )}
            </div>
          ))}

          {spec.notes && (
            <p className="small muted" style={{ margin: 0 }}>
              Uwagi dla grafika: {spec.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
