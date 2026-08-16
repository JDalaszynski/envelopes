import type { Metadata } from 'next';
import { Great_Vibes } from 'next/font/google';
import Link from 'next/link';

import { Configurator } from '@/components/configurator/Configurator';
import { ConfiguratorAmbience } from '@/components/configurator/ConfiguratorAmbience';
import { ConfigureLink } from '@/components/home/ConfigureLink';
import { HeroEnvelopes } from '@/components/home/HeroEnvelopes';
import { MobileCta } from '@/components/home/MobileCta';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { EnvelopeShape } from '@/components/ui/EnvelopeShape';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { OCCASION_SHOTS } from '@/lib/showcase';
import {
  AVAILABLE_FORMATS,
  BULK_QUOTE_THRESHOLD,
  COLORS,
  COLOR_MAP,
  FORMAT_MAP,
  UPCOMING_FORMATS,
} from '@/lib/catalog';
import { FAQ_ITEMS } from '@/lib/faq';
import { getAllPosts, getPost } from '@/lib/blog';
import {
  DEFAULT_PRICING,
  DELIVERY_COST,
  calculatePrice,
  formatDate,
  formatPrice,
  round2,
} from '@/lib/pricing';
import {
  colorPaletteJsonLd,
  faqJsonLd,
  howToJsonLd,
  ogImage,
  productJsonLd,
  webSiteJsonLd,
} from '@/lib/seo';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Strona główna — filar klastra K3 („koperty ozdobne", „koperty kolorowe")
 * i jednocześnie hub konwersji: to tutaj stoi konfigurator (keywords.md K3,
 * content-plan.md poz. 6).
 *
 * Dwie zasady rządzą tą treścią:
 *
 * 1. Wszystkie liczby pochodzą z `pricing.ts` i `catalog.ts`. Strona nie może
 *    obiecywać ceny ani formatu, którego konfigurator nie zrealizuje —
 *    dlatego formaty czytamy z `AVAILABLE_FORMATS`, a nie z `FORMATS`.
 * 2. Antykanibalizacja wobec filara `/koperty-z-nadrukiem`. Strona główna
 *    wymienia usługę nadruku i jej dopłatę, ale nie rozkłada ceny nadruku na
 *    czynniki i nie ma nagłówka o cenie nadruku — ten materiał należy do
 *    filara. Cennik na stronie głównej dotyczy kopert gładkich.
 */

/**
 * Kaligrafia dla jednego akcentowanego słowa w nagłówku hero („wrażenie").
 * Pismo odręczne jest tu na miejscu: kopertę adresuje się ręcznie, więc
 * kaligrafia mówi to samo, co treść zdania.
 *
 * Krój deklarujemy w tym pliku, a nie w `layout.tsx`, bo akcent istnieje
 * wyłącznie na stronie głównej. W layoucie subset latin-ext (45 kB) trafiałby
 * do preloadu każdej podstrony — blog, kontakt, koszyk — gdzie nic go nie używa.
 */
const greatVibes = Great_Vibes({
  subsets: ['latin-ext'],
  weight: ['400'],
  variable: '--font-great-vibes',
  display: 'swap',
});

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

