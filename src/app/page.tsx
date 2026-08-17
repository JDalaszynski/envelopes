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
import { OCCASION_SHOTS, shotByFile, type ShowcaseShot } from '@/lib/showcase';
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

/**
 * Zastosowania, nie branże — branże obsługuje filar `/koperty-z-nadrukiem`.
 *
 * Każde zastosowanie ma kadr. Zasada doboru jest jedna i twarda: **kadr musi
 * pokazywać to, co mówi nagłówek**. Cztery pierwsze pozycje mają kadr
 * aranżacyjny, bo taki istnieje i jest prawdziwy — pismo z logiem kancelarii
 * pod „korespondencją firmową", bon restauracyjny pod „voucherami", zaproszenie
 * orkiestry pod „zaproszeniami", metaliczne złoto pod „wysyłkami VIP". Alt
 * i podpis biorę wprost z `showcase.ts`, więc opis kadru nie może się rozjechać
 * ze stroną filarową, na której ten sam plik też stoi.
 *
 * Dwie ostatnie pozycje — certyfikaty i koperty na pieniądze — nie mają kadru
 * aranżacyjnego w bibliotece. Zamiast podstawiać pod nie zdjęcie z cudzym
 * logiem (co byłoby nieprawdą w treści alternatywnej i w warstwie handlowej),
 * dostają zdjęcie produktowe gładkiej koperty w odcieniu pasującym do sytuacji.
 * Kadr wymyślony pod nagłówek byłby portfolio, którego nie mamy (pkt 4.1
 * briefu SEO/GEO).
 */
