import { COLOR_MAP } from './catalog';

/**
 * Kadry zastosowań — zdjęcia kopert DL z nadrukiem i personalizacją
 * pokazane w kontekście użycia (`public/images/zastosowania/`).
 *
 * Czym różnią się od `colors/`, `prints/` i `personalized/` z `catalog.ts`:
 * tamte kadry to zdjęcia produktowe na białym tle, które zasilają konfigurator
 * i podgląd w kroku nadruku. Te są kadrami aranżacyjnymi i służą wyłącznie
 * treści — dlatego nie wchodzą do `catalog.ts` i nie trafiają do konfiguratora,
 * gdzie tło z drewna czy trawy zaburzyłoby ocenę koloru papieru.
 *
 * ⚠ Nazwy firm i osób widoczne na nadrukach są przykładowe (Envelopes nie
 * publikuje realizacji klientów). Treść wokół tych kadrów musi mówić
 * „przykładowy nadruk" albo „wizualizacja" i nigdy „nasza realizacja dla…" —
 * inaczej byłaby wymyślonym portfolio (pkt 4.1 briefu SEO/GEO).
 *
 * Kolor katalogowy każdego kadru ustalono pomiarem barwy (mediana kadru
 * centralnego w przestrzeni Lab, porównana ze zdjęciami z `colors/`),
 * a nie na oko — pkt 5.6.2 briefu.
 */

export type ShowcaseVariant = 'nadruk' | 'personalizacja' | 'makieta';

export interface ShowcaseShot {
  /** Nazwa pliku bez sufiksu szerokości i rozszerzenia */
  file: string;
  /** `id` z `COLORS` — ustalony pomiarem barwy */
  colorId: string;
  variant: ShowcaseVariant;
  /** Tekst alternatywny: co widać + format + kolor. Każdy kadr ma własny. */
  alt: string;
  /** Kontekst zakupowy pod podpisem — jedno zdanie, bez powtarzania altu */
  note: string;
}

/** Katalog serwowany — jedno miejsce, w którym zapisana jest ścieżka. */
const DIR = '/images/zastosowania';

/** Adres wariantu 1024 px — wartość dla atrybutu `src`. */
export function showcaseSrc(shot: ShowcaseShot): string {
  return `${DIR}/${shot.file}-1024.webp`;
}

/** Dwa warianty szerokości do `srcSet` — przeglądarka wybiera po `sizes`. */
export function showcaseSrcSet(shot: ShowcaseShot): string {
  return `${DIR}/${shot.file}-512.webp 512w, ${DIR}/${shot.file}-1024.webp 1024w`;
}

/**
 * Podpis produktowy czytany z katalogu — nazwa koloru, gramatura
 * i wykończenie. Wpisanie tych wartości ręcznie rozjechałoby podpis
 * ze zmianą w `catalog.ts` (pkt 5.6.7 briefu).
 */
export function showcaseCaption(shot: ShowcaseShot): string {
  const color = COLOR_MAP[shot.colorId];
  if (!color) return shot.colorId;
  const parts = [color.name];
  if (color.weight) parts.push(color.weight.replace('g', ' g/m²'));
  if (color.finish) parts.push(`wykończenie ${color.finish}`);
  return parts.join(' · ');
}

/**
 * Sam odcień, bez gramatury i wykończenia — podpis dla stron, które pokazują
 * kadr jako ilustrację, a nie jako ofertę konkretnego papieru. Gramatura jest
 * parametrem sprzedażowym i należy do stron filarowych oraz do konfiguratora.
 */
export function showcaseColorName(shot: ShowcaseShot): string {
  return COLOR_MAP[shot.colorId]?.name ?? shot.colorId;
}

/** Tytuł odnośnika do konfiguratora — ten sam wzorzec na każdej stronie. */
export function showcaseLinkTitle(shot: ShowcaseShot): string {
  const color = COLOR_MAP[shot.colorId];
  const usluga = shot.variant === 'personalizacja' ? 'z personalizacją' : 'z nadrukiem';
  return `Koperta DL ${color?.name ?? shot.colorId} ${usluga} — otwórz konfigurator z tą konfiguracją`;
}

/* ── Nadruk logo w kontekście branżowym — filar K1 ─────────────────────── */

/**
 * Osiem branż, po jednym kadrze. Dobór kolorów nie jest przypadkowy:
 * pokrywa cztery odcienie, dla których w `catalog.ts` nie ma jeszcze zdjęcia
 * z nadrukiem (Biała Perłowa, Złoty, Szarobrązowy, Eko), więc sekcja
 * poszerza pokrycie palety zamiast powielać kadry, które już są na stronie.
 */
