'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { useCart, EDIT_KEY } from '@/components/providers/CartProvider';
import { COLOR_MAP, FORMAT_MAP } from '@/lib/catalog';
import { DEFAULT_PRICING, DELIVERY_COST, formatPrice, leadTimeDays, round2 } from '@/lib/pricing';
import type { EnvelopeConfig, ShippingSpeed } from '@/lib/types';

export function CartView() {
  return (
    <Suspense fallback={<p className="muted">Wczytywanie koszyka…</p>}>
      <CartInner />
    </Suspense>
  );
}

function CartInner() {
  const {
    items,
    count,
    removeItem,
    itemsGross,
    discountCode,
    discountGross,
    reorder,
    ready,
    shippingSpeed,
    setShippingSpeed,
    requiresProduction,
    expressSurcharge,
  } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [shareLink, setShareLink] = useState<string | null>(null);

  /* Import koszyka z linku „Zapisz koszyk i wyślij link" */
  useEffect(() => {
    const packed = searchParams.get('k');
    if (!packed || !ready) return;
    try {
      const decoded = JSON.parse(
        decodeURIComponent(escape(window.atob(packed.replace(/-/g, '+').replace(/_/g, '/'))))
      ) as EnvelopeConfig[];
      if (Array.isArray(decoded) && decoded.length) {
        reorder(decoded);
        router.replace('/koszyk');
      }
    } catch {
      /* uszkodzony link — pomijamy import */
    }
  }, [searchParams, ready, reorder, router]);

  function editItem(itemId: string, config: EnvelopeConfig) {
    window.sessionStorage.setItem(EDIT_KEY, JSON.stringify({ itemId, config }));
    router.push('/#konfigurator');
  }

  function shareCart() {
    const packed = window
      .btoa(unescape(encodeURIComponent(JSON.stringify(items.map((i) => i.config)))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    setShareLink(`${window.location.origin}/koszyk?k=${packed}`);
  }

  if (!ready) return <p className="muted">Wczytywanie koszyka…</p>;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h1 style={{ fontSize: 28 }}>Koszyk jest pusty</h1>
        <p className="muted" style={{ maxWidth: '48ch', margin: '0 auto var(--space-5)' }}>
          Konfigurator wyliczy cenę od razu po wybraniu formatu, koloru i ilości — bez zapytania
          ofertowego.
        </p>
        <Link href="/#konfigurator" className="btn btn-lg">
          Przejdź do konfiguratora
        </Link>
      </div>
    );
  }

  const gross = round2(itemsGross + DELIVERY_COST - discountGross);
  const net = round2(gross / (1 + DEFAULT_PRICING.vatRate));
  const vat = round2(gross - net);
  const leadDays = leadTimeDays({ speed: shippingSpeed, requiresProduction });

  return (
    <>
      <h1>Koszyk</h1>
      <p className="muted" style={{ marginBottom: 'var(--space-6)' }}>
        {items.length} {items.length === 1 ? 'pozycja' : 'pozycje'} · {count} szt.
      </p>

      <div className="checkout-layout">
        <div className="stack">
          {items.map((item) => {
            const format = FORMAT_MAP[item.config.format];
            const color = COLOR_MAP[item.config.color];
            return (
              <article className="card" key={item.id}>
                <div className="cart-item" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Usuń pozycję"
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      right: '-12px',
                      background: 'var(--color-paper)',
                      border: '1px solid var(--color-line)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '50%',
                      color: 'var(--color-ink-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                  <div style={{ width: 56, flexShrink: 0 }}>
                    <EnvelopePlaceholder
                      format={item.config.format}
                      colorId={item.config.color}
                      ratio="photo"
                      size="sm"
                      hasPrint={item.config.print}
                    />
                  </div>
                  <div>
                    <h2 className="label" style={{ fontFamily: 'inherit', fontSize: 18, marginBottom: 4, paddingRight: '24px' }}>
                      {item.name}
                    </h2>
                    <p className="mono-sm muted" style={{ margin: '0 0 var(--space-3)' }}>
                      {format.dimensions} · {color?.name}
                    </p>

                    <ul className="small muted" style={{ paddingLeft: 'var(--space-5)', margin: '0 0 var(--space-3)' }}>
                      <li>Ilość: {item.price.quantity} szt.</li>
                      {item.config.print && (
                        <li>
                          Nadruk: {item.config.printFiles.length}{' '}
                          {item.config.printFiles.length === 1 ? 'plik' : 'plików'}
                          {item.config.printFiles.length > 0 && (
                            <span className="mono-sm">
                              {' '}
                              ({item.config.printFiles.map((f) => f.name).join(', ')})
                            </span>
                          )}
                        </li>
                      )}
                      {item.config.personalization && (
                        <li>
                          Personalizacja:{' '}
                          {item.config.personalizationMethod === 'szablon'
                            ? `arkusz ${item.config.personalizationFile?.name ?? 'do uzupełnienia'}`
                            : 'treść wpisana ręcznie'}
                        </li>
                      )}
                    </ul>

                    <div className="row-between">
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => editItem(item.id, item.config)}
                        >
                          Edytuj konfigurację
                        </button>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="mono-sm muted" style={{ display: 'block' }}>
                          {formatPrice(item.price.unitTotal)} / szt.
                        </span>
                        <strong className="mono">{formatPrice(item.price.gross)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Czas realizacji dotyczy całej przesyłki, więc wybiera się go raz,
              tutaj — a nie osobno przy każdej pozycji. Pytamy o niego wyłącznie
              wtedy, gdy zamówienie faktycznie idzie do produkcji. */}
          {requiresProduction ? (
            <section className="card speed-card" aria-labelledby="czas-realizacji">
              <div>
                <span className="eyebrow">Czas realizacji</span>
                <h2 id="czas-realizacji" style={{ fontSize: 20 }}>
                  Kiedy koperty mają być gotowe?
                </h2>
                <p className="small muted" style={{ margin: 'var(--space-2) 0 0' }}>
                  Wybór dotyczy całego zamówienia — wychodzi jedna przesyłka.
                </p>
              </div>

              <div className="grid grid-2" role="radiogroup" aria-label="Czas realizacji">
                {(['standard', 'ekspres'] as ShippingSpeed[]).map((speed) => {
                  const selected = shippingSpeed === speed;
                  const surcharge = speed === 'ekspres' ? round2(DEFAULT_PRICING.express * count) : 0;
                  return (
                    <button
                      key={speed}
                      type="button"
                      className="option-card"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setShippingSpeed(speed)}
                    >
                      <span className="speed-icon" aria-hidden="true">
                        {speed === 'standard' ? <CalendarIcon /> : <BoltIcon />}
                      </span>
                      <span>
                        <strong>
                          {speed === 'standard' ? 'Standard' : 'Ekspres'} —{' '}
                          {speed === 'standard'
                            ? DEFAULT_PRICING.leadDaysStandard
                            : DEFAULT_PRICING.leadDaysExpress}{' '}
                          dni robocze
                        </strong>
                        <small className="mono-sm" style={{ marginTop: 'var(--space-2)' }}>
                          {speed === 'standard'
                            ? 'bez dopłaty'
                            : `+ ${formatPrice(DEFAULT_PRICING.express)} × ${count} szt. = ${formatPrice(surcharge)}`}
                        </small>
                      </span>
                      {selected && (
                        <span className="option-check" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <p className="notice">
              Zamówienie nie wymaga nadruku ani personalizacji — realizujemy je w trybie
              standardowym, w <strong>{leadDays} dni robocze</strong>, bez dopłat.
            </p>
          )}

          <button type="button" className="btn btn-secondary" onClick={shareCart} style={{ alignSelf: 'flex-start' }}>
            Zapisz koszyk i wyślij link
          </button>
          {shareLink && (
            <div className="notice">
              Link do koszyka — można go przekazać osobie decydującej o zakupie:
              <br />
              <code className="mono-sm" style={{ wordBreak: 'break-all' }}>
                {shareLink}
              </code>
            </div>
          )}
        </div>

        {/* Podsumowanie */}
        <aside className="summary-panel" aria-label="Podsumowanie koszyka">
          <span className="eyebrow">Podsumowanie</span>

          <div className="summary-row">
            <span>Wartość produktów</span>
            <span>{formatPrice(itemsGross)}</span>
          </div>
          {expressSurcharge > 0 && (
            <div className="summary-row muted">
              <span style={{ paddingLeft: 'var(--space-3)' }}>w tym dopłata ekspresowa</span>
              <span>{formatPrice(expressSurcharge)}</span>
            </div>
          )}
          {discountGross > 0 && (
            <div className="summary-row" style={{ color: 'var(--color-success)' }}>
              <span>Rabat {discountCode}</span>
              <span>− {formatPrice(discountGross)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Dostawa</span>
            <span>{formatPrice(DELIVERY_COST)}</span>
          </div>
          
          <hr style={{ margin: 'var(--space-3) 0', border: 'none', borderTop: '1px solid var(--color-line)' }} />
          
          <div className="summary-row muted">
            <span>Wartość netto</span>
            <span>{formatPrice(net)}</span>
          </div>
          <div className="summary-row muted">
            <span>VAT 23%</span>
            <span>{formatPrice(vat)}</span>
          </div>

          <div className="summary-total">
            <span className="label">Razem brutto</span>
            <span className="price">{formatPrice(gross)}</span>
          </div>

          <Link href="/zamowienie" className="btn btn-block btn-lg">
            Przejdź do zamówienia
          </Link>

          {requiresProduction && (
            <p className="small muted" style={{ marginTop: 'var(--space-4)' }}>
              Zamówienie zawiera nadruk lub personalizację — po jego złożeniu prześlemy wizualizację
              projektu do akceptacji.
            </p>
          )}

          <ul className="small muted" style={{ listStyle: 'none', padding: 0, marginTop: 'var(--space-4)' }}>
            <li>Bezpieczne płatności Przelewy24 i BLIK</li>
            <li>Faktura VAT do każdego zamówienia</li>
            <li>Kontrola jakości przed wysyłką</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />
    </svg>
  );
}
