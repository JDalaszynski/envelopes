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
  COLOR_MAP,
  FORMAT_MAP,
  fitsInFormat,
  formatMm,
} from '@/lib/catalog';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import { breadcrumbJsonLd, ogImage, productId, webPageJsonLd } from '@/lib/seo';
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K1 pod filarem F1 — „koperty na certyfikaty"
 * (content-plan.md poz. 27, Tydzień 7).
 *
 * **Warunek brzegowy z planu: ograniczenie formatu A4 składanego na trzy.**
 * Tradycyjny dyplom A4 na sztywnym kartonie wręczany na płasko (210 × 297 mm)
 * wymaga formatu C4, którego nie ma w naszym katalogu (koperty C6 i K4 mają
 * status `disabled: true`, a format DL mierzy 110 × 220 mm).
 *
 * Strona mówi o tym wprost od pierwszych akapitów i w tabeli dopasowań:
 * - Koperta DL idealnie mieści **certyfikat / dyplom A4 złożony na trzy**
 *   (standard 99 × 210 mm) — tak wręcza się większość zaświadczeń, certyfikatów
 *   kwalifikacji, certyfikatów MEN i listów gratulacyjnych.
 * - Koperta DL mieści również **kartę certyfikatu w formacie podłużnym DL**
 *   (99 × 210 mm, jedna trzecia A4 docięta bez składania) oraz format A6.
 * - Certyfikat A4 płaski bez składania nie wchodzi do żadnej koperty z naszej
 *   oferty. Jeśli program wymaga sztywnego dyplomu A4 na płasko, strona
 *   odsyła do kontaktu i nie proponuje zamiennika na siłę (zgodnie z regułą
 *   z poz. 25).
 *
 * **Rozgraniczenie wobec sąsiednich stron pod F1:**
 * - **Poz. 17 (`/koperty-dla-kancelarii`):** korespondencja procesowa i akty
 *   notarialne, odcienie ciemne/stonowane, jednostka: sprawa.
 * - **Poz. 21 (`/koperty-dla-biur-rachunkowych`):** rok obrotowy i deklaracje
 *   podatkowe, odcienie neutralne (Biały, Ecru), jednostka: portfel klientów.
 * - **Poz. 25 (`/koperty-dla-agencji-eventowych`):** zaproszenia firmowe, fale
 *   kampanii przed galą, jednostka: lista gości.
 * - **Poz. 26 (`/koperty-dla-nieruchomosci`):** ścieżka etapów transakcji,
 *   odcienie materiałowe, wręczanie do ręki.
 * - **Ta LP:** moment wręczenia certyfikatu / zaświadczenia (zwieńczenie kursu,
 *   szkolenia, semestru), nakład liczony **wielkością grupy szkoleniowej / rocznika**
 *   (od 10 sztuk z logo, co pozwala zamawiać partię pod pojedynczy warsztat),
 *   personalizacja imienna absolwenta i kolory akademickie/edukacyjne (Granatowy,
 *   Matcha, Złoty).
 *
 * **Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 21, 22, 23, 25 i 26.
 * Pytania o cenę nadruku, pliki i realizację należą do F1; `mainEntityId`
 * wskazuje na węzeł `Product` filara F1.
 *
 * **Zdjęcia:**
 * - Kadr aranżacyjny z `USE_CASE_SHOTS`: `matcha-koperta-dl-nadruk-wyrazy-uznania`
 *   (Dwie koperty DL Matcha z nadrukiem „Z wyrazami uznania” — zdjęcie dedykowane
 *   certyfikatom i listom gratulacyjnym).
 * - Kadr personalizacji imiennej `czarna-koperta-dl-personalizacja-imienna`
 *   (kaskada kopert z różnymi nazwiskami odbiorców).
 * - Próbki katalogowe odcieni akademickich z zaznaczonym polem nadruku.
 */

const DL = FORMAT_MAP.DL;
const K4 = FORMAT_MAP.K4;

const BASE_CONFIG: EnvelopeConfig = {
  format: 'DL',
  color: 'granatowy',
  quantity: 1,
  print: false,
  printFiles: [],
  personalization: false,
  shippingSpeed: 'standard',
};

const printed = calculatePrice({ ...BASE_CONFIG, print: true });
const printedNamed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Trzy kadry aranżacyjne prezentujące nadruk okolicznościowy, znak i personalizację. */
const CERTIFICATE_SHOTS = [
  shotByFile('matcha-koperta-dl-nadruk-wyrazy-uznania'),
  shotByFile('granatowa-koperta-dl-nadruk-logo-orkiestry'),
  shotByFile('czarna-koperta-dl-personalizacja-imienna'),
];

