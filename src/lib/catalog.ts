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
  /**
   * Zdjęcia kopert gładkich z podziałem na formaty — ścieżka wskazuje wariant
   * 1200 px, bo tego adresu używają dane strukturalne i podgląd pełnowymiarowy.
   * Warianty węższe wyprowadza `colorImageSrcSet()`.
   */
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
  { id: 'czarny', name: 'Czarny', hex: '#23242A', dark: true, bestseller: true, weight: '115g', images: { DL: '/images/colors/czarne-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/czarne-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/czarne-koperty-personalizowane-dl-1200.webp' } },
  { id: 'szara', name: 'Szara', hex: '#9A9A96', weight: '115g', images: { DL: '/images/colors/szare-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/szare-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/szare-koperty-personalizowane-dl-1200.webp' } },

  // Niebieskie
  { id: 'granatowy', name: 'Granatowy', hex: '#22314F', dark: true, bestseller: true, weight: '115g', images: { DL: '/images/colors/granatowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/granatowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/granatowe-koperty-personalizowane-dl-1200.webp' } },
  { id: 'niebieski', name: 'Niebieski', hex: '#3A5C8C', dark: true, weight: '115g', images: { DL: '/images/colors/niebieskie-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/niebieskie-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/niebieskie-koperty-personalizowane-dl-1200.webp' } },
  { id: 'blekit-lupkowy', name: 'Jeansowy', hex: '#6E8395', bestseller: true, weight: '120g', images: { DL: '/images/colors/jeansowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/jeansowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/jeansowe-koperty-personalizowane-dl-1200.webp' } },
  { id: 'jasnoniebieska', name: 'Błękitna', hex: '#B9CBDD', weight: '115g', images: { DL: '/images/colors/blekitne-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/blekitne-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/blekitne-koperty-personalizowane-dl-1200.webp' } },

  // Zielenie
  { id: 'ciemnozielony', name: 'Butelkowa Zieleń', hex: '#2F4A38', dark: true, weight: '115g', images: { DL: '/images/colors/ciemnozielone-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/ciemnozielone-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/ciemnozielone-koperty-personalizowane-dl-1200.webp' } },
  { id: 'matcha', name: 'Matcha', hex: '#A8B78C', bestseller: true, weight: '120g', images: { DL: '/images/colors/matcha-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/matcha-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/matcha-koperty-personalizowane-dl-1200.webp' } },
  { id: 'jasnozielony', name: 'Zielony', hex: '#BFD3A8', weight: '115g', images: { DL: '/images/colors/zielone-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/zielone-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/zielone-koperty-personalizowane-dl-1200.webp' } },

  // Róże / Czerwienie
  { id: 'czerwony', name: 'Czerwony', hex: '#8E2B2B', dark: true, weight: '115g', images: { DL: '/images/colors/czerwone-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/czerwone-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/czerwone-koperty-personalizowane-dl-1200.webp' } },
  { id: 'rozowa', name: 'Różowa', hex: '#E6C3C1', weight: '115g', images: { DL: '/images/colors/rozowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/rozowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/rozowe-koperty-personalizowane-dl-1200.webp' } },

  // Żółte / Ziemiste
  { id: 'taupe', name: 'Szarobrązowy', hex: '#9C8C7E', weight: '140g', images: { DL: '/images/colors/szarobrazowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/szarobrazowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/szarobrazowe-koperty-personalizowane-dl-1200.webp' } },
  { id: 'eko', name: 'Eko', hex: '#C6AE8B', finish: 'eko', weight: '115g', images: { DL: '/images/colors/eko-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/eko-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/eko-koperty-personalizowane-dl-1200.webp' } },
  { id: 'zolta', name: 'Żółta', hex: '#E8CE7E', weight: '115g', images: { DL: '/images/colors/zolte-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/zolte-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/zolte-koperty-personalizowane-dl-1200.webp' } },
  
  // Perłowe / Metaliczne
  { id: 'zloty', name: 'Złoty', hex: '#C09A4E', finish: 'metaliczne', bestseller: true, weight: '115g', images: { DL: '/images/colors/zlote-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/zlote-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/zlote-koperty-personalizowane-dl-1200.webp' } },
  { id: 'srebrna-perlowa', name: 'Srebrna Perłowa', hex: '#C9C7C2', finish: 'perłowe', weight: '115g', images: { DL: '/images/colors/srebrne-perlowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/srebrne-perlowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/srebrne-perlowe-koperty-personalizowane-dl-1200.webp' } },
  { id: 'biala-perlowa', name: 'Biała Perłowa', hex: '#F2EDE4', finish: 'perłowe', weight: '115g', images: { DL: '/images/colors/biale-perlowe-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/biale-perlowe-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/biale-perlowe-koperty-personalizowane-dl-1200.webp' } },
  
  // Jasne / Kremowe
  { id: 'ecru', name: 'Ecru', hex: '#EADFC8', weight: '115g', images: { DL: '/images/colors/ecru-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/ecru-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/ecru-koperty-personalizowane-dl-1200.webp' } },
  { id: 'bialy', name: 'Biały', hex: '#FBFAF7', bestseller: true, weight: '115g', images: { DL: '/images/colors/biale-koperty-ozdobne-dl-1200.webp' }, printImages: { DL: '/images/prints/biale-koperty-z-nadrukiem-dl-1200.webp' }, personalizedImages: { DL: '/images/personalized/biale-koperty-personalizowane-dl-1200.webp' } },
];

