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
  /* Siatka blogowa pokazuje trzy najnowsze wpisy — doszedł poradnik o palecie 19 kolorów (poz. 12) */
  '/': '2026-08-20',
  /* Odnośnik do poradnika o koszcie zamówienia w sekcji cenowej (poz. 9) */
  '/koperty-z-nadrukiem': '2026-08-17',
  '/koperty-personalizowane': '2026-08-16',
  /* Sekcja „Poradniki" i odnośnik pod tabelą dopasowań — treść wspierająca z poz. 11 planu */
  '/koperty-dl': '2026-08-21',
  '/koperty-na-vouchery': '2026-08-16',
  /* Doszedł wpis o kopertach bez okienka (poz. 13) */
  '/blog': '2026-08-21',
  /* Odnośnik do strony „O nas" w karcie danych rejestrowych */
  '/kontakt': '2026-08-17',
  /* Publikacja strony „O nas" */
  '/o-nas': '2026-08-17',
  /* Pierwsza strona koloru — poz. 29 planu */
  '/koperty/czarny': '2026-08-19',
  /* Poz. 30–32 planu — druga partia stron kolorów */
  '/koperty/granatowy': '2026-08-17',
  '/koperty/zloty': '2026-08-17',
  '/koperty/ecru': '2026-08-17',
  /* Poz. 33–36 planu — Faza 3 stron kolorów */
  '/koperty/bialy': '2026-08-19',
  '/koperty/matcha': '2026-08-19',
  '/koperty/blekit-lupkowy': '2026-08-19',
  '/koperty/taupe': '2026-08-19',
  /* Filar K6 — Eleganckie koperty premium (content-plan.md poz. 37) */
  '/koperty-premium': '2026-08-19',
  /* Czwarta partia stron kolorów z backlogu klastra K5 */
  '/koperty/szara': '2026-08-19',
  '/koperty/niebieski': '2026-08-19',
  '/koperty/jasnoniebieska': '2026-08-19',
  /* Piąta partia stron kolorów — przegląd kompletu 19 odcieni z 19 sierpnia */
  '/koperty/ciemnozielony': '2026-08-19',
  '/koperty/jasnozielony': '2026-08-19',
  '/koperty/czerwony': '2026-08-19',
  /* Szósta partia — domknięcie palety (poz. 36g–36k planu) */
  '/koperty/rozowa': '2026-08-19',
  '/koperty/eko': '2026-08-19',
  '/koperty/zolta': '2026-08-19',
  '/koperty/srebrna-perlowa': '2026-08-19',
  '/koperty/biala-perlowa': '2026-08-19',
  /* Wpis blogowy wspierający filar K2 — poz. 14 planu */
  '/blog/jak-zaadresowac-koperte-wysylana-przez-firme-wzor': '2026-08-22',
};

/** Data zmiany treści dla trasy — `undefined`, gdy trasy nie ma w rejestrze. */
export function pageUpdated(path: string): string | undefined {
  return PAGE_UPDATED[path];
}
