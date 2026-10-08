import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { colorPagePath, hasColorPage } from '@/lib/color-pages';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  COLOR_MAP,
  FORMAT_MAP,
  STANDARD_INSERTS,
  fitsInFormat,
  formatMm,
} from '@/lib/catalog';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import { breadcrumbJsonLd, ogImage, productId, webPageJsonLd } from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K7 pod filarem F4 — „koperty na bony do salonu
 * fryzjerskiego" (content-plan.md poz. 50, Tydzień 13).
 *
 * **Rozgraniczenie wobec F4.** Filar poświęca tej branży jedną kartę w sekcji
 * „Dla kogo": bon wręczany przy stanowisku nie potrzebuje adresu, a koperta
 * przyjmie i wydruk, i kartę plastikową. Ta strona rozstrzyga, **jak taki bon
 * wygląda w rękach klienta salonu**: bon imienny (personalizacja w zakresie
 * `imiona`, z numerem bonu w trzeciej linii), wkładka (wydruk albo karta ID-1)
 * oraz wybór między perłą a odcieniami ciemnymi — w zależności od logo.
 *
 * **Rozgraniczenie wobec poz. 24** (poradnik „jak wręczyć bon podarunkowy").
 * Tamten wpis uczy wręczania i nie sprzedaje; ta strona jest sprzedażowa
 * i kończy się wejściem do konfiguratora.
 *
 * **Rozgraniczenie wobec poz. 19 i 22** (SPA, kliniki — ten sam rodzic).
 * Salon fryzjerski nie ma zabiegu ani procedury, którą obdarowany musi
 * zrozumieć, więc strona nie dokłada dyskrecji przy zakupie bonu. Pytaniem
 * jest tu **imię na kopercie** i to, co z niego wynika dla terminu: lista
 * imion musi istnieć przed drukiem.
 *
 * **Bez kalendarza sezonowego.** Baza wiedzy nie podaje szczytu sprzedaży tej
 * branży (nagłówek Fazy 5 planu: żadna LP nie zakłada własnej sezonowości bez
 * źródła). Arytmetykę terminu zostawiamy poradnikowi z poz. 16.
 *
 * **Bez własnego `FAQPage`** — jak w poz. 17–26. `VOUCHER_FAQ_ITEMS` na F4
 * pokrywa pytania o nadruk, imię obdarowanego, terminy i kilka kolorów naraz;
 * `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Kadr i kolory.** Jedyny realny kadr z tej branży to Biała Perłowa
 * z miedzianym znakiem salonu (`biala-perlowa-koperta-dl-nadruk-logo-salonu-
 * fryzjerskiego`) — stoi tam, gdzie mowa o perle, z podpisem „przykładowy
 * nadruk". Kierunek ciemny pokazują kadry katalogowe z polem nadruku, bo
 * zdjęcia aranżacyjnego z logo barber shopu w repozytorium nie ma. Złotego
 * strona nie poleca (`outOfStock` w katalogu).
 *
 * Kolory, ceny, minima i terminy pochodzą z `catalog.ts` i `pricing.ts`.
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

/** Konfiguracje, w których bon realnie trafia do klienta salonu — wiersze tabeli kosztu. */
const SALON_SETUPS: {
  label: string;
  config: Partial<EnvelopeConfig>;
  minimum: number;
  leadDays: number;
}[] = [
  {
    label: 'Koperta gładka',
    config: {},
    minimum: DEFAULT_PRICING.moqWithoutPrint,
    leadDays: DEFAULT_PRICING.leadDaysPlain,
  },
  {
    label: 'Koperta z logo salonu',
    config: { print: true },
    minimum: DEFAULT_PRICING.moqWithPrint,
    leadDays: DEFAULT_PRICING.leadDaysStandard,
  },
  {
    label: 'Koperta z logo i imieniem obdarowanego',
    config: { print: true, personalization: true },
    minimum: DEFAULT_PRICING.moqWithPrint,
    leadDays: DEFAULT_PRICING.leadDaysStandard,
  },
];

function insertByLabel(label: string) {
  const insert = STANDARD_INSERTS.find((item) => item.label === label);
  if (!insert) throw new Error(`Brak wkładki „${label}" w STANDARD_INSERTS`);
  return insert;
}

