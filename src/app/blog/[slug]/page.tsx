import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { JsonLd } from '@/components/seo/JsonLd';
import { getAllPosts, getPost, getRelatedPosts } from '@/lib/blog';
import { formatDate } from '@/lib/pricing';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';

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
    },
    twitter: { card: 'summary_large_image', title: post.title, description: post.lead },
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
        <div className="container container-narrow">
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
            <EnvelopePlaceholder format={post.format} colorId={post.colorId} ratio="wide" />
          </div>

          <p className="hero-lead" style={{ fontSize: 19 }}>
            {post.intro}
          </p>

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

          {/* Kontekstowe CTA do konfiguratora */}
          <div className="card card-lg" style={{ marginTop: 'var(--space-7)' }}>
            <span className="eyebrow">Konfigurator</span>
            <h2 style={{ fontSize: 24, marginBottom: 'var(--space-3)' }}>{post.cta}</h2>
            <Link href="/#konfigurator" className="btn">
              Zamów koperty
            </Link>
          </div>

          <ShareButtons title={post.title} slug={post.slug} />

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
        </div>
      </article>
    </>
  );
}
