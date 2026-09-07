import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { colorPagePath, hasColorPage } from '@/lib/color-pages';
import { COLOR_MAP, FORMAT_MAP, maxInsertSize } from '@/lib/catalog';
import { MONEY_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  moneyEnvelopeProductJsonLd,
  ogImage,
  productId,
  webPageJsonLd,
} from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Pillar (LP) klastra K8 — „koperty na pieniądze" (keywords.md K8,
 * content-plan.md poz. 39, Faza 4 — wykonana wyprzedzająco we wrześniu).
 *
 * **Wyprzedzenie kolejki planu.** K8 ma duży wolumen i szczyt sezonowy
 * w grudniu; domena potrzebuje 3–6 miesięcy dojrzewania w indeksie (ta sama
 * zasada, która przesunęła poz. 19 i 23 przed poz. 17). Prerekwizyt planu —
 * wdrożenie K1, K2, K7 — jest spełniony: wszystkie trzy filary istnieją.
 *
 * **Jedyny pillar z dominującym klientem detalicznym.** W przeciwieństwie do
 * pozostałych filarów, klient kupuje 1–5 sztuk (wesele, komunia, chrzciny),
 * nie serię pod jedno zamówienie firmowe. Stąd MOQ 1 sztuka jest głównym
 * argumentem strony, a nie szczegółem w tabeli.
 *
 * **Termin realizacji podany nad CTA — decyzja z content-plan.md, nie
 * stylistyczna.** Klient detaliczny szuka koperty „na już". Koperta gładka
 * idzie w 2 dni robocze — to szybko, ale nie tego samego dnia. Zdanie o tym
 * stoi w leadzie hero, w pasku faktów i w sekcji kosztowej, zawsze przed
 * przyciskiem CTA, żeby nie generować odbić i reklamacji.
 *
 * **Własny `Product` i własny `FAQPage`** — pierwszy raz od czasu poz. 17/19/23,
 * które pożyczały węzeł produktu filara. Ten pillar stoi bezpośrednio pod
 * Hub `/`, ma własną frazę główną i własną, niepowtarzalną intencję
 * detaliczną, więc zasługuje na pełny komplet danych strukturalnych.
 *
 * **Rozgraniczenie wobec F3 (`/koperty-dl`).** `DL_FAQ_ITEMS` ma już pytanie
 * „Czy w kopercie DL zmieści się banknot?" z wymiarami trzech nominałów —
 * ten pillar go nie powtarza, tylko odsyła i dokłada pytanie o dwa banknoty
 * naraz, którego F3 nie ma.
 *
 * **Jedyny realny kadr to kadr ślubny „W dniu Ślubu"** na Białej Perłowej
 * (`biala-perlowa-koperta-dl-nadruk-w-dniu-slubu`, `USE_CASE_SHOTS`). Treść
 * wokół niego musi trzymać się pieniędzy, nie zaproszeń — kadr pokazuje
 * kopertę na prezent pieniężny wręczaną na weselu, a zaproszenie kwadratowe
 * wymagałoby formatu K4 ze statusem „Dostępne wkrótce" (ostrzeżenie
 * w `showcase.ts`).
 */

const DL = FORMAT_MAP.DL;
const MAX_INSERT = maxInsertSize(DL);

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
const personalized = calculatePrice({ ...BASE_CONFIG, personalization: true });

const WEDDING_SHOT = shotByFile('biala-perlowa-koperta-dl-nadruk-w-dniu-slubu');

/** Dwa odcienie odświętne obok Białej Perłowej — złoty i srebrny połysk. */
const FESTIVE_COLOR_IDS = ['zloty', 'srebrna-perlowa'];

