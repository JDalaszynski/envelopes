/**
 * Data ostatniej zmiany treści, osobno dla każdej trasy statycznej.
 *
 * Wartości są wpisane ręcznie i pochodzą z „Dziennika wdrożeń"
 * w `content-plan.md` — to jedyne miejsce w projekcie, które wie, kiedy
 * treść danej strony faktycznie się zmieniła. **Publikacja zmiany na stronie
 * wymaga podbicia daty tutaj.**
 *
 * Odrzucone alternatywy: czas modyfikacji pliku źródłowego (`mtime`) jest
 * na hostingu równy chwili pobrania repozytorium, więc wszystkie strony
 * dostałyby jedną datę wdrożenia — sygnał nieprawdziwy i w dodatku zmieniający
 * się przy każdym deployu bez zmiany treści. Data budowania ma tę samą wadę.
 * Google traktuje niewiarygodny `lastmod` jako powód, żeby przestać go czytać
 * dla całej domeny, więc lepszy jest wpis ręczny niż automat, który kłamie.
 *
 * **Dlaczego osobny moduł, a nie stała w `sitemap.ts`.** Ta sama data zasila
 * dziś dwa wyjścia: `lastmod` w sitemapie i `dateModified` w węźle `WebPage`
 * danych strukturalnych (`webPageJsonLd` w `seo.ts`). Rozjazd między nimi jest
 * gorszy niż brak drugiego pola — wyszukiwarka dostałaby dwie różne odpowiedzi
 * na to samo pytanie, z tej samej domeny. Rejestr stoi więc poza obydwoma
 * konsumentami, w `lib/`, i nie należy do żadnego z nich.
 *
 * Trasy spoza rejestru (blog) datę mają w samej treści — wpis niesie `date`
 * i `updated`, więc nie ma czego tu powielać.
 */
