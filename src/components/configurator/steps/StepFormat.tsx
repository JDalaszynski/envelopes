'use client';

import { COLOR_MAP, FORMATS, MAX_FORMAT_SIDE } from '@/lib/catalog';
import { DEFAULT_PRICING, formatPrice } from '@/lib/pricing';
import type { EnvelopeFormat, FormatId } from '@/lib/catalog';

/** Krok 1 — Format. Karty z wymiarami, podglądem w skali i zastosowaniem. */
export function StepFormat({
  value,
  colorId,
  onChange,
  onNextStep,
}: {
  value: FormatId | '';
  colorId: string;
  onChange: (format: FormatId | '') => void;
  onNextStep?: () => void;
}) {
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Krok 1 z 3</span>
        <h3>Wybierz format koperty</h3>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          Cena zależy wyłącznie od formatu — wszystkie 19 kolorów kosztuje tyle samo.
        </p>
      </div>

      <div className="format-grid" role="group" aria-label="Format koperty">
        {FORMATS.filter((f) => !f.hidden).map((format) => (
          <button
            key={format.id}
            type="button"
            className="format-card"
            aria-pressed={value === format.id}
            onClick={() => {
              if (value === format.id) {
                onChange('');
              } else {
                onChange(format.id);
              }
            }}
            disabled={format.disabled}
          >
            {format.badge && <span className="card-badge">{format.badge}</span>}
            <span className="format-visual" aria-hidden="true">
              <MiniEnvelope format={format} colorId={colorId} />
            </span>
            <span>
              <strong style={{ fontSize: 18 }}>{format.id}</strong>
              <span className="mono-sm muted" style={{ display: 'block' }}>
                {format.dimensions}
              </span>
            </span>
            {/* Format ze statusem „Dostępne wkrótce" nie pokazuje ceny — kwota przy
                produkcie, którego nie da się kupić, jest obietnicą bez pokrycia
                i przeczy tabeli formatów na stronie głównej (pkt 4.5 briefu SEO). */}
            <span className="mono-sm">
              {format.disabled ? '—' : `${formatPrice(DEFAULT_PRICING.base[format.id])} / szt.`}
            </span>
            <span
              className={`btn btn-sm ${value === format.id ? '' : 'btn-secondary'} format-select-btn`}
              style={{ marginTop: 'var(--space-3)', width: '100%' }}
              onClick={(e) => {
                if (value === format.id && onNextStep) {
                  e.stopPropagation();
                  onNextStep();
                }
              }}
            >
              Wybierz kolor koperty
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Rysunek koperty w rzeczywistych proporcjach formatu, przeskalowany
 * względem najdłuższego boku w katalogu — dzięki temu formaty da się
 * porównać wzrokowo, a kwadratowy K4 nie udaje prostokąta.
 */
function MiniEnvelope({ format, colorId }: { format: EnvelopeFormat; colorId: string }) {
  const BOX = 116; // px odpowiadające najdłuższemu bokowi w katalogu
  // Koperty prezentujemy poziomo — dłuższy bok w poziomie
  const w = Math.round((Math.max(format.width, format.height) / MAX_FORMAT_SIDE) * BOX);
  const h = Math.round((Math.min(format.width, format.height) / MAX_FORMAT_SIDE) * BOX);

  const color = COLOR_MAP[colorId];
  const fill = color?.hex ?? 'var(--color-paper)';
  const stroke = color?.dark ? 'rgba(255,255,255,.45)' : 'rgba(31,36,48,.3)';

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <rect
        x="1"
        y="1"
        width={w - 2}
        height={h - 2}
        rx="3"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path
        d={`M1 4 L${w / 2} ${h * 0.62} L${w - 1} 4`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
