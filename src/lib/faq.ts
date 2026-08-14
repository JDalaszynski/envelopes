import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  INSERT_CLEARANCE_MM,
  PERSONALIZATION_REQUIRED_COLUMNS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  PRINT_FILE_EXTENSIONS_LABEL,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
  UPCOMING_FORMATS,
  fitsInFormat,
  maxInsertSize,
} from './catalog';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from './pricing';

export interface FaqItem {
  question: string;
  answer: string;
}

/** Cena netto pojedynczej pozycji — ta sama stawka VAT co w kalkulatorze. */
function net(gross: number): number {
  return round2(gross / (1 + DEFAULT_PRICING.vatRate));
}

const PLAIN_DL = DEFAULT_PRICING.base.DL;

/** Lista zapowiedzianych formatów w formie zdania: „C6 114 × 162 mm i K4 155 × 155 mm". */
const UPCOMING_LABEL = UPCOMING_FORMATS.map((f) => `${f.id} ${f.dimensions}`).join(' i ');

/**
 * FAQ ze strony głównej — jedno źródło dla akordeonu i danych
 * strukturalnych FAQPage (pkt 6.1 i 8.3).
 *
 * Zakres tematyczny jest celowo rozdzielony z `PRINT_FAQ_ITEMS`
 * (`/koperty-z-nadrukiem`): tutaj odpowiadamy na pytania o kopertę ozdobną
 * jako produkt — czym jest, ile kosztuje, jakie formaty i kolory są dostępne,
 * jak wygląda rozliczenie. Pytania czysto drukarskie (pliki, marginesy, cena
 * nadruku) należą do filara i nie powielamy ich tutaj, żeby dwa adresy nie
 * konkurowały o ten sam wynik rozszerzony.
 *
 * Wszystkie liczby liczone są z `pricing.ts` i `catalog.ts` — zmiana cennika
 * przepisuje treść FAQ i JSON-LD bez ręcznej korekty.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Czym są koperty ozdobne?',
    answer: `Koperty ozdobne to koperty z papieru barwionego w masie, używane zamiast standardowej białej koperty pocztowej wtedy, gdy przesyłka ma budować wizerunek nadawcy. W Envelopes koperta ozdobna ma format DL ${FORMAT_MAP.DL.dimensions}, gramaturę 115–140 g/m² i nie ma okienka adresowego. Do wyboru jest ${COLORS.length} kolorów, w tym wykończenia perłowe, metaliczne i papier eko.`,
  },
  {
    question: 'Ile kosztuje koperta ozdobna?',
    answer: `Koperta ozdobna DL ${FORMAT_MAP.DL.dimensions} kosztuje ${formatPrice(PLAIN_DL)} brutto (${formatPrice(net(PLAIN_DL))} netto) za sztukę. Cena jest identyczna we wszystkich ${COLORS.length} kolorach — za wykończenie perłowe, metaliczne i papier eko nie ma dopłaty. Rabatów ilościowych nie stosujemy, więc cena jednostkowa przy 10 i przy 1 000 sztuk jest taka sama.`,
  },
  {
    question: 'Czy mogę zamówić tylko 1 kopertę?',
    answer: `Tak. Koperty gładkie, bez nadruku i personalizacji, zamawiają Państwo już od ${DEFAULT_PRICING.moqWithoutPrint} sztuki. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk obowiązuje wyłącznie wtedy, gdy zamówienie obejmuje nadruk logo lub personalizację.`,
  },
  {
    question: 'Jakie formaty kopert są dostępne w Envelopes?',
    answer: `W sprzedaży jest dziś jeden format: koperta DL ${FORMAT_MAP.DL.dimensions}. Formaty ${UPCOMING_LABEL} mają w katalogu status „Dostępne wkrótce" i nie można ich zamówić — ani gładkich, ani z nadrukiem. Format DL mieści kartkę A4 złożoną na trzy, czyli 99 × 210 mm, oraz voucher w tym samym wymiarze.`,
  },
  {
    question: 'Ile trwa realizacja zamówienia?',
    answer: `Koperty gładkie wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze — nie przechodzą przez produkcję, więc nie ma za co dopłacać. Zamówienia z nadrukiem lub personalizacją realizujemy w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w ${DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą ${formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Termin liczymy od zaksięgowania wpłaty, a przy nadruku dodatkowo od akceptacji wizualizacji.`,
  },
  {
    question: 'Jak wygląda akceptacja projektu z nadrukiem?',
    answer:
      'Po złożeniu zamówienia z nadrukiem lub personalizacją nasz grafik przygotowuje wizualizację produktu i przesyła ją e-mailem. Zamówienie otrzymuje status „Czeka na akceptację". Po zatwierdzeniu projektu kierujemy zamówienie do druku; jeśli mają Państwo uwagi, grafik przygotuje kolejną wersję. Zamówienia bez nadruku i personalizacji pomijają ten krok całkowicie.',
  },
  {
    question: 'Ile kosztuje dostawa kopert?',
    answer: `Dostawa kurierem kosztuje ${formatPrice(DELIVERY_COST)} brutto (${formatPrice(net(DELIVERY_COST))} netto) i jest naliczana raz na zamówienie, niezależnie od liczby kopert. Nie prowadzimy odbioru osobistego — Envelopes sprzedaje wyłącznie wysyłkowo, na terenie Polski.`,
  },
  {
    question: 'Czy wystawiacie faktury VAT i fakturę z odroczonym terminem?',
    answer:
      'Do każdego zamówienia wystawiamy fakturę VAT, także przy zakupie bez numeru NIP. Płatność fakturą z odroczonym terminem 14 dni jest dostępna przy każdym zamówieniu — z myślą o instytucjach i jednostkach budżetowych, których obieg zakupowy nie przewiduje przedpłaty. Produkcja rusza wtedy bez oczekiwania na wpłatę.',
  },
  {
    question: 'Mam zamówienie na dużą ilość — jak je wycenić?',
    answer: `Cena jednostkowa jest stała niezależnie od wielkości zamówienia, więc koszt sprawdzą Państwo w konfiguratorze dla dowolnej ilości. Przy zamówieniach powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk prosimy o kontakt przez formularz wyceny — ustalimy harmonogram dostaw i sposób rozliczenia.`,
  },
];

/* ── FAQ filara „Koperty z nadrukiem" (/koperty-z-nadrukiem) ──────────── */

