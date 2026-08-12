'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging in dev
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <section className="section">
      <div className="container container-narrow" style={{ textAlign: 'center' }}>
        <span className="eyebrow">Wystąpił błąd</span>
        <h1 style={{ marginTop: 'var(--space-2)' }}>Coś poszło nie tak</h1>
        <p className="muted" style={{ maxWidth: '52ch', margin: 'var(--space-4) auto var(--space-6)' }}>
          Przepraszamy, wystąpił niespodziewany błąd podczas ładowania strony.
        </p>
        <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => reset()} className="btn btn-lg">
            Spróbuj ponownie
          </button>
          <Link href="/" className="btn btn-secondary btn-lg">
            Strona główna
          </Link>
        </div>
      </div>
    </section>
  );
}
