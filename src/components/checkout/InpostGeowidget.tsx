'use client';

import { useEffect, useRef, useState } from 'react';

import type { InpostPoint } from '@/lib/types';

/**
 * InPost Geowidget — realny punkt integracji (pkt 1.5).
 * Ładujemy oficjalny widget InPost i nasłuchujemy zdarzenia wyboru punktu;
 * wybrany paczkomat zapisuje się jako dane dostawy zamówienia.
 *
 * Bez tokenu (`NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN`) widget nie może się
 * uruchomić — pokazujemy wtedy pole na kod punktu, żeby ścieżka zamówienia
 * pozostała przejezdna, wraz z informacją, czego brakuje.
 */

const SCRIPT_ID = 'inpost-geowidget-script';
const STYLE_ID = 'inpost-geowidget-style';

export function InpostGeowidget({
  value,
  onChange,
}: {
  value: InpostPoint | null;
  onChange: (point: InpostPoint | null) => void;
}) {
  const token = process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN;
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [manualCode, setManualCode] = useState(value?.name ?? '');

  useEffect(() => {
    if (!token) return;

    // Callback wywoływany przez widget po wybraniu punktu
    (window as unknown as Record<string, unknown>).envelopesPointSelected = (point: {
      name?: string;
      address?: { line1?: string; line2?: string };
      address_details?: { city?: string; post_code?: string; street?: string; building_number?: string };
    }) => {
      const details = point.address_details;
      onChange({
        name: point.name ?? '',
        address:
          point.address?.line1 ??
          [details?.street, details?.building_number].filter(Boolean).join(' '),
        city: details?.city,
        postCode: details?.post_code,
      });
    };

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('link');
      style.id = STYLE_ID;
      style.rel = 'stylesheet';
      style.href = 'https://geowidget.inpost.pl/inpost-geowidget.css';
      document.head.appendChild(style);
    }

    if (document.getElementById(SCRIPT_ID)) {
      setLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://geowidget.inpost.pl/inpost-geowidget.js';
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(false);
    document.head.appendChild(script);
  }, [token, onChange]);

  if (!token) {
    return (
      <div className="stack" style={{ gap: 'var(--space-3)' }}>
        <div className="notice">
          Mapa punktów InPost uruchamia się po uzupełnieniu zmiennej{' '}
          <code className="mono-sm">NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN</code>. Do tego czasu prosimy
          wpisać kod paczkomatu — zapiszemy go jako punkt odbioru zamówienia.
        </div>
        <div className="field">
          <label htmlFor="paczkomat">Kod paczkomatu</label>
          <input
            id="paczkomat"
            className="input"
            placeholder="np. WAW01M"
            value={manualCode}
            onChange={(e) => {
              setManualCode(e.target.value.toUpperCase());
              onChange(
                e.target.value.trim()
                  ? { name: e.target.value.trim().toUpperCase(), address: 'Punkt wskazany przez klienta' }
                  : null
              );
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      <div
        ref={containerRef}
        style={{
          height: 480,
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        {/* Web component InPost — renderuje mapę i listę punktów */}
        <inpost-geowidget
          token={token}
          language="pl"
          config="parcelCollect"
          onpoint="envelopesPointSelected"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
      {!loaded && <p className="small muted">Wczytywanie mapy punktów InPost…</p>}
      {value && (
        <p className="notice notice-success">
          Wybrany punkt: <strong>{value.name}</strong>
          {value.address ? ` — ${value.address}` : ''}
          {value.city ? `, ${value.city}` : ''}
        </p>
      )}
    </div>
  );
}