/**
 * Szerokości, w których leżą zdjęcia z `public/images/colors/`.
 *
 * Ten sam plik obsługuje trzy bardzo różne rozmiary: swatch w konfiguratorze
 * (~104–170 px), kadr w siatce kart (~270–370 px) i podgląd pełnowymiarowy.
 * Bez `srcSet` swatch o szerokości 104 px pobierał plik 1200 px — na stronie
 * głównej razy dziewiętnaście.
 */
export const COLOR_IMAGE_WIDTHS = [320, 640, 1200] as const;

/**
 * `srcSet` wyprowadzony ze ścieżki wariantu 1200 px. Zwraca `undefined` dla
 * adresów spoza konwencji `<baza>-<szerokość>.webp` — wtedy `<img>` zostaje
 * przy samym `src` i nic się nie psuje. Dzięki temu zdjęcia z `prints/`
 * i `personalized/`, które są jeszcze pojedynczymi plikami PNG, przechodzą
 * przez ten sam komponent bez wyjątków w kodzie wywołującym.
 */
export function colorImageSrcSet(url?: string): string | undefined {
  if (!url) return undefined;
  const base = url.replace(/-\d+\.webp$/, '');
  if (base === url) return undefined;
  return COLOR_IMAGE_WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
}

export const COLOR_MAP: Record<string, EnvelopeColor> = COLORS.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<string, EnvelopeColor>
);

