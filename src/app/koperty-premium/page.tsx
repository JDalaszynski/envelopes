import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  COLOR_MAP,
  FORMAT_MAP,
  PRINT_SAFE_MARGIN_MM,
  hasSurfaceFinish,
  weightLabel,
} from '@/lib/catalog';
import { colorPagePath, hasColorPage } from '@/lib/color-pages';
import { PREMIUM_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  SITE_URL,
  breadcrumbJsonLd,
  faqJsonLd,
  ogImage,
  premiumEnvelopeProductJsonLd,
  webPageJsonLd,
} from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Filar klastra K6 — „koperty premium" (keywords.md K6, content-plan.md poz. 37).
 *
 * Strona ofertowo-wizerunkowa dla klientów B2B oraz organizatorów uroczystości
 * poszukujących kopert o najwyższej jakości wykonania. Wartość „premium"
 * udowadniamy twardymi parametrami poligraficznymi:
 * - gramatura 115–140 g/m² (w tym najgrubszy papier Taupe 140 g/m²),
 * - papier barwiony w masie na wylot (jednolity kolor na zgięciach i krawędziach),
 * - szlachetne wykończenia perłowe i metaliczne w cenie odcieni matowych (2,58 zł brutto/szt.),
 * - brak foliowego okienka adresowego — pełna płaszczyzna papieru ozdobnego,
 * - nadruk logo i personalizacja imienna realizowane już od 10 sztuk.
 *
 * Rozgraniczenia klastrowe (brief SEO/GEO pkt 5.1 i 8):
 * 1. Wobec `/` (Hub): strona główna prezentuje całościowy katalog; tutaj skupiamy
 *    się na fizycznych cechach jakościowych papieru i dowodach klasy premium.
 * 2. Wobec `/koperty-z-nadrukiem` (F1): specyfikacja plików i proces akceptacji
 *    zostają na F1; tutaj akcentujemy dobór kontrastu nadruku na podłożach szlachetnych.
 * 3. Wobec `/koperty-dl` (F3): geometria formatu i tabela dopasowań wkładek
 *    należą do F3; tutaj wymiary DL są jednym wierszem specyfikacji.
 * 4. Wobec stron kolorów `/koperty/[kolor]`: strony kolorów opisują pojedyncze
 *    odcienie; ten filar grupuje całą kolekcję premium i linkuje do nich w dół.
 */

const DL = FORMAT_MAP.DL;
const BASE_PRICE = DEFAULT_PRICING.base.DL;

/** Podstawowa konfiguracja do kalkulacji cenowych na stronie. */
const BASE_CONFIG: EnvelopeConfig = {
  format: 'DL',
  color: 'zloty',
  quantity: 1,
  print: false,
  printFiles: [],
  personalization: false,
  shippingSpeed: 'standard',
};

const plain = calculatePrice({ ...BASE_CONFIG });
const printed = calculatePrice({ ...BASE_CONFIG, print: true });
const personalized = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Wyselekcjonowane odcienie o unikalnych cechach materiałowych klasy premium. */
const PREMIUM_HERO_COLOR_IDS = [
  'zloty',
  'biala-perlowa',
  'taupe',
  'srebrna-perlowa',
  'czarny',
  'granatowy',
  'matcha',
  'ciemnozielony',
];

/** Wybrane kadry aranżacyjne pokazujące zastosowania premium. */
const PREMIUM_SHOT_FILES = [
  'zlota-koperta-dl-nadruk-logo-studia-tatuazu',
  'granatowa-koperta-dl-nadruk-logo-kancelarii',
  'taupe-koperta-dl-nadruk-logo-salonu-spa',
  'biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego',
  'niebieska-koperta-dl-personalizacja-odreczna',
  'czerwona-koperta-dl-nadruk-logo-restauracji',
];

const PREMIUM_SHOTS = PREMIUM_SHOT_FILES.map(shotByFile);

