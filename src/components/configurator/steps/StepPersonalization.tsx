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
 * Po włączeniu personalizacji klient ma **jedno** pytanie: wpisuje dane sam
 * czy wgrywa arkusz. Nic więcej nie stoi przed tym wyborem.
 *
 * Zakres (`PersonalizationScope`) nie jest osobnym pytaniem, choć nadal jedzie
 * w zamówieniu — to wybór **wersji pliku do pobrania**, więc ustawia go
 * kliknięcie w jeden z dwóch przycisków pobierania. Przy ręcznym wpisywaniu
 * nie ma go w ogóle, bo tekst drukujemy dokładnie tak, jak został wpisany.
 *
 * Wgrany arkusz trafia prosto do Storage przez `/api/uploads` — bez czytania
 * zawartości. Sprawdzanie kolumn i liczby wierszy odrzucało pliki, które dla
 * człowieka są w porządku (własny układ kolumn, lista dłuższa od nakładu),
 * i zamieniało załączenie pliku w negocjację z walidatorem. Zawartość
 * przeglądamy po stronie zamówienia.
 */

/** Powyżej tej liczby kopert ręczne przepisywanie listy przestaje mieć sens. */
const TEXT_PLACEHOLDER =
  'Anna Nowak,\nJan Kowalski,\nMaria Wiśniewska,\n...';

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
  onSetQuantity,
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
  onSetQuantity: (value: number) => void;
  format: string;
  colorId: string;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const belowMinimum = enabled && quantity < minimum;
  const activeScope = personalizationScope(scope);

  /** Ile wierszy klient wpisał ręcznie — porównanie z nakładem, bez blokowania. */
  const typedRows = text.split('\n').filter((line) => line.trim() !== '').length;

  const uploaded = file?.status === 'przeslano';

  async function handleTemplateFile(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    setUploadError(null);

    const ext = selected.name.split('.').pop()?.toLowerCase() ?? '';
    if (!PERSONALIZATION_SHEET_EXTENSIONS.includes(ext)) {
      setUploadError(
        `Obsługujemy pliki ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL} — prosimy zapisać arkusz w jednym z tych formatów.`
      );
      return;
    }

    const body = new FormData();
    body.append('file', selected);
    body.append('purpose', 'personalizacja');

    setUploading(true);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body });
      const json = (await res.json()) as { error?: string; path?: string; url?: string };

      if (!res.ok) {
        setUploadError(json.error ?? 'Nie udało się przesłać pliku.');
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
    } finally {
      setUploading(false);
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
              Każda koperta dostaje inne dane — nazwisko odbiorcy albo pełny adres pocztowy.
            </p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onToggle} label="Personalizacja" />
      </div>

      {enabled && (
        <div className="pers-body">
          {belowMinimum && (
            <p className="notice notice-error" role="alert">
              Wybrana ilość ({quantity} szt.) jest niższa niż minimum {minimum} szt. dla personalizacji.{' '}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'var(--space-2)' }}
                onClick={() => onSetQuantity(minimum)}
              >
                Ustaw {minimum} szt.
              </button>
            </p>
          )}

          {/* Jedyne pytanie tej sekcji. */}
          <p className="pers-question" id="pers-metoda-label">
            Jak mają być spersonalizowane koperty?
          </p>

          <div className="grid grid-2 pers-options" role="radiogroup" aria-labelledby="pers-metoda-label">
            <label className="option-card pers-option" data-selected={method === 'reczna'}>
              <input
                type="radio"
                className="sr-only"
                name="personalizacja-metoda"
                value="reczna"
                checked={method === 'reczna'}
                onChange={() => onMethodChange('reczna')}
              />
              <span className="pers-option-head">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-seal)', flexShrink: 0 }} aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                <strong>Wpiszę je tutaj</strong>
              </span>
              <small>Lista w polu tekstowym — jedna koperta w wierszu.</small>
              {method === 'reczna' && (
                <span className="option-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </label>

            <label className="option-card pers-option" data-selected={method === 'szablon'}>
              <input
                type="radio"
                className="sr-only"
                name="personalizacja-metoda"
                value="szablon"
                checked={method === 'szablon'}
                onChange={() => onMethodChange('szablon')}
              />
              <span className="pers-option-head">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-seal)', flexShrink: 0 }} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <strong>Wgram gotowy arkusz</strong>
              </span>
              <small>Pobiorą Państwo szablon, uzupełnią w Excelu i wgrają z powrotem.</small>
              {method === 'szablon' && (
                <span className="option-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </label>
          </div>

          {method === 'reczna' && (
            <div className="field">
              <label htmlFor="personalizacja-tekst">
                Dane do nadruku — jedna koperta w wierszu
              </label>
              <textarea
                id="personalizacja-tekst"
                className="textarea"
                style={{ minHeight: 190 }}
                value={text}
                placeholder={TEXT_PLACEHOLDER}
                onChange={(e) => onTextChange(e.target.value)}
              />

              <div className="pers-counter" role="status">
                {typedRows === 0 && <span className="badge">0 z {quantity} wierszy</span>}
                {typedRows > 0 && typedRows === quantity && (
                  <span className="badge badge-success">
                    Komplet — {typedRows} z {quantity} wierszy
                  </span>
                )}
                {typedRows > 0 && typedRows !== quantity && (
                  <>
                    <span className="badge badge-seal">
                      {typedRows} z {quantity} wierszy
                    </span>
                    {typedRows > quantity && typedRows >= minimum && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSetQuantity(typedRows)}
                      >
                        Ustaw {typedRows} szt.
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {method === 'szablon' && (
            <div className="pers-template">
              <p className="small muted" style={{ margin: 0 }}>
                Pobierz szablon na {quantity} {plural(quantity, 'wiersz', 'wiersze', 'wierszy')}:
              </p>
              <div className="pers-download">
                {PERSONALIZATION_SCOPES.map((option) => (
                  <a
                    key={option.id}
                    className="btn btn-secondary"
                    href={`/api/personalizacja/szablon?ilosc=${quantity}&zakres=${option.id}`}
                    /* Pobranie jest zarazem wyborem wersji — zakres jedzie
                       potem w zamówieniu jako opis, co drukujemy. */
                    onClick={() => onScopeChange(option.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {option.label}
                  </a>
                ))}
              </div>

              <div
                className="dropzone"
                data-drag={dragging}
                aria-busy={uploading}
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-soft)' }} aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                  <strong style={{ display: 'block' }}>
                    {uploading ? 'Przesyłamy arkusz…' : 'Wgraj uzupełniony arkusz'}
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
                  . Przyjmujemy pliki {PERSONALIZATION_SHEET_EXTENSIONS_LABEL}.
                </p>
                <input
                  id="szablon-input"
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  accept={PERSONALIZATION_SHEET_EXTENSIONS.map((ext) => `.${ext}`).join(',')}
                  onChange={(e) => void handleTemplateFile(e.target.files)}
                />
              </div>

              {uploadError && (
                <p className="notice notice-error" role="alert">
                  {uploadError}
                </p>
              )}

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
                  <span className={uploaded ? 'badge badge-success' : 'badge badge-error'}>
                    {uploaded ? 'Przesłano' : 'Błąd'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      onFileChange(null);
                      setUploadError(null);
                    }}
                  >
                    Usuń
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
