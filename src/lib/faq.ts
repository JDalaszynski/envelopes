import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  PRINT_FILE_EXTENSIONS_LABEL,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
  UPCOMING_FORMATS,
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
