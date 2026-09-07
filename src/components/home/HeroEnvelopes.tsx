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
  const backTiltRef = useRef<HTMLDivElement>(null);
  const frontTiltRef = useRef<HTMLDivElement>(null);

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

  /* Nasłuch na całej scenie zamiast per-koperta: `mousemove` dociera tu
     przez bąbelkowanie niezależnie od tego, która koperta fizycznie
     „złapała" kursor. Dzięki temu przezroczyste narożniki koperty górnej
     (wyższy z-index) nie blokują już przechyłu koperty dolnej pod spodem —
     przechył liczymy osobno dla każdej z ich własnych `getBoundingClientRect`. */
  const tilt = (ref: React.RefObject<HTMLDivElement | null>, e: { clientX: number; clientY: number }) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--mouse-x', x.toFixed(4));
    el.style.setProperty('--mouse-y', y.toFixed(4));
  };

  const resetTilt = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.style.setProperty('--mouse-x', '0');
    ref.current?.style.setProperty('--mouse-y', '0');
  };

  return (
    <div
      className="hero-stage"
      ref={stageRef}
      onMouseMove={(e) => {
        tilt(backTiltRef, e);
        tilt(frontTiltRef, e);
      }}
      onMouseLeave={() => {
        resetTilt(backTiltRef);
        resetTilt(frontTiltRef);
      }}
    >
      <span className="hero-stage-glow" aria-hidden="true" />

      {/* Wymiary `width`/`height` są jawne, a scena ma stałe `aspect-ratio` —
          kadr rezerwuje miejsce przed pobraniem obrazów, więc hero nie generuje
          CLS. Pierwsza koperta ładuje się priorytetowo jako kandydat na LCP. */}
      <figure className="hero-envelope hero-envelope-back">
        <div className="hero-envelope-3d" ref={backTiltRef}>
          <img
            src="/images/koperta-gorna-1127.png"
            srcSet="/images/koperta-gorna-564.png 564w, /images/koperta-gorna-1127.png 1127w"
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
        <div className="hero-envelope-3d" ref={frontTiltRef}>
          <img
            src="/images/koperta-dolna-1036.png"
            srcSet="/images/koperta-dolna-518.png 518w, /images/koperta-dolna-1036.png 1036w"
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
