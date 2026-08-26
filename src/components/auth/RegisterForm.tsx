'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="card card-lg">Wczytywanie…</div>}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const { register, loginWithGoogle, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accountType, setAccountType] = useState<'firmowe' | 'indywidualne'>(
    searchParams.get('typ') === 'firmowe' ? 'firmowe' : 'indywidualne'
  );
  const [form, setForm] = useState({
    email: searchParams.get('email') ?? '',
    password: '',
    confirm: '',
    imie: '',
    nazwisko: '',
    firma: '',
    nip: '',
    telefon: '',
  });
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const patch = (changes: Partial<typeof form>) => setForm((prev) => ({ ...prev, ...changes }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Podane hasła różnią się od siebie.');
      return;
    }
    if (!terms) {
      setError('Do założenia konta wymagana jest akceptacja regulaminu.');
      return;
    }
    if (accountType === 'firmowe' && !form.firma.trim()) {
      setError('Prosimy podać nazwę firmy.');
      return;
    }

    setBusy(true);
    try {
      const displayName =
        accountType === 'firmowe' ? form.firma : `${form.imie} ${form.nazwisko}`.trim();
      await register(form.email, form.password, displayName);

      const token = await getToken();
      if (token) {
        await fetch('/api/profil', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({
            accountType,
            imie: form.imie,
            nazwisko: form.nazwisko,
            firma: form.firma,
            nip: form.nip,
            telefon: form.telefon,
            marketingConsent: marketing,
          }),
        });

        await fetch('/api/auth/post-register', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify({ method: 'email', name: displayName }),
        });
      }

      router.push('/profil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się założyć konta.');
      setBusy(false);
    }
  }

  return (
    <div className="card card-lg">
      <h1 style={{ fontSize: 28 }}>Rejestracja</h1>
      <p className="muted small" style={{ marginTop: 'var(--space-2)' }}>
        Konto pozwala zapisywać konfiguracje, powtarzać zamówienia jednym kliknięciem i mieć
        wszystkie złożone zamówienia w jednym miejscu.
      </p>

      <form onSubmit={submit} className="stack" style={{ marginTop: 'var(--space-5)' }}>
        <div className="grid grid-2" role="group" aria-label="Typ konta">
          {(['firmowe', 'indywidualne'] as const).map((type) => (
            <button
              key={type}
              type="button"
              className="option-card"
              aria-pressed={accountType === type}
              onClick={() => setAccountType(type)}
            >
              <span>
                <strong>{type === 'firmowe' ? 'Konto firmowe' : 'Konto indywidualne'}</strong>
                <small>
                  {type === 'firmowe'
                    ? 'Faktura VAT na dane firmy lub instytucji.'
                    : 'Zakupy prywatne, faktura imienna lub paragon.'}
                </small>
              </span>
            </button>
          ))}
        </div>

        {accountType === 'firmowe' ? (
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="firma">Nazwa firmy</label>
              <input
                id="firma"
                className="input"
                value={form.firma}
                onChange={(e) => patch({ firma: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="nip">NIP (opcjonalnie)</label>
              <input
                id="nip"
                className="input"
                value={form.nip}
                onChange={(e) => patch({ nip: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="imie">Imię</label>
              <input
                id="imie"
                className="input"
                value={form.imie}
                onChange={(e) => patch({ imie: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="nazwisko">Nazwisko</label>
              <input
                id="nazwisko"
                className="input"
                value={form.nazwisko}
                onChange={(e) => patch({ nazwisko: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="grid grid-2">
          <div className="field">
            <label htmlFor="email">Adres e-mail</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="telefon">Telefon</label>
            <input
              id="telefon"
              className="input"
              type="tel"
              value={form.telefon}
              onChange={(e) => patch({ telefon: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="haslo">Hasło</label>
            <input
              id="haslo"
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => patch({ password: e.target.value })}
            />
            <span className="field-hint">Minimum 6 znaków.</span>
          </div>
          <div className="field">
            <label htmlFor="haslo2">Powtórz hasło</label>
            <input
              id="haslo2"
              className="input"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => patch({ confirm: e.target.value })}
            />
          </div>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            Akceptuję <Link href="/regulamin">Regulamin</Link> oraz{' '}
            <Link href="/polityka-prywatnosci">Politykę Prywatności</Link>.
          </span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
          />
          <span>Chcę otrzymywać informacje handlowe i poradniki (opcjonalnie).</span>
        </label>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Zakładam konto…' : 'Zarejestruj się'}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={async () => {
            const result = await loginWithGoogle();
            if (result?.isNewUser) {
              const token = await getToken();
              if (token) {
                await fetch('/api/auth/post-register', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
                  body: JSON.stringify({ method: 'google' }),
                });
              }
            }
            router.push('/profil');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Zarejestruj przez Google
        </button>

        <p className="small" style={{ textAlign: 'center', margin: 0 }}>
          Masz już konto? <Link href="/logowanie">Zaloguj się</Link>
        </p>
      </form>
    </div>
  );
}
