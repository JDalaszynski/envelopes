/**
 * Treści blogowe. Cel bloga jest wyłącznie SEO — ruch organiczny na frazy
 * związane z korespondencją firmową i kopertami ozdobnymi (pkt 1.7).
 *
 * Wpisy trzymane w kodzie i renderowane statycznie (SSG) — pełny HTML jest
 * dostępny dla Googlebota bez wykonywania JS (pkt 8.3). Jeśli treść ma być
 * zarządzana z Firestore, wystarczy podmienić `getAllPosts`/`getPost`
 * na odczyt serwerowy w `generateStaticParams` + `revalidate`.
 */

import {
  AVAILABLE_FORMATS,
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  INSERT_CLEARANCE_MM,
  PERSONALIZATION_NAME_COLUMNS,
  PERSONALIZATION_REQUIRED_COLUMNS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  PRINT_FILE_EXTENSIONS,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
  PRINT_MIN_DPI,
  PRINT_SAFE_MARGIN_MM,
  STANDARD_INSERTS,
  UPCOMING_FORMATS,
  fitsInFormat,
  formatMm,
  maxInsertSize,
} from './catalog';
import type {
  EnvelopeFormat,
  FormatId,
  PersonalizationScope,
  StandardInsert,
} from './catalog';
import {
  DEFAULT_PRICING,
  DELIVERY_COST,
  calculatePrice,
  formatPrice,
  plural,
  round2,
} from './pricing';

export const BLOG_CATEGORIES = ['Poradniki', 'Inspiracje', 'Realizacje', 'Aktualności'] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/**
 * Tabela faktów w treści wpisu (pkt 6.4 briefu SEO — tabela specyfikacji jest
 * najczęściej ekstrahowaną strukturą przez modele generatywne). Pierwsza
 * kolumna renderuje się jako nagłówek wiersza, więc `head[0]` opisuje oś
 * zestawienia, a nie dane.
 */
export interface BlogTable {
  /** Podpis dla czytnika ekranu — mówi, co tabela zestawia */
  caption: string;
  head: string[];
  rows: string[][];
}

export interface BlogSection {
  id: string;
  heading: string;
  paragraphs: string[];
  table?: BlogTable;
  list?: string[];
}

/**
 * Kontekstowe wejście do konfiguratora z preselekcją (pkt 7 briefu SEO —
 * ciągłość intencji). Bez tego pola wpis prowadzi do konfiguratora w stanie
 * początkowym, czyli gubi to, po co czytelnik przyszedł.
 */
export interface BlogCta {
  /** Treść przycisku — odpowiada tematowi wpisu, nie ogólne „Zamów" */
  label: string;
  format?: FormatId;
  color?: string;
  print?: boolean;
  personalization?: boolean;
  /**
   * Zakres personalizacji, z którym otwiera się konfigurator — pełny adres
   * albo samo imię i nazwisko. Bez tego pola wpis o liście imiennej
   * prowadziłby do wariantu adresowego i kazał czytelnikowi cofnąć wybór
   * (pkt 7 briefu SEO — ciągłość intencji).
   */
  personalizationScope?: PersonalizationScope;
}

export interface BlogPost {
  slug: string;
  title: string;
  lead: string;
  category: BlogCategory;
  date: string;
  updated?: string;
  readingMinutes: number;
  /** Kolor placeholdera nagłówkowego */
  colorId: string;
  format: string;
  /**
   * Kadr aranżacyjny z `public/images/zastosowania/` jako zdjęcie główne wpisu.
   */
  showcaseFile?: string;
  /**
   * Wariant zdjęcia nagłówkowego. Wpis o nadruku ilustrujemy zdjęciem koperty
   * z nadrukiem, a nie gładkiej — zdjęcia są w `public/images/prints/`
   * i mają własny tekst alternatywny (`buildImageAlt`).
   */
  imageVariant?: 'nadruk' | 'personalizacja';
  /**
   * Nazwa pliku z `public/images/og/` (bez rozszerzenia) — obraz wyróżniający
   * wpisu w wynikach wyszukiwania i w podglądzie odnośnika. Bez tego pola
   * wpis dziedziczy zbiorczy kadr listy blogowej, co jest poprawne, ale nie
   * mówi nic o temacie wpisu.
   */
  ogImageSlug?: string;
  /** Opis kadru OG — trafia do `openGraph.images[].alt` */
  ogImageAlt?: string;
  keywords: string[];
  intro: string;
  sections: BlogSection[];
  /** Kontekstowe CTA do konfiguratora */
  cta: string;
  /** Preselekcja konfiguratora pod tematem wpisu */
  ctaConfigure?: BlogCta;
  /**
   * Strona ofertowa (filar klastra), do której wpis linkuje **w górę**.
   * Anchor jest frazą docelową filara — treść wspierająca przekazuje mu
   * autorytet, nigdy odwrotnie (pkt 5.4 briefu SEO).
   */
  pillar?: { href: string; anchor: string };
}

/* ── Wartości wyliczane dla wpisu o przygotowaniu plików ───────────────── */

const PRINT_FILE_MAX_MB = Math.round(PRINT_FILE_MAX_BYTES / (1024 * 1024));

/**
 * Podział przyjmowanych rozszerzeń na wektorowe i rastrowe. Lista źródłowa
 * jest jedna — `PRINT_FILE_EXTENSIONS` w `catalog.ts` — więc dopisanie
 * formatu do uploadu przepisuje też treść poradnika, a nie tylko walidację.
 * `jpeg` pomijamy, bo dla czytelnika jest tym samym formatem co `jpg`.
 */
const VECTOR_PRINT_EXTENSIONS = ['pdf', 'ai', 'eps', 'cdr', 'svg'];

function extensionsLabel(list: string[]): string {
  return list.map((ext) => ext.toUpperCase()).join(', ');
}

const VECTOR_LABEL = extensionsLabel(
  PRINT_FILE_EXTENSIONS.filter((ext) => VECTOR_PRINT_EXTENSIONS.includes(ext))
);
const RASTER_LABEL = extensionsLabel(
  PRINT_FILE_EXTENSIONS.filter((ext) => !VECTOR_PRINT_EXTENSIONS.includes(ext) && ext !== 'jpeg')
);
const PRINT_FILE_FORMAT_COUNT = PRINT_FILE_EXTENSIONS.filter((ext) => ext !== 'jpeg').length;

/** Przelicznik rozdzielczości — liczony, nie wpisany z pamięci. */
const MM_PER_INCH = 25.4;
const mmToPx = (mm: number) => Math.round((mm / MM_PER_INCH) * PRINT_MIN_DPI);
const pxToMm = (px: number) => Math.round((px / PRINT_MIN_DPI) * MM_PER_INCH);

/** Typowa szerokość logo na kopercie DL — przykład w treści. */
const LOGO_EXAMPLE_MM = 60;
const LOGO_EXAMPLE_PX = mmToPx(LOGO_EXAMPLE_MM);
const SAMPLE_FILE_PX = 1200;
const SAMPLE_FILE_MM = pxToMm(SAMPLE_FILE_PX);
const WEB_LOGO_MIN_PX = 200;
const WEB_LOGO_MAX_PX = 400;

/* ── Wartości wyliczane dla wpisu o adresowaniu z arkusza ──────────────── */

/**
 * Pola wymagane w szablonie wysyłkowym — czytane z tej samej definicji,
 * z której powstaje plik XLSX i tabele na `/koperty-personalizowane`.
 * Wpis opisuje **skutek** reguły dla wybierającego tryb, a nie specyfikację
 * kolumn, która należy do filara.
 */
const REQUIRED_ADDRESS_FIELDS = PERSONALIZATION_REQUIRED_COLUMNS.map((column) =>
  column.label.toLowerCase()
).join(', ');
/** Przykład kolumny, której nazwy nie wolno zmieniać — „Ulica i numer". */
const FIRST_REQUIRED_COLUMN = PERSONALIZATION_REQUIRED_COLUMNS[0].label;

/* ── Wartości wyliczane dla wpisu o liście imion i nazwisk (poz. 15) ───── */

/**
 * Nagłówki szablonu imiennego czytane z `PERSONALIZATION_NAME_COLUMNS` —
 * z tej samej definicji, z której generator buduje plik XLSX. Wpis mówi
 * klientowi, co ma wpisać w danej kolumnie, więc przemianowanie kolumny
 * w katalogu przepisuje też treść poradnika. Szukamy po `match`, a nie po
 * indeksie tablicy, żeby dołożenie kolumny niczego nie przestawiło.
 */
const NAME_COLUMN_LABEL =
  PERSONALIZATION_NAME_COLUMNS.find((column) => column.match.includes('nazwisko'))?.label ??
  'Imię i nazwisko';
/** Druga linia nadruku w wariancie imiennym — firma, dział albo stanowisko. */
const NAME_SECOND_LINE_LABEL =
  PERSONALIZATION_NAME_COLUMNS.find((column) => column.match.includes('stanowisko'))?.label ??
  'Firma lub stanowisko (opcjonalnie)';

/* ── Wartości wyliczane dla wpisu o koszcie zamówienia z nadrukiem ─────── */

/**
 * Wpis z content-plan.md poz. 9 jest w całości cenowy, więc **żadna kwota nie
 * jest w nim wpisana ręcznie** — wszystkie powstają z `DEFAULT_PRICING` przez
 * `calculatePrice`. Zmiana cennika przepisuje lead, akapity, tabelę kosztu
 * zamówienia i listę kontrolną razem z konfiguratorem.
 */
const PRINT_ORDER_BASE = {
  format: 'DL' as FormatId,
  color: '',
  print: true,
  printFiles: [],
  personalization: false,
  shippingSpeed: 'standard' as const,
};

/** Rachunek dla jednej koperty DL z nadrukiem — stawka jednostkowa. */
const PRINTED_UNIT = calculatePrice({ ...PRINT_ORDER_BASE, quantity: 1 });

/**
 * Nakłady w tabeli kosztu zamówienia. Świadomie inne niż na filarze
 * (`/koperty-z-nadrukiem` pokazuje 10 / 100 / 500 / 1 000): tam osią jest
 * wartość zamówienia, tutaj — koszt jednej wysłanej koperty, więc siatka jest
 * gęstsza w dolnym zakresie, gdzie dostawa faktycznie zmienia wynik.
 * Ostatni wiersz to próg wyceny indywidualnej.
 */
const PRINT_ORDER_QUANTITIES = [
  DEFAULT_PRICING.moqWithPrint,
  25,
  50,
  100,
  250,
  500,
  1000,
  BULK_QUOTE_THRESHOLD,
];

interface PrintOrderCost {
  quantity: number;
  /** Same koperty, bez dostawy */
  gross: number;
  net: number;
  /** Zamówienie razem z jedną przesyłką kurierską */
  withDelivery: number;
  /** Koszt jednej gotowej koperty — kwota do pozycji budżetowej */
  perUnit: number;
  /** Ile z tej kwoty przypada na dostawę */
  deliveryPerUnit: number;
}

function printOrderCost(quantity: number): PrintOrderCost {
  const price = calculatePrice({ ...PRINT_ORDER_BASE, quantity });
  const withDelivery = round2(price.gross + DELIVERY_COST);
  return {
    quantity,
    gross: price.gross,
    net: price.net,
    withDelivery,
    perUnit: round2(withDelivery / quantity),
    deliveryPerUnit: round2(DELIVERY_COST / quantity),
  };
}

const PRINT_ORDER_COSTS = PRINT_ORDER_QUANTITIES.map(printOrderCost);

/** Nakład referencyjny wpisu — ten sam, który stoi w tytule i w leadzie. */
const REFERENCE_ORDER = printOrderCost(100);
const SMALLEST_ORDER = PRINT_ORDER_COSTS[0];
const MID_ORDER = printOrderCost(500);
const VAT_PERCENT = Math.round(DEFAULT_PRICING.vatRate * 100);
const DELIVERY_NET = round2(DELIVERY_COST / (1 + DEFAULT_PRICING.vatRate));
const BULK_QUOTE_LABEL = BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL');

/* ── Wartości wyliczane dla wpisu o doborze formatu do wkładki ─────────── */

/**
 * Wpis z content-plan.md poz. 10 robi **odwrotne mapowanie**: filar
 * `/koperty-dl` odpowiada „czy ta wkładka mieści się w kopercie DL", ten wpis —
 * „który format przyjmie moją wkładkę". Wszystkie werdykty liczy
 * `fitsInFormat()` z wymiarów katalogowych, więc uruchomienie formatów C6 i K4
 * przepisze tabelę razem z konfiguratorem, bez dotykania treści.
 */
const DL_FORMAT = FORMAT_MAP.DL;
const DL_MAX_INSERT = maxInsertSize(DL_FORMAT);

/**
 * Wkładka z `STANDARD_INSERTS` po fragmencie etykiety. Rzucamy wyjątkiem
 * zamiast cichego `undefined`: wpis opiera na tych pozycjach całe akapity,
 * więc usunięcie wkładki z katalogu ma zatrzymać budowanie, a nie wypuścić
 * na stronę zdanie z „undefined mm".
 */
function insertByLabel(fragment: string): StandardInsert {
  const found = STANDARD_INSERTS.find((insert) =>
    insert.label.toLowerCase().includes(fragment.toLowerCase())
  );
  if (!found) {
    throw new Error(
      `STANDARD_INSERTS nie zawiera wkładki „${fragment}" — wpis o doborze formatu opiera na niej treść`
    );
  }
  return found;
}

const A4_THIRDS = insertByLabel('A4 złożona na trzy');
const A4_HALF = insertByLabel('A4 złożona na pół');
const A4_FLAT = insertByLabel('Dyplom A4');
const A6_SHEET = insertByLabel('A5 złożona na pół');
const SQUARE_INVITE = insertByLabel('Zaproszenie kwadratowe');
const BANKNOTE = insertByLabel('Banknot');
const BUSINESS_CARD = insertByLabel('Wizytówka');

/** Wymiary wkładki zapisane po polsku — jedna funkcja dla tabeli i dla prozy. */
function insertMm(insert: { width: number; height: number }): string {
  return `${formatMm(insert.width)} × ${formatMm(insert.height)} mm`;
}

/** O ile krótszy bok wkładki przekracza wnętrze koperty DL. */
const A4_HALF_OVERHANG = Math.round(Math.min(A4_HALF.width, A4_HALF.height) - DL_MAX_INSERT.short);

/** Zapas, jaki zostawia kartka A6 — dolna granica dopasowania w tabelach. */
const A6_CLEARANCE = fitsInFormat(A6_SHEET, DL_FORMAT).clearanceShort;

interface InsertVerdict {
  insert: StandardInsert;
  /** Najmniejszy format, który wkładkę przyjmie — najpierw sprzedawany */
  format?: EnvelopeFormat;
  available: boolean;
}

/**
 * Format dla wkładki. Kolejność szukania jest sprzedażowa, nie geometryczna:
 * najpierw formaty, które da się dziś kupić, dopiero potem zapowiedziane.
 * Odwrotna kolejność podpowiadałaby kopertę C6 do wizytówki — mniejszą, ale
 * ze statusem „Dostępne wkrótce", czyli obietnicę bez pokrycia (brief pkt 4.2).
 */
function verdictForInsert(insert: StandardInsert): InsertVerdict {
  const sellable = AVAILABLE_FORMATS.find((format) => fitsInFormat(insert, format).fits);
  if (sellable) return { insert, format: sellable, available: true };
  const upcoming = UPCOMING_FORMATS.find((format) => fitsInFormat(insert, format).fits);
  return { insert, format: upcoming, available: false };
}

const INSERT_VERDICTS = STANDARD_INSERTS.map(verdictForInsert);
const SELLABLE_INSERT_COUNT = INSERT_VERDICTS.filter((verdict) => verdict.available).length;

/** Stosunek dłuższego boku do krótszego — „2" dla DL, „1" dla K4. */
function sideRatio(format: EnvelopeFormat): string {
  const ratio = Math.max(format.width, format.height) / Math.min(format.width, format.height);
  return ratio
    .toFixed(2)
    .replace(/[.,]?0+$/, '')
    .replace('.', ',');
}

/**
 * Kształt wkładki, pod który zrobiony jest każdy format. To jedyna kolumna
 * tabeli, której nie da się policzyć z katalogu — wymiary, status i proporcje
 * pochodzą z `FORMATS`.
 */
const FORMAT_SHAPES: Record<FormatId, string> = {
  DL: 'Podłużna — arkusz złożony na trzy, voucher, bilet, banknot',
  C6: `Kompaktowa — kartka A6 ${insertMm(A6_SHEET)}, zdjęcie, klasyczne zaproszenie`,
  K4: `Kwadratowa i szeroka — zaproszenie ${insertMm(SQUARE_INVITE)}`,
};

/** Formaty zapowiedziane wypisane zdaniem: „C6 114 × 162 mm i K4 155 × 155 mm". */
const UPCOMING_FORMATS_LABEL = UPCOMING_FORMATS.map(
  (format) => `${format.id} ${format.dimensions}`
).join(' i ');

/* ── Wartości wyliczane dla wpisu o liczbie kartek i składaniu A4 ─────── */

const A4_SHEET_MM = { width: 210, height: 297 };
const A4_FOLDED_MM = { width: 210, height: Math.round(297 / 3) }; // 210 × 99 mm
const DL_LONG_CLEARANCE_MM = Math.max(DL_FORMAT.width, DL_FORMAT.height) - A4_FOLDED_MM.width; // 10 mm (220 - 210)
const DL_SHORT_CLEARANCE_MM = Math.min(DL_FORMAT.width, DL_FORMAT.height) - A4_FOLDED_MM.height; // 11 mm (110 - 99)

/* ── Wartości wyliczane dla wpisu o realizacji ekspresowej (poz. 16) ──── */

/**
 * Ile dni roboczych kupuje dopłata ekspresowa — różnica dwóch terminów
 * z cennika, a nie liczba wpisana z pamięci. Zmiana `leadDaysStandard`
 * albo `leadDaysExpress` przepisuje treść wpisu razem z koszykiem.
 */
const EXPRESS_SAVED_DAYS = DEFAULT_PRICING.leadDaysStandard - DEFAULT_PRICING.leadDaysExpress;
const EXPRESS_SAVED_DAYS_LABEL = `${EXPRESS_SAVED_DAYS} ${plural(
  EXPRESS_SAVED_DAYS,
  'dzień roboczy',
  'dni robocze',
  'dni roboczych'
)}`;

/**
 * Dopłata ekspresowa dla trzech nakładów. Trzecia kolumna tabeli przelicza
 * ją na jeden zyskany dzień roboczy — to jedyna postać tej kwoty, która
 * odpowiada na pytanie „czy się zwraca", a nie „ile kosztuje".
 */
const EXPRESS_SURCHARGE_ROWS = [DEFAULT_PRICING.moqWithPrint, 100, 500].map((quantity) => ({
  quantity,
  total: round2(DEFAULT_PRICING.express * quantity),
  perDay: round2((DEFAULT_PRICING.express * quantity) / EXPRESS_SAVED_DAYS),
}));

