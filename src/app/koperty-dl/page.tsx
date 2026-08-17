import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMATS,
  FORMAT_MAP,
  INSERT_CLEARANCE_MM,
  MAX_FORMAT_SIDE,
  PRINT_SAFE_MARGIN_MM,
  STANDARD_INSERTS,
  UPCOMING_FORMATS,
  fitsInFormat,
  formatMm,
  maxInsertSize,
} from '@/lib/catalog';
import type { EnvelopeFormat } from '@/lib/catalog';
import { colorPagePath, colorPages } from '@/lib/color-pages';
import { DL_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  dlEnvelopeProductJsonLd,
  envelopeFormatsJsonLd,
  faqJsonLd,
  howToJsonLd,
  ogImage,
} from '@/lib/seo';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Filar klastra K4 — „koperty dl wymiary" (keywords.md K4, content-plan.md poz. 3).
 *
 * To strona **specyfikacyjna**, nie usługowa. Obsługuje jedną intencję:
 * „jakie wymiary ma koperta DL i co się w niej zmieści". Trzy rozgraniczenia
 * pilnowane świadomie (pkt 5.1 i 8 briefu SEO):
 *
 * 1. Wobec `/` (K3): strona główna jest właścicielem fraz `koperty ozdobne`
 *    i `koperty kolorowe`, trzyma paletę 19 kolorów, cennik kopert gładkich
 *    i `ItemList` odcieni. Ta strona **nie ma nagłówka cenowego i nie
 *    powtarza palety** — cena pojawia się jako jeden wiersz specyfikacji,
 *    a kolory jako sześć bestsellerów z odesłaniem do pełnej palety na `/`.
 * 2. Wobec F1 i F2: cennik nadruku i personalizacji rozłożony na czynniki
 *    zostaje tam. Tutaj obie usługi to po jednym akapicie z linkiem.
 * 3. Wobec przyszłych pozycji 10 i 11 planu: ta strona podaje **wymiary** —
 *    tabelę formatów i tabelę dopasowań wkładek w milimetrach. Wybór formatu
 *    pod konkretną wkładkę (poz. 10) i grubość wkładu, czyli ile kartek
 *    i jakiej gramatury (poz. 11), są osobnymi intencjami i osobnymi URL-ami.
 *
 * Wszystkie wymiary pochodzą z `catalog.ts`, a dopasowania liczy
 * `fitsInFormat()` — zmiana formatu w katalogu przepisuje treść, tabele
 * i dane strukturalne jednocześnie.
 */

const DL = FORMAT_MAP.DL;
const MAX_INSERT = maxInsertSize(DL);

/** Wspólna baza konfiguracji do wyliczeń cenowych na tej stronie. */
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

/** Arkusz A4 złożony na trzy — 297 mm / 3 = 99 mm. Wkładka referencyjna dla DL. */
const A4_IN_THREE = { width: 99, height: 210 };
const A4_FIT = fitsInFormat(A4_IN_THREE, DL);

/** Stosunek boków formatu — liczony, żeby zdanie o proporcjach nie zestarzało się. */
const SIDE_RATIO = (DL.height / DL.width).toFixed(2).replace(/[.,]?0+$/, '').replace('.', ',');

/** Wymiary formatu w centymetrach — „11 × 22 cm" obok „110 × 220 mm". */
function dimensionsInCm(format: EnvelopeFormat): string {
  const cm = (mm: number) => (mm / 10).toFixed(1).replace('.0', '').replace('.', ',');
  return `${cm(format.width)} × ${cm(format.height)} cm`;
}

/** Gramatury papieru w podziale na kolory — dane wprost z katalogu. */
const WEIGHT_GROUPS = Object.entries(
  COLORS.reduce<Record<string, string[]>>((acc, color) => {
    if (!color.weight) return acc;
    acc[color.weight] = [...(acc[color.weight] ?? []), color.name];
    return acc;
  }, {})
).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));

const WEIGHT_SUMMARY = WEIGHT_GROUPS.map(([weight, names]) => {
  const label = weight.replace('g', ' g/m²');
  return names.length > 3 ? `${label} — ${names.length} kolorów` : `${label} — ${names.join(', ')}`;
}).join(' · ');

/** Kolory oznaczone plakietką „Bestseller" — sześć kadrów zamiast całej palety. */
const BESTSELLERS = COLORS.filter((color) => color.bestseller);

