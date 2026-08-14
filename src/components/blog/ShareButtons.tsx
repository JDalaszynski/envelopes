'use client';

import { useState } from 'react';

import { SITE_URL } from '@/lib/seo';

/**
 * Udostępnianie wpisu — bez zewnętrznych skryptów śledzących.
 *
 * Adres składamy z kanonicznego `SITE_URL`, nie z `window.location`: gałąź
 * serwerowa dawała pusty adres, klient pełny, co kończyło się błędem
 * hydratacji. Przy okazji udostępniany link jest zawsze kanoniczny —
 * niezależnie od tego, spod jakiej domeny użytkownik wszedł.
 */
export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}/blog/${slug}`;

  return (
    <div className="row" style={{ marginTop: 'var(--space-6)', gap: 'var(--space-2)' }}>
      <span className="small muted">Udostępnij:</span>
      <a
        className="btn btn-secondary btn-sm"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer nofollow"
      >
        LinkedIn
      </a>
      <a
        className="btn btn-secondary btn-sm"
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
      >
        E-mail
      </a>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2500);
          });
        }}
      >
        {copied ? 'Skopiowano' : 'Kopiuj link'}
      </button>
    </div>
  );
}