/** Sześć okazji, w których gotówka w kopercie jest normą — keywords.md K8. */
const OCCASIONS: { name: string; text: string }[] = [
  {
    name: 'Wesele',
    text: 'Najczęstsza okazja w klastrze. Koperta zastępuje zwykłą, białą kopertę pocztową i staje się częścią prezentu, który gość wręcza przy stole gratulacyjnym.',
  },
  {
    name: 'Komunia',
    text: 'Prezent pieniężny dla dziecka pierwszokomunijnego niemal zawsze trafia do koperty ozdobnej — jasne odcienie i perłowy połysk pasują do charakteru uroczystości.',
  },
  {
    name: 'Chrzciny',
    text: 'Podobny schemat co przy komunii: gotówka lub bon na przyszłość dziecka wręczana rodzicom w eleganckim opakowaniu, a nie w zwykłej kopercie z szuflady.',
  },
  {
    name: 'Urodziny i imieniny',
    text: 'Gotówka jest praktyczniejsza niż zgadywanie z prezentem — koperta ozdobna z nadrukiem okolicznościowym sprawia, że taki prezent nie wygląda na wymówkę.',
  },
  {
    name: 'Święta Bożego Narodzenia',
    text: 'Koperta na pieniądze pod choinkę dla starszych dzieci i dalszej rodziny — sezonowy szczyt zamówień w tym klastrze przypada właśnie na grudzień.',
  },
  {
    name: 'Premie i nagrody firmowe',
    text: 'Jedyne zastosowanie B2B w tym klastrze: nagroda w konkursie pracowniczym albo premia wręczana do ręki, w kopercie z logo firmy zamiast zwykłej wypłaty na konto.',
  },
];

const moneyTitle = 'Koperty na pieniądze — ozdobne, od 1 sztuki';
const moneyDescription = `Ozdobna koperta na pieniądze na wesele, komunię lub chrzciny — banknot wchodzi płasko, od 1 sztuki za ${formatPrice(plain.unitTotal)} brutto. Wysyłka w ${DEFAULT_PRICING.leadDaysPlain} dni robocze.`;

export const metadata: Metadata = {
  title: moneyTitle,
  description: moneyDescription,
  keywords: [
    'koperty na pieniądze',
    'ozdobna koperta na pieniądze',
    'koperta ozdobna na pieniądze',
    'kolorowe koperty na pieniądze',
    'personalizowana koperta na pieniądze',
  ],
  alternates: { canonical: '/koperty-na-pieniadze' },
  openGraph: {
    type: 'website',
    title: 'Koperty na pieniądze — ozdobne, od 1 sztuki — Envelopes',
    description: moneyDescription,
    url: '/koperty-na-pieniadze',
    images: [
      ogImage(
        'koperty-na-pieniadze',
        'Koperta DL Biała Perłowa z czarnym nadrukiem „W dniu Ślubu" pismem odręcznym, na białych deskach'
      ),
    ],
  },
};

