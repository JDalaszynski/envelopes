import type { MetadataRoute } from 'next';

import { getAllPosts, type BlogPost } from '@/lib/blog';
import { COLORS, COLOR_MAP } from '@/lib/catalog';
import { TERMS, PRIVACY, COOKIES } from '@/lib/legal';
import { colorPagePath, colorPages } from '@/lib/color-pages';
import {
  ABOUT_SHOTS,
  INDUSTRY_SHOTS,
  OCCASION_SHOTS,
  PERSONALIZATION_SHOTS,
  PLAIN_ENVELOPE_SHOT,
  PRINT_AREA_SHOT,
  USE_CASE_SHOTS,
  VOUCHER_COLOR_IDS,
  VOUCHER_SHOTS,
  shotByFile,
  showcaseSrc,
  type ShowcaseShot,
} from '@/lib/showcase';
import { SITE_URL, ogImage } from '@/lib/seo';

/**
 * Sitemap obejmuje wyłącznie strony indeksowalne (pkt 8.3).
 * Koszyk, checkout, konto, panel zamówień i panel administracyjny są
 * świadomie pominięte — to strony prywatne i przejściowe.
 * Nowe wpisy blogowe trafiają tu automatycznie.
 */

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
 */
const PAGE_UPDATED: Record<string, string> = {
  /* Siatka blogowa pokazuje trzy najnowsze wpisy — doszedł poradnik o liczbie kartek (poz. 11) */
  '/': '2026-08-18',
  /* Odnośnik do poradnika o koszcie zamówienia w sekcji cenowej (poz. 9) */
  '/koperty-z-nadrukiem': '2026-08-17',
  '/koperty-personalizowane': '2026-08-16',
  /* Sekcja „Poradniki" i odnośnik pod tabelą dopasowań — treść wspierająca z poz. 11 planu */
  '/koperty-dl': '2026-08-18',
  '/koperty-na-vouchery': '2026-08-16',
  /* Doszedł wpis o liczbie kartek w kopercie DL i składaniu A4 (poz. 11) */
  '/blog': '2026-08-18',
  /* Odnośnik do strony „O nas" w karcie danych rejestrowych */
  '/kontakt': '2026-08-17',
  /* Publikacja strony „O nas" */
  '/o-nas': '2026-08-17',
  /* Pierwsza strona koloru — poz. 29 planu */
  '/koperty/czarny': '2026-08-17',
  /* Poz. 30–32 planu — druga partia stron kolorów */
  '/koperty/granatowy': '2026-08-17',
  '/koperty/zloty': '2026-08-17',
  '/koperty/ecru': '2026-08-17',
  /* Poz. 33–36 planu — Faza 3 stron kolorów */
  '/koperty/bialy': '2026-08-18',
  '/koperty/matcha': '2026-08-18',
  '/koperty/blekit-lupkowy': '2026-08-18',
  '/koperty/taupe': '2026-08-18',
};

/** Adres bezwzględny — sitemapa obrazów nie przyjmuje ścieżek względnych. */
function abs(path: string): string {
  return `${SITE_URL}${path}`;
}

function shotUrls(shots: ShowcaseShot[]): string[] {
  return shots.map((shot) => abs(showcaseSrc(shot)));
}

/**
 * Zdjęcia zgłaszane wyszukiwarce dla każdej trasy.
 *
 * Sitemapa obrazów jest tu jedynym kanałem, przez który 19 kadrów katalogowych
 * i 15 kadrów aranżacyjnych w ogóle trafia do Grafiki Google: wszystkie są
 * ładowane leniwie i część siedzi poniżej pierwszego ekranu, a nazwy plików
 * i teksty alternatywne zostały pod te zapytania przygotowane (dziennik
 * wdrożeń z 15 sierpnia 2026).
 *
 * Zestawy odpowiadają temu, co strona **faktycznie renderuje** — zgłoszenie
 * obrazu, którego na stronie nie ma, jest w wytycznych Google błędem, a nie
 * dodatkowym zasięgiem. Stąd `BESTSELLERS` dla `/koperty-dl` (sekcja kolorów
 * pokazuje tam wybór, nie pełną paletę) i `VOUCHER_COLOR_IDS` dla F4.
 *
 * Zbliżenia z `public/images/details/` świadomie pominięte: są dekoracyjne
 * i ich lista mieszka w komponencie strony głównej, więc powielenie jej tutaj
 * rozjechałoby się przy pierwszej zmianie kadru.
 */
const BESTSELLERS = COLORS.filter((color) => color.bestseller);