/** Koperta DL z nadrukiem — jedna sztuka, tryb standardowy. */
const PRINTED_DL = calculatePrice({
  format: 'DL',
  color: '',
  quantity: 1,
  print: true,
  printFiles: [],
  personalization: false,
  shippingSpeed: 'standard',
});

const PRINT_FILE_MAX_MB = Math.round(PRINT_FILE_MAX_BYTES / (1024 * 1024));

/**
 * Pytania zadawane modelom językowym wprost („ile kosztuje nadruk logo na
 * kopertach", „ile trwa druk kopert z logo") — sekcja „Luki" w keywords.md.
 * Odpowiedzi są samowystarczalne: każda ma sens wyrwana z kontekstu strony,
 * bo dokładnie tak trafia do odpowiedzi generatywnej.
 *
 * Liczby pochodzą z `pricing.ts` i `catalog.ts` — zmiana cennika przepisuje
 * treść FAQ i dane strukturalne FAQPage bez ręcznej korekty.
 */
export const PRINT_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Ile kosztuje nadruk logo na kopertach?',
    answer: `Nadruk logo kosztuje ${formatPrice(DEFAULT_PRICING.print)} brutto za sztukę i doliczamy go do ceny koperty. Koperta DL ${FORMAT_MAP.DL.dimensions} kosztuje ${formatPrice(DEFAULT_PRICING.base.DL)} brutto, więc koperta DL z nadrukiem to ${formatPrice(PRINTED_DL.unitTotal)} brutto (${formatPrice(PRINTED_DL.net)} netto) za sztukę. Cena jest identyczna we wszystkich 19 kolorach — nadruk na czarnej kopercie kosztuje tyle samo, co na białej.`,
  },
  {
    question: 'Ile kopert z nadrukiem trzeba zamówić minimalnie?',
    answer: `Minimalna ilość przy nadruku to ${DEFAULT_PRICING.moqWithPrint} sztuk. Próg wynika z kosztu przygotowania druku, który jest taki sam dla 5 i dla 500 kopert. Koperty gładkie, bez nadruku, zamawiają Państwo już od ${DEFAULT_PRICING.moqWithoutPrint} sztuki.`,
  },
  {
    question: 'Ile trwa druk kopert z logo?',
    answer: `Koperty z nadrukiem wysyłamy w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych w trybie standardowym albo w ${DEFAULT_PRICING.leadDaysExpress} dni roboczych w trybie ekspresowym za dopłatą ${formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Termin liczymy od zaksięgowania wpłaty oraz od akceptacji wizualizacji przez Państwa — to dwa warunki, które muszą być spełnione łącznie.`,
  },
  {
    question: 'Jakie pliki przyjmujemy do nadruku na kopertach?',
    answer: `Przyjmujemy pliki ${PRINT_FILE_EXTENSIONS_LABEL} — do ${PRINT_FILE_MAX_MB} MB każdy, maksymalnie ${PRINT_FILE_MAX_COUNT} załączniki na zamówienie. Rekomendujemy plik wektorowy z czcionkami zamienionymi na krzywe. Plik rastrowy powinien mieć co najmniej 300 dpi w docelowym rozmiarze nadruku, a grafika — 5 mm marginesu od krawędzi koperty.`,
  },
  {
    question: 'Czy zobaczę projekt przed drukiem kopert?',
    answer:
      'Tak. Po złożeniu zamówienia z nadrukiem nasz grafik przygotowuje wizualizację koperty i przesyła ją e-mailem. Zamówienie czeka w statusie „Czeka na akceptację" do momentu, aż zatwierdzą Państwo projekt. Uwagi zgłaszają Państwo w tym samym widoku, a grafik przygotowuje kolejną wersję — do druku trafia wyłącznie wersja zaakceptowana.',
  },
  {
    question: 'Czy nadruk jest dostępny na formatach C6 i K4?',
    answer: `Nadruk wykonujemy dziś wyłącznie na kopertach DL ${FORMAT_MAP.DL.dimensions}. Formaty C6 ${FORMAT_MAP.C6.dimensions} i K4 ${FORMAT_MAP.K4.dimensions} mają w katalogu Envelopes status „Dostępne wkrótce" i nie można ich zamówić — ani gładkich, ani z nadrukiem.`,
  },
];