const USE_CASES: {
  heading: string;
  text: string;
  /** Kadr aranżacyjny z biblioteki — jeśli istnieje dla tej sytuacji */
  shot?: ShowcaseShot;
  /** Kolor zdjęcia produktowego — używany, gdy kadru aranżacyjnego nie ma */
  colorId?: string;
}[] = [
  {
    heading: 'Korespondencja firmowa i dokumenty',
    text: 'Pismo, umowa i faktura złożone na trzy wchodzą do koperty DL bez dodatkowego zagięcia. Koperta ozdobna zamiast białej pocztowej sprawia, że przesyłka nie ląduje na stosie z reklamami.',
    shot: shotByFile('granatowa-koperta-dl-nadruk-logo-kancelarii'),
  },
  {
    heading: 'Vouchery i bony podarunkowe',
    text: 'Bon w kopercie ozdobnej z logo wygląda jak prezent, a nie jak wydruk z drukarki biurowej. To najczęstszy powód, dla którego salony, kliniki i restauracje sięgają po koperty kolorowe — obdarowany dostaje coś, co chce się otworzyć.',
    shot: shotByFile('czerwona-koperta-dl-nadruk-logo-restauracji'),
  },
  {
    heading: 'Zaproszenia i programy wydarzeń',
    text: `Zaproszenie składane i program wydarzenia wysyłamy dziś w kopercie DL. Na zaproszenia kwadratowe i w formacie A6 potrzebne są koperty ${UPCOMING_LABEL_SHORT}, które mają w katalogu status „Dostępne wkrótce".`,
    shot: shotByFile('granatowa-koperta-dl-nadruk-logo-orkiestry'),
  },
  {
    heading: 'Wysyłki VIP i prezentowe',
    text: 'Kiedy przesyłka ma zostać zapamiętana, wybierane są odcienie, których nie widuje się codziennie na biurku: Matcha, Błękit Łupkowy albo Złoty z metalicznym połyskiem.',
    shot: shotByFile('zlota-koperta-dl-nadruk-logo-studia-tatuazu'),
  },
  {
    heading: 'Certyfikaty, dyplomy i podziękowania',
    text: 'Certyfikat A4 złożony na trzy mieści się w kopercie DL. Jedna edycja kursu albo pojedyncza grupa szkoleniowa to już wystarczający nakład — nie trzeba czekać, aż uzbiera się większe zamówienie.',
    colorId: 'ecru',
  },
  {
    heading: 'Koperty na pieniądze i nagrody',
    text: 'Premia, nagroda w konkursie pracowniczym i prezent okolicznościowy trafiają do koperty DL, bo banknot mieści się w niej płasko, bez składania. Nie trzeba przy tym kupować opakowania zbiorczego.',
    colorId: 'srebrna-perlowa',
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
  /* Bez kwoty w tytule — decyzja właściciela z 17 sierpnia 2026: cena należy
     do cennika i paska faktów, nie do nagłówka wyniku wyszukiwania. */
  title: `Koperty ozdobne i kolorowe DL w ${COLORS.length} kolorach | Envelopes`,
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

      {/* ═══════════════════════════════════════════════════════════════
          Dokument pod konfiguratorem — dwanaście numerowanych rozdziałów.

          Konfigurator kończy część transakcyjną strony. Wszystko poniżej
          jest materiałem do czytania, a materiał do czytania rządzi się
          inną logiką niż narzędzie: potrzebuje spisu, marginaliów i formy
          dobranej do tego, czym akurat jest dany fragment.

          `.home-doc` jest kotwicą stylów dla całego pasa (`home.css`).
          Wszystkie reguły redesignu schodzą po tej klasie, więc strony
          filarowe i blog korzystają z niezmienionych klas wspólnych.
          ═══════════════════════════════════════════════════════════════ */}
      <div className="home-doc">
        {/* ── 01 Papier z bliska — realne zdjęcia detali z public/images/details ── */}
        <section className="section section-surface chapter" id="papier">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              {/* Numer rozdziału rysuje licznik CSS — w DOM nie przybywa
                  ani jednego znaku treści. */}
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Papier</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Papier kopert ozdobnych z bliska</h2>
                <p className="chapter-lead">
                  Cztery kadry pokazują to, czego nie widać na zdjęciu całej koperty: barwienie
                  w masie, matową fakturę, wykończenie metaliczne i papier grubszy od standardu.
                  Kliknięcie w zdjęcie otwiera konfigurator z tym odcieniem.
                </p>
              </div>

              {/* `tile-gallery`: kadr i podpis w jednej ramce, więc widać, że
                  cały kafel jest odnośnikiem do konfiguratora. */}
              <div className="grid grid-4 tile-gallery m-snap">
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
                            przed pobraniem, więc sekcja nie generuje CLS (pkt 5.5).
                            `sizes` policzone dla kolumny zwężonej o marginalia
                            rozdziału: 1152 − 152 − 32 px kontenera na 4 kadry. */}
                        <img
                          src={`/images/details/${shot.file}-1024.webp`}
                          srcSet={`/images/details/${shot.file}-512.webp 512w, /images/details/${shot.file}-1024.webp 1024w`}
                          sizes="(max-width: 720px) 78vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1080px) calc(25vw - 30px), 224px"
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

              <p className="chapter-note">
                Cztery różne papiery, jedna i ta sama koperta. Wykończenie nie wpływa na cenę, więc
                wybór między nimi jest decyzją wizerunkową, a nie budżetową.
              </p>
            </div>
          </div>
        </section>

        {/* ── 02 Formaty — status dostępności podany wprost (pkt 4.2 briefu) ── */}
        <section className="section chapter" id="formaty">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Formaty</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Formaty kopert — co da się zamówić dziś</h2>
                <p className="chapter-lead">
                  W sprzedaży jest dziś jeden format: koperta DL {DL.dimensions}. Koperty{' '}
                  {UPCOMING_LABEL} mają w katalogu Envelopes status „Dostępne wkrótce" i nie można
                  ich zamówić — ani gładkich, ani z nadrukiem. Wszystkie nasze koperty są bez
                  okienka adresowego, więc nadruk i adres mogą objąć całą przednią ściankę.
                </p>
              </div>

              {/* Tabela statusu — trzy kolumny i nic więcej (keywords.md, rozgraniczenie
                  K3 ↔ K4). Kolumna „co się zmieści" i porównanie wkładek należą do
                  `/koperty-dl`; strona główna podaje wyłącznie wymiar i dostępność,
                  bo bez tego obiecywałaby produkt, którego konfigurator nie przyjmie.
                  Cena stoi tylko przy formacie dostępnym — cennik zapowiedzianego
                  formatu byłby obietnicą nie do zrealizowania. */}
              {/* `m-cards`: tabela ma `min-width`, więc na telefonie czytało
                  się ją bokiem. Na mobile każdy wiersz staje się kartą, a `data-label`
                  zastępuje ukryty nagłówek kolumny. Znaczniki zostają tabelaryczne,
                  więc czytnik ekranu nadal dostaje pełne powiązanie danych.
                  `data-status` niesie wyłącznie prezentację: lakowa krawędź przy
                  formacie w sprzedaży, papierowe tło przy zapowiedzianym. */}
              <div className="table-wrap m-cards spec-ledger">
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
                      <tr key={format.id} data-status="live">
                        <th scope="row">{format.id}</th>
                        <td data-label="Wymiary">
                          <span className="figure">{format.dimensions}</span>
                        </td>
                        <td data-label="Cena od">
                          <span className="figure">
                            {formatPrice(DEFAULT_PRICING.base[format.id])}
                          </span>{' '}
                          brutto/szt.
                        </td>
                        <td data-label="Status">
                          <span className="avail avail-live">W sprzedaży</span>
                        </td>
                      </tr>
                    ))}
                    {UPCOMING_FORMATS.map((format) => (
                      <tr key={format.id} data-status="soon">
                        <th scope="row">{format.id}</th>
                        <td data-label="Wymiary">
                          <span className="figure">{format.dimensions}</span>
                        </td>
                        <td className="muted" data-label="Cena od">
                          —
                        </td>
                        <td data-label="Status">
                          <span className="avail avail-soon">Dostępne wkrótce</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="chapter-note">
                Format DL mieści kartkę A4 złożoną na trzy, czyli 99 × 210 mm, voucher w tym samym
                wymiarze oraz złożony program wydarzenia. To wymiar, który obsługuje zdecydowaną
                większość korespondencji firmowej — pisma, umowy, faktury i bony podarunkowe. Pełną
                tabelę dopasowań i porównanie z formatami C6 i K4 znajdą Państwo na stronie{' '}
                <Link href="/koperty-dl">wymiary kopert DL</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 Cennik kopert gładkich — filar K1 trzyma cennik nadruku ──
            Rozdział ma jedną liczbę, po którą się tu wchodzi, więc dostaje
            formę wklejki z perforacją: kartka z ceną wyrwana z dokumentu.
            Treść bez zmian — zmienia się wyłącznie skala, w jakiej cena
            jest podana. */}
        <section className="section chapter" id="cennik">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Cennik</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Ile kosztują koperty ozdobne</h2>
              </div>

              {/* Infografika cenowa. Cały rozdział sprowadza się do jednej
                  liczby, więc liczba stoi w skali, w której czyta się ją
                  z odległości ekranu, a obok niej trzy fakty sprawdzane zaraz
                  po cenie: czy kolor kosztuje dodatkowo, od ilu sztuk i ile
                  dochodzi za wysyłkę. Wszystkie kwoty pochodzą z `pricing.ts`
                  — żadna nie jest wpisana ręcznie. */}
              <div className="plate plate-tearoff price-figure">
                <div className="price-figure-head">
                  <div className="price-figure-main">
                    <span className="price-figure-value">{formatPrice(plain.unitTotal)}</span>
                    <span className="price-figure-unit">brutto za sztukę</span>
                    <span className="price-figure-net">{formatPrice(plain.net)} netto</span>
                  </div>

                  <ul className="price-figure-facts">
                    <li>
                      <span className="figure">{COLORS.length}</span>
                      <span>kolorów w tej samej cenie</span>
                    </li>
                    <li>
                      <span className="figure">{DEFAULT_PRICING.moqWithoutPrint} szt.</span>
                      <span>minimum zamówienia</span>
                    </li>
                    <li>
                      <span className="figure">{formatPrice(DELIVERY_COST)}</span>
                      <span>kurier za zamówienie</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* Treść bez zmian, ale w roli drobnego druku: infografika mówi
                  to samo szybciej, a akapity zostają dla tych, którzy chcą
                  pełnego zdania — i dla wyszukiwarki. */}
              <div className="chapter-fineprint">
                <p>
                  Gładka koperta ozdobna kosztuje{' '}
                  <strong>{formatPrice(plain.unitTotal)} brutto</strong> ({formatPrice(plain.net)}{' '}
                  netto) za sztukę — tyle samo w każdym z {COLORS.length} kolorów. Rabatów
                  ilościowych nie stosujemy, więc cena za sztukę przy dziesięciu kopertach i przy
                  tysiącu jest ta sama; do zamówienia dochodzi jednorazowo{' '}
                  {formatPrice(DELIVERY_COST)} brutto za kuriera.
                </p>
                <p>
                  Koperty bez nadruku nie przechodzą przez produkcję, więc dopłata za ekspres ich
                  nie dotyczy — jadą w tym samym terminie zawsze. Dokładną kwotę dla swojej ilości
                  zobaczą Państwo w konfiguratorze, zanim cokolwiek zamówią.
                </p>
              </div>

              <div className="row" style={{ marginTop: 'var(--space-6)' }}>
                <ConfigureLink format="DL" className="btn">
                  Sprawdź cenę swojej ilości
                </ConfigureLink>
                <Link href="/kontakt#wycena" className="btn btn-secondary">
                  Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 Usługi — rozdzielnik ruchu do filarów K1 i K2 ── */}
        <section className="section section-surface chapter" id="uslugi">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Usługi</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Nadruk logo i personalizacja kopert</h2>
                <p className="chapter-lead">
                  Do gładkiej koperty można dołożyć dwie rzeczy: logo firmy albo dane odbiorcy
                  drukowane wprost na kopercie. Obie usługi kończą się wizualizacją — do druku
                  idzie wyłącznie to, co Państwo zaakceptują, więc niespodzianek po otwarciu paczki
                  nie ma.
                </p>
              </div>

              {/* Infografika usług. Obie usługi opisuje ten sam komplet
                  parametrów — dopłata, próg, termin, wizualizacja — więc
                  stoją w identycznej matrycy i dają się porównać wzrokiem
                  wiersz po wierszu. Dopłata jest jedyną liczbą, po którą
                  się tu wchodzi, i dostaje skalę adekwatną do tej roli.

                  Rozbicia ceny nadruku na czynniki tu nie ma i być nie może:
                  ten materiał należy do filara `/koperty-z-nadrukiem`
                  (antykanibalizacja, komentarz na górze pliku). Matryca podaje
                  te same wartości, które sekcja podawała dotąd w jednym
                  wierszu mono. */}
              <div className="service-grid">
                <div className="plate service-panel">
                  <h3>Nadruk logo firmowego</h3>

                  <div className="service-figure">
                    <span className="service-figure-value">
                      +{formatPrice(DEFAULT_PRICING.print)}
                    </span>
                    <span className="service-figure-unit">brutto/szt.</span>
                  </div>

                  <dl className="service-specs">
                    <div>
                      <dt>Od</dt>
                      <dd>{DEFAULT_PRICING.moqWithPrint} szt.</dd>
                    </div>
                    <div>
                      <dt>Realizacja</dt>
                      {/* Termin ekspresowy stoi przy terminie standardowym,
                          a nie w osobnym wierszu: to jest alternatywa dla tej
                          samej pozycji, więc czyta się ją razem z nią. */}
                      <dd>
                        {DEFAULT_PRICING.leadDaysStandard} dni roboczych
                        <span className="service-specs-note">
                          albo {DEFAULT_PRICING.leadDaysExpress} dni w ekspresie
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Wizualizacja</dt>
                      <dd>przed drukiem</dd>
                    </div>
                  </dl>

                  <p className="service-copy">
                    Drukujemy logo, dane kontaktowe albo całą grafikę na przedniej ściance koperty.
                    Odcień papieru nie zmienia ceny nadruku — na czarnej kopercie kosztuje tyle
                    samo, co na białej. Cennik, listę przyjmowanych plików i proces krok po kroku
                    opisaliśmy na stronie <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
                  </p>

                  <div className="row">
                    <ConfigureLink format="DL" print className="btn btn-sm">
                      Wyceń koperty z nadrukiem
                    </ConfigureLink>
                  </div>
                </div>

                <div className="plate service-panel">
                  <h3>Personalizacja i adresowanie</h3>

                  <div className="service-figure">
                    <span className="service-figure-value">
                      +{formatPrice(DEFAULT_PRICING.personalization)}
                    </span>
                    <span className="service-figure-unit">brutto/szt.</span>
                  </div>

                  <dl className="service-specs">
                    <div>
                      <dt>Od</dt>
                      <dd>{DEFAULT_PRICING.moqWithPrint} szt.</dd>
                    </div>
                    <div>
                      <dt>Realizacja</dt>
                      {/* Termin ekspresowy stoi przy terminie standardowym,
                          a nie w osobnym wierszu: to jest alternatywa dla tej
                          samej pozycji, więc czyta się ją razem z nią. */}
                      <dd>
                        {DEFAULT_PRICING.leadDaysStandard} dni roboczych
                        <span className="service-specs-note">
                          albo {DEFAULT_PRICING.leadDaysExpress} dni w ekspresie
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt>Wizualizacja</dt>
                      <dd>przed drukiem</dd>
                    </div>
                  </dl>

                  <p className="service-copy">
                    Każda koperta w partii wychodzi z innymi danymi, a pismo na wszystkich jest to
                    samo — równe tak, jak nie wyjdzie żadną ręką. Drukujemy pełny adres, kiedy
                    przesyłka idzie pocztą, albo samo imię i nazwisko, kiedy koperty wręczają
                    Państwo osobiście. Dane przekazują Państwo wpisując je w konfiguratorze albo
                    wgrywając arkusz. Cennik, wymagania dla listy i proces krok po kroku opisaliśmy
                    na stronie <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
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

                  <div className="row">
                    <ConfigureLink format="DL" personalization className="btn btn-sm">
                      Wyceń koperty z adresowaniem
                    </ConfigureLink>
                  </div>
                </div>
              </div>

              {/* Ekspres dotyczy obu usług tak samo, więc jest paskiem pod
                  matrycą, a nie czwartym wierszem powtórzonym w dwóch
                  panelach. Terminy i dopłata czytane z `pricing.ts` — te same
                  wartości, którymi koszyk liczy datę dostawy. */}
              <div className="plate express-strip">
                <span className="express-tag">Ekspres</span>
                <p>
                  <strong>
                    +{formatPrice(DEFAULT_PRICING.express)} brutto/szt. — realizacja w{' '}
                    {DEFAULT_PRICING.leadDaysExpress} dni robocze zamiast{' '}
                    {DEFAULT_PRICING.leadDaysStandard}.
                  </strong>{' '}
                  Tryb ekspresowy wybiera się w koszyku i dotyczy zamówień z nadrukiem lub
                  personalizacją. Koperty gładkie nie przechodzą przez produkcję — jadą w{' '}
                  {DEFAULT_PRICING.leadDaysPlain} dni robocze bez dopłaty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 Proces (HowTo) ──
            Cztery kroki spięte jedną kreską z plakietkami na niej. Numer
            kroku zostaje tekstem, więc czytnik ekranu nadal go słyszy. */}
        <section className="section chapter" id="jak-to-dziala">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Jak to działa</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Jak zamówić koperty ozdobne</h2>
                <p className="chapter-lead">
                  Zamówienie przechodzi przez cztery kroki, z których jeden — akceptacja
                  wizualizacji — dotyczy wyłącznie kopert z nadrukiem lub personalizacją.
                </p>
              </div>

              <div className="flow">
                {HOW_TO_STEPS.map((step, index) => (
                  <div className="flow-step" key={step.name}>
                    <span className="eyebrow">Krok {index + 1}</span>
                    <h3>{step.name}</h3>
                    <p className="small muted">{step.text}</p>
                  </div>
                ))}
              </div>

              <p className="chapter-note">
                Termin realizacji liczymy od zaksięgowania wpłaty, a przy zamówieniach z nadrukiem
                dodatkowo od akceptacji wizualizacji. Przy przelewie tradycyjnym prosimy doliczyć
                czas księgowania; przy fakturze z odroczonym terminem realizacja rusza bez
                oczekiwania na wpłatę.
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
          </div>
        </section>

        {/* ── 06 Zastosowania — celowo zastosowania, nie branże (branże trzyma filar K1) ──
            Sześć kart w pudełkach zamienia się w spis pozycji: kreska, numer,
            nagłówek, zdanie. To nie jest sześć produktów do porównania, tylko
            sześć sytuacji do przejrzenia wzrokiem — ramki tylko by je od
            siebie oddzielały, zamiast pomagać czytać. */}
        <section className="section chapter" id="zastosowania">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Zastosowania</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Do czego używa się kopert ozdobnych</h2>
                <p className="chapter-lead">
                  Koperta ozdobna zastępuje białą kopertę pocztową wszędzie tam, gdzie odbiorca ma
                  zapamiętać nadawcę. Sześć sytuacji, w których sięga się po nią najczęściej.
                </p>
              </div>

              {/* Każde zastosowanie ma kadr i jest wejściem do konfiguratora
                  z ustawionym kolorem i usługą z tego kadru — kliknięcie
                  w „Vouchery" otwiera czerwoną kopertę z włączonym nadrukiem,
                  a nie pusty krok pierwszy.

                  `alt` bierzemy z `showcase.ts`, więc opis kadru jest ten sam
                  na każdej stronie, na której ten plik stoi. Zdjęcia ładują
                  się leniwie i mają jawne wymiary — sekcja nie generuje CLS. */}
              <div className="usecase-grid m-snap">
                {USE_CASES.map((useCase) => {
                  const shot = useCase.shot;
                  const colorId = shot?.colorId ?? useCase.colorId ?? 'ecru';
                  return (
                    <ConfigureLink
                      key={useCase.heading}
                      format="DL"
                      color={colorId}
                      print={shot?.variant === 'nadruk'}
                      personalization={shot?.variant === 'personalizacja'}
                      className="usecase-card"
                      title={`${useCase.heading} — otwórz konfigurator z tą konfiguracją`}
                    >
                      <div className="usecase-frame">
                        {shot ? (
                          <img
                            src={`/images/zastosowania/${shot.file}-1024.webp`}
                            srcSet={`/images/zastosowania/${shot.file}-512.webp 512w, /images/zastosowania/${shot.file}-1024.webp 1024w`}
                            sizes="(max-width: 720px) 78vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1080px) calc(33.3vw - 32px), 306px"
                            width={1024}
                            height={1024}
                            alt={shot.alt}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <EnvelopePlaceholder
                            format="DL"
                            colorId={colorId}
                            ratio="photo"
                            hideCaption
                            size="sm"
                            sizes="(max-width: 720px) 78vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1080px) calc(33.3vw - 32px), 306px"
                          />
                        )}
                      </div>

                      <div className="usecase-body">
                        <h3>{useCase.heading}</h3>
                        <p>{useCase.text}</p>
                      </div>
                    </ConfigureLink>
                  );
                })}
              </div>

              {/* Trzy kadry okolicznościowe — jedyne miejsce w serwisie, gdzie
                  nadruk pokazany jest w roli innej niż firmowa. Wszystkie trzy to
                  format DL, czyli ten, który da się dziś kupić; koperty C6 i K4 ze
                  statusem „Dostępne wkrótce" nie występują na żadnym z nich. */}
              <div className="subhead">
                <h3>Nadruk okolicznościowy na kopercie DL</h3>
                <p>
                  Nadruk nie musi być logo firmy. Równie dobrze drukujemy jedno słowo — nazwę
                  uroczystości albo imię — na tych samych zasadach co znak firmowy.
                </p>
              </div>

              <div className="tile-gallery" style={{ marginTop: 'var(--space-5)' }}>
                <ShowcaseGrid shots={OCCASION_SHOTS} columns={3} spec="none" />
              </div>

              {/* Odesłanie do filara K7 wewnątrz sekcji tematycznej — bez tworzenia
                  osobnego rozdzielnika, który odsunąłby paletę kolorów w dół. */}
              <p className="chapter-note">
                Bony sprzedają się sezonowo i zamawia się je całymi seriami pod jedną akcję. Kiedy
                złożyć zamówienie, żeby zdążyć przed szczytem, i ile kosztuje gotowa seria —
                opisaliśmy na stronie <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* ── 07 Realizacje — realne zdjęcia z public/images/prints i personalized ── */}
        <section className="section section-surface chapter" id="realizacje">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Realizacje</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Przykłady nadruku i personalizacji na kopertach DL</h2>
                <p className="chapter-lead">
                  Zdjęcia poniżej pokazują koperty DL wykonane w naszej produkcji — z nadrukiem
                  logo i z adresowaniem. Cennik, specyfikację i proces akceptacji opisaliśmy na
                  stronach <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link> oraz{' '}
                  <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
                </p>
              </div>

              {/* Kafel próbki: kadr wypełnia górę ramki, podpis siedzi na
                  papierowej plakietce pod kreską. Wcześniej zdjęcie i podpis
                  pływały w karcie z paddingiem i nie tworzyły jednego
                  przedmiotu. */}
              <div className="sample-grid m-snap m-snap-sm">
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
                      className="sample"
                      title={`${label} — otwórz konfigurator z tą konfiguracją`}
                    >
                      <EnvelopePlaceholder
                        format="DL"
                        colorId={item.colorId}
                        ratio="photo"
                        hasPrint={item.variant === 'nadruk'}
                        hasPersonalization={item.variant === 'personalizacja'}
                        hideCaption
                        size="sm"
                        sizes="(max-width: 720px) 62vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1080px) calc(33.3vw - 32px), 224px"
                      />
                      {/* Podpis mówi o usłudze, nie o wariancie papieru — kolor
                          i gramaturę wybiera się w konfiguratorze. */}
                      <div className="sample-body">
                        <strong>
                          Koperta DL {item.variant === 'nadruk' ? 'z nadrukiem' : 'z personalizacją'}
                        </strong>
                        <span className="small muted">{item.note}</span>
                      </div>
                    </ConfigureLink>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 Koperty ozdobne / paleta — właściciel frazy głównej K3.
               Sekcja stoi poniżej zdjęć: najpierw produkt na zdjęciu i cena,
               dopiero potem pełna specyfikacja palety. Kotwica `#kolory`
               jest linkowana ze stopki i ze stron filarowych.

               Poziomy scroller pokazywał na szerokim ekranie siedem odcieni
               z dziewiętnastu, a rozdział sprzedaje właśnie to, że jest ich
               dziewiętnaście i wszystkie kosztują tyle samo. Tablica pokazuje
               komplet bez jednego ruchu. ── */}
        <section className="section chapter" id="kolory">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Paleta Kolorów</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Koperty ozdobne w {COLORS.length} kolorach — jedna cena za każdy odcień</h2>
                <p className="chapter-lead">
                  Koperty ozdobne różnią się od pocztowych papierem: zamiast białego offsetu jest
                  papier barwiony w masie, więc kolor sięga w głąb arkusza i nie znika na zagięciu
                  klapki. Wszystkie {COLORS.length} odcieni kosztuje tyle samo — również te
                  perłowe, metaliczne i eko. Kolor wybierają Państwo pod markę albo pod okazję, nie
                  pod budżet.
                </p>
              </div>

              <p>
                Zamawiać można bez opakowań zbiorczych i bez progów ilościowych. Kliknięcie w kolor
                otwiera konfigurator z zaznaczonym odcieniem.
              </p>

              <div className="palette-board" style={{ marginTop: 'var(--space-5)' }}>
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

              <div className="subhead">
                <h3>Gramatura i wykończenie {COLORS.length} kolorów kopert DL</h3>
                <p>
                  Im grubszy papier, tym lepiej koperta znosi drogę w przesyłce zbiorczej.
                  Najgrubszy w ofercie jest Taupe ({weightLabel('taupe')}), a cała paleta rozkłada
                  się tak: {WEIGHT_SUMMARY}. Plakietkę „Bestseller" ma {BESTSELLERS.length} odcieni
                  zamawianych najczęściej.
                </p>
              </div>

              <p className="chapter-note">
                Część odcieni funkcjonuje w rozmowie pod nazwami potocznymi. Koperta beżowa to
                w naszym katalogu Ecru albo Taupe, kremowa — Ecru, grafitowa — Czarny, butelkowa —
                Ciemnozielony, a pudrowa — Różowa. W konfiguratorze, na fakturze i w potwierdzeniu
                zamówienia obowiązuje wyłącznie nazwa katalogowa, żeby wszystkie dokumenty opisywały
                ten sam produkt.
              </p>

              <div className="row" style={{ marginTop: 'var(--space-6)' }}>
                <ConfigureLink format="DL" className="btn">
                  Wybierz kolor koperty
                </ConfigureLink>
              </div>
            </div>
          </div>
        </section>

        {/* ── 09 Dla firm — bariera rozliczeniowa, nie produktowa ──
            Pięć warunków handlowych ustawionych jak pozycje na fakturze:
            kreska rozdziela je tak samo, jak rozdziela wiersze dokumentu
            księgowego. Ten rozdział czytają osoby, które muszą sprawdzić,
            czy ich obieg zakupowy przejdzie — a nie zachwycić się kartą. */}
        <section className="section chapter" id="dla-firm">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Dla firm i instytucji</span>
            </div>

            <div className="chapter-main">
              <div className="plate ledger">
                <div>
                  <h2>Rozliczenie dopasowane do obiegu dokumentów</h2>
                  <p className="small">
                    Fakturę VAT wystawiamy do każdego zamówienia, także przy zakupie bez numeru
                    NIP. Faktura z odroczonym terminem płatności 14 dni jest dostępna dla
                    instytucji publicznych i urzędów, których obieg zakupowy nie przewiduje
                    przedpłaty. Taka faktura nie wstrzymuje realizacji — zamówienie rusza bez
                    oczekiwania na wpłatę. Pozostali klienci płacą z góry: BLIK-iem, kartą lub
                    przelewem.
                  </p>
                  <ul className="ledger-list">
                    <li>Faktura VAT do każdego zamówienia, także przy zakupie bez NIP.</li>
                    <li>Odroczony termin płatności 14 dni, bez wstrzymywania realizacji.</li>
                    <li>
                      Stała cena jednostkowa — {formatPrice(plain.unitTotal)} brutto za kopertę DL
                      niezależnie od wielkości zamówienia.
                    </li>
                    <li>Zapisane konfiguracje i ponowne zamówienie jednym kliknięciem.</li>
                    <li>
                      Powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk ustalamy
                      harmonogram dostaw indywidualnie.
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
                <EnvelopePlaceholder
                  format="DL"
                  colorId="granatowy"
                  ratio="photo"
                  hideCaption
                  sizes="(max-width: 900px) 320px, (max-width: 1080px) calc(35vw - 60px), 330px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── 10 FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
        <section className="section section-surface chapter chapter-narrow" id="faq">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Pytania</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Najczęstsze pytania o koperty ozdobne</h2>
              </div>

              <div className="faq-list">
                {FAQ_ITEMS.map((item) => (
                  <details className="faq-item" key={item.question}>
                    <summary>
                      <h3 style={{ display: 'inline', fontFamily: 'inherit' }}>{item.question}</h3>
                    </summary>
                    <div className="faq-answer">{item.answer}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 11 Blog ── */}
        <section className="section chapter" id="blog">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Blog</span>
            </div>

            <div className="chapter-main">
              <div className="journal-head">
                <div className="chapter-head" style={{ marginBottom: 0 }}>
                  <h2>Poradniki o kopertach i korespondencji firmowej</h2>
                </div>
                <Link href="/blog" className="btn btn-secondary">
                  Wszystkie wpisy
                </Link>
              </div>

              <div className="journal m-snap">
                {posts.map((post) => (
                  <article className="post-card" key={post.slug}>
                    <EnvelopePlaceholder
                      format={post.format}
                      colorId={post.colorId}
                      ratio="wide"
                      hideCaption
                      size="sm"
                      sizes="(max-width: 720px) 78vw, (max-width: 900px) calc(50vw - 36px), (max-width: 1080px) calc(33.3vw - 32px), 306px"
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
          </div>
        </section>

        {/* ── 12 SEO Section — przechowuje pierwotne, rozbudowane opisy SEO przeniesione z Hero ──
            Kolofon: dwie kolumny drobnego pisma rozdzielone kreską. Rozdział
            zamyka dokument, więc celowo nie walczy o uwagę z wezwaniem, które
            stoi zaraz pod nim. */}
        <section className="section chapter" id="o-kopertach">
          <div className="container chapter-inner">
            <div className="chapter-rail">
              <span className="chapter-index" aria-hidden="true" />
              <span className="eyebrow">Szczegóły produktu</span>
            </div>

            <div className="chapter-main">
              <div className="chapter-head">
                <h2>Więcej o kopertach ozdobnych dla firm</h2>
              </div>

              <div className="colophon">
                <div>
                  <p>
                    Po koperty ozdobne sięga się wtedy, gdy sama przesyłka ma coś powiedzieć
                    o nadawcy: przy zaproszeniu, bonie podarunkowym, piśmie do klienta, którego nie
                    chce się zgubić w stosie poczty. Papier barwiony w masie robi tu całą robotę —
                    biała koperta z okienkiem tego nie udźwignie. Co się w kopercie zmieści i czym
                    różni się od pozostałych formatów, opisaliśmy na stronie{' '}
                    <Link href="/koperty-dl">koperty DL {DL.dimensions}</Link>.
                  </p>
                </div>
                <div>
                  <p>
                    Zamawianie ma być krótsze niż wybieranie koloru. Cenę widzą Państwo od razu,
                    bez zapytania ofertowego i bez czekania na odpowiedź handlowca. Fakturę VAT
                    wystawiamy do każdego zamówienia, a instytucje publiczne i urzędy mogą zapłacić
                    po terminie — zamówienie rusza wtedy od razu, nie po zaksięgowaniu przelewu.
                    Więcej o tym, kim jesteśmy i jak pracujemy —{' '}
                    <Link href="/o-nas">o nas</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Finalne CTA ──
            Jedyny ciemny element pasa i jedyne miejsce, w którym wraca
            ziarno z hero i ze strefy konfiguratora. */}
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
      </div>

      {/* Dolny pasek akcji — tylko mobile. Trzyma cenę wyjściową i wejście do
          konfiguratora w zasięgu kciuka przez całą długość strony. */}
      <MobileCta price={formatPrice(plain.unitTotal)} />
    </>
  );
}
