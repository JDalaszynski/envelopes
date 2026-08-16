'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import type { FormatId, PersonalizationScope } from '@/lib/catalog';

export interface ConfigurePreselect {
  format?: FormatId;
  color?: string;
  step?: number;
  /** Wchodzi do konfiguratora z włączoną opcją nadruku */
  print?: boolean;
  /** Wchodzi do konfiguratora z włączoną opcją personalizacji */
  personalization?: boolean;
  /** Ustawia zakres personalizacji — pełny adres albo samo imię i nazwisko */
  personalizationScope?: PersonalizationScope;
}

/**
 * Adres konfiguratora z preselekcją zapisaną w parametrach zapytania.
 * Parametry są potrzebne przy wejściu z podstrony (np. `/koperty-z-nadrukiem`),
 * gdzie konfiguratora nie ma w DOM — i działają także bez JavaScriptu.
 * Strona główna ma kanoniczny adres `/`, więc warianty parametryczne nie
 * tworzą osobnych adresów w indeksie.
 */
function buildHref({
  format,
  color,
  print,
  personalization,
  personalizationScope,
}: ConfigurePreselect): string {
  const params = new URLSearchParams();
  if (format) params.set('format', format);
  if (color) params.set('kolor', color);
  if (print) params.set('nadruk', '1');
  if (personalization) params.set('personalizacja', '1');
  if (personalization && personalizationScope) params.set('zakres', personalizationScope);
  const query = params.toString();
  return `/${query ? `?${query}` : ''}#konfigurator`;
}

/**
 * Przenosi do konfiguratora z wstępnie zaznaczonym formatem, kolorem oraz
 * usługą (nadruk / personalizacja) — ciągłość intencji między treścią
 * a konfiguratorem (pkt 6.1 i 7).
 *
 * Na stronie głównej klik jest przechwytywany: zamiast przeładowania strony
 * wysyłamy zdarzenie `envelopes:configure` i przewijamy do sekcji. Na
 * pozostałych trasach odnośnik działa jak zwykły link do strony głównej.
 */
export function ConfigureLink({
  format,
  color,
  step,
  print,
  personalization,
  personalizationScope,
  className,
  children,
  title,
}: ConfigurePreselect & {
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  function handleClick(event: React.MouseEvent) {
    const target = document.getElementById('konfigurator');
    if (!target) return;
    event.preventDefault();
    window.dispatchEvent(
      new CustomEvent('envelopes:configure', {
        detail: { format, color, step, print, personalization, personalizationScope },
      })
    );
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Link
      href={buildHref({ format, color, print, personalization, personalizationScope })}
      className={className}
      onClick={handleClick}
      title={title}
    >
      {children}
    </Link>
  );
}
