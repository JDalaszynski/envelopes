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
 * Supporting LP klastra K7 pod filarem F4 — „koperty na vouchery dla kliniki"
 * (content-plan.md poz. 22, Tydzień 6).
 *
 * **Rozgraniczenie wobec F4.** Filar mówi do dziesięciu branż naraz i podaje
 * jeden fakt o kolorze. Ta strona zawęża się do medycyny estetycznej
 * i stomatologii i dokłada to, czego filar nie ma: sytuację zakupową, w której
 * kupujący **nie zna procedury** (kupuje kwotę albo pakiet, a pierwszą wizytą
 * jest konsultacja), oraz drugi obieg kopert w gabinecie — plan leczenia,
 * kosztorys i zalecenia pozabiegowe wydawane pacjentowi przez cały rok.
 * Wymiar bonu i pełna tabela branż zostają na F4 — tutaj tylko odnośnik.
 *
 * **Rozgraniczenie wobec poz. 19 `/koperty-dla-salonow-spa`** (ten sam filar
 * i szablon, a w bazie wiedzy ten sam punkt 5). Tamta strona jest właścicielem
 * frazy `koperty na bony podarunkowe` i zestawia kierunek naturalny
 * (Szarobrązowy) z jasnym; jej kalendarz to trzy okazje prezentowe. Tutaj
 * cały wybór dzieje się **wewnątrz barw jasnych** — chłodna biel i błękit
 * pod stomatologię przeciw perle pod medycynę estetyczną — a kalendarz ma
 * wiersz, którego salon nie ma wcale: sezon ślubny i wakacyjny, przed którym
 * bon kupuje się wcześniej, bo zabiegi wykonuje się w serii. Inny jest też
 * rytm zamówień: salon zamawia pod akcję sezonową, klinika obok tego
 * utrzymuje stałe, niewielkie zużycie kopert gabinetowych.
 *
 * **Bez własnego `FAQPage`**, jak poz. 19, 23 i 18. `VOUCHER_FAQ_ITEMS` na F4
 * pokrywa już pytania o nadruk, o imię obdarowanego i o kilka kolorów w jednym
 * zamówieniu. Drugi blok z tymi samymi pytaniami konkurowałby o ten sam wynik
 * rozszerzony, więc `mainEntityId` wskazuje na węzeł `Product` filara.
 *
 * **Zdjęcia.** Kadru aranżacyjnego z logo kliniki w repozytorium nie ma —
 * trójkę kadrów branżowych (kancelaria, SPA, restauracja) zamknęła poz. 17.
 * Zamiast podstawiać cudzy kadr strona pokazuje `PLAIN_ENVELOPE_SHOT`
 * (Biała Perłowa, przód i klapka) dokładnie tam, gdzie jest mowa o braku
 * okienka adresowego, a cztery rekomendowane odcienie — jako kadry
 * katalogowe (pkt 4.1 briefu SEO/GEO).
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

/** Wymiar bonu drukowanego na jednej trzeciej arkusza A4 — ta sama stała co na F4. */
const VOUCHER_INSERT = { width: 99, height: 210 };

/**
 * Dwa kierunki kolorystyczne **wewnątrz barw jasnych** — to jest oś tej strony.
 * Baza wiedzy (pkt 5) poleca klinikom barwy jasne i „czyste", ale pod tym
 * jednym zdaniem stoją dwa różne gabinety: stomatologia buduje wizerunek na
 * chłodzie i sterylności, medycyna estetyczna — na papierze, który ogląda się
 * z bliska. LP SPA (poz. 19) zestawia jasne z naturalnym Szarobrązowym, więc
 * podział na dwie rodziny jasne jest tu rozróżnieniem, nie powtórzeniem.
 */
const COLOR_DIRECTIONS: { heading: string; text: string; colorIds: string[] }[] = [
  {
    heading: 'Stomatologia i gabinet zabiegowy — Biały, Błękitna',
    text: 'Chłodna biel i pastelowy błękit czyta się jako czystość i spokój — ten sam ton, co fartuch i wnętrze gabinetu. Oba odcienie przyjmują ciemny nadruk logo z pełnym kontrastem, więc znak placówki zostaje czytelny także na bonie odłożonym do szuflady na kilka miesięcy.',
    colorIds: ['bialy', 'jasnoniebieska'],
  },
  {
    heading: 'Medycyna estetyczna — Biała Perłowa, Srebrna Perłowa',
    text: 'Bon wręcza się do ręki, więc kopertę ogląda się z odległości kilkudziesięciu centymetrów — a z tej odległości widać różnicę między papierem matowym a perłowym. Poświata odróżnia bon od wydruku z drukarki, nie schodząc przy tym w złoto, które w gabinecie brzmiałoby świątecznie.',
    colorIds: ['biala-perlowa', 'srebrna-perlowa'],
  },
];

