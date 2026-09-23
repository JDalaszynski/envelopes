'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PaymentPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/components/providers/AuthProvider';
import { PAYMENT_STATUSES, PAYMENT_METHOD_LABEL } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/pricing';
import type { Order } from '@/lib/types';

/** „1 zamówienie", „3 zamówienia", „12 zamówień" */
function ordersLabel(count: number): string {
  if (count === 1) return `${count} zamówienie`;
  const lastTwo = count % 100;
  const last = count % 10;
  const few = last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14);
  return `${count} ${few ? 'zamówienia' : 'zamówień'}`;
}

function customerName(order: Order): string {
  return order.customer.isCompany
    ? (order.customer.firma ?? '—')
    : `${order.customer.imie} ${order.customer.nazwisko}`;
}

/** Lista wszystkich zamówień wszystkich klientów (pkt 6.12). */
export function AdminOrders() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [payment, setPayment] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    setLoadError(null);
    const query = new URLSearchParams();
    if (payment !== 'all') query.set('platnosc', payment);
    if (search) query.set('szukaj', search);
    if (from) query.set('od', `${from}T00:00:00.000Z`);
    if (to) query.set('do', to);
    try {
      const res = await fetch(`/api/orders?${query.toString()}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const next: Order[] = json.orders ?? [];
        setOrders(next);
        // Zaznaczenie nie może wskazywać zamówień, których filtr już nie pokazuje
        setSelected((prev) => {
          const visible = new Set(next.map((o) => o.number));
          return new Set([...prev].filter((n) => visible.has(n)));
        });
      } else {
        setLoadError('Nie udało się wczytać zamówień. Odśwież stronę i spróbuj ponownie.');
      }
    } catch {
      setLoadError('Nie udało się połączyć z serwerem.');
    }
    setBusy(false);
    setLoaded(true);
  }, [getToken, payment, search, from, to]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    void load();
  }, [user, loading, router, load]);

  // Okno potwierdzenia to natywny <dialog> — daje pułapkę fokusu i Esc za darmo
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pendingDelete && !dialog.open) dialog.showModal();
    if (!pendingDelete && dialog.open) dialog.close();
  }, [pendingDelete]);

  const totalGross = useMemo(
    () => orders.reduce((sum, order) => sum + order.totals.gross, 0),
    [orders]
  );
  const filtersActive = payment !== 'all' || search !== '' || from !== '' || to !== '';
  const allSelected = orders.length > 0 && selected.size === orders.length;
  const pendingOrders = useMemo(
    () => orders.filter((order) => pendingDelete?.includes(order.number)),
    [orders, pendingDelete]
  );

  function clearFilters() {
    setPayment('all');
    setSearch('');
    setFrom('');
    setTo('');
  }

  function toggle(number: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  }

  function askDelete(numbers: string[]) {
    setNote(null);
    setDeleteError(null);
    setPendingDelete(numbers);
  }

  function closeDialog() {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!pendingDelete?.length) return;
    setDeleting(true);
    setDeleteError(null);
    const token = await getToken();

    const results = await Promise.all(
      pendingDelete.map(async (number) => {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(number)}`, {
            method: 'DELETE',
            headers: token ? { authorization: `Bearer ${token}` } : {},
          });
          // 404 = zamówienia już nie ma, czyli efekt ten sam, co po usunięciu
          return { number, ok: res.ok || res.status === 404 };
        } catch {
          return { number, ok: false };
        }
      })
    );
    setDeleting(false);

    const removed = results.filter((r) => r.ok).map((r) => r.number);
    const failed = results.filter((r) => !r.ok).map((r) => r.number);

    if (removed.length) {
      setOrders((prev) => prev.filter((order) => !removed.includes(order.number)));
      setSelected((prev) => new Set([...prev].filter((n) => !removed.includes(n))));
    }

    if (failed.length) {
      setPendingDelete(failed);
      setDeleteError(
        failed.length === 1
          ? `Nie udało się usunąć zamówienia ${failed[0]}. Spróbuj ponownie.`
          : `Nie udało się usunąć ${failed.length} zamówień. Spróbuj ponownie.`
      );
      if (removed.length) setNote(`Usunięto: ${removed.length}.`);
      return;
    }

    setPendingDelete(null);
    setNote(
      removed.length === 1
        ? `Zamówienie ${removed[0]} zostało usunięte.`
        : `Usunięto ${ordersLabel(removed.length)}.`
    );
  }

  if (loading || !user || user.role !== 'admin') return <p className="muted">Weryfikacja dostępu…</p>;

  return (
    <>
      <div className="admin-page-head">
        <h1>Zamówienia</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {loaded ? (
            <>
              {ordersLabel(orders.length)} w widoku
              {orders.length > 0 && (
                <>
                  {' · '}
                  <span className="mono-sm">{formatPrice(totalGross)}</span> brutto łącznie
                </>
              )}
            </>
          ) : (
            'Wczytywanie…'
          )}
        </p>
      </div>

      <div className="card admin-filters">
        <div className="admin-filters-grid">
          <div className="field">
            <label htmlFor="szukaj">Numer zamówienia lub klient</label>
            <input
              id="szukaj"
              className="input"
              type="search"
              placeholder="ENV-… lub nazwa firmy"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="platnosc">Płatność</label>
            <select
              id="platnosc"
              className="select input"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            >
              <option value="all">Wszystkie</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="od">Od</label>
            <input id="od" type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="do">Do</label>
            <input id="do" type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {filtersActive && (
          <button type="button" className="btn btn-ghost btn-sm admin-filters-clear" onClick={clearFilters}>
            Wyczyść filtry
          </button>
        )}
      </div>

      {note && (
        <p className="notice notice-success" role="status" style={{ marginBottom: 'var(--space-4)' }}>
          {note}
        </p>
      )}
      {loadError && (
        <p className="notice notice-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
          {loadError}
        </p>
      )}

      {selected.size > 0 && (
        <div className="admin-bulk-bar" role="region" aria-label="Akcje dla zaznaczonych zamówień">
          <span>
            Zaznaczono <strong>{selected.size}</strong>
          </span>
          <span className="row" style={{ gap: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
              Odznacz
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => askDelete([...selected])}
            >
              Usuń zaznaczone
            </button>
          </span>
        </div>
      )}

      {!loaded ? (
        <p className="muted">Wczytywanie zamówień…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2 style={{ fontSize: 20 }}>
            {filtersActive ? 'Brak zamówień spełniających kryteria' : 'Brak zamówień'}
          </h2>
          {filtersActive && (
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Wyczyść filtry
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap admin-orders-wrap" aria-busy={busy}>
          <table className={`data admin-orders${busy ? ' is-busy' : ''}`}>
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    aria-label="Zaznacz wszystkie zamówienia w widoku"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.number)))
                    }
                  />
                </th>
                <th>Zamówienie</th>
                <th>Klient</th>
                <th>Pozycje</th>
                <th className="col-amount">Kwota brutto</th>
                <th>Płatność</th>
                <th className="col-actions">
                  <span className="sr-only">Akcje</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const quantity = order.items.reduce((sum, i) => sum + i.price.quantity, 0);
                const [firstItem, ...restItems] = order.items;
                return (
                  <tr
                    key={order.number}
                    className={selected.has(order.number) ? 'is-selected' : undefined}
                    onClick={(e) => {
                      // Cały wiersz prowadzi do szczegółów, ale nie kolidujemy z checkboxem i przyciskami
                      if ((e.target as HTMLElement).closest('a, button, input, label')) return;
                      router.push(`/admin/zamowienia/${order.number}`);
                    }}
                  >
                    <td className="col-check">
                      <input
                        type="checkbox"
                        aria-label={`Zaznacz zamówienie ${order.number}`}
                        checked={selected.has(order.number)}
                        onChange={() => toggle(order.number)}
                      />
                    </td>
                    <td className="cell-order">
                      <Link href={`/admin/zamowienia/${order.number}`} className="order-link mono-sm">
                        {order.number}
                      </Link>
                      <span className="cell-sub">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="cell-customer">
                      <span className="cell-main">{customerName(order)}</span>
                      <span className="cell-sub" title={order.customer.email}>
                        {order.customer.email}
                      </span>
                    </td>
                    <td className="cell-items">
                      <span className="cell-main" title={firstItem?.name}>
                        {firstItem?.name ?? '—'}
                      </span>
                      <span className="cell-sub">
                        {quantity} szt.
                        {restItems.length > 0 && ` · +${restItems.length} ${restItems.length === 1 ? 'pozycja' : 'poz.'}`}
                      </span>
                    </td>
                    <td className="col-amount mono-sm">{formatPrice(order.totals.gross)}</td>
                    <td className="cell-payment">
                      <PaymentPill status={order.paymentStatus} />
                      <span className="cell-sub">
                        {PAYMENT_METHOD_LABEL[order.paymentMethod].split(' (')[0]}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button
                        type="button"
                        className="icon-btn icon-btn-danger"
                        aria-label={`Usuń zamówienie ${order.number}`}
                        title="Usuń zamówienie"
                        onClick={() => askDelete([order.number])}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="confirm-dialog"
        aria-labelledby="delete-title"
        onClose={() => {
          if (!deleting) {
            setPendingDelete(null);
            setDeleteError(null);
          }
        }}
        onCancel={(e) => {
          // Podczas usuwania Esc nie zamyka okna
          if (deleting) e.preventDefault();
        }}
      >
        {pendingDelete && (
          <>
            <h2 id="delete-title" style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>
              {pendingDelete.length === 1
                ? `Usunąć zamówienie ${pendingDelete[0]}?`
                : `Usunąć ${ordersLabel(pendingDelete.length)}?`}
            </h2>

            {pendingOrders.length === 1 ? (
              <p className="small" style={{ margin: '0 0 var(--space-3)' }}>
                {customerName(pendingOrders[0])} ·{' '}
                <span className="mono-sm">{formatPrice(pendingOrders[0].totals.gross)}</span>
              </p>
            ) : (
              <ul className="confirm-list small">
                {pendingOrders.slice(0, 6).map((order) => (
                  <li key={order.number}>
                    <span className="mono-sm">{order.number}</span> — {customerName(order)}
                  </li>
                ))}
                {pendingOrders.length > 6 && <li className="muted">…i {pendingOrders.length - 6} więcej</li>}
              </ul>
            )}

            {pendingOrders.some((o) => o.paymentStatus === 'oplacone') && (
              <p className="notice notice-error small" style={{ marginBottom: 'var(--space-3)' }}>
                {pendingOrders.length === 1
                  ? 'To zamówienie jest oznaczone jako opłacone.'
                  : 'Wśród wybranych są zamówienia oznaczone jako opłacone.'}
              </p>
            )}

            <p className="small muted" style={{ margin: '0 0 var(--space-4)' }}>
              Operacji nie można cofnąć — zamówienie zniknie także z konta klienta.
            </p>

            {deleteError && (
              <p className="field-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
                {deleteError}
              </p>
            )}

            <div className="confirm-actions">
              <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={deleting} autoFocus>
                Anuluj
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? 'Usuwanie…' : 'Usuń trwale'}
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
