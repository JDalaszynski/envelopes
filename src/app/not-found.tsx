import type { Metadata } from 'next';
import Link from 'next/link';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';

/**
 * Strona 404 — brandowana i zwracająca prawidłowy kod HTTP 404
 * (Next.js ustawia go automatycznie dla not-found.tsx), a nie „soft 404".
 */
export const metadata: Metadata = {
  title: 'Nie znaleziono strony',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="section">
      <div className="container container-narrow" style={{ textAlign: 'center' }}>
        <div style={{ maxWidth: 260, margin: '0 auto var(--space-6)' }}>
          <EnvelopePlaceholder format="DL" colorId="taupe" ratio="photo" hideCaption />
        </div>
        <span className="eyebrow">Błąd 404</span>
        <h1>Ta przesyłka nie dotarła pod wskazany adres</h1>
        <p className="muted" style={{ maxWidth: '52ch', margin: 'var(--space-4) auto var(--space-6)' }}>
          Strona, której Państwo szukają, nie istnieje lub została przeniesiona. Poniżej najczęściej
          odwiedzane miejsca w serwisie.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/#konfigurator" className="btn btn-lg">
            Przejdź do konfiguratora
          </Link>
          <Link href="/blog" className="btn btn-secondary btn-lg">
            Blog
          </Link>
          <Link href="/kontakt" className="btn btn-secondary btn-lg">
            Kontakt
          </Link>
        </div>
      </div>
    </section>
  );
}