/* ── FAQ filara „Koperty DL" (/koperty-dl) ────────────────────────────── */

const DL_FORMAT = FORMAT_MAP.DL;
const DL_MAX_INSERT = maxInsertSize(DL_FORMAT);

/** Arkusz A4 złożony na trzy — 297 mm / 3 = 99 mm, stąd 99 × 210 mm. */
const A4_IN_THREE = { width: 99, height: 210 };
const A4_IN_THREE_FIT = fitsInFormat(A4_IN_THREE, DL_FORMAT);

/** Różnica wymiarów DL względem C6 — liczona, nie wpisana ręcznie. */
const DL_VS_C6 = {
  longer: DL_FORMAT.height - FORMAT_MAP.C6.height,
  narrower: FORMAT_MAP.C6.width - DL_FORMAT.width,
};

/** Wymiary formatu w centymetrach — „11 × 22 cm" obok „110 × 220 mm". */
function dimensionsInCm(width: number, height: number): string {
  const cm = (mm: number) => (mm / 10).toFixed(1).replace('.0', '').replace('.', ',');
  return `${cm(width)} × ${cm(height)} cm`;
}

/**
 * Pytania o wymiary i dopasowanie formatu DL — klaster K4 (keywords.md),
 * czyli zapytania o fakty: „jakie wymiary ma koperta DL", „czy A4 zmieści
 * się w kopercie DL", „czym różni się koperta DL od C6". To najczęściej
 * cytowany typ treści w odpowiedziach generatywnych, bo odpowiedź jest
 * jednoznaczna i weryfikowalna.
 *
 * Zakres jest rozdzielony z `FAQ_ITEMS` (strona główna): tam pytania
 * o produkt i zakup — czym jest koperta ozdobna, ile kosztuje, jaka
 * dostawa, jakie rozliczenie. Tutaj wyłącznie geometria formatu i to,
 * co się w nim mieści. Pytania cenowe świadomie **nie występują**, żeby
 * dwa adresy nie konkurowały o ten sam wynik rozszerzony.
 *
 * Wymiary czytamy z `catalog.ts`, a dopasowanie liczy `maxInsertSize()`
 * z zalecanego zapasu — zmiana formatu przepisuje odpowiedzi i JSON-LD.
 */