export const metadata: Metadata = {
  title: 'Eleganckie koperty premium DL z nadrukiem logo',
  description:
    'Ekskluzywne koperty premium dla najbardziej wymagających odbiorców. Wybierz eleganckie koperty premium idealne do prestiżowej korespondencji biznesowej. Zadbaj o detale budujące zaufanie i poznaj nasze rozwiązania.',
  alternates: { canonical: `${SITE_URL}/koperty-premium` },
  openGraph: {
    type: 'website',
    title: 'Eleganckie koperty premium DL z nadrukiem logo',
    description:
      'Ekskluzywne koperty premium dla najbardziej wymagających odbiorców. Wybierz eleganckie koperty premium idealne do prestiżowej korespondencji biznesowej. Zadbaj o detale budujące zaufanie i poznaj nasze rozwiązania.',
    url: `${SITE_URL}/koperty-premium`,
    images: [
      ogImage(
        'koperty-premium',
        'Eleganckie koperty ozdobne premium DL z papieru barwionego w masie z nadrukiem logo'
      ),
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eleganckie koperty premium DL z nadrukiem logo',
    description:
      'Ekskluzywne koperty premium dla najbardziej wymagających odbiorców. Wybierz eleganckie koperty premium idealne do prestiżowej korespondencji biznesowej. Zadbaj o detale budujące zaufanie i poznaj nasze rozwiązania.',
    images: [`${SITE_URL}/images/og/koperty-premium.jpg`],
  },
};

export default function KopertyPremiumPage() {
  const jsonLdData = [
    webPageJsonLd({
      path: '/koperty-premium',
      name: 'Eleganckie koperty premium DL z nadrukiem logo',
      description:
        'Ekskluzywne koperty premium dla najbardziej wymagających odbiorców. Wybierz eleganckie koperty premium idealne do prestiżowej korespondencji biznesowej. Zadbaj o detale budujące zaufanie i poznaj nasze rozwiązania.',
      type: 'ItemPage',
    }),
    breadcrumbJsonLd([
      { name: 'Strona główna', url: '/' },
      { name: 'Koperty premium', url: '/koperty-premium' },
    ]),
    premiumEnvelopeProductJsonLd(),
    faqJsonLd(PREMIUM_FAQ_ITEMS),
  ];

  return (
    <>
      <JsonLd data={jsonLdData} />

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/hero-tlo-2015.webp" />
          <div className="container">
            <nav
              aria-label="Ścieżka nawigacji"
              className="small muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty premium
            </nav>

            <span className="eyebrow">Kolekcja Premium B2B</span>
            <h1>Eleganckie koperty premium DL 110 × 220 mm</h1>

            {/* Blok odpowiedzi GEO — ekstrahowalny bez kontekstu */}
            <p className="hero-lead">
              Koperty premium w Envelopes to seria ozdobnych kopert DL 110 × 220 mm o gramaturze
              115–140 g/m², z papieru barwionego w masie oraz z wykończeniem perłowym i metalicznym.
              Nie mają okienka adresowego ani wewnętrznego poddruku. Wszystkie 19 kolorów
              oferujemy w równej cenie, z nadrukiem logo już od 10 sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" className="btn btn-lg">
                Skonfiguruj koperty premium
              </ConfigureLink>
              <a href="#wykonczenia" className="btn btn-secondary">
                Zobacz wykończenia i gramatury
              </a>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Koperty gładkie od {DEFAULT_PRICING.moqWithoutPrint} sztuki · Z logo od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk · Cyfrowa wizualizacja grafika do akceptacji
            </p>
          </div>
        </div>

        {/* ── 2. Pasek faktów ──────────────────────────────────────────────── */}
        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Gramatura 115–140 g/m²',
                  note: 'Sztywny, mięsisty arkusz gwarantujący pełną dyskrecję i brak prześwitywania',
                },
                {
                  title: 'Szlachetne wykończenia',
                  note: 'Złoty metalik, perła biała i srebrna oraz barwienie w masie — w jednej cenie',
                },
                {
                  title: `Nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
                  note: 'Precyzyjny druk firmowy i adresowanie imienne z akceptacją projektu',
                },
                {
                  title: 'Brak okienka foliowego',
                  note: 'Jednolita przednia ścianka z papieru ozdobnego, bez folii i poddruku',
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

      {/* ── 3. Tabela porównawcza: Premium vs Standard ───────────────────── */}
      <section className="section" id="porownanie">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Twarde parametry</span>
            <h2>Czym koperta premium różni się od standardowej koperty biurowej</h2>
            <p>
              Różnicę między masową kopertą pocztową a kopertą premium widać w pierwszym kontakcie
              z dłonią. Zamiast wiotkiego papieru biurowego i foliowego okna otrzymują Państwo
              szlachetny arkusz o podwyższonej gramaturze.
            </p>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Porównanie właściwości technicznych kopert premium Envelopes ze standardową kopertą pocztową
              </caption>
              <thead>
                <tr>
                  <th scope="col">Cecha produktu</th>
                  <th scope="col">Koperty premium Envelopes</th>
                  <th scope="col">Standardowa koperta pocztowa</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Gramatura arkusza</th>
                  <td>
                    <strong>115–140 g/m²</strong> (sztywna, wyczuwalnie gruba w dłoni)
                  </td>
                  <td>75–80 g/m² (cienka, podatna na zagniecenia)</td>
                </tr>
                <tr>
                  <th scope="row">Struktura barwienia</th>
                  <td>
                    <strong>Barwienie w masie na wylot</strong> lub perła / metalik
                  </td>
                  <td>Biały papier masowy, często z szarym nadrukiem wewnątrz</td>
                </tr>
                <tr>
                  <th scope="row">Przednia ścianka</th>
                  <td>
                    <strong>Pełna płaszczyzna papieru ozdobnego</strong> (bez okienka)
                  </td>
                  <td>Foliowe okienko adresowe dzielące powierzchnię</td>
                </tr>
                <tr>
                  <th scope="row">Krawędzie i zgięcia</th>
                  <td>
                    <strong>Jednolity kolor na całej grubości</strong> (brak białych przetarć)
                  </td>
                  <td>Biały rdzeń widoczny przy każdym nacięciu i zgięciu</td>
                </tr>
                <tr>
                  <th scope="row">Znakowanie i branding</th>
                  <td>
                    <strong>Nadruk logo i adresowanie imienne od {DEFAULT_PRICING.moqWithPrint} sztuk</strong>
                  </td>
                  <td>Druk masowy opłacalny zazwyczaj od 500–1000 sztuk</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 4. Cztery filary materiałowe kolekcji premium ────────────────── */}
      <section className="section section-surface" id="wykonczenia">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Szlachetne papiery</span>
            <h2>Cztery filary materiałowe kolekcji premium</h2>
            <p>
              Wszystkie odcienie w katalogu Envelopes kosztują dokładnie tyle samo —{' '}
              {formatPrice(BASE_PRICE)} brutto za sztukę. Wybór podłoża jest więc decyzją
              o estetyce i charakterze korespondencji, a nie kompromisem budżetowym.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Wykończenie metaliczne
              </span>
              <h3 style={{ fontSize: 20, marginTop: 'var(--space-2)' }}>Złoty z metalicznym połyskiem</h3>
              <p className="small">
                Papier o spektakularnym wykończeniu metalicznym na całej powierzchni arkusza.
                Zmienia jasność pod kątem padania światła, stanowiąc niezastąpioną oprawę dla
                voucherów podarunkowych, zaproszeń na jubileusze oraz korespondencji świątecznej.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <Link href="/koperty/zloty" className="small" style={{ fontWeight: 600 }}>
                  Zobacz stronę koloru Złotego →
                </Link>
              </div>
            </div>

            <div className="card">
              <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Wykończenie perłowe
              </span>
              <h3 style={{ fontSize: 20, marginTop: 'var(--space-2)' }}>Biała i Srebrna Perłowa</h3>
              <p className="small">
                Subtelna, satynowa poświata odbijająca światło bez efektu jaskrawego brokatu.
                Dedykowana dla branży beauty, salonów medycyny estetycznej, marek motoryzacyjnych
                oraz ekskluzywnych zaproszeń ślubnych.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <span className="small muted">Biała Perłowa · Srebrna Perłowa</span>
              </div>
            </div>

            <div className="card">
              <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Gramatura 140 g/m²
              </span>
              <h3 style={{ fontSize: 20, marginTop: 'var(--space-2)' }}>Taupe (Szarobrązowy)</h3>
              <p className="small">
                Najgrubszy i najsztywniejszy papier w całym katalogu. Ziemisty, szarobrązowy
                odcień w połączeniu z gramaturą 140 g/m² tworzy bezkompromisowy standard dla
                pism zarządczych, aktów notarialnych oraz ofert deweloperskich.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <Link href="/koperty/taupe" className="small" style={{ fontWeight: 600 }}>
                  Zobacz stronę koloru Taupe →
                </Link>
              </div>
            </div>

            <div className="card">
              <span className="eyebrow" style={{ color: 'var(--color-primary)' }}>
                Barwienie w masie
              </span>
              <h3 style={{ fontSize: 20, marginTop: 'var(--space-2)' }}>Głębokie maty (Czarny, Granat, Matcha)</h3>
              <p className="small">
                Pigment wprowadzany do struktury papieru na etapie produkcji masy celulozowej.
                Zapewnia aksamitną, nieodbijającą światła płaszczyznę i stuprocentową jednolitość
                koloru na krawędziach po rozcięciu i zgięciu klapki.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <Link href="/koperty/czarny" className="small" style={{ fontWeight: 600 }}>
                  Zobacz czarne koperty →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Galeria realizacji i kadrów aranżacyjnych ─────────────────── */}
      <section className="section" id="galeria">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Realizacje i inspiracje</span>
            <h2>Koperty premium w użyciu biznesowym i okolicznościowym</h2>
            <p>
              Poniższe kadry przedstawiają rzeczywisty wygląd kopert DL z nadrukiem firmowym
              oraz personalizacją imienną na wybranych papierach ozdobnych.
            </p>
          </div>

          <ShowcaseGrid
            shots={PREMIUM_SHOTS}
            columns={3}
            spec="full"
          />
        </div>
      </section>

      {/* ── 6. Paleta wybranych odcieni premium ──────────────────────────── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Paleta 19 odcieni</span>
            <h2>Najczęściej wybierane odcienie w segmencie premium</h2>
            <p>
              Wszystkie odcienie są dostępne od ręki w formacie DL. Każda koperta kosztuje tyle
              samo — bez dopłat za wykończenia specjalne.
            </p>
          </div>

          <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
            {PREMIUM_HERO_COLOR_IDS.map((colorId) => {
              const color = COLOR_MAP[colorId];
              if (!color) return null;
              const hasPage = hasColorPage(color.id);

              return (
                <div key={color.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <EnvelopePlaceholder
                    format="DL"
                    colorId={color.id}
                    ratio="photo"
                    hideCaption
                    size="sm"
                  />
                  <strong style={{ display: 'block', fontSize: 16, marginTop: 'var(--space-3)' }}>
                    Koperta DL {color.name}
                  </strong>
                  <span className="small muted" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
                    {color.weight ? weightLabel(color.weight) : '115 g/m²'}
                    {/* Warunek schodzi z `hasSurfaceFinish()`, a nie z samego
                        `finish`: papier eko ma wpisane wykończenie, ale **jest**
                        barwiony w masie, więc gałąź na sam `finish` powiedziałaby
                        o nim co innego niż tabela specyfikacji na stronie koloru. */}
                    {hasSurfaceFinish(color.finish) ? ` · ${color.finish}` : ' · barwiony w masie'}
                  </span>
                  <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <ConfigureLink
                      format="DL"
                      color={color.id}
                      className="btn btn-sm"
                    >
                      Wybierz
                    </ConfigureLink>
                    {hasPage && (
                      <Link
                        href={colorPagePath(color.id)}
                        className="small"
                        style={{ alignSelf: 'center' }}
                      >
                        Szczegóły →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
            W ofercie posiadamy łącznie {COLORS.length} kolorów.{' '}
            <Link href="/#kolory">Zobacz pełną paletę na stronie głównej</Link>.
          </p>
        </div>
      </section>

      {/* ── 7. Sekcja „Dla kogo" — 8 zastosowań B2B i VIP ───────────────── */}
      <section className="section" id="zastosowania">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Dla kogo projektujemy koperty klasy premium</h2>
            <p>
              Koperty premium zamawiają firmy i instytucje, dla których korespondencja jest
              bezpośrednim nośnikiem prestiżu i jakości marki.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Kancelarie prawne i notarialne</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Akty notarialne, opinie prawne i poufne umowy. Sztywny arkusz 115–140 g/m² w odcieniach
                Czarnym, Granatowym lub Taupe chroni dokument przed zagnieceniami i wzmacnia powagę pisma.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Zarządy spółek i relacje inwestorskie</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Raporty roczne, listy gratulacyjne, powołania na stanowiska i korespondencja z kluczowymi
                akcjonariuszami. Koperta bez okienka zapewnia dyskrecję przed otwarciem.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Hotele boutique i resorty 5*</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Karty powitalne dla gości VIP, vouchery pobytowe i rachunki w eleganckiej oprawie.
                Wykończenia Złote i Perłowe doskonale harmonizują z luksusowymi wnętrzami.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Kliniki medycyny estetycznej i SPA</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Bony podarunkowe na zabiegi i zaproszenia na konsultacje. Koperta staje się
                integralną częścią prezentu wręczanego bliskiej osobie.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Marki luksusowe i salony jubilerskie</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Certyfikaty autentyczności kamieni szlachetnych, podziękowania za zakup biżuterii
                i karty stałego klienta dołączane do ekskluzywnych przesyłek.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Agencje eventowe i PR</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Zaproszenia na premiery marek, gale jubileuszowe i pokazy mody. Możliwość wykonania
                personalizacji imiennej sprawia, że każde zaproszenie zyskuje indywidualny charakter.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Pracownie architektoniczne i deweloperzy</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Koncepcje projektowe, umowy rezerwacyjne apartamentów i zaproszenia na odbiory lokali.
                Minimalistyczna Szarość i Błękit Łupkowy oddają nowoczesną stylistykę designu.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Uroczystości ślubne i jubileusze VIP</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Podziękowania dla gości, zaproszenia podłużne oraz eleganckie wręczanie upominków
                finansowych bez konieczności składania banknotów.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Znakowanie i kontrast na podłożach premium ────────────────── */}
      <section className="section section-surface" id="nadruk">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Precyzja druku</span>
            <h2>Znakowanie logo i personalizacja na papierach szlachetnych</h2>
            <p>
              Druk na papierze barwionym w masie oraz na powierzchniach perłowych i metalicznych
              wymaga rygorystycznego doboru kontrastu barwnego.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Druk jasny na ciemnych papierach</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Na odcieniach Czarnym, Granatowym i Butelkowej Zieleni drukujemy czystą bielą,
                srebrem lub ciepłym kremem. Jasny nadruk zachowuje pełną ostrość drobnych detali
                i czytelność logotypu z dużej odległości.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Druk ciemny na złocie i perle</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Na papierze Złotym metalicznym oraz na Białej i Srebrnej Perle stosujemy głęboką
                czerń, ciemny grafit lub granat. Ciemny znak tworzy szlachetny, wyrazisty kontrast
                z mieniącą się płaszczyzną podłoża.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 19 }}>Wizualizacja do akceptacji przed drukiem</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Po złożeniu zamówienia nasz grafik przygotowuje cyfrową wizualizację na tle
                wybranego koloru papieru. Do produkcji trafia wyłącznie wersja jednoznacznie
                zaakceptowana przez Państwa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Kiedy koperta premium nie jest potrzebna (Caution) ────────── */}
      <section className="section">
        <div className="container container-narrow">
          <div className="plate" style={{ borderLeft: '3px solid var(--color-gold, #c5a880)' }}>
            <h3 style={{ fontSize: 18, marginTop: 0 }}>
              Kiedy koperta premium nie jest najlepszym wyborem
            </h3>
            <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
              Gdy celem jest masowa, zautomatyzowana wysyłka korespondencji transakcyjnej w tysiącach
              sztuk (np. masowe faktury papierowe do klientów indywidualnych lub wyciągi bankowe).
              W takich scenariuszach tańszym i bardziej funkcjonalnym rozwiązaniem jest masowa koperta
              biurowa z okienkiem adresowym przystosowana do maszynowego pakowania.
            </p>
            <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
              Koperty premium projektujemy pod sytuacje, w których przesyłka ma budować bezpośrednią
              relację, prestiż i wywoływać pozytywne wrażenie w momencie wręczenia lub wyjęcia ze skrzynki.
            </p>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ──────────────────────────────────────────────────────── */}
      <section className="section section-surface" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o koperty premium</h2>
          </div>

          {PREMIUM_FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>
                <h3 style={{ display: 'inline', fontSize: 17, fontFamily: 'inherit' }}>
                  {item.question}
                </h3>
              </summary>
              <div className="faq-answer">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── 11. Podsumowanie i linkowanie ────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, margin: '0 0 var(--space-3)' }}>
              Wybierz koperty premium dopasowane do identyfikacji Twojej firmy
            </h2>
            <p className="muted" style={{ maxWidth: '64ch', margin: '0 auto var(--space-5)' }}>
              Koperty gładkie wysyłamy w {DEFAULT_PRICING.leadDaysPlain} dni robocze, a wersje z logo
              i personalizacją realizujemy od {DEFAULT_PRICING.moqWithPrint} sztuk w{' '}
              {DEFAULT_PRICING.leadDaysStandard} dni roboczych.
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 'var(--space-4)' }}>
              <ConfigureLink format="DL" className="btn btn-lg">
                Przejdź do konfiguratora
              </ConfigureLink>
              <Link href="/koperty-z-nadrukiem" className="btn btn-secondary">
                Więcej o nadruku logo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StickyCta
        label="Skonfiguruj koperty premium DL"
        format="DL"
      />
    </>
  );
}
