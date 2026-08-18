'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import { COOKIE_CONSENT_EVENT, readConsent } from '@/components/layout/CookieBanner';
import { setAnalyticsAllowed } from '@/lib/analytics';

/**
 * Google Analytics 4 — ładowane wyłącznie po zgodzie analitycznej.
 *
 * **Dlaczego to przeniosło się z `layout.tsx`.** Skrypt `gtag` był tam
 * renderowany bezwarunkowo, przy samym tylko `NEXT_PUBLIC_GA_ID`. Baner
 * cookies obiecywał w tym czasie wprost: „Do czasu dokonania wyboru nie
 * ładujemy żadnych skryptów analitycznych ani marketingowych", a Polityka
 * Cookies powtarzała to jako zobowiązanie. Skrypt szedł więc do przeglądarki
 * przed decyzją, także wtedy, gdy odwiedzający wybrał „Odrzuć niekonieczne" —
 * czyli serwis zbierał dane wbrew własnej deklaracji. Dodawanie warstwy
 * zdarzeń na taki fundament tylko powiększyłoby problem, dlatego wchodzi
 * razem z bramką.
 *
 * **Bramka jest po stronie ładowania, nie po stronie trybu zgody.** Consent
 * Mode wpuszcza `gtag` na stronę od razu i dopiero potem ogranicza mu zapis
 * — to poprawne podejście, ale sprzeczne ze zdaniem, które stoi w banerze
 * i w Polityce Cookies. Dopóki tamten tekst brzmi, jak brzmi, obowiązuje
 * jego wersja: bez zgody nie ma żądania do `googletagmanager.com` w ogóle.
 *
 * **Wycofanie zgody.** Odmontowanie `<Script>` nie usuwa `gtag` z pamięci
 * już wczytanej strony, więc sama zmiana stanu tutaj nie wystarczy — wysyłkę
 * zdarzeń zamyka `setAnalyticsAllowed(false)` w `lib/analytics.ts`. Skrypt
 * znika ostatecznie przy następnym przeładowaniu.
 *
 * Odsłony podstron liczy pomiar ulepszony GA4 (zdarzenia historii
 * przeglądarki), włączony w usłudze domyślnie — App Router zmienia adres bez
 * przeładowania dokumentu, więc bez niego zliczałaby się wyłącznie strona
 * wejścia.
 */
export function Analytics({ measurementId }: { measurementId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const allowed = readConsent()?.analytics === true;
      setEnabled(allowed);
      setAnalyticsAllowed(allowed);
    };

    sync();
    window.addEventListener(COOKIE_CONSENT_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
