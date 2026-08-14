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
  PERSONALIZATION_REQUIRED_COLUMNS,
  PERSONALIZATION_SHEET_COLUMNS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  PERSONALIZATION_SHEET_MAX_ROWS,
} from '@/lib/catalog';
import { PERSONALIZATION_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  personalizedEnvelopeProductJsonLd,
} from '@/lib/seo';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Filar klastra K2 — „personalizowane koperty" i „adresowanie kopert"
 * (keywords.md K2, content-plan.md poz. 2).
 *
 * Jeden adres obsługuje trzy nazwy tej samej usługi: personalizacja,
 * adresowanie oraz koperty z imieniem i nazwiskiem. Rozbicie ich na osobne
 * strony byłoby kanibalizacją — to ta sama intencja i ta sama oferta.
 *
 * Rozgraniczenie z filarem K1 (`/koperty-z-nadrukiem`): tam rozłożona na
 * czynniki jest cena **nadruku logo**, tutaj cena **personalizacji**. Nadruk
 * pojawia się na tej stronie wyłącznie jako opcja łączona, jednym wierszem
 * w tabeli i z linkiem do filara K1.
 *
 * Wszystkie liczby pochodzą z `pricing.ts` i `catalog.ts`, a specyfikacja
 * arkusza adresowego z `PERSONALIZATION_SHEET_COLUMNS` — tej samej listy,
 * z której generujemy szablon XLSX.
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
const personalized = calculatePrice({ ...BASE_CONFIG, personalization: true });
const printedPersonalized = calculatePrice({ ...BASE_CONFIG, print: true, personalization: true });
const personalizedExpress = calculatePrice({
  ...BASE_CONFIG,
  personalization: true,
  shippingSpeed: 'ekspres',
});

/** Cena netto pojedynczego składnika — ta sama stawka VAT co w kalkulatorze. */
function net(gross: number): number {
  return round2(gross / (1 + DEFAULT_PRICING.vatRate));
}

/**
 * Ilości dobrane pod wysyłkę adresowaną: minimum, jedna lista mailingowa,
 * baza klientów kluczowych i wysyłka roczna. Celowo inne progi niż w tabeli
 * na `/koperty-z-nadrukiem` — tam liczymy nakład jednego projektu.
 */
const EXAMPLE_QUANTITIES = [DEFAULT_PRICING.moqWithPrint, 100, 300, 1000];

/** Kolory, dla których mamy realne zdjęcie koperty z personalizacją (pkt 3.3). */
const PERSONALIZED_COLORS = COLORS.filter((color) => color.personalizedImages?.DL);

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

/** Wymagane kolumny arkusza wypisane zdaniem: „ulica i numer, kod pocztowy…". */
const REQUIRED_COLUMNS_LABEL = PERSONALIZATION_REQUIRED_COLUMNS.map((column) =>
  column.label.toLowerCase()
).join(', ');

const HOW_TO_STEPS = [
  {
    name: 'Konfiguracja zamówienia',
    text: `W konfiguratorze wybierają Państwo format DL ${DL.dimensions}, kolor koperty i ilość od ${DEFAULT_PRICING.moqWithPrint} sztuk, po czym włączają opcję personalizacji. Cena rośnie o ${formatPrice(DEFAULT_PRICING.personalization)} brutto od sztuki i przelicza się od razu.`,
  },
  {
    name: 'Przekazanie danych odbiorców',
    text: `Do wyboru są dwa tryby: wpisanie treści wprost w konfiguratorze albo pobranie szablonu Excel z liczbą wierszy równą zamówionej ilości kopert. Uzupełniony arkusz wgrywają Państwo z powrotem — sprawdzamy kompletność adresów i zgodność liczby wierszy z ilością kopert.`,
  },
  {
    name: 'Płatność',
    text: 'Do wyboru są BLIK, karta, szybki przelew, przelew tradycyjny oraz faktura z odroczonym terminem płatności 14 dni. Faktura odroczona nie wstrzymuje produkcji.',
  },
  {
    name: 'Akceptacja wizualizacji i wysyłka',
    text: `Nasz grafik przygotowuje wizualizację koperty z danymi odbiorcy i przesyła ją e-mailem. Do druku kierujemy wyłącznie wersję zaakceptowaną. Koperty z personalizacją wysyłamy kurierem w ${DEFAULT_PRICING.leadDaysStandard} dni roboczych, a w trybie ekspresowym w ${DEFAULT_PRICING.leadDaysExpress} dni robocze.`,
  },
];

