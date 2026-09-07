'use client';

import { useEffect, useRef } from 'react';

type AlphaMap = { width: number; height: number; data: Uint8ClampedArray };

/* Mapa przezroczystości obrazka, przeskalowana do małej siatki — potrzebna
   wyłącznie do sprawdzenia „czy w tym miejscu jest realnie narysowana
   koperta, czy to przezroczysty róg kadru", więc rozdzielczość 120px
   w poziomie w zupełności wystarcza i jest tania w pamięci. */
function buildAlphaMap(img: HTMLImageElement): AlphaMap | null {
  if (!img.naturalWidth) return null;
  const width = 120;
  const height = Math.max(1, Math.round(width * (img.naturalHeight / img.naturalWidth)));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { width, height, data: alpha };
}

function alphaAt(map: AlphaMap, u: number, v: number): number {
  const x = Math.min(map.width - 1, Math.max(0, Math.floor(u * map.width)));
  const y = Math.min(map.height - 1, Math.max(0, Math.floor(v * map.height)));
  return map.data[y * map.width + x];
}

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
  const backImgRef = useRef<HTMLImageElement>(null);
  const frontImgRef = useRef<HTMLImageElement>(null);
  const backAlphaRef = useRef<AlphaMap | null>(null);
  const frontAlphaRef = useRef<AlphaMap | null>(null);

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

  /* Zdjęcia mają przezroczyste, ukośne narożniki (koperta leży pod kątem
     w kadrze) — sam prostokąt `getBoundingClientRect` obejmuje więc też
     puste tło. Bez sprawdzenia kanału alfa koperta górna (wyższy z-index)
     „łapałaby" kursor nad swoim przezroczystym narożnikiem i blokowała
     przechył koperty dolnej pod spodem, mimo że wizualnie nic tam nie ma. */
  useEffect(() => {
    const load = (imgEl: HTMLImageElement | null, mapRef: React.MutableRefObject<AlphaMap | null>) => {
      if (!imgEl) return;
      const build = () => {
        mapRef.current = buildAlphaMap(imgEl);
      };
      if (imgEl.complete) build();
      else imgEl.addEventListener('load', build, { once: true });
    };
    load(backImgRef.current, backAlphaRef);
    load(frontImgRef.current, frontAlphaRef);
  }, []);

  /* Nasłuch na całej scenie zamiast per-koperta: `mousemove` dociera tu
     przez bąbelkowanie niezależnie od tego, która koperta fizycznie
     „złapała" kursor. Koperta górna ma pierwszeństwo (jest na wierzchu),
     ale tylko tam, gdzie jej piksel jest realnie nieprzezroczysty —
     inaczej sprawdzamy kopertę dolną pod spodem. */
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

  const hitsVisiblePixel = (
    ref: React.RefObject<HTMLDivElement | null>,
    map: AlphaMap | null,
    e: { clientX: number; clientY: number },
  ) => {
    const el = ref.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const v = (e.clientY - rect.top) / rect.height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    /* Mapa jeszcze niegotowa (np. pierwsza klatka) — nie blokujmy interakcji. */
    if (!map) return true;
    return alphaAt(map, u, v) > 24;
  };

  return (
    <div
      className="hero-stage"
      ref={stageRef}
      onMouseMove={(e) => {
        if (hitsVisiblePixel(backTiltRef, backAlphaRef.current, e)) {
          tilt(backTiltRef, e);
          resetTilt(frontTiltRef);
        } else if (hitsVisiblePixel(frontTiltRef, frontAlphaRef.current, e)) {
          tilt(frontTiltRef, e);
          resetTilt(backTiltRef);
        } else {
          resetTilt(backTiltRef);
          resetTilt(frontTiltRef);
        }
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
            ref={backImgRef}
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
            ref={frontImgRef}
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