export const INDUSTRY_SHOTS: ShowcaseShot[] = [
  {
    file: 'granatowa-koperta-dl-nadruk-logo-kancelarii',
    colorId: 'granatowy',
    variant: 'nadruk',
    alt: 'Granatowa koperta DL z jasnym nadrukiem logo kancelarii prawnej, leżąca na ciemnym drewnianym blacie',
    note: 'Pismo A4 złożone na trzy i logo kancelarii na przedniej ściance.',
  },
  {
    file: 'taupe-koperta-dl-nadruk-logo-salonu-spa',
    colorId: 'taupe',
    variant: 'nadruk',
    alt: 'Koperta DL w kolorze Szarobrązowym z białym nadrukiem logo salonu SPA, na jasnym drewnie',
    note: 'Najgrubszy papier w ofercie pod bon na zabieg.',
  },
  {
    file: 'czerwona-koperta-dl-nadruk-logo-restauracji',
    colorId: 'czerwony',
    variant: 'nadruk',
    alt: 'Czerwona koperta DL z czarnym nadrukiem logo restauracji, przód i tył na drewnianym blacie',
    note: 'Mocny kolor pod voucher na kolację — czerń daje pełny kontrast.',
  },
  {
    file: 'biala-perlowa-koperta-dl-nadruk-logo-auto-detailing',
    colorId: 'biala-perlowa',
    variant: 'nadruk',
    alt: 'Koperta DL Biała Perłowa z czarnym nadrukiem logo firmy auto detailingowej, na szczotkowanym metalu',
    note: 'Perłowy papier bez dopłaty — dokumenty pojazdu i umowy serwisowe.',
  },
  {
    file: 'biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego',
    colorId: 'biala-perlowa',
    variant: 'nadruk',
    alt: 'Koperta DL Biała Perłowa z miedzianym nadrukiem logo salonu fryzjerskiego, na marmurowym blacie',
    note: 'Nadruk w jednym kolorze na perle — karty podarunkowe salonu.',
  },
  {
    file: 'granatowa-koperta-dl-nadruk-logo-orkiestry',
    colorId: 'granatowy',
    variant: 'nadruk',
    alt: 'Granatowa koperta DL z białym nadrukiem logo orkiestry symfonicznej, na jasnym drewnie',
    note: 'Zaproszenia na koncert i karnety dla abonentów.',
  },
  {
    file: 'eko-koperta-dl-nadruk-logo-palarni-kawy',
    colorId: 'eko',
    variant: 'nadruk',
    alt: 'Koperta DL z papieru Eko z brązowym nadrukiem logo palarni kawy, na ciemnym drewnie',
    note: 'Papier eko pod marki, które komunikują pochodzenie produktu.',
  },
  {
    file: 'zlota-koperta-dl-nadruk-logo-studia-tatuazu',
    colorId: 'zloty',
    variant: 'nadruk',
    alt: 'Złota koperta DL z papieru metalicznego z czarnym nadrukiem logo studia tatuażu, na ciemnym tle',
    note: 'Wykończenie metaliczne w cenie koperty białej.',
  },
];

/* ── Personalizacja i adresowanie — filar K2 ───────────────────────────── */

export const PERSONALIZATION_SHOTS: ShowcaseShot[] = [
  {
    file: 'czarna-koperta-dl-personalizacja-imienna',
    colorId: 'czarny',
    variant: 'personalizacja',
    alt: 'Trzy czarne koperty DL ułożone kaskadowo, każda z nadrukiem imienia i nazwiska innego odbiorcy',
    note: 'Każda koperta z serii dostaje inne dane — bez dopłaty za zmienny druk.',
  },
  {
    file: 'niebieska-koperta-dl-personalizacja-odreczna',
    colorId: 'niebieski',
    variant: 'personalizacja',
    alt: 'Niebieska koperta DL z nadrukiem imienia i nazwiska odbiorcy w kroju odręcznym, na drewnianych deskach',
    note: 'Krój odręczny na zaproszenia i wysyłki okolicznościowe.',
  },
  {
    file: 'biala-perlowa-koperta-dl-adresowanie-odbiorcy',
    colorId: 'biala-perlowa',
    variant: 'personalizacja',
    alt: 'Koperta DL Biała Perłowa z nadrukowanym adresem odbiorcy: imię i nazwisko, firma, ulica, kod pocztowy i miejscowość',
    note: 'Komplet pól z arkusza adresowego — koperta wychodzi gotowa do nadania.',
  },
];

/* ── Okazje — kadry pod sekcję zastosowań na stronie głównej ───────────── */

/**
 * Nadruk okolicznościowy na kopercie DL. Format DL jest dostępny, więc te
 * kadry nie obiecują niczego spoza oferty — zaproszenie i kartka złożone
 * do DL mieszczą się w kopercie, a koperty C6 i K4 mają w katalogu status
 * „Dostępne wkrótce" i nie występują na żadnym z tych zdjęć.
 */
export const OCCASION_SHOTS: ShowcaseShot[] = [
  {
    file: 'czarna-koperta-dl-nadruk-zaproszenie',
    colorId: 'czarny',
    variant: 'nadruk',
    alt: 'Czarna koperta DL z białym nadrukiem napisu „Zaproszenie" pismem odręcznym, na ciemnym drewnie',
    note: 'Zaproszenie na galę i premierę — nadruk jednego słowa liczy się tak samo jak logo.',
  },
  {
    file: 'blekit-lupkowy-koperta-dl-nadruk-na-chrzest',
    colorId: 'blekit-lupkowy',
    variant: 'nadruk',
    alt: 'Koperta DL w kolorze Jeansowym z białym nadrukiem napisu „Chrzest Święty", na białych deskach',
    note: 'Uroczystości rodzinne — nadruk w cenie standardu.',
  },
  {
    file: 'matcha-koperta-dl-nadruk-podziekowania',
    colorId: 'matcha',
    variant: 'nadruk',
    alt: 'Dwie koperty DL w kolorze Matcha na drewnianym blacie, na wierzchniej ciemnozielony nadruk słowa „Dziękujemy" pismem odręcznym',
    note: 'Podziękowania weselne i firmowe — nadruk jednego słowa.',
  },
];