/** Formaty zapowiedziane, wypisane zdaniem: „C6 114 × 162 mm i K4 155 × 155 mm". */
const UPCOMING_LABEL = UPCOMING_FORMATS.map((f) => `${f.id} ${f.dimensions}`).join(' i ');

/**
 * Ścieżka zamówienia koperty gładkiej — trzy kroki, bez akceptacji
 * wizualizacji. Świadomie inna niż `HowTo` na `/` (cztery kroki, wspólne dla
 * kopert gładkich i z nadrukiem) oraz na F1 i F2, gdzie akceptacja projektu
 * jest krokiem obowiązkowym.
 */
const HOW_TO_STEPS = [
  {
    name: 'Wybór koperty DL w konfiguratorze',
    text: `Wybierają Państwo format DL ${DL.dimensions}, jeden z ${COLORS.length} kolorów i ilość od ${DEFAULT_PRICING.moqWithoutPrint} sztuki. Koperta DL kosztuje ${formatPrice(plain.unitTotal)} brutto za sztukę w każdym kolorze, a cena przelicza się przy każdej zmianie ilości.`,
  },
  {
    name: 'Płatność',
    text: 'Do wyboru są BLIK, karta, szybki przelew i przelew tradycyjny. Instytucje publiczne i urzędy mogą zapłacić fakturą z odroczonym terminem płatności 14 dni — taka faktura nie wstrzymuje wysyłki.',
  },
  {
    name: 'Wysyłka kurierem',
    text: `Koperty DL bez nadruku i personalizacji wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze — nie przechodzą przez produkcję ani przez akceptację wizualizacji. Dostawa kurierem kosztuje ${formatPrice(DELIVERY_COST)} brutto za zamówienie, a numer przesyłki pojawia się w panelu zamówień.`,
  },
];

/**
 * Sekcja „Dla kogo" — obowiązkowa dla filara (pkt 5.1 briefu).
 * Każdy akapit niesie **wymiar wkładki**, nie argument wizerunkowy: to jest
 * oś, która odróżnia tę sekcję od branżowych list na F1 i F2.
 */
const INDUSTRIES: { heading: string; text: string }[] = [
  {
    heading: 'Kancelarie prawne i notarialne',
    text: `Pismo procesowe, opinia i akt notarialny to arkusze A4. Złożone na trzy wchodzą do koperty DL z zapasem ${A4_FIT.clearanceShort} mm na szerokości — dokument nie wymaga drugiego zagięcia, więc po otwarciu leży płasko na biurku.`,
  },
  {
    heading: 'Biura rachunkowe i doradztwo podatkowe',
    text: `Faktura, deklaracja i sprawozdanie roczne mają format A4. Jedna koperta DL mieści komplet kilku arkuszy złożonych razem na trzy — wymiar wkładki nie zmienia się wraz z liczbą kartek, zmienia się tylko grubość pliku.`,
  },
  {
    heading: 'Hotele, resorty i pensjonaty',
    text: 'Karta powitalna i voucher pobytowy drukowane są zwykle na jednej trzeciej arkusza A4. To wymiar, pod który format DL został zaprojektowany, więc karta wypełnia kopertę bez luzu i nie przesuwa się w środku.',
  },
  {
    heading: 'Salony SPA, kosmetyczne i kliniki',
    text: `Bon na zabieg wchodzi w dwóch postaciach: jako wydruk w wymiarze DL albo jako karta plastikowa w standardzie ID-1 (${formatMm(85.6)} × 54 mm). Oba warianty leżą płasko, bez zaginania.`,
  },
  {
    heading: 'Restauracje, winiarnie i kawiarnie',
    text: 'Voucher na kolację degustacyjną drukowany w wymiarze DL wchodzi do koperty bez składania. Zapas na sezon świąteczny można uzupełniać partiami, w miarę jak bony się sprzedają, zamiast zamawiać karton z góry.',
  },
  {
    heading: 'Działy HR, kadr i płac',
    text: `Decyzja o premii, aneks do umowy i list gratulacyjny to arkusze A4 składane na trzy. Do tej samej koperty wchodzi płasko banknot — największy w obiegu, 500 zł, mierzy 150 × 75 mm przy największej wkładce ${MAX_INSERT.short} × ${MAX_INSERT.long} mm.`,
  },
  {
    heading: 'Uczelnie, szkoły i firmy szkoleniowe',
    text: `Certyfikat i zaświadczenie o ukończeniu kursu wysyłane są jako A4 złożone na trzy. Uwaga na dyplomy: arkusz A4 płasko ma 210 × 297 mm i nie mieści się w żadnym formacie z naszego katalogu — dyplom, który nie może być zginany, wymaga koperty spoza tej oferty.`,
  },
  {
    heading: 'Biura nieruchomości i deweloperzy',
    text: `Umowa deweloperska i protokół odbioru to wielostronicowe dokumenty A4. Złożone na trzy trafiają do jednej koperty DL, a komplet dla jednego nabywcy jedzie w jednej przesyłce zamiast w kilku mniejszych.`,
  },
  {
    heading: 'Agencje eventowe, PR i kreatywne',
    text: `Program wydarzenia i zaproszenie składane do wymiaru DL mieszczą się w kopercie ${DL.dimensions}. Zaproszenie kwadratowe 150 × 150 mm wymaga formatu K4 ${FORMAT_MAP.K4.dimensions}, który ma dziś w katalogu status „Dostępne wkrótce" — tego wariantu nie da się jeszcze zamówić.`,
  },
  {
    heading: 'Butiki, jubilerzy i marki premium',
    text: 'Karta podarunkowa i wizytówka giną w większej kopercie, a w DL leżą stabilnie. Do tej samej przesyłki wchodzi jeszcze list — karta i list w jednym opakowaniu zamiast w dwóch.',
  },
];

