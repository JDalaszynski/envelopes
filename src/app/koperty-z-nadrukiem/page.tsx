import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPost } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import {
  INDUSTRY_SHOTS,
  PRINT_AREA_SHOT,
  showcaseCaption,
  showcaseLinkTitle,
  showcaseSrc,
  showcaseSrcSet,
} from '@/lib/showcase';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  PRINT_FILE_EXTENSIONS_LABEL,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
  PRINT_SAFE_MARGIN_MM,
} from '@/lib/catalog';
import { colorPagePath, colorPages } from '@/lib/color-pages';
import { PRINT_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  ogImage,
  printedEnvelopeProductJsonLd,
  productId,
  webPageJsonLd,
} from '@/lib/seo';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Filar klastra K1 — „koperty z nadrukiem" (keywords.md, content-plan.md poz. 1).
 *
 * Strona przejmuje intencję transakcyjną, którą wcześniej rozmywały strona
 * główna i wpis blogowy o przygotowaniu plików. Wszystkie liczby pochodzą
 * z `pricing.ts` i `catalog.ts` — treść nie może rozjechać się z konfiguratorem.
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
const printedPersonalized = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });
const printedExpress = calculatePrice({ ...BASE_CONFIG, print: true, shippingSpeed: 'ekspres' });

/** Cena netto pojedynczego składnika — ten sam VAT co w kalkulatorze. */
function net(gross: number): number {
  return round2(gross / (1 + DEFAULT_PRICING.vatRate));
}

const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 100, 500, 1000];

/** Kolory, dla których mamy realne zdjęcie koperty z nadrukiem (pkt 3.3 briefu). */
const PRINT_COLORS = COLORS.filter((color) => color.printImages?.DL);

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

const FILE_MAX_MB = Math.round(PRINT_FILE_MAX_BYTES / (1024 * 1024));

const HOW_TO_STEPS = [
  {
    name: 'Konfiguracja zamówienia',
    text: `W konfiguratorze wybierają Państwo format DL ${DL.dimensions}, kolor koperty i ilość od ${DEFAULT_PRICING.moqWithPrint} sztuk, po czym włączają opcję nadruku i wgrywają plik z logo. Cena aktualizuje się przy każdej zmianie.`,
  },
  {
    name: 'Płatność',
    text: 'Do wyboru są BLIK, karta, szybki przelew i przelew tradycyjny. Instytucje publiczne i urzędy mogą zapłacić fakturą z odroczonym terminem płatności 14 dni — taka faktura nie wstrzymuje produkcji.',
  },
  {
    name: 'Akceptacja wizualizacji',
    text: 'Nasz grafik przygotowuje wizualizację koperty z Państwa logo i przesyła ją e-mailem. Do druku kierujemy wyłącznie wersję zaakceptowaną — uwagi zgłaszają Państwo w tym samym widoku.',
  },
  {
    name: 'Druk i wysyłka',
    text: `Koperty z nadrukiem wysyłamy kurierem w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w ${DEFAULT_PRICING.leadDaysExpress} dni robocze. Numer przesyłki pojawia się w panelu zamówień.`,
  },
];

/**
 * Sekcja „Dla kogo" mówi językiem branży, nie językiem cennika. Każdy akapit
 * opisuje sytuację, w której koperta z logo coś załatwia — cena, gramatura
 * i progi ilościowe mają swoje miejsce w tabelach niżej i nie muszą wracać
 * w każdym z dziesięciu akapitów.
 */
