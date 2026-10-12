'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { formatDay, warsawDay, warsawTime } from '@/lib/accounting';
import { saveBlob } from '@/lib/download';
import { formatPrice, plural } from '@/lib/pricing';
import { buildRegisterPdf, registerFileName } from '@/lib/sales-register-pdf';
import {
  MONTH_PATTERN,
  P24_STATUS_LABEL,
  monthLabel,
  type SalesRegister as Register,
} from '@/lib/sales-register';
import { VISUALIZATION_FONTS, type VisualizationFontRole } from '@/lib/visualization-pdf';

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

function paidLabel(count: number): string {
  return `${count} ${plural(count, 'opłacona', 'opłacone', 'opłaconych')}`;
}

const SOURCE_NOTE = {
  infakt: {
    'brak-konfiguracji':
      'inFakt nie jest skonfigurowany (brak INFAKT_API_KEY) — ewidencja pokazuje faktury zapisane wcześniej przy zamówieniach i nie widzi faktur wystawionych poza sklepem.',
    blad: 'Nie udało się pobrać faktur z inFakt — ewidencja pokazuje ich ostatni zapis w sklepie.',
  },
  p24: {
    'brak-konfiguracji':
      'Przelewy24 nie jest skonfigurowane — dane płatności pochodzą wyłącznie z zapisu w sklepie.',
    blad: 'Części transakcji nie udało się potwierdzić w Przelewy24.',
  },
} as const;

/**
 * Ewidencja sprzedaży (pkt 6.12) — miesięczne zestawienie łączące zamówienie
 * w sklepie, fakturę w inFakt i transakcję w Przelewy24, z kontrolą zgodności.
 * Podgląd i PDF powstają z tych samych danych.
 */
