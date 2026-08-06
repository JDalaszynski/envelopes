'use client';

import Link from 'next/link';

import { useAuth } from '@/components/providers/AuthProvider';

export function AdminBar() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-bar">
      <div className="container row-between">
        <span className="row" style={{ gap: 'var(--space-4)' }}>
          <strong style={{ color: '#fff', fontSize: 14 }}>Envelopes — panel administracyjny</strong>
          {user?.role === 'admin' && <Link href="/admin/zamowienia">Zamówienia</Link>}
        </span>
        {user?.role === 'admin' && (
          <span className="row" style={{ gap: 'var(--space-4)' }}>
            <span className="mono-sm" style={{ color: 'rgba(255,255,255,.7)' }}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,.3)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Wyloguj
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
