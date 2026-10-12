'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { formatDay, isValidDay, type InvoiceStatusResponse } from '@/lib/accounting';
import { downloadWithAuth } from '@/lib/download';
import { formatPrice } from '@/lib/pricing';
import type { Order } from '@/lib/types';

const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: 'Szkic',
  printed: 'Wystawiona',
  sent: 'Wysłana do klienta',
  paid: 'Opłacona',
};

function ksefLabel(status?: string | null, number?: string | null): string {
  if (number) return number;
  if (status === 'pending' || status === 'sent') return 'W trakcie przetwarzania';
  if (status === 'success') return 'Przyjęta';
  if (status === 'error' || status === 'rejected') return 'Odrzucona — szczegóły w inFakt';
  return 'Nie wysłano';
}

interface Confirmation {
  title: string;
  body: string;
  label: string;
  action: 'email' | 'ksef' | 'unlink' | 'markPaid';
}

/** Ile razy dopytujemy o fakturę, którą inFakt jeszcze tworzy (co 3 s) */
const PENDING_CHECKS = 20;

/**
 * Faktura zamówienia w inFakt (pkt 6.12): wystawienie z podglądem tego, co
 * trafi na dokument, powiązanie z fakturą wystawioną wcześniej oraz akcje
 * na fakturze już istniejącej.
 */
