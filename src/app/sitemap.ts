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
import { PAGE_UPDATED } from '@/lib/page-updated';
import { SITE_URL, ogImage } from '@/lib/seo';

/**
 * Sitemap obejmuje wyłącznie strony indeksowalne (pkt 8.3).
 * Koszyk, checkout, konto, panel zamówień i panel administracyjny są
 * świadomie pominięte — to strony prywatne i przejściowe.
 * Nowe wpisy blogowe trafiają tu automatycznie.
 */

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
 * Kadr nagłówkowy wpisu — zdjęcie aranżacyjne z `public/images/zastosowania/`
 * lub kadr produktowy `EnvelopePlaceholder`. Do tego obraz wyróżniający
 * z `public/images/og/`, bo to on idzie w podgląd odnośnika.
 */
function postImages(post: BlogPost): string[] {
  const showcaseImage = post.showcaseFile
    ? abs(showcaseSrc(shotByFile(post.showcaseFile)))
    : undefined;

  const color = COLOR_MAP[post.colorId];
  const header =
    post.imageVariant === 'nadruk'
      ? color?.printImages?.DL
      : post.imageVariant === 'personalizacja'
        ? color?.personalizedImages?.DL
        : color?.images?.DL;

  return [
    ...(showcaseImage ? [showcaseImage] : header ? [abs(header)] : []),
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
