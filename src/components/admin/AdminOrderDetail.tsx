'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { StatusPill, PaymentPill } from '@/components/ui/StatusPill';
import { formatBytes } from '@/components/ui/FileDropzone';
import { useAuth } from '@/components/providers/AuthProvider';
import { personalizationScope } from '@/lib/catalog';
import {
  ORDER_STATUSES,
  PAYMENT_METHOD_LABEL,
  evaluatePrintGate,
  isGatewayPayment,
} from '@/lib/orders';
import { formatDate, formatDateTime, formatPrice } from '@/lib/pricing';
import type { CustomerData, Order, OrderStatus } from '@/lib/types';

/** Szczegóły zamówienia w panelu Admina (pkt 6.12). */
export function AdminOrderDetail({ number }: { number: string }) {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/orders/${number}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Nie udało się wczytać zamówienia.');
      return;
    }
    setOrder(json.order);
  }, [number, getToken]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    void load();
  }, [user, loading, router, load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNote(null);
    const token = await getToken();
    const res = await fetch(`/api/orders/${number}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Operacja nie powiodła się.');
      return;
    }
    setOrder(json.order);
    setNote('Zapisano zmiany.');
  }

  async function uploadVisualization(file: File) {
    setBusy(true);
    setError(null);
    setNote(null);
    const token = await getToken();
    const body = new FormData();
    body.append('file', file);
    const res = await fetch(`/api/orders/${number}/wizualizacja`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body,
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Nie udało się dołączyć wizualizacji.');
      return;
    }
    setOrder(json.order);
    setNote(
      json.emailSent
        ? 'Wizualizacja dołączona — e-mail z prośbą o akceptację wysłany do klienta.'
        : `Wizualizacja dołączona. ${json.emailNote ?? ''}`
    );
  }

  if (loading || !user || user.role !== 'admin') return <p className="muted">Weryfikacja dostępu…</p>;
  if (error && !order) {
    return (
      <div className="empty-state">
        <h1 style={{ fontSize: 22 }}>{error}</h1>
        <Link href="/admin/zamowienia" className="btn">
          Wróć do listy
        </Link>
      </div>
    );
  }
  if (!order) return <p className="muted">Wczytywanie zamówienia…</p>;

  const gate = evaluatePrintGate(order);
  const latest = order.visualizations[order.visualizations.length - 1];

  return (
    <>
      <p className="small">
        <Link href="/admin/zamowienia">← Wszystkie zamówienia</Link>
      </p>

      <div className="row-between" style={{ margin: 'var(--space-4) 0 var(--space-5)' }}>
        <div>
          <h1 className="mono" style={{ fontSize: 30 }}>
            {order.number}
          </h1>
          <p className="muted small" style={{ margin: 0 }}>
            {formatDate(order.createdAt)} · {PAYMENT_METHOD_LABEL[order.paymentMethod]}
            {order.p24Reference && ` · referencja Przelewy24: ${order.p24Reference}`}
          </p>
        </div>
        <div className="row">
          <StatusPill status={order.status} />
          <PaymentPill status={order.paymentStatus} />
        </div>
      </div>

      {note && <p className="notice notice-success">{note}</p>}
      {error && <p className="notice notice-error">{error}</p>}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* ── Kolumna operacyjna ── */}
        <div className="stack">
          {/* Status zamówienia */}
          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Status zamówienia</h2>
            <div className="field">
              <label htmlFor="status">Zmień status</label>
              <select
                id="status"
                className="select input"
                value={order.status}
                disabled={busy}
                onChange={(e) => void patch({ status: e.target.value as OrderStatus })}
              >
                {ORDER_STATUSES.map((s) => {
                  const blocked = s.id === 'do_druku' && !gate.allowed;
                  return (
                    <option key={s.id} value={s.id} disabled={blocked}>
                      {s.label}
                      {blocked ? ' — niedostępne' : ''}
                    </option>
                  );
                })}
              </select>
              {!gate.allowed && (
                <p className="field-hint" style={{ color: 'var(--color-error)' }}>
                  {gate.reason} Opcja „Do druku" pozostaje zablokowana, dopóki oba warunki nie
                  zostaną spełnione.
                </p>
              )}
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Każda zmiana statusu jest natychmiast widoczna w panelu klienta i wyzwala
              powiadomienie e-mail.
            </p>
          </div>

          {/* Płatność */}
          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Płatność</h2>
            <dl className="stack" style={{ gap: 'var(--space-2)' }}>
              <Row label="Metoda" value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
              <Row label="Kwota" value={formatPrice(order.totals.gross)} mono />
              {order.paymentDueDate && (
                <Row label="Termin płatności" value={formatDate(order.paymentDueDate)} />
              )}
              {order.p24Reference && <Row label="Referencja P24" value={order.p24Reference} mono />}
            </dl>

            {order.paymentStatus === 'oczekuje' ? (
              <>
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 'var(--space-4)' }}
                  disabled={busy}
                  onClick={() => void patch({ paymentStatus: 'oplacone' })}
                >
                  Oznacz jako opłacone
                </button>
                <p className="small muted" style={{ marginTop: 'var(--space-2)' }}>
                  {isGatewayPayment(order.paymentMethod)
                    ? 'Płatności bramkowe potwierdzają się automatycznie — ręczne oznaczenie stosujemy tylko przy problemach z notyfikacją.'
                    : 'Ręczne potwierdzenie wpłaty na konto firmowe — system nie otrzymuje callbacku dla przelewów tradycyjnych.'}
                </p>
              </>
            ) : (
              <p className="notice notice-success" style={{ marginTop: 'var(--space-4)' }}>
                Płatność potwierdzona.
              </p>
            )}
          </div>



          {/* Przesyłka */}
          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Przesyłka</h2>
            <dl className="stack" style={{ gap: 'var(--space-2)' }}>
              <Row
                label="Sposób dostawy"
                value={
                  order.delivery.method === 'kurier'
                    ? 'Kurier'
                    : `Paczkomat InPost ${order.delivery.point?.name ?? ''}`
                }
              />
              {order.delivery.point?.address && (
                <Row label="Adres punktu" value={order.delivery.point.address} />
              )}
            </dl>
            <form
              className="field"
              style={{ marginTop: 'var(--space-3)' }}
              onSubmit={(e) => {
                e.preventDefault();
                const value = new FormData(e.currentTarget).get('tracking');
                void patch({ trackingNumber: String(value ?? '') });
              }}
            >
              <label htmlFor="tracking">Numer przesyłki</label>
              <div className="row" style={{ flexWrap: 'nowrap', gap: 'var(--space-2)' }}>
                <input
                  id="tracking"
                  name="tracking"
                  className="input"
                  defaultValue={order.trackingNumber ?? ''}
                  key={order.trackingNumber ?? 'empty'}
                />
                <button type="submit" className="btn btn-secondary">
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Kolumna danych ── */}
        <div className="stack">
          <div className="card">
            <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 20 }}>Dane zamawiającego</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Anuluj' : 'Edytuj'}
              </button>
            </div>

            {editing ? (
              <form
                className="stack"
                style={{ gap: 'var(--space-3)' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const customer: Partial<CustomerData> = {
                    imie: String(data.get('imie') ?? ''),
                    nazwisko: String(data.get('nazwisko') ?? ''),
                    firma: String(data.get('firma') ?? ''),
                    nip: String(data.get('nip') ?? ''),
                    email: String(data.get('email') ?? ''),
                    telefon: String(data.get('telefon') ?? ''),
                    ulica: String(data.get('ulica') ?? ''),
                    kodPocztowy: String(data.get('kod') ?? ''),
                    miasto: String(data.get('miasto') ?? ''),
                  };
                  void patch({ customer }).then(() => setEditing(false));
                }}
              >
                {(
                  [
                    ['imie', 'Imię', order.customer.imie],
                    ['nazwisko', 'Nazwisko', order.customer.nazwisko],
                    ['firma', 'Firma', order.customer.firma ?? ''],
                    ['nip', 'NIP', order.customer.nip ?? ''],
                    ['email', 'E-mail', order.customer.email],
                    ['telefon', 'Telefon', order.customer.telefon],
                    ['ulica', 'Ulica i numer', order.customer.ulica],
                    ['kod', 'Kod pocztowy', order.customer.kodPocztowy],
                    ['miasto', 'Miejscowość', order.customer.miasto],
                  ] as const
                ).map(([name, label, value]) => (
                  <div className="field" key={name}>
                    <label htmlFor={`f-${name}`}>{label}</label>
                    <input id={`f-${name}`} name={name} className="input" defaultValue={value} />
                  </div>
                ))}
                <button type="submit" className="btn" disabled={busy}>
                  Zapisz zmiany
                </button>
                <p className="small muted" style={{ margin: 0 }}>
                  Każda edycja zapisuje się w historii zmian zamówienia.
                </p>
              </form>
            ) : (
              <dl className="stack" style={{ gap: 'var(--space-2)' }}>
                <Row
                  label="Klient"
                  value={
                    order.customer.isCompany
                      ? (order.customer.firma ?? '—')
                      : `${order.customer.imie} ${order.customer.nazwisko}`
                  }
                />
                {order.customer.nip && <Row label="NIP" value={order.customer.nip} mono />}
                <Row label="E-mail" value={order.customer.email} />
                <Row label="Telefon" value={order.customer.telefon} />
                <Row
                  label="Adres faktury"
                  value={`${order.customer.ulica}, ${order.customer.kodPocztowy} ${order.customer.miasto}`}
                />
                {order.customer.deliveryDifferent && (
                  <Row
                    label="Adres dostawy"
                    value={`${order.customer.deliveryUlica ?? ''}, ${order.customer.deliveryKodPocztowy ?? ''} ${order.customer.deliveryMiasto ?? ''}`}
                  />
                )}
              </dl>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Pozycje i pliki</h2>
            {order.items.map((item) => (
              <div key={item.id} style={{ marginBottom: 'var(--space-4)' }}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <EnvelopePlaceholder
                      format={item.config.format}
                      colorId={item.config.color}
                      ratio="photo"
                      size="sm"
                      hideCaption
                      hasPrint={item.config.print}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <strong className="small">{item.name}</strong>
                    <p className="mono-sm muted" style={{ margin: 0 }}>
                      {item.price.quantity} szt. × {formatPrice(item.price.unitTotal)}
                    </p>
                    <p className="small muted" style={{ margin: 'var(--space-1) 0 0' }}>
                      Czas realizacji: {item.config.shippingSpeed === 'ekspres' ? 'Tryb ekspresowy' : 'Tryb standardowy'}
                    </p>
                    {item.config.printNotes && (
                      <p className="small" style={{ margin: 'var(--space-2) 0 0' }}>
                        Uwagi: {item.config.printNotes}
                      </p>
                    )}
                  </div>
                </div>

                {[...item.config.printFiles, ...(item.config.personalizationFile ? [item.config.personalizationFile] : [])].map(
                  (file) => (
                    <div className="file-card" key={file.id} style={{ marginTop: 'var(--space-2)' }}>
                      <span className="file-icon" aria-hidden="true">
                        {file.ext}
                      </span>
                      <span className="file-meta">
                        <span className="file-name">{file.name}</span>
                        <span className="mono-sm muted">{formatBytes(file.size)}</span>
                      </span>
                      {file.url && (
                        <a className="btn btn-secondary btn-sm" href={file.url} target="_blank" rel="noreferrer">
                          Pobierz
                        </a>
                      )}
                    </div>
                  )
                )}

                {item.config.personalization && (
                  <p className="small muted" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                    Zakres personalizacji:{' '}
                    <strong>
                      {personalizationScope(item.config.personalizationScope).label.toLowerCase()}
                    </strong>
                  </p>
                )}

                {item.config.personalization && item.config.personalizationMethod === 'reczna' && (
                  <details style={{ marginTop: 'var(--space-2)' }} open>
                    <summary className="small" style={{ cursor: 'pointer' }}>
                      Treść personalizacji wpisana przez klienta
                    </summary>
                    <pre
                      className="mono-sm"
                      style={{
                        whiteSpace: 'pre-wrap',
                        margin: 'var(--space-2) 0 0',
                        padding: 'var(--space-3)',
                        background: 'var(--color-paper)',
                        border: '1px solid var(--color-line)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {item.config.personalizationText || '—'}
                    </pre>
                  </details>
                )}
              </div>
            ))}

            <hr />
            <dl className="stack" style={{ gap: 'var(--space-2)' }}>
              <Row label="Produkty" value={formatPrice(order.totals.itemsGross)} mono />
              <Row label="Dostawa" value={formatPrice(order.totals.deliveryGross)} mono />
              <Row label="Razem brutto" value={formatPrice(order.totals.gross)} mono />
            </dl>
            <a
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--space-3)' }}
              href={`/api/dokumenty/faktura/${order.number}`}
            >
              Pobierz fakturę (PDF)
            </a>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Historia zmian</h2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[...order.history].reverse().map((entry, index) => (
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
