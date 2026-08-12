'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CONTACT_DETAILS } from '@/lib/orders';
import { CookieSettingsLink } from '@/components/layout/CookieBanner';
import { isCheckoutRoute } from '@/lib/chrome';

export function Footer() {
  const pathname = usePathname();

  /* Checkout: stopka ograniczona do tego, co musi być dostępne prawnie. */
  if (isCheckoutRoute(pathname)) {
    return (
      <footer className="site-footer site-footer-zen">
        <div className="container footer-bottom" style={{ marginTop: 0, borderTop: 'none' }}>
          <span>
            © {new Date().getFullYear()} {CONTACT_DETAILS.company}
          </span>
          <span className="row" style={{ gap: 'var(--space-4)' }}>
            <Link href="/regulamin">Regulamin</Link>
            <Link href="/polityka-prywatnosci">Polityka Prywatności</Link>
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>Envelopes</h3>
            <p style={{ color: 'rgba(255,255,255,.72)', maxWidth: '34ch' }}>
              Koperty ozdobne w 19 kolorach, z nadrukiem i adresowaniem. Realizacja od 2 dni
              roboczych, faktura VAT do każdego zamówienia.
            </p>
            <div className="pay-badges" style={{ marginTop: 'var(--space-4)' }}>
              <span className="pay-badge">Przelewy24</span>
              <span className="pay-badge">BLIK</span>
              <span className="pay-badge">Przelew</span>
              <span className="pay-badge">Faktura 14 dni</span>
            </div>
          </div>

          <div>
            <h3>Sklep</h3>
            <ul className="footer-list">
              <li><Link href="/#konfigurator">Konfigurator</Link></li>
              <li><Link href="/#kolory">Paleta kolorów</Link></li>
              <li><Link href="/#formaty">Formaty i zastosowania</Link></li>
              <li><Link href="/#faq">Najczęstsze pytania</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/kontakt">Kontakt</Link></li>
            </ul>
          </div>

          <div>
            <h3>Konto</h3>
            <ul className="footer-list">
              <li><Link href="/logowanie">Logowanie</Link></li>
              <li><Link href="/rejestracja">Rejestracja</Link></li>
              <li><Link href="/profil">Profil użytkownika</Link></li>
              <li><Link href="/zamowienia">Złożone zamówienia</Link></li>
              <li><Link href="/koszyk">Koszyk</Link></li>
            </ul>
          </div>

          <div>
            <h3>Informacje</h3>
            <ul className="footer-list">
              <li><Link href="/regulamin">Regulamin</Link></li>
              <li><Link href="/polityka-prywatnosci">Polityka Prywatności</Link></li>
              <li><Link href="/pliki-cookies">Pliki Cookies</Link></li>
              <li><CookieSettingsLink /></li>
            </ul>
            <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
              <span className="pay-badge">LinkedIn</span>
              <span className="pay-badge">Instagram</span>
              <span className="pay-badge">Facebook</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} <a href="https://jdalaszynski.pl/" target="_blank" rel="noopener noreferrer">Jakub Dalaszyński</a>. Wszelkie prawa zastrzeżone.
          </span>
        </div>
      </div>
    </footer>
  );
}
