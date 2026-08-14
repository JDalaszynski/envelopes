/**
 * Treści blogowe. Cel bloga jest wyłącznie SEO — ruch organiczny na frazy
 * związane z korespondencją firmową i kopertami ozdobnymi (pkt 1.7).
 *
 * Wpisy trzymane w kodzie i renderowane statycznie (SSG) — pełny HTML jest
 * dostępny dla Googlebota bez wykonywania JS (pkt 8.3). Jeśli treść ma być
 * zarządzana z Firestore, wystarczy podmienić `getAllPosts`/`getPost`
 * na odczyt serwerowy w `generateStaticParams` + `revalidate`.
 */

export const BLOG_CATEGORIES = ['Poradniki', 'Inspiracje', 'Realizacje', 'Aktualności'] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
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
  keywords: string[];
  intro: string;
  sections: BlogSection[];
  /** Kontekstowe CTA do konfiguratora */
  cta: string;
  /**
   * Strona ofertowa (filar klastra), do której wpis linkuje **w górę**.
   * Anchor jest frazą docelową filara — treść wspierająca przekazuje mu
   * autorytet, nigdy odwrotnie (pkt 5.4 briefu SEO).
   */
  pillar?: { href: string; anchor: string };
}

const POSTS: BlogPost[] = [
  {
    slug: 'jak-dobrac-koperte-do-zaproszen-firmowych',
    title: 'Jak dobrać kopertę do zaproszeń firmowych',
    lead: 'Format, gramatura i kolor decydują o tym, czy zaproszenie dotrze w nienagannym stanie i zrobi właściwe wrażenie. Praktyczny przewodnik po doborze koperty.',
    category: 'Poradniki',
    date: '2026-07-14',
    readingMinutes: 6,
    colorId: 'granatowy',
    format: 'C6',
    keywords: ['koperty na zaproszenia', 'zaproszenia firmowe', 'format koperty C6'],
    intro:
      'Zaproszenie na galę, konferencję czy jubileusz firmy jest pierwszym punktem styku odbiorcy z wydarzeniem. Koperta decyduje o tym, w jakim stanie dotrze i jakie wrażenie zrobi, zanim zostanie otwarta. Poniżej porządkujemy trzy decyzje, które warto podjąć w tej kolejności.',
    sections: [
      {
        id: 'format',
        heading: 'Punktem wyjścia jest format wkładki, nie koperta',
        paragraphs: [
          'Kolejność jest istotna: najpierw ustalamy wymiar zaproszenia, dopiero potem dobieramy kopertę. Koperta powinna być o 4–6 mm większa od wkładki w każdym wymiarze — zbyt ciasna utrudni wkładanie i zagnie rogi, zbyt luźna pozwoli zaproszeniu przemieszczać się w transporcie.',
          'Dla klasycznego zaproszenia w formacie A6 (105 × 148 mm) właściwym wyborem jest C6 (114 × 162 mm). Zaproszenia kwadratowe — coraz częstsze przy galach i wydarzeniach ślubnych — wymagają koperty K4 o wymiarach 155 × 155 mm.',
        ],
        list: [
          'Wkładka A6 → koperta C6 (114 × 162 mm)',
          'Wkładka DL, np. składany program → koperta DL (110 × 220 mm)',
          'Zaproszenie kwadratowe do 150 × 150 mm → koperta K4 (155 × 155 mm)',
        ],
      },
      {
        id: 'kolor',
        heading: 'Kolor: kontrast z nadrukiem ważniejszy niż moda',
        paragraphs: [
          'Kolor koperty najczęściej wybiera się pod identyfikację wizualną firmy, ale decydującym kryterium powinna być czytelność nadruku i adresu. Ciemne koperty (granatowy, czarny, butelkowa zieleń) wyglądają wyjątkowo dobrze ze złotym lub srebrnym nadrukiem, ale wymagają jasnego tuszu przy adresowaniu.',
          'Jasne odcienie — ecru, biały perłowy, błękitny — są bezpieczniejsze przy adresowaniu drukiem cyfrowym i lepiej znoszą sortowanie maszynowe w placówkach pocztowych.',
        ],
      },
      {
        id: 'nadruk',
        heading: 'Nadruk i adresowanie warto planować razem',
        paragraphs: [
          'Jeżeli zaproszenia mają być adresowane imiennie, warto zlecić nadruk i adresowanie w jednym zamówieniu. Pozwala to zachować spójność krojów pisma i uniknąć sytuacji, w której logotyp jest drukowany offsetowo, a adres dopisywany innym urządzeniem o odmiennym odcieniu czerni.',
          'Przy zamówieniach z nadrukiem obowiązuje minimalna ilość 10 sztuk. Adresowanie można zlecić na dwa sposoby: wpisując dane bezpośrednio w konfiguratorze albo pobierając szablon arkusza i wgrywając go z powrotem po uzupełnieniu.',
        ],
      },
      {
        id: 'terminy',
        heading: 'Terminy — liczone wstecz od daty wydarzenia',
        paragraphs: [
          'Przyjmuje się, że zaproszenia na wydarzenia firmowe wysyła się 4–6 tygodni przed terminem. Do tego doliczamy czas produkcji: realizacja standardowa zajmuje 5 dni roboczych, ekspresowa 2 dni robocze. W przypadku zamówień z nadrukiem należy dodatkowo uwzględnić czas na akceptację wizualizacji projektu.',
        ],
      },
    ],
    cta: 'Koperty DL 110 × 220 mm w 19 kolorach obejrzą Państwo w konfiguratorze, z ceną widoczną od razu.',
  },
  {
    slug: 'koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem',
    title: 'Koperty firmowe z nadrukiem — co przygotować przed zamówieniem',
    lead: 'Lista kontrolna plików, marginesów i danych, dzięki której zamówienie przechodzi przez akceptację projektu za pierwszym razem.',
    category: 'Poradniki',
    date: '2026-06-28',
    readingMinutes: 5,
    colorId: 'bialy',
    format: 'DL',
    /* Fraza `koperty z nadrukiem` należy do filara /koperty-z-nadrukiem —
       ten wpis obsługuje intencję procesową (przygotowanie plików). */
    keywords: ['pliki do druku na kopertach', 'nadruk na kopertach', 'przygotowanie logo do druku'],
    intro:
      'Najczęstszą przyczyną opóźnień w zamówieniach z nadrukiem nie jest produkcja, lecz wymiana korespondencji na temat plików. Ta lista skraca ten etap do minimum.',
    sections: [
      {
        id: 'pliki',
        heading: 'Format pliku ma znaczenie',
        paragraphs: [
          'Przyjmujemy pliki PDF, AI, EPS, CDR, PNG, JPG i SVG, do 10 MB i maksymalnie trzy załączniki na zamówienie. Najlepszym wyborem jest plik wektorowy (PDF, AI, EPS, SVG) — skaluje się bez utraty jakości i pozwala precyzyjnie odwzorować kolory.',
          'Jeśli dysponują Państwo wyłącznie plikiem rastrowym, powinien mieć rozdzielczość co najmniej 300 dpi w docelowym rozmiarze nadruku. Logotyp wyeksportowany ze strony internetowej niemal zawsze będzie za mały.',
        ],
        list: [
          'Wektory: PDF, AI, EPS, SVG — rekomendowane',
          'Rastry: PNG, JPG — minimum 300 dpi w skali 1:1',
          'Czcionki zamienione na krzywe',
          'Kolorystyka w CMYK lub z podanymi numerami Pantone',
        ],
      },
      {
        id: 'marginesy',
        heading: 'Marginesy i strefa bezpieczna',
        paragraphs: [
          'Nadruk nie powinien sięgać krawędzi koperty — zalecamy zachowanie co najmniej 5 mm marginesu od krawędzi oraz omijanie linii klejenia i zagięcia klapki. Elementy umieszczone zbyt blisko zgięcia mogą ulec deformacji.',
          'Jeżeli koperta ma okienko adresowe, prosimy o zaznaczenie jego położenia w pliku — pozwoli to uniknąć nadruku wchodzącego w obszar okienka.',
        ],
      },
      {
        id: 'akceptacja',
        heading: 'Akceptacja wizualizacji',
        paragraphs: [
          'Po złożeniu zamówienia z nadrukiem nasz grafik przygotowuje wizualizację produktu i przesyła ją e-mailem do akceptacji. Produkcja rusza dopiero po Państwa zatwierdzeniu — dzięki temu nie ma ryzyka wydrukowania 500 kopert z literówką w numerze telefonu.',
          'Jeśli wizualizacja wymaga poprawek, wystarczy zgłosić uwagi w tym samym widoku. Grafik przygotuje kolejną wersję, a historia wszystkich wersji pozostaje widoczna w panelu zamówienia.',
        ],
      },
    ],
    cta: 'Gotowy plik wgrywają Państwo w konfiguratorze i widzą cenę jeszcze przed złożeniem zamówienia.',
    pillar: { href: '/koperty-z-nadrukiem', anchor: 'koperty z nadrukiem' },
  },
  {
    slug: 'adresowanie-kopert-recznie-czy-z-arkusza',
    title: 'Adresowanie kopert: ręcznie czy z arkusza?',
    lead: 'Przy dziesięciu kopertach ręczne wpisanie danych jest szybsze. Przy trzystu — arkusz oszczędza godziny i eliminuje literówki.',
    category: 'Poradniki',
    date: '2026-06-10',
    readingMinutes: 4,
    colorId: 'ecru',
    format: 'DL',
    keywords: ['adresowanie kopert', 'personalizacja kopert', 'wysyłka korespondencji firmowej'],
    intro:
      'Personalizacja kopert to usługa, w której nadrukowujemy dane adresowe bezpośrednio na kopercie. Dostępne są dwie metody przekazania danych i wybór między nimi zależy głównie od skali wysyłki.',
    sections: [
      {
        id: 'recznie',
        heading: 'Wpisywanie ręczne — do kilkudziesięciu adresów',
        paragraphs: [
          'W konfiguratorze można wpisać komplety adresowe wprost w formularzu, dodając kolejne bloki pól. To wygodne rozwiązanie przy wysyłkach jednorazowych: zaproszeniach dla zarządu, korespondencji do wybranych kontrahentów, kartkach świątecznych dla kluczowych klientów.',
        ],
      },
      {
        id: 'arkusz',
        heading: 'Szablon arkusza — od stu adresów wzwyż',
        paragraphs: [
          'Konfigurator generuje arkusz Excel z liczbą wierszy odpowiadającą zamówionej ilości kopert. Wystarczy uzupełnić go poza systemem — często wystarczy wkleić dane z systemu CRM — i wgrać z powrotem. System sprawdza liczbę wypełnionych wierszy i sygnalizuje niezgodność z zamówioną ilością.',
          'Ta ścieżka ma dodatkową zaletę: arkusz można przekazać do sprawdzenia innej osobie w firmie przed wysłaniem zamówienia.',
        ],
        list: [
          'Do 30 adresów — wpisywanie ręczne bywa szybsze',
          'Powyżej 100 adresów — arkusz praktycznie bez alternatywy',
          'Dane w CRM lub systemie księgowym — zawsze arkusz',
        ],
      },
      {
        id: 'dane',
        heading: 'Jakość danych adresowych',
        paragraphs: [
          'Niezależnie od metody, warto przed wysłaniem zamówienia sprawdzić spójność zapisu kodów pocztowych oraz obecność numeru lokalu tam, gdzie jest wymagany. Adresowanie odtwarza dane dokładnie tak, jak zostały przekazane.',
        ],
      },
    ],
    cta: 'Metodę adresowania — wpisywanie ręczne albo arkusz — wybiorą Państwo w piątym kroku konfiguratora.',
  },
  {
    slug: 'paleta-19-kolorow-jak-wybrac-odcien-do-identyfikacji-firmy',
    title: 'Paleta 19 kolorów — jak wybrać odcień do identyfikacji firmy',
    lead: 'Przegląd całej palety z podpowiedzią, do jakich branż i zastosowań pasują poszczególne odcienie.',
    category: 'Inspiracje',
    date: '2026-05-22',
    readingMinutes: 5,
    colorId: 'matcha',
    format: 'C6',
    keywords: ['kolory kopert', 'koperty ozdobne', 'identyfikacja wizualna'],
    intro:
      'Wszystkie 19 kolorów kosztuje tyle samo w danym formacie, więc wybór jest wyłącznie decyzją estetyczną. To komfortowa sytuacja — ale przy takiej liczbie opcji przydaje się punkt zaczepienia.',
    sections: [
      {
        id: 'stonowane',
        heading: 'Odcienie stonowane — kancelarie, finanse, doradztwo',
        paragraphs: [
          'Granatowy, czarny, szarobrązowy i jeansowy budują wrażenie powagi i stabilności. Sprawdzają się w korespondencji formalnej, gdzie koperta ma sygnalizować wagę dokumentu, a nie przyciągać uwagę.',
        ],
      },
      {
        id: 'naturalne',
        heading: 'Odcienie naturalne — marki z profilem ekologicznym',
        paragraphs: [
          'Eko, ecru, matcha i zielony komunikują odpowiedzialność środowiskową bez deklaracji wprost. Koperta Eko wykonana jest z papieru z certyfikatem pochodzenia z recyklingu.',
        ],
      },
      {
        id: 'wyraziste',
        heading: 'Odcienie wyraziste i perłowe — wydarzenia i wysyłki premium',
        paragraphs: [
          'Złoty, biała perłowa, srebrna perłowa i czerwony sprawdzają się przy zaproszeniach, gratulacjach i wysyłkach okolicznościowych. Wykończenia perłowe efektownie reagują na światło, co wyróżnia przesyłkę w stosie korespondencji.',
        ],
      },
    ],
    cta: 'Pełną paletę 19 kolorów obejrzą Państwo w konfiguratorze, z podglądem wybranego odcienia na kopercie.',
  },
  {
    slug: 'realizacja-3000-kopert-dl-dla-kancelarii',
    title: 'Realizacja: 3 000 kopert DL dla kancelarii prawnej',
    lead: 'Studium przypadku wysyłki cyklicznej — jak wygląda proces od pierwszego zamówienia do powtarzalnej dostawy co kwartał.',
    category: 'Realizacje',
    date: '2026-04-18',
    readingMinutes: 4,
    colorId: 'granatowy',
    format: 'DL',
    keywords: ['koperty dla kancelarii', 'korespondencja firmowa', 'wysyłka cykliczna'],
    intro:
      'Kancelaria prowadząca stałą korespondencję z klientami potrzebowała rozwiązania powtarzalnego: tego samego odcienia, tego samego nadruku i przewidywalnego terminu dostawy co kwartał.',
    sections: [
      {
        id: 'wyzwanie',
        heading: 'Wyzwanie',
        paragraphs: [
          'Poprzedni dostawca realizował zamówienia z różnych partii papieru, przez co odcień granatu różnił się między dostawami. Przy korespondencji wychodzącej do tych samych odbiorców różnica była zauważalna.',
        ],
      },
      {
        id: 'rozwiazanie',
        heading: 'Rozwiązanie',
        paragraphs: [
          'Konfiguracja została zapisana w panelu klienta jako szablon. Każde kolejne zamówienie to jedno kliknięcie „Zamów ponownie" — z zachowaniem formatu, koloru, plików nadruku i czasu realizacji, przeliczone wg aktualnego cennika.',
          'Rozliczenie odbywa się fakturą z odroczonym terminem płatności, co pozwoliło kancelarii wpiąć wydatek w standardowy obieg dokumentów księgowych.',
        ],
      },
      {
        id: 'efekt',
        heading: 'Efekt',
        paragraphs: [
          'Zamówienie kwartalne zajmuje obecnie mniej niż minutę, a odcień pozostaje stały. Akceptacja wizualizacji jest wymagana tylko przy zmianie projektu nadruku.',
        ],
      },
    ],
    cta: 'Konto pozwala zapisać konfigurację jako szablon i powtórzyć zamówienie jednym kliknięciem.',
  },
  {
    slug: 'ekspresowa-realizacja-2-dni-robocze',
    title: 'Realizacja ekspresowa w 2 dni robocze — jak to działa',
    lead: 'Kiedy warto dopłacić za ekspres, a kiedy standardowe 5 dni roboczych w zupełności wystarczy.',
    category: 'Aktualności',
    date: '2026-03-30',
    readingMinutes: 3,
    colorId: 'czerwony',
    format: 'K4',
    keywords: ['szybka realizacja kopert', 'druk ekspresowy', 'koperty na już'],
    intro:
      'Do każdego zamówienia można wybrać czas realizacji: standardowy — 5 dni roboczych, bez dopłaty, albo ekspresowy — 2 dni robocze za dopłatą 1,50 zł brutto od sztuki.',
    sections: [
      {
        id: 'liczenie',
        heading: 'Od kiedy liczymy termin',
        paragraphs: [
          'Termin realizacji liczymy od momentu spełnienia dwóch warunków: zaksięgowania płatności oraz — w zamówieniach z nadrukiem lub personalizacją — akceptacji wizualizacji projektu. Przy płatności BLIK-iem lub kartą pierwszy warunek jest spełniony natychmiast.',
          'Przy przelewie tradycyjnym warto uwzględnić czas księgowania. Wizualizację przygotowujemy równolegle, jeszcze przed wpłatą, żeby po jej zaksięgowaniu produkcja mogła ruszyć bez zwłoki.',
        ],
      },
      {
        id: 'kiedy',
        heading: 'Kiedy ekspres ma sens',
        paragraphs: [
          'Ekspres uzasadniają wydarzenia z ustaloną datą i wysyłki, które muszą wyjść w konkretnym tygodniu. Przy zamówieniach uzupełniających zapas biurowy standardowy termin jest zwykle wystarczający, a przy większych wolumenach różnica w koszcie bywa istotna.',
        ],
      },
    ],
    cta: 'Czas realizacji — 5 dni roboczych albo 2 dni w ekspresie — wybiorą Państwo w szóstym kroku konfiguratora.',
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
