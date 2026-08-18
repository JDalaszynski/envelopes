import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/seo/JsonLd';
import { QuoteForm } from '@/components/forms/QuoteForm';
import { BULK_QUOTE_THRESHOLD } from '@/lib/catalog';
import { CONTACT_DETAILS } from '@/lib/orders';
import { breadcrumbJsonLd, ogImage, webPageJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kontakt — Biuro Obsługi Klienta',
  /* 97 znaków zostawiało w wyniku wyszukiwania pół wiersza pustki. Dopisany
     próg wyceny indywidualnej niesie konkret, po który klient B2B tu wchodzi. */
  description: `Kontakt do Envelopes: telefon, e-mail i godziny pracy Biura Obsługi Klienta. Wycena indywidualna powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk, faktura VAT do każdego zamówienia.`,
  alternates: { canonical: '/kontakt' },
  openGraph: {
    type: 'website',
    title: 'Kontakt i wycena indywidualna — Envelopes',
    /* Bez `description` karta w podglądzie odnośnika dziedziczyła opis
       z layoutu, czyli ofertę zamiast informacji kontaktowej. */
    description: `Telefon, e-mail i godziny pracy Biura Obsługi Klienta. Wycena indywidualna zamówień powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk.`,
    url: '/kontakt',
    images: [
      ogImage('kontakt', 'Koperta DL Biała Perłowa z nadrukiem logo firmowego na szczotkowanym metalu'),
    ],
  },
};

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/kontakt',
          type: 'ContactPage',
          name: String(metadata.title),
          description: String(metadata.description),
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Kontakt', url: '/kontakt' },
        ])}
      />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kontakt</span>
            <h1>Jesteśmy do Państwa dyspozycji</h1>
            <p>
              Na pytania o zamówienia i pliki do druku odpowiadamy w ciągu jednego dnia roboczego.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
            <div className="card">
              <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Biuro Obsługi Klienta</h2>
              <p className="small" style={{ margin: 0 }}>
                <a href={`tel:${CONTACT_DETAILS.phoneHref}`}>{CONTACT_DETAILS.phone}</a>
                <br />
                <a href={`mailto:${CONTACT_DETAILS.email}`}>{CONTACT_DETAILS.email}</a>
                <br />
                <span className="muted">{CONTACT_DETAILS.hours}</span>
              </p>
              <hr style={{ margin: 'var(--space-4) 0' }} />
              <p className="small" style={{ margin: 0 }}>
                Sprawy zamówień:{' '}
                <a href={`mailto:${CONTACT_DETAILS.ordersEmail}`}>{CONTACT_DETAILS.ordersEmail}</a>
                <br />
                <span className="muted">
                  Prosimy podawać numer zamówienia w formacie ENV-RRRRMMDD-XXXX.
                </span>
              </p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Dane rejestrowe</h2>
              <p className="small muted" style={{ margin: 0 }}>
                {CONTACT_DETAILS.company}
                <br />
                {CONTACT_DETAILS.address}
                <br />
                NIP {CONTACT_DETAILS.nip}
                <br />
                REGON {CONTACT_DETAILS.regon}
                <br />
                Działalność wpisana do CEIDG
              </p>
              <p className="small" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                Więcej o marce Envelopes i o tym, jak pracujemy, znajdą Państwo na stronie{' '}
                <Link href="/o-nas">o nas</Link>.
              </p>
            </div>



            <div className="card">
              <h2 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Szybsza odpowiedź</h2>
              <p className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
                Najczęstsze pytania o pliki, terminy i faktury zebraliśmy w sekcji FAQ.
              </p>
              <Link href="/#faq" className="btn btn-secondary btn-sm">
                Przejdź do FAQ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Wycena hurtowa — kotwica #wycena, do której prowadzą CTA ze strony
          głównej i z filara /koperty-z-nadrukiem (pkt 7 briefu SEO). */}
      <section className="section" id="wycena" style={{ paddingTop: 0 }}>
        <div className="container container-narrow">
          <p className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
            Zamówienia do {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk wyceniają Państwo
            samodzielnie w <Link href="/#konfigurator">konfiguratorze</Link>. Powyżej tego progu
            ustalamy harmonogram dostaw i sposób rozliczenia — prosimy o wypełnienie formularza.
          </p>
          <QuoteForm />
        </div>
      </section>
    </>
  );
}
