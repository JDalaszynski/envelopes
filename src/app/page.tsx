import type { Metadata } from 'next';
import Link from 'next/link';

import { Configurator } from '@/components/configurator/Configurator';
import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { EnvelopeShape } from '@/components/ui/EnvelopeShape';
import { JsonLd } from '@/components/seo/JsonLd';
import { COLORS, FORMATS } from '@/lib/catalog';
import { FAQ_ITEMS } from '@/lib/faq';
import { getAllPosts } from '@/lib/blog';
import { DEFAULT_PRICING, formatDate, formatPrice } from '@/lib/pricing';
import { faqJsonLd, productJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Koperty ozdobne z nadrukiem — DL, C6, K4 w 19 kolorach',
  description:
    'Koperty firmowe w formatach DL, C6 i K4, w 19 kolorach, z nadrukiem i adresowaniem. Cena od 2,12 zł/szt., realizacja od 2 dni roboczych, faktura VAT i odroczony termin płatności.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Envelopes — koperty ozdobne z nadrukiem i adresowaniem',
    description:
      'Koperty firmowe: 19 kolorów, trzy formaty, nadruk i adresowanie. Cena widoczna od razu.',
    url: '/',
  },
};

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <>
      <JsonLd data={productJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span className="eyebrow">Koperty ozdobne dla firm</span>
          <h1 style={{ marginInline: 'auto' }}>Koperty, które robią wrażenie, zanim zostaną otwarte.</h1>
          <p className="hero-lead" style={{ marginInline: 'auto' }}>
            Wyróżnij swoją markę dzięki eleganckim kopertom z własnym nadrukiem i gotowym adresowaniem.
          </p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link href="#konfigurator" className="btn btn-lg">
              Zamów koperty
            </Link>
          </div>

          <div className="usp-bar" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { title: '19 kolorów', note: 'W jednej cenie — bez dopłat za perłę i metalik' },
              { title: 'Nadruk i personalizacja', note: 'Logo firmowe oraz adresowanie kopert' },
              { title: 'Wysyłka od 2 dni roboczych', note: 'Standard 5 dni, ekspres 2 dni' },
            ].map((usp) => (
              <div className="usp" key={usp.title}>
                <span style={{ textAlign: 'left' }}>
                  <strong>{usp.title}</strong>
                  <small>{usp.note}</small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Konfigurator — na białym tle, wizualnie wydzielony z reszty strony ── */}
      <section className="section section-surface" id="konfigurator">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Konfigurator Kopert</span>
            <h2>Trzy kroki do gotowego zamówienia</h2>
            <p>
              Cena aktualizuje się przy każdej zmianie.
            </p>
          </div>
          <Configurator />
        </div>
      </section>

      {/* ── Jak to działa ── */}
      <section className="section" id="jak-to-dziala">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Jak to działa</span>
            <h2>Od wyboru koperty do przesyłki</h2>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <h3 style={{ fontSize: 20 }}>Wybierz koperty</h3>
              <p className="small muted">
                Format, kolor, ilość, opcjonalnie nadruk i adresowanie. Wycena od razu, bez
                zapytania ofertowego.
              </p>
            </div>
            <div className="how-step">
              <h3 style={{ fontSize: 20 }}>Opłać</h3>
              <p className="small muted">
                BLIK, karta, szybki przelew, przelew tradycyjny albo faktura z odroczonym terminem
                dla firm.
              </p>
            </div>
            <div className="how-step">
              <h3 style={{ fontSize: 20 }}>Zaakceptuj wizualizację</h3>
              <p className="small muted">
                Krok wyłącznie dla zamówień z nadrukiem lub personalizacją. Grafik przesyła projekt,
                Państwo zatwierdzają.
              </p>
            </div>
            <div className="how-step">
              <h3 style={{ fontSize: 20 }}>Odbierz przesyłkę</h3>
              <p className="small muted">
                Kurier pod wskazany adres. Status i numer przesyłki widoczne w panelu zamówień.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Formaty i zastosowania ── */}
      <section className="section" id="formaty">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Formaty</span>
            <h2>Który format będzie właściwy</h2>
            <p>Kliknięcie w kartę przenosi do sklepu z wybranym formatem.</p>
          </div>
          <div className="grid grid-3">
            {FORMATS.filter((f) => !f.hidden).map((format) => (
              <ConfigureLink
                key={format.id}
                format={format.id}
                className="card"
                title={`Wybierz kopertę ${format.id}`}
              >
                <div style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                  <EnvelopePlaceholder
                    format={format.id}
                    colorId="ecru"
                    ratio="wide"
                    size="sm"
                    hideCaption
                  />
                  <h3 style={{ marginTop: 'var(--space-4)' }}>{format.id}</h3>
                  <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                    {format.dimensions} · od {formatPrice(DEFAULT_PRICING.base[format.id])}/szt.
                  </p>
                  <p className="small">{format.audience}</p>
                  <p className="small" style={{ color: 'var(--color-seal)', marginTop: 'var(--space-3)' }}>
                    Wybierz format {format.id} →
                  </p>
                </div>
              </ConfigureLink>
            ))}
          </div>
        </div>
      </section>

      {/* ── Paleta kolorów ── */}
      <section className="section-tight" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Paleta</span>
            <h2>19 kolorów w jednej cenie</h2>
            <p>
              Wykończenia perłowe i metaliczne kosztują dokładnie tyle, co odcienie podstawowe.
              Kliknięcie w kolor przenosi do sklepu z zaznaczonym odcieniem.
            </p>
          </div>
          <div className="palette-scroller">
            {COLORS.map((color) => (
              <ConfigureLink
                key={color.id}
                color={color.id}
                step={1}
                className="palette-chip"
                title={`Wybierz kopertę w kolorze ${color.name}`}
              >
                <span className="swatch-shape">
                  <EnvelopeShape colorId={color.id} />
                </span>
                <span>{color.name}</span>
              </ConfigureLink>
            ))}
          </div>
        </div>
      </section>



      {/* ── Dla firm ── */}
      <section className="section" id="dla-firm">
        <div className="container">
          <div className="card card-lg grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <span className="eyebrow">Dla firm</span>
              <h2>Rozliczenie dopasowane do obiegu dokumentów</h2>
              <ul className="small" style={{ paddingLeft: 'var(--space-5)', lineHeight: 1.8 }}>
                <li>Faktura VAT do każdego zamówienia, także przy zakupie bez NIP.</li>
                <li>
                  Faktura z odroczonym terminem płatności — dla instytucji, jednostek budżetowych
                  i firm rozliczających zakupy przelewem po dostawie.
                </li>
                <li>Stała cena jednostkowa niezależnie od wielkości zamówienia.</li>
                <li>Zapisane konfiguracje i ponowne zamówienie jednym kliknięciem.</li>
              </ul>
              <div className="row" style={{ marginTop: 'var(--space-5)' }}>
                <Link href="/rejestracja?typ=firmowe" className="btn">
                  Załóż konto firmowe
                </Link>
                <Link href="/kontakt#wycena" className="btn btn-secondary">
                  Zapytaj o wycenę hurtową
                </Link>
              </div>
            </div>
            <EnvelopePlaceholder format="K4" colorId="granatowy" ratio="photo" />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania</h2>
          </div>
          {FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <div className="faq-answer">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Blog ── */}
      <section className="section" id="blog">
        <div className="container">
          <div className="row-between section-head" style={{ maxWidth: 'none' }}>
            <div>
              <span className="eyebrow">Blog</span>
              <h2>Poradniki i inspiracje</h2>
            </div>
            <Link href="/blog" className="btn btn-secondary">
              Wszystkie wpisy
            </Link>
          </div>
          <div className="grid grid-3">
            {posts.map((post) => (
              <article className="post-card" key={post.slug}>
                <EnvelopePlaceholder
                  format={post.format}
                  colorId={post.colorId}
                  ratio="wide"
                  hideCaption
                  size="sm"
                />
                <div className="post-card-body">
                  <span className="badge">{post.category}</span>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="small muted">{post.lead}</p>
                  <div className="post-meta">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingMinutes} min czytania</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>



      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi, by zamówić?</h2>
              <p>
                Wybór koperty zajmuje minutę, a cenę widzą Państwo od razu — bez zapytania
                ofertowego.
              </p>
            </div>
            <Link href="#konfigurator" className="btn btn-lg">
              Zamów koperty
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Seal() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'var(--color-seal)',
        flexShrink: 0,
        marginTop: 5,
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,.35)',
      }}
    />
  );
}
