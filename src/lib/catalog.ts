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

/**
 * Formaty, które faktycznie da się kupić — widoczne i bez `disabled`.
 * Treść, cennik i dane strukturalne muszą korzystać z tej listy, a nie
 * z `FORMATS`: pokazanie ceny formatu ze statusem „Dostępne wkrótce" jest
 * obietnicą, której konfigurator nie zrealizuje.
 */
export const AVAILABLE_FORMATS = FORMATS.filter((f) => !f.hidden && !f.disabled);

/** Formaty zapowiedziane — widoczne w treści wyłącznie ze statusem, bez ceny i bez CTA. */
export const UPCOMING_FORMATS = FORMATS.filter((f) => !f.hidden && f.disabled);

export const FORMAT_MAP: Record<FormatId, EnvelopeFormat> = FORMATS.reduce(
  (acc, f) => ({ ...acc, [f.id]: f }),
  {} as Record<FormatId, EnvelopeFormat>
);

/* ── Dopasowanie wkładek do formatu — klaster K4 (`/koperty-dl`) ───────── */

/**
 * Zalecany zapas między wkładką a kopertą, w każdym wymiarze.
 *
 * Wartość 5 mm jest środkiem przedziału 4–6 mm, który podajemy we wpisie
 * o doborze koperty do zaproszeń. Trzymamy ją w jednym miejscu, bo z niej
 * liczy się zarówno tabela dopasowań na `/koperty-dl`, jak i deklarowana
 * największa wkładka — dwie liczby, które nie mogą się rozjechać.
 */
export const INSERT_CLEARANCE_MM = 5;

export interface StandardInsert {
  label: string;
  /**
   * Wymiary w mm zapisane w konwencji, w jakiej dana wkładka jest zwyczajowo
   * opisywana: formaty papieru krótszym bokiem do przodu (A4 = 210 × 297),
   * banknoty i karty dłuższym. Kolejność nie wpływa na wynik dopasowania —
   * `fitsInFormat()` porównuje krótszy bok z krótszym.
   */
  width: number;
  height: number;
  /** Do czego wkładka służy — kontekst zakupowy, nie opis geometrii */
  note: string;
}

/**
 * Standardowe wkładki, o które pytają klienci przy formacie DL.
 * Wymiary są wartościami normatywnymi (seria A, karta ID-1, banknoty NBP),
 * a nie deklaracją oferty — nie sprzedajemy żadnej z tych rzeczy.
 * Dopasowanie liczy `fitsInFormat()` z wymiarów katalogowych koperty,
 * więc zmiana formatu w `FORMATS` przepisuje całą tabelę na stronie.
 */
export const STANDARD_INSERTS: StandardInsert[] = [
  {
    label: 'Kartka A4 złożona na trzy',
    width: 99,
    height: 210,
    note: 'Pismo, umowa, faktura i certyfikat — podstawa korespondencji firmowej.',
  },
  {
    label: 'Voucher lub bon w formacie DL',
    width: 99,
    height: 210,
    note: 'Bon podarunkowy drukowany na jednej trzeciej arkusza A4.',
  },
  {
    label: 'Kartka A5 złożona na pół (A6)',
    width: 105,
    height: 148,
    note: 'Kartka okolicznościowa i zaproszenie w klasycznym formacie A6.',
  },
  {
    label: 'Zdjęcie 10 × 15 cm',
    width: 100,
    height: 150,
    note: 'Odbitka fotograficzna dołączana do korespondencji.',
  },
  {
    label: 'Banknot 500 zł',
    width: 150,
    height: 75,
    note: 'Największy banknot w obiegu — mieści się płasko, bez składania.',
  },
  {
    label: 'Karta podarunkowa (standard ID-1)',
    width: 85.6,
    height: 54,
    note: 'Karta plastikowa w wymiarze karty płatniczej.',
  },
  {
    label: 'Wizytówka',
    width: 90,
    height: 50,
    note: 'Dołączana do przesyłki firmowej razem z listem.',
  },
  {
    label: 'Kartka A4 złożona na pół (A5)',
    width: 148,
    height: 210,
    note: 'Program wydarzenia i broszura składana raz — za szeroka na format DL.',
  },
  {
    label: 'Zaproszenie kwadratowe',
    width: 150,
    height: 150,
    note: 'Wkładka kwadratowa wymaga koperty K4 155 × 155 mm.',
  },
  {
    label: 'Dyplom A4 bez składania',
    width: 210,
    height: 297,
    note: 'Arkusz A4 płasko — nie mieści się w żadnej kopercie z naszego katalogu.',
  },
];

