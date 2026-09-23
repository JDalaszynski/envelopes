'use client';

import Link from 'next/link';
import { Fragment } from 'react';

import { formatPrice } from '@/lib/pricing';
import { buildProductName } from '@/lib/product-name';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { COLOR_MAP, FORMAT_MAP } from '@/lib/catalog';
import type { EnvelopeConfig, PriceBreakdown } from '@/lib/types';

/**
 * Podsumowanie konfiguracji jako pasek u dołu ekranu.
 *
 * Pojawia się dopiero od kroku 2 — w kroku 1 nie ma jeszcze czego
 * podsumowywać, a pusty pasek odbierałby wyborowi formatu całą uwagę.
 * Pasek jest przyklejony do dołu, więc cena i przycisk są widoczne przez
 * cały czas, niezależnie od tego, jak długa jest treść kroku.
 *
 * Ilość zmienia się wyłącznie tutaj, dlatego dostaje wyróżniony blok.
 * Górna krawędź ma perforację — ten sam „papierowy" detal, co wcześniejszy
 * panel boczny.
 */



export function SummaryBar({
  config,
  price,
  problem,
  onAdd,
  onQuantityChange,
  minimumQuantity,
}: {
  config: EnvelopeConfig;
  price: PriceBreakdown;
  /** Komunikat o niedokończonej konfiguracji — pokazywany po próbie dodania */
  problem: string | null;
  onAdd: () => void;
  onQuantityChange: (quantity: number) => void;
  minimumQuantity: number;
}) {
  const name = buildProductName(config);
  const format = FORMAT_MAP[config.format];
  const color = COLOR_MAP[config.color];

  /* Każda usługa ma własny kadr — nadruk i adres na przodzie, nadruk na
     klapce z tyłu — więc przy kilku usługach pokazujemy kilka miniatur,
     a nie jedną, która przemilczałaby resztę. */
  const views = [
    config.print && 'nadruk',
    config.personalization && 'personalizacja',
    config.backPrint && 'zamkniecie',
  ].filter(Boolean) as ('nadruk' | 'personalizacja' | 'zamkniecie')[];

  return (
    <aside className="summary-bar" aria-label="Podsumowanie konfiguracji">
      {problem && (
        <p className="notice notice-error summary-bar-problem" role="alert">
          {problem}
        </p>
      )}

      <div className="summary-bar-inner">
        <div className="summary-bar-product" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          {config.format && config.color && (
            <div className="summary-bar-thumbs" data-count={views.length}>
              {views.length > 1 ? (
                views.map((view, index) => (
                  <Fragment key={view}>
                    {index > 0 && (
                      <span className="summary-bar-plus" aria-hidden="true">
                        +
                      </span>
                    )}
                    <div className="summary-bar-thumb">
                      <EnvelopePlaceholder
                        format={config.format}
                        colorId={config.color}
                        ratio="photo"
                        size="md"
                        hasPrint={view === 'nadruk'}
                        hasPersonalization={view === 'personalizacja'}
                        hasFlapPrint={view === 'zamkniecie'}
                      />
                    </div>
                  </Fragment>
                ))
              ) : (
                <div className="summary-bar-thumb">
                  <EnvelopePlaceholder
                    format={config.format}
                    colorId={config.color}
                    ratio="photo"
                    size="lg"
                    hasPrint={config.print}
                    hasPersonalization={config.personalization}
                    hasFlapPrint={config.backPrint}
                  />
                </div>
              )}
            </div>
          )}

          {/* Przy trzech usługach nazwa ma kilkanaście słów — mniejszy stopień
              mieści ją w pasku bez obcinania. */}
          <p className="label summary-bar-name" data-compact={views.length >= 3} style={{ margin: 0 }}>
            {name}
          </p>

        </div>

        {/* Ilość — jedyne miejsce w konfiguratorze, w którym da się ją zmienić */}
        <div className="qty-block">
          <label className="qty-block-label" htmlFor="summary-qty">
            Ilość
          </label>
          <div className="qty-block-control">
            <button
              type="button"
              className="qty-block-btn"
              aria-label="Zmniejsz o 10 sztuk"
              disabled={price.quantity <= minimumQuantity}
              onClick={() => onQuantityChange(Math.max(minimumQuantity, price.quantity - 10))}
            >
              −
            </button>
            <input
              id="summary-qty"
              className="qty-block-input"
              type="number"
              inputMode="numeric"
              min={1}
              value={price.quantity}
              onChange={(e) =>
                onQuantityChange(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
              }
            />
            <button
              type="button"
              className="qty-block-btn"
              aria-label="Zwiększ o 10 sztuk"
              onClick={() => onQuantityChange(price.quantity + 10)}
            >
              +
            </button>
          </div>
          <span className="qty-block-unit">szt.</span>
        </div>

        <div className="summary-bar-total" aria-live="polite">
          <span className="mono-sm muted">{formatPrice(price.unitTotal)} / szt.</span>
          <span className="price">{formatPrice(price.gross)}</span>
        </div>

        <div className="summary-bar-actions">
          <button type="button" className="btn btn-lg" onClick={onAdd}>
            Dodaj do koszyka
          </button>
        </div>
      </div>
    </aside>
  );
}
