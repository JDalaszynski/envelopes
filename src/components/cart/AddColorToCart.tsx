'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '@/components/providers/CartProvider';
import type { FormatId } from '@/lib/catalog';
import { DEFAULT_PRICING, calculatePrice, formatPrice } from '@/lib/pricing';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Dodanie koperty gładkiej wprost ze strony koloru, z pominięciem konfiguratora.
 *
 * **Dlaczego tutaj, a nie na `/koperty-dl`.** Na stronie formatu kolor nie jest
 * jeszcze wybrany, więc przycisk musiałby o niego zapytać — czyli zrobić to,
 * co robi konfigurator. Na stronie koloru decyzja jest już podjęta adresem URL:
 * format DL, ten odcień, bez nadruku. Zostaje ilość, i to jedyne, o co pytamy.
 *
 * Nadruk i personalizacja świadomie **nie mają** tu przełącznika. Obie usługi
 * wymagają pliku albo listy adresów i akceptacji wizualizacji, więc ich miejsce
 * jest w konfiguratorze — odnośnik obok prowadzi tam z zaznaczonym kolorem.
 */
export function AddColorToCart({
  colorId,
  format,
  phraseShort,
}: {
  colorId: string;
  /**
   * Format wchodzi parametrem, choć dziś zawsze jest to `DL`. Gdy ruszą C6
   * i K4, ta sama strona koloru wystawi wybór formatu przed ilością — cena
   * schodzi wtedy z `calculatePrice()` sama, bo zależy wyłącznie od formatu.
   */
  format: FormatId;
  /** Odmieniona nazwa w liczbie mnogiej („czarne koperty") — z `color-pages.ts`. */
  phraseShort: string;
}) {
  const { addItem, ready } = useCart();
  const minimum = DEFAULT_PRICING.moqWithoutPrint;
  /* Domyślna ilość: nakład, przy którym zamówienie ma sens transportowy.
     Minimum wynosi 1 sztukę i pole można na nie zejść — to podpowiedź,
     nie próg. */
  const [quantity, setQuantity] = useState(50);
  const [added, setAdded] = useState(0);

  const config: EnvelopeConfig = {
    format,
    color: colorId,
    quantity: Math.max(minimum, quantity),
    print: false,
    printFiles: [],
    personalization: false,
    shippingSpeed: 'standard',
  };
  const price = calculatePrice(config);

  return (
    <div className="card">
      <div className="qty-block" style={{ marginBottom: 'var(--space-4)' }}>
        <label className="qty-block-label" htmlFor="color-qty">
          Ilość
        </label>
        <div className="qty-block-control">
          <button
            type="button"
            className="qty-block-btn"
            aria-label="Zmniejsz o 10 sztuk"
            disabled={config.quantity <= minimum}
            onClick={() => setQuantity(Math.max(minimum, config.quantity - 10))}
          >
            −
          </button>
          <input
            id="color-qty"
            className="qty-block-input"
            type="number"
            inputMode="numeric"
            min={minimum}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.max(0, Number.parseInt(event.target.value, 10) || 0))
            }
          />
          <button
            type="button"
            className="qty-block-btn"
            aria-label="Zwiększ o 10 sztuk"
            onClick={() => setQuantity(config.quantity + 10)}
          >
            +
          </button>
        </div>
        <span className="qty-block-unit">szt.</span>
      </div>

      <p className="mono-sm muted" style={{ marginBottom: 'var(--space-4)' }} aria-live="polite">
        {formatPrice(price.unitTotal)} brutto za sztukę · razem{' '}
        <strong>{formatPrice(price.gross)}</strong> brutto
      </p>

      <button
        type="button"
        className="btn btn-lg btn-block"
        disabled={!ready}
        onClick={() => {
          addItem(config);
          setAdded((count) => count + 1);
        }}
      >
        Dodaj {phraseShort} do koszyka
      </button>

      {/* Potwierdzenie zamiast przeniesienia do koszyka: klient zamawiający
          kilka odcieni nie musi się cofać po każdej pozycji. */}
      <p className="small" style={{ marginTop: 'var(--space-3)' }} aria-live="polite">
        {added > 0 ? (
          <>
            Dodano do koszyka{added > 1 ? ` (${added} pozycje)` : ''}.{' '}
            <Link href="/koszyk">Przejdź do koszyka</Link>
          </>
        ) : (
          <span className="muted">
            Koperty gładkie zamawiają Państwo od {minimum} sztuki. Faktura VAT do każdego
            zamówienia.
          </span>
        )}
      </p>
    </div>
  );
}
