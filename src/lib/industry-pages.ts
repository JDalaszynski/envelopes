/**
 * Rejestr opublikowanych stron branżowych (Faza 2 planu treści).
 *
 * **Jedno źródło listy.** Do 15 września 2026 strona główna nie linkowała do
 * żadnej LP branżowej: wszystkie odnośniki do nich szły z filarów, ze stron
 * kolorów i z wpisów, czyli z podstron słabszych niż `/`. Sekcja „Dla kogo
 * pracujemy" na stronie głównej renderuje tę tablicę, więc kolejna LP branżowa
 * jest dopisaniem jednego wpisu, a nie kopiowaniem znaczników.
 *
 * **Dlaczego to nie są karty `ConfigureLink`.** Spis zastosowań (`#zastosowania`)
 * jest w całości wejściem do konfiguratora z preselekcją koloru i usługi —
 * karta ma tam jeden cel kliknięcia i doklejenie do niej drugiego odnośnika
 * rozbiłoby ten cel. Rejestr branż prowadzi świadomie **poza** konfigurator:
 * użytkownik, który szuka rozwiązania dla swojej branży, potrzebuje najpierw
 * zobaczyć jej słownik i kalendarz, a CTA do konfiguratora stoją na LP —
 * po pięć na stronę, z preselekcją właściwą dla tej branży.
 *
 * **Zasada treści (pkt 10.1 pkt 11 briefu SEO/GEO):** opis pozycji mówi, co
 * dana strona **rozstrzyga**, i nie niesie żadnego parametru oferty. Cena,
 * gramatura, minimum nakładu i termin mają właścicieli na `/`, na filarach
 * i na samych LP — powtórzenie ich tutaj siedem razy byłoby szumem.
 *
 * **Anchor = fraza główna strony docelowej** (pkt 5.4 briefu). Te same anchory
 * stoją w kartach „Dla kogo" na filarach i na stronach kolorów, więc sygnał
 * jest w całym serwisie spójny.
 */
export interface IndustryPage {
  path: string;
  /** Branża w języku odbiorcy — nagłówek pozycji w rejestrze */
  branch: string;
  /** Anchor odnośnika — fraza główna strony docelowej */
  anchor: string;
  /** Co ta strona rozstrzyga. Jedno zdanie, zero parametrów oferty */
  text: string;
}

/**
 * Kolejność jest tematyczna, nie alfabetyczna: najpierw korespondencja
 * dokumentowa (filar F1), potem wysyłka zaproszeń, na końcu koperty
 * wręczane do ręki razem z bonem (filar F4). Czytelnik przegląda rejestr
 * wzrokiem i trafia na swoją sytuację, zanim doczyta do własnej nazwy.
 */
export const INDUSTRY_PAGES: IndustryPage[] = [
  {
    path: '/koperty-dla-kancelarii',
    branch: 'Kancelarie prawne i notarialne',
    anchor: 'koperty dla kancelarii',
    text: 'Typologia pism — od wezwania po akt notarialny — i dobór odcienia stonowanego do każdej z nich.',
  },
  {
    path: '/koperty-dla-biur-rachunkowych',
    branch: 'Biura rachunkowe i audytorskie',
    anchor: 'koperty dla biur rachunkowych',
    text: 'Kalendarz roku obrotowego: kiedy do klientów wychodzą informacje podatkowe, sprawozdania i uchwały.',
  },
  {
    path: '/koperty-dla-agencji-eventowych',
    branch: 'Agencje eventowe, PR i działy marketingu',
    anchor: 'koperty na zaproszenia firmowe',
    text: 'Zaproszenie, program i karta wstępu w jednej wysyłce, planowane wstecz od daty wydarzenia i listy gości.',
  },
  {
    path: '/koperty-dla-hoteli',
    branch: 'Hotele, resorty i pensjonaty',
    anchor: 'koperty firmowe dla hotelu',
    text: 'Karta powitalna z nazwiskiem gościa i voucher pobytowy — koperta wręczana w recepcji, nie wysyłana pocztą.',
  },
  {
    path: '/koperty-dla-klinik',
    branch: 'Kliniki i gabinety',
    anchor: 'koperty na vouchery dla kliniki',
    text: 'Bon na pakiet zabiegowy kupowany przez osobę, która nie zna procedury, i drugi obieg kopert w gabinecie.',
  },
  {
    path: '/koperty-dla-salonow-spa',
    branch: 'Salony SPA i kosmetyczne',
    anchor: 'koperty na bony podarunkowe',
    text: 'Bon na zabieg w sezonie prezentowym — Walentynki, Dzień Kobiet i grudzień mają osobne terminy zamówienia.',
  },
  {
    path: '/koperty-dla-restauracji',
    branch: 'Restauracje i winiarnie',
    anchor: 'koperty na vouchery do restauracji',
    text: 'Voucher na kolację, który ma wyglądać jak prezent, a nie jak rachunek, i dwa szczyty sprzedaży w roku.',
  },
];