export const metadata: Metadata = {
  /* Tytuł z dopiskiem „co się mieści" wychodził na 65 znaków razem z szablonem
     `| Envelopes` z layoutu — Google ucinał go w wyniku. Intencję „co się
     mieści" niesie description i pierwszy nagłówek H2. */
  title: `Koperty DL — wymiary ${DL.dimensions}`,
  description: `Koperta DL ma wymiary ${DL.dimensions}. Mieści A4 złożone na trzy i voucher ${A4_IN_THREE.width} × ${A4_IN_THREE.height} mm; największa wkładka to ${MAX_INSERT.short} × ${MAX_INSERT.long} mm. ${COLORS.length} kolorów, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki.`,
  keywords: [
    'koperty dl wymiary',
    'koperta dl wymiary',
    'wymiary koperty dl',
    'koperta prostokątna',
    'koperty prostokątne',
    'koperty bez okienka',
  ],
  alternates: { canonical: '/koperty-dl' },
  openGraph: {
    type: 'website',
    title: `Wymiary koperty DL — ${DL.dimensions} | Envelopes`,
    description: `Wymiary koperty DL to ${DL.dimensions}. Największa wkładka: ${MAX_INSERT.short} × ${MAX_INSERT.long} mm. Tabela dopasowań, porównanie z formatami C6 i K4, ${COLORS.length} kolorów.`,
    url: '/koperty-dl',
    images: [
      ogImage('koperty-dl', 'Koperta DL 110 × 220 mm w kolorze Biała Perłowa z nadrukowanym adresem'),
    ],
  },
};

/**
 * Rysunek formatu we wzajemnej skali. Wszystkie trzy diagramy mają ten sam
 * `viewBox` o boku `MAX_FORMAT_SIDE`, więc przy równej szerokości renderowania
 * proporcje między formatami są zachowane bez żadnych przeliczeń w CSS.
 * Kwadratowy `viewBox` daje stały stosunek boków, więc rysunek nie generuje CLS.
 */
function FormatDiagram({ format, showInsert = false }: { format: EnvelopeFormat; showInsert?: boolean }) {
  const box = MAX_FORMAT_SIDE;
  const long = Math.max(format.width, format.height);
  const short = Math.min(format.width, format.height);
  const x = (box - long) / 2;
  const y = (box - short) / 2;
  const insertLong = Math.max(A4_IN_THREE.width, A4_IN_THREE.height);
  const insertShort = Math.min(A4_IN_THREE.width, A4_IN_THREE.height);

  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '1 / 1' }}
    >
      <rect
        x={x}
        y={y}
        width={long}
        height={short}
        rx="2"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        opacity={format.disabled ? 0.45 : 1}
      />
      {/* Klapka — ten sam rysunek co w swatchu koloru, w skali formatu */}
      <path
        d={`M${x} ${y + 3} L${x + long / 2} ${y + short - 6} L${x + long} ${y + 3}`}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity={format.disabled ? 0.35 : 0.6}
      />
      {showInsert && (
        <rect
          x={(box - insertLong) / 2}
          y={(box - insertShort) / 2}
          width={insertLong}
          height={insertShort}
          fill="none"
          stroke="var(--color-seal)"
          strokeWidth="1.4"
          strokeDasharray="6 4"
        />
      )}
    </svg>
  );
}