export default function MoneyEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-na-pieniadze',
          type: 'ItemPage',
          name: moneyTitle,
          description: moneyDescription,
          mainEntityId: productId('/koperty-na-pieniadze'),
          image: ogImage('koperty-na-pieniadze', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd data={moneyEnvelopeProductJsonLd()} />
      <JsonLd data={faqJsonLd(MONEY_FAQ_ITEMS)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na pieniądze', url: '/koperty-na-pieniadze' },
        ])}
      />

      {/* ── Hero — blok odpowiedzi GEO, MOQ 1 i termin realizacji nad CTA ── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/hero-tlo-2015.webp" />
          <div className="container">
            <nav
              aria-label="Ścieżka nawigacji"
              className="small muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty na
              pieniądze
            </nav>

            <span className="eyebrow">Prezent pieniężny</span>
            <h1>Koperty na pieniądze</h1>
            <p className="hero-lead">
              Ozdobna koperta DL {DL.dimensions} na gotówkę wręczaną w prezencie — na wesele,
              komunię, chrzciny albo jako nagrodę. Banknot wchodzi płasko, bez składania. Koperta
              gładka kosztuje {formatPrice(plain.unitTotal)} brutto i kupują ją Państwo już od{' '}
              {DEFAULT_PRICING.moqWithoutPrint} sztuki — bez minimalnego nakładu na serię.{' '}
              <strong>
                Wysyłamy ją w {DEFAULT_PRICING.leadDaysPlain} dni robocze — to najszybsza opcja
                w naszej ofercie, ale nie jest to wysyłka tego samego dnia.
              </strong>
            </p>

            <div className="row">
              <ConfigureLink format="DL" color="biala-perlowa" className="btn btn-lg">
                Wybierz kopertę na pieniądze
              </ConfigureLink>
              <Link href="#kolory" className="btn btn-secondary">
                Zobacz kolory
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Do każdego zamówienia wystawiamy fakturę VAT, także bez numeru NIP. Koperty gładkie
              podlegają zwrotowi w ciągu 14 dni na zasadach ogólnych.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: `Od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
                  note: 'Bez minimalnego nakładu na serię — jedna koperta na jedną uroczystość',
                },
                {
                  title: `${formatPrice(plain.unitTotal)} brutto/szt.`,
                  note: 'Cena stała niezależnie od koloru i ilości',
                },
                {
                  title: `${DEFAULT_PRICING.leadDaysPlain} dni robocze`,
                  note: 'Najszybsza opcja — nie wysyłka tego samego dnia',
                },
                {
                  title: '19 kolorów',
                  note: 'Perła i metalik w tej samej cenie co odcienie podstawowe',
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

      {/* ── Dlaczego koperta ozdobna zamiast zwykłej pocztowej ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Dlaczego pieniądze w prezencie wręcza się w kopercie ozdobnej</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Banknot dociera płaski</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Największa wkładka mieszcząca się w kopercie DL to {MAX_INSERT.short} ×{' '}
                {MAX_INSERT.long} mm — każdy nominał wchodzi bez składania, a koperta nie robi się
                nieporęczna w torebce czy kieszeni marynarki.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Opakowanie jest częścią prezentu</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Gotówka wręczona w zwykłej, białej kopercie pocztowej wygląda przypadkowo. Papier
                barwiony w masie i brak okienka adresowego sprawiają, że prezent wygląda na
                przemyślany, zanim ktokolwiek zajrzy do środka.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Jedna sztuka, bez czekania na serię</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Pozostałe produkty w naszej ofercie mają sens dopiero od kilku lub kilkunastu
                sztuk. Koperta na pieniądze kupują Państwo pojedynczo, dokładnie pod jedną
                uroczystość.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Okazje — sześć sytuacji z keywords.md K8 ── */}
      <section className="section" id="okazje">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Okazje</span>
            <h2>Na jakie okazje kupuje się kopertę na pieniądze</h2>
            <p>
              Gotówka w prezencie ma swój stały kalendarz — sześć sytuacji, w których koperta
              ozdobna zastępuje zwykłą, białą kopertę pocztową.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            {OCCASIONS.map((occasion) => (
              <div className="card" key={occasion.name}>
                <h3 style={{ fontSize: 19 }}>{occasion.name}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {occasion.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kolor — realny kadr ślubny + odcienie odświętne ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty wybrać na prezent pieniężny</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo. Do prezentów pieniężnych najczęściej
              wybierane są odcienie jasne i odświętne.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Biała Perłowa — odcień uniwersalny</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Delikatny połysk pasuje zarówno do wesela, jak i do komunii czy chrzcin. Poniżej
                realny kadr: koperta z odręcznym nadrukiem „W dniu Ślubu", wręczana gościom
                weselnym.
              </p>
              <div style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
                <ShowcaseGrid shots={[WEDDING_SHOT]} columns={3} spec="full" />
              </div>
              {hasColorPage('biala-perlowa') && (
                <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                  <Link href={colorPagePath('biala-perlowa')}>
                    Zobacz stronę koloru Biała Perłowa →
                  </Link>
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 19 }}>Złoty i Srebrna Perłowa — akcent odświętny</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Wykończenie metaliczne i perłowe nie podnosi ceny — kosztują tyle samo, co odcienie
                matowe. Połysk dobrze komponuje się z okazjami świątecznymi i jubileuszowymi, gdzie
                prezent ma się wyróżniać na stole. Pełną kolekcję odcieni szlachetnych opisaliśmy
                na stronie <Link href="/koperty-premium">koperty premium</Link>.
              </p>
              <div
                className="grid grid-2"
                style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
              >
                {FESTIVE_COLOR_IDS.map((id) => {
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

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Pozostałe kolory z palety 19 odcieni wybiorą Państwo{' '}
            <Link href="/#kolory">w pełnej palecie na stronie głównej</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" color="biala-perlowa" className="btn">
              Wybierz kopertę na pieniądze
            </ConfigureLink>
          </div>
        </div>
      </section>

      {/* ── Nadruk i personalizacja — opcje dodatkowe, nie wymagane ── */}
      <section className="section" id="nadruk">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Opcje dodatkowe</span>
            <h2>Nadruk okolicznościowy i personalizacja imienia</h2>
            <p>
              Koperta gładka wystarczy w większości przypadków. Dwie usługi dodatkowe mają sens
              przy większej liczbie obdarowanych naraz, nie przy pojedynczym prezencie.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk okolicznościowy</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                {formatPrice(printed.unitTotal)} brutto/szt. · od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk
              </p>
              <p className="small">
                Zamiast logo firmy drukujemy jedno hasło — „W dniu Ślubu", „Wszystkiego
                najlepszego" albo imię jubilata. Ten sam projekt wraca przy każdej kolejnej serii.
                Pełną specyfikację i proces akceptacji opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Personalizacja imienia obdarowanego</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                {formatPrice(personalized.unitTotal)} brutto/szt. · od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk
              </p>
              <p className="small">
                Każda koperta z serii dostaje inne imię — sprawdza się przy nagrodach dla wielu
                pracowników albo kopertach dla całej rodziny na święta. Mechanizm wgrywania listy
                opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Koszt i termin — sekcja obowiązkowa nad CTA (keywords.md K8) ── */}
      <section className="section section-surface" id="cena-i-terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cena i termin</span>
            <h2>Ile kosztuje i kiedy dotrze koperta na pieniądze</h2>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-4)' }}>
            <table className="data">
              <caption className="sr-only">
                Cena i czas realizacji koperty na pieniądze w trzech wariantach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Wariant</th>
                  <th scope="col">Cena brutto/szt.</th>
                  <th scope="col">Minimalna ilość</th>
                  <th scope="col">Czas realizacji</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Koperta gładka</td>
                  <td className="mono-sm">{formatPrice(plain.unitTotal)}</td>
                  <td>{DEFAULT_PRICING.moqWithoutPrint} sztuka</td>
                  <td>{DEFAULT_PRICING.leadDaysPlain} dni robocze</td>
                </tr>
                <tr>
                  <td>Z nadrukiem okolicznościowym</td>
                  <td className="mono-sm">{formatPrice(printed.unitTotal)}</td>
                  <td>{DEFAULT_PRICING.moqWithPrint} sztuk</td>
                  <td>
                    {DEFAULT_PRICING.leadDaysStandard} dni roboczych (ekspres{' '}
                    {DEFAULT_PRICING.leadDaysExpress})
                  </td>
                </tr>
                <tr>
                  <td>Z personalizacją imienia</td>
                  <td className="mono-sm">{formatPrice(personalized.unitTotal)}</td>
                  <td>{DEFAULT_PRICING.moqWithPrint} sztuk</td>
                  <td>
                    {DEFAULT_PRICING.leadDaysStandard} dni roboczych (ekspres{' '}
                    {DEFAULT_PRICING.leadDaysExpress})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Dostawa kurierem {formatPrice(DELIVERY_COST)} brutto, naliczana raz na całe zamówienie.
            Termin liczymy od zaksięgowania wpłaty — <strong>koperta gładka nie trafia do
            produkcji, więc {DEFAULT_PRICING.leadDaysPlain} dni robocze jest realnym, a nie
            optymistycznym terminem</strong>. Przy uroczystości za dzień lub dwa polecamy sprawdzić
            dostępność kuriera w Państwa okolicy przed złożeniem zamówienia.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" color="biala-perlowa" className="btn btn-lg">
              Wybierz kopertę na pieniądze
            </ConfigureLink>
          </div>
        </div>
      </section>

      {/* ── FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o koperty na pieniądze</h2>
          </div>
          {MONEY_FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>
                <h3 style={{ display: 'inline', fontSize: 17, fontFamily: 'inherit' }}>
                  {item.question}
                </h3>
              </summary>
              <div className="faq-answer">{item.answer}</div>
            </details>
          ))}
          <p className="small muted" style={{ marginTop: 'var(--space-5)' }}>
            Wymiary poszczególnych nominałów i pełną tabelę dopasowań wkładek opisaliśmy na
            stronie <Link href="/koperty-dl">wymiary kopert DL</Link>.
          </p>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi na kopertę pod prezent pieniężny?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i kolorem Biała Perłowa —{' '}
                {formatPrice(plain.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithoutPrint}{' '}
                sztuki, z wysyłką w {DEFAULT_PRICING.leadDaysPlain} dni robocze.
              </p>
            </div>
            <ConfigureLink format="DL" color="biala-perlowa" className="btn btn-lg">
              Wybierz kopertę na pieniądze
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" color="biala-perlowa" label="Zamów kopertę na pieniądze" />
    </>
  );
}
