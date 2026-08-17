'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import type { SavedAddress, UserProfile } from '@/lib/types';

export function ProfileView() {
  const { user, loading, logout, getToken, live } = useAuth();
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
          <button type="button" className="btn btn-ghost" onClick={() => void logout().then(() => router.push('/'))}>
            Wyloguj się
          </button>
        </div>
      </div>

      {status && <p className="notice notice-success">{status}</p>}
      {error && <p className="notice notice-error">{error}</p>}

      {/* Status konta */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="eyebrow" style={{ display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18" style={{ marginRight: 6 }}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Status konta
        </span>
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
          <h2 style={{ fontSize: 20, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
            Dane
          </h2>
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
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>
              Zgody marketingowe
            </h2>
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
            <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
              Hasło
            </h2>
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
          <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', margin: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            Zapisane adresy
          </h2>
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

      {/* Złożone zamówienia */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          Złożone zamówienia
        </h2>
        <p className="small muted">
          Historia Twoich zakupów, statusy realizacji oraz dostęp do plików rozliczeniowych.
        </p>
        <Link href="/zamowienia" className="btn btn-secondary" style={{ marginTop: 'var(--space-3)', display: 'inline-flex' }}>
          Przejdź do zamówień
        </Link>
      </div>

      {/* RODO */}
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          Usunięcie konta
        </h2>
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
