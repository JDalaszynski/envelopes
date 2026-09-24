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
 * Supporting LP klastra K1 pod filarem F1 — „koperty na zaproszenia firmowe"
 * (content-plan.md poz. 25, Tydzień 7).
 *
 * **Warunek brzegowy z planu: zaproszenia sugerują C6 i K4, a oba mają
 * w katalogu `disabled: true`.** Cała strona prowadzi więc do formatu DL —
 * zaproszenia składane, programy, karty wstępu — a formaty zapowiedziane
 * występują wyłącznie w wierszu tabeli ze statusem i w akapicie, który mówi
 * wprost, czego dziś nie zrobimy. Żaden przycisk na tej stronie nie prowadzi
 * do zamówienia koperty C6 ani K4 (pkt 4.2 briefu SEO/GEO).
 *
 * **Rozgraniczenie wobec poz. 41 i 42, które czekają w planie.** Fraza
 * `koperty na zaproszenia` należy do poz. 41 (wpis pod F3), a `koperty na
 * zaproszenia ślubne` do poz. 42. Granica przebiega po **pytaniu, na które
 * treść odpowiada**, a nie po temacie:
 *
 * - **Ta LP** odpowiada na pytanie „jak poprowadzić wysyłkę zaproszeń na
 *   wydarzenie firmowe": lista gości, rozkład fal kampanii, nadruk znaku
 *   klienta, nazwisko gościa, nakład z zapasem. Kupującym jest agencja albo
 *   dział marketingu, czyli podmiot, który robi to zawodowo i cyklicznie.
 * - **Poz. 41** odpowie na pytanie „którą kopertę dobrać do tego konkretnego
 *   zaproszenia": wymiar wkładki → format koperty. Bez agencji, bez kalendarza
 *   kampanii, bez listy gości.
 * - **Poz. 42** weźmie personę ślubną i jej słownik — para młoda, wedding
 *   planner, zaproszenie ślubne.
 *
 * Dlatego ta strona **nie ma w `keywords` frazy `koperty na zaproszenia`**
 * ani żadnej frazy ślubnej i nie zawiera tabeli „wkładka → format" w wersji
 * ogólnej: tabela tutaj wymienia wyłącznie materiały eventowe i liczy się
 * z wymiarów katalogowych przez `fitsInFormat()`.
 *
 * **Rozgraniczenie wobec poz. 16** (`szybka-realizacja-kopert-terminy-i-ekspres`).
 * Wpis jest właścicielem arytmetyki produkcyjnej — liczenia terminu wstecz
 * od daty wydarzenia przez kuriera, produkcję i akceptację wizualizacji.
 * Tabela `#kalendarz` na tej stronie liczy **fale kampanii zapraszającej**,
 * czyli odstępy między zaproszeniem a wydarzeniem, i kończy się odesłaniem
 * do wpisu w miejscu, w którym zaczyna się nasza produkcja.
 *
 * **Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 21, 22 i 23. Pytanie
 * „Czy nadruk jest dostępny na formatach C6 i K4?" ma właściciela
 * w `PRINT_FAQ_ITEMS` na F1, a „Czym różni się koperta DL od C6?"
 * w `DL_FAQ_ITEMS` na F3. `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Zdjęcia.** Kadru z logo agencji eventowej w repozytorium nie ma — tak jak
 * przy poz. 18, 21 i 22 nie podstawiamy pod branżę cudzego znaku. Strona
 * pokazuje trzy kadry, które przedstawiają dokładnie to, o czym mówi tekst:
 * nadruk słowa „Zaproszenie" na czerni, zaproszenie instytucji kultury na
 * granacie i adresowanie imienne krojem odręcznym. Nadruki na tych zdjęciach
 * są przykładowe i treść mówi to wprost (pkt 4.1 briefu).
 */

const DL = FORMAT_MAP.DL;
const K4 = FORMAT_MAP.K4;

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
const printedNamed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Trzy kadry, które strona faktycznie renderuje — te same pliki zgłasza sitemapa. */
const EVENT_SHOTS = [
  shotByFile('czarna-koperta-dl-nadruk-zaproszenie'),
  shotByFile('granatowa-koperta-dl-nadruk-logo-orkiestry'),
  shotByFile('niebieska-koperta-dl-personalizacja-odreczna'),
];

/**
 * Materiały, które agencja wkłada do koperty — a nie ogólna tabela wkładek.
 * Ta ostatnia stoi na `/koperty-dl` i tutaj jej nie powtarzamy (poz. 41 planu
 * dostanie z kolei odwrotne mapowanie: wkładka → format).
 *
 * Wymiary są wartościami normatywnymi (seria A, karta ID-1), a wynik
 * dopasowania liczy `fitsInFormat()` z wymiarów katalogowych koperty — zmiana
 * formatu w `catalog.ts` przepisuje tę tabelę, zamiast ją unieważnić.
 */
const EVENT_INSERTS: { label: string; width: number; height: number; note: string }[] = [
  {
    label: 'Zaproszenie składane do jednej trzeciej A4',
    width: 99,
    height: 210,
    note: 'Najczęstsza postać zaproszenia firmowego — arkusz A4 złożony na trzy.',
  },
  {
    label: 'Karta zaproszenia A6',
    width: 105,
    height: 148,
    note: 'Sztywna karta drukowana na kartonie, wsuwana bez składania.',
  },
  {
    label: 'Karta wstępu i identyfikator ID-1',
    width: 85.6,
    height: 54,
    note: 'Wejściówka w wymiarze karty płatniczej, dołączana do zaproszenia.',
  },
  {
    label: 'Program wydarzenia A5',
    width: 148,
    height: 210,
    note: 'Arkusz A4 złożony raz. Do koperty DL wchodzi dopiero po złożeniu na trzy.',
  },
  {
    label: 'Zaproszenie kwadratowe',
    width: 150,
    height: 150,
    note: 'Postać spotykana na galach i premierach — wymaga koperty kwadratowej.',
  },
];

/**
 * Fale kampanii zapraszającej. To **konwencja branżowa**, a nie parametr
 * naszej oferty — stąd widełki i zdanie o tym wprost nad tabelą. Terminu
 * produkcji ta tabela nie dotyczy: liczy odstęp między wysyłką a wydarzeniem,
 * a nie między zamówieniem a wysyłką (to należy do poz. 16 planu).
 */
const CAMPAIGN_WAVES: { stage: string; content: string; lead: string }[] = [
  {
    stage: 'Zapowiedź terminu',
    content:
      'Krótka informacja o dacie, wysyłana wtedy, gdy gość musi zarezerwować dzień z wyprzedzeniem albo zaplanować dojazd.',
    lead: '8–12 tygodni przed wydarzeniem',
  },
  {
    stage: 'Zaproszenie właściwe',
    content:
      'Zaproszenie z programem i prośbą o potwierdzenie obecności. To ta wysyłka decyduje o frekwencji i to na nią zamawia się koperty.',
    lead: '4–6 tygodni przed wydarzeniem',
  },
  {
    stage: 'Przypomnienie i potwierdzenia',
    content:
      'Domknięcie listy gości: przypomnienie dla milczących zaproszonych, potwierdzenia dla tych, którzy odpowiedzieli.',
    lead: '7–10 dni przed wydarzeniem',
  },
  {
    stage: 'Materiały na miejscu',
    content:
      'Program, karta wstępu i identyfikator wręczane przy rejestracji. Koperta z nazwiskiem gościa zastępuje wtedy listę przy wejściu.',
    lead: 'W dniu wydarzenia',
  },
  {
    stage: 'Podziękowanie i relacja',
    content:
      'Druga wysyłka do tej samej listy — podziękowanie dla gości, partnerów i prelegentów, czasem z voucherem albo zdjęciem z wydarzenia.',
    lead: 'Do dwóch tygodni po wydarzeniu',
  },
];

/**
 * Trzy odcienie — oś kolorystyczna tej strony. Dobór wynika z charakteru
 * wydarzenia, bo koperta na zaproszenie firmowe nosi zwykle znak klienta
 * agencji, a nie znak agencji. Wszystkie trzy mają opublikowaną stronę koloru,
 * więc sekcja linkuje w dół do treści, która opisuje papier szczegółowo.
 */
const EVENT_COLORS: { colorId: string; heading: string; text: string }[] = [
  {
    colorId: 'czarny',
    heading: 'Czarny — gala, premiera, wieczór',
    text: 'Czerń zapowiada wydarzenie wieczorowe, zanim gość przeczyta datę. Papier jest barwiony w masie, więc zagięta klapka i rozcięty bok zostają czarne — przy zaproszeniu, które gość trzyma w dłoni przez kilkanaście sekund, widać to od razu. Nadruk kładziemy jasnym kolorem: bielą, kremem albo złotem.',
  },
  {
    colorId: 'granatowy',
    heading: 'Granatowy — konferencja, koncert, jubileusz instytucji',
    text: 'Granat czyta się jako kolor instytucjonalny, więc sięgają po niego wydarzenia, które mają wyglądać poważnie, ale nie odświętnie: konferencje branżowe, koncerty, gale jubileuszowe uczelni i samorządu. Mieści się w większości identyfikacji korporacyjnych, więc nie kłóci się ze znakiem klienta.',
  },
  {
    colorId: 'zloty',
    heading: 'Złoty — jubileusz, gala charytatywna, wieczór branżowy',
    text: 'Papier metaliczny odbija światło pod kątem, więc koperta wygląda inaczej na stole niż na zdjęciu. To odcień pod wydarzenie, które samo w sobie jest świętem — okrągła rocznica firmy, gala z aukcją, wieczór nagród branżowych. Nadruk ciemny trzyma na nim pełną czytelność.',
  },
];

/**
 * Nakład liczony **listą gości**, a nie liczbą sztuk ani portfelem klientów.
 * To jednostka, w której planuje agencja — i to ona odróżnia tę tabelę od
 * tabeli nakładów na poz. 21 (portfel klientów) i poz. 22 (sztuki).
 */
const GUEST_LISTS: { label: string; quantity: number }[] = [
  { label: 'Kolacja branżowa albo śniadanie prasowe', quantity: 30 },
  { label: 'Konferencja lub premiera produktu', quantity: 120 },
  { label: 'Gala jubileuszowa', quantity: 300 },
];

const eventTitle = 'Koperty na zaproszenia firmowe z nadrukiem';
const eventDescription = `Koperty na zaproszenia firmowe w formacie DL: nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk i nazwisko gościa z listy. Zaproszenie i karta wstępu w jednej przesyłce.`;

export const metadata: Metadata = {
  title: eventTitle,
  description: eventDescription,
  keywords: [
    'koperty na zaproszenia firmowe',
    'koperty dla agencji eventowych',
    'koperty na zaproszenia na galę',
    'koperty z nadrukiem na event',
  ],
  alternates: { canonical: '/koperty-dla-agencji-eventowych' },
  openGraph: {
    type: 'website',
    title: 'Koperty na zaproszenia firmowe — Envelopes',
    description: eventDescription,
    url: '/koperty-dla-agencji-eventowych',
    images: [
      ogImage(
        'koperty-dla-agencji-eventowych',
        'Czarna koperta DL z białym nadrukiem słowa „Zaproszenie" pismem odręcznym — koperta na zaproszenie firmowe'
      ),
    ],
  },
};

export default function EventAgencyEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-agencji-eventowych',
          type: 'ItemPage',
          name: eventTitle,
          description: eventDescription,
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-dla-agencji-eventowych', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
          { name: 'Zaproszenia firmowe', url: '/koperty-dla-agencji-eventowych' },
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
              <span aria-hidden="true">›</span> Zaproszenia firmowe
            </nav>

            <span className="eyebrow">Eventy, PR i marketing</span>
            <h1>Koperty na zaproszenia firmowe</h1>
            <p className="hero-lead">
              Zaproszenie złożone na trzy, program wydarzenia i karta wstępu jadą do gościa
              w jednej kopercie DL {DL.dimensions}. Drukujemy na niej znak klienta albo logo agencji,
              a obok niego — nazwisko konkretnego zaproszonego. Nadruk zamawiają Państwo od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk, więc kolacja dla kilkunastu partnerów jest
              zamówieniem takim samym jak gala na trzysta osób.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print color="czarny" className="btn btn-lg">
                Wyceń koperty na zaproszenia
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację zaproszenia akceptują Państwo przed drukiem — także wtedy, gdy projekt
              zatwierdza jeszcze klient agencji. Termin realizacji liczymy dopiero od tej
              akceptacji, więc obieg projektu u klienta trzeba doliczyć do kalendarza, a nie
              odjąć od naszego terminu.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Zaproszenie i program razem',
                  note: 'Materiały złożone do jednej trzeciej A4 jadą w jednej przesyłce',
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z nadrukiem`,
                  note: 'Śniadanie prasowe dla kilkunastu osób to już zamówienie',
                },
                {
                  title: 'Nazwisko gościa z listy',
                  note: 'Każda koperta z serii dostaje inne dane, bez dopłaty za zmienny druk',
                },
                {
                  title: 'Ekspres, gdy data goni',
                  note: `Produkcja skrócona do ${DEFAULT_PRICING.leadDaysExpress} dni roboczych`,
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

      {/* ── Co wysyła agencja — język branży, nie język poligrafii ── */}
      <section className="section section-surface" id="materialy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Wysyłki</span>
            <h2>Co agencja eventowa wysyła w kopercie</h2>
            <p>
              Wydarzenie generuje nie jedną wysyłkę, tylko kilka — i trafiają one do tej samej
              listy odbiorców. Koperta z nadrukiem obsługuje wszystkie trzy, bo znak na niej
              zostaje ten sam, a zmienia się tylko zawartość.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Zaproszenie na galę, premierę i otwarcie</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Koperta jest pierwszym kontaktem gościa z wydarzeniem i zapowiada jego charakter,
                zanim ktokolwiek przeczyta datę. Zaproszenie wyjęte z białej koperty pocztowej
                zaczyna rozmowę od innego miejsca niż to samo zaproszenie wyjęte z czerni.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Program, karta wstępu i identyfikator</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Materiały wręczane przy rejestracji też mają nadawcę. Koperta z nazwiskiem gościa
                leży wtedy na stole recepcyjnym gotowa do wydania — zamiast listy, którą obsługa
                przegląda palcem przy kolejce przed salą.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Podziękowanie dla gości i partnerów</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Druga wysyłka idzie do tej samej listy po wydarzeniu: podziękowanie dla
                prelegentów, list do sponsora, voucher dla partnera. Projekt nadruku jest już
                zaakceptowany, więc to zwykle dodruk, a nie nowe zamówienie od zera.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <ShowcaseGrid shots={EVENT_SHOTS} columns={3} spec="color" />
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Nadruki na zdjęciach są projektami przykładowymi — nie publikujemy zamówień naszych
            klientów. Pierwszy kadr pokazuje, że nadruk nie musi być logo: jedno słowo traktujemy
            tak samo jak znak firmowy. Trzeci to personalizacja, czyli nadruk danych konkretnego
            gościa.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="czarny" className="btn">
              Wyceń koperty z nadrukiem na event
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, w wybranym odcieniu.
            </span>
          </div>
        </div>
      </section>

      {/* ── Format: co się mieści, a co wymaga formatu spoza sprzedaży ──
          Sekcja jest miejscem, w którym ograniczenie C6/K4 zostaje powiedziane
          wprost. Tabela liczy dopasowanie z wymiarów katalogowych, więc status
          nie może rozjechać się z ofertą. */}
      <section className="section" id="format">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Format</span>
            <h2>Jakie zaproszenie mieści się w kopercie DL</h2>
            <p>
              Koperta DL {DL.dimensions} przyjmuje zaproszenie złożone do jednej trzeciej arkusza
              A4, kartę A6 i wejściówkę w wymiarze karty płatniczej. Za szerokie są dwie postacie:
              program A5 złożony tylko raz i zaproszenie kwadratowe.
            </p>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Materiały eventowe i ich dopasowanie do koperty DL — wynik liczony z wymiarów
                katalogowych koperty
              </caption>
              <thead>
                <tr>
                  <th scope="col">Materiał</th>
                  <th scope="col">Wymiar</th>
                  <th scope="col">W kopercie DL</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_INSERTS.map((insert) => {
                  const fit = fitsInFormat(insert, DL);
                  const fitsK4 = fitsInFormat(insert, K4).fits;
                  return (
                    <tr key={insert.label}>
                      <th scope="row">
                        {insert.label}
                        <span className="small muted" style={{ display: 'block', fontWeight: 400 }}>
                          {insert.note}
                        </span>
                      </th>
                      <td className="mono-sm">
                        {formatMm(insert.width)} × {formatMm(insert.height)} mm
                      </td>
                      <td>
                        {fit.fits
                          ? 'Mieści się'
                          : fitsK4
                            ? `Za szeroka o ${formatMm(Math.abs(fit.clearanceShort))} mm — potrzebny format ${K4.id} ${K4.dimensions}, dziś ze statusem „${K4.badge}"`
                            : `Za szeroka o ${formatMm(Math.abs(fit.clearanceShort))} mm — do wysyłki trzeba ją złożyć`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-5)' }}>
            Zaproszenia kwadratowego nie wyślemy dziś w żadnej kopercie z naszego katalogu. Format{' '}
            {K4.id} {K4.dimensions} ma status „{K4.badge}" i nie da się go zamówić ani gładkiego,
            ani z nadrukiem — piszemy o tym, zamiast przyjmować zamówienie, którego nie
            zrealizujemy. Jeśli scenariusz wydarzenia jest już zamknięty na kwadracie, prosimy
            o wiadomość przez <Link href="/kontakt">formularz kontaktowy</Link>: odpowiemy, na
            jakim etapie jest uruchomienie tego formatu, i nie proponujemy w zamian niczego
            na siłę.
          </p>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Pełną tabelę dopasowań — od karty podarunkowej po arkusz A4 płasko — razem
            z porównaniem trzech formatów zebraliśmy na stronie{' '}
            <Link href="/koperty-dl">koperty DL</Link>. Ile arkuszy danej gramatury da się złożyć,
            żeby klapka zamknęła się bez naprężenia, rozpisuje poradnik{' '}
            <Link href="/blog/ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc">
              ile kartek mieści koperta DL
            </Link>
            . Jeśli zaproszenie ma wymiar spoza tej tabeli albo ozdoby, które zmieniają jego
            obrys, dobór koperty krok po kroku opisuje poradnik{' '}
            <Link href="/blog/koperty-na-zaproszenia-jak-dobrac-koperte-dl">
              koperty na zaproszenia
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Kalendarz kampanii — fale zapraszania, nie arytmetyka produkcji ──
          Granica wobec poz. 16: tam liczy się termin od zamówienia do wysyłki,
          tutaj odstęp od wysyłki do wydarzenia. */}
      <section className="section section-surface" id="kalendarz">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy wysłać</span>
            <h2>Kalendarz wysyłki zaproszeń na wydarzenie</h2>
            <p>
              Zaproszenie ma dwa terminy naraz: własny, wynikający z frekwencji, i nasz, wynikający
              z produkcji. Tabela niżej dotyczy pierwszego z nich — mówi, ile przed wydarzeniem
              koperta ma być u gościa.
            </p>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Widełki są konwencją przyjętą w organizacji wydarzeń, a nie regułą naszej pracowni.
            Krótsze okno wystarcza przy spotkaniu lokalnym, dłuższe bierze się wtedy, gdy gość musi
            zarezerwować przelot albo hotel.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Fale kampanii zapraszającej na wydarzenie firmowe i odstęp każdej z nich od daty
                wydarzenia
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fala</th>
                  <th scope="col">Co trafia do gościa</th>
                  <th scope="col">Kiedy</th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGN_WAVES.map((wave) => (
                  <tr key={wave.stage}>
                    <th scope="row">{wave.stage}</th>
                    <td>{wave.content}</td>
                    <td>{wave.lead}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Nasz termin zaczyna biec dopiero, gdy spełnione są oba warunki: wpłata jest
            zaksięgowana, a wizualizacja zaakceptowana. Do tego dochodzi droga kuriera, której nie
            wliczamy do terminu realizacji. Jak ustawić datę zamówienia wstecz — przez kuriera,
            produkcję i akceptację projektu — pokazuje krok po kroku poradnik o{' '}
            <Link href="/blog/szybka-realizacja-kopert-terminy-i-ekspres">
              terminach realizacji i ekspresie
            </Link>
            . Tryb ekspresowy skraca produkcję do {DEFAULT_PRICING.leadDaysExpress} dni roboczych
            za dopłatą {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="czarny" className="btn">
              Wyceń koperty pod datę wydarzenia
            </ConfigureLink>
            <span className="small muted">
              Konfigurator pokazuje termin realizacji przed złożeniem zamówienia.
            </span>
          </div>
        </div>
      </section>

      {/* ── Kolor: charakter wydarzenia, nie identyfikacja agencji ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pod zaproszenie firmowe</h2>
            <p>
              Koperta na zaproszenie nosi zwykle znak klienta, nie znak agencji — więc odcień
              dobiera się do charakteru wydarzenia, a nie do identyfikacji nadawcy. Odcień papieru
              nie zmienia kosztu nadruku, więc to wybór wyłącznie o tym, jak zaproszenie ma
              wyglądać.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {EVENT_COLORS.map((entry) => {
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
                    <strong style={{ display: 'block', fontSize: 14, marginTop: 'var(--space-2)' }}>
                      {color.name}
                    </strong>
                    <span className="small muted">
                      Kadr katalogowy z zaznaczonym polem nadruku — miejsce, w którym staje znak
                      nadawcy.
                    </span>
                    {hasColorPage(color.id) && (
                      <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
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
            Kiedy wydarzenie ma własną kolorystykę — marka klienta, scenografia, motyw przewodni —
            paleta idzie dalej niż te trzy odcienie. Cała tablica z gramaturami i wykończeniami
            stoi na <Link href="/#kolory">stronie głównej</Link>, a papiery o najwyższych
            gramaturach i z połyskiem zebraliśmy osobno na stronie{' '}
            <Link href="/koperty-premium">koperty premium</Link>.
          </p>
        </div>
      </section>

      {/* ── Nakład liczony listą gości — jednostka, w której planuje agencja ── */}
      <section className="section section-surface" id="naklad">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nakład i koszt</span>
            <h2>Ile kopert zamawia się na jedno wydarzenie</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Nakład liczy się tutaj listą gości, a nie liczbą wysyłek: jeden zaproszony to jedna
            koperta w fali właściwej. Do tej liczby dokłada się zapas — na gości dopisanych
            w ostatnim tygodniu, na komplet dla klienta i na egzemplarze do archiwum agencji.
            Dodruk tego samego projektu to osobne zamówienie, osobny termin i druga dostawa —
            zapas policzony od razu oszczędza jedno i drugie.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert dla trzech wielkości listy gości, w dwóch konfiguracjach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Lista gości</th>
                  <th scope="col">Koperty z nadrukiem</th>
                  <th scope="col">Koperty z nadrukiem i nazwiskiem gościa</th>
                </tr>
              </thead>
              <tbody>
                {GUEST_LISTS.map((event) => {
                  const withPrint = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    quantity: event.quantity,
                  });
                  const withName = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    personalization: true,
                    quantity: event.quantity,
                  });
                  return (
                    <tr key={event.label}>
                      <th scope="row">
                        {event.quantity} osób
                        <span className="small muted" style={{ display: 'block', fontWeight: 400 }}>
                          {event.label}
                        </span>
                      </th>
                      <td className="mono-sm">{formatPrice(withPrint.gross)}</td>
                      <td className="mono-sm">{formatPrice(withName.gross)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row">Cena za sztukę</th>
                  <td className="mono-sm">
                    <strong>{formatPrice(printed.unitTotal)}</strong> brutto
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(printedNamed.unitTotal)}</strong> brutto
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto
            i naliczany jest raz na całe zamówienie, niezależnie od liczby kopert. Cena za sztukę
            jest w każdym wierszu ta sama — rabatów ilościowych nie stosujemy, więc zapas nad listą
            gości nie zmienia stawki. Rozbicie ceny nadruku na składniki stoi na stronie{' '}
            <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>, a koszt całego
            zamówienia razem z dostawą — w poradniku{' '}
            <Link href="/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia">
              cena kopert z nadrukiem
            </Link>
            .
          </p>

          {/* Podrozdział wewnątrz sekcji — klasa `.subhead` jest związana
              ze stroną główną (`.home-doc`), więc kreska stoi tu inline,
              tak jak w pozostałych LP branżowych. */}
          <h3
            style={{
              fontSize: 21,
              marginTop: 'var(--space-7)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--color-line)',
            }}
          >
            Wydarzenia kameralne i nazwisko gościa na kopercie
          </h3>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
            <div>
              <p>
                Kolacja dla dwunastu partnerów, śniadanie prasowe dla piętnastu dziennikarzy,
                spotkanie zarządu z radą nadzorczą — te wydarzenia mają listy krótsze niż minimalne
                nakłady większości drukarni. U nas nadruk rusza od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, więc pojedyncze spotkanie nie musi czekać, aż uzbiera się większa akcja.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Skąd bierze się ten próg i co zrobić, gdy zaproszonych jest mniej niż dziesięciu,
                tłumaczy wpis{' '}
                <Link href="/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk">
                  dlaczego koperty z nadrukiem są od {DEFAULT_PRICING.moqWithPrint} sztuk
                </Link>
                .
              </p>
            </div>
            <div>
              <p>
                Nazwisko gościa drukujemy razem z resztą zamówienia — każda koperta z serii dostaje
                inne dane. Przy wysyłce pocztą na kopercie staje pełny adres, przy wręczaniu
                w recepcji wystarczy samo imię i nazwisko. To dwa różne zakresy personalizacji
                i dwa różne arkusze z danymi.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Specyfikację arkusza z listą odbiorców, walidację danych i różnicę między oboma
                zakresami opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
              </p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink
              format="DL"
              print
              personalization
              personalizationScope="imiona"
              color="czarny"
              className="btn"
            >
              Wyceń koperty z nazwiskiem gościa
            </ConfigureLink>
            <span className="small muted">
              Konfigurator otworzy się z nadrukiem i personalizacją imienną.
            </span>
          </div>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi na zaproszenia z nadrukiem?</h2>
              <p>
                Konfigurator otworzy się z formatem DL, kolorem Czarnym i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych od akceptacji
                wizualizacji.
              </p>
            </div>
            <ConfigureLink format="DL" print color="czarny" className="btn btn-lg">
              Wyceń koperty na zaproszenia
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print color="czarny" label="Zamów koperty na zaproszenia" />
    </>
  );
}
