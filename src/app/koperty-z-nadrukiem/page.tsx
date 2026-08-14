import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPost } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  PRINT_FILE_EXTENSIONS_LABEL,
  PRINT_FILE_MAX_BYTES,
  PRINT_FILE_MAX_COUNT,
} from '@/lib/catalog';
import { PRINT_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  printedEnvelopeProductJsonLd,
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
    text: 'Do wyboru są BLIK, karta, szybki przelew, przelew tradycyjny oraz faktura z odroczonym terminem płatności. Faktura odroczona nie wstrzymuje produkcji.',
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

const INDUSTRIES: { heading: string; text: string }[] = [
  {
    heading: 'Kancelarie prawne i notarialne',
    text: 'Pismo procesowe A4 złożone na trzy mieści się w kopercie DL 110 × 220 mm bez dodatkowego zagięcia. Do korespondencji formalnej wybierane są kolory stonowane — Czarny, Granatowy i Szarobrązowy (140 g/m², najgrubszy papier w ofercie).',
  },
  {
    heading: 'Biura rachunkowe i doradztwo finansowe',
    text: 'Sprawozdania roczne i raporty z audytu wychodzą do klientów w powtarzalnych partiach. Nadruk logo na kopercie DL kosztuje ' + formatPrice(printed.unitTotal) + ' brutto za sztukę niezależnie od wielkości zamówienia, więc koszt kwartalnej wysyłki jest przewidywalny co do złotówki.',
  },
  {
    heading: 'Hotele, resorty i pensjonaty',
    text: 'Karty powitalne w pokojach i vouchery pobytowe wręcza się gościowi do ręki, więc koperta jest częścią doświadczenia pobytu. Format DL mieści voucher 99 × 210 mm oraz kartę A4 złożoną na trzy.',
  },
  {
    heading: 'Kliniki medycyny estetycznej i salony SPA',
    text: 'Bon podarunkowy na zabieg wręczany jest jako prezent, dlatego wybierane są jasne odcienie — Biała Perłowa, Ecru, Biały. Nadruk logo kliniki na kopercie odróżnia bon od wydruku z drukarki biurowej.',
  },
  {
    heading: 'Agencje eventowe, PR i kreatywne',
    text: 'Wysyłki VIP i zaproszenia na premiery wymagają koloru, którego nie ma konkurencja — Matcha (120 g/m²), Jeansowy (120 g/m²) i Złoty w wykończeniu metalicznym kosztują tyle samo, co biel. Przy dacie wydarzenia wpisanej w kalendarz dostępny jest tryb ekspresowy: ' + DEFAULT_PRICING.leadDaysExpress + ' dni robocze za dopłatą ' + formatPrice(DEFAULT_PRICING.express) + ' brutto od sztuki.',
  },
  {
    heading: 'Biura nieruchomości i deweloperzy',
    text: 'Umowa deweloperska i akt notarialny to dokumenty A4 — złożone na trzy wchodzą do koperty DL. Nadruk logo biura na kopercie z aktem jest ostatnim elementem transakcji, który klient zabiera ze sobą.',
  },
  {
    heading: 'Salony samochodowe',
    text: 'Dokumenty pojazdu i umowy leasingowe przekazywane są przy odbiorze auta. Koperta DL z nadrukiem logo dilera w kolorze Czarnym lub Granatowym porządkuje ten moment i chroni komplet dokumentów przed zagięciem.',
  },
  {
    heading: 'Uczelnie, szkoły i firmy szkoleniowe',
    text: 'Certyfikaty i podziękowania dla sponsorów wysyłane są w seriach kilkuset sztuk. Minimalna ilość przy nadruku to ' + DEFAULT_PRICING.moqWithPrint + ' sztuk, więc mniejsze serie — na przykład dyplomy dla jednej grupy — również da się zamówić z logo uczelni.',
  },
  {
    heading: 'Restauracje fine dining i winiarnie',
    text: 'Vouchery na kolację degustacyjną sprzedają się w cyklu sezonowym, ze szczytem w grudniu. Koperta DL z nadrukiem logo restauracji zamienia wydrukowany bon w prezent gotowy do wręczenia.',
  },
  {
    heading: 'Galerie sztuki i domy aukcyjne',
    text: 'Certyfikaty autentyczności i zaproszenia na wernisaże trafiają do wąskiej, stałej listy odbiorców. Nadruk logo galerii można połączyć z personalizacją, czyli nadrukiem adresu odbiorcy, za dopłatą ' + formatPrice(DEFAULT_PRICING.personalization) + ' brutto od sztuki.',
  },
];

export const metadata: Metadata = {
  title: `Koperty z nadrukiem logo — ${formatPrice(printed.unitTotal)} brutto/szt.`,
  description: `Koperty DL ${DL.dimensions} z nadrukiem logo, 19 kolorów: ${formatPrice(printed.unitTotal)} brutto za sztukę, od ${DEFAULT_PRICING.moqWithPrint} sztuk, wysyłka w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych lub ${DEFAULT_PRICING.leadDaysExpress} dni ekspresem. Faktura VAT.`,
  keywords: [
    'koperty z nadrukiem',
    'koperty firmowe z nadrukiem',
    'koperty z logo firmy',
    'koperty z nadrukiem cena',
    'koperty dl z nadrukiem',
  ],
  alternates: { canonical: '/koperty-z-nadrukiem' },
  openGraph: {
    type: 'website',
    title: 'Koperty z nadrukiem logo firmowego — Envelopes',
    description: `Koperta DL ${DL.dimensions} z nadrukiem logo: ${formatPrice(printed.unitTotal)} brutto za sztukę, 19 kolorów, minimum ${DEFAULT_PRICING.moqWithPrint} sztuk.`,
    url: '/koperty-z-nadrukiem',
  },
};

export default function PrintedEnvelopesPage() {
  const filesPost = getPost('koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem');
  const expressPost = getPost('ekspresowa-realizacja-2-dni-robocze');
  const casePost = getPost('realizacja-3000-kopert-dl-dla-kancelarii');
  const relatedPosts = [filesPost, expressPost, casePost].filter(
    (post): post is BlogPost => post !== undefined
  );

  return (
    <>
      <JsonLd data={printedEnvelopeProductJsonLd()} />
      <JsonLd data={faqJsonLd(PRINT_FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak zamówić koperty z nadrukiem logo firmowego',
          description: `Zamówienie kopert DL ${DL.dimensions} z nadrukiem logo w sklepie Envelopes — od konfiguracji po wysyłkę kurierem.`,
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
          <ParallaxBackground imageUrl="/images/Hero%20Envelopes%20Robocze.png" />
          <div className="container">
            <nav aria-label="Ścieżka nawigacji" className="small muted" style={{ marginBottom: 'var(--space-4)' }}>
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty z nadrukiem
            </nav>

            <span className="eyebrow">Koperty firmowe</span>
            <h1>Koperty z nadrukiem logo firmowego</h1>
            <p className="hero-lead">
              Koperty z nadrukiem to koperty ozdobne z wydrukowanym logo firmowym, zamawiane od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk. W Envelopes drukujemy na kopercie DL{' '}
              {DL.dimensions} w 19 kolorach. Koperta DL z nadrukiem kosztuje{' '}
              {formatPrice(printed.unitTotal)} brutto za sztukę ({formatPrice(printed.net)} netto):{' '}
              {formatPrice(plain.unitTotal)} za kopertę i {formatPrice(DEFAULT_PRICING.print)} za
              nadruk. Wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych.
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
              fakturę VAT, także z odroczonym terminem płatności 14 dni.
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
            Koperta DL {DL.dimensions} z nadrukiem logo kosztuje{' '}
            <strong>{formatPrice(printed.unitTotal)} brutto</strong> ({formatPrice(printed.net)}{' '}
            netto) za sztukę. Na cenę składa się koperta — {formatPrice(plain.unitTotal)} brutto —
            oraz nadruk logo — {formatPrice(DEFAULT_PRICING.print)} brutto. Cena jest identyczna we
            wszystkich 19 kolorach i nie zmienia się wraz z ilością; rabatów ilościowych nie
            stosujemy.
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

          <p style={{ maxWidth: '68ch' }}>
            Nadruk wykonujemy na kopercie DL o wymiarach {DL.dimensions}. To jedyny format dostępny
            dziś w sprzedaży — koperty C6 {FORMAT_MAP.C6.dimensions} i K4{' '}
            {FORMAT_MAP.K4.dimensions} mają w katalogu status „Dostępne wkrótce". Wszystkie koperty
            Envelopes są bez okienka adresowego, więc nadruk może objąć całą przednią ściankę
            z zachowaniem 5 mm marginesu od krawędzi.
          </p>

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
                  <td>Minimum 5 mm od krawędzi, poza linią klejenia i zagięciem klapki</td>
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
                    Faktura VAT do każdego zamówienia, z odroczonym terminem płatności 14 dni na
                    życzenie
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

          {filesPost && (
            <p className="small" style={{ marginTop: 'var(--space-5)' }}>
              Listę kontrolną plików, marginesów i danych zebraliśmy we wpisie{' '}
              <Link href={`/blog/${filesPost.slug}`}>
                koperty firmowe z nadrukiem — co przygotować przed zamówieniem
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
              Nadruk kosztuje {formatPrice(DEFAULT_PRICING.print)} brutto za sztukę niezależnie od
              koloru koperty — druk na czarnej kopercie kosztuje tyle samo, co na białej.            </p>
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
            Na zdjęciach pokazujemy {PRINT_COLORS.length} odcieni, w których wykonaliśmy nadruk.
            Pozostałe kolory z palety 19 odcieni — między innymi Złoty, Srebrna Perłowa i Szarobrązowy —
            również przyjmują nadruk; wybiorą je Państwo{' '}
            <Link href="/#kolory">w pełnej palecie kolorów</Link>. Przy ciemnych kopertach
            rekomendujemy jasny kolor nadruku, przy jasnych — ciemny; kontrast decyduje
            o czytelności logo bardziej niż sam odcień papieru.
          </p>
        </div>
      </section>

      {/* ── Dla kogo — filar mówi do wszystkich branż (pkt 5.1 briefu) ── */}
      <section className="section" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Dla kogo są koperty z nadrukiem</h2>
            <p>
              Kopert z nadrukiem logo używa każda firma, która wysyła dokumenty, vouchery albo
              zaproszenia we własnym imieniu. Poniżej dziesięć zastosowań, w których format DL{' '}
              {DL.dimensions} jest wyborem naturalnym.
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
              Zamów koperty z logo firmy
            </ConfigureLink>
            <span className="small muted">
              Minimum {DEFAULT_PRICING.moqWithPrint} sztuk. Wizualizacja do akceptacji przed drukiem.
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
                  Faktura z odroczonym terminem płatności 14 dni jest dostępna przy każdym
                  zamówieniu — z myślą o instytucjach i jednostkach budżetowych.
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

          {expressPost && (
            <p className="small" style={{ marginTop: 'var(--space-5)' }}>
              Kiedy dopłata za ekspres ma sens, a kiedy wystarczy termin standardowy — opisaliśmy to
              we wpisie{' '}
              <Link href={`/blog/${expressPost.slug}`}>realizacja ekspresowa w 2 dni robocze</Link>.
            </p>
          )}
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
    </>
  );
}