export function getColorByName(name: string): EnvelopeColor | undefined {
  return COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Dozwolone rozszerzenia plików nadruku (pkt 1.4) */
export const PRINT_FILE_EXTENSIONS = ['pdf', 'ai', 'eps', 'cdr', 'png', 'jpg', 'jpeg', 'webp', 'svg'];

/**
 * Lista rozszerzeń do treści na stronie — bez `jpeg`, bo dla czytelnika jest
 * tym samym formatem co `jpg`. Walidacja uploadu korzysta z pełnej listy.
 */
export const PRINT_FILE_EXTENSIONS_LABEL = PRINT_FILE_EXTENSIONS.filter((ext) => ext !== 'jpeg')
  .map((ext) => ext.toUpperCase())
  .join(', ');
export const PRINT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const PRINT_FILE_MAX_COUNT = 3;

/**
 * Wymagania techniczne nadruku, powtarzane w treści na czterech stronach
 * ofertowych, w FAQ i we wpisie o przygotowaniu plików. Trzymamy je jako
 * stałe, bo rozjazd między kartą produktu a poradnikiem jest natychmiast
 * widoczny dla klienta, który przygotowuje plik według jednej z tych liczb.
 *
 * Uwaga: `PRINT_SAFE_MARGIN_MM` to margines **nadruku** od krawędzi koperty
 * i nie ma nic wspólnego z `INSERT_CLEARANCE_MM`, czyli zapasem dla wkładki
 * wsuwanej do środka. Obie wartości wynoszą dziś 5 mm, ale opisują dwa różne
 * zjawiska i mogą się rozejść niezależnie.
 */
export const PRINT_SAFE_MARGIN_MM = 5;

/** Minimalna rozdzielczość grafiki rastrowej w docelowym rozmiarze nadruku. */
export const PRINT_MIN_DPI = 300;

/** Próg, powyżej którego proponujemy wycenę indywidualną (lead-gen B2B) */
export const BULK_QUOTE_THRESHOLD = 2000;

/* ── Personalizacja / adresowanie (pkt 1.3) ───────────────────────────── */

export interface AddressSheetColumn {
  label: string;
  /** Pole, bez którego walidacja arkusza odrzuca wiersz */
  required: boolean;
  note: string;
  /** Fragmenty nagłówka rozpoznawane przy wczytywaniu arkusza — zapis małymi literami */
  match: string[];
  /** Szerokość kolumny w generowanym pliku XLSX */
  width: number;
  /** Wartość wpisywana z góry w każdym wierszu szablonu */
  prefill?: string;
  /** Wypełnia numer porządkowy wiersza */
  ordinal?: boolean;
}

/**
 * Co ma stanąć na kopercie. Decyduje o kolumnach szablonu i o tym, czego
 * wymaga walidacja — inaczej niż `PersonalizationMethod`, który mówi tylko,
 * **jak** dane do nas trafiają.
 *
 * Rozróżnienie wzięło się z realnego ograniczenia: walidacja wymagała pełnego
 * adresu w każdym wierszu, więc lista samych imion — karty powitalne w hotelu,
 * dyplomy dla rocznika, bony z imieniem obdarowanego — nie przechodziła przez
 * arkusz i lądowała w polu tekstowym, bez sprawdzenia liczby wpisów.
 */
export type PersonalizationScope = 'adres' | 'imiona';

export interface PersonalizationScopeVariant {
  id: PersonalizationScope;
  label: string;
  /** Kiedy sięgnąć po ten wariant */
  hint: string;
  columns: AddressSheetColumn[];
  /**
   * Fragmenty nagłówków, po których poznajemy, że wiersz jest w ogóle
   * wypełniony. Wiersz bez żadnej z tych wartości pomijamy jako pusty.
   */
  identityMatch: string[];
  sheetName: string;
  /** Rdzeń nazwy pobieranego pliku */
  fileStem: string;
}

const ORDINAL_COLUMN: AddressSheetColumn = {
  label: 'Lp.',
  required: false,
  note: 'Numer wiersza — w pobranym szablonie jest już uzupełniony.',
  match: ['lp'],
  width: 6,
  ordinal: true,
};

/**
 * Kolumny szablonu XLSX — jedno źródło prawdy dla generatora szablonu
 * (`/api/personalizacja/szablon`), walidacji wgranego pliku
 * i treści strony `/koperty-personalizowane`.
 *
 * Wcześniej nagłówki arkusza istniały wyłącznie w kodzie API. Opisanie ich
 * na stronie ofertowej wymagałoby przepisania listy ręcznie, a wtedy zmiana
 * szablonu rozjechałaby się z obietnicą na stronie.
 */
export const PERSONALIZATION_SHEET_COLUMNS: AddressSheetColumn[] = [
  ORDINAL_COLUMN,
  {
    label: 'Imię i nazwisko',
    required: false,
    note: 'Wiersz musi mieć wypełnione imię i nazwisko albo nazwę firmy — inaczej traktujemy go jako pusty.',
    match: ['imię', 'imie', 'nazwisko'],
    width: 28,
  },
  {
    label: 'Firma (opcjonalnie)',
    required: false,
    note: 'Nazwa firmy odbiorcy. Drukujemy ją nad wierszem z ulicą.',
    match: ['firma'],
    width: 28,
  },
  {
    label: 'Ulica i numer',
    required: true,
    note: 'Numer lokalu podajemy po ukośniku, np. 41/2.',
    match: ['ulica'],
    width: 32,
  },
  {
    label: 'Kod pocztowy',
    required: true,
    note: 'Zapis w formacie 00-000, spójny w całym arkuszu.',
    match: ['kod'],
    width: 14,
  },
  {
    label: 'Miejscowość',
    required: true,
    note: 'Bez skrótów i bez nazwy województwa.',
    match: ['miejscow', 'miasto'],
    width: 22,
  },
  {
    label: 'Kraj',
    required: false,
    note: 'W szablonie wpisana z góry wartość „Polska".',
    match: ['kraj'],
    width: 12,
    prefill: 'Polska',
  },
];

/**
 * Wariant dla kopert wręczanych do ręki — bez pól adresowych. Sam kod
 * walidacji nie ma tu żadnego pola obowiązkowego poza danymi odbiorcy,
 * więc lista imion przechodzi tak samo jak pełna lista wysyłkowa.
 */
export const PERSONALIZATION_NAME_COLUMNS: AddressSheetColumn[] = [
  ORDINAL_COLUMN,
  {
    label: 'Imię i nazwisko',
    required: true,
    note: 'Treść pierwszego wiersza nadruku. Zapisujemy dokładnie tak, jak ma się wydrukować.',
    match: ['imię', 'imie', 'nazwisko'],
    width: 32,
  },
  {
    label: 'Firma lub stanowisko (opcjonalnie)',
    required: false,
    note: 'Drugi wiersz nadruku — nazwa firmy, dział albo tytuł.',
    match: ['firma', 'stanowisko'],
    width: 32,
  },
  {
    label: 'Dodatkowa linia (opcjonalnie)',
    required: false,
    note: 'Krótka dedykacja albo numer bonu, jeśli ma być inny na każdej kopercie.',
    match: ['dodatkow', 'dedykacj'],
    width: 36,
  },
];

export const PERSONALIZATION_SCOPES: PersonalizationScopeVariant[] = [
  {
    id: 'adres',
    label: 'Pełny adres pocztowy',
    hint: 'Koperty idą pocztą albo kurierem — na każdej drukujemy dane odbiorcy razem z adresem.',
    columns: PERSONALIZATION_SHEET_COLUMNS,
    identityMatch: ['imię', 'imie', 'nazwisko', 'firma', 'ulica'],
    sheetName: 'Adresy',
    fileStem: 'adresy',
  },
  {
    id: 'imiona',
    label: 'Samo imię i nazwisko',
    hint: 'Koperty wręczają Państwo do ręki — na kopercie staje nazwisko, bez adresu.',
    columns: PERSONALIZATION_NAME_COLUMNS,
    identityMatch: ['imię', 'imie', 'nazwisko', 'firma', 'stanowisko'],
    sheetName: 'Odbiorcy',
    fileStem: 'odbiorcy',
  },
];

export const DEFAULT_PERSONALIZATION_SCOPE: PersonalizationScope = 'adres';

export function personalizationScope(id: string | null | undefined): PersonalizationScopeVariant {
  return (
    PERSONALIZATION_SCOPES.find((scope) => scope.id === id) ??
    PERSONALIZATION_SCOPES.find((scope) => scope.id === DEFAULT_PERSONALIZATION_SCOPE)!
  );
}

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