export interface InsertFit {
  /** Czy wkładka mieści się z zachowaniem zalecanego zapasu */
  fits: boolean;
  /** Zapas na krótszym boku w mm — ujemny, gdy wkładka jest za duża */
  clearanceShort: number;
  /** Zapas na dłuższym boku w mm */
  clearanceLong: number;
}

/** Zaokrąglenie do jednego miejsca — wymiary w mm bywają ułamkowe (karta ID-1). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Sprawdza, czy wkładka mieści się w kopercie. Porównujemy krótszy bok
 * z krótszym i dłuższy z dłuższym, bo wkładkę wsuwa się w tej orientacji,
 * w której jest to możliwe — a nie w tej, w jakiej zapisano ją w tabeli.
 */
export function fitsInFormat(
  insert: { width: number; height: number },
  format: EnvelopeFormat,
  clearance: number = INSERT_CLEARANCE_MM
): InsertFit {
  const insertShort = Math.min(insert.width, insert.height);
  const insertLong = Math.max(insert.width, insert.height);
  const formatShort = Math.min(format.width, format.height);
  const formatLong = Math.max(format.width, format.height);
  const clearanceShort = round1(formatShort - insertShort);
  const clearanceLong = round1(formatLong - insertLong);

  return {
    fits: clearanceShort >= clearance && clearanceLong >= clearance,
    clearanceShort,
    clearanceLong,
  };
}

/** Największa wkładka mieszcząca się w formacie przy zalecanym zapasie. */
export function maxInsertSize(
  format: EnvelopeFormat,
  clearance: number = INSERT_CLEARANCE_MM
): { short: number; long: number } {
  return {
    short: round1(Math.min(format.width, format.height) - clearance),
    long: round1(Math.max(format.width, format.height) - clearance),
  };
}

