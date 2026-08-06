import { COLOR_MAP } from '@/lib/catalog';

/**
 * Kształt koperty (prostokąt + trójkątna klapka) — używany jako swatch koloru.
 * Świadomie nie jest zwykłym kółkiem ani kwadratem: wzmacnia rozpoznawalność
 * produktu w serwisie bez żadnych zdjęć (pkt 4.6).
 */
export function EnvelopeShape({ colorId }: { colorId: string }) {
  const color = COLOR_MAP[colorId];
  const hex = color?.hex ?? '#EADFC8';
  const stroke = color?.dark ? 'rgba(255,255,255,.45)' : 'rgba(31,36,48,.35)';

  return (
    <svg viewBox="0 0 64 48" width="100%" height="100%" aria-hidden="true" focusable="false">
      <rect
        x="1"
        y="1"
        width="62"
        height="46"
        rx="3"
        fill={hex}
        stroke={stroke}
        strokeWidth="1"
      />
      <path d="M1 4 L32 27 L63 4" fill="none" stroke={stroke} strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