const INDUSTRIES: { heading: string; text: string }[] = [
  {
    heading: 'Kancelarie prawne i notarialne',
    text: 'Pismo procesowe złożone na trzy wchodzi do koperty DL bez dodatkowego zagięcia. Do korespondencji formalnej wybierane są kolory stonowane — czerń, granat i szarobrązowy — bo koperta ma wyglądać poważnie, zanim ktokolwiek ją otworzy.',
  },
  {
    heading: 'Biura rachunkowe i doradztwo finansowe',
    text: 'Sprawozdania roczne i raporty z audytu wychodzą do klientów w powtarzalnych partiach, zwykle w tym samym tygodniu każdego kwartału. Ten sam projekt nadruku zamawia się wtedy raz i wraca do niego przy kolejnej wysyłce.',
  },
  {
    heading: 'Hotele, resorty i pensjonaty',
    text: 'Kartę powitalną i voucher pobytowy wręcza się gościowi do ręki, więc koperta jest częścią pobytu, a nie opakowaniem transportowym. Zmieści się w niej zarówno bon, jak i list na papierze firmowym złożony na trzy.',
  },
  {
    heading: 'Kliniki medycyny estetycznej i salony SPA',
    text: 'Bon na zabieg jest prezentem, więc wybierane są jasne odcienie — Biała Perłowa, Ecru, Biały. Logo kliniki na kopercie robi różnicę między prezentem a wydrukiem z drukarki biurowej.',
  },
  {
    heading: 'Agencje eventowe, PR i kreatywne',
    text: 'Wysyłki VIP i zaproszenia na premiery potrzebują koloru, którego nie ma konkurencja: Matcha, Jeansowy albo Złoty z metalicznym połyskiem. Kiedy data wydarzenia jest bliżej, niż byśmy chcieli, zamówienie da się puścić trybem ekspresowym.',
  },
  {
    heading: 'Biura nieruchomości i deweloperzy',
    text: 'Umowa deweloperska i akt notarialny to ostatnia rzecz, jaką klient zabiera ze sobą po transakcji. Koperta z logo biura sprawia, że komplet dokumentów wygląda jak domknięcie sprawy, a nie jak plik kartek.',
  },
  {
    heading: 'Salony samochodowe',
    text: 'Dokumenty pojazdu i umowy leasingowe przekazywane są przy odbiorze auta — momencie, który klient zapamiętuje. Koperta z logo dilera porządkuje ten komplet i chroni go przed zagięciem w drodze do domu.',
  },
  {
    heading: 'Uczelnie, szkoły i firmy szkoleniowe',
    text: 'Certyfikaty i podziękowania dla sponsorów idą w seriach — czasem kilkuset, czasem kilkunastu. Dyplomy dla jednej grupy szkoleniowej też da się zamówić z logo uczelni, bez czekania, aż uzbiera się cały rocznik.',
  },
  {
    heading: 'Restauracje fine dining i winiarnie',
    text: 'Vouchery na kolację degustacyjną sprzedają się sezonowo, ze szczytem w grudniu. Koperta z logo restauracji zamienia wydrukowany bon w prezent, który da się komuś wręczyć bez tłumaczenia się z opakowania.',
  },
  {
    heading: 'Galerie sztuki i domy aukcyjne',
    text: 'Certyfikaty autentyczności i zaproszenia na wernisaże trafiają do wąskiej, stałej listy odbiorców. Logo galerii można połączyć z nadrukiem nazwiska adresata — przy takiej liście imienna koperta jest normą, nie fanaberią.',
  },
];

export const metadata: Metadata = {
  /* „brutto" schodzi z tytułu do description — razem z szablonem `| Envelopes`
     tytuł przekraczał 60 znaków. Liczba kolorów czytana z katalogu, nie
     wpisana z pamięci: `19` w tekście rozjechałoby się przy zmianie palety. */
  /* Bez kwoty w tytule — decyzja właściciela z 17 sierpnia 2026. Cena stoi
     w pasku faktów, w tabeli cennika i w `description`; nagłówek wyniku
     wyszukiwania niesie frazę i minimum zamówienia, czyli realną przewagę. */
  title: `Koperty z nadrukiem logo firmowego od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
  description: `Profesjonalne koperty z nadrukiem ułatwią komunikację z klientem. Wyróżnij swoją markę wybierając eleganckie koperty firmowe z nadrukiem oraz koperty z logo firmy. Poznaj pełną ofertę i zleć nam realizację.`,
  /* `koperty z nadrukiem cena` przeszła 17 sierpnia 2026 do wpisu
     `/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia` — jeden właściciel
     frazy na serwis. Filar zostaje przy frazie usługowej i transakcyjnej;
     sekcja `#cena` i pytanie cenowe w `PRINT_FAQ_ITEMS` zostają nietknięte. */
  keywords: [
    'koperty z nadrukiem',
    'koperty firmowe z nadrukiem',
    'koperty z logo firmy',
    'koperty z własnym nadrukiem',
    'koperty dl z nadrukiem',
  ],
  alternates: { canonical: '/koperty-z-nadrukiem' },
  openGraph: {
    type: 'website',
    title: 'Koperty z nadrukiem logo firmowego — Envelopes',
    description: `Profesjonalne koperty z nadrukiem ułatwią komunikację z klientem. Wyróżnij swoją markę wybierając eleganckie koperty firmowe z nadrukiem oraz koperty z logo firmy. Poznaj pełną ofertę i zleć nam realizację.`,
    url: '/koperty-z-nadrukiem',
    images: [
      ogImage(
        'koperty-z-nadrukiem',
        'Granatowa koperta DL z jasnym nadrukiem logo kancelarii prawnej na ciemnym drewnie'
      ),
    ],
  },
};