/** Wymiar w milimetrach zapisany po polsku — przecinek dziesiętny. */
export function formatMm(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

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
  { id: 'blekit-lupkowy', name: 'Jeansowy', hex: '#6E8395', bestseller: true, weight: '120g', images: { DL: '/images/colors/blekit-lupkowy-koperta-dl.png' }, printImages: { DL: '/images/prints/blekit-lupkowy-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/blekit-lupkowy-dl-koperta-z-personalizacja.png' } },
  { id: 'jasnoniebieska', name: 'Błękitna', hex: '#B9CBDD', weight: '115g', images: { DL: '/images/colors/jasnoniebieska-koperta-dl.png' }, printImages: { DL: '/images/prints/jasnoniebieski-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/jasnoniebieski-lupkowy-dl-koperta-z-personalizacja.png' } },

  // Zielenie
  { id: 'ciemnozielony', name: 'Butelkowa Zieleń', hex: '#2F4A38', dark: true, weight: '115g', images: { DL: '/images/colors/ciemnozielona-koperta-dl.png' }, printImages: { DL: '/images/prints/ciemnozielona-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/ciemnozielona-dl-koperta-z-personalizacja.png' } },
  { id: 'matcha', name: 'Matcha', hex: '#A8B78C', bestseller: true, weight: '120g', images: { DL: '/images/colors/matcha-koperta-dl.png' }, printImages: { DL: '/images/prints/matcha-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/matcha-dl-koperta-z-personalizacja.png' } },
  { id: 'jasnozielony', name: 'Zielony', hex: '#BFD3A8', weight: '115g', images: { DL: '/images/colors/jasnozielona-koperta-dl.png' }, printImages: { DL: '/images/prints/jasnozielony-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/jasnozielona-dl-koperta-z-personalizacja.png' } },

  // Róże / Czerwienie
  { id: 'czerwony', name: 'Czerwony', hex: '#8E2B2B', dark: true, weight: '115g', images: { DL: '/images/colors/czerwona-koperta-dl.png' }, printImages: { DL: '/images/prints/czerwona-dl-koperta-z-nadrukiem.png' }, personalizedImages: { DL: '/images/personalized/czerwona-dl-koperta-z-personalizacja.png' } },
  { id: 'rozowa', name: 'Różowa', hex: '#E6C3C1', weight: '115g', images: { DL: '/images/colors/rozowa-koperta-dl.png' } },

  // Żółte / Ziemiste
  { id: 'taupe', name: 'Szarobrązowy', hex: '#9C8C7E', weight: '140g', images: { DL: '/images/colors/taupe-koperta-dl.png' } },
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

/**
 * Lista rozszerzeń do treści na stronie — bez `jpeg`, bo dla czytelnika jest
 * tym samym formatem co `jpg`. Walidacja uploadu korzysta z pełnej listy.
 */
export const PRINT_FILE_EXTENSIONS_LABEL = PRINT_FILE_EXTENSIONS.filter((ext) => ext !== 'jpeg')
  .map((ext) => ext.toUpperCase())
  .join(', ');
export const PRINT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const PRINT_FILE_MAX_COUNT = 3;

/** Próg, powyżej którego proponujemy wycenę indywidualną (lead-gen B2B) */
export const BULK_QUOTE_THRESHOLD = 2000;

/* ── Personalizacja / adresowanie (pkt 1.3) ───────────────────────────── */

export interface AddressSheetColumn {
  label: string;
  /** Pole, bez którego walidacja arkusza odrzuca wiersz */
  required: boolean;
  note: string;
}

/**
 * Kolumny szablonu adresowego XLSX — jedno źródło prawdy dla generatora
 * szablonu (`/api/personalizacja/szablon`), walidacji wgranego pliku
 * i treści strony `/koperty-personalizowane`.
 *
 * Wcześniej nagłówki arkusza istniały wyłącznie w kodzie API. Opisanie ich
 * na stronie ofertowej wymagałoby przepisania listy ręcznie, a wtedy zmiana
 * szablonu rozjechałaby się z obietnicą na stronie.
 */
export const PERSONALIZATION_SHEET_COLUMNS: AddressSheetColumn[] = [
  {
    label: 'Lp.',
    required: false,
    note: 'Numer wiersza — w pobranym szablonie jest już uzupełniony.',
  },
  {
    label: 'Imię i nazwisko',
    required: false,
    note: 'Wiersz musi mieć wypełnione imię i nazwisko albo nazwę firmy — inaczej traktujemy go jako pusty.',
  },
  {
    label: 'Firma (opcjonalnie)',
    required: false,
    note: 'Nazwa firmy odbiorcy. Drukujemy ją nad wierszem z ulicą.',
  },
  { label: 'Ulica i numer', required: true, note: 'Numer lokalu podajemy po ukośniku, np. 41/2.' },
  { label: 'Kod pocztowy', required: true, note: 'Zapis w formacie 00-000, spójny w całym arkuszu.' },
  { label: 'Miejscowość', required: true, note: 'Bez skrótów i bez nazwy województwa.' },
  { label: 'Kraj', required: false, note: 'W szablonie wpisana z góry wartość „Polska".' },
];

/** Pola, których brak zatrzymuje walidację arkusza adresowego. */
export const PERSONALIZATION_REQUIRED_COLUMNS = PERSONALIZATION_SHEET_COLUMNS.filter(
  (column) => column.required
);

/** Rozszerzenia arkusza z danymi do personalizacji. */
export const PERSONALIZATION_SHEET_EXTENSIONS = ['xlsx', 'xls', 'csv'];

export const PERSONALIZATION_SHEET_EXTENSIONS_LABEL = PERSONALIZATION_SHEET_EXTENSIONS.map((ext) =>
  ext.toUpperCase()
).join(', ');

/** Górna granica wierszy generowanego szablonu adresowego. */
export const PERSONALIZATION_SHEET_MAX_ROWS = 20000;
