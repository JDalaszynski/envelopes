import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllPosts, getPost, getRelatedPosts } from '@/lib/blog';
import { formatDate } from '@/lib/pricing';
import { articleJsonLd, breadcrumbJsonLd, ogImage } from '@/lib/seo';

/** Generowanie statyczne wszystkich wpisów (SSG) — pkt 8.3. */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

/** Odświeżanie treści bez przebudowy całego serwisu (ISR). */
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Nie znaleziono wpisu' };

  /* Wpis bez własnego kadru dziedziczy zbiorczy obraz bloga — karta nigdy
     nie wychodzi pusta, nawet zanim powstanie dedykowana grafika. */
  const image = ogImage(post.ogImageSlug ?? 'blog', post.ogImageAlt ?? post.title);

  return {
    title: post.title,
    description: post.lead,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.lead,
      url: `/blog/${post.slug}`,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      section: post.category,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.lead,
      images: [image.url],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);
  const showToc = post.sections.length >= 3;

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />

      <article className="section">
        <div className="container container-article">
          <nav aria-label="Ścieżka nawigacji" className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
            <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span>{' '}
            <Link href="/blog">Blog</Link> <span aria-hidden="true">›</span> {post.category}
          </nav>

          <span className="eyebrow">{post.category}</span>
          <h1>{post.title}</h1>
          <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
            <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min
            czytania
          </p>

          <div style={{ margin: 'var(--space-6) 0' }}>
            {/* Kadr zgodny z tematem wpisu: poradnik o nadruku ilustrujemy
                zdjęciem koperty z nadrukiem, nie gładkiej (pkt 5.6 briefu SEO). */}
            <EnvelopePlaceholder
              format={post.format}
              colorId={post.colorId}
              ratio="wide"
              hasPrint={post.imageVariant === 'nadruk'}
              hasPersonalization={post.imageVariant === 'personalizacja'}
            />
          </div>

          <p className="hero-lead" style={{ fontSize: 19, maxWidth: 'none' }}>
            {post.intro}
          </p>

          {/* Link w górę do filara klastra — przekazanie autorytetu (pkt 5.4 briefu SEO) */}
          {post.pillar && (
            <p className="notice notice-seal" style={{ marginBottom: 'var(--space-6)', maxWidth: 'none' }}>
              Strona oferty: <Link href={post.pillar.href}>{post.pillar.anchor}</Link> — cennik,
              specyfikacja i wejście do konfiguratora.
            </p>
          )}

          {showToc && (
            <nav className="toc" aria-label="Spis treści">
              <strong className="small">W tym artykule</strong>
              <ol>
                {post.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="prose">
            {post.sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {/* Tabela faktów — najczęściej ekstrahowana struktura przez
                    modele generatywne (pkt 6.4 briefu SEO). Pierwsza kolumna
                    jest nagłówkiem wiersza, `data-label` zasila widok kartowy
                    na telefonie (`m-cards` w mobile.css). */}
                {section.table && (
                  <div className="table-wrap m-cards" style={{ margin: 'var(--space-5) 0' }}>
                    <table className="data">
                      <caption className="sr-only">{section.table.caption}</caption>
                      <thead>
                        <tr>
                          {section.table.head.map((cell) => (
                            <th scope="col" key={cell}>
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row[0]}>
                            {row.map((cell, cellIndex) =>
                              cellIndex === 0 ? (
                                <th scope="row" key={cellIndex}>
                                  {cell}
                                </th>
                              ) : (
                                <td key={cellIndex} data-label={section.table?.head[cellIndex]}>
                                  {cell}
                                </td>
                              )
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.list && (
                  <ul>
                    {section.list.map((entry, index) => (
                      <li key={index}>{entry}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Kontekstowe CTA do konfiguratora. Wpisy z polem `ctaConfigure`
              wchodzą do konfiguratora z preselekcją formatu, koloru i usługi —
              ciągłość intencji (pkt 7 briefu SEO). */}
          <div className="card card-lg" style={{ marginTop: 'var(--space-7)' }}>
            <span className="eyebrow">Konfigurator</span>
            <h2 style={{ fontSize: 24, marginBottom: 'var(--space-3)' }}>{post.cta}</h2>
            {post.ctaConfigure ? (
              <ConfigureLink
                format={post.ctaConfigure.format}
                color={post.ctaConfigure.color}
                print={post.ctaConfigure.print}
                personalization={post.ctaConfigure.personalization}
                className="btn"
              >
                {post.ctaConfigure.label}
              </ConfigureLink>
            ) : (
              <Link href="/#konfigurator" className="btn">
                Zamów koperty
              </Link>
            )}
          </div>

          <ShareButtons title={post.title} slug={post.slug} />

          {/* Nagłówek tylko wtedy, gdy jest co pokazać — przy jednym wpisie na
              blogu `getRelatedPosts` zwraca pustą listę (content-plan.md,
              czystka wpisów startowych z 15 sierpnia 2026). */}
          {related.length > 0 && (
          <section style={{ marginTop: 'var(--space-8)' }}>
            <h2 style={{ marginBottom: 'var(--space-5)' }}>Powiązane wpisy</h2>
            <div className="grid grid-3">
              {related.map((entry) => (
                <article className="post-card" key={entry.slug}>
                  <EnvelopePlaceholder
                    format={entry.format}
                    colorId={entry.colorId}
                    ratio="wide"
                    hideCaption
                    size="sm"
                  />
                  <div className="post-card-body">
                    <span className="badge">{entry.category}</span>
                    <h3 style={{ fontSize: 18 }}>
                      <Link href={`/blog/${entry.slug}`}>{entry.title}</Link>
                    </h3>
                    <div className="post-meta">
                      <span>{formatDate(entry.date)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}
        </div>
      </article>
    </>
  );
}
