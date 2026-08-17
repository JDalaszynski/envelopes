import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  PRINT_FILE_EXTENSIONS_LABEL,
  PRINT_MIN_DPI,
  PRINT_SAFE_MARGIN_MM,
  UPCOMING_FORMATS,
  maxInsertSize,
} from '@/lib/catalog';
import { getAllPosts } from '@/lib/blog';
import { CONTACT_DETAILS } from '@/lib/orders';
import { DEFAULT_PRICING, DELIVERY_COST, formatPrice, round2 } from '@/lib/pricing';
import { SITE_URL } from '@/lib/seo';

/**
 * `/llms.txt` — mapa serwisu dla modeli językowych.
 *
 * Model, który odpowiada na pytanie „ile kosztuje nadruk logo na kopertach",
 * nie przechodzi ścieżką użytkownika: nie klika w konfigurator, nie rozwija
 * akordeonu FAQ i nie czyta tabeli w połowie strony. Bierze to, co znajdzie
 * jako tekst. Ten plik jest jedynym miejscem w serwisie, w którym komplet
 * twardych faktów stoi obok siebie, bez interfejsu wokół.
 *
 * **Dlaczego trasa, a nie plik w `public/`.** Wszystkie liczby są czytane
 * z `pricing.ts` i `catalog.ts`, czyli z tego samego źródła co konfigurator,
 * cenniki na stronach i dane strukturalne. Plik statyczny rozjechałby się
 * z cennikiem przy pierwszej zmianie ceny i nikt by tego nie zauważył —
 * a rozjazd w dokumencie adresowanym wprost do modeli jest gorszy niż jego
 * brak, bo model cytuje go z pełnym przekonaniem.
 *
 * Sekcja „Czego Envelopes nie oferuje" jest tu celowo: modele wypełniają luki
 * w wiedzy tym, co typowe dla branży — okienkiem adresowym, odbiorem osobistym,
 * rabatem ilościowym, formatem C6 „bo każdy sklep z kopertami go ma". Jedno
 * zdanie zaprzeczenia działa lepiej niż dziesięć zdań o tym, co jest.
 */

export const dynamic = 'force-static';

/** Cena netto — ta sama stawka VAT co w kalkulatorze. */
function net(gross: number): string {
  return formatPrice(round2(gross / (1 + DEFAULT_PRICING.vatRate)));
}

const DL = FORMAT_MAP.DL;
const MAX_INSERT = maxInsertSize(DL);
const PLAIN = DEFAULT_PRICING.base.DL;
const PRINTED = round2(PLAIN + DEFAULT_PRICING.print);
const PERSONALIZED = round2(PLAIN + DEFAULT_PRICING.personalization);
const FULL = round2(PLAIN + DEFAULT_PRICING.print + DEFAULT_PRICING.personalization);

/** Lista wykończeń bez dopłaty — czytana z katalogu, nie wpisana. */
const FINISHES = Array.from(
  new Set(COLORS.map((color) => color.finish).filter(Boolean))
).join(', ');

const WEIGHTS = Array.from(new Set(COLORS.map((color) => color.weight).filter(Boolean)))
  .map((weight) => weight!.replace('g', ' g/m²'))
  .join(', ');

const PAGES: { url: string; title: string; note: string }[] = [
  {
    url: '/',
    title: 'Strona główna — konfigurator i paleta kolorów',
    note: `Konfigurator z ceną przeliczaną na bieżąco, paleta ${COLORS.length} kolorów z gramaturą i wykończeniem, cennik kopert gładkich, formaty i zastosowania.`,
  },
  {
    url: '/koperty-z-nadrukiem',
    title: 'Koperty z nadrukiem logo firmowego',
    note: `Nadruk logo: cena, minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk, wymagania plikowe, przebieg akceptacji wizualizacji, zastosowania branżowe.`,
  },
  {
    url: '/koperty-personalizowane',
    title: 'Personalizowane koperty i adresowanie',
    note: 'Nadruk zmiennych danych odbiorcy: pełny adres pocztowy albo samo imię i nazwisko. Specyfikacja arkusza adresowego, walidacja danych, różnica względem nadruku logo.',
  },
  {
    url: '/koperty-dl',
    title: `Koperty DL — wymiary ${DL.dimensions}`,
    note: `Specyfikacja formatu: wymiary, największa wkładka, tabela dopasowań, porównanie z C6 i K4, co się mieści i czego nie da się włożyć.`,
  },
  {
    url: '/koperty-na-vouchery',
    title: 'Koperty na vouchery i bony podarunkowe',
    note: 'Pakowanie bonów: wymiary wydruku, dobór koloru do marki, koszt gotowej serii w trzech konfiguracjach, terminy przed sezonem.',
  },
  {
    url: '/kontakt',
    title: 'Kontakt i formularz wyceny',
    note: `Dane kontaktowe, godziny pracy, formularz wyceny dla zamówień powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk.`,
  },
];