/**
 * Formaty certyfikatów i dyplomów oraz ich dopasowanie do koperty DL.
 * Wynik liczy `fitsInFormat()` z wymiarów katalogowych koperty.
 */
const CERTIFICATE_INSERTS: { label: string; width: number; height: number; note: string }[] = [
  {
    label: 'Certyfikat lub dyplom A4 złożony na trzy',
    width: 99,
    height: 210,
    note: 'Najczęstsza postać certyfikatu szkoleniowego, zaświadczenia MEN i dyplomu ukończenia kursu.',
  },
  {
    label: 'Karta certyfikatu DL (jedna trzecia A4 bez składania)',
    width: 99,
    height: 210,
    note: 'Sztywny karton lub papier ozdobny docięty do wymiaru DL, wsuwany na płasko bez zginania.',
  },
  {
    label: 'Zaświadczenie lub mini-dyplom A6',
    width: 105,
    height: 148,
    note: 'Karta formatu A6 — wchodzi swobodnie do koperty DL z dużym marginesem.',
  },
  {
    label: 'Certyfikat kwadratowy',
    width: 150,
    height: 150,
    note: 'Wymiar okolicznościowy — wymaga koperty kwadratowej K4 155 × 155 mm.',
  },
  {
    label: 'Dyplom A4 bez składania (na płasko)',
    width: 210,
    height: 297,
    note: 'Arkusz A4 na płasko — wymaga koperty C4, której nie ma w naszym katalogu.',
  },
];

/**
 * Kolory akademickie i szkoleniowe — rekomendacje dla organizatorów.
 */
const CERTIFICATE_COLORS: { colorId: string; heading: string; text: string }[] = [
  {
    colorId: 'granatowy',
    heading: 'Granatowy — tradycja uniwersytecka i oficjalna powaga',
    text: 'Granat to klasyczny odcień instytucji akademickich, szkół wyższych i izb branżowych. Nadruk białym, kremowym lub srebrnym kolorem oddaje powagę nadania uprawnień lub ukończenia studiów. Papier barwiony w masie zachowuje głębię koloru na zgięciach.',
  },
  {
    colorId: 'matcha',
    heading: 'Matcha — programy rozwojowe, coaching i wellbeing',
    text: 'Zgaszona, pastelowa zieleń szałwiowa dla akademii rozwoju osobistego, szkoleń trenerskich oraz programów zrównoważonego rozwoju. Z białym nadrukiem „Z wyrazami uznania” lub znakiem akademii tworzy świeży, nowoczesny certyfikat.',
  },
  {
    colorId: 'zloty',
    heading: 'Złoty metaliczny — dyplomy z wyróżnieniem i nagrody',
    text: 'Papier metaliczny odbijający światło. Idealny na certyfikaty mistrzowskie, dyplomy z wyróżnieniem (summa cum laude), laury konkursowe oraz jubileusze instytucji. Ciemny nadruk trzyma na nim znakomitą czytelność.',
  },
];

/**
 * Przykładowe nakłady pod grupy szkoleniowe i edycje kursów.
 * Jednostka: wielkość grupy szkoleniowej lub rocznika.
 */
const TRAINING_GROUPS: { label: string; quantity: number; note: string }[] = [
  {
    label: 'Kameralna grupa warsztatowa',
    quantity: 15,
    note: 'Intensywne szkolenie specjalistyczne, warsztat trenerski lub kadra zarządzająca.',
  },
  {
    label: 'Edycja kursu lub programu',
    quantity: 60,
    note: 'Semestralna edycja szkoły językowej, kurs IT lub certyfikacja zawodowa.',
  },
  {
    label: 'Rocznik akademicki lub konferencja',
    quantity: 250,
    note: 'Absolwenci wydziału, doroczna gala wręczenia certyfikatów lub zjazd branżowy.',
  },
];

const certTitle = 'Koperty na certyfikaty i dyplomy — z nadrukiem';
const certDescription = `Koperty na certyfikaty i dyplomy w formacie DL: elegancki papier, nadruk logo uczelni lub akademii od 10 szt. i nazwisko absolwenta. Na arkusz A4 złożony na 3.`;

