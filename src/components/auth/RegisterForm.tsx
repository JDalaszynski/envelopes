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
        Konto pozwala zapisywać konfiguracje, powtarzać zamówienia jednym kliknięciem i śledzić
        status realizacji.
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
          onClick={() => void loginWithGoogle().then(() => router.push('/profil'))}
        >
          Zarejestruj przez Google
        </button>

        <p className="small" style={{ textAlign: 'center', margin: 0 }}>
          Masz już konto? <Link href="/logowanie">Zaloguj się</Link>
        </p>
      </form>
    </div>
  );
}
