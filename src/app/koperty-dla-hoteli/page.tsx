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
 * Supporting LP klastra K7 pod filarem F4 — „koperty firmowe dla hotelu"
 * (content-plan.md poz. 18, Tydzień 5).
 *
 * **Rozgraniczenie wobec F4.** Filar poświęca hotelom jeden akapit w sekcji
 * „Dla kogo" („voucher pobytowy i bon na kolację sylwestrową sprzedają się
 * i na miejscu, i wysyłkowo"). Ta strona celuje we frazę branżową i dokłada
 * scenariusz, którego filar nie ma wcale: **kartę powitalną z nazwiskiem
 * gościa**, czyli personalizację imienną w zakresie `imiona` — bez adresu,
 * z listy z systemu rezerwacji. Filar mówi wyłącznie o bonie, który ktoś
 * kupuje w prezencie; hotel zamawia obok bonu drugi obieg kopert, który
 * nigdy nie trafia na pocztę.
 *
 * **Rozgraniczenie wobec poz. 19 i 23** (SPA, restauracje — te same rodzic
 * i szablon). Tamte strony odpowiadają na pytanie „jaki kolor pod bon
 * i kiedy zamówić przed sezonem prezentowym". Ta zaczyna od typologii
 * sytuacji w obiekcie (pokój, recepcja, sala bankietowa, biuro sprzedaży),
 * ma trzy kierunki kolorystyczne zamiast dwóch i kalendarz, w którym obok
 * szczytów prezentowych stoi **start sezonu wysokiego** — zdarzenie, którego
 * salon i restauracja nie mają.
 *
 * **Rozgraniczenie wobec F2 `/koperty-personalizowane`.** Mechanizm arkusza
 * (kolumny, walidacja, formaty pliku) zostaje na filarze personalizacji —
 * tutaj wchodzi wyłącznie to, co w hotelu z tego mechanizmu wynika: lista
 * przychodzi z systemu rezerwacji, wystarczy samo nazwisko, a zamówienie
 * obejmuje jedną turnusową partię, nie roczny zapas.
 *
 * **Bez własnego `FAQPage`** — z tego samego powodu co poz. 19 i 23.
 * Pytania hotelarza pokrywają już dwa istniejące zestawy: `VOUCHER_FAQ_ITEMS`
 * na F4 (czy koperta musi mieć nadruk, czy da się dopisać imię obdarowanego)
 * i `PERSONALIZATION_FAQ_ITEMS` na F2 („Czy mogę zamówić koperty z samym
 * imieniem, bez adresu?" — odpowiedź wprost wymienia hotele). Trzeci blok
 * z tymi samymi pytaniami konkurowałby o ten sam wynik rozszerzony, więc
 * `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Zdjęcia.** Kadru aranżacyjnego z logo hotelu w repozytorium nie ma —
 * trójkę kadrów branżowych (kancelaria, SPA, restauracja) zamknęła poz. 17.
 * Jedyny realny kadr pasujący do treści to personalizacja imienna w kroju
 * odręcznym (`niebieska-koperta-dl-personalizacja-odreczna`) i stoi dokładnie
 * tam, gdzie jest o niej mowa — przy karcie powitalnej. Kolory rekomendowane
 * pokazujemy jako kadry katalogowe, bez podszywania się pod zdjęcie, którego
 * nie mamy (pkt 4.1 briefu SEO/GEO).
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

/** Wymiar bonu i karty powitalnej drukowanych na jednej trzeciej arkusza A4 — stała z F4. */
const VOUCHER_INSERT = { width: 99, height: 210 };

/** Kadr personalizacji imiennej — jedyny realny kadr pasujący do karty powitalnej. */
const WELCOME_SHOT = shotByFile('niebieska-koperta-dl-personalizacja-odreczna');

/**
 * Sytuacje, w których koperta pracuje w obiekcie hotelowym. Oś typologiczna
 * jak na `/koperty-dla-kancelarii` (tam pisma procesowe), nie oś cenowa —
 * karty mówią językiem hotelu i świadomie nie niosą parametrów (pkt 10.1.11).
 */
const HOTEL_SCENARIOS: { name: string; text: string }[] = [
  {
    name: 'Karta powitalna w pokoju',
    text: 'List od dyrektora obiektu leży na biurku, zanim gość wejdzie do pokoju. Koperta z jego nazwiskiem mówi, że pobyt przygotowano dla konkretnej osoby, a nie dla numeru rezerwacji — i jest pierwszym przedmiotem, który gość bierze do ręki.',
  },
  {
    name: 'Voucher pobytowy na prezent',
    text: 'Bon na weekend albo na pakiet ze śniadaniem kupuje ktoś inny niż osoba, która przyjedzie. Kupujący ogląda kopertę w recepcji i to ona decyduje, czy bon wygląda na prezent, czy na wydruk potwierdzenia rezerwacji.',
  },
  {
    name: 'Kolacja sylwestrowa i wieczór tematyczny',
    text: 'Zaproszenie na kolację galową rozchodzi się dwiema drogami naraz: część gości odbiera je przy zameldowaniu, część dostaje pocztą razem z programem wieczoru. Ta sama partia kopert obsługuje oba obiegi.',
  },
  {
    name: 'Zaproszenie na otwarcie sezonu',
    text: 'Degustacja w restauracji hotelowej, otwarcie strefy wellness, powitanie sezonu żeglarskiego. Zaproszenie wręczane stałym gościom i lokalnym partnerom jest komunikatem wizerunkowym obiektu, nie wysyłką masową.',
  },
  {
    name: 'Rachunek i pożegnanie gościa VIP',
    text: 'Zestawienie kosztów pobytu podane w kopercie przy wymeldowaniu kończy wizytę tak, jak ją zaczęła karta powitalna. Przednia ścianka bez okienka zakrywa kwoty przed osobami postronnymi w lobby.',
  },
  {
    name: 'Oferta dla klienta korporacyjnego',
    text: 'Umowa na konferencję, oferta grupowa dla biura podróży, podsumowanie eventu firmowego. Dział sprzedaży wysyła komplet dokumentów pocztą, więc koperta niesie logo obiektu i pełny adres odbiorcy.',
  },
];

/**
 * Trzy kierunki kolorystyczne — zamiast dwóch, które mają LP SPA i restauracji.
 * Powód jest branżowy, nie kompozycyjny: hotel zamawia koperty pod sytuacje
 * o różnej temperaturze (pokój, sala galowa, obiekt w naturze), a nie jedną
 * serię pod jeden bon. Dobór odcieni jest zgodny z tym, co o hotelach mówią
 * już F2 (Ecru, Biała Perłowa) i strony kolorów Złoty, Butelkowa Zieleń
 * i Jeansowy — jedna rekomendacja w całym serwisie, nie dwie sprzeczne.
 */
const COLOR_DIRECTIONS: { heading: string; text: string; colorIds: string[] }[] = [
  {
    heading: 'Karta powitalna — Ecru i Biała Perłowa',
    text: 'Do listu zostawianego w pokoju wybierane są odcienie jasne i ciepłe. Nazwisko gościa wydrukowane ciemnym kolorem czyta się na nich z odległości ręki, a koperta nie kontrastuje z wnętrzem pokoju tak ostro jak biel z ryzy papieru.',
    colorIds: ['ecru', 'biala-perlowa'],
  },
  {
    heading: 'Wieczór galowy i sylwester — Złoty',
    text: 'Papier metaliczny kosztuje tyle samo co odcień matowy, więc zaproszenie na kolację sylwestrową nie wymaga osobnego budżetu. Złoto działa w świetle sali bankietowej inaczej niż na biurku — połysk widać dopiero pod kątem, przy podnoszeniu koperty.',
    colorIds: ['zloty'],
  },
  {
    heading: 'Resort i obiekt nad morzem — Butelkowa Zieleń, Jeansowy',
    text: 'Obiekty w lesie, w górach i nad wodą budują wizerunek na kolorze otoczenia. Głęboka zieleń i przygaszony błękit trzymają ten sam ton co wnętrza z drewna i lnu, a jasny nadruk logo wychodzi na nich z pełnym kontrastem.',
    colorIds: ['ciemnozielony', 'blekit-lupkowy'],
  },
];

/**
 * Trzy konfiguracje, w jakich hotel zamawia koperty. Trzecia kolumna jest
 * inna niż na LP SPA i restauracji: tam nazwisko trafia na kopertę bonu
 * kupowanego w prezencie, tutaj — na kartę powitalną gościa, który już ma
 * rezerwację. Nakłady również są hotelowe: liczba pokoi, nie liczba bonów
 * sprzedanych przed Walentynkami.
 */
const HOTEL_SETUPS: { label: string; note: string; config: Partial<EnvelopeConfig> }[] = [
  {
    label: 'Koperta gładka',
    note: `Kolor obiektu bez druku, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
    config: {},
  },
  {
    label: 'Koperta z logo hotelu',
    note: `Logo na przedniej ściance, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true },
  },
  {
    label: 'Koperta z logo i nazwiskiem gościa',
    note: `Nadruk i personalizacja w jednym przebiegu, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true, personalization: true },
  },
];

