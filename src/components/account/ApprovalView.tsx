'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { formatBytes } from '@/components/ui/FileDropzone';
import { formatDate, formatDateTime } from '@/lib/pricing';
import { PAYMENT_STATUS_LABEL, isDeferredInvoice } from '@/lib/orders';
import type { EnvelopeConfig, PaymentMethod, PaymentStatus, VisualizationVersion } from '@/lib/types';

interface PublicOrder {
  number: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  visualizationStatus: 'brak' | 'oczekuje' | 'zaakceptowano' | 'uwagi';
  visualizations: VisualizationVersion[];
  items: { name: string; config: EnvelopeConfig }[];
  customerFirstName: string;
  estimatedDelivery: string;
}

export function ApprovalView({ token }: { token: string }) {
  return (
    <Suspense fallback={<p className="muted">Wczytywanie…</p>}>
      <ApprovalInner token={token} />
    </Suspense>
  );
}

function ApprovalInner({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(searchParams.get('akcja') === 'uwagi');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/akceptacja/${token}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? 'Nie udało się wczytać wizualizacji.');
      return;
    }
    setOrder(json.order);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function respond(action: 'akceptuj' | 'uwagi') {
    setBusy(true);
    const res = await fetch(`/api/akceptacja/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, comment }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? 'Nie udało się zapisać decyzji.');
      return;
    }
    setResult(
      action === 'akceptuj'
        ? 'Dziękujemy. Projekt został zaakceptowany.'
        : 'Dziękujemy. Uwagi trafiły do grafika — przygotujemy poprawioną wersję i prześlemy ją do ponownej akceptacji.'
    );
    setShowComment(false);
    await load();
  }

  if (error) {
    return (
      <div className="empty-state">
        <h1 style={{ fontSize: 24 }}>{error}</h1>
        <p className="muted">
          Jeżeli link pochodzi ze starszej wiadomości, aktualną wizualizację znajdą Państwo w panelu
          zamówień.
        </p>
        <Link href="/zamowienia" className="btn">
          Przejdź do panelu zamówień
        </Link>
      </div>
    );
  }

  if (!order) return <p className="muted">Wczytywanie wizualizacji…</p>;

  const latest = order.visualizations[order.visualizations.length - 1];
  const awaiting = order.visualizationStatus === 'oczekuje';

  return (
    <>
      <span className="eyebrow">Akceptacja projektu</span>
      <h1>Wizualizacja do zamówienia {order.number}</h1>
      <p className="muted">
        {order.customerFirstName ? `${order.customerFirstName}, prosimy` : 'Prosimy'} o sprawdzenie
        projektu przed skierowaniem zamówienia do produkcji.
      </p>

      {result && (
        <p className="notice notice-success" style={{ marginTop: 'var(--space-5)' }}>
          {result}
        </p>
      )}

      <div className="card card-lg" style={{ marginTop: 'var(--space-5)' }}>
        {latest ? (
          <>
            <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
              <div>
                <strong>{order.items[0]?.name}</strong>
                <p className="small muted" style={{ margin: 0 }}>
                  Wersja {latest.version} · przesłano {formatDateTime(latest.sentAt)}
                </p>
              </div>
              <span
                className={
                  order.visualizationStatus === 'zaakceptowano'
                    ? 'badge badge-success'
                    : order.visualizationStatus === 'uwagi'
                      ? 'badge badge-error'
                      : 'badge badge-seal'
                }
              >
                {order.visualizationStatus === 'zaakceptowano'
                  ? 'Zaakceptowano'
                  : order.visualizationStatus === 'uwagi'
                    ? 'Zgłoszono uwagi'
                    : 'Oczekuje na akceptację'}
              </span>
            </div>

            <EnvelopePlaceholder
              format={order.items[0]?.config.format ?? 'DL'}
              colorId={order.items[0]?.config.color ?? 'ecru'}
              ratio="wide"
              hasPrint={order.items[0]?.config.print}
            />
            <p className="mono-sm muted" style={{ marginTop: 'var(--space-3)' }}>
              {latest.file.name} · {formatBytes(latest.file.size)}
              {latest.file.url && (
                <>
                  {' · '}
                  <a href={latest.file.url} target="_blank" rel="noreferrer">
                    otwórz plik w nowej karcie
                  </a>
                </>
              )}
            </p>
          </>
        ) : (
          <p className="muted">Wizualizacja nie została jeszcze dołączona do tego zamówienia.</p>
        )}

        {awaiting && (
          <>
            {order.paymentStatus === 'oczekuje' && !isDeferredInvoice(order.paymentMethod) && (
              <p className="notice" style={{ marginTop: 'var(--space-4)' }}>
                Status płatności: {PAYMENT_STATUS_LABEL[order.paymentStatus]}. Po akceptacji
                projektu zamówienie trafi do druku dopiero po zaksięgowaniu wpłaty.
              </p>
            )}

            <div className="row" style={{ marginTop: 'var(--space-5)' }}>
              <button
                type="button"
                className="btn btn-lg"
                disabled={busy}
                onClick={() => void respond('akceptuj')}
              >
                Akceptuję projekt
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
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
                  placeholder="Prosimy opisać, co należy poprawić."
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
          </>
        )}

        <p className="small muted" style={{ marginTop: 'var(--space-5)' }}>
          Orientacyjna data dostawy po akceptacji: {formatDate(order.estimatedDelivery)}.
        </p>
      </div>

      {order.visualizations.length > 1 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Poprzednie wersje</h2>
          {order.visualizations.slice(0, -1).map((version) => (
            <p className="small" key={version.id}>
              <span className="mono-sm muted">Wersja {version.version}</span> —{' '}
              {version.customerComment ? `uwagi: ${version.customerComment}` : 'bez uwag'}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
