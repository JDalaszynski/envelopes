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
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import { breadcrumbJsonLd, ogImage, productId, webPageJsonLd } from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K7 pod filarem F4 — „koperty dla restauracji"
 * (content-plan.md poz. 23, Tydzień 6).
 *
 * **Rozgraniczenie wobec F4.** Filar mówi do dziesięciu branż naraz i w karcie
 * restauracyjnej podaje jedno zdanie: „Koperta w Ciemnozielonym albo Czarnym
 * sprawia, że bon nie wygląda jak rachunek". Ta strona zawęża się do fine
 * diningu, winiarni i kawiarni i dokłada to, czego filar nie ma: dobór między
 * kierunkiem stonowanym (Ciemnozielony, Czarny — rekomendacja F4) a mocnym,
 * apetycznym (Czerwony — jedyny realny kadr aranżacyjny dla tej branży),
 * argument dyskrecji przy niespodziance i kalendarz dwóch szczytów
 * sprzedażowych (Walentynki, sezon świąteczny). Wymiar bonu i pełna tabela
 * branż zostają na F4 — tutaj tylko odnośnik.
 *
 * **Bez własnego `FAQPage`** — z tego samego powodu co `/koperty-dla-salonow-
 * spa`: `VOUCHER_FAQ_ITEMS` na F4 pokrywa już pytania o nadruk, personalizację
 * i wielokolorowe zamówienia. `mainEntityId` wskazuje na węzeł `Product`
 * filara zamiast tworzyć drugi, konkurujący o ten sam wynik rozszerzony.
 *
 * **Brak konfliktu frazowego.** W przeciwieństwie do poz. 19 (SPA), fraza
 * `koperty na vouchery do restauracji` nie występowała dotąd w `keywords`
 * żadnej strony — nie ma tu migracji do wykonania.
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

const plain = calculatePrice({ ...BASE_CONFIG });
const printed = calculatePrice({ ...BASE_CONFIG, print: true });
const printedNamed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Wymiar bonu drukowanego na jednej trzeciej arkusza A4 — ta sama stała co na F4. */
const VOUCHER_INSERT = { width: 99, height: 210 };