/**
 * Sekcja „Dla kogo" — filar mówi do wszystkich branż (pkt 5.1 briefu).
 * Linki w dół dokładamy dopiero wtedy, gdy powstanie LP branżowe;
 * dziś żadne z nich nie istnieje, więc akapity zostają bez odnośników.
 */
const INDUSTRIES: { heading: string; text: string }[] = [
  {
    heading: 'Sekretariaty i biura zarządu',
    text: `Pismo zaadresowane imiennie do członka zarządu nie trafia na stos korespondencji masowej. Adres drukujemy wprost na kopercie DL ${DL.dimensions}, więc nie ma naklejki, która się odkleja, ani odręcznego pisma o różnej czytelności. Przy liście do 30 osób dane wpisują Państwo w konfiguratorze, bez otwierania arkusza.`,
  },
  {
    heading: 'Działy HR i employer branding',
    text: `Oferta pracy, gratulacje po awansie i decyzja o premii wręczane są jednej osobie, a nie działowi. Minimalna ilość ${DEFAULT_PRICING.moqWithPrint} sztuk pozwala zamówić koperty imienne pod jedną rekrutację albo jedną turę podwyżek, bez kupowania zapasu na rok.`,
  },
  {
    heading: 'Hotele, resorty i pensjonaty',
    text: 'Karta powitalna z nazwiskiem gościa leży w pokoju przed jego przyjazdem — to pierwszy przedmiot, który gość bierze do ręki. Listę nazwisk z systemu rezerwacji wgrywają Państwo jako arkusz. Do kart powitalnych wybierane są jasne odcienie: Ecru, Biała Perłowa i Biały.',
  },
  {
    heading: 'Uczelnie, szkoły i firmy szkoleniowe',
    text: `Dyplom i certyfikat imienny wręcza się konkretnemu absolwentowi, więc koperta powinna nosić jego nazwisko. Jedna grupa szkoleniowa to zwykle 10–30 osób — mieści się w minimum ${DEFAULT_PRICING.moqWithPrint} sztuk. Certyfikat A4 złożony na trzy wchodzi do koperty DL bez dodatkowego zagięcia.`,
  },
  {
    heading: 'Agencje eventowe, PR i kreatywne',
    text: `Zaproszenie na galę adresowane imiennie działa inaczej niż zaproszenie „do firmy" — zobowiązuje konkretną osobę. Przy dacie wydarzenia wpisanej w kalendarz dostępny jest tryb ekspresowy: ${DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą ${formatPrice(DEFAULT_PRICING.express)} brutto od sztuki. Kolory nietypowe — Matcha i Jeansowy, oba 120 g/m² — kosztują tyle samo, co biel.`,
  },
  {
    heading: 'Kancelarie prawne i notarialne',
    text: 'Pismo procesowe adresowane jest do strony postępowania, nie do instytucji. Nadrukowany adres eliminuje ryzyko pomyłki przy ręcznym przepisywaniu z akt. Do korespondencji formalnej wybierane są kolory stonowane: Czarny i Granatowy (115 g/m²) oraz Szarobrązowy (140 g/m², najgrubszy papier w ofercie).',
  },
  {
    heading: 'Kliniki, gabinety i salony SPA',
    text: `Bon podarunkowy z imieniem obdarowanego przestaje być kuponem, a staje się prezentem. Personalizacja przyjmuje dowolny tekst, więc na kopercie może stanąć samo imię albo dedykacja, bez adresu pocztowego. Koszt to ${formatPrice(DEFAULT_PRICING.personalization)} brutto od sztuki niezależnie od długości tekstu.`,
  },
  {
    heading: 'Biura nieruchomości i deweloperzy',
    text: 'Akt notarialny i umowa deweloperska trafiają do nabywcy z imienia i nazwiska — to dokument, który zostaje w domu na lata. Koperta DL mieści komplet A4 złożony na trzy, a nadrukowany adres nabywcy porządkuje przekazanie dokumentów po odbiorze lokalu.',
  },
  {
    heading: 'Butiki, jubilerzy i marki premium',
    text: `List do klienta programu lojalnościowego wymaga dwóch rzeczy naraz: logo marki i nazwiska odbiorcy. Obie usługi realizujemy w jednym przebiegu — koperta DL z nadrukiem logo i personalizacją kosztuje ${formatPrice(printedPersonalized.unitTotal)} brutto za sztukę.`,
  },
  {
    heading: 'Wedding plannerzy i pary młode',
    text: `Zaproszenia adresowane drukiem wychodzą jednolicie, niezależnie od tego, ile osób wypisywało listę gości. Personalizację wykonujemy dziś na kopertach DL ${DL.dimensions} — formaty C6 ${FORMAT_MAP.C6.dimensions} i K4 ${FORMAT_MAP.K4.dimensions} mają w katalogu status „Dostępne wkrótce" i nie można ich zamówić.`,
  },
];

