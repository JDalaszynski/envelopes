import type { Metadata } from 'next';

import { BlogList } from '@/components/blog/BlogList';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllPosts } from '@/lib/blog';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Blog — poradniki o kopertach i korespondencji firmowej',
  description:
    'Praktyczne poradniki o doborze kopert, przygotowaniu plików do nadruku i adresowaniu korespondencji firmowej. Inspiracje kolorystyczne i realizacje klientów.',
  // Kanoniczny adres listy — filtry i sortowanie nie tworzą osobnych URL-i (pkt 8.3)
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog Envelopes — koperty i korespondencja firmowa',
    description: 'Poradniki, inspiracje i realizacje dotyczące kopert ozdobnych.',
    url: '/blog',
    type: 'website',
  },
};

/** Lista blogowa renderowana statycznie — pełny HTML dla Googlebota (pkt 8.3). */
export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Blog', url: '/blog' },
        ])}
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Blog</span>
            <h1>Poradniki, inspiracje i realizacje</h1>
            <p>
              Jak dobrać format koperty, przygotować plik do nadruku i zaplanować wysyłkę
              korespondencji firmowej — bez marketingowej waty.
            </p>
          </div>

          <BlogList posts={posts} />
        </div>
      </section>
    </>
  );
}
