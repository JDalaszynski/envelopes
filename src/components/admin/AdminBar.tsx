'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/providers/AuthProvider';

const TABS = [
  { href: '/admin/zamowienia', label: 'Zamówienia' },
  { href: '/admin/generator-wizualizacji', label: 'Generator Wizualizacji' },
];

export function AdminBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="admin-bar">
      <div className="container row-between">
        <span className="row" style={{ gap: 'var(--space-4)' }}>
          <strong style={{ color: '#fff', fontSize: 14 }}>Envelopes — panel administracyjny</strong>
          {user?.role === 'admin' && (
            <nav className="admin-tabs" aria-label="Panel administracyjny">
              {TABS.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={pathname.startsWith(tab.href) ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
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