export const DL_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Jakie wymiary ma koperta DL?',
    answer: `Koperta DL ma wymiary ${DL_FORMAT.dimensions}, czyli ${dimensionsInCm(DL_FORMAT.width, DL_FORMAT.height)}. To koperta prostokątna, podłużna, o dłuższym boku ${DL_FORMAT.height} mm — wymiar odpowiada arkuszowi A4 złożonemu na trzy. DL jest formatem znormalizowanym, więc koperta ma ten sam wymiar niezależnie od producenta. W Envelopes format DL dostępny jest w ${COLORS.length} kolorach papieru ozdobnego.`,
  },
  {
    question: 'Czy kartka A4 zmieści się w kopercie DL?',
    answer: `Kartka A4 mieści się w kopercie DL po złożeniu na trzy — arkusz 210 × 297 mm zmienia się wtedy w ${A4_IN_THREE.width} × ${A4_IN_THREE.height} mm i wchodzi do koperty ${DL_FORMAT.dimensions} z zapasem ${A4_IN_THREE_FIT.clearanceShort} mm na szerokości i ${A4_IN_THREE_FIT.clearanceLong} mm na długości. Arkusza A4 rozłożonego płasko ani złożonego na pół, czyli 148 × 210 mm, do koperty DL nie da się włożyć: obie wersje są za szerokie.`,
  },
  {
    question: 'Jaka jest największa wkładka mieszcząca się w kopercie DL?',
    answer: `Największa wkładka do koperty DL ${DL_FORMAT.dimensions} to ${DL_MAX_INSERT.short} × ${DL_MAX_INSERT.long} mm. Zostawiamy ${INSERT_CLEARANCE_MM} mm zapasu w każdym wymiarze, żeby wkładka wchodziła bez zaginania rogów i nie blokowała klapki. Wkładka o wymiarach dokładnie równych kopercie zmieści się tylko teoretycznie — w praktyce niszczy się przy wsuwaniu.`,
  },
  {
    question: 'Czym różni się koperta DL od koperty C6?',
    answer: `Koperta DL ma wymiary ${DL_FORMAT.dimensions}, a koperta C6 — ${FORMAT_MAP.C6.dimensions}. DL jest o ${DL_VS_C6.longer} mm dłuższa i o ${DL_VS_C6.narrower} mm węższa, więc mieści arkusz A4 złożony na trzy (${A4_IN_THREE.width} × ${A4_IN_THREE.height} mm), którego C6 nie przyjmie. C6 jest formatem pod kartkę A6 105 × 148 mm, czyli pod zaproszenia i kartki okolicznościowe. W sprzedaży w Envelopes jest dziś wyłącznie format DL; C6 ma w katalogu status „Dostępne wkrótce".`,
  },
  {
    question: 'Czy koperty DL mają okienko adresowe?',
    answer: 'Nie. Wszystkie koperty DL w Envelopes są bez okienka adresowego — przednia ścianka jest jednolitą płaszczyzną papieru barwionego w masie. Dane odbiorcy drukujemy wprost na papierze albo pozostawiamy kopertę gładką. Brak okienka oznacza też, że nadruk logo może objąć całą przednią ściankę z zachowaniem 5 mm marginesu od krawędzi.',
  },
  {
    question: 'Czy w kopercie DL zmieści się banknot?',
    answer: `Tak, każdy banknot w obiegu mieści się w kopercie DL płasko, bez składania. Największy polski banknot to 500 zł o wymiarach 150 × 75 mm, a największa wkładka do koperty DL ${DL_FORMAT.dimensions} to ${DL_MAX_INSERT.short} × ${DL_MAX_INSERT.long} mm. Banknot 200 zł mierzy 144 × 72 mm, a 100 zł — 138 × 69 mm.`,
  },
  {
    question: 'Do czego używa się koperty DL?',
    answer: `Koperty DL ${DL_FORMAT.dimensions} używa się przede wszystkim do korespondencji firmowej: pism, umów, faktur i certyfikatów w formacie A4 składanym na trzy. Drugie najczęstsze zastosowanie to vouchery i bony podarunkowe drukowane w wymiarze ${A4_IN_THREE.width} × ${A4_IN_THREE.height} mm. Format sprawdza się też przy kartach powitalnych w hotelach, decyzjach kadrowych i przekazywaniu banknotów bez składania.`,
  },
];

/* ── FAQ filara „Personalizowane koperty" (/koperty-personalizowane) ──── */

/** Koperta DL z personalizacją — jedna sztuka, tryb standardowy. */
const PERSONALIZED_DL = calculatePrice({
  format: 'DL',
  color: '',
  quantity: 1,
  print: false,
  printFiles: [],
  personalization: true,
  shippingSpeed: 'standard',
});

/** Koperta DL z nadrukiem logo i personalizacją jednocześnie. */
const PRINTED_PERSONALIZED_DL = calculatePrice({
  format: 'DL',
  color: '',
  quantity: 1,
  print: true,
  printFiles: [],
  personalization: true,
  shippingSpeed: 'standard',
});

/** Wymagane kolumny arkusza wypisane zdaniem: „ulica i numer, kod pocztowy…". */
const REQUIRED_COLUMNS_LABEL = PERSONALIZATION_REQUIRED_COLUMNS.map((column) =>
  column.label.toLowerCase()
).join(', ');

