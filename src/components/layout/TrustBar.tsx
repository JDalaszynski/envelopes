'use client';

import { usePathname } from 'next/navigation';

import { isCheckoutRoute } from '@/lib/chrome';

/** Pasek zaufania widoczny globalnie (sekcja 7) — poza checkoutem. */
export function TrustBar() {
  const pathname = usePathname();
  if (isCheckoutRoute(pathname)) return null;

  return (
    <div className="trust-bar">
      <div className="container">
        <span>
          <Check /> Bezpieczne płatności Przelewy24
        </span>
        <span>
          <Check /> Wysyłka od 2 dni roboczych
        </span>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
