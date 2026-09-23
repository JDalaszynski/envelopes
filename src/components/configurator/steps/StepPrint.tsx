'use client';

import { useId } from 'react';

import { PRINT_FILE_EXTENSIONS, PRINT_FILE_MAX_BYTES, PRINT_FILE_MAX_COUNT } from '@/lib/catalog';
import { DEFAULT_PRICING, formatPrice } from '@/lib/pricing';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import type { EnvelopeConfig, UploadedFile } from '@/lib/types';

/**
 * Nadruk (pkt 1.4) — część wspólnego kroku z personalizacją.
 *
 * Nadruk ma dwa miejsca: przód koperty i zamknięcie (klapkę z tyłu). To jedna
 * usługa z pytaniem „gdzie?", a nie dwie osobne usługi, dlatego sekcja zaczyna
 * się od dwóch kafli z kadrem pokazującym pole nadruku. Kafle są polami
 * wyboru, nie radiami: obie strony można zaznaczyć razem, a każda kosztuje
 * tyle samo i liczy się osobno.
 *
 * Każda zaznaczona strona dostaje pod kaflami własny, identyczny panel:
 * plik z grafiką i uwagi dla grafika.
 */
export function StepPrint({
  config,
  minimum,
  onChange,
}: {
  config: EnvelopeConfig;
  minimum: number;
  onChange: (changes: Partial<EnvelopeConfig>) => void;
}) {
  const uid = useId();
  const front = config.print;
  const back = Boolean(config.backPrint);
  const belowMinimum = (front || back) && config.quantity < minimum;

  return (
    <div className="stack print-step">
      <div className="print-intro">
        <h4>Nadruk logo lub grafiki</h4>
        <p className="small muted">
          Ten sam projekt na każdej kopercie. Wybierz miejsce — przód, zamknięcie albo obie strony.
          Minimalna ilość {minimum} szt.
        </p>
      </div>

      <div className="print-sides" role="group" aria-label="Miejsce nadruku">
        <SideTile
          id={`${uid}-przod`}
          checked={front}
          onChange={(print) =>
            onChange({ print, ...(print ? {} : { printFiles: [], printNotes: '' }) })
          }
          title="Przód koperty"
          image={
            <EnvelopePlaceholder
              as="span"
              format={config.format}
              colorId={config.color}
              ratio="wide"
              fit="cover"
              hideCaption
              hasPrint
              sizes="(max-width: 620px) 50vw, 360px"
            />
          }
        />
        <SideTile
          id={`${uid}-zamkniecie`}
          checked={back}
          onChange={(backPrint) =>
            onChange({
              backPrint,
              ...(backPrint ? {} : { backPrintFiles: [], backPrintNotes: '' }),
            })
          }
          title="Zamknięcie"
          tag="tył koperty"
          image={
            <EnvelopePlaceholder
              as="span"
              format={config.format}
              colorId={config.color}
              ratio="wide"
              fit="cover"
              hideCaption
              hasFlapPrint
              sizes="(max-width: 620px) 50vw, 360px"
            />
          }
        />
      </div>

      {belowMinimum && (
        <p className="notice notice-error" role="alert">
          Wybrana ilość ({config.quantity} szt.) jest niższa niż minimum {minimum} szt. dla nadruku.{' '}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 'var(--space-2)' }}
            onClick={() => onChange({ quantity: minimum })}
          >
            Ustaw {minimum} szt.
          </button>
        </p>
      )}

      {front && (
        <SidePanel
          id={`${uid}-przod-panel`}
          tag="Przód"
          title="Grafika na przód koperty"
          files={config.printFiles}
          notes={config.printNotes ?? ''}
          notesPlaceholder="Np. logo koloru białego na środku"
          onFilesChange={(printFiles) => onChange({ printFiles })}
          onNotesChange={(printNotes) => onChange({ printNotes })}
        />
      )}

      {back && (
        <SidePanel
          id={`${uid}-zamkniecie-panel`}
          tag="Zamknięcie"
          title="Grafika na zamknięcie koperty"
          files={config.backPrintFiles ?? []}
          notes={config.backPrintNotes ?? ''}
          notesPlaceholder="Np. małe logo przy szpicu klapki"
          onFilesChange={(backPrintFiles) => onChange({ backPrintFiles })}
          onNotesChange={(backPrintNotes) => onChange({ backPrintNotes })}
        />
      )}
    </div>
  );
}

/**
 * Kafel miejsca nadruku. Cały kafel jest etykietą ukrytego pola wyboru, ale
 * nazwę dostępną składamy tylko z tytułu i ceny — inaczej czytnik ekranu
 * odczytywałby przy każdym przełączeniu także opis zdjęcia.
 */
function SideTile({
  id,
  checked,
  onChange,
  title,
  tag,
  image,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  tag?: string;
  image: React.ReactNode;
}) {
  return (
    <label className="print-side" data-selected={checked}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        aria-labelledby={`${id}-title ${id}-price`}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="print-side-media">{image}</span>
      <span className="print-side-body">
        <span className="print-side-head">
          <span className="print-side-box" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <strong id={`${id}-title`}>
            {title}
            {tag && (
              <>
                {' '}
                <span className="print-side-tag">
                  <span className="print-side-sep" aria-hidden="true">
                    ·{' '}
                  </span>
                  {tag}
                </span>
              </>
            )}
          </strong>
        </span>
        <span className="print-side-price" id={`${id}-price`}>
          + {formatPrice(DEFAULT_PRICING.print)} <span>brutto / szt.</span>
        </span>
      </span>
    </label>
  );
}

/** Panel zaznaczonej strony — plik z grafiką i uwagi dla grafika. */
function SidePanel({
  id,
  tag,
  title,
  files,
  notes,
  notesPlaceholder,
  onFilesChange,
  onNotesChange,
}: {
  id: string;
  tag: string;
  title: string;
  files: UploadedFile[];
  notes: string;
  notesPlaceholder: string;
  onFilesChange: (files: UploadedFile[]) => void;
  onNotesChange: (notes: string) => void;
}) {
  return (
    <section className="print-panel" aria-labelledby={id}>
      <h5 className="print-panel-title" id={id}>
        <span className="print-panel-tag">{tag}</span>
        {title}
      </h5>

      <FileDropzone
        files={files}
        onChange={onFilesChange}
        accept={PRINT_FILE_EXTENSIONS}
        maxFiles={PRINT_FILE_MAX_COUNT}
        maxBytes={PRINT_FILE_MAX_BYTES}
        purpose="nadruk"
        label="Załącz grafikę do nadruku"
      />

      <div className="field print-notes-field">
        <label htmlFor={`${id}-uwagi`}>Uwagi dla grafika</label>
        <input
          type="text"
          id={`${id}-uwagi`}
          className="input"
          value={notes}
          placeholder={notesPlaceholder}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </section>
  );
}
