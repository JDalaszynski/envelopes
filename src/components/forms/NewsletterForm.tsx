'use client';

import Link from 'next/link';
import { useState } from 'react';

/** Zapis do newslettera — kontakt trafia do listy w Brevo (pkt 8.1). */
export function NewsletterForm({ variant = 'section' }: { variant?: 'section' | 'footer' }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isFooter = variant === 'footer';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      setState('error');
      setMessage('Do zapisu potrzebna jest zgoda na przetwarzanie danych.');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się zapisać adresu.');
      setState('done');
      setMessage('Dziękujemy. Adres został zapisany — pierwszą wiadomość wyślemy w tym miesiącu.');
      setEmail('');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Wystąpił błąd.');
    }
  }

  if (state === 'done') {
    return (
      <p className={isFooter ? 'small' : 'notice notice-success'} style={isFooter ? { color: 'rgba(255,255,255,.85)' } : undefined}>
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 'var(--space-3)' }}>
      {isFooter && <h3>Newsletter</h3>}
      <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'nowrap' }}>
        <label htmlFor={`newsletter-${variant}`} className="sr-only">
          Adres e-mail
        </label>
        <input
          id={`newsletter-${variant}`}
          type="email"
          required
          className="input"
          placeholder="Adres e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={isFooter ? { background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.25)', color: '#fff' } : undefined}
        />
        <button type="submit" className="btn" disabled={state === 'sending'}>
          {state === 'sending' ? 'Zapisuję…' : 'Zapisz się'}
        </button>
      </div>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span style={isFooter ? { color: 'rgba(255,255,255,.7)', fontSize: 13 } : undefined}>
          Wyrażam zgodę na otrzymywanie informacji handlowych na podany adres e-mail. Zgodę można
          wycofać w każdej chwili. Szczegóły w{' '}
          <Link href="/polityka-prywatnosci">Polityce Prywatności</Link>.
        </span>
      </label>
      {state === 'error' && <p className="field-error">{message}</p>}
    </form>
  );
}