/* ── Kadr pomocniczy do sekcji o procesie nadruku ──────────────────────── */

/**
 * Kadr celowo bez konkretnego logo — pole nadruku zaznaczone symbolem
 * grafiki. Pokazuje, gdzie na kopercie staje plik klienta, i nie sugeruje
 * przy tym żadnej marki.
 */
export const PRINT_AREA_SHOT: ShowcaseShot = {
  file: 'ciemnozielona-koperta-dl-miejsce-na-logo',
  colorId: 'ciemnozielony',
  variant: 'makieta',
  alt: 'Koperta DL w kolorze Butelkowa Zieleń z jasnym symbolem grafiki w miejscu, w którym drukowane jest logo klienta',
  note: 'Pole nadruku na przedniej ściance koperty DL.',
};

/**
 * Kadry, w których nadruk trafia na kopertę pod bon podarunkowy — podzbiór
 * `INDUSTRY_SHOTS` wskazany po nazwie pliku, więc alt i podpis pozostają
 * wspólne dla obu stron i nie mogą się rozjechać.
 */
/**
 * Sześć kolorów pokazanych na `/koperty-na-vouchery` — węższy wybór niż
 * paleta na F1, bo pytanie na tej stronie brzmi „ile kosztuje gotowa koperta
 * na bon", a nie „jaki mam papier".
 *
 * Lista mieszka tutaj, a nie w komponencie strony, bo korzysta z niej także
 * sitemapa obrazów: zestaw zdjęć zgłoszony wyszukiwarce musi odpowiadać temu,
 * co strona faktycznie renderuje, a dwie kopie tej samej listy rozjechałyby
 * się przy pierwszej zmianie doboru kolorów.
 */
export const VOUCHER_COLOR_IDS = [
  'czarny',
  'granatowy',
  'ciemnozielony',
  'czerwony',
  'ecru',
  'bialy',
];

export const VOUCHER_SHOT_FILES = [
  'taupe-koperta-dl-nadruk-logo-salonu-spa',
  'biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego',
  'czerwona-koperta-dl-nadruk-logo-restauracji',
  'zlota-koperta-dl-nadruk-logo-studia-tatuazu',
];

export const VOUCHER_SHOTS: ShowcaseShot[] = VOUCHER_SHOT_FILES.map((file) => {
  const shot = INDUSTRY_SHOTS.find((s) => s.file === file);
  if (!shot) throw new Error(`Brak kadru „${file}" w INDUSTRY_SHOTS`);
  return shot;
});

/** Wszystkie kadry — do danych strukturalnych i kontroli kompletu plików. */
export const ALL_SHOWCASE_SHOTS: ShowcaseShot[] = [
  ...INDUSTRY_SHOTS,
  ...PERSONALIZATION_SHOTS,
  ...OCCASION_SHOTS,
  PRINT_AREA_SHOT,
];

/**
 * Kadr wskazany po nazwie pliku. Ten sam mechanizm, co w `VOUCHER_SHOTS`:
 * strona, która chce pokazać istniejący kadr, bierze go stąd, a nie przepisuje
 * `alt` i `note` u siebie — inaczej opis kadru rozjechałby się między stronami.
 *
 * Rzuca wyjątkiem przy literówce w nazwie, więc błąd wychodzi przy budowaniu,
 * a nie jako puste miejsce po obrazku na produkcji.
 */
export function shotByFile(file: string): ShowcaseShot {
  const shot = ALL_SHOWCASE_SHOTS.find((s) => s.file === file);
  if (!shot) throw new Error(`Brak kadru „${file}" w katalogu kadrów`);
  return shot;
}

/**
 * Trzy kadry na stronie „O nas" — po jednym na to, co faktycznie robimy:
 * nadruk logo, adresowanie imienne i nadruk okolicznościowy.
 *
 * Lista mieszka tutaj, a nie w komponencie strony, z tego samego powodu co
 * `VOUCHER_COLOR_IDS`: korzysta z niej sitemapa obrazów, a zestaw zgłoszony
 * wyszukiwarce musi odpowiadać temu, co strona renderuje. Dwie kopie tej
 * samej listy rozjechałyby się przy pierwszej zmianie doboru kadrów.
 */
export const ABOUT_SHOTS: ShowcaseShot[] = [
  'granatowa-koperta-dl-nadruk-logo-kancelarii',
  'biala-perlowa-koperta-dl-adresowanie-odbiorcy',
  'matcha-koperta-dl-nadruk-podziekowania',
].map(shotByFile);