export function AdminInvoiceCard({
  order,
  getToken,
  onOrderChange,
}: {
  order: Order;
  getToken: () => Promise<string | null>;
  onOrderChange: (order: Order) => void;
}) {
  const issueRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const pendingChecks = useRef(0);

  const [status, setStatus] = useState<InvoiceStatusResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [issuing, setIssuing] = useState(false);
  const [saleDate, setSaleDate] = useState('');
  const [sendToKsef, setSendToKsef] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkNumber, setLinkNumber] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const number = order.number;

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${number}/faktura`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Nie udało się wczytać stanu faktury.');
        return;
      }
      const next = json as InvoiceStatusResponse;
      setStatus(next);
      onOrderChange(next.order);
    } catch {
      setError('Nie udało się połączyć z serwerem.');
    }
  }, [number, getToken, onOrderChange]);

  useEffect(() => {
    void load();
  }, [load]);

  // inFakt tworzy fakturę asynchronicznie — dopytujemy, aż odda numer
  useEffect(() => {
    if (!status?.pending) {
      pendingChecks.current = 0;
      return;
    }
    if (pendingChecks.current >= PENDING_CHECKS) return;
    const timer = window.setTimeout(() => {
      pendingChecks.current += 1;
      void load();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [status, load]);

  // Okna to natywne <dialog> — pułapka fokusu i Esc bez własnego kodu
  useEffect(() => {
    const dialog = issueRef.current;
    if (!dialog) return;
    if (issuing && !dialog.open) dialog.showModal();
    if (!issuing && dialog.open) dialog.close();
  }, [issuing]);

  useEffect(() => {
    const dialog = confirmRef.current;
    if (!dialog) return;
    if (confirmation && !dialog.open) dialog.showModal();
    if (!confirmation && dialog.open) dialog.close();
  }, [confirmation]);

  async function act(body: Record<string, unknown>): Promise<boolean> {
    setBusy(String(body.action));
    setError(null);
    setNote(null);
    setWarnings([]);
    let ok = false;
    try {
      const token = await getToken();
      const res = await fetch(`/api/orders/${number}/faktura`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (json.order) onOrderChange(json.order as Order);
      if (res.ok) {
        ok = true;
        setNote(json.message ?? 'Gotowe.');
        setWarnings(json.warnings ?? []);
      } else {
        setError(json.error ?? 'Operacja nie powiodła się.');
      }
    } catch {
      setError('Nie udało się połączyć z serwerem.');
    }
    // Stan zawsze bierzemy z serwera — także po błędzie, bo akcja mogła zdążyć coś zapisać
    await load();
    setBusy(null);
    return ok;
  }

  function openIssue() {
    if (!status?.draft) return;
    setSaleDate(status.draft.saleDate);
    // Faktura na firmę trafia do KSeF; dla osoby prywatnej to tylko opcja
    setSendToKsef(Boolean(status.ksefActive && status.draft.buyer.nip));
    setError(null);
    setIssuing(true);
  }

  async function downloadPdf() {
    setBusy('pdf');
    setError(null);
    const problem = await downloadWithAuth(
      `/api/dokumenty/faktura/${number}`,
      await getToken(),
      `faktura-${number}.pdf`
    );
    if (problem) setError(problem);
    setBusy(null);
  }

  const invoice = order.invoice ?? null;
  const draft = status?.draft ?? null;
  const configured = status?.configured ?? true;
  const mismatch = invoice ? Math.round(invoice.gross * 100) !== Math.round(order.totals.gross * 100) : false;
  const paidInInfakt = invoice ? invoice.status === 'paid' || Boolean(invoice.paidDate) : false;
  const ksefDone = Boolean(invoice?.ksefNumber) || ['pending', 'sent', 'success'].includes(invoice?.ksefStatus ?? '');
  const saleDateValid = isValidDay(saleDate);

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 20 }}>Faktura</h2>
        <span className={`badge${status?.sandbox ? ' badge-error' : ''}`}>
          {status?.sandbox ? 'inFakt — konto testowe' : 'inFakt'}
        </span>
      </div>

      {note && (
        <p className="notice notice-success" role="status" style={{ marginBottom: 'var(--space-3)' }}>
          {note}
        </p>
      )}
      {warnings.map((warning) => (
        <p className="notice notice-error" role="alert" key={warning} style={{ marginBottom: 'var(--space-3)' }}>
          {warning}
        </p>
      ))}
      {error && !issuing && (
        <p className="notice notice-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
          {error}
        </p>
      )}

      {!status ? (
        <p className="small muted" style={{ margin: 0 }}>
          Sprawdzanie stanu w inFakt…
        </p>
      ) : (
        <>
          {!configured && (
            <p className="notice" style={{ marginBottom: 'var(--space-3)' }}>
              Integracja z inFakt nie jest skonfigurowana. Dodaj zmienną{' '}
              <span className="mono-sm">INFAKT_API_KEY</span> w ustawieniach projektu na Vercelu
              (Settings → Environment Variables) i wdróż serwis ponownie.
            </p>
          )}
          {configured && status.error && (
            <p className="notice notice-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              {status.error}
            </p>
          )}

          {invoice ? (
            <>
              <dl className="stack" style={{ gap: 'var(--space-2)' }}>
                <Row label="Numer" value={invoice.number} mono />
                <Row label="Data wystawienia" value={formatDay(invoice.invoiceDate)} />
                <Row label="Data sprzedaży" value={formatDay(invoice.saleDate)} />
                <Row label="Netto" value={formatPrice(invoice.net)} mono />
                <Row label="VAT" value={formatPrice(invoice.vat)} mono />
                <Row label="Brutto" value={formatPrice(invoice.gross)} mono />
                <Row
                  label="Status w inFakt"
                  value={
                    (INVOICE_STATUS_LABEL[invoice.status] ?? invoice.status) +
                    (invoice.paidDate ? ` ${formatDay(invoice.paidDate)}` : '')
                  }
                />
                <Row label="KSeF" value={ksefLabel(invoice.ksefStatus, invoice.ksefNumber)} mono={Boolean(invoice.ksefNumber)} />
              </dl>

              {mismatch && (
                <p className="notice notice-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                  Kwota faktury ({formatPrice(invoice.gross)}) różni się od kwoty zamówienia (
                  {formatPrice(order.totals.gross)}).
                </p>
              )}
              {status.invoiceMissing && (
                <p className="notice notice-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                  Tej faktury nie ma już w inFakt. Odłącz ją od zamówienia, żeby wystawić albo
                  powiązać właściwą.
                </p>
              )}
              {invoice.status === 'draft' && (
                <p className="notice" style={{ marginTop: 'var(--space-3)' }}>
                  Faktura jest w inFakt szkicem — PDF będzie dostępny po jej zatwierdzeniu w inFakt.
                </p>
              )}

              <div className="row" style={{ marginTop: 'var(--space-4)', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={Boolean(busy) || !configured || invoice.status === 'draft' || status.invoiceMissing}
                  onClick={() => void downloadPdf()}
                >
                  {busy === 'pdf' ? 'Pobieranie…' : 'Pobierz PDF'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={Boolean(busy) || !configured || status.invoiceMissing}
                  onClick={() =>
                    setConfirmation({
                      action: 'email',
                      title: `Wysłać fakturę ${invoice.number} klientowi?`,
                      body: `inFakt wyśle fakturę e-mailem na adres ${order.customer.email}. Wiadomość wychodzi z inFakt, w jego szablonie.`,
                      label: 'Wyślij fakturę',
                    })
                  }
                >
                  Wyślij klientowi
                </button>
                {status.ksefActive && !ksefDone && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={Boolean(busy) || status.invoiceMissing || mismatch}
                    onClick={() =>
                      setConfirmation({
                        action: 'ksef',
                        title: `Wysłać fakturę ${invoice.number} do KSeF?`,
                        body: 'Faktury przyjętej przez KSeF nie da się wycofać ani poprawić — zmiany wymagają faktury korygującej.',
                        label: 'Wyślij do KSeF',
                      })
                    }
                  >
                    Wyślij do KSeF
                  </button>
                )}
                {order.paymentStatus === 'oplacone' && !paidInInfakt && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={Boolean(busy) || !configured || status.invoiceMissing}
                    onClick={() =>
                      setConfirmation({
                        action: 'markPaid',
                        title: 'Oznaczyć fakturę jako zapłaconą?',
                        body: `Zamówienie jest opłacone, a faktura ${invoice.number} w inFakt nadal figuruje jako nieopłacona.`,
                        label: 'Oznacz jako zapłaconą',
                      })
                    }
                  >
                    Oznacz jako zapłaconą w inFakt
                  </button>
                )}
              </div>
              <div className="row" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    setBusy('refresh');
                    setNote(null);
                    void load().then(() => setBusy(null));
                  }}
                >
                  {busy === 'refresh' ? 'Odświeżanie…' : 'Odśwież z inFakt'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    setConfirmation({
                      action: 'unlink',
                      title: `Odłączyć fakturę ${invoice.number} od zamówienia?`,
                      body: 'Zamówienie przestanie wskazywać tę fakturę. Sama faktura zostanie w inFakt bez zmian — nie zostanie usunięta ani skorygowana.',
                      label: 'Odłącz fakturę',
                    })
                  }
                >
                  Odłącz od zamówienia
                </button>
              </div>
              <p className="small muted" style={{ margin: 'var(--space-3) 0 0' }}>
                {invoice.origin === 'wystawiona' ? 'Wystawiona z panelu' : 'Powiązana z fakturą z inFakt'}{' '}
                przez {invoice.linkedBy}.
              </p>
            </>
          ) : status.pending || order.invoiceTask ? (
            <>
              <p className="notice notice-seal" role="status">
                inFakt tworzy fakturę do tego zamówienia. Stan odświeża się sam — nie wystawiaj jej
                drugi raz.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'var(--space-3)' }}
                disabled={Boolean(busy)}
                onClick={() => {
                  pendingChecks.current = 0;
                  void load();
                }}
              >
                Sprawdź teraz
              </button>
            </>
          ) : (
            <>
              <p className="small muted" style={{ margin: '0 0 var(--space-3)' }}>
                Do tego zamówienia nie ma jeszcze faktury.
              </p>
              {draft?.blockers.map((blocker) => (
                <p className="notice notice-error" key={blocker} style={{ marginBottom: 'var(--space-3)' }}>
                  {blocker}
                </p>
              ))}
              <div className="row" style={{ gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn"
                  disabled={Boolean(busy) || !configured || !draft || draft.blockers.length > 0}
                  onClick={openIssue}
                >
                  Wystaw fakturę w inFakt
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={Boolean(busy) || !configured}
                  onClick={() => setLinking((value) => !value)}
                >
                  {linking ? 'Anuluj' : 'Powiąż istniejącą fakturę'}
                </button>
              </div>

              {linking && (
                <form
                  className="field"
                  style={{ marginTop: 'var(--space-3)' }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act({ action: 'link', invoiceNumber: linkNumber }).then((ok) => {
                      if (ok) {
                        setLinking(false);
                        setLinkNumber('');
                      }
                    });
                  }}
                >
                  <label htmlFor="invoice-link">Numer faktury wystawionej w inFakt</label>
                  <div className="row" style={{ flexWrap: 'nowrap', gap: 'var(--space-2)' }}>
                    <input
                      id="invoice-link"
                      className="input"
                      placeholder="np. 12/10/2026"
                      value={linkNumber}
                      onChange={(e) => setLinkNumber(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary" disabled={Boolean(busy) || !linkNumber.trim()}>
                      {busy === 'link' ? 'Szukanie…' : 'Powiąż'}
                    </button>
                  </div>
                  <span className="field-hint">
                    Dla faktur wystawionych ręcznie, zanim sklep zaczął wystawiać je sam.
                  </span>
                </form>
              )}
            </>
          )}
        </>
      )}

      {/* ── Podgląd faktury przed wystawieniem ── */}
      <dialog
        ref={issueRef}
        className="confirm-dialog invoice-dialog"
        aria-labelledby="issue-title"
        onClose={() => setIssuing(false)}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        {issuing && draft && (
          <>
            <h2 id="issue-title" style={{ fontSize: 20, marginBottom: 'var(--space-1)' }}>
              Faktura do zamówienia {order.number}
            </h2>
            <p className="small muted" style={{ margin: '0 0 var(--space-4)' }}>
              Sprawdź dane — po wystawieniu faktura trafia do księgowości w inFakt.
              {status?.nextNumber && (
                <>
                  {' '}
                  Przewidywany numer: <span className="mono-sm">{status.nextNumber}</span>.
                </>
              )}
            </p>

            <div className="invoice-preview">
              <section>
                <h3 className="field-label">Nabywca</h3>
                <p className="small" style={{ margin: 0 }}>
                  <strong>{draft.buyer.name}</strong>
                  {draft.buyer.nip && (
                    <>
                      <br />
                      NIP <span className="mono-sm">{draft.buyer.nip}</span>
                    </>
                  )}
                  <br />
                  {draft.buyer.street}
                  <br />
                  {draft.buyer.postCode} {draft.buyer.city}
                </p>
              </section>

              <section>
                <h3 className="field-label">Pozycje</h3>
                <table className="invoice-lines">
                  <thead>
                    <tr>
                      <th>Nazwa na fakturze</th>
                      <th>Ilość</th>
                      <th>Wartość brutto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lines.map((line, index) => (
                      <tr key={index}>
                        <td>{line.name}</td>
                        <td className="mono-sm">
                          {line.quantity} {line.unit}
                        </td>
                        <td className="mono-sm">{formatPrice(line.gross / 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Razem brutto (VAT 23% w tym)</td>
                      <td className="mono-sm">{formatPrice(draft.gross / 100)}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>

              <section className="invoice-dates">
                <div className="field">
                  <span className="field-label">Data wystawienia</span>
                  <span className="small">{formatDay(draft.invoiceDate)}</span>
                </div>
                <div className="field">
                  <label htmlFor="sale-date">Data sprzedaży</label>
                  <input
                    id="sale-date"
                    type="date"
                    className="input"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <span className="field-label">Płatność</span>
                  <span className="small">
                    {draft.paymentMethod === 'przelewy24' ? 'Przelewy24' : 'Przelew'} ·{' '}
                    {draft.paid
                      ? `zapłacono ${formatDay(draft.paidDay)}`
                      : `termin ${formatDay(draft.dueDate)}`}
                  </span>
                </div>
              </section>

              <section>
                <h3 className="field-label">Uwagi na fakturze</h3>
                <p className="small" style={{ margin: 0 }}>
                  {draft.notes}
                </p>
              </section>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={sendToKsef}
                  disabled={!status?.ksefActive}
                  onChange={(e) => setSendToKsef(e.target.checked)}
                />
                <span>
                  Wyślij do KSeF po wystawieniu
                  <span className="small muted" style={{ display: 'block' }}>
                    {status?.ksefActive
                      ? 'Faktury przyjętej przez KSeF nie da się wycofać — zmiany wymagają korekty.'
                      : 'Niedostępne: konto inFakt nie ma aktywnej integracji z KSeF.'}
                  </span>
                </span>
              </label>
            </div>

            {saleDateValid && saleDate.slice(0, 7) !== draft.invoiceDate.slice(0, 7) && (
              <p className="notice small" style={{ marginTop: 'var(--space-3)' }}>
                Data sprzedaży i data wystawienia wypadają w różnych miesiącach — w ewidencji sprzedaży
                faktura trafi do miesiąca daty sprzedaży ({saleDate.slice(5, 7)}.{saleDate.slice(0, 4)}).
              </p>
            )}
            {draft.warnings.map((warning) => (
              <p className="notice small" key={warning} style={{ marginTop: 'var(--space-3)' }}>
                {warning}
              </p>
            ))}
            {error && (
              <p className="notice notice-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                {error}
              </p>
            )}

            <div className="confirm-actions" style={{ marginTop: 'var(--space-4)' }}>
              <button type="button" className="btn btn-secondary" disabled={Boolean(busy)} onClick={() => setIssuing(false)}>
                Anuluj
              </button>
              <button
                type="button"
                className="btn"
                disabled={Boolean(busy) || !saleDateValid}
                onClick={() =>
                  void act({ action: 'issue', saleDate, sendToKsef }).then((ok) => {
                    if (ok) setIssuing(false);
                  })
                }
              >
                {busy === 'issue' ? 'Wystawianie…' : 'Wystaw fakturę'}
              </button>
            </div>
          </>
        )}
      </dialog>

      {/* ── Potwierdzenie akcji, których nie da się cofnąć jednym kliknięciem ── */}
      <dialog
        ref={confirmRef}
        className="confirm-dialog"
        aria-labelledby="invoice-confirm-title"
        onClose={() => setConfirmation(null)}
      >
        {confirmation && (
          <>
            <h2 id="invoice-confirm-title" style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>
              {confirmation.title}
            </h2>
            <p className="small" style={{ margin: '0 0 var(--space-4)' }}>
              {confirmation.body}
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmation(null)} autoFocus>
                Anuluj
              </button>
              <button
                type="button"
                className={confirmation.action === 'unlink' ? 'btn btn-danger' : 'btn'}
                onClick={() => {
                  const { action } = confirmation;
                  setConfirmation(null);
                  void act({ action });
                }}
              >
                {confirmation.label}
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
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
