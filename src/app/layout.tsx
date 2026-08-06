import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

import './globals.css';
import './components.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { TrustBar } from '@/components/layout/TrustBar';
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { organizationJsonLd } from '@/lib/seo';

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Envelopes — koperty ozdobne z nadrukiem i adresowaniem',
    template: '%s | Envelopes',
  },
  description:
    'Koperty ozdobne w formatach DL, C6 i K4, w 19 kolorach. Nadruk firmowy, adresowanie, realizacja od 2 dni roboczych, faktura VAT i odroczony termin płatności dla firm.',
  applicationName: 'Envelopes',
  authors: [{ name: 'Envelopes sp. z o.o.' }],
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    siteName: 'Envelopes',
    title: 'Envelopes — koperty ozdobne z nadrukiem i adresowaniem',
    description:
      'Koperty firmowe: 19 kolorów, trzy formaty, nadruk i adresowanie. Cena widoczna od razu.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Envelopes — koperty ozdobne z nadrukiem',
    description: 'Koperty firmowe z nadrukiem i adresowaniem. Cena widoczna od razu.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/images/favicon.png',
    apple: '/images/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
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
