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
import type { EnvelopeFormat, FormatId, StandardInsert } from './catalog';
import {
  DEFAULT_PRICING,
  DELIVERY_COST,
  calculatePrice,
  formatPrice,
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

const POSTS: BlogPost[] = [
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
    lead: `Format koperty wybiera się od wkładki: mierzą ją Państwo po złożeniu i dokładają ${INSERT_CLEARANCE_MM} mm zapasu. Tabela ${STANDARD_INSERTS.length} wkładek i formatów, które je przyjmą.`,
    category: 'Poradniki',
    date: '2026-08-17',
    readingMinutes: 6,
    colorId: 'taupe',
    format: 'DL',
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
    lead: `Koperty z nadrukiem kosztują ${formatPrice(PRINTED_UNIT.unitTotal)} brutto za sztukę. Pokazujemy, ile wychodzi całe zamówienie razem z dostawą i czego do tej kwoty nie doliczamy.`,
    category: 'Poradniki',
    date: '2026-08-17',
    readingMinutes: 6,
    colorId: 'eko',
    format: 'DL',
    /* Kadr z nadrukiem — /images/prints/eko-koperty-z-nadrukiem-dl-1200.webp */
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
    lead: 'Arkusz czy wpisanie z klawiatury? Decyduje nie liczba kopert, tylko to, gdzie ta lista już jest i kto ma ją sprawdzić. Sześć pytań rozstrzyga wybór.',
    category: 'Poradniki',
    date: '2026-08-16',
    readingMinutes: 6,
    colorId: 'granatowy',
    format: 'DL',
    /* Kadr z personalizacją — /images/personalized/granatowe-koperty-personalizowane-dl-1200.webp */
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
          `To rozróżnienie ma jedną praktyczną konsekwencję. W wariancie wysyłkowym każdy wypełniony wiersz musi nieść komplet pól — ${REQUIRED_ADDRESS_FIELDS} — bo koperta bez kodu pocztowego nigdzie nie dojedzie. W wariancie imiennym wymagane jest tylko nazwisko, a pozostałe kolumny są opcjonalne.`,
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
    lead: `Pliki do druku na kopertach: ${PRINT_FILE_FORMAT_COUNT} formatów do ${PRINT_FILE_MAX_MB} MB, ${PRINT_MIN_DPI} dpi przy rastrach, czcionki na krzywych, ${PRINT_SAFE_MARGIN_MM} mm marginesu. Lista kontrolna przed wgraniem logo.`,
    category: 'Poradniki',
    date: '2026-06-28',
    updated: '2026-08-15',
    readingMinutes: 6,
    colorId: 'bialy',
    format: 'DL',
    /* Kadr z zaznaczonym polem nadruku — /images/prints/biale-koperty-z-nadrukiem-dl-1200.webp */
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
