/**
 * Katalog produktowy — formaty i kolory kopert.
 * Źródło prawdy dla konfiguratora, koszyka, checkoutu i panelu Admina.
 */

export type FormatId = 'K4' | 'C6' | 'DL';

export interface EnvelopeFormat {
  id: FormatId;
  /** Wymiary w mm — standardowe wartości poligraficzne */
  width: number;
  height: number;
  dimensions: string;
  /** Rozwinięcie dla sekcji „Formaty i zastosowania" na stronie głównej */
  audience: string;
  /** Wyróżnienie na karcie formatu, np. „Bestseller" */
  badge?: string;
  /** Ukrywa format na froncie sklepu */
  hidden?: boolean;
}

export const FORMATS: EnvelopeFormat[] = [
  {
    id: 'DL',
    width: 110,
    height: 220,
    dimensions: '110 × 220 mm',
    audience: 'Kancelarie, biura rachunkowe, pisma firmowe i faktury.',
    badge: 'Bestseller',
  },
  {
    id: 'C6',
    width: 114,
    height: 162,
    dimensions: '114 × 162 mm',
    audience: 'Zaproszenia, kartki okolicznościowe, wysyłki marketingowe.',
    hidden: true,
  },
  {
    id: 'K4',
    width: 155,
    height: 155,
    dimensions: '155 × 155 mm',
    audience: 'Zaproszenia ślubne i firmowe, kartki okolicznościowe, wysyłki premium.',
    hidden: true,
  },
];

/** Najdłuższy bok w katalogu — podstawa do rysowania formatów we wzajemnej skali. */
export const MAX_FORMAT_SIDE = Math.max(...FORMATS.map((f) => Math.max(f.width, f.height)));

export const FORMAT_MAP: Record<FormatId, EnvelopeFormat> = FORMATS.reduce(
  (acc, f) => ({ ...acc, [f.id]: f }),
  {} as Record<FormatId, EnvelopeFormat>
);

export interface EnvelopeColor {
  id: string;
  /** Nazwa użyta w ustandaryzowanej nazwie produktu (pkt 1.9) */
  name: string;
  /** Barwa placeholdera — stonowana, papierowa */
  hex: string;
  /** Czy nazwa koloru wymaga jasnego tekstu na tle */
  dark?: boolean;
  /** Wykończenie — wpływa wyłącznie na wygląd swatcha, nie na cenę */
  finish?: 'perłowe' | 'metaliczne' | 'eko';
  /** Najczęściej zamawiane odcienie — oznaczone plakietką w konfiguratorze */
  bestseller?: boolean;
  /** Zdjęcia kopert w danym kolorze z podziałem na formaty */
  images?: Partial<Record<FormatId, string>>;
  /** Zdjęcia podglądowe dla opcji nadruku */
  printImages?: Partial<Record<FormatId, string>>;
}

/**
 * 19 kolorów. Wszystkie w identycznej cenie w danym formacie —
 * brak dopłat za wykończenia perłowe/metaliczne (pkt 1.2).
 */
export const COLORS: EnvelopeColor[] = [
  // Szarości / Czarny
  { id: 'czarny', name: 'Czarny', hex: '#23242A', dark: true, bestseller: true, images: { DL: '/images/colors/czarna-koperta-dl.png' } },
  { id: 'szara', name: 'Szara', hex: '#9A9A96', images: { DL: '/images/colors/szara-koperta-dl.png' } },

  // Niebieskie
  { id: 'granatowy', name: 'Granatowy', hex: '#22314F', dark: true, bestseller: true, images: { DL: '/images/colors/granatowa-koperta-dl.png' } },
  { id: 'niebieski', name: 'Niebieski', hex: '#3A5C8C', dark: true, images: { DL: '/images/colors/niebieska-koperta-dl.png' } },
  { id: 'blekit-lupkowy', name: 'Błękit Łupkowy', hex: '#6E8395', bestseller: true, images: { DL: '/images/colors/blekit-lupkowy-koperta-dl.png' } },
  { id: 'jasnoniebieska', name: 'Jasnoniebieska', hex: '#B9CBDD', images: { DL: '/images/colors/jasnoniebieska-koperta-dl.png' } },

  // Zielenie
  { id: 'ciemnozielony', name: 'Ciemnozielony', hex: '#2F4A38', dark: true, images: { DL: '/images/colors/ciemnozielona-koperta-dl.png' } },
  { id: 'matcha', name: 'Matcha', hex: '#A8B78C', bestseller: true, images: { DL: '/images/colors/matcha-koperta-dl.png' }, printImages: { DL: '/images/prints/matcha-dl-koperta-z-nadrukiem.png' } },
  { id: 'jasnozielony', name: 'Jasnozielony', hex: '#BFD3A8', images: { DL: '/images/colors/jasnozielona-koperta-dl.png' } },

  // Róże / Czerwienie
  { id: 'czerwony', name: 'Czerwony', hex: '#8E2B2B', dark: true, images: { DL: '/images/colors/czerwona-koperta-dl.png' } },
  { id: 'rozowa', name: 'Różowa', hex: '#E6C3C1', images: { DL: '/images/colors/rozowa-koperta-dl.png' } },

  // Żółte / Ziemiste
  { id: 'taupe', name: 'Taupe', hex: '#9C8C7E', images: { DL: '/images/colors/taupe-koperta-dl.png' } },
  { id: 'eko', name: 'Eko', hex: '#C6AE8B', finish: 'eko', images: { DL: '/images/colors/eko-koperta-dl.png' } },
  { id: 'zolta', name: 'Żółta', hex: '#E8CE7E', images: { DL: '/images/colors/zolta-koperta-dl.png' } },
  
  // Perłowe / Metaliczne
  { id: 'zloty', name: 'Złoty', hex: '#C09A4E', finish: 'metaliczne', bestseller: true, images: { DL: '/images/colors/zlota-koperta-dl.png' } },
  { id: 'srebrna-perlowa', name: 'Srebrna Perłowa', hex: '#C9C7C2', finish: 'perłowe', images: { DL: '/images/colors/srebrna-perlowa-koperta-dl.png' } },
  { id: 'biala-perlowa', name: 'Biała Perłowa', hex: '#F2EDE4', finish: 'perłowe', images: { DL: '/images/colors/biale-perlowe-koperta-dl.png' } },
  
  // Jasne / Kremowe
  { id: 'ecru', name: 'Ecru', hex: '#EADFC8', images: { DL: '/images/colors/ecru-koperta-dl.png' } },
  { id: 'bialy', name: 'Biały', hex: '#FBFAF7', bestseller: true, images: { DL: '/images/colors/biala-koperta-dl.png' } },
];

export const COLOR_MAP: Record<string, EnvelopeColor> = COLORS.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<string, EnvelopeColor>
);

export function getColorByName(name: string): EnvelopeColor | undefined {
  return COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Dozwolone rozszerzenia plików nadruku (pkt 1.4) */
export const PRINT_FILE_EXTENSIONS = ['pdf', 'ai', 'eps', 'cdr', 'png', 'jpg', 'jpeg', 'svg'];
export const PRINT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const PRINT_FILE_MAX_COUNT = 3;

/** Próg, powyżej którego proponujemy wycenę indywidualną (lead-gen B2B) */
export const BULK_QUOTE_THRESHOLD = 2000;
