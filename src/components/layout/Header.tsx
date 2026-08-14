'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { isCheckoutRoute } from '@/lib/chrome';

/* Pasek celowo nie zawiera stron ofertowych (filarów K1, K2 i K4). Trzy pozycje
   zaczynające się od słowa „Koperty" konkurowały z przyciskiem „Zamów Koperty"
   i odciągały od konfiguratora, a linkowanie serwisowe do filarów zapewnia
   stopka (sekcja „Sklep") oraz treść strony głównej — sekcje „Formaty",
   „Usługi", „Realizacje" i „Więcej o kopertach". Nawigacja obsługuje tylko
   zadania użytkownika: zakup, wiedzę i kontakt. */
const NAV = [
  { href: '/blog', label: 'Blog' },
  { href: '/kontakt', label: 'Kontakt' },
];

export function Header() {
  const { count, ready } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Checkout: samo logo — bez nawigacji, bez koszyka, bez rozpraszaczy. */
  if (isCheckoutRoute(pathname)) {
    return (
      <header className="site-header site-header-zen">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Envelopes — strona główna">
            <Image src="/images/logo-icon.png" alt="" width={90} height={24} style={{ width: 'auto', height: '24px', objectFit: 'contain' }} aria-hidden="true" priority />
            Envelopes
          </Link>
        </div>
      </header>
    );
  }

  const isTransparent = pathname === '/' && !isScrolled && !menuOpen;

  return (
    <header className={`site-header ${isTransparent ? 'site-header-transparent' : ''}`}>
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label="Envelopes — strona główna">
          <Image src="/images/logo-icon.png" alt="" width={90} height={24} style={{ width: 'auto', height: '24px', objectFit: 'contain' }} aria-hidden="true" priority />
          Envelopes
        </Link>

        <nav className="nav" aria-label="Nawigacja główna">
          {/* Wejście do sklepu jako przycisk — to główna ścieżka, nie jeden
              z równorzędnych odnośników. */}
          <Link href="/#konfigurator" className="btn btn-sm nav-shop">
            Zamów Koperty
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            href={user ? '/profil' : '/logowanie'}
            className="icon-btn"
            aria-label={user ? 'Państwa konto' : 'Zaloguj się'}
            title={user ? 'Państwa konto' : 'Zaloguj się'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
            </svg>
          </Link>

          <Link href="/koszyk" className="icon-btn" aria-label={`Koszyk, pozycji: ${ready ? count : 0}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M3 5h2l2.2 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20.5 8H6" />
              <circle cx="10" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            {ready && count > 0 && <span className="cart-count">{count > 999 ? '999+' : count}</span>}
          </Link>

          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="menu-mobilne"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav" id="menu-mobilne">
          <div className="container">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/zamowienia">Złożone zamówienia</Link>
            <div style={{ paddingTop: 'var(--space-4)' }}>
              <Link href="/#konfigurator" className="btn btn-block">
                Przejdź do sklepu
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
