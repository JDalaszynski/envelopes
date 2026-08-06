'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { StatusPill, PaymentPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { formatBytes } from '@/components/ui/FileDropzone';
import {
  BANK_TRANSFER_DETAILS,
  PAYMENT_METHOD_LABEL,
  isDeferredInvoice,
} from '@/lib/orders';
import { formatDate, formatDateTime, formatPrice } from '@/lib/pricing';
import type { Order } from '@/lib/types';

export function OrderDetail({ number }: { number: string }) {
  const { user, loading, getToken } = useAuth();
  const { reorder } = useCart();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [complaint, setComplaint] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(`/api/orders/${number}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'Nie udało się wczytać zamówienia.');
      return;
    }
    const json = await res.json();
    setOrder(json.order);
  }, [number, getToken]);

  useEffect(() => {
    if (!loading && !user) router.push('/logowanie');
    else if (user) void load();
  }, [user, loading, router, load]);

  async function respond(action: 'akceptuj' | 'uwagi') {
    if (!order) return;
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/akceptacja/${order.approvalToken}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNote(json.error ?? 'Nie udało się zapisać decyzji.');
      return;
    }
    setShowComment(false);
    setComment('');
    setNote(
      action === 'akceptuj'
        ? json.movedToPrint
          ? 'Projekt zaakceptowany — zamówienie skierowane do druku.'
          : (json.note ?? 'Projekt zaakceptowany.')
        : 'Uwagi przekazane grafikowi. Przygotujemy poprawioną wersję.'
    );
    await load();
  }

  if (loading) return <p className="muted">Wczytywanie…</p>;
  if (error) {
    return (
      <div className="empty-state">
        <h1 style={{ fontSize: 24 }}>{error}</h1>
        <Link href="/zamowienia" className="btn">
          Wróć do listy zamówień
        </Link>
      </div>
    );
  }
  if (!order) return <p className="muted">Wczytywanie zamówienia…</p>;

  const awaitingApproval =
    order.status === 'czeka_na_akceptacje' &&
    order.requiresVisualization &&
    order.visualizationStatus !== 'zaakceptowano';
  const latest = order.visualizations[order.visualizations.length - 1];
  const showPaymentDetails = order.paymentStatus === 'oczekuje' && order.paymentMethod === 'przelew';

  return (
    <>
      <p className="small">
        <Link href="/zamowienia">← Złożone zamówienia</Link>
      </p>

      <div className="row-between" style={{ margin: 'var(--space-4) 0 var(--space-5)' }}>
        <div>
          <h1 className="mono" style={{ fontSize: 32 }}>
            {order.number}
          </h1>
          <p className="muted small" style={{ margin: 0 }}>
            Złożone {formatDate(order.createdAt)} · {PAYMENT_METHOD_LABEL[order.paymentMethod]}
          </p>
        </div>
        <div className="row">
          <StatusPill status={order.status} />
          <PaymentPill status={order.paymentStatus} />
        </div>
      </div>

      {note && <p className="notice notice-success">{note}</p>}

      {/* ── Wizualizacja do akceptacji (pkt 6.11) ── */}
      {awaitingApproval && latest && (
        <div className="card card-lg" id="wizualizacja" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="eyebrow">Wizualizacja do akceptacji</span>
          <h2 style={{ fontSize: 22 }}>Projekt czeka na Państwa decyzję</h2>
          <p className="small muted">
            Przesłano {formatDateTime(latest.sentAt)} · wersja {latest.version}
          </p>

          <div style={{ maxWidth: 420, margin: 'var(--space-4) 0' }}>
            <EnvelopePlaceholder
              format={order.items[0]?.config.format ?? 'DL'}
              colorId={order.items[0]?.config.color ?? 'ecru'}
              ratio="photo"
              hasPrint={order.items[0]?.config.print}
            />
            <p className="mono-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {latest.file.name} · {formatBytes(latest.file.size)}
              {latest.file.url && (
                <>
                  {' · '}
                  <a href={latest.file.url} target="_blank" rel="noreferrer">
                    otwórz plik
                  </a>
                </>
              )}
            </p>
          </div>

          {order.paymentStatus === 'oczekuje' && !isDeferredInvoice(order.paymentMethod) && (
            <p className="notice">
              Po akceptacji zamówienie pozostanie w statusie „Czeka na akceptację" z adnotacją
              „Czekamy jeszcze na wpłatę" — druk ruszy po zaksięgowaniu płatności.
            </p>
          )}

          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn" disabled={busy} onClick={() => void respond('akceptuj')}>
              Akceptuję projekt
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowComment((v) => !v)}
            >
              Zgłoś uwagi
            </button>
          </div>

          {showComment && (
            <div className="field" style={{ marginTop: 'var(--space-4)' }}>
              <label htmlFor="uwagi">Uwagi do projektu</label>
              <textarea
                id="uwagi"
                className="textarea"
                value={comment}
                placeholder="Np. logo o 3 mm wyżej, kolor tekstu ciemniejszy."
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                type="button"
                className="btn"
                style={{ marginTop: 'var(--space-3)', alignSelf: 'flex-start' }}
                disabled={busy || !comment.trim()}
                onClick={() => void respond('uwagi')}
              >
                Wyślij uwagi
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historia wizualizacji */}
      {order.visualizations.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Historia wizualizacji</h2>
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            {order.visualizations.map((version) => (
              <div className="file-card" key={version.id}>
                <span className="file-icon" aria-hidden="true">
                  {version.file.ext}
                </span>
                <span className="file-meta">
                  <span className="file-name">
                    Wersja {version.version} — {version.file.name}
                  </span>
                  <span className="mono-sm muted" style={{ display: 'block' }}>
                    przesłano {formatDateTime(version.sentAt)}
                  </span>
                  {version.customerComment && (
                    <span className="small" style={{ display: 'block', marginTop: 4 }}>
                      Uwagi: {version.customerComment}
                    </span>
                  )}
                </span>
                <span
                  className={
                    version.status === 'zaakceptowano'
                      ? 'badge badge-success'
                      : version.status === 'uwagi'
                        ? 'badge badge-error'
                        : 'badge badge-seal'
                  }
                >
                  {version.status === 'zaakceptowano'
                    ? 'Zaakceptowano'
                    : version.status === 'uwagi'
                      ? 'Zgłoszono uwagi'
                      : 'Oczekuje'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dane do przelewu, dopóki płatność nie jest potwierdzona ── */}
      {showPaymentDetails && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Dane do przelewu</h2>
          <dl className="stack" style={{ gap: 'var(--space-2)' }}>
            <Row label="Numer konta" value={BANK_TRANSFER_DETAILS.konto} mono />
            <Row label="Kwota" value={formatPrice(order.totals.gross)} mono />
            <Row label="Tytuł przelewu" value={order.number} mono />
          </dl>
          <a
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 'var(--space-4)' }}
            href={`/api/dokumenty/proforma/${order.number}`}
          >
            Pobierz fakturę proforma (PDF)
          </a>
        </div>
      )}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Pozycje */}
        <div className="card">
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-4)' }}>Konfiguracja</h2>
          {order.items.map((item) => (
            <div key={item.id} style={{ marginBottom: 'var(--space-5)' }}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <EnvelopePlaceholder
                    format={item.config.format}
                    colorId={item.config.color}
                    ratio="photo"
                    size="sm"
                    hideCaption
                    hasPrint={item.config.print}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <strong>{item.name}</strong>
                  <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-2)' }}>
                    {item.price.quantity} szt. × {formatPrice(item.price.unitTotal)} ={' '}
                    {formatPrice(item.price.gross)}
                  </p>
                  {item.config.printNotes && (
                    <p className="small muted" style={{ margin: 0 }}>
                      Uwagi dla grafika: {item.config.printNotes}
                    </p>
                  )}
                </div>
              </div>

              {item.config.printFiles.length > 0 && (
                <div className="stack" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  {item.config.printFiles.map((file) => (
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
                          Podgląd
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {item.config.personalization && (
                <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                  Adresowanie:{' '}
                  {item.config.personalizationMethod === 'szablon'
                    ? `arkusz ${item.config.personalizationFile?.name ?? '—'}`
                    : 'treść wpisana ręcznie'}
                  {item.config.personalizationMethod === 'reczna' &&
                    item.config.personalizationText && (
                      <span
                        className="mono-sm"
                        style={{ display: 'block', whiteSpace: 'pre-wrap', marginTop: 4 }}
                      >
                        {item.config.personalizationText}
                      </span>
                    )}
                </p>
              )}
            </div>
          ))}

          <hr />
          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                reorder(order.items.map((i) => i.config));
                router.push('/koszyk');
              }}
            >
              Zamów ponownie
            </button>
            <a className="btn btn-secondary" href={`/api/dokumenty/faktura/${order.number}`}>
              Pobierz fakturę (PDF)
            </a>
            <button type="button" className="btn btn-ghost" onClick={() => setComplaint((v) => !v)}>
              Zgłoś reklamację
            </button>
          </div>
          {complaint && (
            <p className="notice" style={{ marginTop: 'var(--space-4)' }}>
              Reklamacje przyjmujemy przez{' '}
              <Link href={`/kontakt?temat=Wsparcie zamówienia&zamowienie=${order.number}`}>
                formularz kontaktowy
              </Link>{' '}
              — prosimy o podanie numeru {order.number} i opisanie zastrzeżeń. Odpowiadamy w ciągu
              14 dni.
            </p>
          )}
        </div>

        {/* Dane zamówienia */}
        <div className="stack">
          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Rozliczenie</h2>
            <dl className="stack" style={{ gap: 'var(--space-2)' }}>
              <Row label="Produkty" value={formatPrice(order.totals.itemsGross)} mono />
              <Row label="Dostawa" value={formatPrice(order.totals.deliveryGross)} mono />
              {order.totals.discountGross > 0 && (
                <Row label="Rabat" value={`− ${formatPrice(order.totals.discountGross)}`} mono />
              )}
              <Row label="Netto" value={formatPrice(order.totals.net)} mono />
              <Row label="VAT 23%" value={formatPrice(order.totals.vat)} mono />
              <Row label="Razem brutto" value={formatPrice(order.totals.gross)} mono />
              {order.paymentDueDate && (
                <Row label="Termin płatności" value={formatDate(order.paymentDueDate)} />
              )}
            </dl>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Dostawa</h2>
            <dl className="stack" style={{ gap: 'var(--space-2)' }}>
              <Row
                label="Sposób"
                value={
                  order.delivery.method === 'kurier'
                    ? 'Kurier'
                    : `Paczkomat InPost ${order.delivery.point?.name ?? ''}`
                }
              />
              <Row label="Orientacyjna dostawa" value={formatDate(order.estimatedDelivery)} />
              <Row label="Numer przesyłki" value={order.trackingNumber ?? 'nadamy po wysyłce'} mono />
            </dl>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              {order.customer.deliveryDifferent
                ? `${order.customer.deliveryImieNazwisko ?? ''}, ${order.customer.deliveryUlica ?? ''}, ${order.customer.deliveryKodPocztowy ?? ''} ${order.customer.deliveryMiasto ?? ''}`
                : `${order.customer.ulica}, ${order.customer.kodPocztowy} ${order.customer.miasto}`}
            </p>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Historia zamówienia</h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {order.history.map((entry, index) => (
                <li key={index} className="small" style={{ marginBottom: 'var(--space-3)' }}>
                  <span className="mono-sm muted" style={{ display: 'block' }}>
                    {formatDateTime(entry.at)} · {entry.by}
                  </span>
                  {entry.action}
                  {entry.detail && <span className="muted"> — {entry.detail}</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="row-between">
      <dt className="small muted">{label}</dt>
      <dd className={mono ? 'mono-sm' : 'small'} style={{ margin: 0, textAlign: 'right' }}>
        {value}
      </dd>
    </div>
  );
}
