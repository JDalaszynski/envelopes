'use client';

import { useState } from 'react';

/** Udostępnianie wpisu — bez zewnętrznych skryptów śledzących. */
export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/blog/${slug}`;

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
