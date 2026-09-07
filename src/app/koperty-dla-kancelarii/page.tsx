import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { colorPagePath, hasColorPage } from '@/lib/color-pages';
import { BULK_QUOTE_THRESHOLD, COLOR_MAP, FORMAT_MAP } from '@/lib/catalog';
import { DEFAULT_PRICING, calculatePrice, formatPrice } from '@/lib/pricing';
import { breadcrumbJsonLd, ogImage, productId, webPageJsonLd } from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K1 pod filarem F1 — „koperty dla kancelarii"
 * (content-plan.md poz. 17, Tydzień 5).
 *
 * **Rozgraniczenie wobec F1 i wobec `/koperty-premium`.** F1 poświęca
 * kancelariom jedno zdanie w sekcji „Dla kogo", a `/koperty-premium` — jedną
 * kartę o gramaturze. Ta strona zawęża się do jednej branży i dokłada to,
 * czego żadna z nich nie ma: typologię pism, które faktycznie trafiają do
 * koperty (akt notarialny, wezwanie, pismo procesowe — każde z inną stawką
 * poufności), oraz scenariusz adresowania wielu różnych odbiorców naraz,
 * którego strony o vouchery (poz. 19, 23) nie potrzebowały. **Nie powtarza
 * cennika F1** (content-plan.md, uwaga do poz. 17) — sekcja kosztowa linkuje
 * zamiast rozpisywać składniki drugi raz.
 *
 * **Bez własnego `FAQPage`** — `PRINT_FAQ_ITEMS` na F1 pokrywa już pytania
 * o cenę, MOQ i pliki. `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Jedyny realny kadr aranżacyjny to Granatowy**
 * (`granatowa-koperta-dl-nadruk-logo-kancelarii`) — ten sam, którego już
 * używają F1 i `/koperty-premium`. Czarny i Taupe (baza wiedzy pkt 1) pokazane
 * jako próbki katalogowe, nie zdjęcia — tych kadrów w tym kontekście nie ma.
 */

const DL = FORMAT_MAP.DL;

const BASE_CONFIG: EnvelopeConfig = {
  format: 'DL',
  color: '',
  quantity: 1,
  print: false,
  printFiles: [],
  personalization: false,
  shippingSpeed: 'standard',
};

const printed = calculatePrice({ ...BASE_CONFIG, print: true });
const printedAddressed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

const GRANATOWY = COLOR_MAP['granatowy'];
const GRANATOWY_SHOT = shotByFile('granatowa-koperta-dl-nadruk-logo-kancelarii');

/** Dwa odcienie stonowane obok Granatowego — z bazy wiedzy (pkt 1). */
const STONED_COLOR_IDS = ['czarny', 'taupe'];

/** Typy pism, które trafiają do koperty kancelaryjnej — baza wiedzy pkt 1. */
const DOCUMENT_TYPES: { name: string; text: string }[] = [
  {
    name: 'Akt notarialny',
    text: 'Dokument, który klient odkłada do domowego archiwum na lata. Sztywny papier chroni go przed zagnieceniem w drodze z kancelarii, a stonowany kolor nadaje mu wagę już w momencie odebrania.',
  },
  {
    name: 'Wezwanie do zapłaty',
    text: 'Pismo o skutkach prawnych powinno wyglądać na to, czym jest — nie na przesyłkę reklamową, którą można zignorować. Koperta bez okienka i z logo kancelarii buduje powagę już na etapie koperty, zanim adresat przeczyta treść.',
  },
  {
    name: 'Pismo procesowe',
    text: `Złożone na trzy wchodzi do koperty DL ${DL.dimensions} bez dodatkowego zagięcia — ten sam wymiar, którym posługuje się sąd i strona przeciwna. Termin doręczenia liczy się od daty stempla, więc koperta musi być gotowa do wysyłki, nie do przygotowania.`,
  },
  {
    name: 'Opinia prawna',
    text: 'Dokument przygotowywany na zlecenie i fakturowany osobno — jego opakowanie jest częścią wrażenia, za które klient płaci. Papier barwiony w masie odróżnia go od wydruku spiętego zszywką.',
  },
  {
    name: 'Umowa do podpisu',
    text: 'Komplet dokumentów przekazywany kontrahentowi przed podpisaniem. Koperta z logo kancelarii porządkuje przesyłkę i sygnalizuje, że w środku jest coś, co wymaga uważnego przeczytania, a nie odłożenia na później.',
  },
];

const kancelarieTitle = 'Koperty dla kancelarii prawnych i notarialnych';
const kancelarieDescription = `Koperta dla kancelarii bez okienka adresowego, nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk za ${formatPrice(printed.unitTotal)} brutto/szt. Kolory stonowane: Granatowy, Czarny, Taupe.`;

export const metadata: Metadata = {
  title: kancelarieTitle,
  description: kancelarieDescription,
  keywords: [
    'koperty dla kancelarii',
    'koperty dla kancelarii prawnych',
    'koperty dla notariusza',
    'koperty firmowe dla prawników',
  ],
  alternates: { canonical: '/koperty-dla-kancelarii' },
  openGraph: {
    type: 'website',
    title: 'Koperty dla kancelarii prawnych i notarialnych — Envelopes',
    description: kancelarieDescription,
    url: '/koperty-dla-kancelarii',
    images: [
      ogImage(
        'koperty-dla-kancelarii',
        'Granatowa koperta DL z jasnym nadrukiem logo kancelarii prawnej, na ciemnym drewnie'
      ),
    ],
  },
};

export default function KancelarieEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-kancelarii',
          type: 'ItemPage',
          name: kancelarieTitle,
          description: kancelarieDescription,
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-dla-kancelarii', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
          { name: 'Kancelarie', url: '/koperty-dla-kancelarii' },
        ])}
      />

      {/* ── Hero — blok odpowiedzi GEO + pierwsze CTA nad linią zgięcia ── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/hero-tlo-2015.webp" />
          <div className="container">
            <nav
              aria-label="Ścieżka nawigacji"
              className="small muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span>{' '}
              <Link href="/koperty-z-nadrukiem">Koperty z nadrukiem</Link>{' '}
              <span aria-hidden="true">›</span> Kancelarie
            </nav>

            <span className="eyebrow">Korespondencja prawna</span>
            <h1>Koperty dla kancelarii prawnych i notarialnych</h1>
            <p className="hero-lead">
              Akt notarialny, wezwanie do zapłaty albo pismo procesowe złożone na trzy wchodzi do
              koperty DL {DL.dimensions} bez dodatkowego zagięcia. Koperty Envelopes są bez okienka
              adresowego, więc treść pisma pozostaje poufna do momentu otwarcia. Koperta z logo
              kancelarii kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk, w kolorze stonowanym dobranym do rangi pisma.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print color="granatowy" className="btn btn-lg">
                Wyceń koperty dla kancelarii
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo kancelarii akceptują Państwo przed drukiem. Do każdego
              zamówienia wystawiamy fakturę VAT, a instytucjom publicznym i urzędom — z odroczonym
              terminem płatności 14 dni.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Bez okienka adresowego',
                  note: 'Treść pisma zostaje poufna do momentu otwarcia koperty',
                },
                {
                  title: `Pismo A4 na trzy`,
                  note: `Wchodzi do koperty DL ${DL.dimensions} bez dodatkowego zagięcia`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, bez czekania na produkcję`,
                },
                {
                  title: 'Granatowy, Czarny lub Taupe',
                  note: 'Trzy odcienie stonowane, w tej samej cenie co reszta palety',
                },
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
        </div>
      </section>

      {/* ── Jakie pisma trafiają do koperty — typologia specyficzna dla kancelarii ── */}
      <section className="section section-surface" id="pisma">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Jakie pisma trafiają do koperty kancelaryjnej</h2>
            <p>
              Pięć rodzajów korespondencji, przy których opakowanie ma znaczenie równie duże jak
              treść — bo to koperta buduje pierwsze wrażenie, zanim adresat przeczyta pismo.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {DOCUMENT_TYPES.map((doc) => (
              <div className="card" key={doc.name}>
                <h3 style={{ fontSize: 19 }}>{doc.name}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {doc.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kolor: realny kadr Granatowy + próbki Czarny i Taupe ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do kancelarii</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo. Do korespondencji formalnej
              wybierane są trzy odcienie stonowane — poniżej realny kadr i dwie pozostałe próbki.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Granatowy — kolor instytucjonalny</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Granat czyta się jako kolor urzędowy i instytucjonalny, dlatego najczęściej
                wybierają go kancelarie, uczelnie i instytucje kultury. Poniżej realny kadr: nadruk
                logo w bieli na kopercie Granatowej.
              </p>
              <div style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
                <ShowcaseGrid shots={[GRANATOWY_SHOT]} columns={3} spec="full" />
              </div>
              {hasColorPage('granatowy') && (
                <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                  <Link href={colorPagePath('granatowy')}>Zobacz stronę koloru Granatowy →</Link>
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 19 }}>Czarny i Taupe — alternatywy stonowane</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Czarny niesie najwyższą powagę i najlepiej sprawdza się przy pismach
                o skutkach prawnych. Taupe ma najgrubszy papier w katalogu —{' '}
                {COLOR_MAP['taupe']?.weight?.replace('g', ' g/m²')} — więc dokument w tej
                kopercie od razu czuć w dłoni jako coś ważniejszego niż zwykły list.
              </p>
              <div
                className="grid grid-2"
                style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
              >
                {STONED_COLOR_IDS.map((id) => {
                  const color = COLOR_MAP[id];
                  if (!color) return null;
                  return (
                    <div key={id} className="card" style={{ padding: 'var(--space-3)' }}>
                      <EnvelopePlaceholder
                        format="DL"
                        colorId={color.id}
                        ratio="photo"
                        hideCaption
                        size="sm"
                      />
                      <strong
                        style={{ display: 'block', fontSize: 14, marginTop: 'var(--space-2)' }}
                      >
                        {color.name}
                      </strong>
                      {hasColorPage(color.id) && (
                        <Link href={colorPagePath(color.id)} className="small">
                          Szczegóły →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="granatowy" className="btn">
              Wyceń koperty z logo kancelarii
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Adresowanie wielu odbiorców — różnica wobec LP voucherowych (poz. 19, 23) ── */}
      <section className="section section-surface" id="adresowanie">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Adresowanie</span>
            <h2>Adresowanie wielu klientów w jednym zamówieniu</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Kancelaria rzadko wysyła jedno pismo — częściej serię wezwań, pism procesowych albo
            zawiadomień do różnych stron postępowania naraz. Usługa personalizacji drukuje na
            każdej kopercie inne dane odbiorcy: pełny adres pocztowy albo samo imię i nazwisko,
            gdy pismo trafia do rąk własnych. Listę adresatów przekazują Państwo arkuszem — bez
            ręcznego wypisywania każdej koperty z osobna.
          </p>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Logo kancelarii i adres odbiorcy</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                {formatPrice(printedAddressed.unitTotal)} brutto/szt.
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                Nadruk logo i pełny adres pocztowy w jednym przebiegu produkcyjnym — koperta trafia
                do klienta gotowa do nadania, bez dodrukowywania etykiet adresowych.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Mechanizm arkusza adresowego</h3>
              <p className="small" style={{ marginBottom: 0 }}>
                Wymagane pola, formaty pliku i walidacja przed drukiem — cały mechanizm wgrywania
                listy adresatów opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>. Ta sama
                usługa obsługuje serię dziesięciu wezwań i serię tysiąca zawiadomień.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cennik i terminy — bez powtarzania tabeli F1, wyłącznie odnośniki ── */}
      <section className="section" id="cena-i-terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cena i terminy</span>
            <h2>Ile kosztuje koperta dla kancelarii i kiedy dotrze</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperta z logo kancelarii kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę,
            od {DEFAULT_PRICING.moqWithPrint} sztuk, niezależnie od wybranego koloru. Wysyłamy ją
            w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym — w{' '}
            {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Pełne rozbicie ceny na
            składniki (koperta, nadruk, personalizacja, ekspres) oraz wartość zamówienia dla
            wybranych nakładów pokazuje tabela na stronie{' '}
            <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>.
          </p>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Termin zaczyna biec dopiero, gdy spełnione są oba warunki: wpłata jest zaksięgowana,
            a wizualizacja zaakceptowana. Faktura z odroczonym terminem 14 dni jest dostępna dla
            instytucji publicznych i urzędów i nie wstrzymuje produkcji — pozostałym klientom
            wystawiamy fakturę VAT do każdego zamówienia, także bez numeru NIP.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="granatowy" className="btn">
              Sprawdź cenę swojej ilości
            </ConfigureLink>
            <span className="small muted">
              Cena w konfiguratorze przelicza się przy każdej zmianie ilości i opcji.
            </span>
          </div>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi na koperty z logo kancelarii?</h2>
              <p>
                Konfigurator otworzy się z formatem DL, Granatowym kolorem i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych.
              </p>
            </div>
            <ConfigureLink format="DL" print color="granatowy" className="btn btn-lg">
              Wyceń koperty dla kancelarii
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print color="granatowy" label="Zamów koperty dla kancelarii" />
    </>
  );
}