export const PAGE_UPDATED: Record<string, string> = {
  /* 15 września 2026: nowy rozdział 09 „Dla kogo pracujemy" — rejestr siedmiu
     stron branżowych pod paletą kolorów. Do tego dnia strona główna nie
     linkowała do żadnej LP branżowej. Wcześniej: odnośnik do pillara
     „koperty na pieniądze" (poz. 39) w sekcji zastosowań. 23 września:
     nadruk na zamknięciu w sekcji usług i w kroku 1 procesu (także `HowTo`) */
  '/': '2026-09-23',
  /* Karta „Hotele, resorty i pensjonaty" w sekcji „Dla kogo" dostała odnośnik
     do poz. 18; czwarta karta w sekcji „Poradniki" i odnośnik pod tabelą
     specyfikacji prowadzą do poz. 46; karta „Kliniki medycyny estetycznej
     i salony SPA" — do poz. 22; karta „Biura rachunkowe i doradztwo
     finansowe" — do poz. 21. 15 września karta „Agencje eventowe, PR
     i kreatywne" dostała odnośnik do poz. 25. 23 września: nadruk na
     zamknięciu — wiersz w cenniku, wiersz „Miejsce nadruku" w specyfikacji
     i pytanie w FAQ (także w `FAQPage`) */
  '/koperty-z-nadrukiem': '2026-09-23',
  /* Karta „Hotele, resorty i pensjonaty" w sekcji „Dla kogo" dostała odnośnik
     do poz. 18; pod cennikiem doszedł odnośnik do poz. 46 — ten sam próg
     obowiązuje przy adresowaniu; karta „Kliniki, gabinety i salony SPA" —
     odnośnik do poz. 22. 15 września karta „Agencje eventowe, PR i kreatywne"
     dostała odnośnik do poz. 25. 23 września: logo na zamknięciu obok adresu
     w cenniku i w FAQ (także `FAQPage`) */
  '/koperty-personalizowane': '2026-09-23',
  /* Sekcja „Poradniki" i odnośnik pod tabelą dopasowań — treść wspierająca
     z poz. 11 planu. 14 września karta „Biura rachunkowe i doradztwo
     podatkowe" w sekcji „Dla kogo" dostała odnośnik do poz. 21. 15 września
     karta „Agencje eventowe, PR i kreatywne" — odnośnik do poz. 25 */
  '/koperty-dl': '2026-09-15',
  /* Karty „Hotele, resorty i pensjonaty butikowe" oraz „Salony SPA i kliniki
     medycyny estetycznej" w sekcji „Dla kogo" dostały odnośniki do poz. 18
     i poz. 22 */
  '/koperty-na-vouchery': '2026-09-14',
  /* Doszedł wpis o minimalnym nakładzie przy nadruku (poz. 46) */
  '/blog': '2026-09-14',
  /* Odnośnik do strony „O nas" w karcie danych rejestrowych */
  '/kontakt': '2026-08-17',
  /* Publikacja strony „O nas" */
  '/o-nas': '2026-08-17',
  /* Poz. 30–32 planu — druga partia stron kolorów. Karta „Hotele, pensjonaty
     i domy gościnne" dostała odnośnik do poz. 18, a karta „Biura, które nie
     chcą bieli" — do poz. 21 */
  '/koperty/ecru': '2026-09-14',
  /* Poz. 33–36 planu — Faza 3 stron kolorów. Karta „Gabinety lekarskie
     i kliniki" dostała odnośnik do poz. 22, a karta „Biura rachunkowe
     i audytorskie" — do poz. 21 */
  '/koperty/bialy': '2026-09-14',
  '/koperty/matcha': '2026-08-19',
  /* Karta „Hotele, resorty i apartamenty nadmorskie" — odnośnik do poz. 18 */
  '/koperty/blekit-lupkowy': '2026-09-14',
  /* Filar K6 — Eleganckie koperty premium (content-plan.md poz. 37).
     Karty „Kliniki medycyny estetycznej i SPA", „Kancelarie prawne
     i notarialne" i „Uroczystości ślubne i jubileusze VIP" dostały
     odnośniki do poz. 19, poz. 17 i poz. 39. 14 września doszło linkowanie
     w dół — sekcja „Poradniki" i trzy odnośniki kontekstowe, a karta
     kliniczna — drugi odnośnik, do poz. 22, a karta „Zarządy spółek
     i relacje inwestorskie" — odnośnik do poz. 21. 15 września karta
     „Agencje eventowe i PR" — odnośnik do poz. 25. */
  '/koperty-premium': '2026-09-15',
  /* Czwarta partia stron kolorów z backlogu klastra K5 */
  '/koperty/szara': '2026-08-19',
  '/koperty/niebieski': '2026-08-19',
  /* Karta „Kliniki stomatologiczne, medyczne i laboratoria" — odnośnik do poz. 22 */
  '/koperty/jasnoniebieska': '2026-09-14',
  /* Piąta partia stron kolorów — przegląd kompletu 19 odcieni z 19 sierpnia.
     Karta „Hotele i resorty w otoczeniu natury" dostała odnośnik do poz. 18 */
  '/koperty/ciemnozielony': '2026-09-14',
  '/koperty/jasnozielony': '2026-08-19',
  /* Szósta partia — domknięcie palety (poz. 36g–36k planu) */
  '/koperty/rozowa': '2026-08-19',
  '/koperty/eko': '2026-08-19',
  '/koperty/zolta': '2026-08-19',
  /* Karta „Kliniki stomatologiczne i medycyny estetycznej" — odnośnik do poz. 22 */
  '/koperty/srebrna-perlowa': '2026-09-14',
  /* Karty „Dla kogo" na stronach kolorów dostały odnośniki do stron
     branżowych i filara K8, które ten odcień rekomendują: Czarny, Granatowy
     i Szarobrązowy → poz. 17, Szarobrązowy → poz. 19, Czerwony → poz. 23,
     Złoty i Biała Perłowa → poz. 39. 15 września trzy karty dostały odnośnik
     do poz. 25: „Agencje kreatywne i eventowe" (Czarny), „Instytucje kultury
     i orkiestry" (Granatowy) i „Organizatorzy gal i eventów" (Złoty) */
  '/koperty/czarny': '2026-09-15',
  '/koperty/granatowy': '2026-09-15',
  '/koperty/taupe': '2026-09-10',
  '/koperty/czerwony': '2026-09-10',
  /* Karta „Hotele i restauracje" dostała odnośnik do poz. 18 */
  '/koperty/zloty': '2026-09-15',
  /* Karta „Gabinety medycyny estetycznej i kliniki premium" — odnośnik do poz. 22 */
  '/koperty/biala-perlowa': '2026-09-14',
  /* Wpisy blogowe wspierające filar K2 — poz. 14 i 15 planu. Poz. 14 dostała
     przy publikacji poz. 15 akapit odsyłający do przygotowania listy. */
  '/blog/jak-zaadresowac-koperte-wysylana-przez-firme-wzor': '2026-08-25',
  '/blog/koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste': '2026-08-25',
  /* Wpisy wspierające filar K1 — poz. 9 i 16 planu. Poz. 9 dostała przy
     publikacji poz. 16 akapit odsyłający do poradnika o terminach. */
  '/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia': '2026-08-26',
  '/blog/szybka-realizacja-kopert-terminy-i-ekspres': '2026-08-26',
  /* Poz. 19 planu — pierwsza LP branżowa Fazy 2, filar F4 */
  '/koperty-dla-salonow-spa': '2026-09-05',
  /* Poz. 23 planu — druga LP branżowa Fazy 2, filar F4 */
  '/koperty-dla-restauracji': '2026-09-06',
  /* Poz. 17 planu — trzecia LP branżowa Fazy 2, filar F1. 14 września sekcja
     koloru dostała akapit z granicą branżową wobec poz. 21 */
  '/koperty-dla-kancelarii': '2026-09-14',
  /* Poz. 39 planu — pillar K8, wykonany wyprzedzająco z Fazy 4.
     14 września doszło linkowanie w dół — sekcja „Poradniki" i trzy
     odnośniki kontekstowe do treści wspierających. */
  '/koperty-na-pieniadze': '2026-09-14',
  /* Poz. 18 planu — czwarta LP branżowa Fazy 2, filar F4 */
  '/koperty-dla-hoteli': '2026-09-14',
  /* Poz. 22 planu — piąta LP branżowa Fazy 2, filar F4 */
  '/koperty-dla-klinik': '2026-09-14',
  /* Poz. 21 planu — szósta LP branżowa Fazy 2 i druga pod filarem F1 */
  '/koperty-dla-biur-rachunkowych': '2026-09-14',
  /* Poz. 25 planu — siódma LP branżowa Fazy 2 i trzecia pod filarem F1 */
  '/koperty-dla-agencji-eventowych': '2026-09-15',
  /* Poz. 26 planu — ósma LP branżowa Fazy 2 i czwarta pod filarem F1 */
  '/koperty-dla-nieruchomosci': '2026-09-15',
  /* Poz. 27 planu — dziewiąta LP Fazy 2 i piąta pod filarem F1 */
  '/koperty-na-certyfikaty': '2026-09-16',
};

/** Data zmiany treści dla trasy — `undefined`, gdy trasy nie ma w rejestrze. */
export function pageUpdated(path: string): string | undefined {
  return PAGE_UPDATED[path];
}
