'use client';

import { openCookieSettings } from '@/components/layout/CookieBanner';

/** Zarządzanie zgodami z poziomu strony (pkt 6.6). */
export function CookieSettingsButton() {
  return (
    <div className="card" style={{ marginTop: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 20, marginBottom: 'var(--space-2)' }}>Twoje zgody</h2>
      <p className="small muted">
        Ustawienia można zmienić w każdej chwili — również po wcześniejszym zaakceptowaniu
        wszystkich kategorii.
      </p>
      <button
        type="button"
        className="btn"
        style={{ marginTop: 'var(--space-3)' }}
        onClick={openCookieSettings}
      >
        Otwórz ustawienia cookies
      </button>
    </div>
  );
}
