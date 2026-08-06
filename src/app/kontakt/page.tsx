import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/seo/JsonLd';
import { CONTACT_DETAILS } from '@/lib/orders';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kontakt — Biuro Obsługi Klienta',
  description:
    'Kontakt do Envelopes: telefon, e-mail, godziny pracy Biura Obsługi Klienta oraz dane rejestrowe.',
  alternates: { canonical: '/kontakt' },
  openGraph: { title: 'Kontakt — Envelopes', url: '/kontakt' },
};

export default function ContactPage() {
  return (
    <>
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
                KRS {CONTACT_DETAILS.krs}
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
    </>
  );
}
