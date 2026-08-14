'use client';

import { useEffect, useRef } from 'react';

/**
 * Kompozycja produktowa hero: dwie koperty DL ułożone jak na biurku —
 * `koperta-gorna` (strona klapki) w głębi kadru, `koperta-dolna` (strona
 * z nadrukiem logo) na wierzchu, żeby nadruk pozostał w całości widoczny.
 *
 * Warstwy przesuwają się przy przewijaniu z różną prędkością: dalsza koperta
 * zostaje w tyle mocniej niż bliższa, co daje głębię bez efekciarstwa.
 * Ruch liczymy z `getBoundingClientRect` raz na klatkę (rAF) i zapisujemy do
 * zmiennej `--drift`, więc CSS wykonuje wyłącznie `transform` — bez reflow.
 *
 * `prefers-reduced-motion` wyłącza parallaksę całkowicie (nasłuch nie startuje).
 */
export function HeroEnvelopes() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = stage.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      /* 0 gdy środek sceny mija środek ekranu; rośnie przy przewijaniu w dół. */
      const center = rect.top + rect.height / 2;
      const drift = (window.innerHeight / 2 - center) / window.innerHeight;
      stage.style.setProperty('--drift', drift.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="hero-stage"
      ref={stageRef}
    >
      <span className="hero-stage-glow" aria-hidden="true" />

      {/* Wymiary `width`/`height` są jawne, a scena ma stałe `aspect-ratio` —
          kadr rezerwuje miejsce przed pobraniem obrazów, więc hero nie generuje
          CLS. Pierwsza koperta ładuje się priorytetowo jako kandydat na LCP. */}
      <figure className="hero-envelope hero-envelope-back">
        <div 
          className="hero-envelope-3d"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            e.currentTarget.style.setProperty('--mouse-x', x.toFixed(4));
            e.currentTarget.style.setProperty('--mouse-y', y.toFixed(4));
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--mouse-x', '0');
            e.currentTarget.style.setProperty('--mouse-y', '0');
          }}
        >
          <img
            src="/images/koperta-gorna-1127.webp"
            srcSet="/images/koperta-gorna-564.webp 564w, /images/koperta-gorna-1127.webp 1127w"
            sizes="(max-width: 980px) 76vw, 41vw"
            width={1127}
            height={763}
            alt="Czarna koperta ozdobna DL od strony klapki — papier barwiony w masie, wykończenie matowe"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </figure>

      <figure className="hero-envelope hero-envelope-front">
        <div 
          className="hero-envelope-3d"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            e.currentTarget.style.setProperty('--mouse-x', x.toFixed(4));
            e.currentTarget.style.setProperty('--mouse-y', y.toFixed(4));
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--mouse-x', '0');
            e.currentTarget.style.setProperty('--mouse-y', '0');
          }}
        >
          <img
            src="/images/koperta-dolna-1036.webp"
            srcSet="/images/koperta-dolna-518.webp 518w, /images/koperta-dolna-1036.webp 1036w"
            sizes="(max-width: 980px) 70vw, 38vw"
            width={1036}
            height={671}
            alt="Czarna koperta ozdobna DL z białym nadrukiem logo Envelopes na przedniej ściance"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </figure>
    </div>
  );
}
