'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { formatDate } from '@/lib/pricing';
import type { SavedAddress, UserProfile } from '@/lib/types';

export function ProfileView() {
  const { user, loading, logout, getToken, live } = useAuth();
  const { reorder } = useCart();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<{ ordersTotal: number; ordersCompleted: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch('/api/profil', { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const json = await res.json();
    setProfile(json.profile);
    setStats(json.stats);
  }, [getToken]);

  useEffect(() => {
    if (!loading && !user) router.push('/logowanie');
    else if (user) void load();
  }, [user, loading, router, load]);

  async function save(patch: Partial<UserProfile>) {
    setStatus(null);
    setError(null);
    const token = await getToken();
    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setError('Nie udało się zapisać zmian.');
      return;
    }
    const json = await res.json();
    setProfile(json.profile);
    setStatus('Zmiany zapisane.');
  }

  async function removeConfiguration(id: string) {
    const token = await getToken();
    const res = await fetch(`/api/profil/konfiguracje?id=${id}`, {
      method: 'DELETE',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const json = await res.json();
      setProfile((p) => (p ? { ...p, configurations: json.configurations } : p));
    }
  }

  async function deleteAccount() {
    const token = await getToken();
    const res = await fetch('/api/profil', {
      method: 'DELETE',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      await logout();
      router.push('/');
    }
  }

  if (loading || !user) return <p className="muted">Wczytywanie…</p>;

  const addresses = profile?.addresses ?? [];

  return (
    <>
      <div className="row-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Profil użytkownika</h1>
          <p className="muted mono-sm" style={{ margin: 0 }}>
            {user.email}
          </p>
        </div>
        <div className="row">
          <Link href="/zamowienia" className="btn btn-secondary">
            Złożone zamówienia
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => void logout().then(() => router.push('/'))}>
            Wyloguj się
          </button>
        </div>
      </div>

      {status && <p className="notice notice-success">{status}</p>}
      {error && <p className="notice notice-error">{error}</p>}

      {/* Status konta */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="eyebrow">Status konta</span>
        <div className="row-between">
          <div>
            <strong>
              {profile?.accountType === 'firmowe' ? 'Konto firmowe' : 'Konto indywidualne'}
            </strong>
            <p className="small muted" style={{ margin: '2px 0 0' }}>
              Złożone zamówienia: {stats?.ordersTotal ?? 0}, w tym zrealizowanych:{' '}
              {stats?.ordersCompleted ?? 0}. Płatność fakturą z odroczonym terminem 14 dni jest
              dostępna dla instytucji publicznych i urzędów.
            </p>
          </div>
          {profile?.deferredPaymentEligible && <span className="badge badge-success">Odroczony termin</span>}
        </div>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Dane konta */}
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void save({
              accountType: (data.get('accountType') as 'firmowe' | 'indywidualne') ?? 'indywidualne',
              imie: String(data.get('imie') ?? ''),
              nazwisko: String(data.get('nazwisko') ?? ''),
              firma: String(data.get('firma') ?? ''),
              nip: String(data.get('nip') ?? ''),
              telefon: String(data.get('telefon') ?? ''),
            });
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-4)' }}>Dane</h2>
          <div className="stack" style={{ gap: 'var(--space-3)' }}>
            <div className="field">
              <label htmlFor="accountType">Typ konta</label>
              <select
                id="accountType"
                name="accountType"
                className="select input"
                defaultValue={profile?.accountType ?? 'indywidualne'}
                key={profile?.accountType}
              >
                <option value="indywidualne">Indywidualne</option>
                <option value="firmowe">Firmowe</option>
              </select>
            </div>
            <div className="grid grid-2" style={{ gap: 'var(--space-3)' }}>
              <div className="field">
                <label htmlFor="imie">Imię</label>
                <input id="imie" name="imie" className="input" defaultValue={profile?.imie ?? ''} key={`i${profile?.imie}`} />
              </div>
              <div className="field">
                <label htmlFor="nazwisko">Nazwisko</label>
                <input id="nazwisko" name="nazwisko" className="input" defaultValue={profile?.nazwisko ?? ''} key={`n${profile?.nazwisko}`} />
              </div>
              <div className="field">
                <label htmlFor="firma">Firma</label>
                <input id="firma" name="firma" className="input" defaultValue={profile?.firma ?? ''} key={`f${profile?.firma}`} />
              </div>
              <div className="field">
                <label htmlFor="nip">NIP</label>
                <input id="nip" name="nip" className="input" defaultValue={profile?.nip ?? ''} key={`p${profile?.nip}`} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="telefon">Telefon</label>
              <input id="telefon" name="telefon" className="input" defaultValue={profile?.telefon ?? ''} key={`t${profile?.telefon}`} />
            </div>
            <button type="submit" className="btn">
              Zapisz dane
            </button>
          </div>
        </form>

        {/* Zgody i hasło */}
        <div className="stack">
          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Zgody marketingowe</h2>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={profile?.marketingConsent ?? false}
                onChange={(e) => void save({ marketingConsent: e.target.checked })}
              />
              <span>
                Zgoda na otrzymywanie informacji handlowych. Wycofanie zgody działa natychmiast i
                nie wpływa na realizację złożonych zamówień.
              </span>
            </label>
          </div>

          <div className="card">
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Hasło</h2>
            <p className="small muted">
              Zmiana hasła odbywa się przez link wysyłany na adres e-mail powiązany z kontem.
            </p>
            <Link href="/logowanie" className="btn btn-secondary btn-sm">
              Ustaw nowe hasło
            </Link>
            {!live && (
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                Funkcja wymaga skonfigurowanego Firebase Authentication.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Zapisane adresy */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 20 }}>Zapisane adresy</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              const entry: SavedAddress = {
                id: `adr-${Date.now().toString(36)}`,
                label: `Adres ${addresses.length + 1}`,
                isDefault: addresses.length === 0,
                data: {
                  imie: profile?.imie,
                  nazwisko: profile?.nazwisko,
                  firma: profile?.firma,
                  nip: profile?.nip,
                  ulica: '',
                  kodPocztowy: '',
                  miasto: '',
                },
              };
              void save({ addresses: [...addresses, entry] });
            }}
          >
            Dodaj adres
          </button>
        </div>

        {addresses.length === 0 ? (
          <p className="small muted">
            Brak zapisanych adresów. Adres z ostatniego zamówienia można zapisać tutaj, żeby
            kolejne zakupy przebiegały szybciej.
          </p>
        ) : (
          <div className="grid grid-2">
            {addresses.map((address) => (
              <div className="card" key={address.id}>
                <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
                  <strong>{address.label}</strong>
                  {address.isDefault ? (
                    <span className="badge badge-success">Domyślny</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        void save({
                          addresses: addresses.map((a) => ({ ...a, isDefault: a.id === address.id })),
                        })
                      }
                    >
                      Ustaw jako domyślny
                    </button>
                  )}
                </div>
                {(['ulica', 'kodPocztowy', 'miasto'] as const).map((field) => (
                  <div className="field" key={field} style={{ marginBottom: 'var(--space-2)' }}>
                    <label htmlFor={`${address.id}-${field}`}>
                      {field === 'ulica' ? 'Ulica i numer' : field === 'kodPocztowy' ? 'Kod pocztowy' : 'Miejscowość'}
                    </label>
                    <input
                      id={`${address.id}-${field}`}
                      className="input"
                      defaultValue={String(address.data[field] ?? '')}
                      onBlur={(e) =>
                        void save({
                          addresses: addresses.map((a) =>
                            a.id === address.id
                              ? { ...a, data: { ...a.data, [field]: e.target.value } }
                              : a
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void save({ addresses: addresses.filter((a) => a.id !== address.id) })}
                >
                  Usuń adres
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zapisane konfiguracje */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Zapisane konfiguracje</h2>
        <p className="small muted">
          Szablony dla firm zamawiających cyklicznie te same koperty — dodanie do koszyka
          przelicza konfigurację wg aktualnego cennika.
        </p>
        {(profile?.configurations ?? []).length === 0 ? (
          <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
            Brak zapisanych konfiguracji. W konfiguratorze na stronie głównej użyj przycisku
            „Zapisz konfigurację”.
          </p>
        ) : (
          <div className="stack" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {profile!.configurations.map((entry) => (
              <div className="row-between file-card" key={entry.id}>
                <span>
                  <strong>{entry.label}</strong>
                  <span className="mono-sm muted" style={{ display: 'block' }}>
                    zapisano {formatDate(entry.savedAt)}
                  </span>
                </span>
                <span className="row">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      reorder([entry.config]);
                      router.push('/koszyk');
                    }}
                  >
                    Dodaj do koszyka
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void removeConfiguration(entry.id)}
                  >
                    Usuń
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RODO */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Usunięcie konta</h2>
        <p className="small muted">
          Usuniemy dane konta, zapisane adresy i konfiguracje. Dokumenty księgowe pozostają w
          archiwum przez okres wymagany przepisami podatkowymi.
        </p>
        {confirmDelete ? (
          <div className="row" style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn" onClick={() => void deleteAccount()}>
              Tak, usuń moje konto
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
              Anuluj
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={() => setConfirmDelete(true)}
          >
            Usuń konto
          </button>
        )}
      </div>
    </>
  );
}