/**
 * Trzy konfiguracje, w jakich klinika zamawia koperty — ta sama oś co
 * `VOUCHER_SETUPS` na F4. Trzecia kolumna mówi o imieniu obdarowanego,
 * nie o nazwisku pacjenta: dane pacjenta nie trafiają na kopertę.
 */
const CLINIC_SETUPS: { label: string; note: string; config: Partial<EnvelopeConfig> }[] = [
  {
    label: 'Koperta gładka',
    note: `Kolor placówki bez druku, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
    config: {},
  },
  {
    label: 'Koperta z logo kliniki',
    note: `Logo na przedniej ściance, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true },
  },
  {
    label: 'Koperta z logo i imieniem obdarowanego',
    note: `Nadruk i personalizacja w jednym przebiegu, od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
    config: { print: true, personalization: true },
  },
];

/**
 * Nakłady w skali gabinetu: jedna akcja prezentowa, kwartał i rok. Wyżej niż
 * na LP SPA (10 / 20 / 50), bo klinika kupuje koperty na dwa obiegi naraz —
 * bony sezonowe i koperty gabinetowe zużywane przez cały rok.
 */
const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 30, 100];

/**
 * Kalendarz kliniki. Dwa pierwsze wiersze pokrywają sezon prezentowy, ale
 * trzeci jest specyficzny dla gabinetu zabiegowego: zabiegi wykonuje się
 * w serii rozłożonej na tygodnie, więc bon „na lato" i „na wesele" sprzedaje
 * się wiosną, a nie w czerwcu.
 */
const SEASONAL_OCCASIONS: { name: string; date: string; orderBy: string }[] = [
  {
    name: 'Walentynki',
    date: '14 lutego',
    orderBy: `początek lutego, żeby ${DEFAULT_PRICING.leadDaysStandard} dni robocze realizacji z nadrukiem zmieściło się przed świętem`,
  },
  {
    name: 'Dzień Matki',
    date: '26 maja',
    orderBy: 'początek maja — bon na pakiet pielęgnacyjny jest wtedy najczęściej kupowanym prezentem w gabinecie',
  },
  {
    name: 'Sezon ślubny i wakacyjny',
    date: 'maj–sierpień',
    orderBy:
      'kwiecień, bo bon na serię zabiegów kupuje się z wyprzedzeniem — efekt ma być gotowy na termin, a nie dopiero zaczynać się w jego dniu',
  },
  {
    name: 'Boże Narodzenie',
    date: 'grudzień',
    orderBy: 'połowa listopada, żeby bony weszły do sprzedaży przed szczytem prezentowym, a nie w jego trakcie',
  },
];

const clinicTitle = 'Koperty na vouchery dla kliniki i gabinetu';
const clinicDescription = `Koperta na voucher dla kliniki bez okienka adresowego — nazwa zabiegu i kwota pakietu zostają zakryte. Nadruk logo od ${DEFAULT_PRICING.moqWithPrint} sztuk za ${formatPrice(printed.unitTotal)} brutto/szt.`;

export const metadata: Metadata = {
  title: clinicTitle,
  description: clinicDescription,
  keywords: [
    'koperty na vouchery dla kliniki',
    'koperty dla klinik',
    'koperty firmowe dla kliniki',
    'koperty dla gabinetów stomatologicznych',
  ],
  alternates: { canonical: '/koperty-dla-klinik' },
  openGraph: {
    type: 'website',
    title: 'Koperty na vouchery dla kliniki — Envelopes',
    description: clinicDescription,
    url: '/koperty-dla-klinik',
    images: [
      ogImage(
        'koperty-dla-klinik',
        'Koperty DL Biała Perłowa bez nadruku — jednolita przednia ścianka bez okienka adresowego, pod bon z kliniki'
      ),
    ],
  },
};

export default function ClinicEnvelopesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-dla-klinik',
          type: 'ItemPage',
          name: clinicTitle,
          description: clinicDescription,
          mainEntityId: productId('/koperty-na-vouchery'),
          image: ogImage('koperty-dla-klinik', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty na vouchery', url: '/koperty-na-vouchery' },
          { name: 'Kliniki i gabinety', url: '/koperty-dla-klinik' },
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
              <span aria-hidden="true">›</span> Kliniki i gabinety
            </nav>

            <span className="eyebrow">Kliniki i gabinety</span>
            <h1>Koperty na vouchery dla kliniki</h1>
            <p className="hero-lead">
              Bon na zabieg kupuje zwykle ktoś, kto sam na ten zabieg nie przyjdzie — i to on
              ogląda kopertę w recepcji. Koperty Envelopes są bez okienka adresowego, więc nazwa
              procedury i kwota pakietu zostają zakryte aż do otwarcia. Koperta z logo kliniki
              kosztuje {formatPrice(printed.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty dla kliniki
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z logo placówki akceptują Państwo przed drukiem. Do każdego
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
                  note: 'Nazwa zabiegu i kwota pakietu zostają zakryte do otwarcia koperty',
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
                  title: 'Cztery odcienie „czyste"',
                  note: 'Biały i Błękitna pod stomatologię, perłowe pod medycynę estetyczną',
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

      {/* ── Dlaczego bon z kliniki wymaga koperty — kąt zakupowy, nie prezentowy ── */}
      <section className="section section-surface" id="dlaczego">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Po co koperta</span>
            <h2>Dlaczego bon z gabinetu wręcza się w kopercie</h2>
          </div>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Kupujący nie zna zabiegu</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Bon kupuje partner, rodzina albo znajoma osoby, która przyjdzie na zabieg. Kupujący
                nie wybiera procedury — wybiera kwotę albo pakiet, a pierwszą wizytą i tak jest
                konsultacja. Koperta jest jedyną częścią tego prezentu, którą ogląda w chwili
                zakupu.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Nazwa procedury zostaje w gabinecie</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Na bonie bywa wpisana nazwa zabiegu albo wartość pakietu — informacje, których
                obdarowany nie musi pokazywać nikomu przy wręczaniu. Koperta bez okienka
                adresowego nie zdradza treści: przednia ścianka jest jednolitą płaszczyzną papieru.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Pakiet ma wyglądać na pakiet</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Bon na serię zabiegów kosztuje wielokrotnie więcej niż koperta, w której jest
                wręczany. Kartka podana bez opakowania zaniża to, za co pacjent już zapłacił —
                papier barwiony w masie utrzymuje proporcję między ceną bonu a jego postacią.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dwa rytmy zamówień — „inny cykl zakupowy" z uwag poz. 22 planu ── */}
      <section className="section" id="cykl">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cykl zamówień</span>
            <h2>Klinika zamawia koperty w dwóch rytmach</h2>
            <p>
              Salon kosmetyczny kupuje koperty pod akcję prezentową i wraca po nie przed kolejną.
              W gabinecie zabiegowym obok tej fali stoi drugi, równy obieg — koperty, które nie
              mają nic wspólnego z prezentem.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
            <div>
              <h3 style={{ fontSize: 19 }}>Bon sezonowy — partia pod jedną okazję</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Bony sprzedają się falami: Walentynki, Dzień Matki, wiosna przed sezonem ślubnym
                i grudzień. Koperty zamawia się wtedy pod jedną akcję, bo projekt wraca
                niezmieniony przy każdym dodruku — raz zatwierdzona wizualizacja służy przez cały
                rok.
              </p>

              <h3 style={{ fontSize: 19, marginTop: 'var(--space-5)' }}>
                Koperta gabinetowa — zużycie przez cały rok
              </h3>
              <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                Plan leczenia z kosztorysem, zalecenia pozabiegowe, karta pacjenta stałego,
                zaproszenie na dzień otwarty po wprowadzeniu nowej usługi. Te koperty wydaje się
                do ręki przy recepcji, w tempie kilku sztuk tygodniowo, i to samo „brak okienka"
                pracuje tu na dyskrecję dokumentu zamiast na niespodziankę prezentu.
              </p>
              <p className="small" style={{ marginTop: 'var(--space-3)' }}>
                Oba obiegi obsługuje ten sam nadruk logo, więc mieszczą się w jednym zamówieniu —
                a próg {DEFAULT_PRICING.moqWithPrint} sztuk sprawia, że gabinet nie musi kupować
                rocznego zapasu, żeby w ogóle zamówić. Rozbicie ceny nadruku na składniki
                opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem#cena">koperty z nadrukiem</Link>, a bon z imieniem
                obdarowanego — na stronie{' '}
                <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
              </p>
            </div>

            <div style={{ maxWidth: 420 }}>
              <ShowcaseGrid shots={[PLAIN_ENVELOPE_SHOT]} columns={3} spec="color" />
              <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
                Kadr pokazuje budowę koperty DL: jednolitą przednią ściankę bez okienka i klapkę
                wzdłuż dłuższego boku. To ta ścianka decyduje, że z zewnątrz nie widać ani nazwy
                zabiegu, ani kwoty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Kolor: dwie rodziny wewnątrz barw jasnych — rozróżnienie wobec poz. 19 ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolor</span>
            <h2>Jaki kolor koperty pasuje do kliniki</h2>
            <p>
              Każdy z 19 kolorów w katalogu kosztuje tyle samo, więc wybór jest wyłącznie decyzją
              wizerunkową. Gabinety sięgają po barwy jasne i „czyste", ale pod tym jednym zdaniem
              stoją dwa różne wnętrza — i dwie różne rodziny odcieni.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)', alignItems: 'start' }}>
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

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Salony SPA i gabinety kosmetyczne opisaliśmy osobno — tam jasnej palecie realnie
            konkuruje kierunek naturalny, ciepły Szarobrązowy:{' '}
            <Link href="/koperty-dla-salonow-spa">koperty na bony podarunkowe</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z logo kliniki
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem, niezależnie od wybranego koloru.
            </span>
          </div>
        </div>
      </section>

      {/* ── Koszt — nakłady w skali gabinetu, obejmujące oba obiegi ── */}
      <section className="section" id="koszt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Koszt</span>
            <h2>Ile kosztuje seria kopert dla kliniki</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Cena za sztukę jest taka sama przy 10 i przy 500 kopertach, więc jednoosobowy gabinet
            nie płaci wyższej stawki niż klinika z kilkoma gabinetami zabiegowymi. Tabela pokazuje
            wartość zamówienia w trzech skalach: jedna akcja prezentowa, kwartał i rok pracy
            recepcji.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert dla kliniki w trzech konfiguracjach i trzech nakładach
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nakład</th>
                  {CLINIC_SETUPS.map((setup) => (
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
                    {CLINIC_SETUPS.map((setup) => {
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
                  {CLINIC_SETUPS.map((setup) => {
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
            naliczany raz na całe zamówienie. Pełną tabelę konfiguracji bonu i pozostałe branże
            opisaliśmy na filarze <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>
        </div>
      </section>

      {/* ── Kalendarz gabinetu — sezon ślubny i wakacyjny zamiast trzeciej okazji prezentowej ── */}
      <section className="section section-surface" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kiedy zamówić</span>
            <h2>Kalendarz sprzedaży bonów w klinice</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Bon z gabinetu zabiegowego sprzedaje się inaczej niż bon na pojedynczy masaż: zabiegi
            wykonuje się w serii rozłożonej na tygodnie, więc kupujący, który celuje w konkretny
            termin, sięga po bon z wyprzedzeniem. Termin liczymy wstecz od dnia, w którym bony
            mają trafić do sprzedaży — koperty z nadrukiem wysyłamy w{' '}
            {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w{' '}
            {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Terminy zamówienia kopert przed czterema szczytami sprzedaży bonów w klinice
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
              <h2>Gotowi zapakować bony przed sezonem?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem —{' '}
                {formatPrice(printed.unitTotal)} brutto za sztukę, od {DEFAULT_PRICING.moqWithPrint}{' '}
                sztuk, z wysyłką w {DEFAULT_PRICING.leadDaysStandard} dni roboczych. Koperty z logo
                i imieniem obdarowanego kosztują {formatPrice(printedNamed.unitTotal)} brutto za
                sztukę.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty dla kliniki
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print label="Zamów koperty dla kliniki" />
    </>
  );
}