/** Nakłady w skali obiektu: jedna grupa, jedno piętro, sezon w całym hotelu. */
const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 50, 150];

/**
 * Kalendarz hotelowy. Dwa pierwsze wiersze pokrywają sezon prezentowy, ale
 * trzeci i czwarty są specyficzne dla obiektu noclegowego: sylwester jest tu
 * wydarzeniem własnym, a nie okazją do kupienia bonu, a start sezonu wysokiego
 * to jedyny moment w roku, w którym koperty zamawia się na kilka miesięcy
 * z góry.
 */
const SEASONAL_OCCASIONS: { name: string; date: string; orderBy: string }[] = [
  {
    name: 'Vouchery pobytowe pod choinkę',
    date: 'grudzień',
    orderBy:
      'połowa listopada, żeby bony weszły do sprzedaży przed szczytem prezentowym, a nie w jego trakcie',
  },
  {
    name: 'Kolacja sylwestrowa',
    date: '31 grudnia',
    orderBy:
      'początek grudnia — zaproszenia rozchodzą się kilka tygodni wcześniej, a realizacja z nadrukiem wypada wtedy przed spiętrzeniem kurierów',
  },
  {
    name: 'Pobyt we dwoje na Walentynki',
    date: '14 lutego',
    orderBy: 'początek lutego, razem z uruchomieniem sprzedaży pakietu walentynkowego',
  },
  {
    name: 'Start sezonu wysokiego',
    date: 'maj–wrzesień',
    orderBy: 'kwiecień — jedno zamówienie kart powitalnych na całe lato zamiast dodruku w szczycie obłożenia',
  },
];