/** Trzy konfiguracje realne dla vouchera restauracyjnego — ta sama oś co na F4 i na LP SPA. */
const RESTAURANT_SETUPS: { label: string; note: string; config: Partial<EnvelopeConfig> }[] = [
  {
    label: 'Koperta gładka',
    note: `Kolor lokalu bez druku, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
    config: {},
  },
  {
    label: 'Koperta z logo restauracji',
    note: `Logo na przedniej ściance, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true },
  },
  {
    label: 'Koperta z logo i imieniem gościa',
    note: `Nadruk i personalizacja w jednym przebiegu, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true, personalization: true },
  },
];

const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 20, 50];

/** Dwa odcienie stonowane z rekomendacji F4 — kierunek „nie wygląda jak rachunek". */
const DARK_COLOR_IDS = ['ciemnozielony', 'czarny'];

const RED = COLOR_MAP['czerwony'];
const RED_SHOT = shotByFile('czerwona-koperta-dl-nadruk-logo-restauracji');

/** Dwa szczyty sprzedażowe voucherów restauracyjnych — z terminem zamówienia liczonym wstecz. */
const SEASONAL_OCCASIONS: { name: string; date: string; orderBy: string }[] = [
  {
    name: 'Walentynki',
    date: '14 lutego',
    orderBy: `początek lutego, żeby ${DEFAULT_PRICING.leadDaysStandard} dni robocze realizacji z nadrukiem zmieściło się przed świętem`,
  },
  {
    name: 'Sezon świąteczny i Sylwester',
    date: 'grudzień',
    orderBy: 'połowa grudnia, żeby ominąć spiętrzenie kurierów przed świętami',
  },
];

const restaurantTitle = 'Koperty na vouchery do restauracji';
const restaurantDescription = `Koperta na voucher do restauracji bez okienka adresowego, nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk za ${formatPrice(printed.unitTotal)} brutto/szt. Realny kadr: Czerwony z czarnym nadrukiem.`;

export const metadata: Metadata = {
  title: restaurantTitle,
  description: restaurantDescription,
  keywords: [
    'koperty na vouchery do restauracji',
    'koperty dla restauracji',
    'koperta na voucher do restauracji',
    'koperty na kolację w prezencie',
  ],
  alternates: { canonical: '/koperty-dla-restauracji' },
  openGraph: {
    type: 'website',
    title: 'Koperty na vouchery do restauracji — Envelopes',
    description: restaurantDescription,
    url: '/koperty-dla-restauracji',
    images: [
      ogImage(
        'koperty-dla-restauracji',
        'Czerwona koperta DL z czarnym nadrukiem logo restauracji, przygotowana pod voucher na kolację'
      ),
    ],
  },
};

export default function RestaurantEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-restauracji',
          type: 'ItemPage',
          name: restaurantTitle,
          description: restaurantDescription,
          mainEntityId: productId('/koperty-na-vouchery'),
          image: ogImage('koperty-dla-restauracji', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
          { name: 'Restauracje', url: '/koperty-dla-restauracji' },
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
              <Link href="/koperty-na-vouchery">Koperty na vouchery</Link>{' '}
              <span aria-hidden="true">›</span> Restauracje
            </nav>

            <span className="eyebrow">Vouchery do restauracji</span>
            <h1>Koperty na vouchery do restauracji</h1>
            <p className="hero-lead">
              Voucher na kolację wręczony w kopercie ozdobnej przestaje wyglądać jak rachunek,
              a zaczyna jak zaproszenie. Koperty Envelopes są bez okienka adresowego, więc
              niespodzianka zostaje niespodzianką aż do otwarcia. Koperta z logo restauracji
              kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty dla restauracji
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo restauracji akceptują Państwo przed drukiem. Do każdego
              zamówienia wystawiamy fakturę VAT, a instytucjom publicznym — z odroczonym terminem
              płatności 14 dni.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Bez okienka adresowego',
                  note: 'Niespodzianka zostaje zakryta do momentu otwarcia koperty',
                },
                {
                  title: `Bon ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm`,
                  note: `Wchodzi do koperty DL ${DL.dimensions} płasko, bez zaginania`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, bez czekania na produkcję`,
                },
                {
                  title: 'Czerwony lub odcień stonowany',
                  note: 'Mocny akcent albo dyskrecja Ciemnozielonego i Czarnego — w tej samej cenie',
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

      {/* ── Dlaczego voucher na kolację wymaga koperty — kąt specyficzny dla gastronomii ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Dlaczego voucher na kolację wręcza się w kopercie</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Nie wygląda jak rachunek</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Voucher wydrukowany na kartce z drukarki biurowej i wręczony bez opakowania łatwo
                pomylić z paragonem. Papier barwiony w masie odróżnia go od dokumentu księgowego
                dokładnie w chwili wręczenia.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Niespodzianka do ostatniej chwili</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Kolacja w prezencie bywa niespodzianką planowaną z wyprzedzeniem. Koperta bez
                okienka adresowego nie zdradza treści nikomu poza odbiorcą — wydruk zostaje
                zakryty aż do otwarcia.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon dociera płaski</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Voucher noszony luzem w portfelu albo w torbie na prezenty gniecie się na rogach.
                Bon na jednej trzeciej arkusza A4 wchodzi do koperty DL płasko i tak zostaje od
                zakupu do dnia rezerwacji.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolor: mocny akcent vs dyskretna elegancja — realny kadr + próbki ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do restauracji</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór jest wyłącznie decyzją
              wizerunkową. Z profili klientów wyłaniają się dwa kierunki.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Mocny, apetyczny — Czerwony</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Czerwień kojarzy się z ciepłem kuchni i winem podanym do kolacji — silny, ciepły
                akcent, który wyróżnia się na tle korespondencji firmowej. Poniżej realny kadr:
                nadruk logo w czerni na kopercie Czerwonej.
              </p>
              <div style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
                <ShowcaseGrid shots={[RED_SHOT]} columns={3} spec="full" />
              </div>
              {hasColorPage('czerwony') && (
                <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                  <Link href={colorPagePath('czerwony')}>Zobacz stronę koloru Czerwony →</Link>
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 19 }}>Stonowany, elegancki — Ciemnozielony i Czarny</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Fine dining i winiarnie sięgają częściej po odcienie głębokie i stonowane — Butelkowa
                Zieleń albo Czarny sprawiają, że voucher wygląda na zaproszenie, a nie na dokument
                księgowy. Oba przyjmują jasny nadruk logo z pełnym kontrastem.
              </p>
              <div
                className="grid grid-2"
                style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
              >
                {DARK_COLOR_IDS.map((id) => {
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
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z logo restauracji
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt — nakład dobrany pod skalę pojedynczego lokalu ── */}
      <section className="section section-surface" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje seria kopert na vouchery do restauracji</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Cena za sztukę jest taka sama przy 10 i przy 500 kopertach, więc pojedynczy lokal nie
            płaci wyższej stawki niż sieć restauracji. Tabela pokazuje wartość zamówienia w skali
            typowej dla jednej restauracji.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert na vouchery do restauracji w trzech konfiguracjach
                i trzech nakładach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nakład</th>
                  {RESTAURANT_SETUPS.map((setup) => (
                    <th scope="col" key={setup.label}>
                      {setup.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_QUANTITIES.map((quantity) => (
                  <tr key={quantity}>
                    <th scope="row">{quantity.toLocaleString('pl-PL')} bonów</th>
                    {RESTAURANT_SETUPS.map((setup) => {
                      const price = calculatePrice({ ...BASE_CONFIG, ...setup.config, quantity });
                      return (
                        <td className="mono-sm" key={setup.label}>
                          {formatPrice(price.gross)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Cena za sztukę</th>
                  {RESTAURANT_SETUPS.map((setup) => {
                    const unit = calculatePrice({ ...BASE_CONFIG, ...setup.config });
                    return (
                      <td className="mono-sm" key={setup.label}>
                        <strong>{formatPrice(unit.unitTotal)}</strong> brutto
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto,
            naliczany raz na całe zamówienie. Rozbicie ceny nadruku na składniki opisaliśmy na
            stronie <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>, a pełną tabelę
            konfiguracji i pozostałe branże — na filarze{' '}
            <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>
        </div>
      </section>

      {/* ── Sezonowość — dwa szczyty sprzedażowe specyficzne dla gastronomii ── */}
      <section className="section" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy zamówić</span>
            <h2>Dwa szczyty sprzedaży voucherów restauracyjnych</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Voucher na kolację sprzedaje się w restauracjach falami, ze szczytem w grudniu
            i drugim, mniejszym przed Walentynkami. Termin liczymy wstecz od dnia, w którym bony
            mają trafić do sprzedaży — koperty z nadrukiem wysyłamy w{' '}
            {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w{' '}
            {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Terminy zamówienia kopert przed dwoma szczytami sprzedażowymi voucherów
                restauracyjnych
              </caption>
              <thead>
                <tr>
                  <th scope="col">Okazja</th>
                  <th scope="col">Data</th>
                  <th scope="col">Kiedy zamówić koperty</th>
                </tr>
              </thead>
              <tbody>
                {SEASONAL_OCCASIONS.map((occasion) => (
                  <tr key={occasion.name}>
                    <td>{occasion.name}</td>
                    <td className="mono-sm">{occasion.date}</td>
                    <td>{occasion.orderBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Termin zaczyna biec dopiero, gdy spełnione są oba warunki: wpłata jest zaksięgowana,
            a wizualizacja zaakceptowana. Faktura z odroczonym terminem 14 dni jest dostępna dla
            instytucji publicznych i nie wstrzymuje produkcji.
          </p>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi zapakować vouchery przed sezonem?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych. Koperty z logo
                i imieniem gościa kosztują {formatPrice(printedNamed.unitTotal)} brutto za sztukę.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty dla restauracji
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print label="Zamów koperty dla restauracji" />
    </>
  );
}