/**
 * Cztery wkładki, o które pyta salon: bon drukowany, karta, wizytówka
 * i bon na całym arkuszu. Wymiary i dopasowanie czyta `fitsInFormat()`
 * z katalogu — pełna tabela dziesięciu wkładek zostaje na F3.
 */
const GIFT_INSERTS: { name: string; label: string; role: string }[] = [
  {
    name: 'Bon drukowany na jednej trzeciej A4',
    label: 'Voucher lub bon w formacie DL',
    role: 'Bon na usługę albo kwotę, który salon drukuje sam i uzupełnia przy sprzedaży.',
  },
  {
    name: 'Karta podarunkowa ID-1',
    label: 'Karta podarunkowa (standard ID-1)',
    role: 'Karta z kodem wydawana przy kasie. Leży w kopercie swobodnie, więc dobrze, gdy idzie z kartką z życzeniami.',
  },
  {
    name: 'Wizytówka stylisty',
    label: 'Wizytówka',
    role: 'Dołączona do bonu — obdarowany wie, do kogo umówić wizytę.',
  },
  {
    name: 'Bon na całym arkuszu A4',
    label: 'Dyplom A4 bez składania',
    role: 'Wymaga złożenia na trzy albo przeprojektowania na format bonu drukowanego.',
  },
];

/** Dwa odcienie ciemne — kierunek dla salonu, którego identyfikacja jest ciemna. */
const DARK_COLOR_IDS = ['czarny', 'ciemnozielony'];

const PEARL = COLOR_MAP['biala-perlowa'];
const PEARL_SHOT = shotByFile('biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego');

/** Trzy sytuacje, w których imię obdarowanego jest znane przed drukiem. */
const NAMED_SITUATIONS: { heading: string; text: string }[] = [
  {
    heading: 'Podziękowanie dla stałego klienta',
    text: 'Salon zna odbiorcę z kartoteki, więc lista imion jest gotowa, zanim zapadnie decyzja o kopercie.',
  },
  {
    heading: 'Pakiet bonów dla zespołu firmy',
    text: 'Firma kupuje w salonie serię bonów dla pracowników i przekazuje listę osób razem z zamówieniem.',
  },
  {
    heading: 'Nagroda w konkursie',
    text: 'Zwycięzców salon poznaje przed wręczeniem nagród, więc listę imion przygotowuje zaraz po rozstrzygnięciu.',
  },
];

const salonTitle = 'Koperty na bony do salonu fryzjerskiego';
/* Opis pod wynikiem wyszukiwania — pkt 5.3 briefu SEO. Dwa konkrety, których
   tytuł nie niesie: próg nadruku i imię obdarowanego. Wezwanie w drugim
   zdaniu. Przy dzisiejszym cenniku długość jest zmierzona w zbudowanym HTML-u
   (content-plan.md, dziennik wdrożeń poz. 50). */
const salonDescription = `Koperty na bony do salonu fryzjerskiego z logo i imieniem obdarowanego, od ${DEFAULT_PRICING.moqWithPrint} sztuk. Wybiorą Państwo perłę albo czerń i sprawdzą cenę w konfiguratorze.`;

export const metadata: Metadata = {
  title: salonTitle,
  description: salonDescription,
  keywords: [
    'koperty na bony do salonu fryzjerskiego',
    'koperty dla salonów fryzjerskich',
    'koperty dla barber shopów',
    'koperta na bon do fryzjera',
  ],
  alternates: { canonical: '/koperty-dla-salonow-fryzjerskich' },
  openGraph: {
    type: 'website',
    title: `${salonTitle} — Envelopes`,
    description: salonDescription,
    url: '/koperty-dla-salonow-fryzjerskich',
    images: [
      ogImage(
        'koperty-dla-salonow-fryzjerskich',
        'Koperta DL Biała Perłowa z miedzianym nadrukiem logo salonu fryzjerskiego, przygotowana pod bon podarunkowy'
      ),
    ],
  },
};

