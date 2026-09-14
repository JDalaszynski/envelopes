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
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import { breadcrumbJsonLd, ogImage, productId, webPageJsonLd } from '@/lib/seo';
import { PLAIN_ENVELOPE_SHOT } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K1 pod filarem F1 — „koperty dla biur rachunkowych"
 * (content-plan.md poz. 21, Tydzień 6).
 *
 * **Rozgraniczenie wobec F1.** Filar poświęca tej branży jeden akapit
 * w sekcji „Dla kogo" i celuje we frazę usługową `koperty z nadrukiem`.
 * Ta strona celuje wyłącznie we frazę branżową (`koperty firmowe z logo`
 * zostaje przy K1 — uwaga planu do poz. 21) i dokłada to, czego filar nie ma:
 * **rozkład roku obrotowego** jako podstawę planowania nakładu.
 *
 * **Rozgraniczenie wobec poz. 17 `/koperty-dla-kancelarii`** — ten sam filar,
 * ten sam szablon i ta sama materia (dokumenty na papierze A4). To jest jedyne
 * realne ryzyko kanibalizacji w tej pozycji, więc rozstrzygnięte jest na
 * czterech osiach naraz:
 *
 * 1. **Częstotliwość.** Kancelaria wysyła pod pojedynczą sprawę, do zmiennego
 *    kręgu adresatów. Biuro rachunkowe wysyła do **tego samego portfela
 *    klientów**, w powtarzalnych oknach kalendarza. Stąd cała oś tej strony:
 *    rozpoznawalność nadawcy wracającego co kwartał, nie powaga jednego pisma.
 * 2. **Kalendarz.** Poz. 17 nie ma sezonowości wcale. Tutaj jest ona spinaczem
 *    strony (sekcja `#kalendarz`) — pięć okien roku obrotowego, wprost z uwag
 *    planu do poz. 21 („zamknięcie roku, sprawozdania, korespondencja
 *    cykliczna").
 * 3. **Jednostka nakładu.** Poz. 17 nie ma tabeli kosztowej w ogóle
 *    (odsyła do F1). Tutaj tabela liczy partię od **liczby klientów w portfelu**,
 *    a nie od liczby sztuk — to jedyna jednostka, w której biuro planuje.
 * 4. **Kolor.** Poz. 17 jest właścicielem kierunku ciemnego i stonowanego
 *    (Granatowy, Czarny, Szarobrązowy). Tutaj wybór dzieje się **wewnątrz barw
 *    neutralnych** — Biały jako konwencja obiegu dokumentów przeciw Ecru jako
 *    wyjściu ze stosu białych kopert. Granica podana wprost, z odnośnikiem.
 *
 * **Adresowania serii nie powtarzamy.** Sekcja „Adresowanie wielu klientów
 * w jednym zamówieniu" należy do poz. 17 od 7 września 2026. Tutaj
 * personalizacja występuje wyłącznie jako kolumna tabeli kosztowej i jedno
 * zdanie odsyłające do F2 — inaczej obie strony miałyby ten sam rozdział.
 *
 * **Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 22 i 23. `PRINT_FAQ_ITEMS`
 * na F1 pokrywa już pytania o cenę, minimum nakładu, pliki i terminy.
 * `mainEntityId` wskazuje na węzeł `Product` filara zamiast tworzyć drugi.
 *
 * **Zdjęcia.** Kadru aranżacyjnego z logo biura rachunkowego w repozytorium
 * nie ma — trójkę kadrów branżowych (kancelaria, SPA, restauracja) zamknęła
 * poz. 17. Zamiast podstawiać cudzy kadr strona pokazuje `PLAIN_ENVELOPE_SHOT`
 * dokładnie tam, gdzie akapit mówi o jednolitej przedniej ściance, a dwa
 * rekomendowane odcienie — jako kadry katalogowe z zaznaczonym polem nadruku
 * (`hasPrint`), czyli zdjęcia, które nie obiecują cudzego logo (pkt 4.1
 * briefu SEO/GEO).
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

/**
 * Dwa odcienie neutralne — oś kolorystyczna tej strony.
 *
 * Baza wiedzy (pkt 2) nie przypisuje biurom rachunkowym żadnej barwy, więc
 * dobór wynika z sytuacji, a nie z listy: koperta wraca do tego samego
 * adresata kilka razy w roku, więc ma być rozpoznawalna, a nie efektowna.
 * Biały i Ecru to jedyne dwa odcienie w palecie, których strony kolorów
 * opisują w kartach „Dla kogo" właśnie ten obieg dokumentów.
 */
const NEUTRAL_COLORS: { colorId: string; heading: string; text: string }[] = [
  {
    colorId: 'bialy',
    heading: 'Biały — konwencja obiegu dokumentów',
    text: 'Biel jest w korespondencji firmowej konwencją, więc koperta nie odciąga uwagi od tego, co niesie. Ciemne logo biura ma na niej pełny kontrast. Od koperty urzędowej odróżnia ją brak okienka adresowego i brak szarego poddruku wewnątrz — te dwa szczegóły widać, zanim klient przeczyta nadawcę.',
  },
  {
    colorId: 'ecru',
    heading: 'Ecru — kiedy biel to za mało',
    text: 'Ecru jest ciepłą, złamaną bielą. W stosie białych kopert widać je od razu, a mimo to nie wygląda na przesyłkę reklamową. To niewielki ruch w stronę koloru, na który korespondencja finansowa pozwala bez zgrzytu — i wystarczający, żeby klient rozpoznał nadawcę z drugiego końca biurka.',
  },
];

/**
 * Kalendarz roku obrotowego — spinacz tej strony i oś, której poz. 17 nie ma
 * wcale. Terminy w drugiej kolumnie są **ustawowe i zewnętrzne** (informacja
 * PIT-11 dla podatnika, sporządzenie i zatwierdzenie sprawozdania za rok
 * kalendarzowy); trzecia kolumna wynika z naszego terminu realizacji podanego
 * nad tabelą. Dwóch rodzajów faktów nie mieszamy w jednej komórce.
 */
const FISCAL_WINDOWS: { period: string; mailing: string; orderBy: string }[] = [
  {
    period: 'Styczeń i luty',
    mailing:
      'Informacje PIT-11 dla pracowników klientów. Podatnik ma otrzymać dokument do końca lutego, a część klientów prosi o wersję papierową.',
    orderBy: 'Połowa stycznia — pierwsza partia roku, zwykle najliczniejsza',
  },
  {
    period: 'Marzec',
    mailing:
      'Sprawozdanie finansowe za zamknięty rok obrotowy. Dla roku kalendarzowego sporządza się je do końca marca, a do klienta jedzie komplet do podpisu.',
    orderBy: 'Luty, razem z partią na PIT-11 — jedno zamówienie zamiast dwóch',
  },
  {
    period: 'Kwiecień',
    mailing:
      'Rozliczenia roczne klientów prowadzących działalność i wspólników spółek osobowych.',
    orderBy: 'Marzec, jeśli partia lutowa nie została zamówiona z zapasem',
  },
  {
    period: 'Czerwiec',
    mailing:
      'Uchwały o zatwierdzeniu sprawozdania i podziale wyniku. Dla roku kalendarzowego termin zatwierdzenia mija z końcem czerwca.',
    orderBy: 'Maj — nakład najmniejszy w roku, bo dotyczy wyłącznie spółek',
  },
  {
    period: 'Listopad i grudzień',
    mailing:
      'Aneksy cenowe na kolejny rok, oferty dla nowych klientów i korespondencja świąteczna.',
    orderBy: 'Październik, przed szczytem przesyłek u przewoźników',
  },
];

/**
 * Nakład liczony od **liczby klientów w portfelu**, a nie od liczby sztuk.
 * To jedyna jednostka, w której biuro rachunkowe planuje wysyłkę — i jedyne,
 * co odróżnia tę tabelę od tabeli nakładów na poz. 22.
 */
const PORTFOLIO_SIZES = [20, 50, 120];

/** Liczba okien wysyłkowych z tabeli wyżej — podstawa rachunku rocznego. */
const WINDOWS_PER_YEAR = FISCAL_WINDOWS.length;

const accountingTitle = 'Koperty dla biur rachunkowych i audytorskich';
const accountingDescription = `Koperta dla biura rachunkowego bez okienka adresowego — kwoty ze sprawozdania nie są widoczne z zewnątrz. Nadruk logo biura od ${DEFAULT_PRICING.moqWithPrint} sztuk, wysyłka w ${DEFAULT_PRICING.leadDaysStandard} dni.`;

export const metadata: Metadata = {
  title: accountingTitle,
  description: accountingDescription,
  keywords: [
    'koperty dla biur rachunkowych',
    'koperty dla biura rachunkowego',
    'koperty dla biura księgowego',
    'koperty firmowe dla księgowości',
  ],
  alternates: { canonical: '/koperty-dla-biur-rachunkowych' },
  openGraph: {
    type: 'website',
    title: 'Koperty dla biur rachunkowych — Envelopes',
    description: accountingDescription,
    url: '/koperty-dla-biur-rachunkowych',
    images: [
      ogImage(
        'koperty-dla-biur-rachunkowych',
        'Białe koperty DL z zaznaczonym polem nadruku logo — przednia ścianka bez okienka adresowego, pod sprawozdanie finansowe'
      ),
    ],
  },
};

export default function AccountingEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-biur-rachunkowych',
          type: 'ItemPage',
          name: accountingTitle,
          description: accountingDescription,
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-dla-biur-rachunkowych', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
          { name: 'Biura rachunkowe', url: '/koperty-dla-biur-rachunkowych' },
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
              <span aria-hidden="true">›</span> Biura rachunkowe
            </nav>

            <span className="eyebrow">Księgowość i audyt</span>
            <h1>Koperty dla biur rachunkowych</h1>
            <p className="hero-lead">
              Biuro rachunkowe wysyła do tego samego klienta kilka razy w roku — informacje PIT-11
              w lutym, sprawozdanie w marcu, uchwały w czerwcu. Koperty Envelopes są bez okienka
              adresowego, więc kwoty i dane z dokumentu nie są widoczne z zewnątrz. Koperta z logo
              biura kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print color="bialy" className="btn btn-lg">
                Wyceń koperty dla biura rachunkowego
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo biura akceptują Państwo przed drukiem. Do każdego
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
                  note: 'Kwoty i dane z dokumentu nie są widoczne z zewnątrz',
                },
                {
                  title: 'Komplet A4 na trzy',
                  note: `Sprawozdanie z załącznikami wchodzi do koperty DL ${DL.dimensions}`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, bez czekania na produkcję`,
                },
                {
                  title: 'Biały albo Ecru',
                  note: 'Dwa odcienie neutralne, w tej samej cenie co reszta palety',
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

      {/* ── Po co koperta — kąt retencyjny, nie wizerunkowy ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Po co biuru rachunkowemu koperta z własnym logo</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Usługa, której klient nie widzi</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Księgowość dzieje się w plikach, w portalu i w skrzynce pocztowej. Koperta z logo
                biura bywa jedyną rzeczą, którą klient przez cały rok bierze od Państwa do ręki —
                i jedyną, na której Państwa znak w ogóle się pojawia.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Skrzynka klienta jest pełna kopert z okienkiem</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Korespondencja z urzędu, z zakładu ubezpieczeń i z banku przychodzi zwykle
                w kopertach z okienkiem adresowym, w tym samym zresztą okresie roku. Koperta bez
                okienka, w innym odcieniu i z logo biura, odróżnia się od nich, zanim klient ją
                otworzy.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Liczby zostają w środku</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Na sprawozdaniu stoi wynik roku, na informacji PIT-11 — wynagrodzenie konkretnej
                osoby. Przednia ścianka koperty jest jednolitą płaszczyzną papieru, więc
                przesunięcie wkładu w transporcie nie odsłania fragmentu dokumentu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kalendarz roku obrotowego — sezonowość z uwag poz. 21 planu ── */}
      <section className="section" id="kalendarz">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy zamówić</span>
            <h2>Kalendarz wysyłek w roku obrotowym</h2>
            <p>
              Biuro rachunkowe nie wysyła kopert wtedy, kiedy akurat wypadnie — wysyła je w tych
              samych oknach każdego roku. To rozkład, który da się zaplanować z góry, więc koperty
              zamawia się pod niego, a nie pod pojedynczą przesyłkę.
            </p>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperty z nadrukiem wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a do
            tego dochodzi czas przewozu kurierem. Dlatego trzecia kolumna cofa moment zamówienia
            o kilka tygodni względem wysyłki, a nie o kilka dni.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Pięć okien wysyłkowych w roku obrotowym biura rachunkowego i terminy zamówienia
                kopert przed każdym z nich
              </caption>
              <thead>
                <tr>
                  <th scope="col">Okres</th>
                  <th scope="col">Co wychodzi do klientów</th>
                  <th scope="col">Kiedy zamówić koperty</th>
                </tr>
              </thead>
              <tbody>
                {FISCAL_WINDOWS.map((window) => (
                  <tr key={window.period}>
                    <th scope="row">{window.period}</th>
                    <td>{window.mailing}</td>
                    <td>{window.orderBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Termin zaczyna biec dopiero, gdy spełnione są oba warunki: wpłata jest zaksięgowana,
            a wizualizacja zaakceptowana. Tryb ekspresowy skraca produkcję do{' '}
            {DEFAULT_PRICING.leadDaysExpress} dni roboczych za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Jak policzyć datę wysyłki
            wstecz od dnia, w którym koperty mają leżeć na biurku, rozpisaliśmy w poradniku o{' '}
            <Link href="/blog/szybka-realizacja-kopert-terminy-i-ekspres">
              terminach realizacji i ekspresie
            </Link>
            .
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="bialy" className="btn">
              Wyceń partię na najbliższe okno
            </ConfigureLink>
            <span className="small muted">
              Konfigurator przelicza cenę przy każdej zmianie ilości.
            </span>
          </div>
        </div>
      </section>

      {/* ── Co wchodzi do koperty — grubość wkładu, której poz. 17 nie dotyka ── */}
      <section className="section section-surface" id="zawartosc">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zawartość</span>
            <h2>Co biuro rachunkowe wkłada do koperty DL</h2>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <p>
                Komplet roczny to zwykle kilka arkuszy A4 naraz: sprawozdanie, informacja dodatkowa
                i pismo przewodnie. Złożone razem na trzy wchodzą do koperty DL {DL.dimensions} bez
                drugiego zagięcia, więc po otwarciu dokument leży płasko i nadaje się do podpisu.
              </p>
              <p>
                Granicą nie jest wymiar, tylko grubość pliku. Ile arkuszy danej gramatury da się
                złożyć, żeby klapka zamknęła się bez naprężenia, rozpisaliśmy w poradniku{' '}
                <Link href="/blog/ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc">
                  ile kartek mieści koperta DL
                </Link>
                . Pełna tabela dopasowań wkładek — od karty podarunkowej po arkusz A5 — stoi na
                stronie <Link href="/koperty-dl">koperty DL</Link>.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Cała oferta jest bez okienka adresowego i bez szarego poddruku wewnątrz. Kiedy brak
                okienka pomaga, a kiedy zmusza do adresowania całej partii, rozstrzyga wpis{' '}
                <Link href="/blog/koperty-bez-okienka-kiedy-je-wybrac">
                  koperty bez okienka — kiedy je wybrać
                </Link>
                .
              </p>
            </div>

            <div style={{ maxWidth: 420 }}>
              <ShowcaseGrid shots={[PLAIN_ENVELOPE_SHOT]} columns={3} spec="color" />
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                Kadr pokazuje budowę koperty DL: jednolitą przednią ściankę bez okienka i klapkę
                wzdłuż dłuższego boku. To ta ścianka decyduje, że z zewnątrz nie widać ani kwot, ani
                nazwiska z informacji podatkowej.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolor: dwa odcienie neutralne — rozgraniczenie wobec poz. 17 ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do biura rachunkowego</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór jest wyłącznie decyzją
              wizerunkową. Przy korespondencji, która wraca do tego samego klienta kilka razy
              w roku, wygrywa odcień neutralny — ma być rozpoznawalny, a nie efektowny.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {NEUTRAL_COLORS.map((entry) => {
              const color = COLOR_MAP[entry.colorId];
              if (!color) return null;
              return (
                <div key={entry.colorId}>
                  <h3 style={{ fontSize: 19 }}>{entry.heading}</h3>
                  <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                    {entry.text}
                  </p>
                  <div className="card" style={{ marginTop: 'var(--space-4)', maxWidth: 320 }}>
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
                      Kadr katalogowy z zaznaczonym polem nadruku — miejsce, w którym staje logo
                      biura.
                    </span>
                    {hasColorPage(color.id) && (
                      <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                        <Link href={colorPagePath(color.id)}>Zobacz stronę koloru {color.name} →</Link>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Kierunek ciemny — Granatowy, Czarny i Szarobrązowy — opisaliśmy osobno, przy
            korespondencji prawnej: tam koperta buduje powagę pojedynczego pisma, a nie
            rozpoznawalność nadawcy wracającego co kwartał. Typologię pism i dobór odcienia do niej
            zebraliśmy na stronie{' '}
            <Link href="/koperty-dla-kancelarii">koperty dla kancelarii</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="bialy" className="btn">
              Wyceń koperty z logo biura
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Nakład liczony portfelem klientów — jednostka, w której planuje biuro ── */}
      <section className="section section-surface" id="naklad">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nakład i koszt</span>
            <h2>Ile kopert zamawia biuro rachunkowe</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Nakład liczy się tutaj od liczby klientów, a nie od liczby pism: w jednym oknie
            wysyłkowym każdy klient dostaje zwykle jedną kopertę. Tabela pokazuje wartość takiej
            partii dla trzech wielkości portfela — cena za sztukę jest w każdej z nich identyczna,
            bo rabatów ilościowych nie stosujemy.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość jednej partii kopert dla trzech wielkości portfela klientów biura
                rachunkowego, w dwóch konfiguracjach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Portfel klientów</th>
                  <th scope="col">Koperty z logo biura</th>
                  <th scope="col">Koperty z logo i adresem klienta</th>
                </tr>
              </thead>
              <tbody>
                {PORTFOLIO_SIZES.map((quantity) => {
                  const withLogo = calculatePrice({ ...BASE_CONFIG, print: true, quantity });
                  const withAddress = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    personalization: true,
                    quantity,
                  });
                  return (
                    <tr key={quantity}>
                      <th scope="row">{quantity} klientów</th>
                      <td className="mono-sm">{formatPrice(withLogo.gross)}</td>
                      <td className="mono-sm">{formatPrice(withAddress.gross)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <th scope="row">Cena za sztukę</th>
                  <td className="mono-sm">
                    <strong>{formatPrice(printed.unitTotal)}</strong> brutto
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(printedAddressed.unitTotal)}</strong> brutto
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto
            i naliczany jest raz na całe zamówienie. Biuro z portfelem pięćdziesięciu klientów,
            wysyłające we wszystkich {WINDOWS_PER_YEAR} oknach z kalendarza wyżej, zużywa w roku
            około 250 kopert — to jedna partia z zapasem albo pięć dodruków tego samego projektu.
          </p>

          <p className="small muted" style={{ marginTop: 'var(--space-3)', maxWidth: '68ch' }}>
            Nadruk danych klienta na kopercie to usługa personalizacji: specyfikację arkusza
            z listą odbiorców i jego walidację opisaliśmy na stronie{' '}
            <Link href="/koperty-personalizowane">personalizowane koperty</Link>. Rozbicie ceny
            nadruku na składniki stoi na stronie{' '}
            <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>, a koszt całego
            zamówienia razem z dostawą — w poradniku{' '}
            <Link href="/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia">
              cena kopert z nadrukiem
            </Link>
            . Nawet biuro z kilkunastoma klientami zamawia partię bez zapasu na lata — skąd
            bierze się minimalny nakład przy nadruku, tłumaczymy we wpisie{' '}
            <Link href="/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk">
              koperty z nadrukiem od {DEFAULT_PRICING.moqWithPrint} sztuk
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi na koperty z logo biura?</h2>
              <p>
                Konfigurator otworzy się z formatem DL, kolorem Białym i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych.
              </p>
            </div>
            <ConfigureLink format="DL" print color="bialy" className="btn btn-lg">
              Wyceń koperty dla biura rachunkowego
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print color="bialy" label="Zamów koperty dla biura rachunkowego" />
    </>
  );
}
