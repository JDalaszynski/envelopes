'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Dolny pasek akcji — wyłącznie na ekranach ≤ 720 px (resztę załatwia CSS).
 *
 * Strona główna ma na mobile kilkanaście ekranów treści, a jedyne CTA stało
 * w hero. Pasek trzyma cenę wyjściową i wejście do konfiguratora w zasięgu
 * kciuka przez całą długość strony — to ten sam wzorzec, którego używają
 * aplikacje sklepowe, a nie pływający przycisk doklejony do strony.
 *
 * Widoczność liczy `IntersectionObserver`, nie pozycja przewijania:
 * — hero na ekranie → pasek zbędny, CTA jest w treści,
 * — konfigurator na ekranie → pasek szkodliwy, konfigurator ma własny
 *   przyklejony pasek z ceną i przyciskiem „Dodaj do koszyka".
 */
export function MobileCta({ price }: { price: string }) {
  const [visible, setVisible] = useState(false);

  /* Znacznik na `body` — po nim `mobile.css` podnosi stopkę o wysokość
     paska. Klasa na samym pasku by nie wystarczyła: stopka jest jego
     rodzeństwem w innym poddrzewie. */
  useEffect(() => {
    document.body.dataset.mCta = '1';
    return () => {
      delete document.body.dataset.mCta;
    };
  }, []);

  useEffect(() => {
    const hero = document.querySelector('.home-hero');
    const configurator = document.getElementById('konfigurator');
    if (!hero && !configurator) return;

    /* Stan trzymamy poza Reactem: obserwator raportuje tylko te cele,
       które zmieniły widoczność, więc jedno przecięcie nie może opisać
       obu naraz. */
    const seen = { hero: true, configurator: false };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) seen.hero = entry.isIntersecting;
          if (entry.target === configurator) seen.configurator = entry.isIntersecting;
        }
        setVisible(!seen.hero && !seen.configurator);
      },
      /* Zapas u dołu: pasek nie ma migać, gdy sekcja dopiero wjeżdża
         krawędzią w ekran. */
      { rootMargin: '0px 0px -15% 0px' }
    );

    if (hero) observer.observe(hero);
    if (configurator) observer.observe(configurator);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="m-cta-bar" data-visible={visible} aria-hidden={!visible}>
      <span className="m-cta-price">
        <span className="mono-sm muted">Koperta DL od</span>
        <strong className="price">{price}</strong>
      </span>
      <Link href="/#konfigurator" className="btn" tabIndex={visible ? undefined : -1}>
        Zamów koperty
      </Link>
    </div>
  );
}
