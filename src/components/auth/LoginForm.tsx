'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

export function LoginForm() {
  const { login, loginWithGoogle, resetPassword, live, getToken } = useAuth();
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