export default function PrintedEnvelopesPage() {
  const filesPost = getPost('jak-przygotowac-pliki-do-druku-na-kopertach');
  /* Wpis kosztowy z content-plan.md poz. 9 — liczy całe zamówienie razem
     z dostawą, czego ta strona nie robi (tu osią jest cena jednostkowa). */
  const costPost = getPost('cena-kopert-z-nadrukiem-i-koszt-zamowienia');
  /* Wpis o terminach z content-plan.md poz. 16 — ta strona podaje, ile dni
     trwa realizacja, wpis odpowiada na pytanie, od kiedy je liczymy i jak
     policzyć datę wysyłki wstecz od dnia wydarzenia. */
  const deadlinePost = getPost('szybka-realizacja-kopert-terminy-i-ekspres');
  const relatedPosts = [costPost, deadlinePost, filesPost].filter(
    (post): post is BlogPost => post !== undefined
  );

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: '/koperty-z-nadrukiem',
          type: 'ItemPage',
          name: String(metadata.title),
          description: String(metadata.description),
          mainEntityId: productId('/koperty-z-nadrukiem'),
          image: ogImage('koperty-z-nadrukiem', '').url,
          breadcrumb: true,
        })}
      />
      <JsonLd data={printedEnvelopeProductJsonLd()} />
      <JsonLd data={faqJsonLd(PRINT_FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak zamówić koperty z nadrukiem logo firmowego',
          description: `Profesjonalne koperty z nadrukiem ułatwią komunikację z klientem. Wyróżnij swoją markę wybierając eleganckie koperty firmowe z nadrukiem oraz koperty z logo firmy. Poznaj pełną ofertę i zleć nam realizację.`,
          steps: HOW_TO_STEPS,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty z nadrukiem', url: '/koperty-z-nadrukiem' },
        ])}
      />

      {/* ── Hero — blok odpowiedzi GEO + pierwsze CTA nad linią zgięcia ── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/hero-tlo-2015.webp" />
          <div className="container">
            <nav aria-label="Ścieżka nawigacji" className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty z nadrukiem
            </nav>

            <span className="eyebrow">Koperty firmowe</span>
            <h1>Koperty z nadrukiem logo firmowego</h1>
            <p className="hero-lead">
              Drukujemy logo firmowe na kopertach ozdobnych w {COLORS.length} kolorach, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk. Koperta z nadrukiem kosztuje{' '}
              {formatPrice(printed.unitTotal)} brutto za sztukę — na każdym odcieniu tyle samo.
              Zanim cokolwiek pójdzie do druku, dostają Państwo wizualizację do akceptacji.
            </p>

            <div className="row">
              <ConfigureLink format="DL" print className="btn btn-lg">
                Wyceń koperty z nadrukiem
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty akceptują Państwo przed drukiem. Do każdego zamówienia wystawiamy
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
                  title: `${formatPrice(printed.unitTotal)} brutto/szt.`,
                  note: `Koperta DL ${formatPrice(plain.unitTotal)} + nadruk ${formatPrice(DEFAULT_PRICING.print)}`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
                  note: 'Bez rabatów ilościowych — cena jednostkowa jest stała',
                },
                {
                  title: `${DEFAULT_PRICING.leadDaysStandard} dni roboczych`,
                  note: `Ekspres ${DEFAULT_PRICING.leadDaysExpress} dni za ${formatPrice(DEFAULT_PRICING.express)} brutto/szt.`,
                },
                {
                  title: '19 kolorów',
                  note: 'Perła i metalik w tej samej cenie co odcienie podstawowe',
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

      {/* ── Cena — najczęściej cytowany fragment tego typu strony (GEO) ── */}
      <section className="section section-surface" id="cena">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cennik</span>
            <h2>Ile kosztują koperty z nadrukiem</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperta z nadrukiem logo kosztuje{' '}
            <strong>{formatPrice(printed.unitTotal)} brutto</strong> ({formatPrice(printed.net)}{' '}
            netto) za sztukę. Składają się na to dwie pozycje — sama koperta i nadruk — rozpisane
            w tabeli niżej. Cena jest ta sama we wszystkich {COLORS.length} kolorach i nie zmienia
            się wraz z ilością; rabatów ilościowych nie stosujemy, więc nie ma progu, od którego
            nagle opłaca się zamówić więcej.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Składniki ceny koperty DL z nadrukiem logo — kwoty za sztukę
              </caption>
              <thead>
                <tr>
                  <th scope="col">Składnik</th>
                  <th scope="col">Cena brutto</th>
                  <th scope="col">Cena netto</th>
                  <th scope="col">Uwagi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Koperta DL {DL.dimensions}</td>
                  <td className="mono-sm">{formatPrice(plain.unitTotal)}</td>
                  <td className="mono-sm">{formatPrice(net(plain.unitTotal))}</td>
                  <td>Za sztukę, ten sam koszt w każdym z 19 kolorów</td>
                </tr>
                <tr>
                  <td>Nadruk logo firmowego</td>
                  <td className="mono-sm">{formatPrice(DEFAULT_PRICING.print)}</td>
                  <td className="mono-sm">{formatPrice(net(DEFAULT_PRICING.print))}</td>
                  <td>Za sztukę, minimum {DEFAULT_PRICING.moqWithPrint} sztuk</td>
                </tr>
                <tr>
                  <td>
                    <strong>Koperta DL z nadrukiem — razem</strong>
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(printed.unitTotal)}</strong>
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(printed.net)}</strong>
                  </td>
                  <td>Cena jednostkowa zamówienia z nadrukiem</td>
                </tr>
                <tr>
                  <td>Personalizacja (adresowanie) — opcjonalnie</td>
                  <td className="mono-sm">+{formatPrice(DEFAULT_PRICING.personalization)}</td>
                  <td className="mono-sm">+{formatPrice(net(DEFAULT_PRICING.personalization))}</td>
                  <td>
                    Koperta z nadrukiem i personalizacją:{' '}
                    {formatPrice(printedPersonalized.unitTotal)} brutto
                  </td>
                </tr>
                <tr>
                  <td>Realizacja ekspresowa — opcjonalnie</td>
                  <td className="mono-sm">+{formatPrice(DEFAULT_PRICING.express)}</td>
                  <td className="mono-sm">+{formatPrice(net(DEFAULT_PRICING.express))}</td>
                  <td>
                    {DEFAULT_PRICING.leadDaysExpress} dni robocze zamiast{' '}
                    {DEFAULT_PRICING.leadDaysStandard}; razem{' '}
                    {formatPrice(printedExpress.unitTotal)} brutto
                  </td>
                </tr>
                <tr>
                  <td>Dostawa kurierem</td>
                  <td className="mono-sm">{formatPrice(DELIVERY_COST)}</td>
                  <td className="mono-sm">{formatPrice(net(DELIVERY_COST))}</td>
                  <td>Stawka za całe zamówienie, nie za sztukę</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Link do filara sąsiedniego klastra K2 — cennik personalizacji
              rozkładamy wyłącznie tam (pkt 5.4 briefu SEO). */}
          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Nadruk powtarza ten sam projekt na całym nakładzie. Jeśli każda koperta ma nosić inne
            dane — imię, nazwisko albo adres odbiorcy — to usługa personalizacji: cennik, wymagania
            dla listy adresów i proces opisaliśmy na stronie{' '}
            <Link href="/koperty-personalizowane">personalizowane koperty</Link>.
          </p>

          <h3 style={{ marginTop: 'var(--space-7)' }}>
            Przykładowe wartości zamówienia kopert z nadrukiem
          </h3>
          <p style={{ maxWidth: '68ch' }}>
            Poniższe kwoty obejmują koperty DL z nadrukiem w trybie standardowym. Do każdej z nich
            doliczamy jednorazowo {formatPrice(DELIVERY_COST)} brutto za dostawę kurierem.
          </p>
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia kopert DL z nadrukiem dla wybranych ilości
              </caption>
              <thead>
                <tr>
                  <th scope="col">Ilość</th>
                  <th scope="col">Wartość brutto</th>
                  <th scope="col">Wartość netto</th>
                  <th scope="col">Z dostawą brutto</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_QUANTITIES.map((quantity) => {
                  const price = calculatePrice({ ...BASE_CONFIG, print: true, quantity });
                  return (
                    <tr key={quantity}>
                      <td>{quantity.toLocaleString('pl-PL')} szt.</td>
                      <td className="mono-sm">{formatPrice(price.gross)}</td>
                      <td className="mono-sm">{formatPrice(price.net)}</td>
                      <td className="mono-sm">
                        {formatPrice(round2(price.gross + DELIVERY_COST))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Anchor = fraza docelowa wpisu, nie fraza tej strony. Filar zostaje
              przy cenie jednostkowej, wpis liczy całe zamówienie razem
              z dostawą (content-plan.md poz. 9). */}
          {costPost && (
            <p className="small" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
              Koszt całego zamówienia razem z dostawą — i pozycje, których do niego nie doliczamy —
              rozpisaliśmy w poradniku{' '}
              <Link href={`/blog/${costPost.slug}`}>cena kopert z nadrukiem i koszt zamówienia</Link>
              .
            </p>
          )}

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Sprawdź cenę swojej ilości
            </ConfigureLink>
            <span className="small muted">
              Cena w konfiguratorze przelicza się przy każdej zmianie ilości i opcji.
            </span>
          </div>
        </div>
      </section>

      {/* ── Specyfikacja — tabela faktów pod ekstrakcję przez modele ── */}
      <section className="section" id="specyfikacja">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Specyfikacja</span>
            <h2>Koperta DL z nadrukiem — parametry</h2>
          </div>

          {/* Kadr z zaznaczonym polem nadruku stoi przy akapicie o marginesie
              — to jedyne miejsce na stronie, w którym tekst opisuje geometrię
              nadruku, więc zdjęcie ma tu wartość wyjaśniającą, a nie ozdobną. */}
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <p style={{ maxWidth: '68ch', marginBottom: 0 }}>
              Nadruk wykonujemy na kopercie DL o wymiarach {DL.dimensions}. To jedyny format dostępny
              dziś w sprzedaży — koperty C6 {FORMAT_MAP.C6.dimensions} i K4{' '}
              {FORMAT_MAP.K4.dimensions} mają w katalogu status „Dostępne wkrótce". Wszystkie koperty
              Envelopes są bez okienka adresowego, więc nadruk może objąć całą przednią ściankę
              z zachowaniem {PRINT_SAFE_MARGIN_MM} mm marginesu od krawędzi. Co zmieści się w środku i jak format wypada
              na tle C6 i K4 — opisaliśmy na stronie{' '}
              <Link href="/koperty-dl">wymiary kopert DL</Link>.
            </p>

            <ConfigureLink
              format="DL"
              color={PRINT_AREA_SHOT.colorId}
              print
              className="paper-shot"
              title={showcaseLinkTitle(PRINT_AREA_SHOT)}
            >
              <figure>
                <img
                  src={showcaseSrc(PRINT_AREA_SHOT)}
                  srcSet={showcaseSrcSet(PRINT_AREA_SHOT)}
                  sizes="(max-width: 620px) calc(100vw - 32px), (max-width: 1248px) calc(50vw - 36px), 564px"
                  width={1024}
                  height={1024}
                  alt={PRINT_AREA_SHOT.alt}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>
                  <strong>{showcaseCaption(PRINT_AREA_SHOT)}</strong>
                  <span className="small muted">{PRINT_AREA_SHOT.note}</span>
                </figcaption>
              </figure>
            </ConfigureLink>
          </div>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Specyfikacja techniczna kopert DL z nadrukiem logo firmowego
              </caption>
              <tbody>
                <tr>
                  <th scope="row">Format</th>
                  <td>DL — {DL.dimensions}</td>
                </tr>
                <tr>
                  <th scope="row">Gramatura papieru</th>
                  <td>{WEIGHT_SUMMARY}</td>
                </tr>
                <tr>
                  <th scope="row">Kolory</th>
                  <td>19 odcieni w jednej cenie, w tym wykończenia perłowe, metaliczne i eko</td>
                </tr>
                <tr>
                  <th scope="row">Okienko adresowe</th>
                  <td>Brak — wszystkie koperty są pełne</td>
                </tr>
                <tr>
                  <th scope="row">Minimalna ilość</th>
                  <td>
                    {DEFAULT_PRICING.moqWithPrint} sztuk z nadrukiem,{' '}
                    {DEFAULT_PRICING.moqWithoutPrint} sztuka bez nadruku
                  </td>
                </tr>
                <tr>
                  <th scope="row">Pliki do druku</th>
                  <td>
                    {PRINT_FILE_EXTENSIONS_LABEL} — do {FILE_MAX_MB} MB, maksymalnie{' '}
                    {PRINT_FILE_MAX_COUNT} pliki na zamówienie
                  </td>
                </tr>
                <tr>
                  <th scope="row">Margines nadruku</th>
                  <td>
                    Minimum {PRINT_SAFE_MARGIN_MM} mm od krawędzi, poza linią klejenia i zagięciem
                    klapki
                  </td>
                </tr>
                <tr>
                  <th scope="row">Czas realizacji</th>
                  <td>
                    {DEFAULT_PRICING.leadDaysStandard} dni roboczych, ekspres{' '}
                    {DEFAULT_PRICING.leadDaysExpress} dni robocze
                  </td>
                </tr>
                <tr>
                  <th scope="row">Dostawa</th>
                  <td>Kurier, {formatPrice(DELIVERY_COST)} brutto za zamówienie</td>
                </tr>
                <tr>
                  <th scope="row">Rozliczenie</th>
                  <td>
                    Faktura VAT do każdego zamówienia; odroczony termin płatności 14 dni dla
                    instytucji publicznych i urzędów
                  </td>
                </tr>
                <tr>
                  <th scope="row">Wycena indywidualna</th>
                  <td>Powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Proces zamówienia (HowTo) ── */}
      <section className="section" id="jak-zamawiac">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proces</span>
            <h2>Jak zamówić koperty z nadrukiem</h2>
            <p>
              Zamówienie przechodzi przez cztery kroki: konfigurację, płatność, akceptację
              wizualizacji i wysyłkę. Kroku z wizualizacją nie da się pominąć — to on zdejmuje
              ryzyko wydrukowania błędu na całym nakładzie.
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

          {/* Anchor = fraza docelowa wpisu, nie fraza tej strony. Wpis obsługuje
              intencję procesową („jak przygotować plik"), filar zostaje przy
              frazie transakcyjnej (content-plan.md poz. 7). */}
          {filesPost && (
            <p className="small" style={{ marginTop: 'var(--space-5)' }}>
              Wymagania dla pliku — rozdzielczość, krzywe, przestrzeń barw i margines{' '}
              {PRINT_SAFE_MARGIN_MM} mm — rozpisaliśmy w poradniku{' '}
              <Link href={`/blog/${filesPost.slug}`}>
                jak przygotować pliki do druku na kopertach
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* ── Kolory pod nadruk — realne zdjęcia z public/images/prints/ ── */}
      <section className="section section-surface" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolory</span>
            <h2>Kolory kopert pod nadruk logo</h2>
            <p>
              Odcień papieru nie wpływa na koszt nadruku — czerń kosztuje tyle samo, co biel. Wybór
              koloru jest więc pytaniem o to, jak logo ma wyglądać, a nie ile ma kosztować.
            </p>
            {colorPages().length > 0 && (
              <div style={{ marginTop: 'var(--space-5)' }}>
                <p className="small muted" style={{ marginBottom: 'var(--space-3)' }}>
                  Charakterystykę papieru odcień po odcieniu opisujemy osobno:
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)'
                  }}
                >
                  {colorPages().map(({ color, content }) => (
                    <Link
                      key={color.id}
                      href={colorPagePath(color.id)}
                      className="color-chip"
                    >
                      <span
                        className="color-chip-swatch"
                        style={{ backgroundColor: color.hex }}
                        aria-hidden="true"
                      />
                      {content.phraseShort} z logo
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
            {PRINT_COLORS.map((color) => (
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
                    {color.name}
                  </strong>
                  <span className="small muted">
                    {color.weight?.replace('g', ' g/m²')}
                    {color.finish ? ` · wykończenie ${color.finish}` : ''}
                  </span>
                </div>
              </ConfigureLink>
            ))}
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            {/* Wcześniej: „…odcieni, w których wykonaliśmy nadruk" plus zdanie
                o pozostałych kolorach wymieniające Złoty, Srebrną Perłową
                i Szarobrązowy. Oba zdania przestały być prawdziwe: kadr
                pokazuje zaznaczone pole nadruku, a nie wykonaną realizację,
                a paleta ze zdjęciami obejmuje dziś wszystkie odcienie, więc
                „pozostałe kolory" był zbiorem pustym. */}
            Nadruk przyjmuje wszystkie {PRINT_COLORS.length} odcieni z palety, w tej samej cenie.
            Pole nadruku zaznaczyliśmy na zdjęciach symbolem — Państwa logo trafia dokładnie
            w to miejsce, a jego wygląd zatwierdzają Państwo na wizualizacji przed drukiem.
            Przy ciemnych kopertach rekomendujemy jasny kolor nadruku, przy jasnych — ciemny;
            kontrast decyduje o czytelności logo bardziej niż sam odcień papieru.
          </p>
        </div>
      </section>

      {/* ── Nadruk w kontekście — kadry z public/images/zastosowania/ ── */}
      <section className="section" id="przyklady">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Przykłady</span>
            <h2>Jak wygląda nadruk logo na kopercie DL</h2>
            <p>
              Ten sam nadruk jednokolorowy na ośmiu odcieniach papieru — najlepszy sposób, żeby
              zobaczyć, jak logo zachowa się na ciemnym i na jasnym tle. Każde zdjęcie otwiera
              konfigurator z tym kolorem.
            </p>
          </div>

          <ShowcaseGrid shots={INDUSTRY_SHOTS} columns={4} />

          {/* Nazwy na kopertach są przykładowe. Podpisanie tych kadrów jako
              realizacji konkretnych klientów byłoby wymyślonym portfolio —
              rzecz, której brief zabrania wprost (pkt 4.1). */}
          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Nazwy firm widoczne na zdjęciach są przykładowe i służą wyłącznie pokazaniu, jak
            nadruk układa się na kopercie w danym kolorze. Na kopertę trafia Państwa logo —
            w kształcie zatwierdzonym na wizualizacji przed drukiem.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z logo
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem — dopiero po akceptacji ruszamy z maszyną.
            </span>
          </div>
        </div>
      </section>

      {/* ── Dla kogo — filar mówi do wszystkich branż (pkt 5.1 briefu) ── */}
      <section className="section" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Dla kogo są koperty z nadrukiem</h2>
            <p>
              Kopert z nadrukiem używa właściwie każda firma, która wysyła dokumenty, vouchery albo
              zaproszenia we własnym imieniu. Dziesięć sytuacji, w których widzimy je najczęściej.
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

          {/* Link w bok do filara K7 — cztery z powyższych branż kupują nadruk
              pod bon podarunkowy, a to inny cykl zakupowy niż korespondencja. */}
          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Cztery z powyższych zastosowań — kliniki i SPA, hotele, restauracje oraz galerie —
            łączy jedno: nadruk trafia na kopertę, w którą pakowany jest bon podarunkowy. Ten
            zakup ma własny kalendarz i własny nakład, więc opisaliśmy go osobno na stronie{' '}
            <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Zamów koperty z logo firmy
            </ConfigureLink>
            <span className="small muted">
              Nie znaleźli Państwo swojej branży? Nadruk wygląda tak samo niezależnie od tego, co
              trafia do środka.
            </span>
          </div>
        </div>
      </section>

      {/* ── Terminy i rozliczenie — rozbrajanie dwóch największych barier ── */}
      <section className="section" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Terminy i rozliczenie</span>
            <h2>Kiedy koperty z nadrukiem trafią do Państwa</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperty z nadrukiem wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w
            trybie ekspresowym w {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
            {formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Termin liczymy od momentu,
            w którym spełnione są oba warunki: wpłata jest zaksięgowana, a wizualizacja
            zaakceptowana. Przy przelewie tradycyjnym prosimy doliczyć czas księgowania; przy
            fakturze z odroczonym terminem produkcja rusza bez oczekiwania na wpłatę.
          </p>

          {/* Anchor = fraza docelowa wpisu (`szybka realizacja kopert`), nie
              fraza tej strony. Filar podaje liczbę dni, wpis — arytmetykę
              kalendarza (content-plan.md poz. 16). */}
          {deadlinePost && (
            <p className="small" style={{ maxWidth: '68ch', marginTop: 'var(--space-4)' }}>
              Jak policzyć datę wysyłki wstecz od dnia wydarzenia i kiedy dopłata za ekspres się
              zwraca — rozpisaliśmy w poradniku{' '}
              <Link href={`/blog/${deadlinePost.slug}`}>szybka realizacja kopert</Link>.
            </p>
          )}

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
                    <td>Koperty gładkie, bez nadruku</td>
                    <td>{DEFAULT_PRICING.leadDaysPlain} dni robocze</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z nadrukiem — standard</td>
                    <td>{DEFAULT_PRICING.leadDaysStandard} dni roboczych</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z nadrukiem — ekspres</td>
                    <td>{DEFAULT_PRICING.leadDaysExpress} dni robocze</td>
                    <td className="mono-sm">
                      {formatPrice(DEFAULT_PRICING.express)} brutto/szt.
                    </td>
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
                  publicznych i urzędów, których obieg zakupowy nie przewiduje przedpłaty.
                </li>
                <li>
                  Powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk ustalamy harmonogram
                  dostaw i sposób rozliczenia indywidualnie. Cena jednostkowa pozostaje stała.
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

      {/* ── FAQ — zasila FAQPage (JSON-LD wyżej) ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o koperty z nadrukiem</h2>
          </div>
          {PRINT_FAQ_ITEMS.map((item) => (
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
              <h2>Zanim zamówią Państwo nadruk</h2>
            </div>
            {/* Trzy kolumny dopiero od trzeciego wpisu — przy dwóch siatka
                trzykolumnowa zostawiałaby pustą kolumnę. */}
            <div className={relatedPosts.length > 2 ? 'grid grid-3' : 'grid grid-2'}>
              {relatedPosts.map((post) => (
                <article className="post-card" key={post.slug}>
                  <BlogCoverImage
                    post={post}
                    ratio="wide"
                    size="sm"
                    sizes="(max-width: 720px) calc(100vw - 48px), (max-width: 900px) calc(50vw - 36px), 368px"
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
              <h2>Gotowi na koperty z Państwa logo?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączonym nadrukiem. Cenę widzą Państwo od
                razu, bez zapytania ofertowego.
              </p>
            </div>
            <ConfigureLink format="DL" print className="btn btn-lg">
              Wyceń koperty z nadrukiem
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" print />
    </>
  );
}
