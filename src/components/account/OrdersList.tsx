'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { StatusPill, PaymentPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/components/providers/AuthProvider';
import { ORDER_STATUSES } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/pricing';
import type { Order } from '@/lib/types';

export function OrdersList() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    const res = await fetch('/api/orders', { headers: { authorization: `Bearer ${token}` } });
    if (res.ok) {
      const json = await res.json();
      setOrders(json.orders ?? []);
    }
    setBusy(false);
  }, [getToken]);

  useEffect(() => {
    if (!loading && !user) router.push('/logowanie');
    else if (user) void load();
  }, [user, loading, router, load]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) return false;
      if (from && order.createdAt < from) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        if (
          !order.number.toLowerCase().includes(q) &&
          !order.items.some((i) => i.name.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [orders, status, search, from]);

  if (loading || !user) return <p className="muted">Wczytywanie…</p>;

  return (
    <>
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Złożone zamówienia</h1>
        <Link href="/profil" className="btn btn-secondary">
          Profil użytkownika
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
          <div className="field">
            <label htmlFor="szukaj">Szukaj po numerze</label>
            <input
              id="szukaj"
              className="input"
              placeholder="ENV-20260805-0147"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="select input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Wszystkie</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="od">Zamówienia od</label>
            <input
              id="od"
              type="date"
              className="input"
              value={from.slice(0, 10)}
              onChange={(e) => setFrom(e.target.value ? `${e.target.value}T00:00:00.000Z` : '')}
            />
          </div>
        </div>
      </div>

      {busy && <p className="muted">Wczytywanie zamówień…</p>}

      {!busy && filtered.length === 0 && (
        <div className="empty-state">
          <h2 style={{ fontSize: 22 }}>Brak zamówień do wyświetlenia</h2>
          <p className="muted">
            {orders.length === 0
              ? 'Nie złożyli Państwo jeszcze żadnego zamówienia.'
              : 'Żadne zamówienie nie pasuje do wybranych filtrów.'}
          </p>
          <Link href="/#konfigurator" className="btn">
            Przejdź do konfiguratora
          </Link>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="stack">
          {filtered.map((order) => (
            <article className="card" key={order.number}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <Link href={`/zamowienia/${order.number}`} className="mono" style={{ fontSize: 15 }}>
                    {order.number}
                  </Link>
                  <p className="small muted" style={{ margin: '2px 0 var(--space-3)' }}>
                    {formatDate(order.createdAt)}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {order.items.map((item) => (
                      <li key={item.id} className="small">
                        {item.name}{' '}
                        <span className="mono-sm muted">({item.price.quantity} szt.)</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="mono" style={{ margin: '0 0 var(--space-2)' }}>
                    {formatPrice(order.totals.gross)}
                  </p>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <StatusPill status={order.status} />
                    <PaymentPill status={order.paymentStatus} />
                  </div>
                </div>
              </div>

              {order.status === 'czeka_na_akceptacje' && order.visualizationStatus === 'oczekuje' && (
                <p className="notice notice-seal" style={{ marginTop: 'var(--space-4)' }}>
                  Wizualizacja czeka na Państwa akceptację.{' '}
                  <Link href={`/zamowienia/${order.number}#wizualizacja`}>Przejdź do akceptacji</Link>
                </p>
              )}

              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <Link href={`/zamowienia/${order.number}`} className="btn btn-secondary btn-sm">
                  Szczegóły zamówienia
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
