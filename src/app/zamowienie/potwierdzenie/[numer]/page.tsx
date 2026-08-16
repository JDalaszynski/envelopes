import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { getOrder } from '@/lib/store';
import { formatDate, formatPrice } from '@/lib/pricing';
import {
  BANK_TRANSFER_DETAILS,
  isDeferredInvoice,
  isGatewayPayment,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
} from '@/lib/orders';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Potwierdzenie zamówienia',
  ...noindexMetadata,
};

export const dynamic = 'force-dynamic';

/**
 * Ekran potwierdzenia — treść zależna od metody płatności (pkt 1.12).
 */
export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ numer: string }>;
}) {
  const { numer } = await params;
  const order = await getOrder(numer);
  if (!order) notFound();

  const gateway = isGatewayPayment(order.paymentMethod);
  const deferred = isDeferredInvoice(order.paymentMethod);

  return (
    <section className="section">
      <div className="container container-narrow">
        <span className="eyebrow">Zamówienie przyjęte</span>

        {gateway && order.paymentStatus === 'oplacone' && (
          <h1>Płatność przyjęta — przystępujemy do realizacji zamówienia.</h1>
        )}
        {gateway && order.paymentStatus !== 'oplacone' && (
          <h1>Zamówienie zarejestrowane - czekamy na potwierdzenie płatności z bramki.</h1>
        )}
        {deferred && <h1>Zamówienie przyjęte do realizacji.</h1>}
        {order.paymentMethod === 'przelew' && <h1>Zamówienie zarejestrowane - czekamy na wpłatę.</h1>}

        <p className="price" style={{ marginTop: 'var(--space-4)' }}>
          {order.number}
        </p>
        <p className="muted">
          Numer zamówienia — prosimy podawać go w korespondencji z Biurem Obsługi Klienta.
          Potwierdzenie wysłaliśmy na adres {order.customer.email}.
        </p>

        {/* ── Ścieżka B: przelew tradycyjny (proforma) ── */}
        {order.paymentMethod === 'przelew' && (
          <div className="card card-lg" style={{ marginTop: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 22 }}>Dane do przelewu</h2>
            <dl className="stack" style={{ gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <Row label="Odbiorca" value={BANK_TRANSFER_DETAILS.odbiorca} />
              <Row label="Bank" value={BANK_TRANSFER_DETAILS.bank} />
              <Row label="Numer konta" value={BANK_TRANSFER_DETAILS.konto} mono />
              <Row label="Kwota" value={formatPrice(order.totals.gross)} mono />
              <Row label="Tytuł przelewu" value={order.number} mono />
            </dl>
            <div className="row" style={{ marginTop: 'var(--space-5)' }}>
              <a className="btn" href={`/api/dokumenty/proforma/${order.number}`}>
                Pobierz fakturę proforma (PDF)
              </a>
            </div>
            <p className="notice" style={{ marginTop: 'var(--space-5)' }}>
              Czekamy na zaksięgowanie wpłaty — druk ruszy dopiero po jej otrzymaniu (lub po ewentualnym zaakceptowaniu projektów przed drukiem).
            </p>
          </div>
        )}

        {/* ── Faktura z odroczonym terminem ── */}
        {deferred && (
          <div className="notice notice-success" style={{ marginTop: 'var(--space-6)' }}>
            Rozliczenie nastąpi na podstawie faktury z odroczonym terminem płatności. Termin
            zapłaty: <strong>{formatDate(order.paymentDueDate ?? order.estimatedDelivery)}</strong>.
            Produkcja rusza bez oczekiwania na wpłatę.
          </div>
        )}

        {/* ── Wizualizacja do akceptacji ── */}
        {order.requiresVisualization && (
          <div className="notice notice-seal" style={{ marginTop: 'var(--space-5)' }}>
            Zamówienie obejmuje nadruk lub personalizację. Wkrótce otrzymają Państwo e-mail z
            wizualizacją projektu do akceptacji.
            {order.paymentMethod === 'przelew' && (
              <>
                {' '}
                Wizualizację przygotowujemy niezależnie od statusu płatności — dzięki temu po
                zaksięgowaniu wpłaty produkcja rusza bez dodatkowej zwłoki.
              </>
            )}
          </div>
        )}

        {/* ── Podsumowanie ── */}
        <div className="card card-lg" style={{ marginTop: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 22, marginBottom: 'var(--space-4)' }}>Podsumowanie zamówienia</h2>

          {order.items.map((item) => (
            <div
              className="row"
              key={item.id}
              style={{ gap: 'var(--space-4)', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}
            >
              <div style={{ width: 96, flexShrink: 0 }}>
                <EnvelopePlaceholder
                  format={item.config.format}
                  colorId={item.config.color}
                  ratio="photo"
                  size="sm"
                  hideCaption
                  hasPrint={item.config.print}
                />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong>{item.name}</strong>
                <p className="mono-sm muted" style={{ margin: 0 }}>
                  {item.price.quantity} szt. × {formatPrice(item.price.unitTotal)}
                </p>
              </div>
              <span className="mono">{formatPrice(item.price.gross)}</span>
            </div>
          ))}

          <hr />
          <dl className="stack" style={{ gap: 'var(--space-2)' }}>
            <Row label="Dostawa" value={formatPrice(order.totals.deliveryGross)} mono />
            <Row label="Wartość netto" value={formatPrice(order.totals.net)} mono />
            <Row label="VAT 23%" value={formatPrice(order.totals.vat)} mono />
            <Row label="Razem brutto" value={formatPrice(order.totals.gross)} mono />
            <Row label="Metoda płatności" value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
            <Row label="Status płatności" value={PAYMENT_STATUS_LABEL[order.paymentStatus]} />
            <Row
              label="Sposób dostawy"
              value={
                order.delivery.method === 'kurier'
                  ? 'Kurier'
                  : `Paczkomat InPost ${order.delivery.point?.name ?? ''}`
              }
            />
            <Row label="Orientacyjna dostawa" value={formatDate(order.estimatedDelivery)} />
          </dl>
        </div>

        <div className="row" style={{ marginTop: 'var(--space-6)' }}>
          <Link href="/zamowienia" className="btn">
            Przejdź do panelu zamówień
          </Link>
          <Link href="/" className="btn btn-secondary">
            Wróć na stronę główną
          </Link>
        </div>

        {!order.userId && (
          <div className="card" style={{ marginTop: 'var(--space-5)' }}>
            <strong>Chcą Państwo śledzić to zamówienie w panelu?</strong>
            <p className="small muted" style={{ margin: 'var(--space-2) 0 var(--space-3)' }}>
              Konto założone na adres {order.customer.email} automatycznie powiąże się z tym
              zamówieniem — wystarczy ustawić hasło.
            </p>
            <Link href={`/rejestracja?email=${encodeURIComponent(order.customer.email)}`} className="btn btn-secondary">
              Załóż konto
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="row-between">
      <dt className="small muted">{label}</dt>
      <dd className={mono ? 'mono' : ''} style={{ margin: 0, textAlign: 'right' }}>
        {value}
      </dd>
    </div>
  );
}
