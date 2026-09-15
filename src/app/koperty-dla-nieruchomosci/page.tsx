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
import { shotByFile } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Supporting LP klastra K1 pod filarem F1 — „koperty dla biur nieruchomości"
 * (content-plan.md poz. 26, Tydzień 7).
 *
 * **Fraza skorygowana 15 września 2026.** Plan zakładał `koperty na dokumenty
 * firmowe`. Tej frazy nie ma w `keywords.md` przy żadnej stronie, ale jej
 * intencja — „koperty, w których firma wysyła dokumenty" — jest intencją
 * filara F1 i strony `/koperty-dl`, a pod F1 stoją już dwie LP o korespondencji
 * dokumentowej (poz. 17 i poz. 21). Trzecia strona z frazą **rodzajową** byłaby
 * czwartym quasi-filarem, więc LP dostaje frazę branżową, dokładnie jak przy
 * korektach poz. 21, 24 i 28. Fraza rodzajowa zostaje przy filarze.
 *
 * **Rozgraniczenie wobec poz. 17 (`/koperty-dla-kancelarii`) i poz. 21
 * (`/koperty-dla-biur-rachunkowych`)** — ten sam filar, ten sam szablon i ta
 * sama materia (arkusze A4 w kopercie DL). To jedyne realne ryzyko
 * kanibalizacji w tej pozycji, więc rozstrzygnięte jest na czterech osiach:
 *
 * 1. **Pytanie strony.** Poz. 17 odpowiada „jakie pismo i jaka jego ranga",
 *    poz. 21 — „kiedy w roku i ile sztuk na portfel klientów", ta LP —
 *    „na jakim etapie transakcji koperta jest potrzebna i komu trafia do rąk".
 * 2. **Tryb przekazania.** Kancelaria **wysyła** (data stempla, doręczenie),
 *    biuro rachunkowe wysyła partiami, biuro nieruchomości w większości
 *    etapów **wręcza** kopertę do ręki — przy podpisaniu umowy, po wyjściu
 *    od notariusza, razem z kluczami.
 * 3. **Jednostka nakładu.** Sprawa (poz. 17, tabeli kosztowej nie ma wcale),
 *    portfel klientów (poz. 21), lista gości (poz. 25) — tutaj **transakcja
 *    z mnożnikiem**: jedna sprzedaż zużywa tyle kopert, ile ma etapów
 *    z nadrukiem. Tabela liczy właśnie ten mnożnik, a nie zakres usługi.
 * 4. **Kolor.** Poz. 17 jest właścicielem kierunku ciemnego i stonowanego
 *    (Granatowy, Czarny, Szarobrązowy), poz. 21 — neutralnego (Biały, Ecru).
 *    Tutaj wybór dzieje się wewnątrz **odcieni materiałowych**: Szarobrązowy,
 *    Szara i Jeansowy, czyli barwy, które wyglądają jak próbka wykończenia
 *    z inwestycji. Szarobrązowy występuje w obu zestawach, więc granica jest
 *    powiedziana wprost: kancelaria bierze go za gramaturę i powagę pisma,
 *    biuro nieruchomości — za zgodność z paletą materiałową projektu.
 *
 * **Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 21, 22, 23 i 25.
 * `PRINT_FAQ_ITEMS` na F1 pokrywa pytania o cenę, minimum nakładu, pliki
 * i terminy; `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Zdjęcia.** Kadru aranżacyjnego z logo biura nieruchomości w repozytorium
 * nie ma i nie podstawiamy pod branżę cudzego znaku (reguła od poz. 18).
 * Trzy rekomendowane odcienie stoją jako kadry katalogowe z zaznaczonym polem
 * nadruku, a przy sekcji o nazwisku nabywcy — realny kadr personalizacji
 * imiennej, czyli zdjęcie usługi, a nie branży.
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
const printedNamed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Kadr usługi, nie branży — trzy koperty, każda z innymi danymi odbiorcy. */
const NAMED_SHOT = shotByFile('czarna-koperta-dl-personalizacja-imienna');

/**
 * Ścieżka transakcji — spinacz tej strony i oś, której nie ma żadna
 * z sąsiednich LP pod F1. Poz. 21 układa wysyłki w **kalendarzu** (te same
 * okna każdego roku), tutaj kalendarza nie ma wcale: transakcja
 * nieruchomościowa nie ma sezonu, ma etapy, a każdy z nich wypada w innym
 * miesiącu dla każdego klienta.
 *
 * Trzecia kolumna mówi o **trybie przekazania**, bo to on odróżnia tę branżę
 * od kancelarii i biura rachunkowego: większość kopert nie jedzie pocztą,
 * tylko przechodzi z rąk do rąk.
 */
const TRANSACTION_STAGES: { stage: string; content: string; handover: string }[] = [
  {
    stage: 'Prezentacja lokalu i dzień otwarty',
    content:
      'Karta lokalu, rzut kondygnacji, warunki finansowania i wizytówka opiekuna transakcji.',
    handover: 'Wręczana na miejscu, przy wyjściu z mieszkania pokazowego',
  },
  {
    stage: 'Umowa rezerwacyjna i przedwstępna',
    content: 'Egzemplarz umowy dla klienta, harmonogram wpłat i potwierdzenie rezerwacji.',
    handover: 'Wręczana przy podpisaniu albo wysyłana do drugiej strony',
  },
  {
    stage: 'Kredyt i formalności',
    content: 'Zaświadczenia dla banku, odpisy, korespondencja ze wspólnotą i zarządcą.',
    handover: 'Wysyłana pocztą lub kurierem — jedyny etap, na którym dominuje wysyłka',
  },
  {
    stage: 'Akt notarialny',
    content: 'Wypis aktu, pismo przekazujące i instrukcja przepisania mediów.',
    handover: 'Wręczana po wyjściu z kancelarii notarialnej',
  },
  {
    stage: 'Odbiór lokalu i wydanie kluczy',
    content: 'Protokół zdawczo-odbiorczy, karty gwarancyjne i list gratulacyjny.',
    handover: 'Wręczana razem z kluczami, w obecności nabywcy',
  },
];

/**
 * Trzy odcienie materiałowe — oś kolorystyczna tej strony.
 *
 * Dobór wynika z tego, czym ta branża się posługuje na co dzień: wizualizacją
 * inwestycji, próbką wykończenia i fotografią architektury. Baza wiedzy
 * (pkt 2.6) nie przypisuje biurom nieruchomości barwy, ale trzy strony kolorów
 * opisują w kartach „Dla kogo" dokładnie ten kontekst — dokumentację dla
 * inwestorów, umowy i korespondencję do klienta prywatnego.
 */
const MATERIAL_COLORS: { colorId: string; heading: string; text: string }[] = [
  {
    colorId: 'taupe',
    heading: 'Szarobrązowy — najgrubszy papier w katalogu',
    text: `Ziemisty odcień na granicy szarości i beżu, w gramaturze ${COLOR_MAP['taupe']?.weight?.replace('g', ' g/m²')}. Komplet wręczony po akcie czuć w dłoni jako dokument, a nie jako wydruk z biurowej drukarki. Ta sama barwa wraca w materiałach wykończeniowych apartamentów, więc koperta nie kłóci się z wizualizacją inwestycji.`,
  },
  {
    colorId: 'szara',
    heading: 'Szara — beton i rysunek techniczny',
    text: 'Popielaty odcień bez domieszki ciepła. Biura sprzedaży sięgają po niego, gdy identyfikacja inwestycji jest minimalistyczna, a katalog opiera się na fotografii architektury zamiast na ornamencie. Logo w czerni albo w bieli czyta się na nim równie dobrze.',
  },
  {
    colorId: 'blekit-lupkowy',
    heading: 'Jeansowy — stalowy błękit',
    text: 'Zgaszony błękit z szarym podkładem: spokojniejszy od granatu, wyraźnie chłodniejszy od bieli. Pasuje do inwestycji nadmorskich i osiedli, które komunikują się kolorem, a nie detalem. W katalogu występuje pod nazwą Jeansowy, w zapytaniach klientów — jako błękit łupkowy.',
  },
];

/**
 * Nakład liczony **transakcjami**, nie sztukami — i z mnożnikiem, bo jedna
 * sprzedaż zużywa tyle kopert, ile ma etapów z nadrukiem. To jedyna
 * arytmetyka, której nie ma żadna z sąsiednich LP pod F1.
 */
const DEAL_VOLUMES: { deals: number; label: string }[] = [
  { deals: 20, label: 'Kwartał sprzedaży niewielkiego biura' },
  { deals: 50, label: 'Jeden etap inwestycji deweloperskiej' },
  { deals: 150, label: 'Inwestycja wieloetapowa' },
];

/**
 * Ile etapów z tabeli wyżej dostaje kopertę w wariancie rozbudowanym.
 * Słowo i liczba zmieniają się razem — liczba wchodzi do arytmetyki tabeli,
 * słowo do prozy i nagłówka kolumny, bo „3 koperty" czyta się jak faktura.
 */
const TOUCHPOINTS = 3;
const TOUCHPOINTS_WORD = 'trzy';

const realEstateTitle = 'Koperty dla biur nieruchomości i deweloperów';
const realEstateDescription = `Koperta z logo biura nieruchomości na komplet dokumentów wręczany przy umowie i po akcie notarialnym. Nadruk od ${DEFAULT_PRICING.moqWithPrint} sztuk, trzy odcienie materiałowe.`;

export const metadata: Metadata = {
  title: realEstateTitle,
  description: realEstateDescription,
  keywords: [
    'koperty dla biur nieruchomości',
    'koperty dla biura nieruchomości',
    'koperty dla agencji nieruchomości',
    'koperty dla dewelopera',
  ],
  alternates: { canonical: '/koperty-dla-nieruchomosci' },
  openGraph: {
    type: 'website',
    title: 'Koperty dla biur nieruchomości — Envelopes',
    description: realEstateDescription,
    url: '/koperty-dla-nieruchomosci',
    images: [
      ogImage(
        'koperty-dla-nieruchomosci',
        'Koperta DL w kolorze Szarobrązowym z zaznaczonym polem nadruku logo biura nieruchomości'
      ),
    ],
  },
};

export default function RealEstateEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-nieruchomosci',
          type: 'ItemPage',
          name: realEstateTitle,
          description: realEstateDescription,
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-dla-nieruchomosci', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
          { name: 'Biura nieruchomości', url: '/koperty-dla-nieruchomosci' },
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
              <span aria-hidden="true">›</span> Biura nieruchomości
            </nav>

            <span className="eyebrow">Nieruchomości i deweloperzy</span>
            <h1>Koperty dla biur nieruchomości</h1>
            <p className="hero-lead">
              Biuro nieruchomości najczęściej nie wysyła dokumentów — wręcza je do ręki. Teczkę
              ofertową na prezentacji lokalu, egzemplarz umowy przy podpisaniu, komplet po akcie
              notarialnym. Koperta z logo biura domyka transakcję, którą obie strony prowadziły
              miesiącami. Nadruk zamawiają Państwo od {DEFAULT_PRICING.moqWithPrint} sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print color="taupe" className="btn btn-lg">
                Wyceń koperty z logo biura
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo biura akceptują Państwo przed drukiem, a termin
              realizacji liczymy dopiero od tej akceptacji. Do każdego zamówienia wystawiamy
              fakturę VAT.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Wręczana, nie wysyłana',
                  note: 'Komplet zostaje w rękach nabywcy przy podpisaniu i po akcie',
                },
                {
                  title: 'Komplet A4 na trzy',
                  note: `Umowa z załącznikami wchodzi do koperty DL ${DL.dimensions}`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, bez czekania na produkcję`,
                },
                {
                  title: 'Trzy odcienie materiałowe',
                  note: 'Szarobrązowy, Szara i Jeansowy — w tej samej cenie co reszta palety',
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

      {/* ── Po co koperta — kąt „ostatnia scena transakcji", nie wizerunkowy ── */}
      <section className="section section-surface" id="przekazanie">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Po co biuru nieruchomości koperta z własnym logo</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Ostatnia scena transakcji</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Sprzedaż mieszkania ciągnie się miesiącami, a klient zapamiętuje jej koniec —
                moment, w którym dostaje dokumenty do ręki. Koperta rozstrzyga, czy komplet
                wygląda na domknięcie sprawy, czy na plik kartek wyjęty z drukarki.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Dokument zostaje w domu na lata</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Wypis aktu i protokół odbioru trafiają do domowego segregatora i wracają stamtąd
                przy każdej kolejnej sprawie: remoncie, rozliczeniu podatku, sprzedaży lokalu.
                Nazwa biura leży wtedy w tym samym miejscu co dokument — a rekomendacja bierze się
                właśnie z takich sytuacji.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Cena transakcji zostaje w środku</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                W komplecie stoi kwota, numer księgi wieczystej i dane nabywcy. Przednia ścianka
                koperty jest jednolitą płaszczyzną papieru, bez okienka adresowego, więc przy
                przekazywaniu z rąk do rąk nikt z boku nie czyta fragmentu dokumentu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ścieżka transakcji — oś tej strony. Poz. 21 ma kalendarz roku
          obrotowego, tutaj kalendarza nie ma: transakcja nie ma sezonu,
          ma etapy, a każdy wypada w innym miesiącu dla każdego klienta. ── */}
      <section className="section" id="etapy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Etapy</span>
            <h2>Na jakim etapie transakcji potrzebna jest koperta</h2>
            <p>
              Transakcja nieruchomościowa nie ma sezonu — ma etapy. Koperta pojawia się w kilku
              z nich, za każdym razem z tym samym nadrukiem i inną zawartością. Dlatego jeden
              zaakceptowany projekt obsługuje całą ścieżkę, od prezentacji lokalu po wydanie
              kluczy, i wraca przy kolejnych klientach jako dodruk.
            </p>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Pięć etapów transakcji nieruchomościowej, zawartość koperty na każdym z nich
                i sposób przekazania jej klientowi
              </caption>
              <thead>
                <tr>
                  <th scope="col">Etap</th>
                  <th scope="col">Co trafia do koperty</th>
                  <th scope="col">Jak trafia do klienta</th>
                </tr>
              </thead>
              <tbody>
                {TRANSACTION_STAGES.map((stage) => (
                  <tr key={stage.stage}>
                    <th scope="row">{stage.stage}</th>
                    <td>{stage.content}</td>
                    <td>{stage.handover}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="grid grid-2"
            style={{ gap: 'var(--space-6)', marginTop: 'var(--space-6)', alignItems: 'start' }}
          >
            <div>
              <h3 style={{ fontSize: 19 }}>Co wchodzi do koperty, a co wymaga teczki</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Arkusze A4 złożone razem na trzy wchodzą do koperty DL bez drugiego zagięcia, więc
                po wyjęciu dokument leży płasko i nadaje się do podpisu. Granicą nie jest wymiar,
                tylko grubość pliku.
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                Umowa deweloperska liczona w dziesiątkach stron nie jest dokumentem na kopertę —
                do niej biura używają teczki. Koperta niesie to, co nabywca dostaje osobno: wypis,
                protokół, pismo przekazujące i list gratulacyjny. Ile arkuszy danej gramatury da
                się złożyć, żeby klapka zamknęła się bez naprężenia, rozpisuje poradnik{' '}
                <Link href="/blog/ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc">
                  ile kartek mieści koperta DL
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 19 }}>Dwa obiegi w jednym zamówieniu</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Etap kredytowy jest jedynym, na którym dominuje wysyłka pocztowa — reszta ścieżki
                dzieje się przy stole. Ta sama koperta obsługuje oba obiegi, bo różni je tylko to,
                co drukujemy obok logo: adres odbiorcy albo samo nazwisko nabywcy.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Cała oferta jest bez okienka adresowego i bez szarego poddruku wewnątrz. Pełną
                tabelę dopasowań wkładek — od karty podarunkowej po arkusz A4 płasko — razem
                z porównaniem formatów zebraliśmy na stronie{' '}
                <Link href="/koperty-dl">koperty DL</Link>.
              </p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="taupe" className="btn">
              Wyceń koperty na komplet po akcie
            </ConfigureLink>
            <span className="small muted">
              Konfigurator przelicza cenę przy każdej zmianie ilości.
            </span>
          </div>
        </div>
      </section>

      {/* ── Kolor: odcienie materiałowe — rozgraniczenie wobec poz. 17 i 21 ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do biura nieruchomości</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór odcienia jest wyłącznie
              decyzją wizerunkową. W tej branży sprawdzają się barwy materiałowe — takie, które
              wyglądają jak próbka wykończenia z inwestycji, a nie jak papier z sekretariatu.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {MATERIAL_COLORS.map((entry) => {
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
                      Kadr katalogowy z zaznaczonym polem nadruku — miejsce, w którym staje logo
                      biura.
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
            Odcień dobierają tu Państwo do inwestycji, a nie do rangi dokumentu — i to odróżnia tę
            branżę od dwóch sąsiednich. Kancelaria wybiera barwę stonowaną, żeby zbudować powagę
            pojedynczego pisma: typologię pism zebraliśmy na stronie{' '}
            <Link href="/koperty-dla-kancelarii">koperty dla kancelarii</Link>. Biuro rachunkowe
            wybiera barwę neutralną, bo ta sama koperta wraca do tego samego klienta kilka razy
            w roku — o tym jest strona{' '}
            <Link href="/koperty-dla-biur-rachunkowych">koperty dla biur rachunkowych</Link>. Biura
            nieruchomości, które wolą wariant konwencjonalny, zostają przy odcieniu{' '}
            <Link href={colorPagePath('granatowy')}>granatowe koperty DL</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print color="taupe" className="btn">
              Wyceń koperty w odcieniu Szarobrązowym
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Nakład liczony transakcjami, z mnożnikiem etapów ── */}
      <section className="section" id="naklad">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nakład i koszt</span>
            <h2>Ile kopert zamawia biuro nieruchomości</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Nakład liczy się tutaj transakcjami, ale z mnożnikiem: jedna sprzedaż zużywa tyle
            kopert, ile etapów z tabeli wyżej ma dostać nadruk. Biuro, które wręcza kopertę
            wyłącznie po akcie notarialnym, planuje jedną sztukę na transakcję. Biuro, które robi
            to również przy prezentacji lokalu i przy wydaniu kluczy, planuje {TOUCHPOINTS_WORD}.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert z nadrukiem logo dla trzech skal sprzedaży, w wariancie
                jednej koperty na transakcję i trzech kopert na transakcję
              </caption>
              <thead>
                <tr>
                  <th scope="col">Skala sprzedaży</th>
                  <th scope="col">Jedna koperta na transakcję</th>
                  <th scope="col">Trzy koperty na transakcję</th>
                </tr>
              </thead>
              <tbody>
                {DEAL_VOLUMES.map((volume) => {
                  const single = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    quantity: volume.deals,
                  });
                  const full = calculatePrice({
                    ...BASE_CONFIG,
                    print: true,
                    quantity: volume.deals * TOUCHPOINTS,
                  });
                  return (
                    <tr key={volume.deals}>
                      <th scope="row">
                        {volume.deals} transakcji
                        <span className="small muted" style={{ display: 'block', fontWeight: 400 }}>
                          {volume.label}
                        </span>
                      </th>
                      <td className="mono-sm">
                        {formatPrice(single.gross)}
                        <span className="small muted" style={{ display: 'block' }}>
                          {volume.deals} szt.
                        </span>
                      </td>
                      <td className="mono-sm">
                        {formatPrice(full.gross)}
                        <span className="small muted" style={{ display: 'block' }}>
                          {volume.deals * TOUCHPOINTS} szt.
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto
            i naliczany jest raz na całe zamówienie. Cena za sztukę jest w obu kolumnach ta sama —{' '}
            {formatPrice(printed.unitTotal)} brutto — bo rabatów ilościowych nie stosujemy, więc
            zapas ponad plan sprzedaży nie zmienia stawki. Rozbicie tej ceny na składniki stoi na
            stronie <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>, a koszt
            całego zamówienia razem z dostawą — w poradniku{' '}
            <Link href="/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia">
              cena kopert z nadrukiem
            </Link>
            .
          </p>

          <p className="small muted" style={{ marginTop: 'var(--space-3)', maxWidth: '68ch' }}>
            Biuro sprzedające kilka lokali w kwartale mieści się w minimum bez zapasu na lata.
            Skąd bierze się próg {DEFAULT_PRICING.moqWithPrint} sztuk przy nadruku, tłumaczy wpis{' '}
            <Link href="/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk">
              dlaczego koperty z nadrukiem są od {DEFAULT_PRICING.moqWithPrint} sztuk
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
            Nazwisko nabywcy na kopercie
          </h3>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
            <div>
              <p>
                Koperta wręczana do ręki nie potrzebuje adresu — wystarczy imię i nazwisko nabywcy
                nad logo biura. Przy wysyłce kurierem drukujemy pełny adres pocztowy, więc
                przesyłka wychodzi gotowa do nadania. To dwa różne zakresy personalizacji i dwa
                różne arkusze z danymi.
              </p>
              <p className="mono-sm muted" style={{ margin: '0 0 var(--space-3)' }}>
                {formatPrice(printedNamed.unitTotal)} brutto/szt.
              </p>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Dane nabywcy drukujemy w tym samym przebiegu co logo, więc koperta nie wraca do
                maszyny po raz drugi. Specyfikację arkusza z listą odbiorców i jego walidację
                opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
              </p>
            </div>
            <div style={{ maxWidth: 380 }}>
              <ShowcaseGrid shots={[NAMED_SHOT]} columns={3} spec="color" />
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                Kadr pokazuje samą usługę, nie branżę: trzy koperty z jednej serii, każda z innymi
                danymi odbiorcy. Nadruki na naszych zdjęciach są projektami przykładowymi — nie
                publikujemy zamówień klientów.
              </p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink
              format="DL"
              print
              personalization
              personalizationScope="imiona"
              color="taupe"
              className="btn"
            >
              Wyceń koperty z nazwiskiem nabywcy
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
              <h2>Gotowi na koperty z logo biura nieruchomości?</h2>
              <p>
                Konfigurator otworzy się z formatem DL, odcieniem Szarobrązowym i włączonym
                nadrukiem — {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
                {DEFAULT_PRICING.moqWithPrint} sztuk, z wysyłką w{' '}
                {DEFAULT_PRICING.leadDaysStandard} dni roboczych od akceptacji wizualizacji.
              </p>
            </div>
            <ConfigureLink format="DL" print color="taupe" className="btn btn-lg">
              Wyceń koperty dla biura nieruchomości
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print color="taupe" label="Zamów koperty dla biura nieruchomości" />
    </>
  );
}
