'use client';

import { useEffect, useRef } from 'react';

interface ParallaxBackgroundProps {
  imageUrl: string;
}

export function ParallaxBackground({ imageUrl }: ParallaxBackgroundProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bgRef.current) return;
      const parent = bgRef.current.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const viewHeight = window.innerHeight;

      // Only animate if the parent container is in the viewport
      if (rect.bottom >= 0 && rect.top <= viewHeight) {
        // Calculate scroll offset relative to the page scroll
        const scrolled = window.scrollY;
        // Subtle translation factor (0.15 gives a clean, noticeable but gentle effect)
        bgRef.current.style.transform = `translate3d(0, ${scrolled * 0.15}px, 0)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial alignment
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      ref={bgRef}
      className="parallax-bg-image"
      style={{
        backgroundImage: `url(${imageUrl})`,
        position: 'absolute',
        top: '-120px', // bleed area to prevent white edges during scroll translation
        bottom: '-120px',
        left: 0,
        right: 0,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
        willChange: 'transform',
      }}
    />
  );
}
