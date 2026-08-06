'use client';

import { useState } from 'react';

import { FORMATS } from '@/lib/catalog';

/** Dedykowana ścieżka lead-gen B2B — zapytanie o wycenę hurtową (pkt 6.3, 7). */
export function QuoteForm() {
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
          topic: 'Zapytanie ofertowe — wycena hurtowa',
          quantity: data.get('quantity'),
          message: `Format: ${data.get('format')}. Nadruk: ${
            data.get('print') === 'on' ? 'tak' : 'nie'
          }. Personalizacja: ${data.get('personalization') === 'on' ? 'tak' : 'nie'}. Termin: ${
            data.get('deadline') || 'nieokreślony'
          }. Uwagi: ${data.get('message') || '—'}`,
          consent: data.get('consent') === 'on',
          website: data.get('website'),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Nie udało się wysłać zapytania.');
      setState('done');
      setMessage('Dziękujemy. Wycenę przygotujemy w ciągu jednego dnia roboczego.');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Wystąpił błąd.');
    }
  }

  if (state === 'done') {
    return (
      <div className="card card-lg">
        <h2>Zapytanie przyjęte</h2>
        <p className="notice notice-success" style={{ marginTop: 'var(--space-4)' }}>
          {message}
        </p>
      </div>
    );
  }

  return (
    <form className="card card-lg" onSubmit={submit}>
      <span className="eyebrow">Dla firm</span>
      <h2>Zapytaj o wycenę hurtową</h2>
      <p className="small muted" style={{ marginTop: 'var(--space-2)' }}>
        Przy większych wolumenach ustalamy harmonogram dostaw i sposób rozliczenia. Cena jednostkowa
        pozostaje stała — wycena dotyczy organizacji zamówienia, nie negocjacji stawki.
      </p>

      <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
        <div className="field">
          <label htmlFor="q-name">Imię i nazwisko</label>
          <input id="q-name" name="name" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="q-company">Firma</label>
          <input id="q-company" name="company" className="input" />
        </div>
        <div className="field">
          <label htmlFor="q-email">Adres e-mail</label>
          <input id="q-email" name="email" type="email" className="input" required />
        </div>
        <div className="field">
          <label htmlFor="q-phone">Telefon</label>
          <input id="q-phone" name="phone" type="tel" className="input" />
        </div>
        <div className="field">
          <label htmlFor="q-quantity">Szacowana ilość (szt.)</label>
          <input
            id="q-quantity"
            name="quantity"
            type="number"
            min={1}
            className="input"
            placeholder="np. 5000"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="q-format">Format</label>
          <select id="q-format" name="format" className="select input">
            {FORMATS.filter((f) => !f.hidden).map((format) => (
              <option key={format.id} value={format.id}>
                {format.id} — {format.dimensions}
              </option>
            ))}
            <option value="nie wiem">Jeszcze nie wiem</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="q-deadline">Termin realizacji</label>
          <input id="q-deadline" name="deadline" type="date" className="input" />
        </div>
        <div className="field">
          <span className="field-label">Zakres</span>
          <label className="checkbox-row">
            <input type="checkbox" name="print" />
            <span>Nadruk firmowy</span>
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="personalization" />
            <span>Adresowanie kopert</span>
          </label>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="q-message">Dodatkowe informacje</label>
          <textarea id="q-message" name="message" className="textarea" />
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" aria-label="Nie wypełniaj" />
      </div>

      <label className="checkbox-row" style={{ marginTop: 'var(--space-4)' }}>
        <input type="checkbox" name="consent" required />
        <span>Wyrażam zgodę na przetwarzanie danych w celu przygotowania wyceny.</span>
      </label>

      {state === 'error' && (
        <p className="field-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {message}
        </p>
      )}

      <button type="submit" className="btn" style={{ marginTop: 'var(--space-5)' }} disabled={state === 'sending'}>
        {state === 'sending' ? 'Wysyłanie…' : 'Poproś o wycenę'}
      </button>
    </form>
  );
}
