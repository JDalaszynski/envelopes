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
  FORMAT_MAP,
  PERSONALIZATION_REQUIRED_COLUMNS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  PRINT_FILE_EXTENSIONS,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
  PRINT_MIN_DPI,
  PRINT_SAFE_MARGIN_MM,
} from './catalog';
import type { FormatId } from './catalog';

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

const POSTS: BlogPost[] = [
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
