import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { VOUCHER_COLOR_IDS, VOUCHER_SHOTS } from '@/lib/showcase';
import { getPost } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import { BULK_QUOTE_THRESHOLD, COLORS, COLOR_MAP, FORMAT_MAP } from '@/lib/catalog';
import { VOUCHER_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  ogImage,
  voucherEnvelopeProductJsonLd,
} from '@/lib/seo';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Filar klastra K7 — „koperty na vouchery" (keywords.md K7, content-plan.md poz. 4).
 *
 * Strona sprzedażowa dla firm, które sprzedają bon podarunkowy: salonów,
 * klinik, restauracji, hoteli, klubów i szkół warsztatowych. Oś treści to
 * jedno zdanie: voucher drukowany na jednej trzeciej arkusza A4 (99 × 210 mm)
 * wchodzi płasko do koperty DL — jedynego formatu dostępnego w sprzedaży.
 *
 * Cztery rozgraniczenia pilnowane świadomie (pkt 5.1 i 8 briefu SEO):
 *
 * 1. Wobec F1 `/koperty-z-nadrukiem`: cena nadruku **nie jest rozkładana na
 *    czynniki**. Tabela na tej stronie liczy trzy gotowe konfiguracje bonu
 *    w czterech nakładach — inna oś niż tabela składników ceny na F1.
 * 2. Wobec F3 `/koperty-dl`: zero tabeli dopasowań wkładek i zero sekcji
 *    o wymiarach formatu. Podajemy wymiar samego bonu i odsyłamy do filara.
 * 3. Wobec F2 `/koperty-personalizowane`: personalizacja to jedna karta
 *    z ceną jednostkową i linkiem, bez specyfikacji arkusza adresowego.
 * 4. Wobec przyszłych LP branżowych (poz. 18, 19, 22, 23) i wpisów doradczych
 *    (poz. 20, 24): filar mówi do wszystkich branż sprzedających bon i celuje
 *    we frazę usługową. Zawężenie do jednej branży i doradztwo „jaki kolor
 *    wybrać" należą do stron wspierających.
 *
 * Wszystkie liczby pochodzą z `pricing.ts` i `catalog.ts`.
 */

const DL = FORMAT_MAP.DL;

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
const printed = calculatePrice({ ...BASE_CONFIG, print: true });
const printedNamed = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });

/** Wymiar bonu drukowanego na jednej trzeciej arkusza A4 — 297 mm / 3 = 99 mm. */
const VOUCHER_INSERT = { width: 99, height: 210 };

/**
 * Trzy konfiguracje, w których realnie pakuje się bon. Tabela poniżej mnoży
 * je przez nakład — to inna oś niż tabela na F1, która rozkłada cenę
 * jednostkową na składniki. Tutaj pytanie brzmi „ile mnie wyjdzie seria
 * bonów", a nie „z czego składa się cena nadruku".
 */