export function SalesRegister() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();

  const [month, setMonth] = useState(() => warsawDay(new Date()).slice(0, 7));
  const [register, setRegister] = useState<Register | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!MONTH_PATTERN.test(month)) return;
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/ewidencja?miesiac=${month}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setRegister(json.register as Register);
      else setError(json.error ?? 'Nie udało się wczytać ewidencji.');
    } catch {
      setError('Nie udało się połączyć z serwerem.');
    }
    setBusy(false);
  }, [getToken, month]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    void load();
  }, [user, loading, router, load]);

  async function exportPdf() {
    if (!register) return;
    setExporting(true);
    setError(null);
    try {
      const bytes = await buildRegisterPdf({ register, fonts: await loadFonts() });
      saveBlob(new Blob([bytes], { type: 'application/pdf' }), registerFileName(register));
    } catch (cause) {
      console.error('[Ewidencja] Nie udało się złożyć PDF-a:', cause);
      setError('Nie udało się wygenerować PDF-a. Odśwież stronę i spróbuj ponownie.');
    }
    setExporting(false);
  }

  /** Przypisuje fakturę z inFakt do wskazanego zamówienia i przelicza ewidencję. */
  async function link(orderNumber: string, uuid: string, invoiceNumber: string) {
    setLinking(uuid);
    setError(null);
    setNote(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/orders/${orderNumber}/faktura`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'link', uuid }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setNote(`Powiązano fakturę ${invoiceNumber} z zamówieniem ${orderNumber}.`);
      else setError(json.error ?? 'Nie udało się powiązać faktury.');
    } catch {
      setError('Nie udało się połączyć z serwerem.');
    }
    setLinking(null);
    await load();
  }

  if (loading || !user || user.role !== 'admin') return <p className="muted">Weryfikacja dostępu…</p>;

  const stale = register && register.month !== month;
  const shown = register && !stale ? register : null;

  return (
    <>
      <div className="admin-page-head">
        <h1>Ewidencja sprzedaży</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Zamówienie w sklepie, faktura w inFakt i wpłata w Przelewy24 w jednym wierszu — z kontrolą,
          czy kwoty i dokumenty się zgadzają.
        </p>
      </div>

      <div className="card register-toolbar">
        <div className="field">
          <label htmlFor="miesiac">Miesiąc</label>
          <input
            id="miesiac"
            type="month"
            className="input"
            // Przeglądarka bez pola miesiąca pokaże zwykłe pole tekstowe
            placeholder="RRRR-MM"
            value={month}
            max={warsawDay(new Date()).slice(0, 7)}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void load()}>
            {busy ? 'Wczytywanie…' : 'Odśwież dane'}
          </button>
          <button type="button" className="btn" disabled={!shown || busy || exporting} onClick={() => void exportPdf()}>
            {exporting ? 'Generowanie…' : 'Pobierz PDF'}
          </button>
        </div>
      </div>

      {note && (
        <p className="notice notice-success" role="status" style={{ marginBottom: 'var(--space-4)' }}>
          {note}
        </p>
      )}
      {error && (
        <p className="notice notice-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </p>
      )}

      {!shown ? (
        <p className="muted">{error ? '' : 'Wczytywanie ewidencji…'}</p>
      ) : (
        <div aria-busy={busy} className={busy ? 'register is-busy' : 'register'}>
          {(['infakt', 'p24'] as const).map((source) => {
            const state = shown.sources[source];
            if (state.state === 'ok' && !state.detail) return null;
            return (
              <p className="notice" key={source} style={{ marginBottom: 'var(--space-4)' }}>
                {state.state !== 'ok' && SOURCE_NOTE[source][state.state]}
                {state.detail && ` ${state.detail}`}
              </p>
            );
          })}
          {shown.sources.infakt.sandbox && shown.sources.infakt.state === 'ok' && (
            <p className="notice notice-error" style={{ marginBottom: 'var(--space-4)' }}>
              Faktury pochodzą z konta testowego inFakt (sandbox) — to nie są dokumenty księgowe.
            </p>
          )}

          <div className="register-tiles">
            <Tile label="Sprzedaż" value={String(shown.totals.sales.count)} sub={monthLabel(shown.month)} />
            <Tile label="Netto" value={formatPrice(shown.totals.sales.net)} />
            <Tile label="VAT" value={formatPrice(shown.totals.sales.vat)} />
            <Tile label="Brutto" value={formatPrice(shown.totals.sales.gross)} />
            <Tile
              label="Przelewy24"
              value={formatPrice(shown.totals.paidGateway.gross)}
              sub={paidLabel(shown.totals.paidGateway.count)}
            />
            <Tile
              label="Przelewem"
              value={formatPrice(shown.totals.paidTransfer.gross)}
              sub={paidLabel(shown.totals.paidTransfer.count)}
            />
            <Tile
              label="Do wyjaśnienia"
              value={`${shown.issues.errors} / ${shown.issues.warnings}`}
              sub="błędy / uwagi"
              alarm={shown.issues.errors > 0}
            />
          </div>

          <div className="table-wrap">
            <table className="data register-table">
              <thead>
                <tr>
                  <th>Lp.</th>
                  <th>Data sprzedaży</th>
                  <th>Zamówienie</th>
                  <th className="col-buyer">Nabywca</th>
                  <th className="col-items">Przedmiot sprzedaży</th>
                  <th>Faktura</th>
                  <th className="num">Netto</th>
                  <th className="num">VAT</th>
                  <th className="num">Brutto</th>
                  <th>Zapłata</th>
                </tr>
              </thead>
              <tbody>
                {shown.rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="muted">
                      Brak sprzedaży w tym miesiącu.
                    </td>
                  </tr>
                )}
                {shown.rows.map((row) => (
                  <Fragment key={row.orderNumber}>
                    <tr className={row.checks.length ? 'has-checks' : undefined}>
                      <td className="mono-sm">{row.lp}</td>
                      <td>
                        {formatDay(row.day)}
                        {row.basis === 'zaplata' && <span className="cell-sub">wg wpłaty</span>}
                      </td>
                      <td>
                        <Link href={`/admin/zamowienia/${row.orderNumber}`} className="mono-sm">
                          {row.orderNumber}
                        </Link>
                        <span className="cell-sub">z {formatDay(row.orderDay)}</span>
                      </td>
                      <td>
                        {row.buyer.name}
                        {row.buyer.nip && <span className="cell-sub">NIP {row.buyer.nip}</span>}
                        <span className="cell-sub">{row.buyer.address}</span>
                      </td>
                      <td>
                        {row.lines.map((line, index) => (
                          <span key={index} className="register-line">
                            {line.name}
                            {line.unit === 'szt.' && ` — ${line.quantity} szt.`}
                          </span>
                        ))}
                      </td>
                      <td>
                        {row.invoice ? (
                          <>
                            <span className="mono-sm">{row.invoice.number}</span>
                            <span className="cell-sub">wyst. {formatDay(row.invoice.invoiceDate)}</span>
                            {row.invoice.ksefNumber && (
                              <span className="cell-sub mono-sm register-ksef">KSeF {row.invoice.ksefNumber}</span>
                            )}
                          </>
                        ) : (
                          <span className="badge badge-error">brak faktury</span>
                        )}
                      </td>
                      <td className="num mono-sm">{formatPrice(row.net)}</td>
                      <td className="num mono-sm">{formatPrice(row.vat)}</td>
                      <td className="num mono-sm">
                        <strong>{formatPrice(row.gross)}</strong>
                      </td>
                      <td>
                        {row.payment.label}
                        <span className="cell-sub">
                          {row.payment.paid
                            ? `zapłacono ${formatDay(row.payment.paidDay)}`
                            : `nieopłacone${row.payment.dueDay ? `, termin ${formatDay(row.payment.dueDay)}` : ''}`}
                        </span>
                        {row.payment.transaction && (
                          <span className="cell-sub mono-sm">P24 nr {row.payment.transaction}</span>
                        )}
                        {row.payment.p24Status !== null && (
                          <span className="cell-sub">
                            wg bramki: {P24_STATUS_LABEL[row.payment.p24Status] ?? row.payment.p24Status}
                            {row.payment.p24Amount !== null && `, ${formatPrice(row.payment.p24Amount)}`}
                          </span>
                        )}
                        {row.payment.batchId && (
                          <span className="cell-sub">wypłata nr {row.payment.batchId}</span>
                        )}
                      </td>
                    </tr>
                    {row.checks.length > 0 && (
                      <tr className="register-checks">
                        <td colSpan={2} />
                        <td colSpan={8}>
                          {row.checks.map((check) => (
                            <span key={check.code} className={`register-check register-check-${check.level}`}>
                              <strong>{check.level === 'blad' ? 'Błąd' : 'Uwaga'}:</strong> {check.message}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
              {shown.rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={6}>Razem sprzedaż ({shown.totals.sales.count})</td>
                    <td className="num mono-sm">{formatPrice(shown.totals.sales.net)}</td>
                    <td className="num mono-sm">{formatPrice(shown.totals.sales.vat)}</td>
                    <td className="num mono-sm">{formatPrice(shown.totals.sales.gross)}</td>
                    <td />
                  </tr>
                  {shown.totals.corrections.count > 0 && (
                    <>
                      <tr>
                        <td colSpan={6}>Faktury korygujące ({shown.totals.corrections.count})</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.corrections.net)}</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.corrections.vat)}</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.corrections.gross)}</td>
                        <td />
                      </tr>
                      <tr>
                        <td colSpan={6}>Razem po korektach</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.afterCorrections.net)}</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.afterCorrections.vat)}</td>
                        <td className="num mono-sm">{formatPrice(shown.totals.afterCorrections.gross)}</td>
                        <td />
                      </tr>
                    </>
                  )}
                </tfoot>
              )}
            </table>
          </div>

          {shown.unlinkedInvoices.length > 0 && (
            <section className="register-section">
              <h2>Faktury w inFakt bez zamówienia w sklepie</h2>
              <p className="small muted">
                Faktury z datą sprzedaży w tym miesiącu, których nie przypisano do żadnego zamówienia —
                sprzedaż poza sklepem albo faktura do powiązania. Nie wchodzą do sum ewidencji.
              </p>
              <div className="table-wrap">
                <table className="data register-table">
                  <thead>
                    <tr>
                      <th>Faktura</th>
                      <th>Wystawiona</th>
                      <th>Sprzedaż</th>
                      <th>Nabywca</th>
                      <th className="num">Brutto</th>
                      <th>Prawdopodobne zamówienie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.unlinkedInvoices.map((invoice) => (
                      <tr key={invoice.uuid}>
                        <td className="mono-sm">{invoice.number}</td>
                        <td>{formatDay(invoice.invoiceDate)}</td>
                        <td>{formatDay(invoice.saleDate)}</td>
                        <td>
                          {invoice.client || '—'}
                          {invoice.nip && <span className="cell-sub">NIP {invoice.nip}</span>}
                        </td>
                        <td className="num mono-sm">{formatPrice(invoice.gross)}</td>
                        <td>
                          {invoice.suggestion ? (
                            <span className="row" style={{ gap: 'var(--space-2)' }}>
                              <span>
                                <Link
                                  href={`/admin/zamowienia/${invoice.suggestion.orderNumber}`}
                                  className="mono-sm"
                                >
                                  {invoice.suggestion.orderNumber}
                                </Link>
                                <span className="cell-sub">{invoice.suggestion.basis}</span>
                              </span>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={Boolean(linking) || busy}
                                onClick={() =>
                                  void link(invoice.suggestion!.orderNumber, invoice.uuid, invoice.number)
                                }
                              >
                                {linking === invoice.uuid ? 'Wiązanie…' : 'Powiąż'}
                              </button>
                            </span>
                          ) : (
                            <span className="muted small">
                              Brak jednoznacznego dopasowania — powiąż z poziomu zamówienia.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {shown.corrections.length > 0 && (
            <section className="register-section">
              <h2>Faktury korygujące</h2>
              <p className="small muted">
                Korekty wystawione w tym miesiącu. Kwoty to różnica wynikająca z korekty.
              </p>
              <div className="table-wrap">
                <table className="data register-table">
                  <thead>
                    <tr>
                      <th>Korekta</th>
                      <th>Wystawiona</th>
                      <th>Do faktury</th>
                      <th>Zamówienie</th>
                      <th>Nabywca i przyczyna</th>
                      <th className="num">Netto</th>
                      <th className="num">VAT</th>
                      <th className="num">Brutto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.corrections.map((correction) => (
                      <tr key={correction.number}>
                        <td className="mono-sm">{correction.number}</td>
                        <td>{formatDay(correction.invoiceDate)}</td>
                        <td className="mono-sm">{correction.correctedNumber || '—'}</td>
                        <td className="mono-sm">
                          {correction.orderNumber ? (
                            <Link href={`/admin/zamowienia/${correction.orderNumber}`}>
                              {correction.orderNumber}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {correction.client || '—'}
                          {correction.reason && <span className="cell-sub">{correction.reason}</span>}
                        </td>
                        <td className="num mono-sm">{formatPrice(correction.net)}</td>
                        <td className="num mono-sm">{formatPrice(correction.vat)}</td>
                        <td className="num mono-sm">{formatPrice(correction.gross)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {shown.pendingOrders.length > 0 && (
            <section className="register-section">
              <h2>Zamówienia nieopłacone i bez faktury</h2>
              <p className="small muted">
                Złożone w tym miesiącu, bez wpłaty i bez faktury — sprzedażą jeszcze nie są, więc nie
                wchodzą do ewidencji.
              </p>
              <div className="table-wrap">
                <table className="data register-table">
                  <thead>
                    <tr>
                      <th>Zamówienie</th>
                      <th>Data</th>
                      <th>Zamawiający</th>
                      <th>Sposób zapłaty</th>
                      <th className="num">Brutto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.pendingOrders.map((order) => (
                      <tr key={order.orderNumber}>
                        <td>
                          <Link href={`/admin/zamowienia/${order.orderNumber}`} className="mono-sm">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td>{formatDay(order.orderDay)}</td>
                        <td>{order.buyer}</td>
                        <td>{order.label}</td>
                        <td className="num mono-sm">{formatPrice(order.gross)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="small muted" style={{ marginTop: 'var(--space-5)' }}>
            Sprzedaż należy do miesiąca wg daty sprzedaży z faktury; opłacone zamówienie bez faktury stoi
            w miesiącu wpłaty. Kwoty pochodzą z faktury, a przy jej braku — z zamówienia. Stan na{' '}
            {formatDay(warsawDay(shown.generatedAt))} {warsawTime(shown.generatedAt)}.
          </p>
        </div>
      )}
    </>
  );
}

function Tile({
  label,
  value,
  sub,
  alarm,
}: {
  label: string;
  value: string;
  sub?: string;
  alarm?: boolean;
}) {
  return (
    <div className={`register-tile${alarm ? ' is-alarm' : ''}`}>
      <span className="register-tile-label">{label}</span>
      <span className="register-tile-value mono">{value}</span>
      {sub && <span className="register-tile-sub">{sub}</span>}
    </div>
  );
}