export default function HairSalonEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-salonow-fryzjerskich',
          type: 'ItemPage',
          name: salonTitle,
          description: salonDescription,
          mainEntityId: productId('/koperty-na-vouchery'),
          image: ogImage('koperty-dla-salonow-fryzjerskich', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
          { name: 'Salony fryzjerskie', url: '/koperty-dla-salonow-fryzjerskich' },
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
              <span aria-hidden="true">›</span> Salony fryzjerskie
            </nav>

            <span className="eyebrow">Bony do salonu fryzjerskiego</span>
            <h1>Koperty na bony do salonu fryzjerskiego</h1>
            <p className="hero-lead">
              Bon do salonu fryzjerskiego wręczony w kopercie ozdobnej wygląda jak prezent, a nie
              jak wydruk z kasy. Koperta DL mieści bon drukowany i kartę podarunkową, a na jej
              przodzie stoi logo salonu i imię obdarowanego. Kolor wybierają Państwo spośród
              perłowej bieli i odcieni ciemnych.
            </p>

            <div className="row">
              <ConfigureLink format="DL" color="biala-perlowa" print className="btn btn-lg">
                Wyceń koperty dla salonu fryzjerskiego
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo salonu akceptują Państwo przed drukiem, a termin
              liczymy od jej akceptacji.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Bon 99 × 210 mm lub karta ID-1',
                  note: `Oba mieszczą się w kopercie DL ${DL.dimensions}, bez zaginania`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
                },
                {
                  title: 'Imię na kopercie, bez adresu',
                  note: 'Trzecia linia nadruku mieści numer bonu albo krótką dedykację',
                },
                {
                  title: 'Perła albo odcień ciemny',
                  note: `Biała Perłowa, Czarny i Butelkowa Zieleń — w palecie ${COLORS.length} kolorów`,
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

      {/* ── Bon imienny — oś strony: imię na kopercie i ograniczenie, które z niego wynika ── */}
      <section className="section section-surface" id="bon-imienny">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Bon imienny</span>
            <h2>Bon imienny do salonu fryzjerskiego: imię obdarowanego na kopercie</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Imię obdarowanego drukujemy na przodzie koperty w ramach personalizacji, bez adresu.
            Listę wgrywają Państwo arkuszem albo wpisują w konfiguratorze: imię i nazwisko, drugą
            linię opcjonalnie, a w trzeciej numer bonu albo krótką dedykację. Wymagane pola
            i walidację arkusza opisaliśmy na stronie{' '}
            <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Imienia na kopercie nie warto pisać ręcznie. Na papierze perłowym mokry tusz schnie wolniej
            i bywa przerywany, a na czarnym długopis nie zostawia czytelnego śladu. Nadruk wygląda
            tak samo na każdej kopercie z serii.
          </p>

          <div className="card" style={{ maxWidth: '68ch', marginTop: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 19 }}>Imię musi być znane przed drukiem</h3>
            <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
              Termin liczymy od akceptacji wizualizacji, więc koperta z imieniem nie powstaje na
              prośbę klienta, który kupuje bon przy kasie. Bony wręczane osobie, której imienia
              salon jeszcze nie zna, pakują Państwo w kopertę z samym logo.
            </p>
          </div>

          <h3 style={{ marginTop: 'var(--space-6)' }}>Kiedy bon imienny ma sens</h3>
          <div className="grid grid-3" style={{ gap: 'var(--space-5)', marginTop: 'var(--space-4)' }}>
            {NAMED_SITUATIONS.map((situation) => (
              <div className="card" key={situation.heading}>
                <h3 style={{ fontSize: 19 }}>{situation.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {situation.text}
                </p>
              </div>
            ))}
          </div>

          <p className="small" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Przód koperty może zostać w całości na imię, a logo salonu stanąć na zamknięciu — widać
            je w chwili otwierania. Nadruk na zamknięciu jest osobną usługą z osobnym plikiem,
            a układ obu stron zobaczą Państwo na wizualizacji; zasady i cenę opisaliśmy na stronie{' '}
            <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink
              format="DL"
              color="biala-perlowa"
              print
              personalization
              personalizationScope="imiona"
              className="btn"
            >
              Wyceń koperty z logo i imieniem obdarowanego
            </ConfigureLink>
            <span className="small muted">
              Konfigurator otworzy się z zakresem „samo imię i nazwisko" — bez kolumn adresowych.
            </span>
          </div>
        </div>
      </section>

      {/* ── Wkładka — wymiary czyta fitsInFormat(); pełna tabela dopasowań należy do F3 ── */}
      <section className="section" id="wkladka">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Wkładka</span>
            <h2>Co salon wkłada do koperty DL: bon drukowany czy karta</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Do koperty DL wchodzi płasko zarówno bon drukowany na jednej trzeciej arkusza A4, jak
            i karta podarunkowa w standardzie ID-1. Wybór zależy od tego, jak salon sprzedaje bon:
            drukowany uzupełniają Państwo przy kasie, kartę wydają gotową.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wkładki, które salon fryzjerski pakuje do koperty DL, z wymiarami i zapasem
              </caption>
              <thead>
                <tr>
                  <th scope="col">Wkładka</th>
                  <th scope="col">Wymiary</th>
                  <th scope="col">W kopercie DL</th>
                  <th scope="col">Do czego w salonie</th>
                </tr>
              </thead>
              <tbody>
                {GIFT_INSERTS.map((item) => {
                  const insert = insertByLabel(item.label);
                  const fit = fitsInFormat(insert, DL);
                  return (
                    <tr key={item.name}>
                      <th scope="row">{item.name}</th>
                      <td className="mono-sm">
                        {formatMm(insert.width)} × {formatMm(insert.height)}&nbsp;mm
                      </td>
                      <td className="mono-sm">
                        {fit.fits
                          ? `mieści się, zapas ${formatMm(fit.clearanceShort)} i ${formatMm(fit.clearanceLong)} mm`
                          : 'nie mieści się'}
                      </td>
                      <td>{item.role}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Pełną tabelę dziesięciu standardowych wkładek i porównanie formatów zebraliśmy na
            stronie <Link href="/koperty-dl">wymiary kopert DL</Link>.
          </p>
        </div>
      </section>

      {/* ── Kolor: perła kontra odcienie ciemne — decyzję rozstrzyga logo salonu ── */}
      <section className="section section-surface" id="kolor">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do salonu fryzjerskiego</h2>
            <p>
              Odcień papieru nie zmienia ceny, więc wybór jest decyzją o tym, jak bon ma wyglądać
              w rękach klienta. Dla salonu fryzjerskiego sprawdzają się dwa kierunki.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Perła — jasne wnętrze i logo w kolorze</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Biała Perłowa ma delikatną poświatę i jest jedynym papierem z połyskiem w palecie,
                na którym logo drukujemy w pełnych barwach marki. Kadr obok pokazuje znak w jednym,
                miedzianym kolorze, który na perłowej bieli pozostaje czytelny.
              </p>
              <div style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
                <ShowcaseGrid shots={[PEARL_SHOT]} columns={1} spec="color" />
              </div>
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                Nazwa salonu na zdjęciu jest przykładowa — Państwa logo staje na kopercie po
                akceptacji wizualizacji.
              </p>
              {hasColorPage('biala-perlowa') && (
                <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                  <Link href={colorPagePath('biala-perlowa')}>
                    Zobacz stronę koloru {PEARL.name} →
                  </Link>
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: 19 }}>Odcienie ciemne — Czarny i Butelkowa Zieleń</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Barber shop albo salon z ciemną identyfikacją przedłuża wnętrze kopertą w Czarnym
                lub Butelkowej Zieleni — taki bon nie wygląda jak paragon. Logo drukujemy na nich
                jasnym kolorem; ciemny znak na czerni by zniknął, więc wizualizacja pokazuje go na
                tym konkretnym odcieniu, zanim ruszy druk.
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
                      <ConfigureLink
                        format="DL"
                        color={color.id}
                        print
                        title={`Koperta DL ${color.name} z nadrukiem — otwórz konfigurator`}
                      >
                        <EnvelopePlaceholder
                          format="DL"
                          colorId={color.id}
                          ratio="photo"
                          hasPrint
                          hideCaption
                          size="sm"
                        />
                        <strong
                          style={{ display: 'block', fontSize: 14, marginTop: 'var(--space-2)' }}
                        >
                          {color.name}
                        </strong>
                      </ConfigureLink>
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

          <h3 style={{ marginTop: 'var(--space-7)' }}>Jak logo salonu rozstrzyga o kolorze</h3>
          <div className="table-wrap" style={{ marginTop: 'var(--space-4)' }}>
            <table className="data">
              <caption className="sr-only">Dobór odcienia koperty do logo salonu fryzjerskiego</caption>
              <thead>
                <tr>
                  <th scope="col">Logo salonu</th>
                  <th scope="col">Odcień koperty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Wielobarwne albo ciemne</th>
                  <td>
                    Biała Perłowa — znak wielobarwny zachowuje na niej pełne barwy, a ciemny ma
                    pełny kontrast, jak na kadrze powyżej.
                  </td>
                </tr>
                <tr>
                  <th scope="row">Jasne albo białe</th>
                  <td>
                    Czarny lub Butelkowa Zieleń — jasny nadruk ma na nich pełny kontrast, a na
                    perle zbliżyłby się do koloru papieru.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" color="biala-perlowa" print className="btn">
              Wyceń koperty z logo salonu
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego odcienia.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt — tabela konfiguracji, bez macierzy nakładów (ta należy do F4) ── */}
      <section className="section" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje koperta na bon do salonu fryzjerskiego</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Cena za sztukę zależy od formatu i wybranych usług, nie od koloru ani od nakładu,
            więc pojedynczy salon płaci tyle samo co sieć salonów. Tabela zbiera trzy konfiguracje,
            w których bon trafia do klienta.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Cena, minimum zamówienia i czas wysyłki kopert na bony do salonu fryzjerskiego
              </caption>
              <thead>
                <tr>
                  <th scope="col">Konfiguracja</th>
                  <th scope="col">Cena za sztukę</th>
                  <th scope="col">Minimum zamówienia</th>
                  <th scope="col">Wysyłka</th>
                </tr>
              </thead>
              <tbody>
                {SALON_SETUPS.map((setup) => {
                  const unit = calculatePrice({ ...BASE_CONFIG, ...setup.config });
                  return (
                    <tr key={setup.label}>
                      <th scope="row">{setup.label}</th>
                      <td className="mono-sm">
                        <strong>{formatPrice(unit.unitTotal)}</strong> brutto
                      </td>
                      <td className="mono-sm">{setup.minimum} szt.</td>
                      <td className="mono-sm">{setup.leadDays} dni robocze</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto
            i naliczamy go raz na całe zamówienie. Termin zaczyna biec po zaksięgowaniu wpłaty
            i akceptacji wizualizacji; tryb ekspresowy opisaliśmy w poradniku{' '}
            <Link href="/blog/szybka-realizacja-kopert-terminy-i-ekspres">
              szybka realizacja kopert
            </Link>
            . Koszt całej serii w kilku nakładach policzyliśmy na stronie{' '}
            <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" color="biala-perlowa" print className="btn">
              Sprawdź cenę swojego nakładu
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
              <h2>Gotowi zapakować bony do salonu?</h2>
              <p>
                Konfigurator otworzy się z formatem DL, Białą Perłową i włączonym nadrukiem. Cenę
                widzą Państwo od razu, a wizualizację akceptują przed drukiem.
              </p>
            </div>
            <ConfigureLink format="DL" color="biala-perlowa" print className="btn btn-lg">
              Wyceń koperty dla salonu fryzjerskiego
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta
        format="DL"
        color="biala-perlowa"
        print
        label="Zamów koperty dla salonu fryzjerskiego"
      />
    </>
  );
}
