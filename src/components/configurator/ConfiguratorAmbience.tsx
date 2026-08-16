'use client';

import { useEffect, useRef } from 'react';

/**
 * Warstwy dekoracyjne granatowego pasa konfiguratora: ziarno, winieta
 * i światło idące za kursorem.
 *
 * Dlaczego elementy, a nie pseudoelementy sekcji: pseudoelement z `z-index`
 * musiałby stworzyć kontekst nakładania na samej sekcji, a wewnątrz
 * konfiguratora siedzą elementy `fixed`, które muszą warstwować się względem
 * całej strony — toast (150) stoi nad banerem zgód (120). Zwykłe elementy
 * `position: absolute` bez `z-index` malują się w kolejności drzewa, więc
 * treść w `.container` przykrywa je bez żadnego kontekstu nakładania.
 *
 * Śledzenie kursora jest dekoracją wskaźnika: bez wskaźnika (dotyk) i przy
 * ograniczonym ruchu nie ma czego pokazywać, więc nasłuch w ogóle nie rusza.
 */
export function ConfiguratorAmbience() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zone = ref.current?.closest<HTMLElement>('.configurator-zone');
    if (!zone) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || calm.matches) return;

    /* Pozycja wskaźnika w pikselach okna — przeliczamy ją na procenty
       dopiero w klatce, razem z jedynym odczytem geometrii. Odczyt
       w `pointermove` wymuszałby przeliczenie układu przy każdym ruchu. */
    let pointer: { x: number; y: number } | null = null;
    let target = { x: 50, y: 50 };
    const current = { x: 50, y: 50 };
    let frame = 0;

    /* Funkcje strzałkowe, nie deklaracje — deklaracja jest wynoszona ponad
       sprawdzenie `if (!zone) return`, więc TypeScript przestaje widzieć
       zawężenie typu wewnątrz niej. */
    const tick = () => {
      frame = 0;

      if (pointer) {
        const rect = zone.getBoundingClientRect();
        target = {
          x: ((pointer.x - rect.left) / rect.width) * 100,
          y: ((pointer.y - rect.top) / rect.height) * 100,
        };
      }

      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      zone.style.setProperty('--cx', `${current.x.toFixed(2)}%`);
      zone.style.setProperty('--cy', `${current.y.toFixed(2)}%`);

      /* Winieta idzie za kursorem ułamkiem jego drogi — ±6% szerokości pasa
         i ±4% wysokości. Tyle wystarczy, by krawędź „oddychała", a za mało,
         by ruch przyciągał wzrok z treści. */
      zone.style.setProperty('--vx', `${(50 + (current.x - 50) * 0.12).toFixed(2)}%`);
      zone.style.setProperty('--vy', `${(50 + (current.y - 50) * 0.08).toFixed(2)}%`);

      /* Pętla zatrzymuje się, gdy światło dojdzie na miejsce — przy
         nieruchomym kursorze nie ma czego animować. */
      const settled =
        Math.abs(target.x - current.x) < 0.05 && Math.abs(target.y - current.y) < 0.05;
      if (!settled) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const handleMove = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
      zone.dataset.cursor = 'on';
      start();
    };

    const handleLeave = () => {
      pointer = null;
      target = { x: 50, y: 50 };
      delete zone.dataset.cursor;
      start();
    };

    zone.addEventListener('pointermove', handleMove);
    zone.addEventListener('pointerleave', handleLeave);

    return () => {
      zone.removeEventListener('pointermove', handleMove);
      zone.removeEventListener('pointerleave', handleLeave);
      if (frame) cancelAnimationFrame(frame);
      delete zone.dataset.cursor;
      for (const name of ['--cx', '--cy', '--vx', '--vy']) zone.style.removeProperty(name);
    };
  }, []);

  return (
    <span className="config-ambience" aria-hidden="true" ref={ref}>
      <span className="config-ambience-grain" />
      <span className="config-ambience-glow" />
    </span>
  );
}