/** Cena netto pojedynczego składnika — ta sama stawka VAT co w kalkulatorze. */
function net(gross: number): number {
  return round2(gross / (1 + DEFAULT_PRICING.vatRate));
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

const BESTSELLERS = COLORS.filter((color) => color.bestseller);

function weightLabel(colorId: string): string {
  return COLOR_MAP[colorId]?.weight?.replace('g', ' g/m²') ?? '';
}


/** Formaty zapowiedziane, wypisane zdaniem: „C6 114 × 162 mm i K4 155 × 155 mm". */
const UPCOMING_LABEL = UPCOMING_FORMATS.map((f) => `${f.id} ${f.dimensions}`).join(' i ');

/**
 * Te same formaty bez wymiarów. W tabeli formatów milimetry są treścią
 * kolumny, ale w akapicie o zaproszeniach niosą tylko szum — czytelnik na
 * tym etapie pyta, czy może zamówić, a nie ile to ma milimetrów.
 */
const UPCOMING_LABEL_SHORT = UPCOMING_FORMATS.map((f) => f.id).join(' i ');

const HOW_TO_STEPS = [
  {
    name: 'Wybór koperty w konfiguratorze',
    text: `Wybierają Państwo kolor i ilość, a jeśli koperta ma nieść logo albo dane odbiorcy — także jedną z dwóch usług. Przy nadruku i personalizacji zamówienie zaczyna się od ${DEFAULT_PRICING.moqWithPrint} sztuk. Cena przelicza się przy każdej zmianie, więc nic nie wyjaśnia się dopiero w koszyku.`,
  },
  {
    name: 'Płatność',
    text: 'Do wyboru są BLIK, karta, szybki przelew i przelew tradycyjny. Instytucje publiczne i urzędy mogą zapłacić fakturą z odroczonym terminem płatności 14 dni — taka faktura nie wstrzymuje realizacji zamówienia.',
  },
  {
    name: 'Akceptacja wizualizacji',
    text: 'Krok dotyczy wyłącznie zamówień z nadrukiem lub personalizacją. Nasz grafik przygotowuje wizualizację koperty i przesyła ją e-mailem — do druku kierujemy tylko wersję zaakceptowaną. Koperty gładkie pomijają ten krok.',
  },
  {
    name: 'Wysyłka kurierem',
    text: `Koperty gładkie wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze, a zamówienia z nadrukiem w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni robocze w trybie ekspresowym. Dostawa kurierem kosztuje ${formatPrice(DELIVERY_COST)} brutto za zamówienie, a numer przesyłki pojawia się w panelu zamówień.`,
  },
];

/** Zastosowania, nie branże — branże obsługuje filar `/koperty-z-nadrukiem`. */
const USE_CASES: { heading: string; text: string }[] = [
  {
    heading: 'Korespondencja firmowa i dokumenty',
    text: 'Pismo, umowa i faktura złożone na trzy wchodzą do koperty DL bez dodatkowego zagięcia. Koperta ozdobna zamiast białej pocztowej sprawia, że przesyłka nie ląduje na stosie z reklamami.',
  },
  {
    heading: 'Vouchery i bony podarunkowe',
    text: 'Bon w kopercie ozdobnej z logo wygląda jak prezent, a nie jak wydruk z drukarki biurowej. To najczęstszy powód, dla którego salony, kliniki i restauracje sięgają po koperty kolorowe — obdarowany dostaje coś, co chce się otworzyć.',
  },
  {
    heading: 'Zaproszenia i programy wydarzeń',
    text: `Zaproszenie składane i program wydarzenia wysyłamy dziś w kopercie DL. Na zaproszenia kwadratowe i w formacie A6 potrzebne są koperty ${UPCOMING_LABEL_SHORT}, które mają w katalogu status „Dostępne wkrótce".`,
  },
  {
    heading: 'Wysyłki VIP i prezentowe',
    text: 'Kiedy przesyłka ma zostać zapamiętana, wybierane są odcienie, których nie widuje się codziennie na biurku: Matcha, Błękit Łupkowy albo Złoty z metalicznym połyskiem.',
  },
  {
    heading: 'Certyfikaty, dyplomy i podziękowania',
    text: 'Certyfikat A4 złożony na trzy mieści się w kopercie DL. Jedna edycja kursu albo pojedyncza grupa szkoleniowa to już wystarczający nakład — nie trzeba czekać, aż uzbiera się większe zamówienie.',
  },
  {
    heading: 'Koperty na pieniądze i nagrody',
    text: 'Premia, nagroda w konkursie pracowniczym i prezent okolicznościowy trafiają do koperty DL, bo banknot mieści się w niej płasko, bez składania. Nie trzeba przy tym kupować opakowania zbiorczego.',
  },
];

/**
 * Zbliżenia na papier — zdjęcia z `public/images/details/`. Każdy plik ma
 * kadr kwadratowy w dwóch szerokościach (512 i 1024 px) podanych w `srcSet`,
 * więc przeglądarka pobiera wariant dopasowany do kolumny gridu.
 *
 * Kadry dobrane tak, żeby każdy niósł inny argument produktowy: barwienie
 * w masie, mat, wykończenie metaliczne i gramaturę powyżej standardu.
 */
const PAPER_SHOTS: { colorId: string; file: string; alt: string; note: string }[] = [
  {
    colorId: 'niebieski',
    file: 'niebieska-koperta-dl-papier-barwiony-zblizenie',
    alt: 'Koperta ozdobna DL w kolorze niebieskim — zbliżenie na klapkę i papier barwiony w masie',
    note: 'Kolor sięga w głąb arkusza, więc zagięcie klapki ma ten sam odcień co cała koperta.',
  },
  {
    colorId: 'czarny',
    file: 'czarna-koperta-dl-klapka-zblizenie',
    alt: 'Koperta ozdobna DL czarna — zbliżenie na klapkę i matową fakturę papieru',
    note: 'Czerń bez połysku. Na tej fakturze najmocniej wybija się nadruk w jasnym kolorze.',
  },
  {
    colorId: 'zloty',
    file: 'zlota-koperta-dl-papier-metaliczny-zblizenie',
    alt: 'Koperta ozdobna DL złota — zbliżenie na metaliczne wykończenie papieru',
    note: 'Metaliczne wykończenie odbija światło pod kątem — koperta wygląda inaczej z każdej strony.',
  },
  {
    colorId: 'matcha',
    file: 'matcha-koperta-dl-zielona-zblizenie',
    alt: 'Dwie koperty ozdobne DL w kolorze Matcha — zbliżenie na klapkę i krawędź papieru',
    note: 'Papier grubszy od standardowego — koperta trzyma kształt w przesyłce zbiorczej.',
  },
];

/** Zdjęcia realizacji — wyłącznie kadry, które faktycznie są w `public/images/`. */
const SHOWCASE: { colorId: string; variant: 'nadruk' | 'personalizacja'; note: string }[] = [
  { colorId: 'bialy', variant: 'nadruk', note: 'Ciemne logo na bieli daje najwyższy kontrast.' },
  {
    colorId: 'granatowy',
    variant: 'nadruk',
    note: 'Jasny nadruk na granacie — kolor korespondencji formalnej.',
  },
  {
    colorId: 'ciemnozielony',
    variant: 'nadruk',
    note: 'Butelkowa zieleń pod logo marek premium i eko.',
  },
  {
    colorId: 'blekit-lupkowy',
    variant: 'nadruk',
    note: 'Papier grubszy od standardu, bez dopłaty do ceny.',
  },
  {
    colorId: 'szara',
    variant: 'personalizacja',
    note: 'Imię, nazwisko i adres odbiorcy drukowane na kopercie.',
  },
  {
    colorId: 'granatowy',
    variant: 'personalizacja',
    note: 'Adresowanie wysyłek do klientów kluczowych.',
  },
  { colorId: 'czarny', variant: 'nadruk', note: 'Nadruk na czerni — kancelarie, studia, marki premium.' },
  {
    colorId: 'czerwony',
    variant: 'personalizacja',
    note: 'Adresowanie na mocnym kolorze, bez utraty czytelności.',
  },
];

export const metadata: Metadata = {
  /* Szablon `%s | Envelopes` z `layout.tsx` obejmuje wyłącznie segmenty
     podrzędne — strona główna jest tym samym segmentem co layout, więc marka
     musi znaleźć się w tytule wprost. */
  title: `Koperty ozdobne i kolorowe DL od ${formatPrice(plain.unitTotal)} | Envelopes`,
  description: `Koperty ozdobne DL w ${COLORS.length} kolorach po ${formatPrice(plain.unitTotal)} brutto za sztukę — każdy odcień w tej samej cenie. Nadruk logo i adresowanie odbiorców, wysyłka w ${DEFAULT_PRICING.leadDaysPlain} dni robocze.`,
  keywords: [
    'koperty ozdobne',
    'koperta ozdobna',
    'koperty kolorowe',
    'koperty ozdobne dl',
    'koperty na listy',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Koperty ozdobne DL w 19 kolorach — Envelopes',
    description: `Koperta ozdobna DL ${DL.dimensions} za ${formatPrice(plain.unitTotal)} brutto, ${COLORS.length} kolorów w jednej cenie, od ${DEFAULT_PRICING.moqWithoutPrint} sztuki. Nadruk logo i adresowanie na życzenie.`,
    url: '/',
    images: [
      ogImage(
        'home',
        'Koperty ozdobne DL w sześciu kolorach — czarna, granatowa, czerwona, Matcha, złota i ecru'
      ),
    ],
  },
};

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);

  /* Wpisy blogowe podlinkowane kontekstowo w treści — każdy pod tą sekcją,
     której temat rozwija (pkt 5.4: strona główna rozdziela ruch). */
  const filesPost = getPost('jak-przygotowac-pliki-do-druku-na-kopertach');
  const sheetGuidePost = getPost('adresowanie-kopert-z-arkusza-czy-recznie');

  return (
    <>
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={productJsonLd()} />
      <JsonLd data={colorPaletteJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak zamówić koperty ozdobne w Envelopes',
          description: `Zamówienie kopert ozdobnych DL ${DL.dimensions} — od wyboru koloru w konfiguratorze po wysyłkę kurierem.`,
          steps: HOW_TO_STEPS,
        })}
      />

      {/* ── Hero — kompozycja produktowa (dwie koperty DL) + jedno CTA ──
          Układ redakcyjny: kolumna tekstu po lewej, zdjęcie produktu po prawej,
          pod spodem pasek czterech faktów handlowych. Treść bez zmian. */}
      <section className={`home-hero ${greatVibes.variable}`}>
        <span className="home-hero-grain" aria-hidden="true" />

        <div className="container home-hero-inner">
          {/* Kolumna tekstu jest rozbita na dwa bloki — nagłówek i obietnicę
              z CTA — żeby na mobile kompozycja produktowa mogła wejść między
              nie (`order` w `mobile.css`). DOM zostaje w kolejności czytania:
              h1 → lead → CTA. */}
          <div className="home-hero-copy">
            <div className="home-hero-head">
              <span className="eyebrow home-hero-eyebrow">Koperty ozdobne dla firm</span>
              {/* Akcent na „wrażenie" — sam krój pisma zamiast koloru, więc
                  wyróżnienie działa też przy monochromatycznym wydruku i nie
                  niesie znaczenia wyłącznie barwą. Przecinek zostaje poza
                  kaligrafią: pochylona interpunkcja rozjeżdża światło w wierszu. */}
              <h1 className="home-hero-title">
                Koperty ozdobne robiące <em className="hero-accent">wrażenie</em>, zanim zostaną
                otwarte.
              </h1>
            </div>

            <div className="home-hero-tail">
              <p className="hero-lead">
                {COLORS.length} odcieni papieru barwionego w masie, z logo albo z nazwiskiem
                odbiorcy. Cenę widzisz od razu, zamówienie składasz w kilka minut.
              </p>

              <div className="home-hero-cta">
                <Link href="#konfigurator" className="btn btn-lg">
                  Zamów Koperty Ozdobne
                </Link>
              </div>
              <p className="small muted home-hero-note">
              </p>
            </div>
          </div>

          <HeroEnvelopes />
        </div>
      </section >

      <section className="home-hero-facts-section">
        <div className="container">
          {/* `m-snap`: na mobile cztery kafle jadą poziomo z zatrzaskiem
              zamiast zajmować cztery ekrany pionu. */}
          <div className="home-hero-facts m-snap m-snap-sm">
            {([
              {
                icon: 'kolory.svg',
                title: `Dopasuj kopertę do marki`,
                note: `Masz do wyboru ${COLORS.length} odcieni w tej samej cenie - matowe, perłowe, eko`,
              },
              {
                icon: 'nadruk.svg',
                title: `Zrób wrażenie własnym nadrukiem`,
                note: `Koperty z nadrukiem logo i adresowaniem — zobacz możliwości`,
                href: '/koperty-z-nadrukiem',
              },
              {
                icon: 'ilosc.svg',
                title: `Zamawiaj od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
                note: `Koperty z nadrukiem od 10 sztuk. Zamów tyle, ile faktycznie zużyjesz`,
              },
              {
                icon: 'wysylka.svg',
                title: `Ekspresowa dostawa`,
                note: `Zamówienia wysyłamy w ${DEFAULT_PRICING.leadDaysPlain} dni robocze`,
              },
            ] as { icon: string; title: string; note: string; href?: string }[]).map((usp) => {
              const inner = (
                <>
                  <img src={`/images/icons/${usp.icon}`} alt="" width={32} height={32} aria-hidden="true" className="home-fact-icon" />
                  <strong>{usp.title}</strong>
                  <small>{usp.note}</small>
                </>
              )

              /* Kafel nadruku jest jawnym linkiem do filaru /koperty-z-nadrukiem:
                 strzałka i podkreślenie na hover dają afordancję, a fraza siedzi
                 w tekście kotwicy (nocie), nie w haśle tytułu. */
              return usp.href ? (
                <Link className="home-fact home-fact-link" href={usp.href} key={usp.title}>
                  {inner}
                </Link>
              ) : (
                <div className="home-fact" key={usp.title}>{inner}</div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Konfigurator — jedyny ciemny pas na całej stronie ──
          Biel przestała być wyróżnikiem: `section-surface` mają tu cztery
          sekcje, więc konfigurator wyglądał jak kolejny akapit i był mijany
          przewijaniem. Odwrócony kontrast — granat pod papierowymi kartami —
          daje jedno miejsce, które nie wygląda jak treść, tylko jak narzędzie.
          Obie krawędzie pasa są widoczne w trakcie przewijania, więc widać nie
          tylko, gdzie konfigurator się zaczyna, ale też gdzie się kończy. */}
      <section className="section configurator-zone" id="konfigurator">
        <ConfiguratorAmbience />
        <div className="container">
          <div className="section-head configurator-zone-head">
            <span className="eyebrow">Konfigurator kopert</span>
            <h2>Trzy kroki do gotowego zamówienia</h2>
            <p>
              Format, kolor, ilość — a jeśli trzeba, także nadruk logo i adresowanie. Cena
              aktualizuje się przy każdej zmianie, razem z terminem wysyłki.
            </p>
          </div>
          <Configurator />
        </div>
      </section>

      {/* ── Papier z bliska — realne zdjęcia detali z public/images/details ── */}
      <section className="section section-surface" id="papier">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Papier</span>
            <h2>Papier kopert ozdobnych z bliska</h2>
            <p>
              Cztery kadry pokazują to, czego nie widać na zdjęciu całej koperty: barwienie
              w masie, matową fakturę, wykończenie metaliczne i papier grubszy od standardu.
              Kliknięcie w zdjęcie otwiera konfigurator z tym odcieniem.
            </p>
          </div>

          <div className="grid grid-4 paper-shots m-snap">
            {PAPER_SHOTS.map((shot) => {
              const color = COLOR_MAP[shot.colorId];
              return (
                <ConfigureLink
                  key={shot.colorId}
                  format="DL"
                  color={shot.colorId}
                  className="paper-shot"
                  title={`Kolor ${color?.name ?? shot.colorId} — otwórz konfigurator z tym odcieniem`}
                >
                  <figure>
                    {/* Kadry są kwadratowe (1:1) i mają jawne `width`/`height`
                        oraz `aspect-ratio` w CSS — obrazek rezerwuje miejsce
                        przed pobraniem, więc sekcja nie generuje CLS (pkt 5.5). */}
                    <img
                      src={`/images/details/${shot.file}-1024.webp`}
                      srcSet={`/images/details/${shot.file}-512.webp 512w, /images/details/${shot.file}-1024.webp 1024w`}
                      sizes="(max-width: 620px) calc(100vw - 32px), (max-width: 900px) calc(50vw - 28px), (max-width: 1240px) calc(25vw - 24px), 276px"
                      width={1024}
                      height={1024}
                      alt={shot.alt}
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption>
                      {/* Kolor i gramaturę podaje konfigurator — na stronie
                          głównej podpis zostaje przy samym kontekście użycia. */}
                      <span className="small muted">{shot.note}</span>
                    </figcaption>
                  </figure>
                </ConfigureLink>
              );
            })}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Cztery różne papiery, jedna i ta sama koperta. Wykończenie nie wpływa na cenę, więc
            wybór między nimi jest decyzją wizerunkową, a nie budżetową.
          </p>
        </div>
      </section>

      {/* ── Formaty — status dostępności podany wprost (pkt 4.2 briefu) ── */}
      <section className="section" id="formaty">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Formaty</span>
            <h2>Formaty kopert — co da się zamówić dziś</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            W sprzedaży jest dziś jeden format: koperta DL {DL.dimensions}. Koperty{' '}
            {UPCOMING_LABEL} mają w katalogu Envelopes status „Dostępne wkrótce" i nie można ich
            zamówić — ani gładkich, ani z nadrukiem. Wszystkie nasze koperty są bez okienka
            adresowego, więc nadruk i adres mogą objąć całą przednią ściankę.
          </p>

          {/* Tabela statusu — trzy kolumny i nic więcej (keywords.md, rozgraniczenie
              K3 ↔ K4). Kolumna „co się zmieści" i porównanie wkładek należą do
              `/koperty-dl`; strona główna podaje wyłącznie wymiar i dostępność,
              bo bez tego obiecywałaby produkt, którego konfigurator nie przyjmie.
              Cena stoi tylko przy formacie dostępnym — cennik zapowiedzianego
              formatu byłby obietnicą nie do zrealizowania. */}
          {/* `m-cards`: tabela ma `min-width: 720px`, więc na telefonie czytało
              się ją bokiem. Na mobile każdy wiersz staje się kartą, a `data-label`
              zastępuje ukryty nagłówek kolumny. Znaczniki zostają tabelaryczne,
              więc czytnik ekranu nadal dostaje pełne powiązanie danych. */}
          <div className="table-wrap m-cards" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Formaty kopert Envelopes — wymiary, cena i status dostępności
              </caption>
              <thead>
                <tr>
                  <th scope="col">Format</th>
                  <th scope="col">Wymiary</th>
                  <th scope="col">Cena od</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_FORMATS.map((format) => (
                  <tr key={format.id}>
                    <th scope="row">{format.id}</th>
                    <td data-label="Wymiary">{format.dimensions}</td>
                    <td data-label="Cena od">
                      {formatPrice(DEFAULT_PRICING.base[format.id])} brutto/szt.
                    </td>
                    <td data-label="Status">W sprzedaży</td>
                  </tr>
                ))}
                {UPCOMING_FORMATS.map((format) => (
                  <tr key={format.id}>
                    <th scope="row">{format.id}</th>
                    <td data-label="Wymiary">{format.dimensions}</td>
                    <td className="muted" data-label="Cena od">
                      —
                    </td>
                    <td className="muted" data-label="Status">
                      Dostępne wkrótce
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-5)' }}>
            Format DL mieści kartkę A4 złożoną na trzy, czyli 99 × 210 mm, voucher w tym samym
            wymiarze oraz złożony program wydarzenia. To wymiar, który obsługuje zdecydowaną
            większość korespondencji firmowej — pisma, umowy, faktury i bony podarunkowe. Pełną
            tabelę dopasowań i porównanie z formatami C6 i K4 znajdą Państwo na stronie{' '}
            <Link href="/koperty-dl">wymiary kopert DL</Link>.
          </p>
        </div>
      </section>

      {/* ── Cennik kopert gładkich — filar K1 trzyma cennik nadruku ── */}
      <section className="section section-surface" id="cennik">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cennik</span>
            <h2>Ile kosztują koperty ozdobne</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Gładka koperta ozdobna kosztuje{' '}
            <strong>{formatPrice(plain.unitTotal)} brutto</strong> ({formatPrice(plain.net)} netto)
            za sztukę — tyle samo w każdym z {COLORS.length} kolorów. Rabatów ilościowych nie
            stosujemy, więc cena za sztukę przy dziesięciu kopertach i przy tysiącu jest ta sama;
            do zamówienia dochodzi jednorazowo {formatPrice(DELIVERY_COST)} brutto za kuriera.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Koperty bez nadruku nie przechodzą przez produkcję, więc dopłata za ekspres ich nie
            dotyczy — jadą w tym samym terminie zawsze. Dokładną kwotę dla swojej ilości zobaczą
            Państwo w konfiguratorze, zanim cokolwiek zamówią.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" className="btn">
              Sprawdź cenę swojej ilości
            </ConfigureLink>
            <Link href="/kontakt#wycena" className="btn btn-secondary">
              Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
            </Link>
          </div>
        </div>
      </section>

      {/* ── Usługi — rozdzielnik ruchu do filarów K1 i K2 ── */}
      <section className="section" id="uslugi">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Usługi</span>
            <h2>Nadruk logo i personalizacja kopert</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Do gładkiej koperty można dołożyć dwie rzeczy: logo firmy albo dane odbiorcy drukowane
            wprost na kopercie. Obie usługi kończą się wizualizacją — do druku idzie wyłącznie to,
            co Państwo zaakceptują, więc niespodzianek po otwarciu paczki nie ma.
          </p>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk logo firmowego</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.print)} brutto/szt. · od{' '}
                {DEFAULT_PRICING.moqWithPrint} szt. · {DEFAULT_PRICING.leadDaysStandard} dni
                roboczych
              </p>
              <p className="small">
                Drukujemy logo, dane kontaktowe albo całą grafikę na przedniej ściance koperty.
                Odcień papieru nie zmienia ceny nadruku — na czarnej kopercie kosztuje tyle samo,
                co na białej. Cennik, listę przyjmowanych plików i proces krok po kroku opisaliśmy
                na stronie <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" print className="btn btn-sm">
                  Wyceń koperty z nadrukiem
                </ConfigureLink>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Personalizacja i adresowanie</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.personalization)} brutto/szt. · od{' '}
                {DEFAULT_PRICING.moqWithPrint} szt. · {DEFAULT_PRICING.leadDaysStandard} dni
                roboczych
              </p>
              <p className="small">
                Każda koperta w partii wychodzi z innymi danymi, a pismo na wszystkich jest to samo
                — równe tak, jak nie wyjdzie żadną ręką. Drukujemy pełny adres, kiedy przesyłka
                idzie pocztą, albo samo imię i nazwisko, kiedy koperty wręczają Państwo osobiście.
                Dane przekazują Państwo wpisując je w konfiguratorze albo wgrywając arkusz. Cennik,
                wymagania dla listy i proces krok po kroku opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
                {/* Anchor = tytuł wpisu, czyli jego fraza długiego ogona
                    (content-plan.md poz. 8). Fraza `adresowanie kopert`
                    zostaje przy filarze. */}
                {sheetGuidePost && (
                  <>
                    {' '}
                    Który z dwóch trybów wybrać przy własnej liście, rozstrzygamy w poradniku{' '}
                    <Link href={`/blog/${sheetGuidePost.slug}`}>
                      {sheetGuidePost.title.toLowerCase()}
                    </Link>
                    .
                  </>
                )}
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format="DL" personalization className="btn btn-sm">
                  Wyceń koperty z adresowaniem
                </ConfigureLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Proces (HowTo) ── */}
      <section className="section" id="jak-to-dziala">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Jak to działa</span>
            <h2>Jak zamówić koperty ozdobne</h2>
            <p>
              Zamówienie przechodzi przez cztery kroki, z których jeden — akceptacja wizualizacji —
              dotyczy wyłącznie kopert z nadrukiem lub personalizacją.
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
            Termin realizacji liczymy od zaksięgowania wpłaty, a przy zamówieniach z nadrukiem
            dodatkowo od akceptacji wizualizacji. Przy przelewie tradycyjnym prosimy doliczyć czas
            księgowania; przy fakturze z odroczonym terminem realizacja rusza bez oczekiwania na
            wpłatę.
            {/* Anchor = fraza wpisu (`pliki do druku na kopertach`), a nie fraza
                filara K1 — inaczej strona główna wzmacniałaby wpis na frazie,
                którą oddał filarowi (content-plan.md poz. 7). */}
            {filesPost && (
              <>
                {' '}
                Wymagania dla pliku z logo zebraliśmy w poradniku{' '}
                <Link href={`/blog/${filesPost.slug}`}>
                  jak przygotować pliki do druku na kopertach
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── Zastosowania — celowo zastosowania, nie branże (branże trzyma filar K1) ── */}
      <section className="section" id="zastosowania">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Do czego używa się kopert ozdobnych</h2>
            <p>
              Koperta ozdobna zastępuje białą kopertę pocztową wszędzie tam, gdzie odbiorca ma
              zapamiętać nadawcę. Sześć sytuacji, w których sięga się po nią najczęściej.
            </p>
          </div>
          <div className="grid grid-3 m-snap" style={{ gap: 'var(--space-5)' }}>
            {USE_CASES.map((useCase) => (
              <div className="card" key={useCase.heading}>
                <h3 style={{ fontSize: 19 }}>{useCase.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {useCase.text}
                </p>
              </div>
            ))}
          </div>
          {/* Trzy kadry okolicznościowe — jedyne miejsce w serwisie, gdzie
              nadruk pokazany jest w roli innej niż firmowa. Wszystkie trzy to
              format DL, czyli ten, który da się dziś kupić; koperty C6 i K4 ze
              statusem „Dostępne wkrótce" nie występują na żadnym z nich. */}
          <h3 style={{ marginTop: 'var(--space-7)' }}>Nadruk okolicznościowy na kopercie DL</h3>
          <p style={{ maxWidth: '68ch' }}>
            Nadruk nie musi być logo firmy. Równie dobrze drukujemy jedno słowo — nazwę
            uroczystości albo imię — na tych samych zasadach co znak firmowy.
          </p>

          <div style={{ marginTop: 'var(--space-5)' }}>
            <ShowcaseGrid shots={OCCASION_SHOTS} columns={3} showSpec={false} />
          </div>

          {/* Odesłanie do filara K7 wewnątrz sekcji tematycznej — bez tworzenia
              osobnego rozdzielnika, który odsunąłby paletę kolorów w dół. */}
          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Bony sprzedają się sezonowo i zamawia się je całymi seriami pod jedną akcję. Kiedy
            złożyć zamówienie, żeby zdążyć przed szczytem, i ile kosztuje gotowa seria — opisaliśmy
            na stronie <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>
        </div>
      </section>

      {/* ── Realizacje — realne zdjęcia z public/images/prints i personalized ── */}
      <section className="section" id="realizacje">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Realizacje</span>
            <h2>Przykłady nadruku i personalizacji na kopertach DL</h2>
            <p>
              Zdjęcia poniżej pokazują koperty DL wykonane w naszej produkcji — z nadrukiem logo
              i z adresowaniem. Cennik, specyfikację i proces akceptacji opisaliśmy na stronach{' '}
              <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link> oraz{' '}
              <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
            </p>
          </div>
          <div className="grid grid-4 m-snap m-snap-sm" style={{ gap: 'var(--space-4)' }}>
            {SHOWCASE.map((item) => {
              const color = COLOR_MAP[item.colorId];
              const label = `Koperta DL ${color?.name ?? item.colorId} ${item.variant === 'nadruk' ? 'z nadrukiem' : 'z personalizacją'
                }`;
              return (
                <ConfigureLink
                  key={`${item.colorId}-${item.variant}`}
                  format="DL"
                  color={item.colorId}
                  print={item.variant === 'nadruk'}
                  personalization={item.variant === 'personalizacja'}
                  className="card"
                  title={`${label} — otwórz konfigurator z tą konfiguracją`}
                >
                  <div style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                    <EnvelopePlaceholder
                      format="DL"
                      colorId={item.colorId}
                      ratio="photo"
                      hasPrint={item.variant === 'nadruk'}
                      hasPersonalization={item.variant === 'personalizacja'}
                      hideCaption
                      size="sm"
                    />
                    {/* Podpis mówi o usłudze, nie o wariancie papieru — kolor
                        i gramaturę wybiera się w konfiguratorze. */}
                    <strong style={{ display: 'block', fontSize: 15, marginTop: 'var(--space-3)' }}>
                      Koperta DL {item.variant === 'nadruk' ? 'z nadrukiem' : 'z personalizacją'}
                    </strong>
                    <span className="small muted">{item.note}</span>
                  </div>
                </ConfigureLink>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Koperty ozdobne / paleta — właściciel frazy głównej K3.
             Sekcja stoi poniżej zdjęć: najpierw produkt na zdjęciu i cena,
             dopiero potem pełna specyfikacja palety. Kotwica `#kolory`
             jest linkowana ze stopki i ze stron filarowych. ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Paleta Kolorów</span>
            <h2>Koperty ozdobne w {COLORS.length} kolorach — jedna cena za każdy odcień</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperty ozdobne różnią się od pocztowych papierem: zamiast białego offsetu jest papier
            barwiony w masie, więc kolor sięga w głąb arkusza i nie znika na zagięciu klapki.
            Wszystkie {COLORS.length} odcieni kosztuje tyle samo — również te perłowe, metaliczne
            i eko. Kolor wybierają Państwo pod markę albo pod okazję, nie pod budżet.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Zamawiać można bez opakowań zbiorczych i bez progów ilościowych. Kliknięcie w kolor
            otwiera konfigurator z zaznaczonym odcieniem.
          </p>

          <div className="palette-scroller">
            {COLORS.map((color) => (
              <ConfigureLink
                key={color.id}
                format="DL"
                color={color.id}
                className="palette-chip"
                title={`Koperta DL ${color.name.toLowerCase()} — otwórz konfigurator z tym kolorem`}
              >
                <span className="swatch-shape">
                  <EnvelopeShape colorId={color.id} />
                </span>
                <span>{color.name}</span>
              </ConfigureLink>
            ))}
          </div>

          <h3 style={{ marginTop: 'var(--space-7)' }}>
            Gramatura i wykończenie {COLORS.length} kolorów kopert DL
          </h3>
          <p style={{ maxWidth: '68ch' }}>
            Im grubszy papier, tym lepiej koperta znosi drogę w przesyłce zbiorczej. Najgrubszy
            w ofercie jest Taupe ({weightLabel('taupe')}), a cała paleta rozkłada się tak:{' '}
            {WEIGHT_SUMMARY}. Plakietkę „Bestseller" ma {BESTSELLERS.length} odcieni zamawianych
            najczęściej.
          </p>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Część odcieni funkcjonuje w rozmowie pod nazwami potocznymi. Koperta beżowa to w naszym
            katalogu Ecru albo Taupe, kremowa — Ecru, grafitowa — Czarny, butelkowa —
            Ciemnozielony, a pudrowa — Różowa. W konfiguratorze, na fakturze i w potwierdzeniu
            zamówienia obowiązuje wyłącznie nazwa katalogowa, żeby wszystkie dokumenty opisywały ten
            sam produkt.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" className="btn">
              Wybierz kolor koperty
            </ConfigureLink>
          </div>
        </div>
      </section>

      {/* ── Dla firm — bariera rozliczeniowa, nie produktowa ── */}
      <section className="section" id="dla-firm">
        <div className="container">
          <div className="card card-lg grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <span className="eyebrow">Dla firm i instytucji</span>
              <h2>Rozliczenie dopasowane do obiegu dokumentów</h2>
              <p className="small">
                Fakturę VAT wystawiamy do każdego zamówienia, także przy zakupie bez numeru NIP.
                Faktura z odroczonym terminem płatności 14 dni jest dostępna dla instytucji
                publicznych i urzędów, których obieg zakupowy nie przewiduje przedpłaty. Taka
                faktura nie wstrzymuje realizacji — zamówienie rusza bez oczekiwania na wpłatę.
                Pozostali klienci płacą z góry: BLIK-iem, kartą lub przelewem.
              </p>
              <ul className="small" style={{ paddingLeft: 'var(--space-5)', lineHeight: 1.8 }}>
                <li>Faktura VAT do każdego zamówienia, także przy zakupie bez NIP.</li>
                <li>Odroczony termin płatności 14 dni, bez wstrzymywania realizacji.</li>
                <li>
                  Stała cena jednostkowa — {formatPrice(plain.unitTotal)} brutto za kopertę DL
                  niezależnie od wielkości zamówienia.
                </li>
                <li>Zapisane konfiguracje i ponowne zamówienie jednym kliknięciem.</li>
                <li>
                  Powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk ustalamy harmonogram
                  dostaw indywidualnie.
                </li>
              </ul>
              <div className="row" style={{ marginTop: 'var(--space-5)' }}>
                <Link href="/rejestracja?typ=firmowe" className="btn">
                  Załóż konto firmowe
                </Link>
                <Link href="/kontakt#wycena" className="btn btn-secondary">
                  Zapytaj o wycenę hurtową
                </Link>
              </div>
            </div>
            <EnvelopePlaceholder format="DL" colorId="granatowy" ratio="photo" hideCaption />
          </div>
        </div>
      </section>

      {/* ── FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o koperty ozdobne</h2>
          </div>
          {FAQ_ITEMS.map((item) => (
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

      {/* ── Blog ── */}
      <section className="section" id="blog">
        <div className="container">
          <div className="row-between section-head" style={{ maxWidth: 'none' }}>
            <div>
              <span className="eyebrow">Blog</span>
              <h2>Poradniki o kopertach i korespondencji firmowej</h2>
            </div>
            <Link href="/blog" className="btn btn-secondary">
              Wszystkie wpisy
            </Link>
          </div>
          <div className="grid grid-3 m-snap">
            {posts.map((post) => (
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
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="small muted">{post.lead}</p>
                  <div className="post-meta">
                    <span>{formatDate(post.date)}</span>
                    <span>{post.readingMinutes} min czytania</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO Section — przechowuje pierwotne, rozbudowane opisy SEO przeniesione z Hero ── */}
      <section className="section section-surface" id="o-kopertach">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Szczegóły produktu</span>
            <h2>Więcej o kopertach ozdobnych dla firm</h2>
          </div>
          <div className="grid grid-2" style={{ gap: 'var(--space-6)' }}>
            <div>
              <p className="small muted">
                Po koperty ozdobne sięga się wtedy, gdy sama przesyłka ma coś powiedzieć o nadawcy:
                przy zaproszeniu, bonie podarunkowym, piśmie do klienta, którego nie chce się
                zgubić w stosie poczty. Papier barwiony w masie robi tu całą robotę — biała
                koperta z okienkiem tego nie udźwignie. Co się w kopercie zmieści i czym różni się
                od pozostałych formatów, opisaliśmy na stronie{' '}
                <Link href="/koperty-dl">koperty DL {DL.dimensions}</Link>.
              </p>
            </div>
            <div>
              <p className="small muted">
                Zamawianie ma być krótsze niż wybieranie koloru. Cenę widzą Państwo od razu, bez
                zapytania ofertowego i bez czekania na odpowiedź handlowca. Fakturę VAT wystawiamy
                do każdego zamówienia, a instytucje publiczne i urzędy mogą zapłacić po terminie —
                zamówienie rusza wtedy od razu, nie po zaksięgowaniu przelewu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Gotowi, by zamówić koperty ozdobne?</h2>
              <p>
                Wybór koloru zajmuje minutę, a cenę widzą Państwo od razu — bez zapytania
                ofertowego i bez zakładania konta.
              </p>
            </div>
            <ConfigureLink format="DL" className="btn btn-lg">
              Zamów Koperty Ozdobne
            </ConfigureLink>
          </div>
        </div>
      </section>

      {/* Dolny pasek akcji — tylko mobile. Trzyma cenę wyjściową i wejście do
          konfiguratora w zasięgu kciuka przez całą długość strony. */}
      <MobileCta price={formatPrice(plain.unitTotal)} />
    </>
  );
}
