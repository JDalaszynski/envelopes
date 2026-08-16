import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import Script from 'next/script';

import './globals.css';
import './components.css';
/* Warstwa mobilna wchodzi po komponentach — nadpisuje je świadomie,
   bez podbijania specyficzności selektorów. */
import './mobile.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { TrustBar } from '@/components/layout/TrustBar';
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ogImage, organizationJsonLd, SITE_URL } from '@/lib/seo';
import { CONTACT_DETAILS } from '@/lib/orders';

/* Typografia (pkt 4.2) — serif o charakterze tłoczonym + neutralny,
   „dokumentowy" UI sans + mono dla danych, w których liczy się precyzja. */
const fraunces = Fraunces({
  subsets: ['latin-ext'],
  weight: ['600'],
  variable: '--font-fraunces',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin-ext'],
  weight: ['400', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin-ext'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Envelopes — koperty ozdobne z nadrukiem i adresowaniem',
    template: '%s | Envelopes',
  },
  description:
    'Koperty ozdobne DL 110 × 220 mm w 19 kolorach. Nadruk logo firmowego i adresowanie, realizacja od 2 dni roboczych, faktura VAT do każdego zamówienia.',
  applicationName: 'Envelopes',
  authors: [{ name: CONTACT_DETAILS.company }],
  /* Domyślny obraz wyróżniający dla każdej trasy, która nie poda własnego.
     Strony podrzędne nadpisują `openGraph.images` w swoim `metadata` —
     Next scala te obiekty płytko, więc obraz z layoutu zostaje wszędzie tam,
     gdzie strona go nie zadeklarowała, i żadna karta nie wychodzi pusta. */
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'Envelopes',
    title: 'Envelopes — koperty ozdobne z nadrukiem i adresowaniem',
    description:
      'Koperty firmowe: 19 kolorów, trzy formaty, nadruk i adresowanie. Cena widoczna od razu.',
    images: [
      ogImage('home', 'Koperty ozdobne DL w 19 kolorach — czarna, granatowa, czerwona, matcha, złota i ecru'),
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Envelopes — koperty ozdobne z nadrukiem',
    description: 'Koperty firmowe z nadrukiem i adresowaniem. Cena widoczna od razu.',
    images: ['/images/og/home.jpg'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
};

/* `viewport-fit: cover` wpuszcza `env(safe-area-inset-*)` do CSS — bez tego
   dolny pasek akcji chowałby się pod paskiem gestów iPhone'a. Kolor motywu
   to papier z palety: pasek adresu przeglądarki dokleja się do strony
   zamiast ją obramowywać. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f2ec',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pl"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          // JSON-LD Organization — globalnie (pkt 8.3)
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <a href="#tresc" className="skip-link">
          Przejdź do treści
        </a>
        <AuthProvider>
          <CartProvider>
            <TrustBar />
            <Header />
            <main id="tresc">{children}</main>
            <Footer />
            <CookieBanner />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
