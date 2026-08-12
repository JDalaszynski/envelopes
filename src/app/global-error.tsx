'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled global error:', error);
  }, [error]);

  return (
    <html lang="pl">
      <body style={{ fontFamily: 'sans-serif', padding: '40px', textAlign: 'center' }}>
        <h2>Wystąpił błąd krytyczny</h2>
        <p>Przepraszamy, wystąpił problem podczas przetwarzania aplikacji.</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px',
          }}
        >
          Spróbuj ponownie
        </button>
      </body>
    </html>
  );
}
