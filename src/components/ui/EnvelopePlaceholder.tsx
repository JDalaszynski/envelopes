import { COLOR_MAP } from '@/lib/catalog';
import { buildImageAlt } from '@/lib/product-name';

/**
 * Placeholder produktowy — w serwisie nie ma żadnych prawdziwych zdjęć.
 * Prostokąt w proporcjach realnego zdjęcia produktowego (4:3), z rysunkiem
 * koperty i podpisem tekstowym. Tło przyjmuje subtelny odcień wybranego
 * koloru, żeby konfigurator dawał namiastkę podglądu.
 *
 * Wymiary są zawsze jawne (aspect-ratio + width/height) — unikamy CLS,
 * co jest bezpośrednim czynnikiem Core Web Vitals (pkt 8.3).
 */

interface Props {
  format: string;
  colorId: string;
  /** Proporcje ramki — 'photo' 4:3, 'wide' 16:9, 'portrait' 3:4 */
  ratio?: 'photo' | 'wide' | 'portrait' | 'square';
  /** Ukryj podpis pod rysunkiem (np. w gęstym gridzie) */
  hideCaption?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Czy pokazywać zdjęcie z podglądem nadruku */
  hasPrint?: boolean;
  /** Czy pokazywać zdjęcie z podglądem personalizacji */
  hasPersonalization?: boolean;
}

const RATIOS = { photo: '4 / 3', wide: '16 / 9', portrait: '3 / 4', square: '1 / 1' };

export function EnvelopePlaceholder({
  format,
  colorId,
  ratio = 'photo',
  hideCaption = false,
  size = 'md',
  hasPrint = false,
  hasPersonalization = false,
}: Props) {
  const color = COLOR_MAP[colorId];
  const hex = color?.hex ?? '#EADFC8';
  const name = color?.name ?? colorId;
  const caption = `[Koperta — ${format}, ${name}]`;
  const strokeColor = color?.dark ? 'rgba(255,255,255,.55)' : 'rgba(31,36,48,.45)';
  const captionSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 13;

  const personalizedUrl = hasPersonalization
    ? color?.personalizedImages?.[format as keyof typeof color.personalizedImages]
    : undefined;
  const printUrl = hasPrint
    ? color?.printImages?.[format as keyof typeof color.printImages]
    : undefined;
  const imageUrl =
    personalizedUrl || printUrl || color?.images?.[format as keyof typeof color.images];

  /* Alt opisuje to, co faktycznie widać na kadrze — nadruk i personalizacja
     mają własne zdjęcia, więc muszą mieć własny opis (pkt 8.3). */
  const alt = buildImageAlt(
    format,
    colorId,
    personalizedUrl ? 'personalizacja' : printUrl ? 'nadruk' : undefined
  );

  if (imageUrl) {
    return (
      <figure
        className="placeholder"
        style={{
          aspectRatio: RATIOS[ratio],
          padding: 0,
          background: '#fff',
          overflow: 'hidden',
        }}
      >
        {/* Zdjęcia produktowe to pliki PNG po ~0,6 MB, a na stronie głównej
            jest ich kilkanaście. Leniwe ładowanie zdejmuje je z krytycznej
            ścieżki renderowania — ramka ma jawny aspect-ratio, więc nie
            powoduje to przesunięć układu (pkt 5.5). */}
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </figure>
    );
  }

  return (
    <figure
      className="placeholder"
      role="img"
      aria-label={alt}
      style={{
        aspectRatio: RATIOS[ratio],
        // Subtelny odcień wybranego koloru jako tło kadru
        background: `linear-gradient(160deg, ${hex}2E 0%, ${hex}5C 100%), var(--color-paper)`,
      }}
    >
      <svg
        viewBox="0 0 120 84"
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
        style={{ maxWidth: size === 'sm' ? 72 : size === 'lg' ? 168 : 120 }}
      >
        {/* Korpus koperty w wybranym kolorze */}
        <rect
          x="6"
          y="10"
          width="108"
          height="64"
          rx="3"
          fill={hex}
          stroke={strokeColor}
          strokeWidth="1.5"
        />
        {/* Klapka */}
        <path
          d="M6 13 L60 48 L114 13"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Pieczęć lakowa — sygnatura marki */}
        <circle cx="60" cy="52" r="7" fill="var(--color-seal)" opacity="0.9" />
        <circle cx="60" cy="52" r="4" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1" />
      </svg>
      {!hideCaption && (
        <figcaption className="mono-sm placeholder-caption" style={{ fontSize: captionSize }}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
