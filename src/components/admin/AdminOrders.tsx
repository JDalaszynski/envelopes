'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { PaymentPill } from '@/components/ui/StatusPill';
import { useAuth } from '@/components/providers/AuthProvider';
import { PAYMENT_STATUSES, PAYMENT_METHOD_LABEL } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/pricing';
import type { Order } from '@/lib/types';

/** Lista wszystkich zamówień wszystkich klientów (pkt 6.12). */
export function AdminOrders() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [payment, setPayment] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setBusy(true);
    const query = new URLSearchParams();
    if (payment !== 'all') query.set('platnosc', payment);
    if (search) query.set('szukaj', search);
    if (from) query.set('od', `${from}T00:00:00.000Z`);
    if (to) query.set('do', to);
    const res = await fetch(`/api/orders?${query.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      setOrders(json.orders ?? []);
    }
    setBusy(false);
  }, [getToken, payment, search, from, to]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin');
      return;
    }
    void load();
  }, [user, loading, router, load]);

  if (loading || !user || user.role !== 'admin') return <p className="muted">Weryfikacja dostępu…</p>;

  return (
    <>
      <div className="row-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h1>Zamówienia</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {orders.length} {orders.length === 1 ? 'zamówienie' : 'zamówień'} w widoku
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
          <div className="field">
            <label htmlFor="szukaj">Numer zamówienia lub klient</label>
            <input
              id="szukaj"
              className="input"
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
      </div>

      {busy ? (
        <p className="muted">Wczytywanie zamówień…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h2 style={{ fontSize: 20 }}>Brak zamówień spełniających kryteria</h2>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Numer</th>
                <th>Data</th>
                <th>Klient</th>
                <th>Produkt</th>
                <th>Ilość</th>
                <th>Kwota</th>
                <th>Płatność</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const quantity = order.items.reduce((sum, i) => sum + i.price.quantity, 0);
                return (
                  <tr key={order.number}>
                    <td className="mono-sm">
                      <Link href={`/admin/zamowienia/${order.number}`}>{order.number}</Link>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {order.customer.isCompany
                        ? order.customer.firma
                        : `${order.customer.imie} ${order.customer.nazwisko}`}
                      <span className="mono-sm muted" style={{ display: 'block' }}>
                        {order.customer.email}
                      </span>
                    </td>
                    <td>
                      {order.items.map((item) => (
                        <span key={item.id} style={{ display: 'block' }}>
                          {item.name}
                        </span>
                      ))}
                    </td>
                    <td className="mono-sm">{quantity}</td>
                    <td className="mono-sm">{formatPrice(order.totals.gross)}</td>
                    <td>
                      <PaymentPill status={order.paymentStatus} />
                      <span className="mono-sm muted" style={{ display: 'block', marginTop: 4 }}>
                        {PAYMENT_METHOD_LABEL[order.paymentMethod].split(' (')[0]}
                      </span>
                    </td>
                    <td>
                      <Link href={`/admin/zamowienia/${order.number}`} className="btn btn-secondary btn-sm">
                        Otwórz
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