const VOUCHER_SETUPS: { label: string; note: string; config: Partial<EnvelopeConfig> }[] = [
  {
    label: 'Koperta gładka',
    note: `Kolor marki bez druku, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
    config: {},
  },
  {
    label: 'Koperta z nadrukiem logo',
    note: `Logo salonu na przedniej ściance, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true },
  },
  {
    label: 'Koperta z logo i imieniem obdarowanego',
    note: `Nadruk i personalizacja w jednym przebiegu, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true, personalization: true },
  },
];

/** Nakłady dobrane pod serię bonów, nie pod wysyłkę korespondencji. */
const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 25, 50, 100];

/**
 * Sześć kolorów z realnym zdjęciem nadruku (`public/images/prints/`).
 * F1 pokazuje wszystkie dwanaście z podpisem gramaturowym — tutaj świadomie
 * węższy wybór i podpis cenowy. Sama lista `id` mieszka w `showcase.ts`,
 * bo korzysta z niej również sitemapa obrazów.
 */
const VOUCHER_COLORS = VOUCHER_COLOR_IDS.map((id) => COLOR_MAP[id]).filter(
  (color) => color?.printImages?.DL
);

const HOW_TO_STEPS = [
  {
    name: 'Ustalenie wymiaru bonu',
    text: `Punktem wyjścia jest wydruk, nie koperta. Bon zaprojektowany na jednej trzeciej arkusza A4 mierzy ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm i wchodzi do koperty DL ${DL.dimensions} płasko, bez zaginania. Karta plastikowa w standardzie ID-1 oraz bon w formacie A6 również się mieszczą.`,
  },
  {
    name: 'Konfiguracja kopert',
    text: `W konfiguratorze wybierają Państwo format DL, kolor spośród ${COLORS.length} odcieni i nakład. Koperty gładkie zamawiają Państwo od ${DEFAULT_PRICING.moqWithoutPrint} sztuki, a z nadrukiem logo od ${DEFAULT_PRICING.moqWithPrint} sztuk. Cena przelicza się przy każdej zmianie.`,
  },
  {
    name: 'Akceptacja wizualizacji',
    text: 'Nasz grafik przygotowuje wizualizację koperty z Państwa logo i przesyła ją e-mailem. Do druku kierujemy wyłącznie wersję zaakceptowaną — ten krok zdejmuje ryzyko wydrukowania błędu na całej serii bonów.',
  },
  {
    name: 'Wysyłka i pakowanie bonów',
    text: `Koperty z nadrukiem wysyłamy kurierem w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, gładkie w ${DEFAULT_PRICING.leadDaysPlain} dni robocze. Bony wkładają Państwo na miejscu, w momencie sprzedaży — dzięki temu ta sama partia kopert obsługuje bony o różnych kwotach.`,
  },
];

/**
 * Sekcja „Dla kogo" — obowiązkowa dla filara (pkt 5.1 briefu).
 * Dziesięć branż z profili 4, 5 i 12–22 bazy wiedzy. Filar mówi do wszystkich
 * naraz; zawężenie do jednej branży to zadanie LP branżowych z Fazy 2.
 */
const INDUSTRIES: { heading: string; text: string }[] = [
  {
    heading: 'Salony kosmetyczne i studia masażu',
    text: 'Bon na zabieg sprzedaje się w krótkich seriach i w rytmie okazji: Walentynki, Dzień Matki, Boże Narodzenie. Koperty zamawia się wtedy pod jedną akcję, a nie na zapas — i to wystarczy, żeby złożyć zamówienie.',
  },
  {
    heading: 'Salony SPA i kliniki medycyny estetycznej',
    text: 'Bon na zabieg kosztuje kilkaset złotych, więc opakowanie jest częścią tego, za co klient płaci. Sprawdzają się odcienie jasne — Biała Perłowa, Ecru, Biały — bo ciemne logo wychodzi na nich najczytelniej.',
  },
  {
    heading: 'Salony fryzjerskie i barber shopy',
    text: 'Bon wręczany jest przy stanowisku, do ręki, więc adresu nie potrzebuje — wystarczy logo salonu, a jeśli bon jest imienny, także imię obdarowanego. Koperta przyjmie zarówno wydruk, jak i kartę plastikową.',
  },
  {
    heading: 'Restauracje fine dining, winiarnie i kawiarnie',
    text: 'Voucher na kolację degustacyjną albo warsztaty winiarskie sprzedaje się sezonowo, ze szczytem w grudniu. Koperta w Ciemnozielonym albo Czarnym sprawia, że bon nie wygląda jak rachunek — a to on ma być pamiątką z wieczoru.',
  },
  {
    heading: 'Kluby fitness, studia jogi i pilatesu',
    text: 'Karnet VIP i pakiet treningów personalnych to produkty o wysokiej wartości, sprzedawane w recepcji. Koperta z logo klubu zamienia wydruk z drukarki biurowej w produkt, który da się położyć na ladzie obok kasy.',
  },
  {
    heading: 'Hotele, resorty i pensjonaty butikowe',
    text: 'Voucher pobytowy i bon na kolację sylwestrową sprzedają się i na miejscu, i wysyłkowo. Koperta obsługuje oba scenariusze: zaadresowana drukiem jedzie pocztą, gładka czeka w recepcji na gościa, który przyjdzie po nią sam.',
  },
  {
    heading: 'Salony tatuażu i studia piercingu',
    text: 'Bon na sesję to często pierwszy kontakt obdarowanego ze studiem. Tu wybierane są odcienie mocne i nietypowe — Czarny, Czerwony, Matcha — bo koperta ma zapowiadać estetykę miejsca, a nie ją stonować.',
  },
  {
    heading: 'Biura podróży i agencje turystyczne',
    text: 'Voucher wakacyjny i bon lotniczy wręcza się razem z dokumentami podróży. Koperta mieści cały komplet: bon, potwierdzenie rezerwacji złożone na trzy i wizytówkę doradcy — wszystko w jednym miejscu.',
  },
  {
    heading: 'Teatry, filharmonie i kina studyjne',
    text: 'Karta podarunkowa na spektakl sprzedawana jest w kasie i online, w seriach powtarzalnych przez cały sezon. Ten sam projekt wraca przy każdym dodruku, więc raz zatwierdzona wizualizacja służy przez cały rok.',
  },
  {
    heading: 'Szkoły gotowania, kursy i warsztaty hobbystyczne',
    text: `Voucher na kurs baristyczny, florystyczny czy ceramiczny kupowany jest jako prezent, więc jego opakowanie ogląda ktoś inny niż uczestnik. Przy naprawdę dużych seriach — powyżej ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk — ustalamy harmonogram dostaw indywidualnie.`,
  },
];

export const metadata: Metadata = {
  /* Tytuł bez liczby: „Koperty na vouchery i bony podarunkowe od 10 szt."
     ma z sufiksem marki 61 znaków, czyli o jeden za dużo. Wybraliśmy pełne
     dopasowanie frazy zamiast MOQ — liczby niesie description. */
  title: 'Koperty na vouchery i bony podarunkowe',
  description: `Koperty na vouchery i bony podarunkowe: bon ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm wchodzi do koperty DL płasko. ${COLORS.length} kolorów, nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk, ${formatPrice(printed.unitTotal)} brutto/szt.`,
  keywords: [
    'koperty na vouchery',
    'koperty do voucherów',
    'koperta do vouchera',
    'koperty na bony podarunkowe',
    'koperta na bon podarunkowy',
  ],
  alternates: { canonical: '/koperty-na-vouchery' },
  openGraph: {
    type: 'website',
    title: 'Koperty na vouchery i bony podarunkowe — Envelopes',
    description: `Koperta DL ${DL.dimensions} pod bon ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm: ${COLORS.length} kolorów, nadruk logo ${formatPrice(printed.unitTotal)} brutto za sztukę, od ${DEFAULT_PRICING.moqWithPrint} sztuk. Wysyłka w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, faktura VAT.`,
    url: '/koperty-na-vouchery',
    images: [
      ogImage(
        'koperty-na-vouchery',
        'Czerwona koperta DL z czarnym nadrukiem logo restauracji, przygotowana pod bon podarunkowy'
      ),
    ],
  },
};

export default function VoucherEnvelopesPage() {
  const filesPost = getPost('jak-przygotowac-pliki-do-druku-na-kopertach');
  const relatedPosts = [filesPost].filter((post): post is BlogPost => post !== undefined);

  return (
    <>
      <JsonLd data={voucherEnvelopeProductJsonLd()} />
      <JsonLd data={faqJsonLd(VOUCHER_FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak przygotować koperty na vouchery i bony podarunkowe',
          description: `Przygotowanie serii kopert pod bony podarunkowe w sklepie Envelopes — od ustalenia wymiaru bonu, przez konfigurację kopert DL ${DL.dimensions}, po wysyłkę kurierem.`,
          steps: HOW_TO_STEPS,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
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
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty na
              vouchery
            </nav>

            <span className="eyebrow">Bony i vouchery</span>
            <h1>Koperty na vouchery i bony podarunkowe</h1>
            <p className="hero-lead">
              Bon w kopercie ozdobnej przestaje wyglądać jak wydruk, a zaczyna jak prezent. Bon
              z jednej trzeciej arkusza A4 wchodzi do koperty DL płasko, bez zaginania — kod
              zostaje czytelny, a papier nie łamie się w torebce. Koperta z logo salonu kosztuje{' '}
              {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
              sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty na vouchery
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty akceptują Państwo przed drukiem — na całej serii bonów nie
              wyjdzie błąd, którego nie zobaczyliście wcześniej. Do każdego zamówienia wystawiamy
              fakturę VAT, a instytucjom publicznym i urzędom — z odroczonym terminem płatności
              14 dni.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: `Bon ${VOUCHER_INSERT.width} × ${VOUCHER_INSERT.height} mm`,
                  note: `Wchodzi do koperty DL ${DL.dimensions} płasko, bez zaginania`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk z logo`,
                  note: `Koperty gładkie od ${DEFAULT_PRICING.moqWithoutPrint} sztuki — bez opakowań zbiorczych`,
                },
                {
                  title: `${formatPrice(printed.unitTotal)} brutto/szt.`,
                  note: 'Cena jednostkowa stała — przy 10 i przy 1 000 sztuk taka sama',
                },
                {
                  title: `${COLORS.length} kolorów`,
                  note: 'Perła, metalik i papier eko w tej samej cenie co biel',
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

      {/* ── Dlaczego bon potrzebuje koperty — argument konwersyjny na faktach ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Dlaczego bon podarunkowy wręcza się w kopercie</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Bon podarunkowy jest wydrukiem na papierze, za który klient płaci pełną cenę usługi.
            Koperta jest jedyną częścią tej transakcji, którą obdarowany widzi przed poznaniem
            zawartości — i jedyną, która zostaje po wykorzystaniu bonu. To rozstrzyga trzy
            praktyczne kwestie naraz.
          </p>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon dociera nienaruszony</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Wydruk noszony w torebce albo wysłany pocztą bez opakowania zagina się na rogach,
                a wtedy kod przestaje się skanować. W kopercie bon leży płasko i nie wymaga
                składania.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Nazwa marki zostaje w domu</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Obdarowany widzi nazwę salonu, zanim otworzy kopertę. A po wykorzystaniu bonu
                koperta zostaje w domu — razem z logo, którego sam wydruk już tam nie zaniesie.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon wygląda na prezent</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Papier barwiony w masie odróżnia bon od kartki z drukarki biurowej. To różnica,
                którą widać i czuć w dłoni w momencie wręczania — czyli dokładnie wtedy, kiedy
                obdarowany wyrabia sobie zdanie o marce.
              </p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z logo salonu
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem — na całej serii nie wyjdzie błąd, którego
              nikt wcześniej nie widział.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt serii bonów — inna oś niż tabela składników ceny na F1 ── */}
      <section className="section" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje seria kopert na vouchery</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Bon pakuje się na jeden z trzech sposobów: w gładką kopertę w kolorze marki, w kopertę
            z logo salonu albo w kopertę z logo i imieniem obdarowanego. Tabela pokazuje, ile
            kosztuje gotowa seria w każdym z tych wariantów — cena za sztukę jest ta sama przy
            każdym nakładzie, więc mała akcja nie jest karana wyższą stawką.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert na vouchery w trzech konfiguracjach i czterech nakładach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nakład</th>
                  {VOUCHER_SETUPS.map((setup) => (
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
                    {VOUCHER_SETUPS.map((setup) => {
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
                  {VOUCHER_SETUPS.map((setup) => {
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
            Kwoty brutto, bez dostawy: kurier kosztuje {formatPrice(DELIVERY_COST)} brutto
            i naliczamy go raz na całe zamówienie, niezależnie od liczby kopert i liczby kolorów.
            Przy nakładzie {EXAMPLE_QUANTITIES[0]} sztuk z nadrukiem daje to{' '}
            {formatPrice(
              round2(
                calculatePrice({ ...BASE_CONFIG, print: true, quantity: EXAMPLE_QUANTITIES[0] })
                  .gross + DELIVERY_COST
              )
            )}{' '}
            brutto za komplet. Rozbicie samej ceny jednostkowej na składniki — kopertę i nadruk —
            opisaliśmy na stronie <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Sprawdź cenę swojego nakładu
            </ConfigureLink>
            <span className="small muted">
              Cena w konfiguratorze przelicza się przy każdej zmianie ilości i opcji.
            </span>
          </div>
        </div>
      </section>

      {/* ── Co pakujemy — wymiar bonu; tabela dopasowań wkładek należy do F3 ── */}
      <section className="section section-surface" id="wymiar-bonu">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dopasowanie</span>
            <h2>Jaki bon zmieści się w kopercie DL</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Do koperty DL {DL.dimensions} wchodzą płasko trzy najczęstsze postaci bonu: wydruk na
            jednej trzeciej arkusza A4 ({VOUCHER_INSERT.width} × {VOUCHER_INSERT.height} mm), bon
            w formacie A6 (105 × 148 mm) oraz karta plastikowa w standardzie ID-1 (85,6 × 54 mm).
            Żadna z nich nie wymaga składania. Bon zaprojektowany na całym arkuszu A4 nie mieści
            się w żadnym formacie z naszego katalogu — trzeba go przeprojektować albo złożyć.
          </p>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon DL</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                {VOUCHER_INSERT.width} × {VOUCHER_INSERT.height} mm
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                Arkusz A4 podzielony na trzy — z jednej kartki wychodzą trzy bony. Najtańszy
                w druku i najczęściej spotykany format bonu na usługę.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Bon A6</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                105 × 148 mm
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                Format pocztówkowy, wygodny przy bonach z grafiką na całej powierzchni. W kopercie
                DL zostaje zapas na krótszym boku, więc bon leży swobodnie.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Karta podarunkowa ID-1</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                85,6 × 54 mm
              </p>
              <p className="small" style={{ marginBottom: 0 }}>
                Karta plastikowa w wymiarze karty płatniczej. Do tej samej koperty wchodzi razem
                z kartką z życzeniami albo z regulaminem bonu.
              </p>
            </div>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Pełną tabelę dopasowań — dziesięć standardowych wkładek z wymiarami i zapasem
            w milimetrach — oraz porównanie formatu DL z C6 i K4 zebraliśmy na stronie{' '}
            <Link href="/koperty-dl">wymiary kopert DL</Link>. Formaty C6 i K4 mają dziś
            w katalogu status „Dostępne wkrótce" i nie można ich zamówić.
          </p>
        </div>
      </section>

      {/* ── Kolory z nadrukiem — realne zdjęcia z public/images/prints/ ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolory</span>
            <h2>W jakiej kopercie wręczyć bon</h2>
            <p>
              Kolor koperty warto dobrać do identyfikacji salonu — kosztuje tyle samo w każdym
              odcieniu, więc nie ma tu wyboru między marką a budżetem. O czytelności logo decyduje
              kontrast: na ciemnych kopertach drukujemy jasnym kolorem, na jasnych — ciemnym.
            </p>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
            {VOUCHER_COLORS.map((color) => (
              <ConfigureLink
                key={color.id}
                format="DL"
                color={color.id}
                print
                className="card"
                title={`Koperta DL ${color.name.toLowerCase()} z nadrukiem — otwórz konfigurator`}
              >
                <div style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                  <EnvelopePlaceholder
                    format="DL"
                    colorId={color.id}
                    ratio="photo"
                    hasPrint
                    hideCaption
                    size="sm"
                  />
                  <strong style={{ display: 'block', fontSize: 15, marginTop: 'var(--space-3)' }}>
                    Koperta DL {color.name} z logo
                  </strong>
                  <span className="small muted">
                    {formatPrice(printed.unitTotal)} brutto/szt. · papier{' '}
                    {color.weight?.replace('g', ' g/m²')}
                  </span>
                </div>
              </ConfigureLink>
            ))}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Pozostałe kolory z palety {COLORS.length} odcieni — w tym Srebrna Perłowa
            i Szarobrązowy o gramaturze {COLOR_MAP['taupe']?.weight?.replace('g', ' g/m²')} —
            również przyjmują nadruk i kosztują tyle samo; wybiorą je Państwo{' '}
            <Link href="/#kolory">w pełnej palecie kolorów</Link>.
          </p>

          {/* Cztery branże, które w tym klastrze sprzedają bon najczęściej —
              te same, które sekcja „Dla kogo" wymienia niżej. Kadry są wspólne
              z filarem K1 (`INDUSTRY_SHOTS`), więc alt i podpis nie mogą się
              rozjechać między stronami. */}
          <h3 style={{ marginTop: 'var(--space-7)' }}>Koperta na bon w czterech branżach</h3>
          <p style={{ maxWidth: '68ch' }}>
            Salon SPA, fryzjer, restauracja i studio tatuażu sprzedają bon w tym samym cyklu:
            szczyt w grudniu, druga fala przed Dniem Matki. Poniżej ta sama koperta DL{' '}
            {DL.dimensions} z nadrukiem logo w czterech odcieniach — każde zdjęcie otwiera
            konfigurator z tym kolorem i włączonym nadrukiem.
          </p>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <ShowcaseGrid shots={VOUCHER_SHOTS} columns={4} />
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Nazwy salonów na zdjęciach są przykładowe — pokazują, jak nadruk układa się na
            kopercie w danym kolorze. Na Państwa kopertach staje Państwa logo, zatwierdzone
            na wizualizacji przed drukiem.
          </p>
        </div>
      </section>

      {/* ── Usługi — po jednej karcie; cenniki rozłożone na czynniki są na F1 i F2 ── */}
      <section className="section section-surface" id="uslugi">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Usługi</span>
            <h2>Logo salonu i imię obdarowanego na kopercie</h2>
            <p>
              Wszystkie koperty Envelopes są bez okienka adresowego, więc cała przednia ścianka
              jest dostępna pod druk. Obie usługi wymagają zamówienia minimum{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk i można je połączyć w jednym przebiegu
              produkcyjnym.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk logo</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.print)} brutto/szt. · koperta z logo{' '}
                {formatPrice(printed.unitTotal)} brutto
              </p>
              <p className="small">
                Ten sam projekt na całej serii bonów: logo, nazwa salonu albo pełna grafika.
                Jedno zamówienie obsługuje bony o różnych kwotach, bo koperta nie niesie ceny.
                Listę przyjmowanych plików, marginesy i proces akceptacji opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" print className="btn btn-sm">
                  Wyceń koperty z logo
                </ConfigureLink>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Imię obdarowanego</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.personalization)} brutto/szt. · z logo{' '}
                {formatPrice(printedNamed.unitTotal)} brutto
              </p>
              <p className="small">
                Personalizacja drukuje na każdej kopercie inny tekst — imię, dedykację albo adres.
                Przy bonie wręczanym do ręki wystarcza samo imię; cena nie zależy od długości
                tekstu. Wymagania dla listy danych i proces opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" print personalization className="btn btn-sm">
                  Wyceń koperty z logo i imieniem
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
            <h2>Dla kogo są koperty na vouchery</h2>
            <p>
              Kopert na bony używa każda firma, która sprzedaje usługę w formie prezentu. Poniżej
              dziesięć branż, w których bon podarunkowy jest stałą pozycją w cenniku, a nie
              akcją jednorazową.
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
            <ConfigureLink format="DL" print className="btn">
              Zamów koperty na bony
            </ConfigureLink>
            <span className="small muted">
              Minimum {DEFAULT_PRICING.moqWithPrint} sztuk z nadrukiem. Faktura VAT do każdego
              zamówienia.
            </span>
          </div>
        </div>
      </section>

      {/* ── Terminy — sezonowość jest w tym klastrze realną barierą zakupu ── */}
      <section className="section" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Terminy i rozliczenie</span>
            <h2>Kiedy zamówić koperty przed sezonem na bony</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Termin liczymy wstecz od dnia, w którym bony mają trafić do sprzedaży. Koperty
            z nadrukiem wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie
            ekspresowym w {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Termin zaczyna biec dopiero
            wtedy, gdy spełnione są oba warunki: wpłata jest zaksięgowana, a wizualizacja
            zaakceptowana. Przy przelewie tradycyjnym prosimy doliczyć czas księgowania; przy
            fakturze z odroczonym terminem produkcja rusza bez oczekiwania na wpłatę.
          </p>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 0 }}>
                <caption className="sr-only">Czas realizacji według rodzaju zamówienia</caption>
                <thead>
                  <tr>
                    <th scope="col">Zamówienie</th>
                    <th scope="col">Czas realizacji</th>
                    <th scope="col">Dopłata</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Koperty gładkie na bony</td>
                    <td>{DEFAULT_PRICING.leadDaysPlain} dni robocze</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z logo — standard</td>
                    <td>{DEFAULT_PRICING.leadDaysStandard} dni roboczych</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z logo — ekspres</td>
                    <td>{DEFAULT_PRICING.leadDaysExpress} dni robocze</td>
                    <td className="mono-sm">{formatPrice(DEFAULT_PRICING.express)} brutto/szt.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Faktura VAT i odroczony termin</h3>
              <ul className="small" style={{ paddingLeft: 'var(--space-5)', lineHeight: 1.8 }}>
                <li>Fakturę VAT wystawiamy do każdego zamówienia, także bez numeru NIP.</li>
                <li>
                  Faktura z odroczonym terminem płatności 14 dni jest dostępna dla instytucji
                  publicznych i urzędów i nie wstrzymuje produkcji.
                </li>
                <li>
                  Koperty gładkie zamawiają Państwo od {DEFAULT_PRICING.moqWithoutPrint} sztuki,
                  więc zapas na sezon można uzupełniać partiami zamiast jednym dużym zakupem.
                </li>
                <li>
                  Powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk ustalamy harmonogram
                  dostaw indywidualnie. Cena jednostkowa pozostaje stała.
                </li>
              </ul>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <Link href="/kontakt#wycena" className="btn btn-secondary btn-sm">
                  Zapytaj o wycenę hurtową
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Proces (HowTo) — zaczyna się przed zamówieniem, od wymiaru bonu ── */}
      <section className="section section-surface" id="jak-zamawiac">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proces</span>
            <h2>Jak przygotować koperty na bony</h2>
            <p>
              Proces zaczyna się od wydruku bonu, nie od koperty — to wymiar bonu przesądza
              o formacie. Dalej są trzy kroki, z których jeden, akceptacja wizualizacji, dotyczy
              wyłącznie zamówień z nadrukiem.
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

          {filesPost && (
            <p className="small" style={{ marginTop: 'var(--space-5)' }}>
              Plik z logo salonu przygotowują Państwo raz i wykorzystują przy każdej kolejnej serii
              bonów. Wymagania dla pliku zebraliśmy w poradniku{' '}
              <Link href={`/blog/${filesPost.slug}`}>
                jak przygotować pliki do druku na kopertach
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* ── FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o koperty na vouchery</h2>
          </div>
          {VOUCHER_FAQ_ITEMS.map((item) => (
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

      {/* ── Treści wspierające filar ── */}
      {relatedPosts.length > 0 && (
        <section className="section" id="poradniki">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Poradniki</span>
              <h2>Zanim zamówią Państwo koperty na bony</h2>
            </div>
            <div className="grid grid-3">
              {relatedPosts.map((post) => (
                <article className="post-card" key={post.slug}>
                  <EnvelopePlaceholder
                    format={post.format}
                    colorId={post.colorId}
                    ratio="wide"
                    hideCaption
                    size="sm"
                  />
                  <div className="post-card-body">
                    <span className="badge">{post.category}</span>
                    <h3 style={{ fontSize: 18 }}>
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="small muted">{post.lead}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi zapakować bony przed sezonem?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem. Cenę widzą Państwo od
                razu, bez zapytania ofertowego — {formatPrice(printed.unitTotal)} brutto za sztukę,
                od {DEFAULT_PRICING.moqWithPrint} sztuk, z wysyłką w{' '}
                {DEFAULT_PRICING.leadDaysStandard} dni roboczych.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty na vouchery
            </ConfigureLink>
          </div>
        </div>
      </section>
    </>
  );
}
