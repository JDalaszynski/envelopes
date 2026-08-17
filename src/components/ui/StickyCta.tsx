'use client';

import { useEffect, useState } from 'react';
import { ConfigureLink, type ConfigurePreselect } from '@/components/home/ConfigureLink';

export interface StickyCtaProps extends ConfigurePreselect {
  label?: string;
  threshold?: number;
}

/**
 * Pływający / przyklejony przycisk CTA u dołu ekranu na podstronach i wpisach blogowych.
 * Pojawia się płynnie po przewinięciu strony poza obszar początkowy (domyślnie 250px)
 * i prowadzi bezpośrednio do konfiguratora na stronie głównej.
 */
export function StickyCta({
  label = 'Zamów koperty ozdobne',
  threshold = 250,
  format,
  color,
  step,
  print,
  personalization,
  personalizationScope,
}: StickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldShow = window.scrollY > threshold;
          setVisible(shouldShow);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return (
    <aside
      className="sticky-cta"
      data-visible={visible}
      aria-hidden={!visible}
      aria-label="Szybkie przejście do zamówienia"
    >
      <ConfigureLink
        format={format}
        color={color}
        step={step}
        print={print}
        personalization={personalization}
        personalizationScope={personalizationScope}
        className="btn btn-lg sticky-cta-btn"
        title={label}
      >
        {label}
      </ConfigureLink>
    </aside>
  );
}