const PAGE_IMAGES: Record<string, string[]> = {
  '/': [
    ...COLORS.filter((color) => color.images?.DL).map((color) => abs(color.images!.DL!)),
    ...shotUrls(OCCASION_SHOTS),
    /* Dwa kadry ze spisu zastosowań — powstały pod tę stronę i nie wiszą
       nigdzie indziej, więc bez nich nie trafiłyby do Grafiki Google wcale. */
    ...shotUrls(USE_CASE_SHOTS),
  ],
  '/koperty-z-nadrukiem': [
    ...COLORS.filter((color) => color.printImages?.DL).map((color) => abs(color.printImages!.DL!)),
    ...shotUrls([...INDUSTRY_SHOTS, PRINT_AREA_SHOT]),
  ],
  '/koperty-personalizowane': [
    ...COLORS.filter((color) => color.personalizedImages?.DL).map((color) =>
      abs(color.personalizedImages!.DL!)
    ),
    ...shotUrls(PERSONALIZATION_SHOTS),
  ],
  '/koperty-dl': [
    ...BESTSELLERS.filter((color) => color.images?.DL).map((color) => abs(color.images!.DL!)),
    /* Kadr koperty gładkiej w sekcji o budowie formatu — jedyne zdjęcie
       aranżacyjne, jakie ten filar renderuje. */
    ...shotUrls([PLAIN_ENVELOPE_SHOT]),
  ],
  '/koperty-na-vouchery': [
    ...VOUCHER_COLOR_IDS.map((id) => COLOR_MAP[id])
      .filter((color) => color?.printImages?.DL)
      .map((color) => abs(color.printImages!.DL!)),
    ...shotUrls(VOUCHER_SHOTS),
  ],
  /* Trzy kadry, które strona „O nas" faktycznie renderuje — te same pliki
     co na filarach, więc zgłoszenie nie obiecuje wyszukiwarce nic ponad to,
     co jest w HTML-u. */
  '/o-nas': shotUrls(ABOUT_SHOTS),
};

/**
 * Kadr nagłówkowy wpisu — ten sam plik, który renderuje `EnvelopePlaceholder`
 * na stronie wpisu, wybrany po `colorId` i wariancie zdjęcia. Do tego obraz
 * wyróżniający z `public/images/og/`, bo to on idzie w podgląd odnośnika.
 */
function postImages(post: BlogPost): string[] {
  const color = COLOR_MAP[post.colorId];
  const header =
    post.imageVariant === 'nadruk'
      ? color?.printImages?.DL
      : post.imageVariant === 'personalizacja'
        ? color?.personalizedImages?.DL
        : color?.images?.DL;

  return [
    ...(header ? [abs(header)] : []),
    abs(ogImage(post.ogImageSlug ?? 'blog', post.title).url),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: number,
    lastModified?: string
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path === '/' ? '/' : path}`,
    lastModified: lastModified ?? PAGE_UPDATED[path],
    changeFrequency,
    priority,
    ...(PAGE_IMAGES[path]?.length ? { images: PAGE_IMAGES[path] } : {}),
  });

  const staticPages: MetadataRoute.Sitemap = [
    page('/', 'weekly', 1),
    /* Filar K1 — strona ofertowa nadruku (content-plan.md poz. 1) */
    page('/koperty-z-nadrukiem', 'monthly', 0.9),
    /* Filar K2 — personalizacja i adresowanie (content-plan.md poz. 2) */
    page('/koperty-personalizowane', 'monthly', 0.9),
    /* Filar K4 — wymiary i specyfikacja formatu DL (content-plan.md poz. 3) */
    page('/koperty-dl', 'monthly', 0.9),
    /* Filar K7 — koperty na vouchery i bony podarunkowe (content-plan.md poz. 4) */
    page('/koperty-na-vouchery', 'monthly', 0.9),
    page('/blog', 'weekly', 0.8),
    page('/kontakt', 'monthly', 0.7),
    /* Strona podmiotu — encja firmy dla wyszukiwarki i modeli (AboutPage) */
    page('/o-nas', 'yearly', 0.5),
    /* Dokumenty prawne niosą własną datę obowiązywania — bierzemy ją stamtąd,
       więc zmiana regulaminu przepisuje sitemapę bez wpisu w `PAGE_UPDATED`. */
    page('/regulamin', 'yearly', 0.3, TERMS.updated),
    page('/polityka-prywatnosci', 'yearly', 0.3, PRIVACY.updated),
    page('/pliki-cookies', 'yearly', 0.3, COOKIES.updated),
  ];

  /*
   * Strony kolorów (Faza 3). Lista pochodzi z `color-pages.ts`, czyli
   * z jedynego rejestru opublikowanych odcieni — sitemapa nie może wyprzedzić
   * treści. Zdjęcia to trzy kadry katalogowe tego koloru (gładki, z nadrukiem,
   * z personalizacją) i kadry aranżacyjne, które strona faktycznie renderuje.
   */
  const colorPageEntries: MetadataRoute.Sitemap = colorPages().map(({ color, content }) => {
    const path = colorPagePath(color.id);
    return {
      url: `${SITE_URL}${path}`,
      lastModified: PAGE_UPDATED[path],
      changeFrequency: 'monthly',
      priority: 0.7,
      images: [
        color.images?.DL,
        color.printImages?.DL,
        color.personalizedImages?.DL,
        ...content.shotFiles.map((file) => showcaseSrc(shotByFile(file))),
      ]
        .filter((image): image is string => Boolean(image))
        .map(abs),
    };
  });

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
    images: postImages(post),
  }));

  return [...staticPages, ...colorPageEntries, ...posts];
}
