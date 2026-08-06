'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { BLOG_CATEGORIES, type BlogPost } from '@/lib/blog';
import { formatDate } from '@/lib/pricing';

/**
 * Filtrowanie i sortowanie działa po stronie klienta na danych osadzonych
 * już w serwerowo wyrenderowanym HTML — Googlebot widzi pełną listę wpisów
 * niezależnie od wykonania JS (pkt 8.3).
 */
export function BlogList({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'data' | 'popularnosc'>('data');

  const visible = useMemo(() => {
    let result = posts.filter((post) => {
      if (category !== 'all' && post.category !== category) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          post.lead.toLowerCase().includes(q) ||
          post.keywords.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
    if (sort === 'popularnosc') {
      result = [...result].sort((a, b) => b.readingMinutes - a.readingMinutes);
    }
    return result;
  }, [posts, category, query, sort]);

  return (
    <>
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="filter-row" style={{ marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            className={category === 'all' ? 'btn btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setCategory('all')}
          >
            Wszystkie
          </button>
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={category === cat ? 'btn btn-sm' : 'btn btn-secondary btn-sm'}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div className="field">
            <label htmlFor="szukaj-blog">Szukaj we wpisach</label>
            <input
              id="szukaj-blog"
              className="input"
              placeholder="np. adresowanie, pliki do druku"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sort">Sortowanie</label>
            <select
              id="sort"
              className="select input"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'data' | 'popularnosc')}
            >
              <option value="data">Od najnowszych</option>
              <option value="popularnosc">Najczęściej czytane</option>
            </select>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <h2 style={{ fontSize: 20 }}>Brak wpisów spełniających kryteria</h2>
          <p className="muted">Prosimy zmienić kategorię albo wyczyścić wyszukiwanie.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {visible.map((post) => (
            <article className="post-card" key={post.slug}>
              <EnvelopePlaceholder
                format={post.format}
                colorId={post.colorId}
                ratio="wide"
                hideCaption
                size="sm"
              />
              <div className="post-card-body">
                <span className="badge">{post.category}</span>
                <h2 style={{ fontSize: 20 }}>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="small muted">{post.lead}</p>
                <div className="post-meta">
                  <span>{formatDate(post.date)}</span>
                  <span>{post.readingMinutes} min czytania</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
