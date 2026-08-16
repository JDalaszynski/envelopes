'use client';

import { useState } from 'react';

import {
  PERSONALIZATION_SCOPES,
  PERSONALIZATION_SHEET_EXTENSIONS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  personalizationScope,
} from '@/lib/catalog';
import type { PersonalizationScope } from '@/lib/catalog';
import { DEFAULT_PRICING, formatPrice, plural } from '@/lib/pricing';
import { Toggle } from '@/components/ui/Toggle';
import { formatBytes } from '@/components/ui/FileDropzone';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import type { PersonalizationMethod, UploadedFile } from '@/lib/types';

/**
 * Personalizacja / adresowanie (pkt 1.3) — część wspólnego kroku z nadrukiem.
 *
 * Dwa pytania w tej kolejności: **co** ma stanąć na kopercie (pełny adres
 * czy samo nazwisko) i **jak** dane do nas trafią (wpisane ręcznie czy
 * arkuszem). Zakres wybieramy pierwszy, bo to on decyduje o kolumnach
 * szablonu i o tym, czego wymaga walidacja.
 */
export function StepPersonalization({
  enabled,
  scope,
  method,
  text,
  file,
  quantity,
  minimum,
  onToggle,
  onScopeChange,
  onMethodChange,
  onTextChange,
  onFileChange,
  onFixQuantity,
  format,
  colorId,
}: {
  enabled: boolean;
  scope: PersonalizationScope | undefined;
  method: PersonalizationMethod | undefined;
  text: string;
  file: UploadedFile | null;
  quantity: number;
  minimum: number;
  onToggle: (value: boolean) => void;
  onScopeChange: (scope: PersonalizationScope) => void;
  onMethodChange: (method: PersonalizationMethod) => void;
  onTextChange: (text: string) => void;
  onFileChange: (file: UploadedFile | null) => void;
  onFixQuantity: () => void;
  format: string;
  colorId: string;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const belowMinimum = enabled && quantity < minimum;
  const activeScope = personalizationScope(scope);
  const namesOnly = activeScope.id === 'imiona';

  /** Ile wierszy klient wpisał ręcznie — porównanie z nakładem, bez blokowania. */
  const typedRows = text.split('\n').filter((line) => line.trim() !== '').length;

  async function handleTemplateFile(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    setUploadError(null);
    setUploadInfo(null);

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!PERSONALIZATION_SHEET_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Obsługujemy pliki ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL} — prosimy wgrać uzupełniony szablon.`
      );
      return;
    }

    const body = new FormData();
    body.append('file', selected);
    body.append('quantity', String(quantity));
    body.append('zakres', activeScope.id);

    try {
      const res = await fetch('/api/personalizacja/walidacja', { method: 'POST', body });
      const json = (await res.json()) as {
        ok: boolean;
        rows?: number;
        error?: string;
        path?: string;
        url?: string;
      };

      if (!res.ok || !json.ok) {
        setUploadError(json.error ?? 'Nie udało się odczytać pliku.');
        onFileChange({
          id: 'personalizacja',
          name: selected.name,
          size: selected.size,
          ext,
          status: 'blad',
          error: json.error,
        });
        return;
      }

      setUploadInfo(`Wczytano ${json.rows} kompletów danych.`);
      onFileChange({
        id: 'personalizacja',
        name: selected.name,
        size: selected.size,
        ext,
        status: 'przeslano',
        path: json.path,
        url: json.url,
      });
    } catch {
      setUploadError('Błąd połączenia podczas przesyłania pliku.');
    }
  }

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
              <EnvelopePlaceholder format={format} colorId={colorId} ratio="square" size="lg" hideCaption hasPersonalization />
            ) : (
              <svg width="144" height="144" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-soft)', background: 'var(--color-paper)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-line)', flexShrink: 0 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </div>
          <div>
            <h4>Personalizacja Kopert</h4>
            <div style={{ margin: 'var(--space-1) 0 var(--space-2)' }}>
              <strong style={{ display: 'block', color: 'var(--color-ink)' }}>+ {formatPrice(DEFAULT_PRICING.personalization)} brutto / szt.</strong>
              <span className="small muted">minimalna ilość {minimum} szt.</span>
            </div>
            <p className="small muted" style={{ margin: 0, maxWidth: '54ch' }}>
              Nadrukujemy indywidualne dane na każdej kopercie — imię i nazwisko, dedykację albo pełny adres.
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label="Personalizacja" />
      </div>

      {enabled && (
        <>
          {belowMinimum && (
            <p className="notice notice-error" role="alert">
              Wybrana ilość ({quantity} szt.) jest niższa niż minimum {minimum} szt. dla personalizacji.{' '}
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

          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <p className="small muted" style={{ margin: 0 }}>
              Co ma stanąć na kopercie?
            </p>
            <div className="grid grid-2" role="group" aria-label="Zakres personalizacji">
              {PERSONALIZATION_SCOPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="option-card"
                  aria-pressed={activeScope.id === option.id}
                  onClick={() => onScopeChange(option.id)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-seal)' }} aria-hidden="true">
                    {option.id === 'adres' ? (
                      <>
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="M2 7l10 6 10-6"></path>
                      </>
                    ) : (
                      <>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </>
                    )}
                  </svg>
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-2" role="group" aria-label="Metoda przekazania danych">
            <button
              type="button"
              className="option-card"
              aria-pressed={method === 'reczna'}
              onClick={() => onMethodChange('reczna')}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-seal)' }}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              <span>
                <strong>Wpisz ręcznie</strong>
                <small>
                  Treść wpisują Państwo wprost w konfiguratorze. Wygodne przy krótkiej liście.
                </small>
              </span>
            </button>
            <button
              type="button"
              className="option-card"
              aria-pressed={method === 'szablon'}
              onClick={() => onMethodChange('szablon')}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-seal)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>
                <strong>Pobierz i uzupełnij szablon</strong>
                <small>
                  Arkusz z {quantity} wierszami i gotowymi nagłówkami. Uzupełniony plik wgrywają
                  Państwo z powrotem — sprawdzimy go od razu.
                </small>
              </span>
            </button>
          </div>

          {method === 'reczna' && (
            <div className="field">
              <label htmlFor="personalizacja-tekst">Treść do nadrukowania</label>
              <textarea
                id="personalizacja-tekst"
                className="textarea"
                style={{ minHeight: 160 }}
                value={text}
                placeholder={
                  namesOnly
                    ? 'Jedna osoba w wierszu:\nAnna Nowak\nJan Kowalski'
                    : 'Jeden odbiorca w wierszu:\nAnna Nowak, ul. Kwiatowa 4, 00-001 Warszawa'
                }
                onChange={(e) => onTextChange(e.target.value)}
              />
              <span className="field-hint">
                Odtworzymy tekst dokładnie w podanej postaci.
              </span>
              {typedRows > 0 && typedRows !== quantity && (
                <p className="notice" role="status" style={{ marginTop: 'var(--space-2)' }}>
                  Wpisali Państwo {typedRows} {plural(typedRows, 'wiersz', 'wiersze', 'wierszy')}{' '}
                  przy {quantity} kopertach. Jeśli każda koperta ma mieć inne dane, prosimy
                  uzupełnić listę — przy dłuższych wykazach wygodniejszy będzie szablon.
                </p>
              )}
            </div>
          )}

          {method === 'szablon' && (
            <div className="stack">
              <a
                className="btn btn-secondary"
                href={`/api/personalizacja/szablon?ilosc=${quantity}&zakres=${activeScope.id}`}
                style={{ alignSelf: 'flex-start' }}
              >
                Pobierz szablon dla {quantity} kopert (XLSX)
              </a>
              <p className="small muted" style={{ margin: 0 }}>
                Kolumny w szablonie:{' '}
                {activeScope.columns
                  .filter((column) => !column.ordinal)
                  .map((column) => column.label.replace(' (opcjonalnie)', ''))
                  .join(', ')}
                .
              </p>

              <div
                className="dropzone"
                data-drag={dragging}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void handleTemplateFile(e.dataTransfer.files);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-soft)' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  <strong style={{ display: 'block' }}>
                    Wgraj uzupełniony szablon
                  </strong>
                </div>
                <p className="small muted" style={{ margin: 0 }}>
                  Przeciągnij plik albo{' '}
                  <label
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    htmlFor="szablon-input"
                  >
                    wybierz z dysku
                  </label>
                  .
                </p>
                <input
                  id="szablon-input"
                  type="file"
                  className="sr-only"
                  accept={PERSONALIZATION_SHEET_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                  onChange={(e) => void handleTemplateFile(e.target.files)}
                />
              </div>

              {uploadError && (
                <p className="notice notice-error" role="alert">
                  {uploadError}
                </p>
              )}
              {uploadInfo && <p className="notice notice-success">{uploadInfo}</p>}

              {file && (
                <div className="file-card">
                  <span className="file-icon" aria-hidden="true">
                    {file.ext}
                  </span>
                  <span className="file-meta">
                    <span className="file-name">{file.name}</span>
                    <span className="mono-sm muted" style={{ display: 'block' }}>
                      {formatBytes(file.size)}
                    </span>
                  </span>
                  <span
                    className={
                      file.status === 'przeslano' ? 'badge badge-success' : 'badge badge-error'
                    }
                  >
                    {file.status === 'przeslano' ? 'Przesłano' : 'Błąd'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onFileChange(null);
                      setUploadInfo(null);
                      setUploadError(null);
                    }}
                  >
                    Usuń
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
