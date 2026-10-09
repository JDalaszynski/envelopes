'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import { formatBytes } from '@/components/ui/FileDropzone';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDate, needsProduction, plural } from '@/lib/pricing';
import type { Order } from '@/lib/types';
import {
  VISUALIZATION_FONTS,
  buildVisualizationPdf,
  customerName,
  visualizationFileName,
  type VisualizationFontRole,
} from '@/lib/visualization-pdf';

/**
 * Dłuższy bok obrazu osadzanego w PDF-ie. Przy pełnej szerokości strony A4
 * 2400 px daje ponad 340 dpi — klient może powiększyć wizualizację i odczytać
 * drobny tekst, a plik nadal nadaje się na załącznik do e-maila.
 */
const IMAGE_MAX_SIDE = 2400;
const IMAGE_QUALITY = 0.92;
const IMAGE_MAX_BYTES = 40 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_EXTENSION = /\.(jpe?g|png|webp)$/i;

interface PreparedImage {
  name: string;
  size: number;
  previewUrl: string;
  /** Wymiary pliku od grafika — pokazywane w panelu */
  sourceWidth: number;
  sourceHeight: number;
  /** Wymiary i treść JPEG-a, który trafia do PDF-a */
  width: number;
  height: number;
  data: Uint8Array;
}

interface GeneratedPdf {
  url: string;
  name: string;
  size: number;
}

/**
 * Plik od grafika przechodzi przez canvas, zanim trafi do PDF-a. Przeglądarka
 * prostuje przy tym obrót zapisany w EXIF, sprowadza kolory do sRGB (także
 * z CMYK i z profili typu Adobe RGB) i podkłada biel pod przezroczystość PNG,
 * więc dokument dostaje zawsze ten sam rodzaj JPEG-a — niezależnie od tego,
 * z jakiego programu wyszła wizualizacja.
 */
async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Przeglądarka nie udostępniła płótna 2D.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  const source = { sourceWidth: bitmap.width, sourceHeight: bitmap.height };
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
  );
  if (!blob) throw new Error('Nie udało się zakodować obrazu.');

  return {
    name: file.name,
    size: file.size,
    previewUrl: URL.createObjectURL(file),
    ...source,
    width,
    height,
    data: new Uint8Array(await blob.arrayBuffer()),
  };
}

type FontData = Record<VisualizationFontRole, Uint8Array>;
let fontsRequest: Promise<FontData> | null = null;

/** Kroje do PDF-a pobieramy raz na wizytę; nieudana próba nie blokuje kolejnej. */
function loadFonts(): Promise<FontData> {
  fontsRequest ??= Promise.all(
    (Object.keys(VISUALIZATION_FONTS) as VisualizationFontRole[]).map(async (role) => {
      const res = await fetch(`/fonts/${VISUALIZATION_FONTS[role].file}`);
      if (!res.ok) throw new Error(`Font ${VISUALIZATION_FONTS[role].file}: HTTP ${res.status}`);
      return [role, new Uint8Array(await res.arrayBuffer())] as const;
    })
  )
    .then((entries) => Object.fromEntries(entries) as FontData)
    .catch((error) => {
      fontsRequest = null;
      throw error;
    });
  return fontsRequest;
}

/** Domyślnie wizualizacja dotyczy pozycji z nadrukiem lub personalizacją. */
function defaultItemIds(order: Order): Set<string> {
  const produced = order.items.filter((item) => needsProduction(item.config));
  return new Set((produced.length ? produced : order.items).map((item) => item.id));
}

function itemsSummary(order: Order): string {
  const [first, ...rest] = order.items;
  if (!first) return '—';
  return rest.length ? `${first.name} · +${rest.length} poz.` : first.name;
}

/**
 * Generator PDF-a z wizualizacją do akceptacji.
 *
 * Admin wybiera zamówienie, dodaje plik JPG od grafika i pobiera gotowy
 * dokument, który sam wysyła klientowi. Całość dzieje się w przeglądarce:
 * plik wizualizacji nie jest nigdzie przesyłany, a zamówienie nie zmienia
 * statusu ani historii.
 */
