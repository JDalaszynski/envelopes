'use client';

import { PRINT_FILE_EXTENSIONS, PRINT_FILE_MAX_BYTES, PRINT_FILE_MAX_COUNT } from '@/lib/catalog';
import { DEFAULT_PRICING, formatPrice } from '@/lib/pricing';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Toggle } from '@/components/ui/Toggle';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import type { UploadedFile } from '@/lib/types';

/** Nadruk (pkt 1.4) — część wspólnego kroku z personalizacją. */
export function StepPrint({
  enabled,
  files,
  notes,
  quantity,
  minimum,
  onToggle,
  onFilesChange,
  onNotesChange,
  onFixQuantity,
  format,
  colorId,
}: {
  enabled: boolean;
  files: UploadedFile[];
  notes: string;
  quantity: number;
  minimum: number;
  onToggle: (value: boolean) => void;
  onFilesChange: (files: UploadedFile[]) => void;
  onNotesChange: (notes: string) => void;
  onFixQuantity: () => void;
  format: string;
  colorId: string;
}) {
  const belowMinimum = enabled && quantity < minimum;

  return (
    <div className="stack">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div
          style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', cursor: 'pointer', flex: 1 }}
          onClick={() => onToggle(!enabled)}
          role="button"
          tabIndex={0}
          aria-pressed={enabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggle(!enabled);
            }
          }}
        >
          <div style={{ width: 144, flexShrink: 0 }}>
            {format && colorId ? (
              <EnvelopePlaceholder format={format} colorId={colorId} ratio="square" size="lg" hideCaption hasPrint />
            ) : (
              <svg width="144" height="144" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-soft)', background: 'var(--color-paper)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-line)', flexShrink: 0 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </div>
          <div>
            <h4>Logo na Kopertach (lub dowolny nadruk)</h4>
            <div style={{ margin: 'var(--space-1) 0 var(--space-2)' }}>
              <strong style={{ display: 'block', color: 'var(--color-ink)' }}>+ {formatPrice(DEFAULT_PRICING.print)} brutto / szt.</strong>
              <span className="small muted">minimalna ilość {minimum} szt.</span>
            </div>
            <p className="small muted" style={{ margin: 0, maxWidth: '54ch' }}>
              Dowolna grafika lub logo nadrukowane na kopercie.
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label="Nadruk" />
      </div>

      {enabled && (
        <>
          {belowMinimum && (
            <p className="notice notice-error" role="alert">
              Wybrana ilość ({quantity} szt.) jest niższa niż minimum {minimum} szt. dla nadruku.{' '}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'var(--space-2)' }}
                onClick={onFixQuantity}
              >
                Ustaw {minimum} szt.
              </button>
            </p>
          )}

          <FileDropzone
            files={files}
            onChange={onFilesChange}
            accept={PRINT_FILE_EXTENSIONS}
            maxFiles={PRINT_FILE_MAX_COUNT}
            maxBytes={PRINT_FILE_MAX_BYTES}
            purpose="nadruk"
            label="Prześlij pliki do nadruku"
          />

          <div className="field">
            <label htmlFor="print-notes">Uwagi dla grafika</label>
            <textarea
              id="print-notes"
              className="textarea"
              value={notes}
              placeholder="Np. logo koloru białego na środku"
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
