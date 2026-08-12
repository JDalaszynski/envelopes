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
  /** Oznacza format jako niedostępny do wyboru */
  disabled?: boolean;
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
    badge: 'Dostępne wkrótce',
    disabled: true,
  },
  {
    id: 'K4',
    width: 155,
    height: 155,
    dimensions: '155 × 155 mm',
    audience: 'Zaproszenia ślubne i firmowe, kartki okolicznościowe, wysyłki premium.',
    badge: 'Dostępne wkrótce',
    disabled: true,
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
  /** Zdjęcia podglądowe dla opcji personalizacji */
  personalizedImages?: Partial<Record<FormatId, string>>;
  /** Gramatura papieru, np. "115g" */
  weight?: string;
}

/**
 * 19 kolorów. Wszystkie w identycznej cenie w danym formacie —
 * brak dopłat za wykończenia perłowe/metaliczne (pkt 1.2).
 */
export const COLORS: EnvelopeColor[] = [
  // Szarości / Czarny
  { id: 'czarny', name: 'Czarny', hex: '#23242A', dark: true, bestseller: true, weight: '115g', images: { DL: '/images/colors/czarna-koperta-dl.png' }, printImages: { DL: '/images/prints/czarna-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/czarna-dl-koperta-z-personalizacja.png' } },
  { id: 'szara', name: 'Szara', hex: '#9A9A96', weight: '115g', images: { DL: '/images/colors/szara-koperta-dl.png' }, printImages: { DL: '/images/prints/szara-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/szara-dl-koperta-z-personalizacja.png' } },

  // Niebieskie
  { id: 'granatowy', name: 'Granatowy', hex: '#22314F', dark: true, bestseller: true, weight: '115g', images: { DL: '/images/colors/granatowa-koperta-dl.png' }, printImages: { DL: '/images/prints/granatowa-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/granatowa-dl-koperta-z-personalizacja.png' } },
  { id: 'niebieski', name: 'Niebieski', hex: '#3A5C8C', dark: true, weight: '115g', images: { DL: '/images/colors/niebieska-koperta-dl.png' } },
  { id: 'blekit-lupkowy', name: 'Błękit Łupkowy', hex: '#6E8395', bestseller: true, weight: '120g', images: { DL: '/images/colors/blekit-lupkowy-koperta-dl.png' }, printImages: { DL: '/images/prints/blekit-lupkowy-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/blekit-lupkowy-dl-koperta-z-personalizacja.png' } },
  { id: 'jasnoniebieska', name: 'Jasnoniebieska', hex: '#B9CBDD', weight: '115g', images: { DL: '/images/colors/jasnoniebieska-koperta-dl.png' }, printImages: { DL: '/images/prints/jasnoniebieski-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/jasnoniebieski-lupkowy-dl-koperta-z-personalizacja.png' } },

  // Zielenie
  { id: 'ciemnozielony', name: 'Ciemnozielony', hex: '#2F4A38', dark: true, weight: '115g', images: { DL: '/images/colors/ciemnozielona-koperta-dl.png' }, printImages: { DL: '/images/prints/ciemnozielona-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/ciemnozielona-dl-koperta-z-personalizacja.png' } },
  { id: 'matcha', name: 'Matcha', hex: '#A8B78C', bestseller: true, weight: '120g', images: { DL: '/images/colors/matcha-koperta-dl.png' }, printImages: { DL: '/images/prints/matcha-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/matcha-dl-koperta-z-personalizacja.png' } },
  { id: 'jasnozielony', name: 'Jasnozielony', hex: '#BFD3A8', weight: '115g', images: { DL: '/images/colors/jasnozielona-koperta-dl.png' }, printImages: { DL: '/images/prints/jasnozielony-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/jasnozielona-dl-koperta-z-personalizacja.png' } },

  // Róże / Czerwienie
  { id: 'czerwony', name: 'Czerwony', hex: '#8E2B2B', dark: true, weight: '115g', images: { DL: '/images/colors/czerwona-koperta-dl.png' }, printImages: { DL: '/images/prints/czerwona-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/czerwona-dl-koperta-z-personalizacja.png' } },
  { id: 'rozowa', name: 'Różowa', hex: '#E6C3C1', weight: '115g', images: { DL: '/images/colors/rozowa-koperta-dl.png' } },

  // Żółte / Ziemiste
  { id: 'taupe', name: 'Taupe', hex: '#9C8C7E', weight: '140g', images: { DL: '/images/colors/taupe-koperta-dl.png' } },
  { id: 'eko', name: 'Eko', hex: '#C6AE8B', finish: 'eko', weight: '115g', images: { DL: '/images/colors/eko-koperta-dl.png' } },
  { id: 'zolta', name: 'Żółta', hex: '#E8CE7E', weight: '115g', images: { DL: '/images/colors/zolta-koperta-dl.png' }, printImages: { DL: '/images/prints/zolta-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/zolta-dl-koperta-z-personalizacja.png' } },
  
  // Perłowe / Metaliczne
  { id: 'zloty', name: 'Złoty', hex: '#C09A4E', finish: 'metaliczne', bestseller: true, weight: '115g', images: { DL: '/images/colors/zlota-koperta-dl.png' } },
  { id: 'srebrna-perlowa', name: 'Srebrna Perłowa', hex: '#C9C7C2', finish: 'perłowe', weight: '115g', images: { DL: '/images/colors/srebrna-perlowa-koperta-dl.png' } },
  { id: 'biala-perlowa', name: 'Biała Perłowa', hex: '#F2EDE4', finish: 'perłowe', weight: '115g', images: { DL: '/images/colors/biale-perlowe-koperta-dl.png' } },
  
  // Jasne / Kremowe
  { id: 'ecru', name: 'Ecru', hex: '#EADFC8', weight: '115g', images: { DL: '/images/colors/ecru-koperta-dl.png' }, printImages: { DL: '/images/prints/ecru-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/ecru-dl-koperta-z-personalizacja.png' } },
  { id: 'bialy', name: 'Biały', hex: '#FBFAF7', bestseller: true, weight: '115g', images: { DL: '/images/colors/biala-koperta-dl.png' }, printImages: { DL: '/images/prints/biala-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/biala-dl-koperta-z-personalizacja.png' } },
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