export function VisualizationGenerator({ initialOrder }: { initialOrder?: string }) {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<{ preview?: string; result?: string }>({});
  const preselected = useRef(false);
  const fieldId = useId();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState(true);
  const [itemIds, setItemIds] = useState<Set<string>>(new Set());

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [version, setVersion] = useState(1);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedPdf | null>(null);

  /** Każda zmiana danych wejściowych unieważnia wygenerowany wcześniej dokument. */
  const clearResult = useCallback(() => {
    if (urlsRef.current.result) URL.revokeObjectURL(urlsRef.current.result);
    urlsRef.current.result = undefined;
    setResult(null);
    setError(null);
  }, []);

  const chooseOrder = useCallback(
    (order: Order) => {
      setSelected(order.number);
      setItemIds(defaultItemIds(order));
      setPicking(false);
      clearResult();
    },
    [clearResult]
  );

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setLoadError(null);
    try {
      const res = await fetch('/api/orders', { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const next: Order[] = (await res.json()).orders ?? [];
      setOrders(next);
      // Zamówienie z adresu wybieramy tylko raz — ponowne wczytanie listy
      // nie może cofnąć tego, co admin zdążył już ustawić
      if (!preselected.current) {
        preselected.current = true;
        const match = next.find((entry) => entry.number === initialOrder);
        if (match) chooseOrder(match);
      }
    } catch {
      setLoadError('Nie udało się wczytać zamówień. Odśwież stronę i spróbuj ponownie.');
    }
    setLoaded(true);
  }, [getToken, initialOrder, chooseOrder]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    void load();
  }, [user, loading, router, load]);

  // Adresy blob: zwalniamy przy wyjściu z zakładki
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      if (urls.preview) URL.revokeObjectURL(urls.preview);
      if (urls.result) URL.revokeObjectURL(urls.result);
    };
  }, []);

  const order = useMemo(
    () => orders.find((entry) => entry.number === selected) ?? null,
    [orders, selected]
  );
  const items = useMemo(
    () => (order ? order.items.filter((item) => itemIds.has(item.id)) : []),
    [order, itemIds]
  );
  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((entry) =>
      [entry.number, customerName(entry), entry.customer.email, ...entry.items.map((i) => i.name)]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [orders, search]);

  function toggleItem(id: string) {
    setItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    clearResult();
  }

  function replaceImage(next: PreparedImage | null) {
    if (urlsRef.current.preview) URL.revokeObjectURL(urlsRef.current.preview);
    urlsRef.current.preview = next?.previewUrl;
    setImage(next);
    clearResult();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    if (!IMAGE_TYPES.includes(file.type) && !IMAGE_EXTENSION.test(file.name)) {
      setImageError('Ten format nie jest obsługiwany. Dodaj plik JPG albo PNG.');
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setImageError(`Plik przekracza ${formatBytes(IMAGE_MAX_BYTES)}.`);
      return;
    }
    setImageBusy(true);
    try {
      replaceImage(await prepareImage(file));
      // Fonty dociągają się w tle, zanim padnie kliknięcie „Generuj"
      void loadFonts().catch(() => undefined);
    } catch {
      setImageError('Nie udało się odczytać pliku. Sprawdź, czy to poprawny obraz JPG albo PNG.');
    }
    setImageBusy(false);
  }

  function download(pdf: GeneratedPdf) {
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = pdf.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function generate() {
    if (!order || !image || items.length === 0) return;
    setGenerating(true);
    clearResult();
    try {
      const bytes = await buildVisualizationPdf({
        order,
        items,
        image,
        fonts: await loadFonts(),
        version,
        issuedAt: new Date(),
      });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const pdf = {
        url: URL.createObjectURL(blob),
        name: visualizationFileName(order, version),
        size: blob.size,
      };
      urlsRef.current.result = pdf.url;
      setResult(pdf);
      download(pdf);
    } catch (cause) {
      console.error('[Generator wizualizacji] Nie udało się złożyć PDF-a:', cause);
      setError('Nie udało się wygenerować PDF-a. Odśwież stronę i spróbuj ponownie.');
    }
    setGenerating(false);
  }

  if (loading || !user || user.role !== 'admin') return <p className="muted">Weryfikacja dostępu…</p>;

  const missing = !order
    ? 'Wybierz zamówienie z listy.'
    : items.length === 0
      ? 'Zaznacz co najmniej jedną pozycję zamówienia.'
      : !image
        ? 'Dodaj plik z wizualizacją.'
        : null;

  return (
    <>
      <div className="admin-page-head">
        <h1>Generator Wizualizacji</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Zamówienie i plik JPG od grafika składają się w PDF gotowy do wysłania klientowi do
          akceptacji.
        </p>
      </div>

      <div className="viz-gen">
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          {/* ── 1. Zamówienie ── */}
          <section className="card card-lg checkout-section" aria-labelledby={`${fieldId}-order`}>
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                1
              </span>
              <div>
                <h2 id={`${fieldId}-order`}>Zamówienie</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Dane produktu w PDF-ie pochodzą z wybranego zamówienia.
                </p>
              </div>
            </header>

            {loadError && (
              <p className="notice notice-error" role="alert">
                {loadError}
              </p>
            )}

            {loaded && initialOrder && !order && picking && !loadError && (
              <p className="notice">
                Nie znaleziono zamówienia <span className="mono-sm">{initialOrder}</span> — wybierz
                je z listy.
              </p>
            )}

            {order && !picking ? (
              <>
                <div className="viz-selected">
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0 }}>
                      <span className="mono" style={{ fontWeight: 500 }}>
                        {order.number}
                      </span>
                      <span className="small muted"> · {formatDate(order.createdAt)}</span>
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {customerName(order)} ·{' '}
                      <Link href={`/admin/zamowienia/${order.number}`}>szczegóły zamówienia</Link>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPicking(true)}
                  >
                    Zmień
                  </button>
                </div>

                {order.items.length === 1 ? (
                  <p className="small" style={{ margin: 0 }}>
                    <strong>{order.items[0].name}</strong>
                    <span className="muted"> · {order.items[0].price.quantity} szt.</span>
                  </p>
                ) : (
                  <fieldset className="viz-items">
                    <legend className="field-label">Pozycje objęte wizualizacją</legend>
                    {order.items.map((item) => (
                      <label className="checkbox-row" key={item.id}>
                        <input
                          type="checkbox"
                          checked={itemIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span>
                          {item.name}
                          <span className="muted"> · {item.price.quantity} szt.</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}
              </>
            ) : !loaded ? (
              <p className="muted small">Wczytywanie zamówień…</p>
            ) : (
              !loadError && (
                <>
                  <div className="field">
                    <label htmlFor={`${fieldId}-search`}>Numer zamówienia, klient lub produkt</label>
                    <input
                      id={`${fieldId}-search`}
                      className="input"
                      type="search"
                      placeholder="ENV-… lub nazwa firmy"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {visibleOrders.length === 0 ? (
                    <p className="small muted" style={{ margin: 0 }}>
                      {orders.length === 0
                        ? 'Brak zamówień.'
                        : 'Żadne zamówienie nie pasuje do wyszukiwania.'}
                    </p>
                  ) : (
                    <ul className="viz-orders" aria-label="Zamówienia do wyboru">
                      {visibleOrders.map((entry) => (
                        <li key={entry.number}>
                          <button
                            type="button"
                            className="viz-order"
                            aria-pressed={entry.number === selected}
                            onClick={() => chooseOrder(entry)}
                          >
                            <span>
                              <span className="viz-order-number mono-sm">{entry.number}</span>
                              <span className="viz-order-sub">{formatDate(entry.createdAt)}</span>
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <span className="viz-order-main">{customerName(entry)}</span>
                              <span className="viz-order-sub">{itemsSummary(entry)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {order && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => setPicking(false)}
                    >
                      Zostań przy {order.number}
                    </button>
                  )}
                </>
              )
            )}
          </section>

          {/* ── 2. Plik wizualizacji ── */}
          <section className="card card-lg checkout-section" aria-labelledby={`${fieldId}-file`}>
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                2
              </span>
              <div>
                <h2 id={`${fieldId}-file`}>Plik wizualizacji</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Plik zostaje na tym komputerze — trafia wyłącznie do PDF-a.
                </p>
              </div>
            </header>

            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                // Ten sam plik można wybrać ponownie, np. po poprawce grafika
                e.target.value = '';
              }}
            />

            {image ? (
              <div className="viz-file">
                <div className="thumb-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.previewUrl} alt={`Podgląd pliku ${image.name}`} />
                </div>
                <div className="viz-file-meta">
                  <span className="file-name" title={image.name}>
                    {image.name}
                  </span>
                  <span className="mono-sm muted">
                    {image.sourceWidth} × {image.sourceHeight} px · {formatBytes(image.size)}
                  </span>
                  <span className="row" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={imageBusy}
                      onClick={() => inputRef.current?.click()}
                    >
                      {imageBusy ? 'Wczytywanie…' : 'Zmień plik'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => replaceImage(null)}
                    >
                      Usuń
                    </button>
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="dropzone"
                data-drag={dragging}
                role="button"
                tabIndex={0}
                aria-describedby={`${fieldId}-formats`}
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
                  void handleFile(e.dataTransfer.files[0]);
                }}
              >
                <strong style={{ display: 'block' }}>
                  {imageBusy ? 'Wczytywanie pliku…' : 'Dodaj plik JPG z wizualizacją'}
                </strong>
                <span id={`${fieldId}-formats`} className="small muted">
                  Przeciągnij plik tutaj albo kliknij, żeby wybrać go z komputera. JPG lub PNG.
                </span>
              </div>
            )}

            {imageError && (
              <p className="field-error" role="alert">
                {imageError}
              </p>
            )}

            <div className="field viz-version">
              <label htmlFor={`${fieldId}-version`}>Wersja wizualizacji</label>
              <input
                id={`${fieldId}-version`}
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={version}
                aria-describedby={`${fieldId}-version-hint`}
                onChange={(e) => {
                  const next = Math.round(Number(e.target.value));
                  setVersion(Number.isFinite(next) ? Math.min(99, Math.max(1, next)) : 1);
                  clearResult();
                }}
              />
              <span id={`${fieldId}-version-hint`} className="field-hint">
                Numer trafia na dokument i do nazwy pliku. Rośnie z każdą poprawioną wizualizacją
                wysyłaną do klienta.
              </span>
            </div>
          </section>

          {/* ── 3. PDF ── */}
          <section className="card card-lg checkout-section" aria-labelledby={`${fieldId}-pdf`}>
            <header className="checkout-section-head">
              <span className="checkout-num" aria-hidden="true">
                3
              </span>
              <div>
                <h2 id={`${fieldId}-pdf`}>PDF dla klienta</h2>
                <p className="small muted" style={{ margin: 0 }}>
                  Dokument pobiera się na dysk. Generator niczego nie wysyła — klient dostaje plik w osobnej
                  wiadomości.
                </p>
              </div>
            </header>

            <button
              type="button"
              className="btn btn-lg"
              style={{ alignSelf: 'flex-start' }}
              disabled={Boolean(missing) || generating}
              aria-describedby={missing ? `${fieldId}-missing` : undefined}
              onClick={() => void generate()}
            >
              {generating ? 'Generowanie…' : 'Generuj PDF Wizualizacji'}
            </button>

            {missing && (
              <p id={`${fieldId}-missing`} className="small muted" style={{ margin: 0 }}>
                {missing}
              </p>
            )}

            {error && (
              <p className="notice notice-error" role="alert">
                {error}
              </p>
            )}

            {result && (
              <div className="notice notice-success" role="status">
                <p style={{ margin: 0 }}>
                  PDF gotowy — pobrano plik <span className="mono-sm">{result.name}</span> (
                  {formatBytes(result.size)}).
                </p>
                <p className="row" style={{ gap: 'var(--space-2)', margin: 'var(--space-3) 0 0' }}>
                  <a className="btn btn-secondary btn-sm" href={result.url} download={result.name}>
                    Pobierz ponownie
                  </a>
                  <a
                    className="btn btn-ghost btn-sm"
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Otwórz w nowej karcie
                  </a>
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── Podgląd ── */}
        <aside className="card viz-gen-preview" aria-labelledby={`${fieldId}-preview`}>
          <h2 id={`${fieldId}-preview`} style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>
            Podgląd dokumentu
          </h2>
          {result ? (
            <object
              key={result.url}
              className="viz-pdf"
              data={`${result.url}#toolbar=0&navpanes=0&view=FitH`}
              type="application/pdf"
              aria-label={`Podgląd pliku ${result.name}`}
            >
              <p className="small muted">
                Ta przeglądarka nie wyświetla PDF-ów w oknie strony. Plik został pobrany — można go
                też otworzyć w nowej karcie.
              </p>
            </object>
          ) : (
            <div className="viz-pdf viz-pdf-empty">
              <p className="small muted" style={{ margin: 0 }}>
                Podgląd pojawi się po wygenerowaniu PDF-a.
              </p>
              <ul className="small muted">
                <li>wizualizacja koperty z dodanego pliku,</li>
                <li>
                  dane produktu: format, kolor, papier, nakład, nadruk, personalizacja i czas
                  realizacji,
                </li>
                <li>lista rzeczy do sprawdzenia przed akceptacją,</li>
                <li>
                  przyciski „Akceptuję projekt" i „Zgłaszam uwagi", które otwierają klientowi gotową
                  wiadomość e-mail.
                </li>
              </ul>
              {order && image && items.length > 0 && (
                <p className="small" style={{ margin: 0 }}>
                  Gotowe do wygenerowania: {order.number},{' '}
                  {items.length === 1
                    ? items[0].name
                    : `${items.length} ${plural(items.length, 'pozycja', 'pozycje', 'pozycji')}`}
                  , wersja {version}.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
