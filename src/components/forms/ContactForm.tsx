'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

const TOPICS = ['Zapytanie ofertowe', 'Wsparcie zamówienia', 'Współpraca', 'Inne'];

export function ContactForm() {
  return (
    <Suspense fallback={<div className="card card-lg">Wczytywanie formularza…</div>}>
      <ContactInner />
    </Suspense>
  );
}

function ContactInner() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('zamowienie');

  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState('sending');
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          company: data.get('company'),
          email: data.get('email'),
          phone: data.get('phone'),
          topic: data.get('topic'),
          message: data.get('message'),
          consent: data.get('consent') === 'on',
          website: data.get('website'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się wysłać wiadomości.');
      setState('done');
      setMessage('Dziękujemy. Odpowiemy w ciągu jednego dnia roboczego.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Wystąpił błąd.');
    }
  }

  if (state === 'done') {
    return (
      <div className="card card-lg">
        <h2>Wiadomość wysłana</h2>
        <p className="notice notice-success" style={{ marginTop: 'var(--space-4)' }}>
          {message}
        </p>
      </div>
    );
  }

  return (
    <form className="card card-lg" onSubmit={submit}>
      <h2>Formularz kontaktowy</h2>

      <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
        <div className="field">
          <label htmlFor="name">Imię i nazwisko</label>
          <input id="name" name="name" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="company">Firma</label>
          <input id="company" name="company" className="input" />
        </div>
        <div className="field">
          <label htmlFor="email">Adres e-mail</label>
          <input id="email" name="email" type="email" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefon</label>
          <input id="phone" name="phone" type="tel" className="input" />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="topic">Temat</label>
          <select id="topic" name="topic" className="select input" defaultValue={orderNumber ? 'Wsparcie zamówienia' : TOPICS[0]}>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="message">Wiadomość</label>
          <textarea
            id="message"
            name="message"
            className="textarea"
            required
            defaultValue={orderNumber ? `Dotyczy zamówienia ${orderNumber}: ` : ''}
          />
        </div>
      </div>

      {/* Honeypot — pole ukryte przed użytkownikiem, wypełniane przez boty */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="website">Nie wypełniaj tego pola</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="checkbox-row" style={{ marginTop: 'var(--space-4)' }}>
        <input type="checkbox" name="consent" required />
        <span>
          Wyrażam zgodę na przetwarzanie danych w celu udzielenia odpowiedzi. Szczegóły w{' '}
          <Link href="/polityka-prywatnosci">Polityce Prywatności</Link>.
        </span>
      </label>

      {state === 'error' && (
        <p className="field-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {message}
        </p>
      )}

      <button type="submit" className="btn" style={{ marginTop: 'var(--space-5)' }} disabled={state === 'sending'}>
        {state === 'sending' ? 'Wysyłanie…' : 'Wyślij wiadomość'}
      </button>
    </form>
  );
}
