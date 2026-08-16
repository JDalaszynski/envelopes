import type { Metadata } from 'next';

import { BlogList } from '@/components/blog/BlogList';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllPosts } from '@/lib/blog';
import { breadcrumbJsonLd, ogImage } from '@/lib/seo';

export const metadata: Metadata = {
  /* Pełne „…i korespondencji firmowej" dawało 68 znaków razem z szablonem
     `| Envelopes` — poza próg wyświetlania w wyniku wyszukiwania. */
  title: 'Blog — poradniki o kopertach firmowych',
  /* Opis obiecywał „realizacje klientów", a wpisy tego typu zostały z bloga
     usunięte (content-plan.md, 15 sierpnia 2026). Zapowiadanie w wyniku
     wyszukiwania treści, której na stronie nie ma, to najkrótsza droga
     do powrotu do wyników — i obietnica bez pokrycia. */
  description:
    'Praktyczne poradniki o doborze kopert, przygotowaniu plików do nadruku i adresowaniu korespondencji firmowej. Konkrety z cennika, bez ogólników.',
  // Kanoniczny adres listy — filtry i sortowanie nie tworzą osobnych URL-i (pkt 8.3)
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog Envelopes — koperty i korespondencja firmowa',
    description: 'Poradniki o doborze kopert, plikach do nadruku i adresowaniu korespondencji firmowej.',
    url: '/blog',
    type: 'website',
    images: [ogImage('blog', 'Koperta DL z papieru Eko z brązowym nadrukiem logo palarni kawy')],
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
