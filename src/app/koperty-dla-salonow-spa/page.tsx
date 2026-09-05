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
 * Supporting LP klastra K7 pod filarem F4 — „koperty dla salonów SPA"
 * (content-plan.md poz. 19, keywords.md K7).
 *
 * **Właściciel frazy `koperty na bony podarunkowe`.** Fraza siedziała dotąd
 * w `keywords` filara `/koperty-na-vouchery` jako wariant nazewniczy. Ta
 * strona ją przejmuje — filar zostaje wyłącznie przy wariantach voucherowych
 * (`koperty na vouchery`, `koperty do voucherów`).
 *
 * **Rozgraniczenie wobec F4.** Filar mówi do dziesięciu branż naraz i podaje
 * jeden fakt o kolorze („nadruk kosztuje tyle samo na każdym odcieniu").
 * Ta strona zawęża się do jednej branży i dokłada to, czego filar nie ma:
 * dobór odcienia między klinicznym a naturalnym wizerunkiem, argument
 * dyskrecji przy zabiegach medycyny estetycznej i kalendarz sezonowy
 * specyficzny dla SPA (Walentynki, Dzień Kobiet, święta). Wymiary bonu
 * i pełna tabela branż zostają na F4 — tutaj tylko odnośnik.
 *
 * **Bez własnego `FAQPage`.** Pytania o voucher — czy musi mieć nadruk, czy
 * da się dopisać imię, czy da się zamówić kilka kolorów naraz — pokrywa
 * `VOUCHER_FAQ_ITEMS` na F4. Dwa adresy z tym samym zestawem pytań
 * konkurowałyby o ten sam wynik rozszerzony, więc `mainEntityId` tej strony
 * wskazuje na węzeł `Product` filara zamiast tworzyć drugi.
 *
 * **Jedyny realny kadr aranżacyjny dla SPA to Taupe** (`taupe-koperta-dl-
 * nadruk-logo-salonu-spa`). Baza wiedzy (pkt 5) poleca dla SPA i medycyny
 * estetycznej barwy jasne — Biała Perłowa, Ecru, Biały — więc strona pokazuje
 * oba kierunki: zdjęcie realnego kadru w Taupe i próbki kolorów jasnych bez
 * podszywania się pod zdjęcie, którego nie ma.
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

/** Trzy konfiguracje realne dla bonu SPA — ta sama oś co `VOUCHER_SETUPS` na F4. */
const SPA_SETUPS: { label: string; note: string; config: Partial<EnvelopeConfig> }[] = [
  {
    label: 'Koperta gładka',
    note: `Kolor salonu bez druku, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
    config: {},
  },
  {
    label: 'Koperta z logo salonu',
    note: `Logo na przedniej ściance, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true },
  },
  {
    label: 'Koperta z logo i imieniem klientki',
    note: `Nadruk i personalizacja w jednym przebiegu, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true, personalization: true },
  },
];

/** Nakład dobrany pod skalę pojedynczego salonu, nie sieci — mniejszy niż na F4. */
const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 20, 50];

/** Trzy jasne odcienie z bazy wiedzy (pkt 5) — kierunek „kliniczny". */
const LIGHT_COLOR_IDS = ['biala-perlowa', 'ecru', 'bialy'];

const TAUPE = COLOR_MAP['taupe'];
const TAUPE_SHOT = shotByFile('taupe-koperta-dl-nadruk-logo-salonu-spa');

/** Kalendarz okazji, pod które salony SPA sprzedają bon — z terminem zamówienia liczonym wstecz. */
const SEASONAL_OCCASIONS: { name: string; date: string; orderBy: string }[] = [
  {
    name: 'Walentynki',
    date: '14 lutego',
    orderBy: `początek lutego, żeby ${DEFAULT_PRICING.leadDaysStandard} dni robocze realizacji z nadrukiem zmieściło się przed świętem`,
  },
  {
    name: 'Dzień Kobiet',
    date: '8 marca',
    orderBy: 'koniec lutego, bo to drugi szczyt sprzedaży bonów zaraz po Walentynkach',
  },
  {
    name: 'Boże Narodzenie i sylwester',
    date: 'grudzień',
    orderBy: 'połowa grudnia, żeby ominąć spiętrzenie kurierów przed świętami',
  },
];

const spaTitle = 'Koperty na bony podarunkowe do salonu SPA';
const spaDescription = `Koperta na bon do salonu SPA bez okienka adresowego, papier barwiony w masie, nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk za ${formatPrice(printed.unitTotal)} brutto/szt. Realny kadr: Taupe 140 g/m².`;

export const metadata: Metadata = {
  title: spaTitle,
  description: spaDescription,
  keywords: [
    'koperty na bony podarunkowe',
    'koperty dla salonów spa',
    'koperta na bon do spa',
    'koperty na bony do salonu spa',
  ],
  alternates: { canonical: '/koperty-dla-salonow-spa' },
  openGraph: {
    type: 'website',
    title: 'Koperty na bony podarunkowe do salonu SPA — Envelopes',
    description: spaDescription,
    url: '/koperty-dla-salonow-spa',
    images: [
      ogImage(
        'koperty-dla-salonow-spa',
        'Koperta DL w kolorze Taupe z białym nadrukiem logo salonu SPA, na jasnym drewnie'
      ),
    ],
  },
};

export default function SpaEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-salonow-spa',
          type: 'ItemPage',
          name: spaTitle,
          description: spaDescription,
          mainEntityId: productId('/koperty-na-vouchery'),
          image: ogImage('koperty-dla-salonow-spa', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
          { name: 'Koperty dla salonów SPA', url: '/koperty-dla-salonow-spa' },
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
              <span aria-hidden="true">›</span> Salony SPA
            </nav>

            <span className="eyebrow">Bony podarunkowe SPA</span>
            <h1>Koperty na bony podarunkowe do salonu SPA</h1>
            <p className="hero-lead">
              Bon na zabieg wręczony w kopercie ozdobnej nie zdradza zawartości, dopóki klientka
              go nie otworzy — koperty Envelopes są bez okienka adresowego, więc cała przednia
              ścianka zostaje jednolitą płaszczyzną papieru. Koperta z logo salonu kosztuje{' '}
              {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
              sztuk, w kolorze dobranym do wizerunku salonu.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty dla salonu SPA
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo salonu akceptują Państwo przed drukiem. Do każdego
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
                  note: 'Bon nie widać z zewnątrz — koperta zostaje jednolitą płaszczyzną papieru',
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
                  title: 'Taupe 140 g/m² lub jasne odcienie',
                  note: 'Ziemisty klimat spa albo klinicznie jasna paleta — w tej samej cenie',
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

      {/* ── Dlaczego bon na zabieg wymaga koperty — kąt specyficzny dla SPA ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Dlaczego bon na zabieg wręcza się w kopercie</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Dyskrecja zabiegu</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Bon na zabieg z zakresu medycyny estetycznej bywa prezentem o osobistym
                charakterze. Koperta bez okienka adresowego nie zdradza treści nikomu poza
                odbiorczynią — wydruk zostaje zakryty aż do momentu otwarcia.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Prezent, nie wydruk z drukarki</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Bon do SPA kupuje się zwykle na urodziny, Dzień Kobiet albo pod choinkę. Papier
                barwiony w masie odróżnia go od kartki z biurowej drukarki dokładnie w chwili
                wręczenia — czyli wtedy, gdy obdarowana wyrabia sobie pierwsze zdanie o marce.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon dociera płaski</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Wydruk noszony luzem w torebce, obok kosmetyczki, gniecie się i miesza z resztą
                zawartości. Bon na jednej trzeciej arkusza A4 wchodzi do koperty DL płasko i tak
                zostaje od zakupu do dnia zabiegu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolor: kierunek kliniczny vs naturalny — realny kadr + próbki ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do salonu SPA</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór jest wyłącznie decyzją
              wizerunkową. Z profili klientów wyłaniają się dwa kierunki.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Ciepły, ziemisty — Taupe</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Szarobrązowy Taupe ma najwyższą gramaturę w katalogu —{' '}
                {TAUPE?.weight?.replace('g', ' g/m²')}. Ciepły, stonowany odcień komponuje się
                z estetyką relaksu i naturalnych materiałów, którą salony SPA budują w samym
                wnętrzu. Poniżej realny kadr: nadruk logo w bieli na kopercie Taupe.
              </p>
              <div style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
                <ShowcaseGrid shots={[TAUPE_SHOT]} columns={3} spec="full" />
              </div>
              {hasColorPage('taupe') && (
                <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                  <Link href={colorPagePath('taupe')}>Zobacz stronę koloru Taupe →</Link>
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 19 }}>Jasny, kliniczny — Biała Perłowa, Ecru, Biały</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Kliniki medycyny estetycznej i stomatologii premium sięgają częściej po barwy
                jasne i „czyste" — komunikują higienę i precyzję zabiegu wyraźniej niż odcień
                ziemisty. Wszystkie trzy przyjmują ciemny nadruk logo z pełnym kontrastem.
              </p>
              <div
                className="grid grid-3"
                style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
              >
                {LIGHT_COLOR_IDS.map((id) => {
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
              Wyceń koperty z logo salonu
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt — nakład dobrany pod skalę salonu, nie sieci ── */}
      <section className="section section-surface" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje seria kopert na bony do SPA</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Cena za sztukę jest taka sama przy 10 i przy 500 kopertach, więc mały salon nie płaci
            wyższej stawki niż sieć z kilkoma lokalizacjami. Tabela pokazuje wartość zamówienia
            w skali typowej dla pojedynczego salonu.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert na bony do SPA w trzech konfiguracjach i trzech nakładach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nakład</th>
                  {SPA_SETUPS.map((setup) => (
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
                    {SPA_SETUPS.map((setup) => {
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
                  {SPA_SETUPS.map((setup) => {
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

      {/* ── Sezonowość — kalendarz specyficzny dla SPA ── */}
      <section className="section" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy zamówić</span>
            <h2>Kalendarz sezonowy sprzedaży bonów w SPA</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Bon na zabieg sprzedaje się w salonach falami, nie równomiernie przez cały rok. Termin
            liczymy wstecz od dnia, w którym bony mają trafić do sprzedaży — koperty z nadrukiem
            wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym
            w {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Terminy zamówienia kopert na bony przed trzema szczytami sprzedażowymi w SPA
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
              <h2>Gotowi zapakować bony przed sezonem?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych. Koperty
                z logo i imieniem klientki kosztują {formatPrice(printedNamed.unitTotal)} brutto za
                sztukę.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty dla salonu SPA
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print label="Zamów koperty dla salonu SPA" />
    </>
  );
}