const POSTS: BlogPost[] = [
  {
    /* content-plan.md poz. 11 — treść wspierająca filar K4 (`/koperty-dl`),
       cel GEO. Fraza główna: `kartka do koperty dl`.

       Rozgraniczenie z filarem i poz. 10. Filar `/koperty-dl` rozstrzyga
       dopasowanie w dwóch wymiarach (tabela wkładek w mm), poz. 10 mapuje
       wkładkę na format. Ten wpis odpowiada na trzeci wymiar: grubość wkładu,
       pojemność w arkuszach per gramatura, dwa sposoby składania A4 (litera C
       i litera Z) oraz przyczyny blokowania się pliku o poprawnych wymiarach
       (sprężynowanie grzbietu, brak bigowania, zszywki).

       Świadomie nieobecne: cennik i koszty nadruku (poz. 9 i F1), nietypowe
       wkładki (poz. 10), argumenty o braku okienka (poz. 13). Wpis nie ma
       własnego `FAQPage` — dane strukturalne pytań zostają na filarze. */
    slug: 'ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc',
    title: 'Ile kartek mieści koperta DL i jak je złożyć',
    lead: 'Dowiedz się jak złożyć kartkę a4 do koperty dl aby zachować elegancję korespondencji. Zobacz ile kartek do koperty dl mieści się bezpiecznie i poznaj sprawdzone metody pakowania dokumentów biurowych.',
    category: 'Poradniki',
    date: '2026-08-18',
    readingMinutes: 6,
    colorId: 'granatowy',
    format: 'DL',
    showcaseFile: 'granatowa-koperta-dl-nadruk-logo-kancelarii',
    ogImageSlug: 'blog-ile-kartek-koperta-dl',
    ogImageAlt:
      'Dwie granatowe koperty DL na drewnianym stole, z widoczną klapką i polem na wkład',
    keywords: [
      'kartka do koperty dl',
      'ile kartek do koperty dl',
      'jak złożyć kartkę a4 do koperty dl',
      'składanie a4 do koperty dl',
      'grubość wkładu koperty dl',
    ],
    intro: `Standardowa koperta ozdobna DL ${DL_FORMAT.dimensions} przyjmuje wkładki o wymiarach do ${DL_MAX_INSERT.short} × ${DL_MAX_INSERT.long} mm, ale o dopasowaniu decyduje również trzeci wymiar: grubość wkładu. Jeden arkusz A4 złożony na trzy ma grubość ułamka milimetra i wchodzi swobodnie. Plik kilku arkuszy tworzy na krawędzi zgięcia sprężynujący grzbiet, który wypycha ścianki koperty i utrudnia domknięcie klapki. Poniżej zestawiamy dopuszczalną liczbę kartek dla różnych gramatur papieru, instrukcję dwóch sposobów składania oraz przyczyny, dla których arkusze o poprawnych wymiarach blokują się przy wkładaniu.`,
    sections: [
      {
        id: 'pojemnosc-a-gramatura',
        heading: 'Ile kartek A4 mieści koperta DL w zależności od gramatury',
        paragraphs: [
          'Standardowa koperta DL mieści bezpiecznie do 5 arkuszy papieru biurowego 80 g/m² złożonych na trzy. Taki plik tworzy 15 warstw papieru o łącznej grubości około 1,5 mm i wsuwa się do środka bez oporu. Przy 6–8 arkuszach wkładka nadal wchodzi, ale wymaga mocniejszego wygładzenia grzbietu i dociśnięcia paska klejowego przy zamykaniu. Powyżej 8 arkuszy koperta ulega wybrzuszeniu, a klapka napręża się i grozi rozszczelnieniem w transporcie.',
          'Wraz ze wzrostem gramatury papieru dopuszczalna liczba kartek maleje. Papier firmowy 90–100 g/m² pozwala na komfortowe zamknięcie 3–4 arkuszy. Papiery kredowe i ozdobne 120–135 g/m² mieszczą 1–3 arkusze. W przypadku kartonów i zaproszeń o gramaturze 200–250 g/m² zaleca się pojedynczy arkusz (np. bigowany folder), a dla sztywnych kart 300–350 g/m² — wyłącznie jedną płaską kartę.',
          'Tabela poniżej podaje orientacyjną grubość arkusza, bezpieczną liczbę kartek oraz zachowanie koperty przy różnych gramaturach papieru.',
        ],
        table: {
          caption:
            'Dopuszczalna liczba arkuszy A4 złożonych na trzy w kopercie DL dla wybranych gramatur',
          head: [
            'Gramatura papieru',
            'Grubość 1 arkusza',
            'Bezpieczna liczba arkuszy A4',
            'Liczba warstw po złożeniu',
            'Uwagi użytkowe',
          ],
          rows: [
            [
              '80 g/m² (standard biurowy)',
              '~0,10 mm',
              '1–5 arkuszy',
              '3–15 warstw',
              'Optymalna pojemność; 6–8 arkuszy to limit maksymalny',
            ],
            [
              '90–100 g/m² (papier firmowy / preprint)',
              '~0,12 mm',
              '1–4 arkusze',
              '3–12 warstw',
              'Elegancki układ korespondencji zarządczej i umów',
            ],
            [
              '120–135 g/m² (ulotki / kreda)',
              '~0,15 mm',
              '1–3 arkusze',
              '3–9 warstw',
              'Wymaga mocnego docisku zgięcia przy 3 arkuszach',
            ],
            [
              '200–250 g/m² (zaproszenia / vouchery)',
              '~0,25–0,30 mm',
              '1 arkusz',
              '1–3 warstwy (przy bigowaniu)',
              'Składanie wyłącznie z fabrycznym bigowaniem',
            ],
            [
              '300–350 g/m² (karton ozdobny / karta)',
              '~0,35–0,45 mm',
              '1 wkładka płaska',
              '1 warstwa',
              'Bez składania — pojedyncza karta 99 × 210 mm',
            ],
          ],
        },
      },
      {
        id: 'grubosc-wkladu',
        heading: 'Dlaczego koperta płaska ma limit 3–4 mm grubości',
        paragraphs: [
          'Koperty ozdobne DL w ofercie Envelopes — o gramaturach 115 g/m², 120 g/m² oraz 140 g/m² — to koperty płaskie. Przednia i tylna ścianka są sklejone bezpośrednio na bocznych krawędziach, bez poszerzanego boku ani dna harmonijkowego.',
          'Gdy do środka trafia wkład o grubości powyżej 3 mm, przednia ścianka wybrzusza się, przyciągając krawędzie boczne do środka. W efekcie użytkowa szerokość i wysokość wnętrza koperty ulegają pozornemu skróceniu o około 2–4 mm. Jeśli wkładka miała maksymalny wymiar graniczny, przy grubym pliku zaczyna napierać na boczne zgrzewy koperty.',
          'Dlatego przy wielostronicowych dokumentach (np. powyżej 8 kartek A4) bezpieczniejszym rozwiązaniem jest rozbicie przesyłki na dwie koperty lub zastosowanie większego formatu.',
        ],
      },
      {
        id: 'skladanie-litera-c',
        heading: 'Jak złożyć arkusz A4 do koperty DL: składanie listowe (w literę C)',
        paragraphs: [
          'Składanie w literę C (tzw. standardowe składanie listowe lub kopertowe) to najpopularniejsza i najbardziej elegancka metoda przygotowania dokumentu A4 do wysyłki.',
          'Procedura składania w trzech krokach:',
        ],
        list: [
          'Krok 1: Kładziemy arkusz A4 (210 × 297 mm) tekstem do góry, w orientacji pionowej.',
          'Krok 2: Dolną jedną trzecią arkusza (dokładnie 99 mm od dołu) zaginamy do góry, zakrywając środkową część pisma.',
          'Krok 3: Górną jedną trzecią arkusza (99 mm od góry) zaginamy w dół na wierzch, przykrywając dolne zagięcie.',
        ],
      },
      {
        id: 'zalety-litery-c',
        heading: 'Dlaczego składanie w literę C jest standardem w biurze',
        paragraphs: [
          `Złożony w ten sposób arkusz ma wymiary ${A4_FOLDED_MM.height} × ${A4_FOLDED_MM.width} mm. W kopercie DL ${DL_FORMAT.dimensions} pozostawia to ${DL_SHORT_CLEARANCE_MM} mm zapasu na wysokości i ${DL_LONG_CLEARANCE_MM} mm zapasu na szerokości — wkładka wsuwa się gładko i leży stabilnie.`,
          'Największą zaletą składania w literę C jest ergonomia otwarcia: po rozcięciu koperty i wyjęciu arkusza adresat widzi od razu nagłówek dokumentu, logo firmy oraz dane nadawcy, podczas gdy treść właściwa pisma jest chroniona wewnątrz zagięcia.',
        ],
      },
      {
        id: 'skladanie-litera-z',
        heading: 'Składanie harmonijkowe (w literę Z) — kiedy je stosować',
        paragraphs: [
          'Składanie w literę Z (harmonijkowe, tzw. zig-zag) polega na zagięciu dolnej jednej trzeciej arkusza do tyłu, a górnej jednej trzeciej do przodu. Arkusz oglądany z boku tworzy kształt litery Z.',
          'To układ stosowany przede wszystkim przy ulotkach potrójnych, voucherach rozkładanych, programach konferencji i pismach z grafiką. Dokument rozkłada się jednym pociągnięciem, bez konieczności odchylania dwóch osobnych skrzydełek.',
          'Tabela poniżej zestawia różnice między oboma typami zagięć.',
        ],
        table: {
          caption: 'Porównanie składania arkusza A4 w literę C oraz w literę Z',
          head: [
            'Cecha',
            'Składanie listowe (litera C)',
            'Składanie harmonijkowe (litera Z)',
          ],
          rows: [
            [
              'Kierunek zagięć',
              'Dolna 1/3 do góry, górna 1/3 w dół (oba do wewnątrz)',
              'Dolna 1/3 do tyłu, górna 1/3 do przodu (naprzemiennie)',
            ],
            [
              'Wymiar po złożeniu',
              '99 × 210 mm',
              '99 × 210 mm',
            ],
            [
              'Widok po wyjęciu',
              'Nagłówek pisma i dane nadawcy',
              'Pierwsza strona / okładka wkładki',
            ],
            [
              'Ochrona treści poufnych',
              'Wysoka — treść zamknięta wewnątrz',
              'Umiarkowana — jedna strona pozostaje na zewnątrz',
            ],
            [
              'Zastosowanie',
              'Pisma urzędowe, umowy, faktury, oficjalne listy',
              'Vouchery, ulotki informacyjne, programy eventów',
            ],
          ],
        },
      },
      {
        id: 'dlaczego-sie-nie-miesci',
        heading: 'Dlaczego plik kartek nie mieści się mimo poprawnych wymiarów',
        paragraphs: [
          'Zdarza się, że wkładka ma przepisowy wymiar 99 × 210 mm, a mimo to stawia opór przy wsuwaniu do koperty. Odpowiadają za to trzy zjawiska fizyczne:',
          '1. Sprężynowanie grzbietu (efekt klina). Gdy zginamy kilka kartek naraz, arkusze wewnętrzne są wypychane przez promień zgięcia. Grzbiet zyskuje zaokrągloną, sprężystą krawędź o grubości większej niż suma grubości papieru. Rozwiązaniem jest mocne dociśnięcie linii zagięcia krawędzią dłoni lub kostką introligatorską.',
          '2. Pękanie papieru bez bigowania. Papier o gramaturze powyżej 150 g/m² zaginany ręcznie łamie się na włóknach celulozy, tworząc poszarpaną, pogrubioną krawędź. Grube wkładki wymagają wcześniejszego maszynowego zrobienia rowka (bigi).',
          '3. Zszywki i spinacze. Metalowa zszywka w rogu dokumentu tworzy punktowe zgrubienie o grubości do 2 mm. Podczas wsuwania do wąskiej koperty DL może zahaczyć o krawędź lub rozciąć papier koperty od środka. Zszywkę należy umieszczać z zapasem minimum 10 mm od brzegu.',
        ],
      },
      {
        id: 'pakowanie-reczne',
        heading: 'Pakowanie ręczne a automatyczne kopertowanie',
        paragraphs: [
          'Wszystkie koperty ozdobne Envelopes wykonane są z papieru barwionego w masie o gramaturze 115–140 g/m².',
          'Koperty te są zoptymalizowane pod pakowanie ręczne: sztywny arkusz trzyma kształt przy wkładaniu wkładki i nadaje przesyłce prestiżowy wygląd. Nie są to koperty do maszynowych automatów pakujących (kopertówek), które wymagają cienkiego papieru 75–80 g/m².',
          'Do korespondencji firmowej, pism zarządczych, voucherów i zaproszeń pakowanie ręczne gwarantuje nienaganny stan każdego egzemplarza.',
        ],
      },
      {
        id: 'lista-kontrolna',
        heading: 'Lista kontrolna przed pakowaniem korespondencji do koperty DL',
        paragraphs: [
          'Siedem punktów wystarczy, aby korespondencja weszła do koperty gładko i bezpiecznie dotarła do odbiorcy:',
        ],
        list: [
          'Liczba arkuszy: do 5 kartek A4 80 g/m² w jednym pliku',
          'Wymiary po złożeniu: dokładnie 99 × 210 mm przy złożeniu A4 na trzy',
          'Zapas bezpieczeństwa: zachowane minimum 10 mm luzu na szerokości i 11 mm na wysokości koperty',
          'Sposób składania: litera C dla pism poufnych i umów, litera Z dla materiałów informacyjnych i voucherów',
          'Wygładzenie grzbietu: mocne dociśnięcie linii zgięcia przed wsunięciem do koperty',
          'Zszywki: zagięte płasko i odsunięte od zewnętrznych krawędzi wkładu',
          'Zamknięcie: równomierny docisk klapki na całej długości po włożeniu wkładki',
        ],
      },
    ],
    cta: 'Koperta DL mieści do 5 arkuszy A4 złożonych na trzy — konfigurator otworzy się z tym formatem.',
    ctaConfigure: { label: 'Wybierz kolor koperty DL', format: 'DL' },
    pillar: { href: '/koperty-dl', anchor: 'wymiary koperty DL' },
  },
  {
    /* content-plan.md poz. 10 — treść wspierająca filar K4 (`/koperty-dl`),
       cel GEO. Fraza główna: `format do koperty dl`.

       Rozgraniczenie z filarem. `/koperty-dl` odpowiada na pytanie o **wymiary
       koperty**: podaje tabelę formatów i tabelę dopasowań dziesięciu wkładek
       w milimetrach. Ten wpis odwraca kierunek pytania — wychodzi od tego, co
       klient trzyma w ręku, i prowadzi do formatu. Stąd inna oś tabeli
       (wkładka → format, nie wkładka → mieści się w DL) i cała metoda doboru,
       której filar nie opisuje: pomiar po złożeniu, zapas, kształt, granica.

       Świadomie nieobecne: pytanie „Czym różni się koperta DL od C6" (należy
       do `DL_FAQ_ITEMS` na filarze i **nie może** tu wrócić), grubość wkładu
       i sposób równego składania A4 (poz. 11), decyzja o braku okienka
       (poz. 13), dobór koperty do zaproszeń (poz. 41). Zero kwot, zero MOQ,
       zero terminów — należą do `/`, F1 i poz. 9. Wpis nie ma własnego
       `FAQPage`: dane strukturalne pytań zostają na filarze (zasada z poz. 7).

       Żaden odnośnik i żadne CTA nie prowadzi do formatów C6 i K4 — mają
       w katalogu `disabled: true` (brief pkt 4.2). */
    slug: 'jaki-format-koperty-wybrac-do-wkladki',
    title: 'Jaki format koperty wybrać do wkładki',
    /* Lead zasila `description`. Metoda, nie parametr — parametry stoją
       w tabeli niżej i w specyfikacji na filarze. */
    lead: 'Sprawdź jaki format koperty wybrać dla różnych dokumentów. Poznaj zasady określające jaka koperta do wkładki będzie optymalna i uniknij pomyłek przy zamówieniach. Przejdź do naszego przewodnika po formatach.',
    category: 'Poradniki',
    date: '2026-08-17',
    readingMinutes: 6,
    colorId: 'taupe',
    format: 'DL',
    showcaseFile: 'taupe-koperta-dl-nadruk-logo-salonu-spa',
    ogImageSlug: 'blog-format-do-wkladki',
    ogImageAlt:
      'Koperta ozdobna DL w kolorze Szarobrązowy od strony klapki, za nią druga koperta tego samego formatu',
    keywords: [
      'format do koperty dl',
      'jaki format koperty',
      'jaka koperta do wkładki',
      'dobór formatu koperty',
    ],
    intro: `Format koperty dobiera się od wkładki, a nie odwrotnie. Mierzą Państwo wkład w tej postaci, w jakiej trafi do środka — już złożony — dokładają ${INSERT_CLEARANCE_MM} mm zapasu do każdego z dwóch wymiarów i wybierają najmniejszą kopertę, która obu tym wymiarom sprosta. Koperta DL ${DL_FORMAT.dimensions} przyjmuje wkładki do ${DL_MAX_INSERT.short} × ${DL_MAX_INSERT.long} mm, czyli ${SELLABLE_INSERT_COUNT} z ${STANDARD_INSERTS.length} wkładek, o które pytają Państwo najczęściej. Poniżej rozpisujemy tę metodę i mówimy, co zrobić z wkładką, która się w tym formacie nie mieści.`,
    sections: [
      {
        id: 'od-wkladki-do-formatu',
        heading: 'Jak dobrać format koperty do wkładki',
        paragraphs: [
          `Wybór zaczyna się od zmierzenia wkładki, nie od przejrzenia katalogu kopert. Do zmierzonych wymiarów dokładają Państwo ${INSERT_CLEARANCE_MM} mm zapasu w każdym kierunku i szukają koperty, która ten powiększony prostokąt przyjmie. Jeśli pasuje więcej niż jedna, wygrywa mniejsza — w niej wkładka mniej się przesuwa.`,
          `Wymiary porównuje się bok w bok: krótszy bok wkładki z krótszym bokiem koperty, dłuższy z dłuższym. Kolejność zapisu nie ma znaczenia, bo wkładkę wsuwa się w tę stronę, w którą wchodzi. Banknot opisywany jako ${insertMm(BANKNOTE)} leży w kopercie DL płasko, bez składania, mimo że jego „szerokość" jest większa od szerokości koperty.`,
          `Tabela poniżej przechodzi przez ${STANDARD_INSERTS.length} wkładek, o które pytają Państwo najczęściej, i przy każdej podaje format, który ją przyjmie. Trzecia kolumna odpowiada na pytanie o geometrię, czwarta — na pytanie, co z tego wynika dla zamówienia składanego dzisiaj.`,
        ],
        table: {
          caption:
            'Standardowe wkładki i format koperty, który je przyjmuje przy zachowanym zapasie',
          head: ['Wkładka', 'Wymiary', 'Format, który ją przyjmie', 'Co to znaczy dziś'],
          rows: INSERT_VERDICTS.map(({ insert, format, available }) => [
            insert.label,
            insertMm(insert),
            format ? `Koperta ${format.id} ${format.dimensions}` : 'Żaden format z katalogu',
            available
              ? 'Do zamówienia od ręki'
              : format
                ? 'Format ma status „Dostępne wkrótce"'
                : 'Trzeba złożyć wkładkę inaczej albo sięgnąć po kopertę spoza tej oferty',
          ]),
        },
      },
      {
        id: 'zapas',
        heading: 'Skąd bierze się zapas między wkładką a kopertą',
        paragraphs: [
          `Zapas ${INSERT_CLEARANCE_MM} mm w każdym wymiarze jest po to, żeby wkładkę dało się wsunąć jednym ruchem i wyjąć bez szarpania. Wkładka dopasowana co do milimetra teoretycznie wchodzi, w praktyce zahacza rogiem o brzeg i zagina się przy wkładaniu.`,
          'Przy jednej kopercie to drobiazg. Przy serii kilkuset ten sam luz decyduje o tym, ile trwa pakowanie i ile sztuk trzeba odłożyć, bo wkładka poszła krzywo albo róg się załamał.',
          `Granicę traktujemy dosłownie. Kartka A6 ${insertMm(A6_SHEET)} zostawia w kopercie DL dokładnie ${formatMm(A6_CLEARANCE)} mm na krótszym boku i to jest dolna granica, przy której uznajemy wkładkę za dopasowaną. Wszystko poniżej opisujemy jako niemieszczące się, nawet jeśli fizycznie da się to wcisnąć.`,
          `Zbyt duży luz też ma swoją cenę, choć mniejszą. Wizytówka ${insertMm(BUSINESS_CARD)} przesuwa się w kopercie DL swobodnie i po otwarciu bywa nie tam, gdzie ją włożono — dlatego drobne wkładki wysyła się zwykle razem z listem, który wypełnia kopertę.`,
        ],
      },
      {
        id: 'jak-zmierzyc',
        heading: 'Jak zmierzyć wkładkę, zanim wybiorą Państwo format',
        paragraphs: [
          'Mierzą Państwo wkładkę w postaci gotowej do włożenia: złożoną, spiętą, razem z tym, co ma pojechać obok. Arkusz przed złożeniem ma inny wymiar niż ten sam arkusz po złożeniu, a o formacie decyduje wymiar drugi.',
          'W komplecie mierzy się element największy. Jeżeli do pisma dołączają Państwo kartę podarunkową i wizytówkę, format wybiera arkusz — reszta wchodzi razem z nim i nie zmienia obrysu przesyłki.',
          'Wymiar z pliku graficznego warto sprawdzić po przycięciu. Projekt przygotowany ze spadem jest w programie większy niż gotowy wydruk, więc do doboru koperty bierze się wymiar netto, ten po cięciu.',
        ],
      },
      {
        id: 'skladanie',
        heading: 'Złożenie zmienia wymiar wkładki, więc zmienia też format',
        paragraphs: [
          `Ten sam arkusz A4 wymaga dwóch różnych kopert, zależnie od tego, jak go Państwo złożą. Złożony na trzy ma ${insertMm(A4_THIRDS)} i wchodzi do koperty DL. Złożony na pół ma ${insertMm(A4_HALF)} — jego krótszy bok przekracza wtedy dopuszczalną szerokość wkładki dla koperty DL o ${A4_HALF_OVERHANG} mm i żadne dosuwanie tego nie zmieni.`,
          'Stąd pierwsze pytanie przy wkładce, która się nie mieści: czy wolno ją złożyć inaczej. Pismo, umowa, faktura, zaświadczenie i większość certyfikatów znoszą złożenie na trzy bez straty dla dokumentu. To jest złożenie, pod które format DL został zaprojektowany.',
          'Są wkładki, których nie składa się wcale. Dyplom wręczany na uroczystości, odbitka fotograficzna i karta plastikowa mają zostać płaskie — przy nich sposób złożenia nie jest zmienną i format musi wynikać wprost z wymiaru.',
          'Liczba kartek nie zmienia wymiaru wkładki. Trzy arkusze złożone razem na trzy mają ten sam obrys co jeden: rośnie grubość pliku, a nie jego szerokość ani wysokość.',
        ],
      },
      {
        id: 'ksztalt',
        heading: 'Kształt wkładki decyduje tak samo jak jej wymiar',
        paragraphs: [
          `Dwie wkładki o zbliżonej powierzchni potrafią wymagać dwóch różnych kopert. Zaproszenie kwadratowe ${insertMm(SQUARE_INVITE)} i arkusz A4 złożony na trzy zajmują niemal tyle samo papieru, a mieszczą się w innych formatach — różni je proporcja boków, nie powierzchnia.`,
          `Koperta DL jest formatem podłużnym: jej dłuższy bok jest ${sideRatio(DL_FORMAT)} razy dłuższy od krótszego. Wkładka o zbliżonych proporcjach wypełnia ją równo. Wkładka zbliżona do kwadratu zostawia w niej puste pole na jednym końcu, a częściej po prostu nie mieści się na szerokości.`,
          'Zestawienie poniżej pokazuje, pod jaki kształt wkładki zrobiony jest każdy z trzech formatów w katalogu Envelopes. Ostatnia kolumna mówi, który z nich da się dziś zamówić.',
        ],
        table: {
          caption: 'Kształt wkładki, pod który zaprojektowany jest każdy format koperty',
          head: ['Format', 'Wymiary', 'Kształt wkładki', 'Status w Envelopes'],
          rows: [...AVAILABLE_FORMATS, ...UPCOMING_FORMATS].map((format) => [
            `Koperta ${format.id}`,
            format.dimensions,
            FORMAT_SHAPES[format.id],
            format.disabled ? 'Dostępne wkrótce' : 'W sprzedaży',
          ]),
        },
      },
      {
        id: 'poza-formatem',
        heading: 'Co zrobić, gdy wkładka nie mieści się w kopercie DL',
        paragraphs: [
          `Dwie wkładki z tabeli nie wchodzą dziś do żadnej koperty, którą da się u nas zamówić: arkusz A4 złożony na pół ${insertMm(A4_HALF)} i arkusz A4 bez składania ${insertMm(A4_FLAT)}. Drogi wyjścia są trzy i warto je rozważyć w tej kolejności.`,
          'Pierwsza to inne złożenie. Arkusz złożony na trzy zamiast na pół rozwiązuje sprawę w większości korespondencji firmowej, nie wymaga zmiany po naszej stronie i nie przesuwa terminu wysyłki.',
          `Druga to poczekanie na format. Koperty ${UPCOMING_FORMATS_LABEL} mają w katalogu status „Dostępne wkrótce" — nie da się ich zamówić ani gładkich, ani z nadrukiem, i żaden odnośnik w tym wpisie do nich nie prowadzi. Zaproszenie kwadratowe jest właśnie tym przypadkiem: przyjmie je format K4, którego dziś nie sprzedajemy.`,
          'Trzecia to koperta spoza naszej oferty. Dyplomu A4, który nie może być zginany, nie zmieści żaden format z tego katalogu i mówimy to wprost, zamiast proponować złożenie, które zniszczy dokument.',
        ],
      },
      {
        id: 'lista-kontrolna',
        heading: 'Lista kontrolna przed wyborem formatu',
        paragraphs: [
          'Siedem punktów wystarczy, żeby wybrany format zgadzał się z tym, co faktycznie trafi do środka.',
        ],
        list: [
          'Wymiar wkładki mierzony po złożeniu, nie przed',
          'Największy element kompletu — to on wybiera format, reszta wchodzi razem z nim',
          `Zapas ${INSERT_CLEARANCE_MM} mm w obu wymiarach; poniżej tej granicy wkładka zagina się przy wsuwaniu`,
          'Wymiar netto z pliku graficznego, po przycięciu, bez spadów',
          'Sprawdzone, czy wkładkę wolno złożyć inaczej, jeśli nie mieści się na szerokości',
          'Kształt wkładki, a nie sama jej powierzchnia — kwadrat wymaga innej koperty niż prostokąt',
          `Format DL ${DL_FORMAT.dimensions} jako punkt wyjścia: to jedyny format, który zamówią Państwo dziś`,
        ],
      },
    ],
    cta: `Wkładkę do ${DL_MAX_INSERT.short} × ${DL_MAX_INSERT.long} mm przyjmie koperta DL — konfigurator otworzy się z tym formatem.`,
    ctaConfigure: { label: 'Wybierz kolor koperty DL', format: 'DL' },
    pillar: { href: '/koperty-dl', anchor: 'wymiary koperty DL' },
  },
  {
    /* content-plan.md poz. 9 — treść wspierająca filar K1, cel GEO.

       Rozgraniczenie z filarem `/koperty-z-nadrukiem` (decyzja z 17 sierpnia
       2026). Filar zostaje właścicielem frazy usługowej `koperty z nadrukiem`
       i całej warstwy transakcyjnej; ten wpis przejmuje frazę cenową
       `koperty z nadrukiem cena` i przesuwa jednostkę rozliczenia ze **sztuki**
       na **całe zamówienie**: dostawa rozłożona na sztuki oraz tabela pozycji,
       których nie doliczamy. Filar nadal ma sekcję `#cena` i pytanie „Ile
       kosztuje nadruk logo na kopertach?" w `PRINT_FAQ_ITEMS` — to sekcja
       strony sprzedażowej, nie osobny adres konkurujący o tę frazę.

       Świadomie nieobecne: uzasadnienie minimum 10 sztuk (poz. 46), terminy
       realizacji i moment, od którego biegną (poz. 16 i filar), specyfikacja
       plików (poz. 7). `FAQPage` zostaje wyłącznie na filarze. */
    slug: 'cena-kopert-z-nadrukiem-i-koszt-zamowienia',
    /* Tytuł bez kwoty i bez liczby — decyzja właściciela z 17 sierpnia 2026.
       Kwota należy do tabeli cennika, nie do nagłówka wyniku wyszukiwania. */
    title: 'Cena kopert z nadrukiem i koszt zamówienia',
    /* Lead zasila `description`. Jedna kwota, nie trzy: koszt jednej wysłanej
       koperty jest liczbą, której nie ma nigdzie indziej w serwisie. */
    lead: 'Sprawdź jak kształtuje się koszt zamówienia kopert z nadrukiem dla Twojej firmy. Poznaj czynniki wpływające na ostateczną wycenę i dokładnie zaplanuj swój budżet marketingowy. Przeczytaj nasz przejrzysty cennik.',
    category: 'Poradniki',
    date: '2026-08-17',
    /* Doszedł akapit odsyłający do poradnika o terminach (poz. 16) */
    updated: '2026-08-26',
    readingMinutes: 6,
    colorId: 'eko',
    format: 'DL',
    /* Kadr z nadrukiem — /images/zastosowania/eko-koperta-dl-nadruk-logo-palarni-kawy-1024.webp */
    showcaseFile: 'eko-koperta-dl-nadruk-logo-palarni-kawy',
    imageVariant: 'nadruk',
    ogImageSlug: 'blog-koszt-zamowienia-z-nadrukiem',
    ogImageAlt:
      'Dwie koperty DL z papieru Eko na ciemnym drewnianym blacie — widok klapki i przedniej ścianki',
    keywords: [
      'koperty z nadrukiem cena',
      'cena kopert z nadrukiem',
      'koszt zamówienia kopert z nadrukiem',
      'koperty z nadrukiem koszt dostawy',
    ],
    intro: `Zamówienie stu kopert DL z nadrukiem logo kosztuje ${formatPrice(REFERENCE_ORDER.withDelivery)} brutto: ${formatPrice(REFERENCE_ORDER.gross)} za koperty i ${formatPrice(DELIVERY_COST)} za jedną przesyłkę kurierską. Jedna gotowa koperta wychodzi więc ${formatPrice(REFERENCE_ORDER.perUnit)}. Poniżej rozpisujemy tę kwotę na czynniki, pokazujemy, jak zmienia się przy innym nakładzie, i wymieniamy pozycje, których do zamówienia nie doliczamy.`,
    sections: [
      {
        id: 'koszt-zamowienia',
        heading: 'Ile kosztuje zamówienie kopert z nadrukiem',
        paragraphs: [
          `Zamówienie kopert z nadrukiem kosztuje tyle, ile wynosi stawka jednostkowa razy liczba kopert, plus jedna przesyłka kurierska. Koperta DL z nadrukiem logo to ${formatPrice(PRINTED_UNIT.unitTotal)} brutto za sztukę — składają się na to sama koperta (${formatPrice(DEFAULT_PRICING.base.DL)}) i nadruk (${formatPrice(DEFAULT_PRICING.print)}). Kuriera liczymy raz, niezależnie od liczby kopert w paczce.`,
          'Stawka za sztukę nie zależy od nakładu. Sto kopert i tysiąc kopert rozliczamy tą samą kwotą jednostkową, bo rabatów ilościowych nie stosujemy. Zmienia się wyłącznie to, jak jednorazowy koszt dostawy rozkłada się na sztuki.',
          'Tabela poniżej pokazuje tę zależność. Ostatnie dwie kolumny wchodzą wprost do pozycji budżetowej: koszt jednej wysłanej koperty i część tej kwoty, która przypada na kuriera.',
        ],
        table: {
          caption:
            'Koszt zamówienia kopert DL z nadrukiem logo razem z dostawą, dla wybranych nakładów',
          head: ['Nakład', 'Zamówienie z dostawą', 'Koszt jednej koperty', 'W tym dostawa'],
          rows: PRINT_ORDER_COSTS.map((cost) => [
            `${cost.quantity.toLocaleString('pl-PL')} szt.`,
            formatPrice(cost.withDelivery),
            formatPrice(cost.perUnit),
            formatPrice(cost.deliveryPerUnit),
          ]),
        },
      },
      {
        id: 'czego-nie-doliczamy',
        heading: 'Czego nie doliczamy do zamówienia z nadrukiem',
        paragraphs: [
          'Do zamówienia z nadrukiem nie doliczamy opłaty przygotowawczej, kosztu matrycy, kosztu wizualizacji ani dopłaty za papier perłowy, metaliczny czy eko. Na fakturze stoją wyłącznie pozycje zamówienia i osobny wiersz z kosztem dostawy.',
          'Ta lista bierze się z pytań, które dostajemy przed pierwszym zamówieniem. Najczęstsze brzmi „co jeszcze dojdzie do tej kwoty” — więc odpowiadamy na nie wprost, pozycja po pozycji.',
          'Dwa wiersze wymagają komentarza. Wizualizację przygotowuje nasz grafik z Państwa pliku i przesyła ją do akceptacji przed drukiem; kolejne wersje po Państwa uwagach też są bez dopłaty. Logo natomiast drukujemy, a nie projektujemy — plik przygotowują Państwo po swojej stronie.',
        ],
        table: {
          caption: 'Pozycje, o które pytają Państwo przed zamówieniem kopert z nadrukiem',
          head: ['Pozycja', 'Czy doliczamy', 'Co to znaczy'],
          rows: [
            [
              'Opłata przygotowawcza, matryca, przygotowanie druku',
              'Nie doliczamy',
              'Koszt przygotowania druku jest już w stawce za nadruk',
            ],
            [
              'Wizualizacja koperty przed drukiem',
              'Nie doliczamy',
              'Grafik przygotowuje ją z Państwa pliku i przesyła e-mailem',
            ],
            [
              'Kolejne wersje wizualizacji po uwagach',
              'Nie doliczamy',
              'Cennik nie przewiduje opłaty za poprawkę',
            ],
            [
              'Papier perłowy, metaliczny albo eko',
              'Nie doliczamy',
              `Wszystkie ${COLORS.length} kolorów kosztuje tyle samo`,
            ],
            [
              'Nadruk na ciemnym papierze',
              'Nie doliczamy',
              'Druk na czarnej kopercie kosztuje tyle samo, co na białej',
            ],
            [
              'Minimalna wartość zamówienia',
              'Nie ma takiego progu',
              'Ograniczeniem jest liczba kopert, nie kwota zamówienia',
            ],
            [
              'Rabat ilościowy',
              'Nie stosujemy',
              'Stawka jednostkowa nie spada wraz z nakładem',
            ],
            [
              'Projekt logo od zera',
              'Nie wykonujemy',
              'Drukujemy plik, który Państwo przesyłają',
            ],
          ],
        },
      },
      {
        id: 'dostawa',
        heading: 'Dostawa to jedyna pozycja, której nie liczymy od sztuki',
        paragraphs: [
          `Dostawa kurierem kosztuje ${formatPrice(DELIVERY_COST)} brutto i naliczamy ją raz na zamówienie, niezależnie od liczby kopert w paczce. Progu darmowej dostawy nie ma, odbioru osobistego również — Envelopes sprzedaje wyłącznie wysyłkowo, na terenie Polski.`,
          `Dla budżetu ma to jedną konsekwencję. Przy zamówieniu minimalnym przesyłka dokłada do każdej koperty ${formatPrice(SMALLEST_ORDER.deliveryPerUnit)}, przy pięciuset sztukach — ${formatPrice(MID_ORDER.deliveryPerUnit)}. Im mniejszy nakład, tym mocniej kurier podbija koszt pojedynczej sztuki.`,
          'Stąd praktyczny wniosek dla korespondencji cyklicznej. Jeżeli koperty na dwa kwartały mogą pojechać w jednej przesyłce, płacą Państwo za kuriera raz zamiast dwa razy. Stawka za samą kopertę na tym nie zyskuje, ale koszt całej pozycji — tak.',
          'Odwrotnie działa to przy zamówieniach dzielonych na kilka adresów dostawy. Każdy adres to osobne zamówienie, więc również osobna przesyłka i osobna kwota za kuriera.',
        ],
      },
      {
        id: 'netto-brutto',
        heading: 'Którą kwotę wpisać do budżetu: netto czy brutto',
        paragraphs: [
          `Do budżetu wchodzi kwota netto, jeżeli Państwa firma odlicza VAT. Sto kopert DL z nadrukiem to ${formatPrice(REFERENCE_ORDER.net)} netto, dostawa — ${formatPrice(DELIVERY_NET)} netto. Ceny w cenniku i w konfiguratorze podajemy brutto, ze stawką ${VAT_PERCENT} procent, a podsumowanie zamówienia pokazuje obie kwoty.`,
          'Fakturę VAT wystawiamy do każdego zamówienia, również przy zakupie bez numeru NIP. Płatność z odroczonym terminem 14 dni jest dostępna dla instytucji publicznych i urzędów, których obieg zakupowy nie przewiduje przedpłaty. Pozostali klienci, w tym firmy komercyjne, płacą z góry — BLIK-iem, kartą albo przelewem.',
          'Przy przelewie tradycyjnym warto doliczyć czas księgowania. Termin realizacji zaczynamy liczyć od zaksięgowania wpłaty, a przy nadruku dodatkowo od akceptacji wizualizacji — oba warunki muszą być spełnione łącznie.',
        ],
      },
      {
        id: 'co-zmienia-kwote',
        heading: 'Co jeszcze może zmienić kwotę zamówienia',
        paragraphs: [
          'Stawkę jednostkową podnoszą dwie opcje: personalizacja i tryb ekspresowy. Obie włączają Państwo w konfiguratorze i obie widać w podsumowaniu, zanim zamówienie trafi do koszyka. Poza nimi kwota wynika wyłącznie z liczby kopert.',
          /* Odnośnik w bok do poz. 16 — ten wpis podaje wpływ ekspresu na
             kwotę, tamten rozstrzyga, czy dopłata w ogóle coś kupuje. */
          'Tryb ekspresowy jest jedyną z tych opcji, której nie wybiera się dla samego produktu — kupują Państwo nim wyłącznie czas. Czy ta zamiana się opłaca, rozstrzygamy w poradniku o [szybkiej realizacji kopert](/blog/szybka-realizacja-kopert-terminy-i-ekspres).',
          'Personalizacja bywa mylona z nadrukiem, więc warto rozdzielić te dwie usługi. Nadruk powtarza ten sam projekt na całym nakładzie i mieści się w stawce z tabeli wyżej. Personalizacja daje każdej kopercie inną treść — imię, nazwisko albo adres odbiorcy — i jest liczona osobno.',
          `Powyżej ${BULK_QUOTE_LABEL} sztuk kwota przestaje wynikać wprost z cennika. Zamówienia tej wielkości wyceniamy indywidualnie przez formularz; ustalamy wtedy również harmonogram dostaw i sposób rozliczenia.`,
        ],
        table: {
          caption: 'Opcje, które zmieniają koszt zamówienia kopert z nadrukiem',
          head: ['Opcja', 'Wpływ na kwotę', 'Kiedy wchodzi w grę'],
          rows: [
            [
              'Personalizacja danymi odbiorcy',
              `+${formatPrice(DEFAULT_PRICING.personalization)} brutto za sztukę`,
              'Gdy każda koperta ma nieść inne imię, nazwisko albo adres',
            ],
            [
              'Tryb ekspresowy',
              `+${formatPrice(DEFAULT_PRICING.express)} brutto za sztukę`,
              'Gdy koperty mają wyjść szybciej niż w trybie standardowym',
            ],
            [
              `Nakład powyżej ${BULK_QUOTE_LABEL} sztuk`,
              'Wycena indywidualna',
              'Kwotę i harmonogram dostaw ustalamy przez formularz wyceny',
            ],
            [
              'Zmiana koloru albo gramatury papieru',
              'Bez wpływu',
              'Cena zależy wyłącznie od formatu i wybranych usług',
            ],
          ],
        },
      },
      {
        id: 'jak-policzyc',
        heading: 'Jak policzyć koszt własnego nakładu',
        paragraphs: [
          'Koszt dowolnego zamówienia liczy się jednym działaniem: stawka jednostkowa razy liczba kopert, plus jedna dostawa. Stawka jest stała, więc jedyną zmienną w tym rachunku jest nakład.',
          `Jeden próg trzeba sprawdzić przed liczeniem. Zamówienie z nadrukiem zaczyna się od ${DEFAULT_PRICING.moqWithPrint} sztuk; koperty gładkie, bez nadruku, zamawiają Państwo od ${DEFAULT_PRICING.moqWithoutPrint} sztuki.`,
          'Konfigurator na stronie głównej wykonuje to działanie na bieżąco. Po wpisaniu ilości i włączeniu nadruku podsumowanie pokazuje kwotę brutto, netto oraz koszt dostawy — zanim cokolwiek trafi do koszyka i zanim podadzą Państwo jakiekolwiek dane.',
        ],
      },
      {
        id: 'lista-kontrolna',
        heading: 'Lista kontrolna przed zatwierdzeniem budżetu',
        paragraphs: [
          'Poniższe punkty wystarczą, żeby kwota z wyceny zgadzała się z kwotą na fakturze.',
        ],
        list: [
          'Liczba kopert — stawka jednostkowa jest ta sama przy każdym nakładzie, więc to jedyna zmienna rachunku',
          'Jedna dostawa na zamówienie — dwa adresy dostawy oznaczają dwa zamówienia i dwie przesyłki',
          'Nadruk czy personalizacja — druga usługa jest liczona osobno i podnosi stawkę za sztukę',
          'Tryb realizacji — ekspres podnosi stawkę jednostkową, tryb standardowy jej nie zmienia',
          'Kwota netto do pozycji budżetowej, kwota brutto do płatności',
          `Nakład powyżej ${BULK_QUOTE_LABEL} sztuk — zamiast konfiguratora formularz wyceny`,
          'Termin płatności — odroczone 14 dni dotyczy instytucji publicznych i urzędów',
        ],
      },
    ],
    cta: 'Koszt swojego nakładu policzą Państwo w konfiguratorze — kwota przelicza się przy każdej zmianie ilości.',
    ctaConfigure: { label: 'Policz koszt swojego nakładu', format: 'DL', print: true },
    pillar: { href: '/koperty-z-nadrukiem', anchor: 'koperty z nadrukiem' },
  },
  {
    /* content-plan.md poz. 8 — treść wspierająca filar K2. Wpis startowy
       `adresowanie-kopert-recznie-czy-z-arkusza` usunięto 15 sierpnia 2026
       razem z pozostałymi treściami sprzed strategii; ta wersja powstała
       od zera pod jedną intencję: „który tryb przekazania danych wybrać".

       Slug niesie frazę długiego ogona `adresowanie kopert z arkusza`.
       Sama fraza `adresowanie kopert` należy do filara
       /koperty-personalizowane i wpis jej nie przejmuje — nie ma jej
       w `keywords`, a w treści występuje wyłącznie w odmianie opisowej.

       Świadomie nieobecne: ceny, MOQ, progi ilościowe i specyfikacja
       kolumn arkusza. Tabela porównawcza dwóch trybów według skali stoi
       na filarze; ten wpis prowadzi przez decyzję. */
    slug: 'adresowanie-kopert-z-arkusza-czy-recznie',
    title: 'Adresowanie kopert z arkusza czy ręcznie',
    /* Lead zasila `description` wpisu, więc otwiera go fraza główna, ale nie
       powtarza tytułu słowo w słowo — pod kartą na `/blog`, `/` i na filarze
       stoi bezpośrednio pod nagłówkiem o tej samej treści. */
    lead: 'Zastanawiasz się czy wybrać adresowanie kopert z arkusza czy zaadresować koperty ręcznie? Odkryj, która metoda przygotowania listy adresów do nadruku oszczędzi czas Twojej firmy. Sprawdź nasz poradnik i zdecyduj.',
    category: 'Poradniki',
    date: '2026-08-16',
    /* Akapit odsyłający do poz. 15 — przygotowanie listy po eksporcie */
    updated: '2026-08-25',
    readingMinutes: 6,
    colorId: 'granatowy',
    format: 'DL',
    /* Kadr z personalizacją — /images/zastosowania/biala-perlowa-koperta-dl-adresowanie-odbiorcy-1024.webp */
    showcaseFile: 'biala-perlowa-koperta-dl-adresowanie-odbiorcy',
    imageVariant: 'personalizacja',
    ogImageSlug: 'blog-adresowanie-z-arkusza',
    ogImageAlt:
      'Biała perłowa koperta DL z nadrukowanym adresem odbiorcy, leżąca na drewnianym blacie',
    keywords: [
      'adresowanie kopert z arkusza',
      'adresowanie kopert ręcznie',
      'arkusz z listą odbiorców',
      'lista adresów do nadruku',
    ],
    intro: `Adresowanie kopert z arkusza wybierają Państwo wtedy, gdy lista odbiorców gdzieś już istnieje — w CRM, w systemie rezerwacji, w pliku od innego działu. Tryb ręczny, czyli wpisanie treści wprost w konfiguratorze, jest szybszy przy liście, która powstaje dopiero w chwili zamawiania. Oba tryby kończą się tym samym wydrukiem i tą samą wizualizacją do akceptacji, więc wybór dotyczy wyłącznie Państwa wygody.`,
    sections: [
      {
        id: 'dwa-tryby',
        heading: 'Adresowanie kopert z arkusza a tryb ręczny — czym się różnią',
        paragraphs: [
          'Oba tryby różni jedno: droga, którą dane docierają do produkcji. W trybie ręcznym wpisują Państwo treść w polu tekstowym konfiguratora. W trybie arkusza pobierają Państwo szablon, uzupełniają go i wgrywają z powrotem. Na kopercie wychodzi w obu przypadkach to samo — ten sam druk, ten sam krój pisma.',
          'Tryb przekazania danych wybierają Państwo w trzecim kroku konfiguratora, zaraz po włączeniu personalizacji. Wybór dotyczy jednej pozycji zamówienia, więc dwie różne wysyłki mogą korzystać z dwóch różnych trybów.',
          'Skala wysyłki jest oczywistym kryterium i przy typowych listach rozstrzyga sama — zestawienie obu trybów według liczby adresów stoi na stronie oferty. Ten poradnik odpowiada na pytanie, co zrobić, gdy sama liczba kopert niczego nie przesądza. Decydują wtedy dwie inne rzeczy: co ma stanąć na kopercie i gdzie te dane już są.',
        ],
      },
      {
        id: 'recznie-to-nie-odrecznie',
        heading: 'Tryb ręczny to nie pismo odręczne',
        paragraphs: [
          'Słowo „ręcznie” oznacza w konfiguratorze Envelopes wpisanie treści z klawiatury, a nie wypisywanie kopert długopisem. Wszystkie dane drukujemy maszynowo, niezależnie od wybranego trybu. Koperta z listy wpisanej ręcznie i koperta z arkusza wychodzą z produkcji nieodróżnialne.',
          'Rozróżnienie ma znaczenie przy korespondencji, która ma wyglądać jednolicie. Odręczne wypisywanie daje tyle wariantów pisma, ile osób siedziało nad stosem kopert, i nie da się go powtórzyć przy kolejnej turze. Nadruk wygląda za każdym razem tak samo — również za pół roku, przy następnej wysyłce.',
        ],
      },
      {
        id: 'co-ma-stanac-na-kopercie',
        heading: 'Pierwsze pytanie: pełny adres czy samo imię',
        paragraphs: [
          'Zanim wybiorą Państwo tryb, konfigurator pyta o coś innego: co ma stanąć na kopercie. Pełny adres, jeśli przesyłka idzie pocztą albo kurierem. Samo imię i nazwisko, jeśli koperty wręczają Państwo do ręki — karty powitalne w hotelu, dyplomy dla grupy szkoleniowej, bony z imieniem obdarowanego. Odpowiedź ustawia kolumny szablonu, więc lista bez adresów nie musi udawać listy wysyłkowej.',
          `To rozróżnienie ma jedną praktyczną konsekwencję. W wariancie wysyłkowym każdy wypełniony wiersz musi nieść komplet pól — ${REQUIRED_ADDRESS_FIELDS} — bo koperta bez kodu pocztowego nigdzie nie dojedzie. (Zasady rozmieszczenia tych pól opisujemy we wpisie o [poprawnym adresowaniu koperty firmowej](/blog/jak-zaadresowac-koperte-wysylana-przez-firme-wzor)). W wariancie imiennym wymagane jest tylko nazwisko, a pozostałe kolumny są opcjonalne.`,
          'Wysyłka mieszana, w której część kopert ma adres, a część samo imię, wymaga decyzji z góry: jedna pozycja zamówienia to jeden wariant. Prościej rozbić ją na dwie pozycje niż dopisywać adresy tam, gdzie nie są do niczego potrzebne.',
        ],
        table: {
          caption: 'Treść nadruku a wariant szablonu przy adresowaniu kopert',
          head: ['Co ma stanąć na kopercie', 'Wariant', 'Co jest wymagane'],
          rows: [
            [
              'Pełny adres pocztowy odbiorcy',
              'Pełny adres pocztowy',
              'Komplet pól adresowych w każdym wypełnionym wierszu',
            ],
            [
              'Nazwa firmy razem z adresem siedziby',
              'Pełny adres pocztowy',
              'Ten sam komplet co przy adresie osoby prywatnej',
            ],
            [
              'Imię i nazwisko bez adresu',
              'Samo imię i nazwisko',
              'Wyłącznie nazwisko — pól adresowych w tym szablonie nie ma',
            ],
            [
              'Nazwisko i stanowisko albo dział',
              'Samo imię i nazwisko',
              'Nazwisko wymagane, druga linia opcjonalna',
            ],
            [
              'Jedna dedykacja albo nazwa wydarzenia',
              'Dowolny — w trybie ręcznym',
              'Krótki tekst wpisany z klawiatury, bez pobierania szablonu',
            ],
          ],
        },
      },
      {
        id: 'skad-pochodza-dane',
        heading: 'Drugie pytanie: gdzie te dane już są',
        paragraphs: [
          'Jeżeli lista odbiorców istnieje już w formie cyfrowej — w CRM, w systemie rezerwacji, w programie kadrowym albo w pliku przysłanym przez inny dział — wybierają Państwo arkusz. Eksport wystarczy przenieść do szablonu. Przepisywanie tych samych danych do pola tekstowego dokłada wyłącznie jedno: okazję do literówki, której w źródle nie było.',
          'Jedna zasada rozstrzyga przypadki wątpliwe. Jeśli w trakcie wpisywania danych zaczynają Państwo kopiować je z innego pliku, decyzja już zapadła — te dane są cyfrowe i należą do arkusza.',
          'Sam eksport rzadko nadaje się do wgrania bez przeglądu: imię i nazwisko bywają w dwóch kolumnach, zapis w wersalikach, a ta sama osoba wraca w dwóch wierszach. Co zrobić z danymi między eksportem a wgraniem pliku, rozpisujemy w poradniku o [kopertach z imieniem i nazwiskiem](/blog/koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste).',
          'Odwrotnie działa lista, która powstaje dopiero w chwili zamawiania: trzy nazwiska z wiadomości od przełożonego, gość dopisany w ostatniej chwili, imię na bon kupiony przez telefon. Otwieranie Excela po to, żeby wpisać do niego dane, których nigdzie jeszcze nie ma, wydłuża zamówienie bez żadnego zysku.',
        ],
        table: {
          caption: 'Źródło listy odbiorców a tryb przekazania danych',
          head: ['Skąd pochodzi lista', 'Tryb', 'Uwaga'],
          rows: [
            [
              'Eksport z CRM lub systemu sprzedaży',
              'Arkusz',
              'Dane są już rozpisane na kolumny — przepisywanie ich tworzy drugą wersję tej samej listy',
            ],
            [
              'System rezerwacji albo formularz zapisów',
              'Arkusz',
              'Lista zmienia się do ostatniej chwili; plik aktualizują Państwo bez przepisywania całości',
            ],
            [
              'Plik przysłany przez klienta lub inny dział',
              'Arkusz',
              'Dane przechodzą przez jedną parę rąk mniej, więc nie zmienia się ich zapis',
            ],
            [
              'Kilka nazwisk z wiadomości e-mail',
              'Tryb ręczny',
              'Krótka lista, której nikt nie utrzymuje w żadnym systemie',
            ],
            [
              'Dane dyktowane przez telefon lub zbierane na bieżąco',
              'Tryb ręczny',
              'Arkusz powstałby wyłącznie na potrzeby jednego zamówienia',
            ],
            [
              'Jedna dedykacja na jedną kopertę',
              'Tryb ręczny',
              'Nie ma listy, którą trzeba by przekazać w pliku',
            ],
          ],
        },
      },
      {
        id: 'co-zatrzymuje-arkusz',
        heading: 'Co zatrzymuje wgranie arkusza',
        paragraphs: [
          `Wgrany arkusz sprawdzamy od razu, jeszcze przed dodaniem pozycji do koszyka. Wgrywanie zatrzymuje brak pola wymaganego w wybranym wariancie, liczba wypełnionych wierszy inna niż liczba zamówionych kopert, arkusz bez ani jednego wypełnionego wiersza oraz rozszerzenie pliku spoza listy ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}. Komunikat podaje wtedy, ile wierszy wymaga poprawki.`,
          `Dwie rzeczy nie wynikają wprost z samego szablonu. Czytamy pierwszy arkusz w skoroszycie, więc lista umieszczona na drugiej zakładce nie zostanie znaleziona. Nagłówki rozpoznajemy po słowach kluczowych — kolumna przemianowana z „${FIRST_REQUIRED_COLUMN}” na „Adres” przestaje być rozpoznawana i wszystkie wiersze wychodzą jako niekompletne.`,
          'Osobno warto pamiętać o filtrach. Filtr w Excelu ukrywa wiersze, ale ich nie usuwa. Arkusz przefiltrowany do części pozycji nadal zawiera wszystkie pozostałe i tyle właśnie wierszy policzymy przy wgraniu. Przed zapisaniem pliku prosimy usunąć zbędne wiersze, a nie tylko je odfiltrować.',
        ],
        table: {
          caption: 'Co zatrzymuje wgranie arkusza adresowego i jak to naprawić',
          head: ['Sytuacja w pliku', 'Co się dzieje przy wgraniu', 'Jak to naprawić'],
          rows: [
            [
              'Wiersz z nazwiskiem, ale bez adresu, w szablonie wysyłkowym',
              'Plik odrzucony; podajemy liczbę niekompletnych wierszy',
              'Uzupełnić adres albo pobrać szablon dla wariantu imiennego',
            ],
            [
              'Liczba wypełnionych wierszy inna niż liczba kopert',
              'Plik odrzucony; podajemy obie liczby',
              'Wyrównać liczbę wierszy albo skorygować ilość w konfiguratorze',
            ],
            [
              'Lista na drugiej zakładce skoroszytu',
              'Czytamy pierwszy arkusz w pliku, więc tych danych nie widzimy',
              'Przenieść listę na pierwszą zakładkę',
            ],
            [
              'Zmieniona nazwa kolumny w nagłówku',
              'Pole nie zostaje rozpoznane, a wiersz liczy się jako niekompletny',
              'Zostawić nagłówki z pobranego szablonu bez zmian',
            ],
            [
              'Wiersze ukryte filtrem',
              'Liczymy je razem z widocznymi',
              'Usunąć zbędne wiersze przed zapisaniem pliku',
            ],
            [
              `Rozszerzenie spoza listy ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}`,
              'Pliku nie przyjmujemy',
              'Zapisać arkusz w jednym z obsługiwanych formatów',
            ],
          ],
        },
      },
      {
        id: 'kto-sprawdza-liste',
        heading: 'Kto sprawdza listę, zanim ruszy druk',
        paragraphs: [
          'Arkusz zostawia po sobie plik, a tryb ręczny nie zostawia nic poza samym zamówieniem. Jeżeli listę odbiorców ma zatwierdzić przełożony, dział prawny albo osoba prowadząca projekt, arkusz jest jedynym trybem, w którym da się to zrobić przed złożeniem zamówienia. Plik krąży po firmie tak samo jak każdy inny załącznik.',
          'Oba tryby kończą się wizualizacją do akceptacji. Nasz grafik przygotowuje podgląd koperty z danymi odbiorcy i wysyła go e-mailem, a zamówienie czeka w statusie „Czeka na akceptację”. Do druku kierujemy wyłącznie wersję zatwierdzoną przez Państwa.',
          'Wizualizacja pokazuje układ nadruku, ale nie poprawia treści. Tekst odtwarzamy dokładnie w postaci, w jakiej został przekazany — literówka w nazwisku wejdzie na wydruk razem z resztą danych. Termin realizacji zaczyna biec od akceptacji wizualizacji, a przy przelewie tradycyjnym także od zaksięgowania wpłaty, więc każda kolejna wersja przesuwa datę wysyłki.',
          'Liczbę pozycji porównujemy z nakładem w obu trybach, ale inaczej. W arkuszu rozbieżność zatrzymuje wgranie pliku. W trybie ręcznym konfigurator liczy wypełnione wiersze na bieżąco i sygnalizuje różnicę pod polem tekstowym — nie blokuje jednak zamówienia, bo czasem ta sama treść ma stanąć na wszystkich kopertach.',
        ],
      },
      {
        id: 'czy-lista-wroci',
        heading: 'Czy ta lista wróci przy kolejnej wysyłce',
        paragraphs: [
          'Arkusz jest jedynym trybem, który zostawia dane w postaci nadającej się do ponownego użycia. Przy korespondencji cyklicznej — kwartalnych pismach do klientów, zaproszeniach na kolejną edycję wydarzenia, corocznych podziękowaniach — następne zamówienie zaczyna się od aktualizacji istniejącego pliku, a nie od zbierania listy od zera.',
          'Tryb ręczny takiego pliku nie tworzy. Wpisana treść zostaje przy zamówieniu i widzą ją Państwo w panelu zamówienia, ale przy kolejnej wysyłce trzeba ją wpisać jeszcze raz.',
          'Przy wysyłkach powtarzalnych to argument za arkuszem nawet wtedy, gdy pierwsza tura byłaby wygodniejsza w trybie ręcznym. Nakład pracy ponoszą Państwo raz, a uporządkowana lista obsłuży też każde następne zamówienie.',
        ],
      },
      {
        id: 'lista-kontrolna',
        heading: 'Lista kontrolna: który tryb wybrać',
        paragraphs: [
          'Poniższe sześć pytań rozstrzyga wybór. Żadne z nich nie jest wiążące — oba tryby prowadzą do tego samego wydruku, więc chodzi wyłącznie o to, która droga będzie krótsza przy Państwa liście.',
        ],
        list: [
          'Czy na kopercie ma stanąć pełny adres? To pytanie o wariant szablonu, nie o tryb — imienną listę też wgrywają Państwo plikiem',
          'Czy lista istnieje już w systemie albo w pliku? Jeśli tak — arkusz',
          'Czy dane powstają dopiero w chwili zamawiania? Jeśli tak — tryb ręczny',
          'Czy listę ma sprawdzić druga osoba przed złożeniem zamówienia? Jeśli tak — arkusz',
          'Czy ta sama wysyłka powtórzy się w kolejnym kwartale? Jeśli tak — arkusz',
          'Czy zaczynają Państwo kopiować dane z innego pliku do pola tekstowego? Wtedy decyzja już zapadła — arkusz',
        ],
      },
    ],
    cta: 'Tryb przekazania danych wybierają Państwo w trzecim kroku konfiguratora, zaraz po włączeniu personalizacji.',
    ctaConfigure: { label: 'Wybierz tryb i wyceń adresowanie', format: 'DL', personalization: true },
    pillar: { href: '/koperty-personalizowane', anchor: 'adresowanie kopert' },
  },
  {
    /* Slug przepisany 15 sierpnia 2026 (content-plan.md poz. 7). Poprzedni
       — `koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem` —
       niósł w adresie frazę wspierającą klastra K1, której właścicielem jest
       filar /koperty-z-nadrukiem. Stary adres przekierowuje `next.config.mjs`. */
    slug: 'jak-przygotowac-pliki-do-druku-na-kopertach',
    title: 'Jak przygotować pliki do druku na kopertach',
    lead: 'Zobacz jak powinno wyglądać poprawne przygotowanie logo do druku, aby uniknąć opóźnień. Sprawdź jakie pliki do druku na kopertach przyjmujemy oraz dlaczego polecamy plik wektorowy do nadruku. Przygotuj materiały.',
    category: 'Poradniki',
    date: '2026-06-28',
    updated: '2026-08-15',
    readingMinutes: 6,
    colorId: 'bialy',
    format: 'DL',
    /* Kadr z polem nadruku — /images/zastosowania/ciemnozielona-koperta-dl-miejsce-na-logo-1024.webp */
    showcaseFile: 'ciemnozielona-koperta-dl-miejsce-na-logo',
    imageVariant: 'nadruk',
    ogImageSlug: 'blog-pliki-do-druku',
    ogImageAlt:
      'Koperta DL w kolorze Butelkowa Zieleń z zaznaczonym polem, w którym drukowane jest logo klienta',
    /* Frazy `koperty z nadrukiem` i `koperty firmowe z nadrukiem` należą do
       filara /koperty-z-nadrukiem. Ten wpis obsługuje wyłącznie intencję
       procesową: jak przygotować plik, żeby przeszedł akceptację za
       pierwszym razem. Zero cen, zero MOQ — to materiał filara oraz
       pozycji 9 i 46 planu. */
    keywords: [
      'pliki do druku na kopertach',
      'przygotowanie logo do druku',
      'logo w krzywych',
      'plik wektorowy do nadruku',
    ],
    intro: `Plik do druku na kopertach przygotowują Państwo w formacie wektorowym — ${VECTOR_LABEL} — o wadze do ${PRINT_FILE_MAX_MB} MB, z czcionkami zamienionymi na krzywe i marginesem ${PRINT_SAFE_MARGIN_MM} mm od krawędzi koperty. Grafikę rastrową przyjmujemy przy ${PRINT_MIN_DPI} dpi w docelowym rozmiarze nadruku. Poniżej rozpisujemy każdy z tych warunków — od rozdzielczości po uwagi dla grafika.`,
    sections: [
      {
        id: 'wektor-czy-raster',
        heading: 'Wektor czy raster — który plik nadaje się do nadruku',
        paragraphs: [
          `Do nadruku na kopertach nadaje się przede wszystkim plik wektorowy: ${VECTOR_LABEL}. Wektor opisuje logo krzywymi, więc ten sam plik zadziała przy nadruku o szerokości 20 mm i przy nadruku na całej szerokości koperty DL ${FORMAT_MAP.DL.dimensions}. Grafikę rastrową — ${RASTER_LABEL} — również przyjmujemy, ale ma ona stałą liczbę pikseli i przy powiększeniu miękną w niej litery oraz cienkie linie.`,
          `Limit techniczny jest wspólny dla obu rodzajów: przyjmujemy do ${PRINT_FILE_MAX_COUNT} plików na zamówienie, każdy o wadze do ${PRINT_FILE_MAX_MB} MB. Plik CDR prosimy przesyłać razem z jego eksportem do PDF — mamy wtedy pewność, że projekt otworzył się u nas dokładnie tak, jak u Państwa grafika.`,
        ],
        list: [
          `Wektory: ${VECTOR_LABEL} — rekomendowane, skalują się bez utraty jakości`,
          `Rastry: ${RASTER_LABEL} — przyjmowane przy ${PRINT_MIN_DPI} dpi w docelowym rozmiarze nadruku`,
          `Limit: ${PRINT_FILE_MAX_COUNT} pliki na zamówienie, do ${PRINT_FILE_MAX_MB} MB każdy`,
          'Logo pobrane ze strony internetowej albo wycięte z sygnatury e-mail zwykle nie spełnia tych warunków',
        ],
      },
      {
        id: 'rozdzielczosc',
        heading: 'Ile pikseli musi mieć logo rastrowe',
        paragraphs: [
          `Grafika rastrowa musi mieć ${PRINT_MIN_DPI} dpi w docelowym rozmiarze nadruku. Przelicznik jest jeden: szerokość nadruku w milimetrach dzielimy przez ${MM_PER_INCH.toString().replace('.', ',')} i mnożymy przez ${PRINT_MIN_DPI}. Logo o szerokości ${LOGO_EXAMPLE_MM} mm wymaga więc pliku o szerokości co najmniej ${LOGO_EXAMPLE_PX} pikseli.`,
          `Liczy się liczba pikseli, a nie wartość „dpi” zapisana w metadanych pliku. Plik o szerokości ${SAMPLE_FILE_PX} pikseli wystarcza na nadruk szeroki na ${SAMPLE_FILE_MM} mm niezależnie od tego, czy opisano go jako 72, czy jako ${PRINT_MIN_DPI} dpi. Przeskalowanie takiego pliku w programie graficznym nie dokłada mu detalu — dokłada piksele wyliczone z sąsiednich.`,
          `Logo pobrane ze strony internetowej ma zwykle ${WEB_LOGO_MIN_PX}–${WEB_LOGO_MAX_PX} pikseli szerokości, co odpowiada nadrukowi o szerokości ${pxToMm(WEB_LOGO_MIN_PX)}–${pxToMm(WEB_LOGO_MAX_PX)} mm. Do niewielkiego znaku w rogu koperty to wystarczy. Do nadruku przez całą szerokość koperty DL — nie.`,
        ],
      },
      {
        id: 'przestrzen-barw',
        heading: 'Przestrzeń barw: CMYK albo numer Pantone',
        paragraphs: [
          'Plik do druku zapisują Państwo w CMYK albo podają numer koloru Pantone. Logotypy przygotowane pod ekran są zapisane w RGB i przed drukiem trzeba je przeliczyć na CMYK. Część barw RGB nie ma odpowiednika w druku, więc najbardziej nasycone błękity, fiolety i zielenie wychodzą ciemniejsze niż na monitorze.',
          'Jeśli kolor marki jest opisany numerem Pantone, prosimy podać go razem z plikiem. Grafik dobierze wtedy najbliższy odpowiednik i pokaże go na wizualizacji, zanim zamówienie trafi do druku.',
          'Kolor papieru również zmienia odbiór nadruku, bo koperty Envelopes są barwione w masie, a nie powlekane. Na kopertach ciemnych — Czarnej, Granatowej, Butelkowej Zieleni — czytelny jest nadruk jasny, na jasnych odwrotnie. O czytelności logo decyduje kontrast, a nie sam odcień papieru.',
        ],
      },
      {
        id: 'krzywe-i-tlo',
        heading: 'Czcionki na krzywe, logo bez białego tła',
        paragraphs: [
          'Czcionki w pliku wektorowym zamieniają Państwo na krzywe przed wysłaniem. Bez tego plik otworzy się z podmienionym krojem pisma wszędzie tam, gdzie danej czcionki nie ma zainstalowanej. Nazwa firmy zmienia wtedy szerokość i odstępy, a różnicę widać dopiero na wizualizacji.',
          'Logo rastrowe prosimy przesyłać z przezroczystym tłem, czyli w PNG albo WEBP. Plik JPG nie przechowuje przezroczystości i zawsze niesie tło — najczęściej białe. Na kopercie Ecru albo Granatowej biały prostokąt wokół logo będzie widoczny na wydruku.',
          `Jeśli logo ma wersję jednokolorową, warto dołączyć ją jako drugi plik — limit ${PRINT_FILE_MAX_COUNT} plików na zamówienie to przewiduje. Na ciemnym papierze wersja pełnokolorowa z cieniem i gradientem bywa nieczytelna, a wersja jednokolorowa w bieli wygląda na kopercie dokładnie tak, jak na wizualizacji.`,
        ],
      },
      {
        id: 'marginesy',
        heading: `Margines ${PRINT_SAFE_MARGIN_MM} mm i miejsca, w których nie drukujemy`,
        paragraphs: [
          `Nadruk zachowuje minimum ${PRINT_SAFE_MARGIN_MM} mm odstępu od każdej krawędzi koperty. Omijamy też dwa miejsca: linię klejenia i zagięcie klapki. Papier jest tam podwójny albo załamany, więc element przechodzący przez zagięcie deformuje się przy zamykaniu koperty.`,
          'Cała przednia ścianka jest dostępna pod nadruk, bo koperty Envelopes nie mają okienka adresowego. Jeżeli koperta ma być później zaadresowana, prosimy zostawić wolne pole na dane odbiorcy i napisać o tym w uwagach dla grafika.',
          'Warto sprawdzić, czy plik nie ma własnego marginesu. Logo wyeksportowane z prezentacji albo z dokumentu bywa otoczone pustym obszarem, który liczy się do wymiaru pliku — nadruk wychodzi wtedy mniejszy, niż wynikałoby z podanej szerokości.',
        ],
      },
      {
        id: 'uwagi-dla-grafika',
        heading: 'Co wpisać w polu „Uwagi dla grafika”',
        paragraphs: [
          'Pole „Uwagi dla grafika” otwiera się w trzecim kroku konfiguratora, razem z wgrywaniem plików. To miejsce na decyzje, których nie widać w samym pliku: kolor nadruku, jego położenie na kopercie i szerokość w milimetrach.',
          'Uwagi zapisujemy przy zamówieniu — widzą je Państwo w panelu zamówienia razem z plikiem, a grafik dostaje je w komplecie z konfiguracją. Im konkretniejszy opis, tym mniej wersji wizualizacji trzeba odrzucić.',
        ],
        list: [
          'Kolor nadruku — na przykład „logo w bieli” albo numer Pantone',
          'Położenie — „lewy górny róg przedniej ścianki”, „wyśrodkowane w poziomie”',
          `Szerokość nadruku w milimetrach — na przykład „logo ${LOGO_EXAMPLE_MM} mm szerokości”`,
          'Elementy z pliku, których nie drukujemy — hasło reklamowe, ramka, adres strony',
          'Numer wcześniejszego zamówienia, jeśli nadruk ma wyglądać identycznie jak poprzednio',
        ],
      },
      {
        id: 'akceptacja',
        heading: 'Wizualizacja to ostatni moment na korektę',
        paragraphs: [
          'Po złożeniu zamówienia z nadrukiem grafik Envelopes przygotowuje wizualizację koperty z Państwa logo i przesyła ją e-mailem. Zamówienie czeka w statusie „Czeka na akceptację”, a do druku kierujemy wyłącznie wersję zatwierdzoną. Uwagi zgłaszają Państwo w tym samym widoku, a grafik przygotowuje kolejną wersję.',
          'Termin realizacji zaczyna biec od akceptacji wizualizacji — a przy płatności przelewem także od zaksięgowania wpłaty. Plik przygotowany według powyższych zasad przechodzi ten etap w jednej wersji. Plik wymagający poprawek nie wydłuża samego druku, tylko czas wymiany korespondencji przed drukiem.',
        ],
      },
      {
        id: 'checklista',
        heading: 'Lista kontrolna przed wgraniem pliku',
        paragraphs: [
          'Przed wgraniem pliku do konfiguratora warto sprawdzić osiem punktów. Komplet z tej listy oznacza, że wizualizacja wróci do Państwa do akceptacji bez pytań uzupełniających.',
        ],
        list: [
          `Plik wektorowy (${VECTOR_LABEL}) albo raster ${RASTER_LABEL} w ${PRINT_MIN_DPI} dpi w docelowym rozmiarze`,
          `Waga do ${PRINT_FILE_MAX_MB} MB, maksymalnie ${PRINT_FILE_MAX_COUNT} pliki na zamówienie`,
          'Czcionki zamienione na krzywe',
          'Kolory w CMYK albo podany numer Pantone',
          'Przezroczyste tło przy logo rastrowym — PNG lub WEBP, nie JPG',
          `Zapas ${PRINT_SAFE_MARGIN_MM} mm od każdej krawędzi koperty`,
          'Wersja jednokolorowa logo, jeśli koperta jest ciemna',
          'Uwagi dla grafika: kolor nadruku, położenie i szerokość w milimetrach',
        ],
      },
    ],
    cta: 'Plik z logo wgrywają Państwo w trzecim kroku konfiguratora, razem z uwagami dla grafika.',
    ctaConfigure: { label: 'Wgraj plik i wyceń nadruk', format: 'DL', print: true },
    pillar: { href: '/koperty-z-nadrukiem', anchor: 'koperty z nadrukiem' },
  },
  {
    /* content-plan.md poz. 12 — treść wspierająca filar F5 (`/`), cel RUCH.
       Fraza główna: `kolory kopert`. Zmiana formatu na Supporting article
       obsługujący dobór odcienia do marki i identyfikacji wizualnej.

       Rozgraniczenie: Filar `/` (strona główna) prezentuje fizyczną paletę
       kolorów, tabelę gramatur oraz obsługuje zapytanie "koperty kolorowe"
       i "koperty ozdobne". Strony kolorów z Fazy 3 obsługują precyzyjne frazy
       (np. "czarne koperty z logo"). Ten wpis odpowiada na pytania decyzyjne
       dotyczące tego, jaki kolor pasuje do wizerunku firmy i czy nadruk
       będzie na nim czytelny. */
    slug: 'paleta-19-kolorow-jak-wybrac-odcien',
    title: 'Koperty ozdobne: paleta 19 kolorów — jak wybrać odcień',
    lead: 'Sprawdź, jak dobrać odcień kolorowej koperty ozdobnej do identyfikacji wizualnej firmy. Poznaj paletę 19 kolorów i wybierz najlepsze tło pod nadruk Twojego logo.',
    category: 'Poradniki',
    date: '2026-08-20',
    readingMinutes: 5,
    colorId: 'czarny',
    format: 'DL',
    showcaseFile: 'czarna-koperta-dl-nadruk-zaproszenie',
    ogImageSlug: 'blog-paleta-19-kolorow',
    ogImageAlt: 'Czarna koperta DL z białym nadrukiem zaproszenia obok czarnej klapki innej koperty',
    keywords: [
      'kolory kopert',
      'jak wybrać odcień koperty',
      'dobór koloru do marki',
      'koperty ozdobne kolorowe',
    ],
    intro: `Kolor koperty to decyzja o tle, na którym wydrukowane zostanie Państwa logo. W ofercie Envelopes znajduje się 19 odcieni papieru ozdobnego o gramaturze od 115 do 140 g/m². Ponieważ każda koperta DL z naszej palety kosztuje dokładnie tyle samo — 2,58 zł brutto za sztukę — wybór koloru nie jest kwestią budżetu, lecz wyłącznie estetyki i spójności z marką. Poniżej pokazujemy, jak podzielona jest nasza paleta i który odcień będzie optymalny dla Państwa branży.`,
    sections: [
      {
        id: 'podzial-palety',
        heading: 'Jak podzielona jest paleta 19 kolorów kopert ozdobnych',
        paragraphs: [
          'Nasza paleta obejmuje 19 starannie wyselekcjonowanych odcieni, zgrupowanych w sześć rodzin kolorystycznych. Taki podział pozwala szybko zawęzić wybór z kilkunastu możliwości do kilku wariantów pasujących do tonacji Państwa marki.',
          'Większość oferty to papiery całkowicie matowe, barwione w masie — oznacza to, że barwnik znajduje się w całej grubości arkusza, a nie tylko na jego powierzchni. Dzięki temu krawędzie koperty nie są białe, co jest charakterystyczne dla masowego druku offsetowego.',
          'Poza matami paleta obejmuje trzy odcienie z wykończeniem powierzchniowym: Złoty z połyskiem metalicznym oraz Srebrną Perłową i Białą Perłową o delikatnym, chłodnym połysku.',
        ],
        table: {
          caption: 'Podział palety 19 kolorów kopert ozdobnych w ofercie Envelopes',
          head: ['Rodzina kolorów', 'Odcienie w ofercie', 'Charakter i najczęstsze zastosowania'],
          rows: [
            ['Szarości i Czernie', 'Czarny, Szara', 'Nowoczesny minimalizm, technologia, motoryzacja, kancelarie'],
            ['Niebieskie', 'Granatowy, Niebieski, Jeansowy, Błękitna', 'Biznes korporacyjny, edukacja, prawo, finanse i doradztwo'],
            ['Zielenie', 'Butelkowa Zieleń, Matcha, Zielony', 'Ekologia, rolnictwo, hotele w naturze, branża beauty i spa'],
            ['Róże i Czerwienie', 'Czerwony, Różowa', 'Moda, kosmetyka, florystyka, restauracje, hotele i święta'],
            ['Żółte i Ziemiste', 'Żółta, Szarobrązowy (Taupe), Eko', 'Agencje kreatywne, nieruchomości, budownictwo, palarnie kawy'],
            ['Perłowe i Jasne', 'Złoty, Srebrna Perłowa, Biała Perłowa, Ecru, Biały', 'Śluby, uroczystości, medycyna estetyczna, jubilerzy i detal'],
          ],
        },
      },
      {
        id: 'ciemne-kolory',
        heading: 'Ciemne kolorowe koperty z jasnym nadrukiem — ekskluzywność w biznesie',
        paragraphs: [
          'Wybór ciemnej koperty — takiej jak [Czarny](/koperty/czarny), [Granatowy](/koperty/granatowy) czy [Butelkowa Zieleń](/koperty/ciemnozielony) — jest sygnałem premium. Ciemne tło maskuje ewentualne zabrudzenia w transporcie i nadaje korespondencji prestiżowy charakter, obok którego trudno przejść obojętnie.',
          'Decyzja o ciemnej kopercie wymusza jednak określoną technikę znakowania. Na ciemnym papierze barwionym w masie tradycyjny nadruk CMYK znika. Wyraźny efekt uzyskujemy stosując jasny nadruk — najczęściej całkowicie biały lub metalicznie złoty/srebrny.',
          'To rozwiązanie idealne dla marek z ustabilizowaną, minimalistyczną identyfikacją wizualną, dla których wyrazisty kontrast bieli na ciemnym tle jest przedłużeniem logotypu.',
        ],
      },
      {
        id: 'jasne-kolory',
        heading: 'Jasne i pastelowe koperty ozdobne — kiedy liczy się wielobarwność',
        paragraphs: [
          'Jeśli logotyp Państwa firmy składa się z kilku kolorów, które muszą zostać precyzyjnie odwzorowane na wydruku, najbezpieczniejszym wyborem są odcienie jasne. [Biały](/koperty/bialy), [Ecru](/koperty/ecru), [Błękitna](/koperty/jasnoniebieska) czy [Biała Perłowa](/koperty/biala-perlowa) przyjmują nadruk w pełnym kolorze bez wpływu na odcień pigmentu.',
          'Papiery pastelowe — takie jak [Różowa](/koperty/rozowa), [Matcha](/koperty/matcha), czy [Jasnozielony](/koperty/jasnozielony) — stanowią kompromis. Dodają do przesyłki unikalny kolor marki, a jednocześnie pozostają na tyle jasne, że czarny lub bardzo ciemny nadruk firmowy jest na nich doskonale czytelny.',
          'Taka paleta sprawdza się znakomicie w branży medycznej, edukacyjnej, w salonach kosmetycznych oraz przy wysyłce zaproszeń i bonów podarunkowych.',
        ],
      },
      {
        id: 'kolory-perlowe',
        heading: 'Wykończenie perłowe a matowe barwienie w masie',
        paragraphs: [
          'Trzy z naszych 19 odcieni — [Złoty](/koperty/zloty), [Srebrna Perłowa](/koperty/srebrna-perlowa) i Biała Perłowa — posiadają wykończenie powierzchniowe, które odbija światło. To papiery, które „pracują" pod kątem i dodają projektowi trójwymiarowości.',
          'Matowe papiery barwione w masie absorbują światło i sprawiają wrażenie bardziej surowych, namacalnych i organicznych w dotyku. Wybór między perłą a matem jest pytaniem o to, czy przesyłka ma kojarzyć się z elegancją klasyczną, czy z nowoczesnym minimalizmem.',
          'Wykończenie koperty nie wpływa na koszty. Wszystkie 19 kolorów objęte jest jednolitą stawką 2,58 zł brutto za kopertę DL.',
        ],
      },
      {
        id: 'podsumowanie',
        heading: 'Lista kontrolna przy wyborze koloru koperty ozdobnej',
        paragraphs: [
          'Poniższe pięć pytań pozwoli błyskawicznie zawęzić paletę 19 kolorów do tego jednego, właściwego odcienia.',
        ],
        list: [
          'Czy nadruk ma być jednokolorowy (biały/czarny), czy pełnokolorowy?',
          'Czy kolorystyka przesyłki ma współgrać z kolorami w księdze znaku marki?',
          'Czy szukają Państwo efektu luksusowego (ciemne tło), czy klasycznego (jasne)?',
          'Czy papier ma posiadać połysk (perła/metalik), czy być całkowicie matowy?',
          'Czy nadruk zdoła przebić się kontrastem, jeśli wybiorą Państwo papier pastelowy?',
        ],
      },
    ],
    cta: 'Pełną paletę 19 odcieni mogą Państwo sprawdzić w naszym konfiguratorze. Zaczynamy od klasycznej czerni.',
    ctaConfigure: { label: 'Sprawdź czarne koperty DL', format: 'DL', color: 'czarny' },
    pillar: { href: '/', anchor: 'koperty ozdobne' },
  },
  {
    /* content-plan.md poz. 13 — treść wspierająca filar K4 (`/koperty-dl`), cel GEO. 
       Rozgraniczenie z filarem F3: ten wpis obsługuje intencję decyzyjną dotyczącą wyboru między oknem a jego brakiem, podczas gdy filar po prostu podaje fakt, że cała oferta jest bez okienka. */
    slug: 'koperty-bez-okienka-kiedy-je-wybrac',
    title: 'Koperty bez okienka — kiedy je wybrać',
    lead: 'Brak okienka w kopercie buduje prestiż i chroni poufne dane. Wybierzcie Państwo gładkie koperty DL w 19 kolorach z nadrukiem realizowanym od 10 sztuk.',
    category: 'Poradniki',
    date: '2026-08-21',
    readingMinutes: 5,
    colorId: 'biala-perlowa',
    format: 'DL',
    showcaseFile: 'biala-perlowa-koperta-dl-gladka-przod-i-tyl',
    ogImageSlug: 'blog-koperty-bez-okienka',
    ogImageAlt: 'Biała perłowa koperta DL bez okienka adresowego na drewnianym blacie',
    keywords: [
      'koperty bez okienka',
      'koperty dl bez okienka',
      'kiedy koperty bez okienka',
      'koperty firmowe gładkie',
    ],
    intro: `Cała oferta kopert Envelopes składa się z kopert gładkich — bez okienka adresowego i bez wewnętrznego szarego poddruku. Brak przezroczystego foliowego okna wymusza zewnętrzny nadruk danych adresata lub personalizację całej partii. Rezygnacja z okienka nie jest brakiem technicznym, lecz świadomą decyzją. Wybór jednolitego frontu koperty wpływa na bezpieczeństwo, estetykę korespondencji oficjalnej i pozwala na umieszczenie firmowego nadruku w dowolnym miejscu. Poniżej analizujemy, w których sytuacjach okienko ułatwia pracę, a kiedy staje się barierą estetyczną.`,
    sections: [
      {
        id: 'estetyka',
        heading: 'Koperty bez okienka to standard w korespondencji premium',
        paragraphs: [
          'Koperta bez okienka to tradycyjna forma listu oficjalnego, która swoim jednolitym frontem buduje prestiż. Okienko adresowe kojarzy się z masową wysyłką faktur i wezwań do zapłaty, co automatycznie obniża rangę dokumentu.',
          'W korespondencji oficjalnej, zaproszeniach i przesyłkach od kancelarii prawnych liczy się prestiż i dyskrecja. Koperta bez okienka przypomina tradycyjną formę eleganckiego listu. Jej powierzchnia nie jest zakłócona foliową wstawką, a struktura matowego papieru jest ciągła i spójna.',
          'Decyzja o rezygnacji z okienka natychmiast przesuwa przesyłkę do kategorii listu oficjalnego, zanim jeszcze odbiorca zdąży rozerwać klapkę zamykającą.',
        ],
      },
      {
        id: 'poufność',
        heading: 'Brak okienka adresowego zapewnia poufność przesyłki',
        paragraphs: [
          'Koperty z okienkiem niosą jedno stałe ryzyko dla bezpieczeństwa: możliwość przesunięcia zawartości w transporcie. Pismo, które w trakcie dostawy osunie się wewnątrz koperty, może odsłonić przez foliowe okienko poufne informacje z treści dokumentu — kwoty z faktury lub warunki umowy handlowej.',
          'Koperty bez okienka z grubego papieru barwionego w masie likwidują to zagrożenie. Nawet jeśli wkładka swobodnie przesuwa się w środku, z zewnątrz zawsze widać tylko jednolitą płaszczyznę nieprzezroczystego materiału. To kluczowa kwestia przy przesyłaniu aktów notarialnych, umów inwestycyjnych oraz dokumentacji pracowniczej.',
        ],
      },
      {
        id: 'powierzchnia-nadruku',
        heading: 'Pełna przednia ścianka pod własny nadruk firmowy',
        paragraphs: [
          'Brak wyciętego otworu oznacza, że cała przednia ścianka koperty pozostaje dostępna pod projekt graficzny. W standardowej kopercie z okienkiem, prawy dolny róg jest zablokowany, co wymusza kompromisy przy pozycjonowaniu logotypu i haseł reklamowych.',
          'Gładka koperta uwalnia proces projektowy — pozwala na umieszczenie logo centralnie, na równym marginesie, a nawet na powiększenie grafiki. Taka przestrzeń jest szczególnie istotna w kreowaniu wizerunku biur rachunkowych i agencji marketingowych, gdzie estetyka przesyłki stanowi przedłużenie identyfikacji wizualnej.',
        ],
      },
      {
        id: 'adresowanie-i-personalizacja',
        heading: 'Jak adresować koperty, gdy brakuje okienka',
        paragraphs: [
          'Jeżeli adres nie jest widoczny z dokumentu umieszczonego w środku, dane odbiorcy muszą zostać nadrukowane bezpośrednio na zewnętrznej płaszczyźnie koperty (zobacz [wzór rozmieszczenia danych adresowych](/blog/jak-zaadresowac-koperte-wysylana-przez-firme-wzor)). Zamiast składać dokument pod ścisłe okno i pilnować równego gięcia, zlecają Państwo personalizację całej korespondencji już na etapie zamówienia opakowań.',
          'Przekazują Państwo arkusz z listą odbiorców w formularzu konfiguratora, a w efekcie otrzymują zapas kopert od razu zadrukowanych i gotowych do włożenia pism. Personalizacja imienna lub pełny nadruk adresowy kosztują dodatkowo 2,99 zł brutto za sztukę i zwalniają Państwa zespół z ręcznego wypisywania czy naklejania nieestetycznych etykiet.',
        ],
      },
      {
        id: 'kiedy-koperta-gladka',
        heading: 'Zestawienie: kiedy koperta gładka, a kiedy okienkowa',
        paragraphs: [
          'Wybór opiera się na porównaniu wygody przy masowej wysyłce z jakością wizualną przesyłek dedykowanych.',
        ],
        table: {
          caption: 'Porównanie zastosowań kopert bez okienka i kopert z okienkiem',
          head: ['Sytuacja wysyłkowa', 'Koperta bez okienka (gładka)', 'Koperta z okienkiem'],
          rows: [
            [
              'Korespondencja zarządów i pism prawnych',
              'Rekomendowana, dba o prestiż i dyskrecję',
              'Kojarzona negatywnie, z wezwaniami masowymi',
            ],
            [
              'Zagrożenie ujawnieniem treści przy przesunięciu papieru',
              'Całkowicie zamknięta powierzchnia gwarantuje dyskrecję',
              'Wymaga bezwzględnie dopasowanego zgięcia wkładki',
            ],
            [
              'Duży i skomplikowany nadruk firmowy',
              'Brak ograniczeń pozycjonowania na froncie',
              'Okienko zajmuje i blokuje spory fragment przedniej ściany',
            ],
            [
              'Masowe wysyłki setek faktur miesięcznie',
              'Uciążliwa, wymaga sprawdzania czy odpowiedni list trafił do koperty z odpowiednim adresem',
              'Wysoce efektywna, pismo adresuje samo siebie na froncie',
            ],
          ],
        },
      },
    ],
    cta: 'Zapoznaj się z wymiarami gładkiej koperty DL, która nie posiada okienka ani szarego poddruku.',
    ctaConfigure: { label: 'Sprawdź wymiary i dostępne kolory kopert', format: 'DL' },
    pillar: { href: '/koperty-dl', anchor: 'koperty dl' },
  },
  {
    slug: 'jak-zaadresowac-koperte-wysylana-przez-firme-wzor',
    title: 'Jak zaadresować kopertę wysyłaną przez firmę — wzór',
    lead: 'Sprawdź poprawny wzór na adresowanie koperty od firmy. Poznaj układ danych nadawcy i odbiorcy, zasady formatowania i uniknij zwrotów korespondencji.',
    category: 'Poradniki',
    date: '2026-08-22',
    /* Akapit odsyłający do poz. 15 — przygotowanie listy po eksporcie */
    updated: '2026-08-25',
    readingMinutes: 5,
    colorId: 'niebieski',
    format: 'DL',
    showcaseFile: 'niebieska-koperta-dl-personalizacja-odreczna',
    imageVariant: 'personalizacja',
    ogImageSlug: 'blog-wzor-adresowania',
    ogImageAlt: 'Niebieska koperta DL z odręczną personalizacją imienną na drewnianym stole',
    keywords: [
      'adresowanie koperty od firmy',
      'jak zaadresować kopertę firmową',
      'wzór adresowania koperty',
      'dane nadawcy na kopercie',
    ],
    intro: 'Adresowanie koperty od firmy wymaga przestrzegania ścisłych reguł pocztowych. Poprawny układ danych gwarantuje, że korespondencja trafi do odbiorcy bez opóźnień, a w przypadku błędu — wróci do nadawcy. Poniżej przedstawiamy kompletny wzór rozmieszczenia informacji na kopercie DL, zasady formatowania adresów biznesowych oraz najczęstsze błędy powodujące zwroty przesyłek.',
    sections: [
      {
        id: 'wzor-adresowania',
        heading: 'Wzór: poprawne adresowanie koperty od firmy',
        paragraphs: [
          'Na kopercie firmowej dane rozmieszcza się w dwóch przeciwległych narożnikach. Dane nadawcy (firmy wysyłającej) umieszczamy w lewym górnym rogu. Dane odbiorcy zajmują prawy dolny róg, z zachowaniem marginesów dla maszyn sortujących.',
          'Prawy górny róg jest zarezerwowany wyłącznie dla opłaty pocztowej (znaczka lub nadruku opłaty). Lewy dolny róg pozostawiamy pusty — poczta nanosi tam kody kreskowe służące do automatycznego sortowania listów.',
          'Tabela poniżej precyzuje układ danych adresowych z podziałem na wiersze.',
        ],
        table: {
          caption: 'Wzór rozmieszczenia danych nadawcy i odbiorcy na kopercie firmowej',
          head: ['Wiersz', 'Dane nadawcy (lewy górny róg)', 'Dane odbiorcy (prawy dolny róg)'],
          rows: [
            ['1', 'Nazwa firmy wysyłającej', 'Imię i nazwisko (lub nazwa działu)'],
            ['2', 'Imię i nazwisko nadawcy (opcjonalnie)', 'Pełna nazwa firmy odbiorcy'],
            ['3', 'Ulica i numer budynku/lokalu', 'Ulica i numer budynku/lokalu'],
            ['4', 'Kod pocztowy i miejscowość', 'Kod pocztowy i miejscowość'],
          ],
        },
      },
      {
        id: 'formatowanie-adresu',
        heading: 'Jak sformatować adres docelowy',
        paragraphs: [
          'Poczta Polska i firmy kurierskie wymagają jednolitego zapisu adresu. Kod pocztowy zapisuje się zawsze z myślnikiem (np. 00-000), a nazwę miejscowości — w sposób czytelny, bez używania skrótów typu m. czy woj.',
          'Numer lokalu oddzielamy od numeru budynku ukośnikiem, bez użycia słowa lokal czy m. Poprawny zapis to „ul. Nowa 15/2”. Jeśli list trafia do konkretnego działu w dużej korporacji, nazwę działu dopisujemy pod nazwiskiem odbiorcy, a nad nazwą firmy.',
          'Dane adresowe wyrównujemy do lewej strony. Maszyny sortujące czytają tekst od lewej do prawej, dlatego środkowanie lub wyrównywanie do prawej (tzw. justowanie) spowalnia skanowanie i zwiększa ryzyko błędu.',
        ],
      },
      {
        id: 'adresowanie-reczne-czy-nadruk',
        heading: 'Adresowanie ręczne czy nadruk maszynowy?',
        paragraphs: [
          'Wysyłka powyżej kilkunastu listów miesięcznie czyni adresowanie ręczne nieopłacalnym procesem. Ręczne wypisywanie danych generuje błędy (tzw. literówki) i obniża estetykę korespondencji, która w relacjach B2B jest wizytówką firmy.',
          'Nadruk bezpośrednio na kopercie eliminuje ryzyko pomyłki i wygląda w pełni profesjonalnie. Envelopes oferuje usługę personalizacji kopert DL z gotowego arkusza Excel, w której drukujemy dane odbiorców i nadawcy w cenie 2,99 zł brutto za sztukę.',
          'W przeciwieństwie do naklejanych etykiet, które mogą się odkleić w transporcie, nadruk płaski na papierze ozdobnym to rozwiązanie estetyczne, wybierane przez kancelarie i działy zarządcze.',
          'Nadruk odtwarza dane dokładnie w takiej postaci, w jakiej stoją w arkuszu, więc przed wysyłką listę warto przejrzeć: zapis nazwisk, polskie znaki i powtórzone rekordy. Prowadzi przez to poradnik o [kopertach z imieniem i nazwiskiem](/blog/koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste).',
        ],
      },
      {
        id: 'najczestsze-bledy',
        heading: 'Najczęstsze błędy przy adresowaniu kopert firmowych',
        paragraphs: [
          'Brak pełnej nazwy firmy. Samo imię i nazwisko odbiorcy w dużym biurowcu to za mało dla kuriera czy listonosza. Zawsze należy podać pełną nazwę podmiotu gospodarczego.',
          'Odwrotne umieszczenie danych. Zmiana miejsc nadawcy i odbiorcy skutkuje dostarczeniem listu... do nadawcy. Prawy dolny róg jest dla poczty nienaruszalnym miejscem adresu docelowego.',
          'Zbyt niska czcionka lub pismo nieczytelne. W przypadku nadruku należy stosować font bezszeryfowy (np. Arial, Roboto) o wielkości minimum 10 punktów. Pismo odręczne musi być wyraźne, najlepiej drukowane.',
        ],
      },
    ],
    cta: 'Usługa nadruku danych odbiorcy (personalizacji) eliminuje błędy w adresowaniu i przyspiesza wysyłkę korespondencji firmowej.',
    ctaConfigure: { label: 'Zamów koperty DL z adresowaniem', format: 'DL', personalization: true },
    pillar: { href: '/koperty-personalizowane', anchor: 'personalizowane koperty' },
  },
  {
    /* content-plan.md poz. 15 — trzecia treść wspierająca filar K2.
       Właściciel frazy `koperty z imieniem i nazwiskiem` (keywords.md, K2).
       Filar zostaje przy `personalizowane koperty` i `adresowanie kopert`.

       Rozgraniczenie w klastrze (granica z 16 sierpnia 2026). Filar
       /koperty-personalizowane podaje **specyfikację arkusza** — kolumny,
       pola wymagane, walidację. Poz. 8 rozstrzyga **wybór trybu** (arkusz
       czy wpisanie danych z klawiatury) i wymienia przyczyny odrzucenia
       pliku. Ten wpis zaczyna się **po** wyborze trybu i opisuje wyłącznie
       to, co dzieje się po stronie klienta między eksportem danych
       a wgraniem pliku: scalenie kolumn, ujednolicenie zapisu, formę
       nazwiska, duplikaty i minimalizację danych osobowych.

       Świadomie nieobecne: tabela „skąd pochodzi lista → tryb", druga
       zakładka skoroszytu, przemianowany nagłówek i wiersze ukryte filtrem
       (wszystko poz. 8), specyfikacja kolumn i limit wierszy (filar), wzór
       rozmieszczenia adresu na kopercie (poz. 14). Zero kwot, zero MOQ,
       zero terminów — należą do filara i do poz. 9. Wpis nie ma własnego
       `FAQPage`: dane strukturalne pytań zostają na filarze (zasada
       z poz. 7), więc sekcja pytań jest tu tabelą treści, nie schematem. */
    slug: 'koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste',
    title: 'Koperty z imieniem i nazwiskiem — lista do nadruku',
    /* Lead zasila `description`. Bez parametrów oferty — wpis jest o danych,
       nie o cenniku; jedyny konkret to trzy czynności, które czytelnik ma
       wykonać w arkuszu. */
    lead: 'Koperty z imieniem i nazwiskiem drukujemy dokładnie z Państwa listy. Co zrobić z danymi po eksporcie z CRM: zapis nazwisk, duplikaty, polskie znaki.',
    category: 'Poradniki',
    date: '2026-08-25',
    readingMinutes: 7,
    colorId: 'czarny',
    format: 'DL',
    /* Kadr aranżacyjny: trzy czarne koperty DL, każda z nadrukiem innego
       nazwiska — dokładnie efekt, o który chodzi w tym wpisie. Poz. 8 i 14
       używają innych kadrów personalizacyjnych, więc kadry się nie powtarzają. */
    showcaseFile: 'czarna-koperta-dl-personalizacja-imienna',
    imageVariant: 'personalizacja',
    ogImageSlug: 'blog-koperty-imienne',
    ogImageAlt:
      'Trzy czarne koperty DL na drewnianym blacie, każda z nadrukiem imienia i nazwiska innego odbiorcy',
    keywords: [
      'koperty z imieniem i nazwiskiem',
      'koperty imienne',
      'nazwiska na kopertach',
      'lista odbiorców do nadruku',
    ],
    intro:
      'Koperty z imieniem i nazwiskiem drukujemy dokładnie z tego, co stoi w Państwa arkuszu — nie poprawiamy odmiany, wielkich liter ani skrótów. O wyglądzie całej serii decyduje więc lista, a nie produkcja. Ten poradnik prowadzi przez etap między eksportem danych a wgraniem pliku: scalenie kolumn, ujednolicenie zapisu, formę nazwiska i duplikaty.',
    sections: [
      {
        id: 'lista-decyduje',
        heading: 'Dlaczego to lista decyduje o wyglądzie kopert',
        paragraphs: [
          'Tekst z arkusza trafia na kopertę bez korekty. Nie zmieniamy wielkości liter, nie odmieniamy nazwisk, nie rozwijamy skrótów i nie poprawiamy literówek — nadruk odtwarza zapis z pliku znak w znak. To decyzja celowa: dane pochodzą zwykle z systemu, w którym ktoś już ustalił ich postać, a cicha korekta po naszej stronie rozjechałaby się z resztą korespondencji.',
          'Praca nad serią kopert imiennych dzieje się więc w arkuszu, nie w drukarni. Nasz grafik przygotowuje wizualizację przed drukiem i wysyła ją do akceptacji, ale pokazuje ona układ nadruku i krój pisma — błąd w nazwisku będzie na niej widoczny, jednak nikt go za Państwa nie naprawi.',
          'Ten poradnik zaczyna się w momencie, w którym dane są już po Państwa stronie i wiadomo, że pojadą arkuszem. Jeżeli ta decyzja jeszcze nie zapadła, prowadzi przez nią osobny wpis o [adresowaniu kopert z arkusza](/blog/adresowanie-kopert-z-arkusza-czy-recznie).',
        ],
      },
      {
        id: 'jedna-kolumna',
        heading: 'Imię i nazwisko w jednej kolumnie, nie w dwóch',
        paragraphs: [
          `Szablon ma jedną kolumnę „${NAME_COLUMN_LABEL}”, a większość systemów eksportuje dwie osobne. Przed wgraniem trzeba je scalić — najpierw imię, potem nazwisko — i wkleić wynik jako wartości, nie jako formułę. Formuła po przeniesieniu do innego pliku traci odwołania i zostawia puste pole albo komunikat o błędzie w miejscu, w którym miało stanąć nazwisko.`,
          'Eksport z systemu kadrowego bywa posortowany nazwiskami i w tej samej kolejności je zapisuje: najpierw nazwisko, potem imię. Na kopercie taki zapis czyta się jak wyciąg z ewidencji, a nie jak list do konkretnej osoby. Kolejność odwracamy raz, w arkuszu, zamiast tłumaczyć ją później odbiorcom.',
          `Szablon imienny ma jeszcze drugą linię nadruku — kolumnę „${NAME_SECOND_LINE_LABEL}”. Wchodzi do niej dział, stanowisko albo nazwa firmy, jeśli sam kontekst nazwiska bywa niejasny. Pole jest opcjonalne, więc wiersze bez stanowiska przechodzą bez przeszkód i nie trzeba niczego w nich uzupełniać na siłę. Które kolumny są wymagane w którym wariancie, rozpisujemy na stronie [personalizowane koperty](/koperty-personalizowane#lista-danych).`,
        ],
      },
      {
        id: 'zapis-nazwisk',
        heading: 'Wersaliki, polskie znaki i nadmiarowe spacje',
        paragraphs: [
          'Trzy defekty zapisu wracają niemal w każdym eksporcie: nazwiska w całości wersalikami, polskie znaki zamienione na przypadkowe symbole oraz spacje, których nie widać. Wszystkie trzy wyjdą na wydruku, bo drukujemy zapis z pliku bez ingerencji. Przegląd całej kolumny zajmuje kilka minut i najlepiej zrobić go, zanim lista pójdzie do akceptacji.',
          'Zapis „JAN KOWALSKI” jest w systemach kadrowych normą, bo pole służy do wyszukiwania, a nie do druku. Na kopercie wersaliki brzmią jak korespondencja masowa i kasują cały efekt wysyłki imiennej. Zamiana na zapis z wielkiej litery zajmuje jedno przeciągnięcie formuły, ale wynik warto przejrzeć: nazwiska dwuczłonowe i te z przedrostkiem („de”, „van”) wymagają czasem ręcznej poprawki.',
          `Przypadkowe symbole w miejscu liter ą, ę i ł biorą się z kodowania pliku CSV — dwa systemy zapisują polskie znaki inaczej i przy otwarciu w arkuszu wychodzi z tego zbitka. Prosimy sprawdzić kilka nazwisk z polskimi znakami po eksporcie i zapisać plik jako XLSX. Przyjmujemy pliki ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}, więc zmiana formatu niczego nie blokuje, a zdejmuje pytanie o kodowanie.`,
        ],
        table: {
          caption: 'Typowe defekty zapisu w wyeksportowanej liście nazwisk',
          head: ['Co widać w arkuszu', 'Jak wyjdzie na kopercie', 'Co zrobić przed wgraniem'],
          rows: [
            [
              'Nazwisko w całości wersalikami',
              'Nadruk wersalikami, w tonie korespondencji masowej',
              'Zamienić na zapis z wielkiej litery i przejrzeć nazwiska dwuczłonowe',
            ],
            [
              'Nazwisko przed imieniem',
              'Zapis w kolejności ewidencyjnej, nie listowej',
              'Odwrócić kolejność w scalonej kolumnie',
            ],
            [
              'Przypadkowe symbole zamiast ą, ę, ł',
              'Te same symbole trafią na wydruk',
              'Sprawdzić kodowanie eksportu i zapisać plik jako XLSX',
            ],
            [
              'Podwójna spacja w środku wiersza',
              'Widoczna przerwa między imieniem a nazwiskiem',
              'Usunąć nadmiarowe odstępy w całej kolumnie',
            ],
            [
              'Spacja na końcu komórki',
              'Na kopercie niewidoczna',
              'Wyczyścić odstępy — inaczej dwa identyczne nazwiska nie zostaną rozpoznane jako duplikat',
            ],
            [
              'Skrót stanowiska zrozumiały tylko wewnątrz firmy',
              'Nadruk z kodem, którego odbiorca nie rozszyfruje',
              'Rozwinąć skrót albo zostawić drugą linię pustą',
            ],
          ],
        },
      },
      {
        id: 'odmiana-nazwisk',
        heading: 'Czy nazwisko na kopercie trzeba odmienić',
        paragraphs: [
          'Nazwisko odmieniają Państwo tylko wtedy, gdy nadruk jest zwrotem do adresata. Samo imię i nazwisko na froncie koperty zostaje w mianowniku — tak samo jak w bloku adresowym przesyłki pocztowej. Odmiana wchodzi dopiero razem z przyimkiem albo tytułem grzecznościowym: „Dla Pani Marty Skomorowskiej” wymaga dopełniacza, a „Szanowna Pani Marto” — wołacza.',
          'Rozstrzygnięcie należy do Państwa, bo drukujemy zapis z arkusza bez ingerencji w gramatykę. Przy wysyłce, w której część kopert ma nieść samo nazwisko, a część dedykację, prościej przygotować dwie listy niż mieszać formy w jednej kolumnie — inaczej po kilkudziesięciu wierszach nikt już nie pamięta, który wariant obowiązuje.',
          'Nazwiska obce i nietypowe warto zostawić w mianowniku. Błędna odmiana rzuca się w oczy mocniej niż jej brak, a reguły bywają w takich przypadkach sporne nawet wśród językoznawców. Zasady rozmieszczenia danych na kopercie wysyłkowej — nadawca, odbiorca, miejsce na opłatę — opisujemy osobno we wpisie o [poprawnym adresowaniu koperty firmowej](/blog/jak-zaadresowac-koperte-wysylana-przez-firme-wzor).',
        ],
        table: {
          caption: 'Forma nazwiska zależnie od tego, czym jest nadruk na kopercie',
          head: ['Co stoi na kopercie', 'Przypadek', 'Zapis w arkuszu'],
          rows: [
            ['Samo imię i nazwisko odbiorcy', 'Mianownik', 'Marta Skomorowska'],
            ['Imię i nazwisko w bloku adresowym', 'Mianownik', 'Jerzy Trzmiel'],
            ['Dedykacja zaczynająca się od „Dla”', 'Dopełniacz', 'Dla Pani Marty Skomorowskiej'],
            ['Zwrot grzecznościowy do adresata', 'Wołacz', 'Szanowna Pani Marto'],
            ['Jedna koperta dla dwóch osób', 'Mianownik liczby mnogiej', 'Państwo Anna i Jan Kowalscy'],
            ['Nazwisko obce lub nietypowe', 'Mianownik', 'Yannick Dubois — bez odmiany'],
          ],
        },
      },
      {
        id: 'tytuly-i-nazwiska-zlozone',
        heading: 'Tytuły, nazwiska dwuczłonowe i koperta dla dwóch osób',
        paragraphs: [
          'Tytuł naukowy albo zawodowy stawiamy przed imieniem, w tej samej komórce co nazwisko: „dr Anna Nowak”. Jeżeli baza ma tytuły tylko przy części osób, warto zdecydować z góry, czy pojawiają się u wszystkich, u których występują, czy u nikogo. Rozwiązanie połowiczne widać na stosie kopert od razu, a przy zaproszeniach bywa odczytane jako hierarchia gości.',
          'Nazwiska dwuczłonowe przenoszą z bazy ślady po formularzu, w którym powstały: raz z łącznikiem bez spacji, raz ze spacjami wokół łącznika, czasem z jednym tylko członem. Zapis warto ujednolicić przed wgraniem, a przy wątpliwościach zostawić tę wersję, której odbiorca używa w podpisie służbowej korespondencji.',
          'Jeden wiersz to jedna koperta, więc para mieszkająca pod wspólnym adresem dostaje jeden wiersz z dwoma nazwiskami, a nie dwa wiersze. Odwrotnie działa to w firmie: jeżeli list ma trafić osobno do dwóch osób z tego samego działu, potrzebne są dwa wiersze i dwie koperty. Znaki spoza alfabetu polskiego — akcenty, przegłosy — zobaczą Państwo na wizualizacji przed drukiem i to jest moment na ich sprawdzenie.',
        ],
      },
      {
        id: 'duplikaty',
        heading: 'Duplikaty, wiersze testowe i liczba kopert',
        paragraphs: [
          'Liczba wypełnionych wierszy musi zgadzać się z liczbą zamówionych kopert. Najczęstszym powodem rozjazdu nie jest błąd w liczeniu, tylko duplikat: ta sama osoba wyeksportowana z dwóch segmentów bazy albo widniejąca raz jako kontakt, a raz jako reprezentant firmy. Na liście wygląda to jak dwa różne rekordy, w skrzynce pocztowej — jak pomyłka.',
          'Duplikaty ukrywają się za różnicami w zapisie, dlatego kolejność pracy ma znaczenie. „Anna Kowalska”, „KOWALSKA ANNA” i „Anna Kowalska ” ze spacją na końcu to dla arkusza trzy różne wartości i żadne narzędzie do usuwania duplikatów ich nie połączy. Najpierw ujednolicamy zapis, dopiero potem szukamy powtórzeń.',
          'Z listy warto też usunąć wiersze, które nigdy nie miały pojechać: przykład z szablonu, rekord testowy sprzed lat, osobę, która odeszła z firmy odbiorcy. Wiersz, w którym został sam numer porządkowy, traktujemy jako pusty — numeracja nie czyni z niego pozycji do druku.',
        ],
        table: {
          caption: 'Skąd biorą się duplikaty i nadmiarowe wiersze w eksportowanej liście',
          head: ['Sytuacja w danych', 'Skutek przy zamówieniu', 'Decyzja przed wgraniem'],
          rows: [
            [
              'Ta sama osoba w dwóch segmentach bazy',
              'Dwie identyczne koperty i wiersz więcej niż kopert',
              'Usunąć powtórzenie po ujednoliceniu zapisu',
            ],
            [
              'Kontakt i firma jako osobne rekordy',
              'Dwie koperty pod ten sam adres',
              'Zostawić rekord, do którego korespondencja ma faktycznie trafić',
            ],
            [
              'Dwie osoby pod wspólnym adresem domowym',
              'Dwie koperty zamiast jednej',
              'Scalić w jeden wiersz z dwoma nazwiskami',
            ],
            [
              'Przykład z szablonu albo wiersz testowy',
              'Koperta z nazwiskiem spoza listy',
              'Usunąć przed zapisaniem pliku',
            ],
            [
              'Wiersz z samym numerem porządkowym',
              'Liczymy go jako pusty',
              'Uzupełnić nazwisko albo usunąć numer',
            ],
            [
              'Osoba, która odeszła z firmy odbiorcy',
              'Koperta imienna wraca albo trafia w próżnię',
              'Zaktualizować dane w systemie, nie dopiero w eksporcie',
            ],
          ],
        },
      },
      {
        id: 'dane-osobowe',
        heading: 'Ile danych osobowych trzeba nam przekazać',
        paragraphs: [
          'Tyle, ile ma stanąć na kopercie — i nic ponad to. Do serii imiennej wystarcza kolumna z imieniem i nazwiskiem, a przy wysyłce pocztowej dochodzą pola adresowe. Numery PESEL, kwoty premii, oceny okresowe i notatki z CRM prosimy usunąć z pliku przed wgraniem; nie są nam do niczego potrzebne i nie chcemy ich przechowywać.',
          'Eksport z systemu kadrowego albo z CRM wychodzi zwykle z kilkunastoma kolumnami naraz, bo tak jest ustawiony domyślnie. Skasowanie zbędnych kolumn jest jedyną czynnością na tej liście, która nie służy wyglądowi nadruku, tylko Państwu: danych, których nam nie przekazano, nie da się ani zgubić, ani użyć w niewłaściwy sposób.',
          'W odniesieniu do danych odbiorców administratorem pozostają Państwo, a Envelopes występuje wyłącznie jako podmiot przetwarzający i działa na Państwa polecenie. Warunki powierzenia określa Załącznik nr 2 do [regulaminu](/regulamin), zawierany z chwilą złożenia zamówienia z personalizacją. Dane adresowe przechowujemy przez 12 miesięcy od realizacji zamówienia — dla obsługi reklamacji i wysyłek powtarzalnych — a na wcześniejsze żądanie usuwamy je niezwłocznie; szczegóły stoją w [polityce prywatności](/polityka-prywatnosci).',
        ],
      },
      {
        id: 'lista-kontrolna',
        heading: 'Lista kontrolna przed wgraniem arkusza',
        paragraphs: [
          'Poniższe osiem punktów zamyka przygotowanie listy. Przejście przez nie zajmuje kilka minut i zdejmuje najczęstszą przyczynę poprawek — nie odrzucenie pliku przy wgrywaniu, tylko nazwisko wydrukowane w postaci, w jakiej nikt nie chciał go zobaczyć.',
        ],
        list: [
          'Imię i nazwisko stoją w jednej kolumnie, wklejone jako wartości, a nie jako formuła',
          'Kolejność jest listowa: najpierw imię, potem nazwisko',
          'Zapis jest jednolity — bez wersalików tam, gdzie reszta listy ich nie ma',
          'Polskie znaki wyświetlają się poprawnie po otwarciu pliku, który mają Państwo wgrać',
          'Kolumna nie zawiera podwójnych spacji ani odstępów na końcu komórek',
          'Duplikaty zostały usunięte po ujednoliceniu zapisu, a nie przed nim',
          'Z pliku zniknęły wiersze testowe, przykłady z szablonu i kolumny z danymi, które nie idą na druk',
          'Liczba wypełnionych wierszy zgadza się z liczbą zamawianych kopert',
        ],
      },
      {
        id: 'pytania',
        heading: 'Pytania, które wracają przy listach imiennych',
        paragraphs: [
          'Pięć pytań, które wracają przy pierwszej liście imiennej — razem z krótkimi odpowiedziami.',
        ],
        table: {
          caption: 'Najczęstsze pytania o listę imion i nazwisk do nadruku na kopertach',
          head: ['Pytanie', 'Odpowiedź'],
          rows: [
            [
              'Czy poprawiacie literówki w nazwiskach?',
              'Nie. Drukujemy zapis z arkusza znak w znak, a wizualizacja przed drukiem pokazuje układ nadruku, nie poprawia treści.',
            ],
            [
              'Czy nazwisko trzeba odmienić?',
              'Nie, jeśli na kopercie stoi samo imię i nazwisko — wtedy zostaje mianownik. Odmiana jest potrzebna wyłącznie w dedykacji albo w zwrocie grzecznościowym.',
            ],
            [
              'Czy imię i nazwisko mogą być w osobnych kolumnach?',
              'Szablon ma jedną kolumnę na oba pola. Kolumny z eksportu prosimy scalić i wkleić jako wartości.',
            ],
            [
              'Czy do listy imiennej trzeba dopisać adresy?',
              'Nie. Wariant imienny nie ma pól adresowych — wymagane jest samo imię i nazwisko odbiorcy.',
            ],
            [
              'W jakim formacie zapisać plik?',
              `Przyjmujemy ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}. Przy polskich znakach najbezpieczniejszy jest XLSX, bo jego odczyt nie zależy od kodowania.`,
            ],
          ],
        },
      },
    ],
    cta: 'Koperty z imieniem i nazwiskiem wyceniają Państwo w konfiguratorze — szablon listy pobierają w trzecim kroku.',
    ctaConfigure: {
      label: 'Wyceń koperty z imieniem i nazwiskiem',
      format: 'DL',
      personalization: true,
      /* Wejście z preselekcją zakresu „samo imię i nazwisko" — czytelnik
         przyszedł po listę imienną, więc konfigurator nie każe mu cofać się
         do wyboru wariantu adresowego (pkt 7 briefu SEO). */
      personalizationScope: 'imiona',
    },
    pillar: { href: '/koperty-personalizowane', anchor: 'personalizowane koperty' },
  },
  {
    /* content-plan.md poz. 16 — treść wspierająca filar K1
       (`/koperty-z-nadrukiem`), cel KONWERSJA. Fraza główna:
       `szybka realizacja kopert`. Wpis startowy o ekspresie usunięto
       15 sierpnia 2026 razem z treściami sprzed strategii; ta wersja
       powstała od zera.

       Oś wpisu: **od kiedy** liczymy termin, a nie ile on wynosi. Filar
       podaje same terminy w tabeli i w FAQ (`#terminy`, `PRINT_FAQ_ITEMS`),
       strona główna — pasek ekspresu pod matrycą usług. Nikt natomiast nie
       opisuje arytmetyki kalendarza: późniejszego z dwóch zdarzeń
       uruchamiających bieg terminu, równoległości wpłaty i wizualizacji,
       czasu przewoźnika doliczanego do terminu ani liczenia wstecz od daty
       wydarzenia. To jest treść tego wpisu.

       Świadomie nieobecne: cennik nadruku i personalizacji (należy do
       filara i do poz. 9), MOQ jako temat (poz. 46), wymagania dla pliku
       (poz. 7 — wpis tylko do niej linkuje). Dopłata ekspresowa zostaje,
       bo jest osią pozycji — ale wyłącznie w tabeli przeliczeniowej,
       nie w rozbiciu ceny jednostkowej.

       Wpis nie ma własnego `FAQPage`: dane strukturalne pytań stoją na
       filarze (zasada z poz. 7), więc sekcja pytań jest tabelą treści. */
    slug: 'szybka-realizacja-kopert-terminy-i-ekspres',
    title: 'Szybka realizacja kopert — terminy i ekspres',
    /* Lead zasila `description`. Jeden konkret różnicujący — moment startu
       terminu — plus termin ekspresowy czytany z cennika. */
    lead: `Szybka realizacja kopert zaczyna się nie w dniu zamówienia, tylko po zaksięgowaniu wpłaty i akceptacji wizualizacji. Kiedy ekspres w ${DEFAULT_PRICING.leadDaysExpress} dni się zwraca.`,
    category: 'Poradniki',
    date: '2026-08-26',
    readingMinutes: 7,
    colorId: 'granatowy',
    format: 'DL',
    /* Kadr aranżacyjny: zaproszenia na koncert — wysyłka, która ma sztywną
       datę w kalendarzu, czyli dokładnie sytuacja z tego wpisu. Kadr
       nieużywany przez żaden inny wpis. */
    showcaseFile: 'granatowa-koperta-dl-nadruk-logo-orkiestry',
    imageVariant: 'nadruk',
    ogImageSlug: 'blog-szybka-realizacja',
    ogImageAlt:
      'Granatowa koperta DL z białym nadrukiem logo orkiestry symfonicznej, przygotowana pod wysyłkę zaproszeń na koncert',
    keywords: [
      'szybka realizacja kopert',
      'koperty ekspresowo',
      'ile trwa druk kopert z logo',
      'termin realizacji kopert z nadrukiem',
    ],
    intro: `Termin realizacji liczymy od późniejszego z dwóch zdarzeń: zaksięgowania wpłaty i akceptacji wizualizacji. Dopiero wtedy rusza licznik — ${DEFAULT_PRICING.leadDaysStandard} dni roboczych w trybie standardowym albo ${DEFAULT_PRICING.leadDaysExpress} dni robocze w ekspresie. Ten poradnik pokazuje, jak policzyć datę wysyłki wstecz od dnia wydarzenia i kiedy dopłata za ekspres faktycznie coś kupuje.`,
    sections: [
      {
        id: 'od-kiedy-liczymy',
        heading: 'Od kiedy liczymy dni realizacji',
        paragraphs: [
          'Licznik startuje w dniu, w którym spełniony jest późniejszy z dwóch warunków: wpłata jest zaksięgowana, a wizualizacja zaakceptowana. Dzień złożenia zamówienia nie jest jeszcze pierwszym dniem realizacji. Przy kopertach gładkich drugi warunek odpada, bo taka partia nie przechodzi przez produkcję ani przez akceptację projektu.',
          'Rozróżnienie jest praktyczne, a nie formalne. Zamówienie opłacone BLIK-iem w poniedziałek, ale zaakceptowane dopiero w czwartek, zaczyna bieg w czwartek. Odwrotnie działa to przy przelewie tradycyjnym: projekt zatwierdzony od razu nic nie da, dopóki wpłata nie wejdzie na rachunek.',
          'Instytucje publiczne i urzędy płacące fakturą z odroczonym terminem 14 dni mają pierwszy warunek spełniony z chwilą przyjęcia zamówienia do realizacji — produkcja nie czeka wtedy na wpłatę. Regułę biegu terminu zapisaliśmy w [regulaminie](/regulamin#realizacja), w paragrafie o realizacji zamówienia.',
        ],
        table: {
          caption: 'Dwa warunki, od których zaczyna się bieg terminu realizacji kopert',
          head: ['Warunek', 'Co go spełnia', 'Po czyjej stronie'],
          rows: [
            [
              'Zaksięgowana wpłata',
              'BLIK i karta — potwierdzenie natychmiastowe. Przelew tradycyjny — dzień wpływu na rachunek',
              'Klient',
            ],
            [
              'Faktura z odroczonym terminem',
              'Przyjęcie zamówienia do realizacji, bez oczekiwania na wpłatę',
              'Envelopes — wyłącznie dla instytucji publicznych i urzędów',
            ],
            [
              'Akceptacja wizualizacji',
              'Kliknięcie akceptacji w linku z e-maila albo w panelu złożonych zamówień',
              'Klient',
            ],
            [
              'Zamówienie bez nadruku',
              'Warunek nie występuje — koperty gładkie pomijają etap wizualizacji',
              'Nie dotyczy',
            ],
          ],
        },
      },
      {
        id: 'ile-trwa',
        heading: 'Ile trwa realizacja kopert',
        paragraphs: [
          `Koperty gładkie wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze, a koperty z nadrukiem lub personalizacją — w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych w trybie standardowym albo w ${DEFAULT_PRICING.leadDaysExpress} dni robocze w ekspresie. Wszystkie te terminy dotyczą momentu nadania przesyłki, a nie doręczenia jej pod wskazany adres.`,
          'Czas przewoźnika, zwykle jeden do dwóch dni roboczych, dolicza się do terminu realizacji. Kurier nie jest częścią naszego terminu i nie skraca go dopłata ekspresowa — ekspres przyspiesza produkcję, nie transport.',
          'Dzień roboczy to poniedziałek, wtorek, środa, czwartek i piątek, z wyłączeniem dni ustawowo wolnych. Termin przeskakuje więc weekendy: pięć dni roboczych ze startem we wtorek kończy się w kolejny wtorek, czyli po siedmiu dniach kalendarza. Święto w liczonym okresie przesuwa datę o kolejną dobę.',
        ],
        table: {
          caption: 'Terminy realizacji zamówienia kopert i moment, od którego je liczymy',
          head: ['Zamówienie', 'Czas do nadania', 'Od kiedy liczymy'],
          rows: [
            [
              'Koperty gładkie, bez nadruku',
              `${DEFAULT_PRICING.leadDaysPlain} dni robocze`,
              'Od zaksięgowania wpłaty',
            ],
            [
              'Koperty z nadrukiem lub personalizacją — standard',
              `${DEFAULT_PRICING.leadDaysStandard} dni roboczych`,
              'Od późniejszego z dwóch zdarzeń: wpłaty albo akceptacji wizualizacji',
            ],
            [
              'Koperty z nadrukiem lub personalizacją — ekspres',
              `${DEFAULT_PRICING.leadDaysExpress} dni robocze`,
              `Jak wyżej, za dopłatą ${formatPrice(DEFAULT_PRICING.express)} brutto od sztuki`,
            ],
            [
              'Dostawa kurierem',
              'Zwykle 1–2 dni robocze',
              'Od nadania przesyłki — poza terminem realizacji',
            ],
          ],
        },
      },
      {
        id: 'wplata-i-wizualizacja',
        heading: 'Wpłata i wizualizacja biegną równolegle',
        paragraphs: [
          'Wizualizację przygotowujemy niezależnie od statusu płatności — nie czekamy z projektem na wpłatę. Oba warunki mogą więc zostać spełnione tego samego dnia, a przy płatności natychmiastowej cała zwłoka sprowadza się do tego, jak szybko zatwierdzą Państwo projekt.',
          'Wizualizacja przychodzi e-mailem, pod indywidualnym linkiem, który nie wymaga logowania. Link da się przekazać dalej i to jest jego sens: w firmie projekt zatwierdza zwykle ktoś inny niż osoba składająca zamówienie, a przekładanie tego między skrzynkami kosztuje dzień albo dwa.',
          'Jeżeli nie zaakceptują Państwo projektu ani nie zgłoszą do niego uwag, przypomnienie wysyłamy po trzech dniach roboczych. Zamówienie stoi wtedy w miejscu — termin nie tyle się wydłuża, co jeszcze nie zaczął biec. To najczęstszy powód rozjazdu między datą z potwierdzenia a rzeczywistą datą wysyłki.',
          'Data w potwierdzeniu zamówienia jest szacunkiem liczonym od dnia jego złożenia. Zakłada niezwłoczną wpłatę i niezwłoczną akceptację, więc każdy dzień zwłoki przy którymkolwiek z tych kroków przesuwa ją o tyle samo.',
        ],
      },
      {
        id: 'kiedy-doplata-sie-zwraca',
        heading: 'Kiedy dopłata za ekspres się zwraca',
        paragraphs: [
          `Tryb ekspresowy skraca produkcję o ${EXPRESS_SAVED_DAYS_LABEL}: zamiast ${DEFAULT_PRICING.leadDaysStandard} dni roboczych zamówienie idzie do wysyłki po ${DEFAULT_PRICING.leadDaysExpress}. Dopłata nalicza się od łącznej liczby sztuk w zamówieniu, więc jej wysokość zależy od nakładu, ale to, co kupuje, jest stałe — tyle samo dni przy dziesięciu kopertach, co przy pięciuset.`,
          'Ekspres ma sens wtedy, gdy te dni faktycznie rozstrzygają — data gali jest ustalona, zaproszenia mają wyjść razem z programem wydarzenia, a wysyłka nie ma drugiego terminu. Kiedy w kalendarzu jest zapas, tryb standardowy daje dokładnie ten sam produkt: tę samą kopertę, ten sam nadruk, ten sam papier.',
          'Tryb wybiera się w koszyku, a nie w konfiguratorze, i dotyczy całego zamówienia — z jednego zamówienia wychodzi jedna przesyłka. Podsumowanie koszyka pokazuje wtedy dopłatę osobną pozycją, przeliczoną przez liczbę sztuk, zanim potwierdzą Państwo zakup.',
        ],
        table: {
          caption: 'Dopłata za tryb ekspresowy w przeliczeniu na jeden zyskany dzień roboczy',
          head: ['Nakład', 'Dopłata za ekspres', 'Koszt jednego zyskanego dnia'],
          rows: EXPRESS_SURCHARGE_ROWS.map((row) => [
            `${row.quantity} szt.`,
            `${formatPrice(row.total)} brutto`,
            `${formatPrice(row.perDay)} brutto`,
          ]),
        },
      },
      {
        id: 'czego-ekspres-nie-przyspieszy',
        heading: 'Czego ekspres nie przyspieszy',
        paragraphs: [
          'Ekspres skraca wyłącznie produkcję. Nie przyspieszy księgowania przelewu, nie zastąpi Państwa akceptacji projektu i nie skróci drogi kuriera. Zamówienie ekspresowe, które czeka na zatwierdzenie wizualizacji, stoi dokładnie tak samo jak zamówienie standardowe.',
          'Osobnym przypadkiem są korekty. Dwie korekty wizualizacji mieszczą się w cenie zamówienia; kolejne wersje uzgadniamy indywidualnie i do czasu tego uzgodnienia bieg terminu jest zawieszony. Plik przygotowany zgodnie z wymaganiami zdejmuje ten scenariusz — rozpisaliśmy je w poradniku [jak przygotować pliki do druku na kopertach](/blog/jak-przygotowac-pliki-do-druku-na-kopertach).',
          'Koperty gładkie nie mają trybu ekspresowego i nie ma w nich za co dopłacać. Partia bez nadruku nie przechodzi przez produkcję ani przez akceptację projektu, więc jedzie zawsze w tym samym terminie — koszyk nawet nie pyta wtedy o wybór trybu.',
        ],
        table: {
          caption: 'Które etapy zamówienia skraca tryb ekspresowy, a których nie dotyczy',
          head: ['Etap zamówienia', 'Czy skraca go ekspres', 'Co skraca go naprawdę'],
          rows: [
            [
              'Księgowanie płatności',
              'Nie',
              'BLIK albo karta — potwierdzenie jest natychmiastowe',
            ],
            [
              'Oczekiwanie na akceptację wizualizacji',
              'Nie',
              'Przekazanie linku wprost osobie, która zatwierdza projekt',
            ],
            [
              'Kolejne wersje projektu',
              'Nie — bieg terminu jest wtedy zawieszony',
              'Plik przygotowany zgodnie z wymaganiami',
            ],
            [
              'Druk, kontrola i pakowanie',
              `Tak — z ${DEFAULT_PRICING.leadDaysStandard} dni roboczych do ${DEFAULT_PRICING.leadDaysExpress}`,
              'Dopłata ekspresowa naliczana od sztuki',
            ],
            [
              'Dostawa kurierem',
              'Nie',
              'Nic po naszej stronie — czas przewoźnika jest poza terminem realizacji',
            ],
            [
              'Zamówienie kopert gładkich',
              'Nie dotyczy — tryb w ogóle nie występuje',
              `Termin jest stały: ${DEFAULT_PRICING.leadDaysPlain} dni robocze bez dopłaty`,
            ],
          ],
        },
      },
      {
        id: 'licz-wstecz',
        heading: 'Jak policzyć termin wstecz od daty wydarzenia',
        paragraphs: [
          'Liczenie zaczyna się od dnia, w którym koperty mają być gotowe do użycia, i cofa się przez cztery odcinki: zapas na miejscu, drogę kuriera, produkcję i akceptację projektu. Ostatni odcinek jest jedynym, którego długość zależy wyłącznie od Państwa.',
          `Przykład na trybie standardowym. Koperty mają leżeć na biurku w czwartek. Kurier potrzebuje do dwóch dni roboczych, więc przesyłka musi wyjść najpóźniej we wtorek tego samego tygodnia. Produkcja w trybie standardowym zajmuje ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, co cofa start terminu na wtorek tydzień wcześniej — i to jest dzień, w którym wpłata ma być już zaksięgowana, a wizualizacja zaakceptowana. Samo zamówienie trzeba więc złożyć jeszcze wcześniej.`,
          `W ekspresie ten sam punkt dojścia przesuwa się o ${EXPRESS_SAVED_DAYS_LABEL}: start terminu wypada w piątek przed wysyłką, a nie we wtorek tydzień wcześniej. Tyle właśnie kupuje dopłata — ${EXPRESS_SAVED_DAYS_LABEL} więcej na zebranie wpłaty i akceptacji.`,
        ],
        list: [
          'Dzień, w którym koperty mają być gotowe do użycia — zwykle wcześniejszy niż dzień wydarzenia',
          'Zapas na miejscu: rozpakowanie, włożenie wkładek, sprawdzenie kompletu',
          'Droga kuriera — zwykle 1–2 dni robocze, doliczane do terminu realizacji',
          `Produkcja: ${DEFAULT_PRICING.leadDaysStandard} dni roboczych w standardzie albo ${DEFAULT_PRICING.leadDaysExpress} dni robocze w ekspresie`,
          'Akceptacja wizualizacji — odcinek, którego długość zależy wyłącznie od Państwa',
          'Płatność: natychmiastowa przy BLIK-u i karcie, kilkudniowa przy przelewie tradycyjnym',
          'Dni ustawowo wolne w liczonym okresie — termin biegnie wyłącznie w dni robocze',
        ],
      },
      {
        id: 'pytania',
        heading: 'Pytania, które wracają przy krótkim terminie',
        paragraphs: [
          'Sześć pytań, które wracają, kiedy koperty mają być gotowe na konkretny dzień — razem z krótkimi odpowiedziami.',
        ],
        table: {
          caption: 'Najczęstsze pytania o termin realizacji i tryb ekspresowy',
          head: ['Pytanie', 'Odpowiedź'],
          rows: [
            [
              'Ile trwa druk kopert z logo?',
              `${DEFAULT_PRICING.leadDaysStandard} dni roboczych do nadania w trybie standardowym, ${DEFAULT_PRICING.leadDaysExpress} dni robocze w ekspresie. Termin biegnie od późniejszego z dwóch zdarzeń: zaksięgowania wpłaty i akceptacji wizualizacji.`,
            ],
            [
              `Czy ${DEFAULT_PRICING.leadDaysExpress} dni robocze to termin dostawy?`,
              'Nie, to termin do nadania przesyłki. Czas przewoźnika, zwykle 1–2 dni robocze, dolicza się do terminu realizacji.',
            ],
            [
              'Gdzie włącza się tryb ekspresowy?',
              'W koszyku, nie w konfiguratorze. Tryb dotyczy całego zamówienia, bo wychodzi z niego jedna przesyłka.',
            ],
            [
              'Czy ekspres dotyczy kopert bez nadruku?',
              `Nie. Koperty gładkie nie przechodzą przez produkcję i jadą w ${DEFAULT_PRICING.leadDaysPlain} dni robocze bez dopłaty — koszyk nie pyta wtedy o tryb realizacji.`,
            ],
            [
              'Co się stanie, jeśli zgłoszę uwagi do wizualizacji?',
              'Przygotujemy kolejną wersję projektu. Dwie korekty mieszczą się w cenie zamówienia, a termin realizacji zaczyna biec dopiero od akceptacji.',
            ],
            [
              'Czy przy fakturze z odroczonym terminem trzeba czekać na wpłatę?',
              'Nie. Realizacja rusza z chwilą przyjęcia zamówienia. Faktura z odroczonym terminem 14 dni jest dostępna dla instytucji publicznych i urzędów.',
            ],
          ],
        },
      },
    ],
    cta: 'Termin dla swojego zamówienia zobaczą Państwo w konfiguratorze — tryb ekspresowy wybierają w koszyku.',
    ctaConfigure: { label: 'Zaplanuj koperty z nadrukiem', format: 'DL', print: true },
    pillar: { href: '/koperty-z-nadrukiem', anchor: 'koperty z nadrukiem' },
  },
];

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      const aScore = a.category === post.category ? 1 : 0;
      const bScore = b.category === post.category ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, limit);
}
