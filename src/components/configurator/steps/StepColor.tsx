'use client';

import { COLORS } from '@/lib/catalog';
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
              onClick={() => onChange(color.id)}
            >
              <span className="swatch-shape">
                {color.images?.[format as keyof typeof color.images] ? (
                  <img
                    src={color.images[format as keyof typeof color.images]}
                    alt={color.name}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