export default function DlEnvelopesPage() {
  return (
    <>
      <JsonLd data={dlEnvelopeProductJsonLd()} />
      <JsonLd data={envelopeFormatsJsonLd()} />
      <JsonLd data={faqJsonLd(DL_FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak zamówić koperty DL',
          description: `Zamówienie kopert DL ${DL.dimensions} bez nadruku w sklepie Envelopes — od wyboru koloru w konfiguratorze po wysyłkę kurierem w ${DEFAULT_PRICING.leadDaysPlain} dni robocze.`,
          steps: HOW_TO_STEPS,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty DL', url: '/koperty-dl' },
        ])}
      />

      {/* ── Hero — blok odpowiedzi GEO + pierwsze CTA nad linią zgięcia ── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/Hero%20Envelopes%20Robocze.png" />
          <div className="container">
            <nav
              aria-label="Ścieżka nawigacji"
              className="small muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty DL
            </nav>

            <span className="eyebrow">Format DL</span>
            <h1>Koperty DL — wymiary {DL.dimensions}</h1>
            <p className="hero-lead">
              Koperta DL ma wymiary {DL.dimensions}, czyli {dimensionsInCm(DL)} — format podłużny,
              zaprojektowany pod arkusz A4 złożony na trzy. Największa wkładka, jaka do niej
              wejdzie, mierzy {MAX_INSERT.short} × {MAX_INSERT.long} mm. Poniżej rozpisujemy, co
              się w niej mieści, a co wymaga innego formatu.
            </p>

            <div className="row">
              <ConfigureLink format="DL" className="btn btn-lg">
                Zamów koperty DL
              </ConfigureLink>
              <Link href="#co-sie-miesci" className="btn btn-secondary">
                Sprawdź, co się zmieści
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Koperty gładkie zamawiają Państwo od {DEFAULT_PRICING.moqWithoutPrint} sztuki, bez
              opakowań zbiorczych. Do każdego zamówienia wystawiamy fakturę VAT, a instytucjom
              publicznym i urzędom — z odroczonym terminem płatności 14 dni.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: DL.dimensions,
                  note: `${dimensionsInCm(DL)} — koperta prostokątna, podłużna, bez okienka`,
                },
                {
                  title: `Wkładka do ${MAX_INSERT.short} × ${MAX_INSERT.long} mm`,
                  note: `A4 złożone na trzy, voucher ${A4_IN_THREE.width} × ${A4_IN_THREE.height} mm, banknot płasko`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
                  note: `${formatPrice(plain.unitTotal)} brutto za sztukę w każdym z ${COLORS.length} kolorów`,
                },
                {
                  title: `${DEFAULT_PRICING.leadDaysPlain} dni robocze`,
                  note: 'Koperty gładkie nie przechodzą przez produkcję ani przez akceptację projektu',
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

      {/* ── Wymiary — rdzeń intencji `koperty dl wymiary` ── */}
      <section className="section section-surface" id="wymiary">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Wymiary</span>
            <h2>Jakie wymiary ma koperta DL</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperta DL ma wymiary <strong>{DL.dimensions}</strong>, czyli {dimensionsInCm(DL)}.
            Krótszy bok mierzy {DL.width} mm, dłuższy — {DL.height} mm. DL jest formatem
            znormalizowanym, więc koperta o tej nazwie ma te same wymiary niezależnie od
            producenta; różni się papierem, kolorem i wykończeniem, a nie geometrią. Nazwa
            pochodzi od formatu DIN Lang, opisującego arkusz A4 złożony na trzy.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Wkładka nie powinna mieć wymiarów koperty. Zostawiamy {INSERT_CLEARANCE_MM} mm zapasu
            w każdym wymiarze, żeby dokument wchodził bez zaginania rogów i nie blokował klapki —
            stąd największa wkładka do koperty DL to {MAX_INSERT.short} × {MAX_INSERT.long} mm.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Specyfikacja techniczna koperty DL {DL.dimensions} w sklepie Envelopes
              </caption>
              <tbody>
                <tr>
                  <th scope="row">Wymiary zewnętrzne</th>
                  <td>
                    {DL.dimensions} ({dimensionsInCm(DL)})
                  </td>
                </tr>
                <tr>
                  <th scope="row">Krótszy bok</th>
                  <td>{DL.width} mm</td>
                </tr>
                <tr>
                  <th scope="row">Dłuższy bok</th>
                  <td>{DL.height} mm</td>
                </tr>
                <tr>
                  <th scope="row">Największa wkładka</th>
                  <td>
                    {MAX_INSERT.short} × {MAX_INSERT.long} mm (przy {INSERT_CLEARANCE_MM} mm zapasu
                    w każdym wymiarze)
                  </td>
                </tr>
                <tr>
                  <th scope="row">Kształt</th>
                  <td>Prostokątna, podłużna — klapka na dłuższym boku</td>
                </tr>
                <tr>
                  <th scope="row">Okienko adresowe</th>
                  <td>Brak — przednia ścianka jest jednolitą płaszczyzną papieru</td>
                </tr>
                <tr>
                  <th scope="row">Papier</th>
                  <td>Barwiony w masie, {WEIGHT_SUMMARY}</td>
                </tr>
                <tr>
                  <th scope="row">Kolory</th>
                  <td>
                    {COLORS.length} odcieni w jednej cenie, w tym wykończenia perłowe, metaliczne
                    i eko
                  </td>
                </tr>
                <tr>
                  <th scope="row">Cena</th>
                  <td>
                    {formatPrice(plain.unitTotal)} brutto ({formatPrice(plain.net)} netto) za
                    sztukę, identyczna w każdym kolorze
                  </td>
                </tr>
                <tr>
                  <th scope="row">Minimalna ilość</th>
                  <td>
                    {DEFAULT_PRICING.moqWithoutPrint} sztuka bez nadruku,{' '}
                    {DEFAULT_PRICING.moqWithPrint} sztuk z nadrukiem lub personalizacją
                  </td>
                </tr>
                <tr>
                  <th scope="row">Czas realizacji</th>
                  <td>
                    {DEFAULT_PRICING.leadDaysPlain} dni robocze dla kopert gładkich,{' '}
                    {DEFAULT_PRICING.leadDaysStandard} dni roboczych z nadrukiem
                  </td>
                </tr>
                <tr>
                  <th scope="row">Dostawa</th>
                  <td>Kurier, {formatPrice(DELIVERY_COST)} brutto za zamówienie</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" className="btn">
              Wybierz kolor koperty DL
            </ConfigureLink>
            <span className="small muted">
              Konfigurator otworzy się z formatem DL. Cenę widzą Państwo od razu, bez zapytania
              ofertowego.
            </span>
          </div>
        </div>
      </section>

      {/* ── Tabela dopasowań — najczęściej cytowany fragment tego typu strony ── */}
      <section className="section" id="co-sie-miesci">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dopasowanie</span>
            <h2>Co zmieści się w kopercie DL</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            W kopercie DL {DL.dimensions} mieści się kartka A4 złożona na trzy, czyli{' '}
            {A4_IN_THREE.width} × {A4_IN_THREE.height} mm, voucher w tym samym wymiarze, kartka A6
            105 × 148 mm oraz banknot i karta podarunkowa — obie płasko, bez składania. Nie
            mieszczą się arkusz A4 rozłożony, arkusz A4 złożony na pół (148 × 210 mm)
            i zaproszenie kwadratowe 150 × 150 mm: wszystkie trzy przekraczają szerokość{' '}
            {DL.width} mm.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Dopasowanie standardowych wkładek do koperty DL {DL.dimensions}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Wkładka</th>
                  <th scope="col">Wymiary</th>
                  <th scope="col">Koperta DL</th>
                  <th scope="col">Zapas</th>
                  <th scope="col">Zastosowanie</th>
                </tr>
              </thead>
              <tbody>
                {STANDARD_INSERTS.map((insert) => {
                  const fit = fitsInFormat(insert, DL);
                  return (
                    <tr key={insert.label}>
                      <th scope="row">{insert.label}</th>
                      <td className="mono-sm">
                        {formatMm(insert.width)} × {formatMm(insert.height)} mm
                      </td>
                      <td>{fit.fits ? 'Mieści się' : 'Nie mieści się'}</td>
                      <td className="mono-sm">
                        {fit.fits
                          ? `${formatMm(fit.clearanceShort)} i ${formatMm(fit.clearanceLong)} mm`
                          : '—'}
                      </td>
                      <td>{insert.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kolumna „Zapas" podaje różnicę między kopertą a wkładką na krótszym i na dłuższym
            boku. Za dopasowaną uznajemy wkładkę, która zostawia co najmniej{' '}
            {INSERT_CLEARANCE_MM} mm w każdym wymiarze. Wymiary banknotów pochodzą z serii
            emisyjnej Narodowego Banku Polskiego: 100 zł mierzy 138 × 69 mm, 200 zł — 144 × 72 mm,
            a 500 zł — 150 × 75 mm.
          </p>

          {/* Link w bok do filara K7 — wiersz „Voucher lub bon" jest w tej tabeli,
              ale cała ścieżka zakupowa firmy sprzedającej bon należy do F4. */}
          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Wiersz z voucherem dotyczy najczęstszego zastosowania formatu DL poza korespondencją.
            Cennik serii bonów, wybór kolorów pod nadruk logo i dziesięć branż sprzedających bon
            opisaliśmy na stronie <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" className="btn">
              Zamów koperty DL {DL.dimensions}
            </ConfigureLink>
            <span className="small muted">
              Koperty gładkie wysyłamy w {DEFAULT_PRICING.leadDaysPlain} dni robocze, od{' '}
              {DEFAULT_PRICING.moqWithoutPrint} sztuki.
            </span>
          </div>
        </div>
      </section>

      {/* ── Porównanie formatów — bez CTA na formaty `disabled` (pkt 4.2 briefu) ── */}
      <section className="section section-surface" id="formaty">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Porównanie</span>
            <h2>Koperta DL a formaty C6 i K4</h2>
            <p>
              Trzy rysunki poniżej są w tej samej skali, więc różnicę proporcji widać wprost.
              Przerywana ramka w kopercie DL pokazuje arkusz A4 złożony na trzy —{' '}
              {A4_IN_THREE.width} × {A4_IN_THREE.height} mm.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            {FORMATS.map((format) => (
              <div className="card" key={format.id}>
                <FormatDiagram format={format} showInsert={format.id === 'DL'} />
                <h3 style={{ fontSize: 19, marginTop: 'var(--space-3)' }}>
                  Koperta {format.id} {format.dimensions}
                </h3>
                <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                  {format.disabled ? 'Dostępne wkrótce' : 'W sprzedaży'}
                </p>
                <p className="small" style={{ marginBottom: 0 }}>
                  {format.audience}
                </p>
              </div>
            ))}
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-6)' }}>
            <table className="data">
              <caption className="sr-only">
                Wymiary i dostępność formatów kopert w katalogu Envelopes
              </caption>
              <thead>
                <tr>
                  <th scope="col">Format</th>
                  <th scope="col">Wymiary</th>
                  <th scope="col">Największa wkładka</th>
                  <th scope="col">Status w Envelopes</th>
                </tr>
              </thead>
              <tbody>
                {FORMATS.map((format) => {
                  const max = maxInsertSize(format);
                  return (
                    <tr key={format.id}>
                      <th scope="row">Koperta {format.id}</th>
                      <td className="mono-sm">{format.dimensions}</td>
                      <td className="mono-sm">
                        {max.short} × {max.long} mm
                      </td>
                      <td>{format.disabled ? 'Dostępne wkrótce' : 'W sprzedaży'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-5)' }}>
            Zamówić można dziś wyłącznie format DL. Koperty {UPCOMING_LABEL} mają w katalogu
            Envelopes status „Dostępne wkrótce" — nie da się ich kupić ani gładkich, ani
            z nadrukiem. Podajemy ich wymiary, bo bez nich porównanie formatów byłoby niepełne,
            ale żaden przycisk na tej stronie nie prowadzi do zamówienia koperty C6 ani K4.
          </p>
        </div>
      </section>

      {/* ── Kształt i brak okienka — frazy `koperta prostokątna`, `koperty bez okienka` ── */}
      <section className="section" id="ksztalt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Budowa</span>
            <h2>Koperta prostokątna bez okienka adresowego</h2>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Kształt prostokątny, klapka na dłuższym boku</h3>
              <p className="small">
                Koperta DL jest prostokątna i podłużna — stosunek jej boków wynosi 1 do{' '}
                {SIDE_RATIO}. Klapka biegnie wzdłuż dłuższego boku {DL.height} mm, więc dokument
                wsuwa się wzdłuż koperty, a nie od krótszej krawędzi. Ten układ jest powodem, dla
                którego format DL przyjmuje arkusz A4 złożony na trzy: wkładka {A4_IN_THREE.width}{' '}
                × {A4_IN_THREE.height} mm wchodzi w jednym ruchu, bez obracania i bez dodatkowego
                zagięcia.
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 19 }}>Brak okienka na całej ofercie</h3>
              <p className="small">
                Wszystkie koperty Envelopes są bez okienka adresowego. Przednia ścianka jest
                jednolitą płaszczyzną papieru barwionego w masie, bez folii i bez wycięcia. Ma to
                dwie konsekwencje praktyczne: adres odbiorcy trzeba nadrukować lub napisać na
                kopercie, a w zamian cała ścianka jest dostępna pod nadruk — z zachowaniem {PRINT_SAFE_MARGIN_MM} mm
                marginesu od krawędzi, poza linią klejenia i zagięciem klapki.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolory — bez powielania palety, link w bok do właściciela frazy `/` ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolory</span>
            <h2>W jakich kolorach dostępna jest koperta DL</h2>
            <p>
              Format DL dostępny jest we wszystkich {COLORS.length} kolorach z naszego katalogu,
              każdy w tej samej cenie {formatPrice(plain.unitTotal)} brutto za sztukę. Poniżej
              {' '}
              {BESTSELLERS.length} odcieni oznaczonych plakietką „Bestseller" — pełną paletę
              pokazujemy na stronie głównej.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
            {BESTSELLERS.map((color) => (
              <ConfigureLink
                key={color.id}
                format="DL"
                color={color.id}
                className="card"
                title={`Koperta DL ${color.name.toLowerCase()} — otwórz konfigurator z tym kolorem`}
              >
                <div style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                  <EnvelopePlaceholder
                    format="DL"
                    colorId={color.id}
                    ratio="photo"
                    hideCaption
                    size="sm"
                  />
                  <strong style={{ display: 'block', fontSize: 15, marginTop: 'var(--space-3)' }}>
                    Koperta DL {color.name}
                  </strong>
                  <span className="small muted">
                    {DL.dimensions} · {color.weight?.replace('g', ' g/m²')}
                    {color.finish ? ` · wykończenie ${color.finish}` : ''}
                  </span>
                </div>
              </ConfigureLink>
            ))}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Gramatura papieru rozkłada się następująco: {WEIGHT_SUMMARY}. Wymiar koperty jest ten
            sam we wszystkich odcieniach — grubszy papier nie zmienia formatu, zmienia sztywność.
            Wszystkie {COLORS.length} odcieni obejrzą Państwo w{' '}
            <Link href="/#kolory">palecie kolorów kopert ozdobnych</Link>.
          </p>

          {/* Odcienie z własną kartą — lista rośnie razem z `color-pages.ts`,
              więc link dokłada się sam przy publikacji kolejnego koloru. */}
          {colorPages().length > 0 && (
            <p className="small muted" style={{ marginTop: 'var(--space-3)', maxWidth: '68ch' }}>
              Osobną kartę z charakterystyką papieru, zastosowaniami i zamówieniem mają:{' '}
              {colorPages().map(({ color, content }, index) => (
                <span key={color.id}>
                  {index > 0 ? ', ' : ''}
                  <Link href={colorPagePath(color.id)}>{content.phrase}</Link>
                </span>
              ))}
              .
            </p>
          )}
        </div>
      </section>

      {/* ── Usługi — po jednym akapicie; cenniki rozłożone na czynniki są na F1 i F2 ── */}
      <section className="section" id="uslugi">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Usługi</span>
            <h2>Nadruk i adresowanie na kopercie DL</h2>
            <p>
              Brak okienka adresowego oznacza, że cała przednia ścianka koperty DL{' '}
              {DL.dimensions} jest dostępna pod druk. Obie usługi wymagają zamówienia minimum{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk i kończą się wizualizacją, którą akceptują
              Państwo przed skierowaniem zamówienia do druku.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk logo firmowego</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.print)} brutto/szt. · od{' '}
                {DEFAULT_PRICING.moqWithPrint} szt.
              </p>
              <p className="small">
                Ten sam projekt na całym nakładzie: logo, dane kontaktowe albo pełna grafika.
                Cennik, listę przyjmowanych plików i proces akceptacji opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" print className="btn btn-sm">
                  Wyceń koperty DL z nadrukiem
                </ConfigureLink>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Personalizacja i adresowanie</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.personalization)} brutto/szt. · od{' '}
                {DEFAULT_PRICING.moqWithPrint} szt.
              </p>
              <p className="small">
                Na każdej kopercie inne dane: imię i nazwisko, pełny adres albo dedykacja. Cennik,
                wymagania dla listy adresów i proces opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" personalization className="btn btn-sm">
                  Wyceń koperty DL z adresowaniem
                </ConfigureLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dla kogo — filar mówi do wszystkich branż (pkt 5.1 briefu) ── */}
      <section className="section" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Dla kogo jest koperta DL</h2>
            <p>
              Format DL wybiera każdy, kto wysyła dokument A4 albo voucher w wymiarze{' '}
              {A4_IN_THREE.width} × {A4_IN_THREE.height} mm. Poniżej dziesięć zastosowań opisanych
              wymiarem wkładki, a nie ogólnym przeznaczeniem.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {INDUSTRIES.map((industry) => (
              <div className="card" key={industry.heading}>
                <h3 style={{ fontSize: 19 }}>{industry.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {industry.text}
                </p>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" className="btn">
              Zamów koperty DL
            </ConfigureLink>
            <Link href="/kontakt#wycena" className="btn btn-secondary">
              Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
            </Link>
          </div>
        </div>
      </section>

      {/* ── Proces zamówienia (HowTo) — ścieżka koperty gładkiej, trzy kroki ── */}
      <section className="section section-surface" id="jak-zamawiac">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proces</span>
            <h2>Jak zamówić koperty DL</h2>
            <p>
              Zamówienie kopert gładkich przechodzi przez trzy kroki. Akceptacji wizualizacji nie
              ma, bo koperta bez nadruku nie trafia do produkcji — pakujemy ją z magazynu.
            </p>
          </div>

          <div className="how-steps">
            {HOW_TO_STEPS.map((step, index) => (
              <div className="how-step" key={step.name}>
                <span className="eyebrow">Krok {index + 1}</span>
                <h3 style={{ fontSize: 20 }}>{step.name}</h3>
                <p className="small muted">{step.text}</p>
              </div>
            ))}
          </div>

          <p className="small" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Termin liczymy od zaksięgowania wpłaty; przy przelewie tradycyjnym prosimy doliczyć
            czas księgowania. Jeśli do zamówienia dochodzi nadruk logo albo personalizacja,
            dochodzi też akceptacja wizualizacji, a termin rośnie do{' '}
            {DEFAULT_PRICING.leadDaysStandard} dni roboczych — albo{' '}
            {DEFAULT_PRICING.leadDaysExpress} dni roboczych za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>
        </div>
      </section>

      {/* ── FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o wymiary koperty DL</h2>
          </div>
          {DL_FAQ_ITEMS.map((item) => (
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

      {/* ── Treści wspierające filar wrócą wraz z poz. 10, 11 i 13 planu ── */}

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Koperty DL {DL.dimensions} — gotowe do zamówienia</h2>
              <p>
                Konfigurator otworzy się z formatem DL. Wybór koloru zajmuje minutę, a cenę widzą
                Państwo od razu — {formatPrice(plain.unitTotal)} brutto za sztukę, od{' '}
                {DEFAULT_PRICING.moqWithoutPrint} sztuki, z wysyłką w{' '}
                {DEFAULT_PRICING.leadDaysPlain} dni robocze.
              </p>
            </div>
            <ConfigureLink format="DL" className="btn btn-lg">
              Zamów koperty DL
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" />
    </>
  );
}
