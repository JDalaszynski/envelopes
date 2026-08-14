import type { MetadataRoute } from 'next';

import { getAllPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/seo';

/**
 * Sitemap obejmuje wyłącznie strony indeksowalne (pkt 8.3).
 * Koszyk, checkout, konto, panel zamówień i panel administracyjny są
 * świadomie pominięte — to strony prywatne i przejściowe.
 * Nowe wpisy blogowe trafiają tu automatycznie.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    /* Filar K1 — strona ofertowa nadruku (content-plan.md poz. 1) */
    { url: `${SITE_URL}/koperty-z-nadrukiem`, changeFrequency: 'monthly', priority: 0.9 },
    /* Filar K2 — personalizacja i adresowanie (content-plan.md poz. 2) */
    { url: `${SITE_URL}/koperty-personalizowane`, changeFrequency: 'monthly', priority: 0.9 },
    /* Filar K4 — wymiary i specyfikacja formatu DL (content-plan.md poz. 3) */
    { url: `${SITE_URL}/koperty-dl`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/regulamin`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/polityka-prywatnosci`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/pliki-cookies`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated ?? post.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...posts];
}
