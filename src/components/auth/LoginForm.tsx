'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

export function LoginForm() {
  const { login, loginWithGoogle, resetPassword, live } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'reset') {
        await resetPassword(email);
        setInfo(
          live
            ? 'Wysłaliśmy link do ustawienia nowego hasła na podany adres.'
            : 'Reset hasła wymaga skonfigurowanego Firebase Authentication.'
        );
        setBusy(false);
        return;
      }
      await login(email, password);
      router.push('/profil');
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('Hasło')
          ? err.message
          : 'Nie udało się zalogować. Prosimy sprawdzić adres e-mail i hasło.'
      );
      setBusy(false);
    }
  }

  return (
    <div className="card card-lg">
      <h1 style={{ fontSize: 28 }}>{mode === 'login' ? 'Logowanie' : 'Reset hasła'}</h1>
      <p className="muted small" style={{ marginTop: 'var(--space-2)' }}>
        {mode === 'login'
          ? 'Dostęp do historii zamówień, zapisanych konfiguracji i danych do faktury.'
          : 'Prosimy podać adres e-mail powiązany z kontem.'}
      </p>

      <form onSubmit={submit} className="stack" style={{ marginTop: 'var(--space-5)' }}>
        <div className="field">
          <label htmlFor="email">Adres e-mail</label>
          <input
            id="email"
            className="input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode === 'login' && (
          <div className="field">
            <label htmlFor="haslo">Hasło</label>
            <input
              id="haslo"
              className="input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {info && <p className="notice notice-success">{info}</p>}

        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Chwileczkę…' : mode === 'login' ? 'Zaloguj się' : 'Wyślij link do resetu'}
        </button>

        {mode === 'login' && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => void loginWithGoogle().then(() => router.push('/profil'))}
            >
              Zaloguj przez Google
            </button>

            <div className="row-between small">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
              >
                Nie pamiętam hasła
              </button>
              <span>
                Nie masz konta? <Link href="/rejestracja">Zarejestruj się</Link>
              </span>
            </div>
          </>
        )}

        {mode === 'reset' && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setMode('login');
              setInfo(null);
            }}
          >
            ← Wróć do logowania
          </button>
        )}
      </form>

      {!live && (
        <p className="notice" style={{ marginTop: 'var(--space-5)' }}>
          Firebase Authentication nie jest jeszcze skonfigurowany — logowanie działa w trybie
          demonstracyjnym. Dowolny adres e-mail i hasło (min. 6 znaków) tworzą sesję lokalną; adres
          zaczynający się od <code className="mono-sm">admin@</code> otrzymuje rolę administratora.
        </p>
      )}
    </div>
  );
}
