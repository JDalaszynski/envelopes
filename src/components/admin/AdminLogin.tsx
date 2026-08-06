'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Osobny formularz logowania do panelu (pkt 6.12) — inny niż formularz
 * klienta. Dostęp mają wyłącznie konta z rolą `admin` (custom claim
 * w Firebase Authentication).
 */
export function AdminLogin() {
  const { user, login, logout, loading, live } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') router.push('/admin/zamowienia');
  }, [user, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch {
      setError('Nieprawidłowe dane logowania.');
    }
    setBusy(false);
  }

  if (loading) return <p className="muted">Weryfikacja sesji…</p>;

  if (user && user.role !== 'admin') {
    return (
      <div className="card card-lg">
        <h1 style={{ fontSize: 24 }}>Brak uprawnień</h1>
        <p className="small muted">
          Konto {user.email} nie ma uprawnień administratora. Prosimy zalogować się na konto z rolą
          administratora.
        </p>
        <button type="button" className="btn" onClick={() => void logout()}>
          Wyloguj i zmień konto
        </button>
      </div>
    );
  }

  return (
    <div className="card card-lg">
      <span className="eyebrow">Dostęp służbowy</span>
      <h1 style={{ fontSize: 26 }}>Logowanie do panelu</h1>

      <form onSubmit={submit} className="stack" style={{ marginTop: 'var(--space-5)' }}>
        <div className="field">
          <label htmlFor="admin-email">Adres e-mail</label>
          <input
            id="admin-email"
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-haslo">Hasło</label>
          <input
            id="admin-haslo"
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Logowanie…' : 'Zaloguj się'}
        </button>
      </form>

      {!live && (
        <p className="notice" style={{ marginTop: 'var(--space-5)' }}>
          Tryb demonstracyjny: rolę administratora otrzymuje konto o adresie zaczynającym się od{' '}
          <code className="mono-sm">admin@</code> (np. admin@envelopes.pl, hasło min. 6 znaków). Po
          podłączeniu Firebase rola nadawana jest jako custom claim i weryfikowana serwerowo.
        </p>
      )}
    </div>
  );
}