const hotelTitle = 'Koperty firmowe dla hotelu — karty powitalne';
const hotelDescription = `Koperty firmowe dla hotelu bez okienka adresowego: karta powitalna z imieniem gościa i voucher pobytowy. Nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk za ${formatPrice(printed.unitTotal)} brutto/szt.`;

export const metadata: Metadata = {
  title: hotelTitle,
  description: hotelDescription,
  keywords: [
    'koperty firmowe dla hotelu',
    'koperty dla hoteli',
    'koperty na karty powitalne',
    'koperty na vouchery pobytowe',
  ],
  alternates: { canonical: '/koperty-dla-hoteli' },
  openGraph: {
    type: 'website',
    title: 'Koperty firmowe dla hotelu — Envelopes',
    description: hotelDescription,
    url: '/koperty-dla-hoteli',
    images: [
      ogImage(
        'koperty-dla-hoteli',
        'Niebieska koperta DL z nadrukiem imienia i nazwiska w kroju odręcznym — karta powitalna dla gościa hotelu'
      ),
    ],
  },
};

export default function HotelEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-hoteli',
          type: 'ItemPage',
          name: hotelTitle,
          description: hotelDescription,
          mainEntityId: productId('/koperty-na-vouchery'),
          image: ogImage('koperty-dla-hoteli', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
          { name: 'Hotele', url: '/koperty-dla-hoteli' },
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
              <span aria-hidden="true">›</span> Hotele
            </nav>

            <span className="eyebrow">Hotelarstwo</span>
            <h1>Koperty firmowe dla hotelu</h1>
            <p className="hero-lead">
              Hotel zamawia koperty firmowe do dwóch różnych obiegów. Karta powitalna z nazwiskiem
              gościa czeka w pokoju i nigdy nie trafia na pocztę, a voucher pobytowy sprzedaje
              się w recepcji i wysyłkowo. Koperta DL {DL.dimensions} obsługuje oba: koperta z logo
              hotelu kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty dla hotelu
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo obiektu akceptują Państwo przed drukiem. Do każdego
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
                  title: 'Nazwisko gościa bez adresu',
                  note: 'Na kopercie staje samo imię i nazwisko z listy rezerwacji',
                },
                {
                  title: 'Bez okienka adresowego',
                  note: 'Bon i rachunek zostają zakryte do momentu otwarcia koperty',
                },
                {
                  title: `Karta ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm`,
                  note: `Wchodzi do koperty DL ${DL.dimensions} płasko, bez zaginania`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, bez czekania na produkcję`,
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

      {/* ── Typologia sytuacji w obiekcie — kąt, którego filar F4 nie ma ── */}
      <section className="section section-surface" id="zastosowania">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Gdzie koperta pracuje w hotelu</h2>
            <p>
              Sześć sytuacji, w których gość albo kontrahent dostaje od obiektu kopertę do ręki
              lub pocztą. Każda z nich ma innego odbiorcę i inny moment pobytu, ale wszystkie
              mieszczą się w jednym formacie.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {HOTEL_SCENARIOS.map((scenario) => (
              <div className="card" key={scenario.name}>
                <h3 style={{ fontSize: 19 }}>{scenario.name}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {scenario.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Karta powitalna — scenariusz wyłączny dla tej strony (poz. 18 planu) ── */}
      <section className="section" id="karta-powitalna">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Welcome letter</span>
            <h2>Karta powitalna z nazwiskiem gościa</h2>
            <p>
              Personalizacja drukuje na każdej kopercie inne dane. W hotelu wystarczy sama część
              osobowa: imię i nazwisko gościa, bez adresu — bo koperta czeka w pokoju, a nie jedzie
              pocztą.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <p className="small">
                Listę nazwisk eksportują Państwo z systemu rezerwacji i wgrywają arkuszem — ten sam
                plik, którym firmy przekazują listy wysyłkowe, tylko z krótszym kompletem kolumn.
                Wymagane pola, dopuszczalne formaty i walidację przed drukiem opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
              </p>
              <p className="small">
                Zdjęcie w tej sekcji pokazuje nadruk imienia i nazwiska w kroju odręcznym. To ten sam przebieg
                produkcyjny co nadruk logo, więc karta powitalna może nieść jedno i drugie naraz:
                znak obiektu w rogu i nazwisko gościa na środku ścianki.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-5)' }}>
                <ConfigureLink
                  format="DL"
                  print
                  personalization
                  personalizationScope="imiona"
                  className="btn"
                >
                  Wyceń karty powitalne z nazwiskiem
                </ConfigureLink>
                <span className="small muted">
                  Konfigurator otworzy się z zakresem „samo imię i nazwisko" — bez kolumn
                  adresowych, których hotel nie potrzebuje.
                </span>
              </div>
            </div>

            <div style={{ maxWidth: 420 }}>
              <ShowcaseGrid shots={[WELCOME_SHOT]} columns={3} spec="color" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolor: trzy kierunki zamiast dwóch — uzasadnienie przy COLOR_DIRECTIONS ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do hotelu</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór jest decyzją
              wizerunkową. Obiekt noclegowy ma trzy różne sytuacje do obsłużenia i w każdej
              sprawdza się inny odcień.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            {COLOR_DIRECTIONS.map((direction) => (
              <div key={direction.heading}>
                <h3 style={{ fontSize: 19 }}>{direction.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                  {direction.text}
                </p>
                <div
                  className="grid grid-2"
                  style={{ gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}
                >
                  {direction.colorIds.map((id) => {
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
            ))}
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z logo hotelu
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt — nakłady w skali obiektu, nie w skali serii bonów ── */}
      <section className="section" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje seria kopert dla hotelu</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Cena za sztukę nie zmienia się wraz z nakładem, więc pensjonat z dwunastoma pokojami
            płaci tę samą stawkę co resort z setką. Tabela pokazuje wartość zamówienia w trzech
            skalach: jedna grupa gości, jedno piętro i sezon w całym obiekcie.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert dla hotelu w trzech konfiguracjach i trzech nakładach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nakład</th>
                  {HOTEL_SETUPS.map((setup) => (
                    <th scope="col" key={setup.label}>
                      {setup.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_QUANTITIES.map((quantity) => (
                  <tr key={quantity}>
                    <th scope="row">{quantity.toLocaleString('pl-PL')} kopert</th>
                    {HOTEL_SETUPS.map((setup) => {
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
                  {HOTEL_SETUPS.map((setup) => {
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
            stronie <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>, a pełną
            tabelę konfiguracji bonu i pozostałe branże — na filarze{' '}
            <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>
        </div>
      </section>

      {/* ── Kalendarz obiektu noclegowego — sylwester i sezon wysoki zamiast samych okazji prezentowych ── */}
      <section className="section section-surface" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy zamówić</span>
            <h2>Kalendarz zamówień w obiekcie noclegowym</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Hotel kupuje koperty w dwóch rytmach: pod okazje prezentowe i pod własny kalendarz
            obłożenia. Termin liczymy wstecz od dnia, w którym koperty mają być na miejscu —
            z nadrukiem wysyłamy je w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie
            ekspresowym w {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Terminy zamówienia kopert przed czterema wydarzeniami w kalendarzu hotelu
              </caption>
              <thead>
                <tr>
                  <th scope="col">Okazja</th>
                  <th scope="col">Termin</th>
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
              <h2>Gotowi na koperty z logo obiektu?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych. Karty powitalne
                z logo i nazwiskiem gościa kosztują {formatPrice(printedNamed.unitTotal)} brutto za
                sztukę.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty dla hotelu
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print label="Zamów koperty dla hotelu" />
    </>
  );
}