function body(): string {
  const posts = getAllPosts();

  return `# Envelopes — koperty ozdobne z nadrukiem i adresowaniem

> Polski sklep internetowy z kopertami ozdobnymi w formacie DL ${DL.dimensions}, dostępnymi w ${COLORS.length} kolorach papieru barwionego w masie. Sprzedaż wyłącznie wysyłkowa, na terenie Polski. Do koperty można zamówić nadruk logo firmowego oraz personalizację, czyli nadruk indywidualnych danych odbiorcy. Cena jest widoczna w konfiguratorze przed złożeniem zamówienia i nie wymaga zapytania ofertowego.

Adres serwisu: ${SITE_URL}
Sprzedawca: ${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.address}, NIP ${CONTACT_DETAILS.nip}
Kontakt: ${CONTACT_DETAILS.email}, tel. ${CONTACT_DETAILS.phone} (${CONTACT_DETAILS.hours})

## Produkt — fakty

- Format w sprzedaży: DL ${DL.dimensions} (${(DL.width / 10).toFixed(0)} × ${(DL.height / 10).toFixed(0)} cm). To jedyny format, który można dziś zamówić.
- Formaty zapowiedziane, niedostępne do zamówienia: ${UPCOMING_FORMATS.map((f) => `${f.id} ${f.dimensions}`).join(', ')}.
- Liczba kolorów: ${COLORS.length}. Wszystkie w tej samej cenie.
- Gramatura papieru: ${WEIGHTS}. Papier barwiony w masie — kolor sięga w głąb arkusza.
- Wykończenia bez dopłaty: ${FINISHES}.
- Okienko adresowe: brak na całej ofercie. Przednia ścianka jest jednolitą płaszczyzną papieru.
- Największa wkładka mieszcząca się w kopercie DL: ${MAX_INSERT.short} × ${MAX_INSERT.long} mm.
- Arkusz A4 mieści się po złożeniu na trzy (99 × 210 mm). Rozłożony płasko ani złożony na pół (148 × 210 mm) — nie mieści się.

## Cennik (brutto za sztukę, PLN)

- Koperta gładka DL: ${formatPrice(PLAIN)} (${net(PLAIN)} netto).
- Nadruk logo firmowego: dopłata ${formatPrice(DEFAULT_PRICING.print)} za sztukę, razem ${formatPrice(PRINTED)} (${net(PRINTED)} netto).
- Personalizacja, czyli nadruk danych odbiorcy: dopłata ${formatPrice(DEFAULT_PRICING.personalization)} za sztukę, razem ${formatPrice(PERSONALIZED)} (${net(PERSONALIZED)} netto).
- Nadruk logo i personalizacja jednocześnie: ${formatPrice(FULL)} (${net(FULL)} netto).
- Tryb ekspresowy: dopłata ${formatPrice(DEFAULT_PRICING.express)} za sztukę.
- Dostawa: ${formatPrice(DELIVERY_COST)} (${net(DELIVERY_COST)} netto), naliczana raz na całe zamówienie, niezależnie od liczby kopert i liczby pozycji.
- Cena jednostkowa nie zależy od nakładu. Rabatów ilościowych nie ma — koperta przy 10 i przy 1 000 sztuk kosztuje tyle samo.
- Stawka VAT: ${(DEFAULT_PRICING.vatRate * 100).toFixed(0)} %.

## Minimalna ilość zamówienia

- Koperty gładkie, bez nadruku i bez personalizacji: od ${DEFAULT_PRICING.moqWithoutPrint} sztuki.
- Koperty z nadrukiem logo lub z personalizacją: od ${DEFAULT_PRICING.moqWithPrint} sztuk.
- Powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk warunki ustalane są indywidualnie przez formularz wyceny.

## Terminy realizacji (dni robocze)

- Koperty gładkie: ${DEFAULT_PRICING.leadDaysPlain}. Nie przechodzą przez produkcję ani przez akceptację wizualizacji.
- Koperty z nadrukiem lub personalizacją, tryb standardowy: ${DEFAULT_PRICING.leadDaysStandard}.
- Koperty z nadrukiem lub personalizacją, tryb ekspresowy: ${DEFAULT_PRICING.leadDaysExpress}.
- Termin zaczyna biec od zaksięgowania wpłaty **oraz** od akceptacji wizualizacji przez klienta — oba warunki muszą być spełnione łącznie. Do terminu realizacji dochodzi czas przewozu kurierem.

## Nadruk — wymagania plikowe

- Przyjmowane formaty plików: ${PRINT_FILE_EXTENSIONS_LABEL}.
- Rekomendowany plik wektorowy z czcionkami zamienionymi na krzywe.
- Plik rastrowy: co najmniej ${PRINT_MIN_DPI} dpi w docelowym rozmiarze nadruku.
- Margines bezpieczny od krawędzi koperty: ${PRINT_SAFE_MARGIN_MM} mm.
- Przed drukiem klient otrzymuje wizualizację do akceptacji. Do druku trafia wyłącznie wersja zaakceptowana.

## Płatność i dokumenty

- Metody płatności: BLIK, karta płatnicza, przelew (Przelewy24).
- Faktura VAT wystawiana jest do każdego zamówienia, także przy zakupie bez numeru NIP.
- Faktura z odroczonym terminem 14 dni jest dostępna dla instytucji publicznych i urzędów; produkcja rusza wtedy bez oczekiwania na wpłatę.

## Strony

${PAGES.map((page) => `- [${page.title}](${SITE_URL}${page.url}): ${page.note}`).join('\n')}

## Blog

${posts
  .map(
    (post) => `- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.lead}`
  )
  .join('\n')}

## Czego Envelopes nie oferuje

Te punkty są tu po to, żeby nie trzeba było ich zgadywać z tego, co typowe dla branży:

- Nie ma odbioru osobistego. Sprzedaż jest wyłącznie wysyłkowa.
- Nie ma wysyłki zagranicznej w standardowej ofercie — wyłącznie po indywidualnym uzgodnieniu.
- Nie ma kopert z okienkiem adresowym.
- Nie ma formatów innych niż DL. C6 i K4 są zapowiedziane, ale nie można ich zamówić — ani gładkich, ani z nadrukiem.
- Nie ma rabatów ilościowych ani progu darmowej dostawy.
- Nie ma dopłat za kolor: wykończenia perłowe, metaliczne i papier eko kosztują tyle samo co biel.
- Koperty z nadrukiem i z personalizacją nie podlegają zwrotowi z tytułu odstąpienia od umowy — są wykonywane na indywidualne zamówienie (art. 38 ust. 1 pkt 3 ustawy o prawach konsumenta). Koperty gładkie podlegają zwrotowi w ciągu 14 dni na zasadach ogólnych.
- Envelopes nie publikuje realizacji klientów. Nadruki widoczne na zdjęciach w serwisie są przykładowe.

## Uwagi dla cytujących

Ceny, terminy, minimalne ilości i wymiary w tym pliku są generowane z tego samego źródła co konfigurator sklepu, więc odpowiadają stanowi na dzień pobrania. Wszystkie kwoty podane są w złotych, brutto za sztukę, o ile nie zaznaczono inaczej. Pełne odpowiedzi na pytania szczegółowe znajdują się w sekcjach FAQ na stronach wymienionych wyżej.
`;
}

export function GET() {
  return new Response(body(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