/**
 * Pytania o personalizację i adresowanie kopert — klaster K2 (keywords.md).
 * Zakres jest rozdzielony z `PRINT_FAQ_ITEMS`: tam pytania o nadruk logo,
 * tutaj o zmienne dane odbiorcy, arkusz adresowy i różnicę między obiema
 * usługami. Żadne pytanie nie powtarza się między stronami, bo dwa adresy
 * nie mogą konkurować o ten sam wynik rozszerzony.
 */
export const PERSONALIZATION_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Ile kosztuje personalizacja kopert?',
    answer: `Personalizacja kosztuje ${formatPrice(DEFAULT_PRICING.personalization)} brutto za sztukę i doliczamy ją do ceny koperty. Koperta DL ${FORMAT_MAP.DL.dimensions} kosztuje ${formatPrice(PLAIN_DL)} brutto, więc personalizowana koperta DL to ${formatPrice(PERSONALIZED_DL.unitTotal)} brutto (${formatPrice(PERSONALIZED_DL.net)} netto) za sztukę. Cena jest identyczna we wszystkich ${COLORS.length} kolorach i nie zależy od długości nadrukowanego tekstu.`,
  },
  {
    question: 'Czym różni się personalizacja od nadruku logo?',
    answer: `Nadruk logo powtarza ten sam projekt na całym nakładzie i kosztuje ${formatPrice(DEFAULT_PRICING.print)} brutto za sztukę. Personalizacja drukuje na każdej kopercie inne dane — imię i nazwisko, adres odbiorcy albo dedykację — i kosztuje ${formatPrice(DEFAULT_PRICING.personalization)} brutto za sztukę. Obie usługi można połączyć w jednym zamówieniu: koperta DL z logo firmowym i adresem odbiorcy kosztuje ${formatPrice(PRINTED_PERSONALIZED_DL.unitTotal)} brutto za sztukę.`,
  },
  {
    question: 'Ile kopert z personalizacją trzeba zamówić minimalnie?',
    answer: `Minimalna ilość przy personalizacji to ${DEFAULT_PRICING.moqWithPrint} sztuk — tyle samo, co przy nadruku logo. Próg wynika z kosztu przygotowania produkcji, który jest taki sam dla 5 i dla 500 kopert. Koperty gładkie, bez nadruku i bez adresowania, zamawiają Państwo już od ${DEFAULT_PRICING.moqWithoutPrint} sztuki.`,
  },
  {
    question: 'W jaki sposób przekazać listę adresów do zadrukowania?',
    answer: `Dane przekazują Państwo na dwa sposoby. Pierwszy: wpisanie treści wprost w konfiguratorze — wygodne przy krótkim tekście i kilkudziesięciu kopertach. Drugi: pobranie szablonu Excel, który konfigurator generuje z liczbą wierszy równą zamówionej ilości kopert, i wgranie uzupełnionego pliku z powrotem. Przyjmujemy pliki ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}, a liczba wypełnionych wierszy musi zgadzać się z liczbą zamówionych kopert.`,
  },
  {
    question: 'Jakie dane są wymagane w arkuszu adresowym?',
    answer: `W każdym wierszu wymagamy trzech pól: ${REQUIRED_COLUMNS_LABEL}. Odbiorcę identyfikuje imię i nazwisko albo nazwa firmy — wystarczy jedno z nich, ale wiersz bez obu traktujemy jako pusty. Kolumny „Firma (opcjonalnie)" i „Kraj" można zostawić bez zmian. Braki wychwytujemy przy wgrywaniu pliku i wskazujemy liczbę niekompletnych wierszy, zanim zamówienie trafi do produkcji.`,
  },
  {
    question: 'Ile trwa realizacja kopert z personalizacją?',
    answer: `Koperty z personalizacją wysyłamy w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w ${DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą ${formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Termin liczymy od zaksięgowania wpłaty oraz od akceptacji wizualizacji — to dwa warunki, które muszą być spełnione łącznie. Koperty gładkie, bez adresowania, wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze.`,
  },
  {
    question: 'Czy zobaczę projekt personalizowanej koperty przed drukiem?',
    answer:
      'Tak. Po złożeniu zamówienia z personalizacją nasz grafik przygotowuje wizualizację koperty z danymi odbiorcy i przesyła ją e-mailem. Zamówienie czeka w statusie „Czeka na akceptację" do momentu, aż zatwierdzą Państwo projekt. Tekst odtwarzamy dokładnie w postaci, w jakiej został przekazany — literówka w arkuszu zostanie wydrukowana, dlatego akceptacja wizualizacji jest ostatnim momentem na korektę.',
  },
];
