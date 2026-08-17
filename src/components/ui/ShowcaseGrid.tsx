import { ConfigureLink } from '@/components/home/ConfigureLink';
import {
  showcaseCaption,
  showcaseColorName,
  showcaseLinkTitle,
  showcaseSrc,
  showcaseSrcSet,
  type ShowcaseShot,
} from '@/lib/showcase';

/**
 * Siatka kadrów zastosowań (`src/lib/showcase.ts`). Każdy kadr jest
 * odnośnikiem do konfiguratora z preselekcją koloru i usługi — wejście
 * z frazy „koperty z logo kancelarii" ma otworzyć konfigurator z granatem
 * i włączonym nadrukiem, a nie pusty krok pierwszy (pkt 7 briefu).
 *
 * Wygląd bierze z `.paper-shot`, tej samej klasy co zbliżenia na papier
 * na stronie głównej — kadry są kwadratowe, więc wzorzec pasuje bez zmian
 * i nie mnożymy stylów pod drugą galerię.
 */

interface Props {
  shots: ShowcaseShot[];
  /** Liczba kolumn na szerokim ekranie — decyduje o `sizes` */
  columns: 3 | 4;
  /** Pierwszy kadr sekcji widocznej w pierwszym ekranie ładuje się od razu */
  eager?: boolean;
  /**
   * Ile z parametrów papieru niesie podpis kadru:
   *
   * - `full` — odcień, gramatura i wykończenie. Strony filarowe sprzedają
   *   konkretny wariant papieru, więc go pokazują.
   * - `color` — sam odcień. Dla stron, na których kadr jest ilustracją,
   *   a gramatura byłaby parametrem bez właściciela na tej stronie.
   * - `none` — bez podpisu produktowego; te dane podaje konfigurator.
   */
  spec?: 'full' | 'color' | 'none';
}

/**
 * `sizes` policzone z realnej szerokości kolumny, nie „na oko":
 * kontener ma `max-width: 1200px` i `padding: 0 24px`, siatka `gap: 24px`,
 * a poniżej 720 px `.m-snap-sm` zamienia siatkę w karuzelę o karcie 62vw.
 */
const SIZES: Record<3 | 4, string> = {
  4: '(max-width: 720px) 62vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1248px) calc(25vw - 30px), 270px',
  3: '(max-width: 720px) 62vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1248px) calc(33.3vw - 32px), 368px',
};

export function ShowcaseGrid({ shots, columns, eager = false, spec = 'full' }: Props) {
  return (
    <div className={`grid grid-${columns} paper-shots m-snap m-snap-sm`}>
      {shots.map((shot, index) => (
        <ConfigureLink
          key={shot.file}
          format="DL"
          color={shot.colorId}
          print={shot.variant === 'nadruk'}
          personalization={shot.variant === 'personalizacja'}
          className="paper-shot"
          title={showcaseLinkTitle(shot)}
        >
          <figure>
            {/* Kadry są kwadratowe (1:1) i mają jawne `width`/`height` oraz
                `aspect-ratio` w CSS — miejsce jest zarezerwowane przed
                pobraniem pliku, więc galeria nie generuje CLS (pkt 5.5). */}
            <img
              src={showcaseSrc(shot)}
              srcSet={showcaseSrcSet(shot)}
              sizes={SIZES[columns]}
              width={1024}
              height={1024}
              alt={shot.alt}
              loading={eager && index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            <figcaption>
              {spec === 'none' ? null : (
                <strong>
                  {spec === 'full' ? showcaseCaption(shot) : showcaseColorName(shot)}
                </strong>
              )}
              <span className="small muted">{shot.note}</span>
            </figcaption>
          </figure>
        </ConfigureLink>
      ))}
    </div>
  );
}