export const metadata: Metadata = {
  title: `Personalizowane koperty — adresowanie ${formatPrice(personalized.unitTotal)}`,
  description: `Personalizowane koperty DL ${DL.dimensions}: adresowanie drukiem za ${formatPrice(personalized.unitTotal)} brutto/szt., od ${DEFAULT_PRICING.moqWithPrint} sztuk, w ${COLORS.length} kolorach. Dane z arkusza XLSX, wysyłka w ${DEFAULT_PRICING.leadDaysStandard} dni.`,
  keywords: [
    'personalizowane koperty',
    'koperta personalizowana',
    'adresowanie kopert',
    'koperty adresowane',
    'koperty z imieniem i nazwiskiem',
    'koperty imienne',
  ],
  alternates: { canonical: '/koperty-personalizowane' },
  openGraph: {
    type: 'website',
    title: 'Personalizowane koperty i adresowanie kopert — Envelopes',
    description: `Koperta DL ${DL.dimensions} z nadrukiem danych odbiorcy: ${formatPrice(personalized.unitTotal)} brutto za sztukę, ${COLORS.length} kolorów, minimum ${DEFAULT_PRICING.moqWithPrint} sztuk.`,
    url: '/koperty-personalizowane',
  },
};

export default function PersonalizedEnvelopesPage() {
  const addressingPost = getPost('adresowanie-kopert-recznie-czy-z-arkusza');
  const colorsPost = getPost('paleta-19-kolorow-jak-wybrac-odcien-do-identyfikacji-firmy');
  const expressPost = getPost('ekspresowa-realizacja-2-dni-robocze');
  const relatedPosts = [addressingPost, colorsPost, expressPost].filter(
    (post): post is BlogPost => post !== undefined
  );

  return (
    <>
      <JsonLd data={personalizedEnvelopeProductJsonLd()} />
      <JsonLd data={faqJsonLd(PERSONALIZATION_FAQ_ITEMS)} />
      <JsonLd
        data={howToJsonLd({
          name: 'Jak zamówić personalizowane koperty z adresowaniem',
          description: `Zamówienie kopert DL ${DL.dimensions} z nadrukiem danych odbiorcy w sklepie Envelopes — od konfiguracji, przez przekazanie listy adresów, po wysyłkę kurierem.`,
          steps: HOW_TO_STEPS,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'Koperty personalizowane', url: '/koperty-personalizowane' },
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
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> Koperty
              personalizowane
            </nav>

            <span className="eyebrow">Adresowanie drukiem</span>
            <h1>Personalizowane koperty — adresowanie drukiem</h1>
            <p className="hero-lead">
              Personalizowane koperty to koperty z nadrukowanymi indywidualnymi danymi odbiorcy:
              imieniem i nazwiskiem, pełnym adresem albo dedykacją. W Envelopes personalizację
              wykonujemy na kopercie DL {DL.dimensions} w {COLORS.length} kolorach. Koszt to{' '}
              {formatPrice(personalized.unitTotal)} brutto za sztukę ({formatPrice(personalized.net)}{' '}
              netto): {formatPrice(plain.unitTotal)} za kopertę i{' '}
              {formatPrice(DEFAULT_PRICING.personalization)} za adresowanie. Minimalna ilość to{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk, wysyłka w {DEFAULT_PRICING.leadDaysStandard} dni
              roboczych.
            </p>

            <div className="row">
              <ConfigureLink format="DL" personalization className="btn btn-lg">
                Wyceń koperty z adresowaniem
              </ConfigureLink>
              <Link href="/kontakt#wycena" className="btn btn-secondary">
                Wycena powyżej {BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} szt.
              </Link>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              Wizualizację koperty z danymi odbiorcy akceptują Państwo przed drukiem. Do każdego
              zamówienia wystawiamy fakturę VAT, także z odroczonym terminem płatności 14 dni.
            </p>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: `${formatPrice(personalized.unitTotal)} brutto/szt.`,
                  note: `Koperta DL ${formatPrice(plain.unitTotal)} + adresowanie ${formatPrice(DEFAULT_PRICING.personalization)}`,
                },
                {
                  title: `Od ${DEFAULT_PRICING.moqWithPrint} sztuk`,
                  note: 'Każda koperta z innymi danymi — bez dopłaty za liczbę adresów',
                },
                {
                  title: 'Dwa tryby danych',
                  note: `Wpisanie w konfiguratorze albo arkusz ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}`,
                },
                {
                  title: `${DEFAULT_PRICING.leadDaysStandard} dni roboczych`,
                  note: `Ekspres ${DEFAULT_PRICING.leadDaysExpress} dni za ${formatPrice(DEFAULT_PRICING.express)} brutto/szt.`,
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

      {/* ── Cena personalizacji — cennik nadruku zostaje przy filarze K1 ── */}
      <section className="section section-surface" id="cena">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cennik</span>
            <h2>Ile kosztuje personalizacja i adresowanie kopert</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Personalizowana koperta DL {DL.dimensions} kosztuje{' '}
            <strong>{formatPrice(personalized.unitTotal)} brutto</strong> (
            {formatPrice(personalized.net)} netto) za sztukę. Na cenę składa się koperta —{' '}
            {formatPrice(plain.unitTotal)} brutto — oraz adresowanie —{' '}
            {formatPrice(DEFAULT_PRICING.personalization)} brutto. Stawka nie zależy od długości
            tekstu ani od liczby różnych adresów: koperta z samym imieniem kosztuje tyle samo, co
            koperta z pełnym adresem pocztowym. Cena jest identyczna we wszystkich{' '}
            {COLORS.length} kolorach i nie zmienia się wraz z ilością — rabatów ilościowych nie
            stosujemy.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Składniki ceny personalizowanej koperty DL — kwoty za sztukę
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
                  <td>Za sztukę, ten sam koszt w każdym z {COLORS.length} kolorów</td>
                </tr>
                <tr>
                  <td>Personalizacja (adresowanie)</td>
                  <td className="mono-sm">{formatPrice(DEFAULT_PRICING.personalization)}</td>
                  <td className="mono-sm">{formatPrice(net(DEFAULT_PRICING.personalization))}</td>
                  <td>Za sztukę, minimum {DEFAULT_PRICING.moqWithPrint} sztuk</td>
                </tr>
                <tr>
                  <td>
                    <strong>Personalizowana koperta DL — razem</strong>
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(personalized.unitTotal)}</strong>
                  </td>
                  <td className="mono-sm">
                    <strong>{formatPrice(personalized.net)}</strong>
                  </td>
                  <td>Cena jednostkowa zamówienia z adresowaniem</td>
                </tr>
                <tr>
                  <td>Nadruk logo firmowego — opcjonalnie</td>
                  <td className="mono-sm">+{formatPrice(DEFAULT_PRICING.print)}</td>
                  <td className="mono-sm">+{formatPrice(net(DEFAULT_PRICING.print))}</td>
                  <td>
                    Koperta z logo i adresem: {formatPrice(printedPersonalized.unitTotal)} brutto —
                    szczegóły na stronie{' '}
                    <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>
                  </td>
                </tr>
                <tr>
                  <td>Realizacja ekspresowa — opcjonalnie</td>
                  <td className="mono-sm">+{formatPrice(DEFAULT_PRICING.express)}</td>
                  <td className="mono-sm">+{formatPrice(net(DEFAULT_PRICING.express))}</td>
                  <td>
                    {DEFAULT_PRICING.leadDaysExpress} dni robocze zamiast{' '}
                    {DEFAULT_PRICING.leadDaysStandard}; razem{' '}
                    {formatPrice(personalizedExpress.unitTotal)} brutto
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
            Przykładowe wartości wysyłki adresowanej
          </h3>
          <p style={{ maxWidth: '68ch' }}>
            Poniższe kwoty obejmują koperty DL z personalizacją w trybie standardowym, bez nadruku
            logo. Do każdej z nich doliczamy jednorazowo {formatPrice(DELIVERY_COST)} brutto za
            dostawę kurierem.
          </p>
          <div className="table-wrap">
            <table className="data">
              <caption className="sr-only">
                Wartość zamówienia personalizowanych kopert DL dla wybranych ilości
              </caption>
              <thead>
                <tr>
                  <th scope="col">Liczba adresów</th>
                  <th scope="col">Wartość brutto</th>
                  <th scope="col">Wartość netto</th>
                  <th scope="col">Z dostawą brutto</th>
                </tr>
              </thead>
              <tbody>
                {EXAMPLE_QUANTITIES.map((quantity) => {
                  const price = calculatePrice({
                    ...BASE_CONFIG,
                    personalization: true,
                    quantity,
                  });
                  return (
                    <tr key={quantity}>
                      <td>{quantity.toLocaleString('pl-PL')} szt.</td>
                      <td className="mono-sm">{formatPrice(price.gross)}</td>
                      <td className="mono-sm">{formatPrice(price.net)}</td>
                      <td className="mono-sm">{formatPrice(round2(price.gross + DELIVERY_COST))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" personalization className="btn">
              Sprawdź cenę swojej listy
            </ConfigureLink>
            <span className="small muted">
              Cena w konfiguratorze przelicza się przy każdej zmianie ilości i opcji.
            </span>
          </div>
        </div>
      </section>

      {/* ── Adresowanie kopert — dwa tryby przekazania danych (fraza główna #2) ── */}
      <section className="section" id="adresowanie">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Adresowanie</span>
            <h2>Adresowanie kopert — dwa sposoby przekazania danych</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Dane do adresowania kopert przekazują Państwo na dwa sposoby: wpisując treść wprost
            w konfiguratorze albo wgrywając arkusz z listą odbiorców. Wybór zależy od skali wysyłki.
            Przy kilkunastu kopertach wpisanie danych ręcznie jest szybsze niż otwieranie Excela.
            Przy stu adresach arkusz nie ma alternatywy — i dodatkowo pozwala przekazać listę do
            sprawdzenia innej osobie w firmie, zanim zamówienie ruszy.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Porównanie dwóch trybów przekazania danych do adresowania kopert
              </caption>
              <thead>
                <tr>
                  <th scope="col">Kryterium</th>
                  <th scope="col">Wpisanie w konfiguratorze</th>
                  <th scope="col">Arkusz z listą odbiorców</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Kiedy się sprawdza</th>
                  <td>Do 30 adresów, krótki tekst, jedno imię lub dedykacja</td>
                  <td>Od 100 adresów wzwyż oraz zawsze, gdy dane są już w CRM</td>
                </tr>
                <tr>
                  <th scope="row">Jak przekazują Państwo dane</th>
                  <td>Treść wpisana w polu tekstowym konfiguratora</td>
                  <td>
                    Plik {PERSONALIZATION_SHEET_EXTENSIONS_LABEL} wgrany w konfiguratorze
                  </td>
                </tr>
                <tr>
                  <th scope="row">Skąd wziąć formularz</th>
                  <td>Pole jest częścią kroku personalizacji — nic nie pobieramy</td>
                  <td>
                    Konfigurator generuje szablon Excel z liczbą wierszy równą zamówionej ilości
                    kopert
                  </td>
                </tr>
                <tr>
                  <th scope="row">Kontrola poprawności</th>
                  <td>Tekst odtwarzamy dokładnie w podanej postaci; sprawdzenie następuje na wizualizacji</td>
                  <td>
                    Przy wgraniu sprawdzamy kompletność adresów i zgodność liczby wierszy z ilością
                    kopert
                  </td>
                </tr>
                <tr>
                  <th scope="row">Praca zespołowa</th>
                  <td>Dane wpisuje osoba składająca zamówienie</td>
                  <td>Arkusz można przekazać do weryfikacji przed złożeniem zamówienia</td>
                </tr>
                <tr>
                  <th scope="row">Górna granica</th>
                  <td>Bez limitu długości, ale przy wielu odbiorcach mniej wygodne</td>
                  <td>
                    Szablon generujemy do {PERSONALIZATION_SHEET_MAX_ROWS.toLocaleString('pl-PL')}{' '}
                    wierszy
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" personalization className="btn">
              Zamów koperty adresowane
            </ConfigureLink>
            {addressingPost && (
              <span className="small muted">
                Porównanie obu trybów na przykładach opisaliśmy we wpisie{' '}
                <Link href={`/blog/${addressingPost.slug}`}>
                  adresowanie kopert ręcznie czy z arkusza
                </Link>
                .
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Wymagania dla listy danych — tabela wprost z generatora szablonu ── */}
      <section className="section section-surface" id="lista-danych">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dane odbiorców</span>
            <h2>Jak przygotować listę adresów do nadruku</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Arkusz adresowy ma {PERSONALIZATION_SHEET_COLUMNS.length} kolumn, z czego{' '}
            {PERSONALIZATION_REQUIRED_COLUMNS.length} są wymagane w każdym wierszu:{' '}
            {REQUIRED_COLUMNS_LABEL}. Odbiorcę identyfikuje imię i nazwisko albo nazwa firmy —
            wystarczy jedno z tych pól, ale wiersz bez obu uznajemy za pusty. Liczba wypełnionych
            wierszy musi być równa liczbie zamówionych kopert; różnicę zgłaszamy przy wgrywaniu
            pliku, zanim zamówienie trafi do produkcji.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Kolumny arkusza adresowego wraz z oznaczeniem pól wymaganych
              </caption>
              <thead>
                <tr>
                  <th scope="col">Kolumna</th>
                  <th scope="col">Wymagana</th>
                  <th scope="col">Jak wypełnić</th>
                </tr>
              </thead>
              <tbody>
                {PERSONALIZATION_SHEET_COLUMNS.map((column) => (
                  <tr key={column.label}>
                    <th scope="row">{column.label}</th>
                    <td>{column.required ? 'Tak' : 'Nie'}</td>
                    <td>{column.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Przyjmujemy pliki {PERSONALIZATION_SHEET_EXTENSIONS_LABEL}. Tekst odtwarzamy dokładnie
            w postaci, w jakiej został przekazany — nie poprawiamy odmiany nazwisk, wielkich liter
            ani skrótów. Jeśli w arkuszu jest „ul." przed nazwą ulicy, taki zapis znajdzie się na
            kopercie. To celowe: dane adresowe bywają pobierane z systemów księgowych, w których
            zapis jest już ustandaryzowany.
          </p>
        </div>
      </section>

      {/* ── Co drukujemy — zakres usługi, nie instrukcja adresowania ── */}
      <section className="section" id="co-drukujemy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zakres usługi</span>
            <h2>Co drukujemy na personalizowanej kopercie</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Personalizacja przyjmuje dowolny tekst, nie tylko adres pocztowy. Na kopercie DL{' '}
            {DL.dimensions} drukujemy imię i nazwisko odbiorcy, nazwę firmy, pełny adres wysyłkowy
            albo dedykację — w zależności od tego, do czego koperta ma posłużyć. Cena jest ta sama
            w każdym z tych przypadków: {formatPrice(DEFAULT_PRICING.personalization)} brutto od
            sztuki.
          </p>

          <div className="grid grid-3" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Pełny adres odbiorcy</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Imię i nazwisko lub firma, ulica z numerem, kod pocztowy i miejscowość — komplet
                z arkusza adresowego. Koperta wychodzi z drukarni gotowa do nadania, bez naklejki
                adresowej i bez ręcznego wypisywania.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Samo imię i nazwisko</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Koperty imienne wręczane do ręki: karty powitalne w hotelu, dyplomy dla grupy
                szkoleniowej, decyzje o premii, bony podarunkowe. Przesyłka nie idzie pocztą, więc
                adres jest zbędny.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Dedykacja lub krótki tekst</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Podziękowanie, nazwa wydarzenia, numer edycji kursu albo hasło kampanii. Treść
                wpisują Państwo w konfiguratorze i odtwarzamy ją dokładnie w podanej postaci.
              </p>
            </div>
          </div>

          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-6)' }}>
            Wszystkie koperty Envelopes są bez okienka adresowego, więc nadruk danych obejmuje
            wolną przednią ściankę z zachowaniem 5 mm marginesu od krawędzi. Personalizację można
            połączyć z nadrukiem logo w jednym zamówieniu — wtedy logo nadawcy i dane odbiorcy
            powstają w tym samym przebiegu produkcyjnym, a nie na dwóch urządzeniach o różnym
            odcieniu czerni. Koperta DL z logo i adresem kosztuje{' '}
            {formatPrice(printedPersonalized.unitTotal)} brutto za sztukę.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-5)' }}>
            <ConfigureLink format="DL" print personalization className="btn">
              Wyceń koperty z logo i adresem
            </ConfigureLink>
            <span className="small muted">
              Minimum {DEFAULT_PRICING.moqWithPrint} sztuk. Wizualizacja do akceptacji przed drukiem.
            </span>
          </div>
        </div>
      </section>

      {/* ── Specyfikacja — tabela faktów pod ekstrakcję przez modele ── */}
      <section className="section" id="specyfikacja">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Specyfikacja</span>
            <h2>Personalizowana koperta DL — parametry</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Personalizację wykonujemy na kopercie DL o wymiarach {DL.dimensions}. To jedyny format
            dostępny dziś w sprzedaży — koperty C6 {FORMAT_MAP.C6.dimensions} i K4{' '}
            {FORMAT_MAP.K4.dimensions} mają w katalogu status „Dostępne wkrótce". Tabelę dopasowań
            wkładek i porównanie formatów zebraliśmy na stronie{' '}
            <Link href="/koperty-dl">wymiary kopert DL</Link>.
          </p>

          <div className="table-wrap" style={{ marginTop: 'var(--space-5)' }}>
            <table className="data">
              <caption className="sr-only">
                Specyfikacja techniczna personalizowanych kopert DL z adresowaniem
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
                  <td>
                    {COLORS.length} odcieni w jednej cenie, w tym wykończenia perłowe, metaliczne
                    i eko
                  </td>
                </tr>
                <tr>
                  <th scope="row">Zakres personalizacji</th>
                  <td>
                    Imię i nazwisko, nazwa firmy, pełny adres pocztowy albo dedykacja — dowolny
                    tekst
                  </td>
                </tr>
                <tr>
                  <th scope="row">Okienko adresowe</th>
                  <td>Brak — dane drukujemy wprost na papierze</td>
                </tr>
                <tr>
                  <th scope="row">Minimalna ilość</th>
                  <td>
                    {DEFAULT_PRICING.moqWithPrint} sztuk z personalizacją,{' '}
                    {DEFAULT_PRICING.moqWithoutPrint} sztuka bez personalizacji
                  </td>
                </tr>
                <tr>
                  <th scope="row">Pliki z danymi</th>
                  <td>
                    {PERSONALIZATION_SHEET_EXTENSIONS_LABEL} — szablon generowany do{' '}
                    {PERSONALIZATION_SHEET_MAX_ROWS.toLocaleString('pl-PL')} wierszy
                  </td>
                </tr>
                <tr>
                  <th scope="row">Pola wymagane w arkuszu</th>
                  <td>{REQUIRED_COLUMNS_LABEL}</td>
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
      <section className="section section-surface" id="jak-zamawiac">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Proces</span>
            <h2>Jak zamówić personalizowane koperty</h2>
            <p>
              Zamówienie przechodzi przez cztery kroki: konfigurację, przekazanie danych odbiorców,
              płatność oraz akceptację wizualizacji przed wysyłką. Kroku z wizualizacją nie da się
              pominąć — to on zdejmuje ryzyko wydrukowania błędnego nazwiska na całej partii.
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
        </div>
      </section>

      {/* ── Kolory z personalizacją — realne zdjęcia z public/images/personalized/ ── */}
      <section className="section" id="kolory">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kolory</span>
            <h2>Kolory kopert pod adresowanie</h2>
            <p>
              Adresowanie kosztuje {formatPrice(DEFAULT_PRICING.personalization)} brutto za sztukę
              niezależnie od koloru koperty. O czytelności danych decyduje kontrast: na ciemnych
              kopertach drukujemy jasnym kolorem, na jasnych — ciemnym.
            </p>
          </div>

          <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
            {PERSONALIZED_COLORS.map((color) => (
              <ConfigureLink
                key={color.id}
                format="DL"
                color={color.id}
                personalization
                className="card"
                title={`Koperta DL ${color.name.toLowerCase()} z personalizacją — otwórz konfigurator`}
              >
                <div style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                  <EnvelopePlaceholder
                    format="DL"
                    colorId={color.id}
                    ratio="photo"
                    hasPersonalization
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
            Na zdjęciach pokazujemy {PERSONALIZED_COLORS.length} odcieni, w których wykonaliśmy
            adresowanie. Pozostałe kolory z palety {COLORS.length} odcieni — między innymi Złoty,
            Srebrna Perłowa i Szarobrązowy — również przyjmują nadruk danych; wybiorą je Państwo{' '}
            <Link href="/#kolory">w pełnej palecie kolorów</Link>.
            {colorsPost && (
              <>
                {' '}
                Który odcień pasuje do identyfikacji firmy, podpowiadamy we wpisie{' '}
                <Link href={`/blog/${colorsPost.slug}`}>
                  paleta 19 kolorów — jak wybrać odcień
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── Dla kogo — filar mówi do wszystkich branż (pkt 5.1 briefu) ── */}
      <section className="section" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>Dla kogo są personalizowane koperty</h2>
            <p>
              Personalizowanej koperty używa każdy, kto wysyła korespondencję do konkretnej osoby,
              a nie do instytucji. Poniżej dziesięć zastosowań, w których adresowanie drukiem
              zastępuje naklejkę i odręczne wypisywanie.
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
            <ConfigureLink format="DL" personalization className="btn">
              Zamów koperty z imieniem i nazwiskiem
            </ConfigureLink>
            <span className="small muted">
              Minimum {DEFAULT_PRICING.moqWithPrint} sztuk. Każda koperta z innymi danymi, bez
              dopłaty za liczbę adresów.
            </span>
          </div>
        </div>
      </section>

      {/* ── Terminy i rozliczenie — rozbrajanie dwóch największych barier ── */}
      <section className="section" id="terminy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Terminy i rozliczenie</span>
            <h2>Kiedy personalizowane koperty trafią do Państwa</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Koperty z personalizacją wysyłamy w {DEFAULT_PRICING.leadDaysStandard} dni roboczych,
            a w trybie ekspresowym w {DEFAULT_PRICING.leadDaysExpress} dni robocze za dopłatą{' '}
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
                    <td>Koperty gładkie, bez adresowania</td>
                    <td>{DEFAULT_PRICING.leadDaysPlain} dni robocze</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z personalizacją — standard</td>
                    <td>{DEFAULT_PRICING.leadDaysStandard} dni roboczych</td>
                    <td>—</td>
                  </tr>
                  <tr>
                    <td>Koperty z personalizacją — ekspres</td>
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
            <h2>Najczęstsze pytania o personalizację kopert</h2>
          </div>
          {PERSONALIZATION_FAQ_ITEMS.map((item) => (
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
              <h2>Zanim zamówią Państwo adresowanie</h2>
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
              <h2>Gotowi na koperty z danymi odbiorców?</h2>
              <p>
                Konfigurator otworzy się z formatem DL i włączoną personalizacją. Cenę widzą Państwo
                od razu, bez zapytania ofertowego — {formatPrice(personalized.unitTotal)} brutto za
                sztukę.
              </p>
            </div>
            <ConfigureLink format="DL" personalization className="btn btn-lg">
              Wyceń koperty z adresowaniem
            </ConfigureLink>
          </div>
        </div>
      </section>
    </>
  );
}
