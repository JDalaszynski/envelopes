'use client';

import type { ReactNode } from 'react';

import type { FormatId } from '@/lib/catalog';

/**
 * Przenosi do konfiguratora z wstępnie zaznaczonym formatem lub kolorem.
 * Używane w sekcjach „Formaty i zastosowania" oraz „Paleta kolorów" (pkt 6.1).
 */
export function ConfigureLink({
  format,
  color,
  step,
  className,
  children,
  title,
}: {
  format?: FormatId;
  color?: string;
  step?: number;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent('envelopes:configure', { detail: { format, color, step } })
    );
    document.getElementById('konfigurator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <a href="#konfigurator" className={className} onClick={handleClick} title={title}>
      {children}
    </a>
  );
}
