'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Baner cookies (pkt 6.6) — dwie warstwy.
 * Privacy-by-default: do momentu wyboru żaden skrypt analityczny ani
 * marketingowy nie jest ładowany. Wybór zapamiętywany w localStorage,
 * zmiana możliwa w każdej chwili linkiem „Zarządzaj cookies" w stopce.
 */

const STORAGE_KEY = 'envelopes.cookieConsent';
const EVENT = 'envelopes:cookies';

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  decidedAt: string;
}

export const COOKIE_CATEGORIES = [
  {
    id: 'necessary' as const,
    name: 'Niezbędne',
    description:
      'Utrzymanie sesji, zawartość koszyka, bezpieczeństwo formularzy. Bez nich sklep nie działa — nie można ich wyłączyć.',
    locked: true,
  },
  {
    id: 'analytics' as const,
    name: 'Analityczne',
    description: 'Anonimowe statystyki ruchu — pomagają nam poprawiać ścieżkę zakupową.',
    locked: false,
  },
  {
    id: 'marketing' as const,
    name: 'Marketingowe',
    description: 'Pomiar skuteczności kampanii i dopasowanie komunikatów reklamowych.',
    locked: false,
  },
  {
    id: 'functional' as const,
    name: 'Funkcjonalne',
    description: 'Zapamiętanie preferencji, np. ostatnio wybranego formatu koperty.',
    locked: false,
  },
];

export function readConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: consent }));
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent(`${EVENT}:open`));
}

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'inherit',
        font: 'inherit',
        textAlign: 'left',
      }}
    >
      Zarządzaj cookies
    </button>
  );
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false, functional: false });

  useEffect(() => {
    const existing = readConsent();
    if (!existing) setVisible(true);
    else setPrefs({ analytics: existing.analytics, marketing: existing.marketing, functional: existing.functional });

    const openHandler = () => {
      setVisible(true);
      setShowSettings(true);
    };
    window.addEventListener(`${EVENT}:open`, openHandler);
    return () => window.removeEventListener(`${EVENT}:open`, openHandler);
  }, []);

  if (!visible) return null;

  const decide = (consent: Omit<CookieConsent, 'necessary' | 'decidedAt'>) => {
    saveConsent({ necessary: true, ...consent, decidedAt: new Date().toISOString() });
    setVisible(false);
    setShowSettings(false);
  };

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
    >
      <div className="container">
        <div className="cookie-inner">
          <div style={{ maxWidth: '62ch' }}>
            <h2 id="cookie-title" style={{ fontSize: 20, marginBottom: 'var(--space-2)' }}>
              Pliki cookies
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              Używamy plików cookies, żeby sklep działał poprawnie oraz — za Państwa zgodą — do
              analityki i marketingu. Do czasu dokonania wyboru nie ładujemy żadnych skryptów
              analitycznych ani marketingowych. Szczegóły opisuje{' '}
              <Link href="/pliki-cookies">Polityka Cookies</Link>.
            </p>
          </div>
          <div className="cookie-actions">
            <button
              type="button"
              className="btn"
              onClick={() => decide({ analytics: true, marketing: true, functional: true })}
            >
              Akceptuj wszystkie
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => decide({ analytics: false, marketing: false, functional: false })}
            >
              Odrzuć niekonieczne
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={showSettings}
              onClick={() => setShowSettings((v) => !v)}
            >
              Ustawienia
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="cookie-settings">
            {COOKIE_CATEGORIES.map((cat) => (
              <div className="cookie-cat" key={cat.id}>
                <div>
                  <strong style={{ fontSize: 15 }}>{cat.name}</strong>
                  <p className="small muted" style={{ margin: '2px 0 0', maxWidth: '52ch' }}>
                    {cat.description}
                  </p>
                </div>
                {cat.locked ? (
                  <span className="badge badge-success">Zawsze aktywne</span>
                ) : (
                  <button
                    type="button"
                    className="toggle"
                    aria-pressed={prefs[cat.id as 'analytics' | 'marketing' | 'functional']}
                    aria-label={`${cat.name} — ${
                      prefs[cat.id as 'analytics' | 'marketing' | 'functional'] ? 'włączone' : 'wyłączone'
                    }`}
                    onClick={() =>
                      setPrefs((p) => ({
                        ...p,
                        [cat.id]: !p[cat.id as 'analytics' | 'marketing' | 'functional'],
                      }))
                    }
                  >
                    <span className="toggle-track" aria-hidden="true">
                      <span className="toggle-knob" />
                    </span>
                  </button>
                )}
              </div>
            ))}
            <div className="row" style={{ marginTop: 'var(--space-4)' }}>
              <button type="button" className="btn" onClick={() => decide(prefs)}>
                Zapisz wybór
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => decide({ analytics: true, marketing: true, functional: true })}
              >
                Akceptuj wszystkie
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