export const metadata: Metadata = {
  title: certTitle,
  description: certDescription,
  keywords: [
    'koperty na certyfikaty',
    'koperty na dyplomy',
    'koperty na certyfikat a4',
    'koperty na zaświadczenia',
  ],
  alternates: { canonical: '/koperty-na-certyfikaty' },
  openGraph: {
    type: 'website',
    title: 'Koperty na certyfikaty i dyplomy — Envelopes',
    description: certDescription,
    url: '/koperty-na-certyfikaty',
    images: [
      ogImage(
        'koperty-na-certyfikaty',
        'Dwie koperty DL w kolorze Matcha z białym nadrukiem „Z wyrazami uznania” — koperty na certyfikaty i dyplomy'
      ),
    ],
  },
};

export default function CertificateEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-na-certyfikaty',
          type: 'ItemPage',
          name: certTitle,
          description: certDescription,
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-na-certyfikaty', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
          { name: 'Koperty na certyfikaty', url: '/koperty-na-certyfikaty' },
        ])}
      />

      {/* ── Hero — bezpośrednia odpowiedź i precyzyjne określenie formatu ── */}
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
              <span aria-hidden="true">›</span> Koperty na certyfikaty
            </nav>

            <span className="eyebrow">Uczelnie, akademie i firmy szkoleniowe</span>
            <h1>Koperty na certyfikaty i dyplomy</h1>
            <p className="hero-lead">
              Certyfikat ukończenia kursu, zaświadczenie MEN i dyplom szkoleniowy
              w formacie A4 składanym na trzy wręcza się w eleganckiej kopercie
              DL {DL.dimensions}. Drukujemy na niej znak uczelni, logo akademii
              oraz nazwisko absolwenta — w seriach już od {DEFAULT_PRICING.moqWithPrint} sztuk,
              więc zamówią Państwo koperty dokładnie pod pojedynczą grupę warsztatową.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print color="granatowy" className="btn btn-lg">
                Skonfiguruj koperty z logo uczelni
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Ważna uwaga formatowa: nasza koperta DL mieści arkusz A4 złożony na trzy lub kartę
              certyfikatu w formacie podłużnym. Dyplom A4 na sztywnym kartonie wręczany na płasko
              (bez zginania) wymaga koperty formatu C4, której nie oferujemy w naszym katalogu.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Arkusz A4 składany na 3',
                  note: 'Idealne dopasowanie pod standardowe zaświadczenia i certyfikaty',
                },
                {
                  title: `Nakład od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
                  note: 'Zamówienie pod jedną grupę szkoleniową, bez nadwyżek w szafie',
                },
                {
                  title: 'Imię i nazwisko absolwenta',
                  note: 'Personalizacja imienna z listy — bez pomyłek przy wręczaniu dyplomów',
                },
                {
                  title: 'Ekspres przed galą',
                  note: `Produkcja w ${DEFAULT_PRICING.leadDaysExpress} dni robocze, gdy certyfikacja dobiega końca`,
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

      {/* ── Co trafia do koperty — kontekst edukacyjny i szkoleniowy ── */}
      <section className="section section-surface" id="zawartosc">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowanie</span>
            <h2>Co uczelnia i centrum szkoleniowe wkłada do koperty</h2>
            <p>
              Zakończenie kursu, zdany egzamin zawodowy czy podsumowanie semestru to moment,
              który uczestnik zapamiętuje. Koperta z logo instytucji i nazwiskiem absolwenta
              nadaje dokumentowi rangę oficjalnego wyróżnienia.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Certyfikaty ukończenia szkoleń i kursów</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Szkolenia IT, kursy językowe, certyfikacje menedżerskie i medyczne. Arkusz A4
                złożony na trzy (lub sztywna karta 1/3 A4) mieści się w kopercie gładko,
                chroniąc podpis trenera i pieczęć jednostki certyfikującej.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Zaświadczenia o uprawnieniach i MEN</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Oficjalne zaświadczenia wydawane na podstawie przepisów oświatowych i branżowych.
                Biały lub granatowy papier barwiony w masie stanowi godną oprawę dla państwowych
                i branżowych formuł kwalifikacyjnych.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Listy gratulacyjne i podziękowania</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Wyróżnienia dla prelegentów konferencji naukowej, podziękowania dla mecenasów
                stypendiów oraz nagrody rektorskie. Nadruk dedykacji okolicznościowej
                zastępuje tradycyjne, bezosobowe koperty biurowe.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <ShowcaseGrid
              shots={CERTIFICATE_SHOTS}
              columns={3}
              spec="color"
            />
          </div>
        </div>
      </section>

      {/* ── Granica formatowa — precyzyjna tabela i rzetelne wyjaśnienie ── */}
      <section className="section" id="format">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dopasowanie formatu</span>
            <h2>Jaki certyfikat mieści się w kopercie DL</h2>
            <p>
              Koperta DL {DL.dimensions} została zaprojektowana pod arkusz A4 złożony na trzy.
              Poniższa tabela przedstawia najczęstsze formaty dokumentów wręczanych na szkoleniach
              i uczelniach — wynik dopasowania jest liczony bezpośrednio z wymiarów katalogowych.
            </p>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Formaty certyfikatów i dyplomów oraz ich dopasowanie do koperty DL
              </caption>
              <thead>
                <tr>
                  <th scope="col">Format dokumentu</th>
                  <th scope="col">Wymiary wkładki</th>
                  <th scope="col">Dopasowanie w kopercie DL</th>
                </tr>
              </thead>
              <tbody>
                {CERTIFICATE_INSERTS.map((insert) => {
                  const fit = fitsInFormat(insert, DL);
                  const fitsK4 = fitsInFormat(insert, K4).fits;
                  return (
                    <tr key={insert.label}>
                      <th scope="row">
                        {insert.label}
                        <span
                          className="small muted"
                          style={{ display: 'block', fontWeight: 400 }}
                        >
                          {insert.note}
                        </span>
                      </th>
                      <td className="mono-sm">
                        {formatMm(insert.width)} × {formatMm(insert.height)} mm
                      </td>
                      <td>
                        {fit.fits ? (
                          <strong style={{ color: 'var(--color-success, #2e7d32)' }}>
                            Mieści się idealnie
                          </strong>
                        ) : fitsK4 ? (
                          `Za szeroka o ${formatMm(Math.abs(fit.clearanceShort))} mm — wymaga formatu ${K4.id} ${K4.dimensions}, dziś ze statusem „${K4.badge}”`
                        ) : (
                          `Za szeroka o ${formatMm(Math.abs(fit.clearanceShort))} mm — wymaga koperty C4 (poza naszą ofertą)`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className="card"
            style={{
              marginTop: 'var(--space-5)',
              backgroundColor: 'var(--color-surface-sunken)',
              borderLeft: '4px solid var(--color-primary)',
            }}
          >
            <h3 style={{ fontSize: 18, marginTop: 0 }}>
              Kiedy koperta DL nie jest właściwym wyborem
            </h3>
            <p className="small" style={{ marginBottom: 'var(--space-2)' }}>
              Jeśli Państwa dyplom drukowany jest na sztywnym kartonie kredowym 300–350 g/m²
              w pełnym formacie A4 (210 × 297 mm) i ze względów prestiżowych lub formalnych nie może
              być zaginany — <strong>nie pomieści go żadna koperta z naszej oferty</strong>.
              Taki arkusz na płasko wymaga koperty formatu C4 (229 × 324 mm).
            </p>
            <p className="small" style={{ marginBottom: 0 }}>
              Piszemy o tym wprost, zamiast przyjmować zamówienie, którego produkt nie spełni.
              Jeśli jednak certyfikat jest przygotowany w formacie podłużnym DL (jedna trzecia A4)
              lub dopuszcza eleganckie złożenie na trzy — koperta DL sprawdzi się perfekcyjnie.
              W przypadku pytań o plany wprowadzenia formatów większych zapraszamy do kontaktu
              przez <Link href="/kontakt">formularz kontaktowy</Link>.
            </p>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Szczegółową analizę geometrii wkładki oraz zasady doboru formatu znajdą Państwo
            w przewodniku <Link href="/blog/jak-dobrac-format-koperty-do-wkladki">jak dobrać format koperty do wkładki</Link>.
            Specyfikację techniczną samego formatu opisuje strona <Link href="/koperty-dl">koperty DL</Link>.
          </p>
        </div>
      </section>

      {/* ── Personalizacja imienna: nazwisko absolwenta na kopercie ── */}
      <section className="section section-surface" id="personalizacja">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Personalizacja</span>
            <h2>Nazwisko absolwenta wydrukowane na kopercie</h2>
            <p>
              Podczas uroczystego wręczania certyfikatów każda sekunda ma znaczenie.
              Szukanie właściwego dyplomu w stosie teczek lub odręczne wypisywanie nazwisk
              przed galą bywa źródłem stresu i pomyłek.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'center' }}>
            <div>
              <p>
                W Envelopes wykonujemy <strong>personalizację imienną</strong>: każda koperta
                w zamówieniu otrzymuje inne imię i nazwisko absolwenta, pobrane bezpośrednio
                z przesłanego przez Państwa arkusza (Excel lub CSV).
              </p>
              <ul style={{ paddingLeft: 'var(--space-4)', lineHeight: 1.6 }}>
                <li>
                  <strong>Brak pomyłek przy wręczaniu:</strong> prowadzacy ceremonię bierze
                  z tacy kolejną kopertę z czytelnym nadrukiem nazwiska, bez zaglądania do środka.
                </li>
                <li>
                  <strong>Jednolity krój pisma:</strong> nazwisko absolwenta drukujemy tym samym
                  szlachetnym krojem pisma i w tym samym kolorze co logo uczelni lub akademii.
                </li>
                <li>
                  <strong>Wysyłka pocztowa lub kurierska:</strong> jeśli certyfikat jedzie pocztą,
                  na kopercie drukujemy pełny adres korespondencyjny uczestnika kursu.
                </li>
              </ul>
              <div className="row" style={{ marginTop: 'var(--space-5)' }}>
                <ConfigureLink
                  format="DL"
                  print
                  personalization
                  color="granatowy"
                  className="btn"
                >
                  Zamów koperty z nazwiskami absolwentów
                </ConfigureLink>
              </div>
            </div>

            <div className="card">
              <EnvelopePlaceholder
                format="DL"
                colorId="czarny"
                ratio="photo"
                hasPrint
                hideCaption
                sizes="(max-width: 900px) calc(100vw - 96px), 480px"
              />
              <strong style={{ display: 'block', fontSize: 14, marginTop: 'var(--space-3)' }}>
                Zmienne dane absolwenta na każdej kopercie
              </strong>
              <span className="small muted">
                Logo instytucji i nazwisko uczestnika drukujemy w jednym przebiegu maszyny —
                bez dodatkowej opłaty przygotowalni za każdy kolejny rekord z listy.
              </span>
            </div>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Jak przygotować plik z listą kursantów krok po kroku, wyjaśniamy w poradniku{' '}
            <Link href="/blog/adresowanie-kopert-z-arkusza-krok-po-kroku">
              adresowanie kopert z arkusza Excel
            </Link>
            . Ofertę zmiennego druku opisuje też filar{' '}
            <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
          </p>
        </div>
      </section>

      {/* ── Kolory akademickie i szkoleniowe ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolorystyka</span>
            <h2>Jaki odcień koperty wybrać na certyfikaty i dyplomy</h2>
            <p>
              Odcień koperty powinien harmonizować z charakterem programu certyfikacyjnego
              i identyfikacją wizualną uczelni. Wszystkie nasze koperty wykonane są ze szlachetnego
              papieru barwionego w masie — kolor nie ściera się i wygląda jednolicie na krawędziach.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {CERTIFICATE_COLORS.map((entry) => {
              const color = COLOR_MAP[entry.colorId];
              if (!color) return null;
              return (
                <div key={entry.colorId}>
                  <h3 style={{ fontSize: 19 }}>{entry.heading}</h3>
                  <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                    {entry.text}
                  </p>
                  <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                    <EnvelopePlaceholder
                      format="DL"
                      colorId={color.id}
                      ratio="photo"
                      hasPrint
                      hideCaption
                      sizes="(max-width: 900px) calc(100vw - 96px), 320px"
                    />
                    <strong
                      style={{ display: 'block', fontSize: 14, marginTop: 'var(--space-2)' }}
                    >
                      {color.name}
                    </strong>
                    <span className="small muted">
                      Kadr katalogowy z polem nadruku na logo uczelni lub jednostki certyfikującej.
                    </span>
                    {hasColorPage(color.id) && (
                      <p
                        className="small"
                        style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}
                      >
                        <Link href={colorPagePath(color.id)}>
                          Zobacz stronę koloru {color.name} →
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Jeśli certyfikat zawiera wielobarwny herb uczelni lub logotypy wielu partnerów
            akredytacyjnych, rekomendujemy odcienie jasne: <strong>Biały</strong>, <strong>Ecru</strong> lub{' '}
            <strong>Białą Perłową</strong>, na których wielokolorowy druk zachowuje pełną paletę barw
            oryginalnego pliku wektorowego. Wszystkie 19 odcieni prezentujemy w tabeli na{' '}
            <Link href="/#kolory">stronie głównej</Link>.
          </p>
        </div>
      </section>

      {/* ── Nakład i kalkulacja: zamówienie pod grupę szkoleniową ── */}
      <section className="section section-surface" id="naklad">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nakład i kalkulacja</span>
            <h2>Koperty zamawiane dokładnie pod liczbę absolwentów</h2>
            <p>
              Tradycyjne drukarnie wymagają zamawiania setek lub tysięcy sztuk, przez co po
              zakończeniu edycji kursu niewykorzystane koperty leżą w szafie. W Envelopes nadruk
              wykonujemy już <strong>od {DEFAULT_PRICING.moqWithPrint} sztuk</strong>, dzięki czemu
              każda edycja szkolenia może mieć świeże koperty z aktualnymi logotypami partnerów.
            </p>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Kalkulacja kosztów zamówienia kopert na certyfikaty dla różnych wielkości grup
              </caption>
              <thead>
                <tr>
                  <th scope="col">Wielkość grupy / edycji</th>
                  <th scope="col">Z nadrukiem logo</th>
                  <th scope="col">Z logo i nazwiskiem absolwenta</th>
                </tr>
              </thead>
              <tbody>
                {TRAINING_GROUPS.map((group) => {
                  const withPrint = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    quantity: group.quantity,
                  });
                  const withName = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    personalization: true,
                    quantity: group.quantity,
                  });

                  return (
                    <tr key={group.label}>
                      <th scope="row">
                        {group.label} ({group.quantity} szt.)
                        <span
                          className="small muted"
                          style={{ display: 'block', fontWeight: 400 }}
                        >
                          {group.note}
                        </span>
                      </th>
                      <td>
                        <strong>{formatPrice(withPrint.gross)}</strong>
                        <span
                          className="small muted"
                          style={{ display: 'block', fontWeight: 400 }}
                        >
                          {formatPrice(withPrint.unitTotal)} / szt. brutto
                        </span>
                      </td>
                      <td>
                        <strong>{formatPrice(withName.gross)}</strong>
                        <span
                          className="small muted"
                          style={{ display: 'block', fontWeight: 400 }}
                        >
                          {formatPrice(withName.unitTotal)} / szt. brutto
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Wszystkie podane kwoty są cenami brutto (zawierają 23% VAT) i obejmują kopertę oraz
            nadruk. Stały koszt bezpiecznej dostawy kurierskiej lub do Paczkomatu wynosi{' '}
            {formatPrice(DELIVERY_COST)} niezależnie od nakładu. Przy zamówieniach powyżej{' '}
            {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk zapraszamy do skorzystania
            z <Link href="/kontakt#wycena">indywidualnej wyceny hurtowej</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="granatowy" className="btn btn-lg">
              Przejdź do konfiguratora certyfikatów
            </ConfigureLink>
            <Link href="/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk" className="btn btn-secondary">
              Dlaczego drukujemy od 10 sztuk →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Podsumowanie i linkowanie wspierające ── */}
      <section className="section" id="powiazane">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Baza wiedzy</span>
            <h2>Poradniki i informacje dla organizatorów szkoleń</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 18 }}>Cennik i specyfikacja nadruku</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Kompletny cennik nadruku jedno- i dwustronnego, wymagania techniczne dla plików
                wektorowych oraz zasady bezpłatnej wizualizacji przed produkcją.
              </p>
              <Link href="/koperty-z-nadrukiem" className="small" style={{ fontWeight: 600 }}>
                Zobacz ofertę nadruku logo →
              </Link>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 18 }}>Papiery o gramaturze premium</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Koperty o podwyższonej gramaturze do 140 g/m² oraz papiery metaliczne, które
                podkreślają prestiż dyplomów na specjalne okazje.
              </p>
              <Link href="/koperty-premium" className="small" style={{ fontWeight: 600 }}>
                Odkryj koperty premium →
              </Link>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 18 }}>Ekspresowa realizacja</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Termin szkolenia zbliża się wielkimi krokami? Sprawdź, jak działa tryb ekspresowy
                i jak liczyć dni robocze od akceptacji projektu do doręczenia.
              </p>
              <Link
                href="/blog/szybka-realizacja-kopert-terminy-i-ekspres"
                className="small"
                style={{ fontWeight: 600 }}
              >
                Terminy i ekspres w Envelopes →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pływające CTA ── */}
      <StickyCta
        format="DL"
        print
        color="granatowy"
        label="Skonfiguruj koperty na certyfikaty"
      />
    </>
  );
}
