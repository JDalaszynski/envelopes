'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { UploadedFile } from '@/lib/types';

/**
 * Strefa drag&drop z walidacją rozszerzenia i rozmiaru.
 * Plik trafia do Firebase Storage przez endpoint `/api/uploads`, powiązany
 * z identyfikatorem zamówienia (pkt 8.1). Po przesłaniu klient widzi
 * miniaturę podglądu: rzeczywisty obraz dla plików graficznych, a dla
 * formatów, których przeglądarka nie renderuje (PDF, AI, EPS, CDR) —
 * miniaturę dokumentu z oznaczeniem typu.
 */

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept: string[];
  maxFiles: number;
  maxBytes: number;
  label: string;
  purpose: 'nadruk' | 'personalizacja' | 'wizualizacja';
}

const PREVIEWABLE = ['png', 'jpg', 'jpeg', 'svg'];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  files,
  onChange,
  accept,
  maxFiles,
  maxBytes,
  label,
  purpose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Lokalne adresy blob: do podglądu miniatur, bez pobierania pliku z serwera */
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputId = useId();

  // Zwolnienie adresów blob przy odmontowaniu komponentu
  useEffect(
    () => () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    },
    [previews]
  );

  async function handleFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const incoming = Array.from(list);

    if (files.length + incoming.length > maxFiles) {
      setError(`Można przesłać maksymalnie ${maxFiles} ${maxFiles === 1 ? 'plik' : 'pliki'}.`);
      return;
    }

    const prepared: UploadedFile[] = [];
    const newPreviews: Record<string, string> = {};

    for (const file of incoming) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const entry: UploadedFile = {
        id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        ext,
        status: 'weryfikacja',
      };
      if (!accept.includes(ext)) {
        entry.status = 'blad';
        entry.error = `Format .${ext} nie jest obsługiwany.`;
      } else if (file.size > maxBytes) {
        entry.status = 'blad';
        entry.error = `Plik przekracza ${formatBytes(maxBytes)}.`;
      } else if (PREVIEWABLE.includes(ext)) {
        newPreviews[entry.id] = URL.createObjectURL(file);
      }
      prepared.push(entry);
    }

    setPreviews((prev) => ({ ...prev, ...newPreviews }));
    onChange([...files, ...prepared]);

    // Wysyłka do Storage dla plików, które przeszły walidację lokalną
    for (const entry of prepared) {
      if (entry.status === 'blad') continue;
      const source = incoming.find((f) => f.name === entry.name);
      if (!source) continue;
      try {
        const body = new FormData();
        body.append('file', source);
        body.append('purpose', purpose);
        const res = await fetch('/api/uploads', { method: 'POST', body });
        const json = await res.json();
        entry.status = res.ok ? 'przeslano' : 'blad';
        entry.path = json.path;
        entry.url = json.url;
        if (!res.ok) entry.error = json.error ?? 'Nie udało się przesłać pliku.';
      } catch {
        entry.status = 'blad';
        entry.error = 'Błąd połączenia podczas przesyłania.';
      }
      onChange([...files, ...prepared]);
    }
  }

  function remove(id: string) {
    const url = previews[id];
    if (url) URL.revokeObjectURL(url);
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      <div
        className="dropzone"
        data-drag={dragging}
        role="button"
        tabIndex={0}
        aria-describedby={`${inputId}-formats`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-ink-soft)' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          <strong style={{ display: 'block' }}>{label}</strong>
        </div>
        <span id={`${inputId}-formats`} className="sr-only">
          Dozwolone formaty: {accept.join(', ')}. Maksymalnie {formatBytes(maxBytes)} na plik, do{' '}
          {maxFiles} plików.
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          className="sr-only"
          accept={accept.map((a) => `.${a}`).join(',')}
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="thumb-grid">
          {files.map((file) => (
            <li className="thumb" key={file.id} data-status={file.status}>
              <div className="thumb-frame">
                {previews[file.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[file.id]} alt={`Podgląd pliku ${file.name}`} />
                ) : (
                  <span className="thumb-doc" aria-hidden="true">
                    <span className="thumb-ext">{file.ext}</span>
                  </span>
                )}
              </div>
              <div className="thumb-meta">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>
                <span className="mono-sm muted">{formatBytes(file.size)}</span>
                {file.error && <span className="field-error small">{file.error}</span>}
              </div>
              <div className="thumb-actions">
                <span
                  className={
                    file.status === 'przeslano'
                      ? 'badge badge-success'
                      : file.status === 'blad'
                        ? 'badge badge-error'
                        : 'badge'
                  }
                >
                  {file.status === 'przeslano'
                    ? 'Przesłano'
                    : file.status === 'blad'
                      ? 'Błąd formatu'
                      : 'Weryfikacja'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => remove(file.id)}
                  aria-label={`Usuń plik ${file.name}`}
                >
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
