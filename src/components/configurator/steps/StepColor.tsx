'use client';

import { COLORS, colorImageSrcSet } from '@/lib/catalog';
import { EnvelopeShape } from '@/components/ui/EnvelopeShape';

/** Krok 2 — Kolor. Siatka 19 swatchy w kształcie koperty. */
export function StepColor({
  value,
  format,
  onChange,
}: {
  value: string;
  format: string;
  onChange: (colorId: string) => void;
}) {
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Krok 2 z 3</span>
        <h3>Wybierz kolor</h3>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          Wybór koloru nie wpływa na koszt zamówienia.
        </p>
      </div>

      <div className="swatch-grid" role="group" aria-label="Kolor koperty">
        {COLORS.map((color) => {
          const selected = value === color.id;
          return (
            <button
              key={color.id}
              type="button"
              className="swatch"
              aria-pressed={selected}
              onClick={() => {
                if (selected) {
                  onChange('');
                } else {
                  onChange(color.id);
                }
              }}
            >
              <span className="swatch-shape">
                {color.images?.[format as keyof typeof color.images] ? (
                  /* Swatch ma 104–170 px, a plik źródłowy 1200 px — bez
                     `srcSet` konfigurator pobierał 19 obrazów w rozdzielczości
                     dwudziestokrotnie większej niż potrzebna. `sizes` opisuje
                     siatkę `minmax(104px, 1fr)`, na desktopie sztywne 5 kolumn.

                     Alt zostaje krótki i jest to celowe: swatch stoi w grupie
                     opisanej `aria-label="Kolor koperty"`, a nazwa koloru
                     powtarza się obok w `.swatch-name`. Pełne zdanie
                     w dziewiętnastu sąsiadujących kadrach czytnik ekranu
                     odczytywałby jako ścianę tekstu. */
                  <img
                    src={color.images[format as keyof typeof color.images]}
                    srcSet={colorImageSrcSet(color.images[format as keyof typeof color.images])}
                    sizes="(min-width: 820px) 210px, 104px"
                    alt={color.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <EnvelopeShape colorId={color.id} />
                )}
              </span>
              <span className="swatch-name">{color.name}</span>
              {selected && (
                <span className="swatch-check" aria-hidden="true">
                  ✓
                </span>
              )}
              {color.weight && (
                <span className="tooltip-wrap">
                  <span className="info-icon">i</span>
                  <span className="tooltip-content">
                    <strong>Gramatura {color.weight}</strong>
                    <span>Gruby, Wysokiej jakości papier barwiony w masie</span>
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
