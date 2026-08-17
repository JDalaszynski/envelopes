import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { PERSONALIZATION_SHOTS } from '@/lib/showcase';
import {
  BULK_QUOTE_THRESHOLD,
  COLORS,
  FORMAT_MAP,
  PERSONALIZATION_SCOPES,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  PERSONALIZATION_SHEET_MAX_ROWS,
  PRINT_SAFE_MARGIN_MM,
} from '@/lib/catalog';
import { getPost } from '@/lib/blog';
import { PERSONALIZATION_FAQ_ITEMS } from '@/lib/faq';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice, round2 } from '@/lib/pricing';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  ogImage,
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
 * szablonów z `PERSONALIZATION_SCOPES` — tej samej definicji, z której
 * generujemy pliki XLSX i którą czyta walidacja wgranego arkusza.
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

/**
 * Treści wspierające filar K2. Lista rośnie razem z planem (poz. 8, 14, 15) —
 * `getPost` zwraca `undefined` dla wpisu, który jeszcze nie powstał, więc
 * dopisanie slugu z wyprzedzeniem niczego nie psuje.
 */
const sheetGuide = getPost('adresowanie-kopert-z-arkusza-czy-recznie');
const GUIDES = [sheetGuide].filter((post) => post !== undefined);

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

/**
 * Pola wymagane w obu wariantach szablonu. Od czasu, gdy lista samych nazwisk
 * ma własny zestaw kolumn, jedna lista pól opisywałaby tylko połowę prawdy.
 */
const REQUIRED_COLUMNS_LABEL = PERSONALIZATION_SCOPES.map((scope) => {
  const required = scope.columns
    .filter((column) => column.required)
    .map((column) => column.label.toLowerCase())
    .join(', ');
  return `${scope.label.toLowerCase()} — ${required}`;
}).join('; ');

const HOW_TO_STEPS = [
  {
    name: 'Konfiguracja zamówienia',
    text: `W konfiguratorze wybierają Państwo kolor koperty i ilość od ${DEFAULT_PRICING.moqWithPrint} sztuk, po czym włączają personalizację i wskazują, czy na kopercie ma stanąć pełny adres, czy samo imię i nazwisko. Cena przelicza się od razu.`,
  },
  {
    name: 'Przekazanie danych odbiorców',
    text: 'Do wyboru są dwa tryby: wpisanie treści wprost w konfiguratorze albo pobranie szablonu z liczbą wierszy równą zamówionej ilości kopert. Uzupełniony arkusz wgrywają Państwo z powrotem — sprawdzamy komplet pól wymaganych w wybranym wariancie i zgodność liczby wierszy z ilością kopert.',
  },
  {
    name: 'Płatność',
    text: 'Do wyboru są BLIK, karta, szybki przelew i przelew tradycyjny. Instytucje publiczne i urzędy mogą zapłacić fakturą z odroczonym terminem płatności 14 dni — taka faktura nie wstrzymuje produkcji.',
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
    text: 'Pismo zaadresowane imiennie do członka zarządu nie ląduje na stosie korespondencji masowej. Adres drukujemy wprost na kopercie, więc nie ma naklejki, która się odkleja, ani odręcznego pisma, którego czytelność zależy od tego, kto akurat wypisywał.',
  },
  {
    heading: 'Działy HR i employer branding',
    text: 'Oferta pracy, gratulacje po awansie i decyzja o premii trafiają do jednej osoby, nie do działu. Koperty imienne da się zamówić pod jedną rekrutację albo jedną turę podwyżek — bez kupowania zapasu na cały rok.',
  },
  {
    heading: 'Hotele, resorty i pensjonaty',
    text: 'Karta powitalna z nazwiskiem gościa leży w pokoju, zanim gość przyjedzie — to pierwszy przedmiot, który bierze do ręki. Tu wystarczy samo nazwisko, bez adresu; listę z systemu rezerwacji wgrywają Państwo arkuszem. Sprawdzają się jasne odcienie: Ecru, Biała Perłowa i Biały.',
  },
  {
    heading: 'Uczelnie, szkoły i firmy szkoleniowe',
    text: 'Dyplom wręcza się konkretnemu absolwentowi, więc koperta powinna nosić jego nazwisko. Jedna grupa szkoleniowa to zwykle kilkanaście osób i tyle w zupełności wystarczy, żeby złożyć zamówienie. Certyfikat A4 złożony na trzy wchodzi do koperty bez dodatkowego zagięcia.',
  },
  {
    heading: 'Agencje eventowe, PR i kreatywne',
    text: 'Zaproszenie na galę adresowane imiennie działa inaczej niż zaproszenie „do firmy" — zobowiązuje konkretną osobę. Kiedy data wydarzenia goni, zamówienie da się puścić trybem ekspresowym, a kolory spoza standardu, jak Matcha czy Jeansowy, nie kosztują więcej niż biel.',
  },
  {
    heading: 'Kancelarie prawne i notarialne',
    text: 'Pismo procesowe adresowane jest do strony postępowania, nie do instytucji. Nadrukowany adres zdejmuje ryzyko pomyłki przy przepisywaniu z akt ręką. Do korespondencji formalnej wybierane są kolory stonowane: czerń, granat i szarobrązowy.',
  },
  {
    heading: 'Kliniki, gabinety i salony SPA',
    text: 'Bon z imieniem obdarowanego przestaje być kuponem, a staje się prezentem. Taka koperta nigdzie nie jedzie — wręcza się ją przy ladzie — więc drukujemy na niej samo imię albo dedykację, bez adresu pocztowego. Długość tekstu nie zmienia ceny.',
  },
  {
    heading: 'Biura nieruchomości i deweloperzy',
    text: 'Akt notarialny i umowa deweloperska trafiają do nabywcy z imienia i nazwiska — to dokument, który zostaje w domu na lata. Nadrukowany adres porządkuje przekazanie kompletu po odbiorze lokalu.',
  },
  {
    heading: 'Butiki, jubilerzy i marki premium',
    text: 'List do klienta programu lojalnościowego potrzebuje dwóch rzeczy naraz: logo marki i nazwiska odbiorcy. Obie drukujemy w jednym przebiegu, więc koperta nie wraca do maszyny po raz drugi.',
  },
  {
    heading: 'Wedding plannerzy i pary młode',
    text: 'Zaproszenia adresowane drukiem wychodzą jednolicie, niezależnie od tego, ile osób wypisywało listę gości. Personalizację wykonujemy dziś na kopertach DL — formaty C6 i K4 mają status „Dostępne wkrótce" i nie można ich jeszcze zamówić.',
  },
];

export const metadata: Metadata = {
  /* Bez kwoty w tytule — decyzja właściciela z 17 sierpnia 2026. */
  title: 'Personalizowane koperty i adresowanie kopert',
  description: `Drukujemy dane odbiorcy wprost na kopercie — pełny adres albo samo nazwisko. ${formatPrice(personalized.unitTotal)} brutto/szt. od ${DEFAULT_PRICING.moqWithPrint} sztuk, listę przekazują Państwo arkuszem.`,
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
    images: [
      ogImage(
        'koperty-personalizowane',
        'Trzy czarne koperty DL z nadrukowanymi imionami i nazwiskami odbiorców'
      ),
    ],
  },
};

export default function PersonalizedEnvelopesPage() {
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
              Drukujemy na kopercie dane odbiorcy — pełny adres, kiedy przesyłka idzie pocztą, albo
              samo imię i nazwisko, kiedy koperty wręczają Państwo do ręki. Każda wychodzi z innymi
              danymi, wszystkie tym samym pismem. Personalizowana koperta kosztuje{' '}
              {formatPrice(personalized.unitTotal)} brutto za sztukę, od{' '}
              {DEFAULT_PRICING.moqWithPrint} sztuk.
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
              zamówienia wystawiamy fakturę VAT, a instytucjom publicznym i urzędom —
              z odroczonym terminem płatności 14 dni.
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
            Personalizowana koperta kosztuje{' '}
            <strong>{formatPrice(personalized.unitTotal)} brutto</strong> (
            {formatPrice(personalized.net)} netto) za sztukę — koperta plus adresowanie, rozpisane
            w tabeli niżej. Stawka nie zależy od długości tekstu ani od tego, ile różnych danych
            jest na liście: koperta z samym imieniem kosztuje tyle samo, co z pełnym adresem.
            Rabatów ilościowych nie stosujemy, więc cena za sztukę jest ta sama przy każdym
            nakładzie.
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
            W konfiguratorze odpowiadają Państwo na dwa pytania. Pierwsze: co ma stanąć na kopercie
            — pełny adres, jeśli przesyłka idzie pocztą, albo samo imię i nazwisko, jeśli koperty
            wręczają Państwo do ręki. Drugie: jak przekazać dane — wpisać je wprost w
            konfiguratorze czy wgrać arkusz z listą. Odpowiedź na pierwsze pytanie ustawia kolumny
            szablonu, więc lista samych nazwisk nie musi udawać listy wysyłkowej.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Sposób przekazania danych zależy głównie od skali. Przy kilkunastu kopertach wpisanie
            danych ręcznie jest szybsze niż otwieranie Excela. Przy stu pozycjach arkusz nie ma
            alternatywy — i dodatkowo pozwala przekazać listę do sprawdzenia komuś innemu w firmie,
            zanim zamówienie ruszy.
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
                  <td>
                    Tekst odtwarzamy dokładnie w podanej postaci; sprawdzenie następuje na
                    wizualizacji. Konfigurator pokazuje, ile wierszy Państwo wpisali
                  </td>
                  <td>
                    Przy wgraniu sprawdzamy komplet pól wymaganych w wybranym wariancie i zgodność
                    liczby wierszy z ilością kopert
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

          {/* Link w dół do treści wspierającej (content-plan.md poz. 8).
              Anchor = tytuł wpisu, czyli jego fraza długiego ogona
              `adresowanie kopert z arkusza`; fraza `adresowanie kopert`
              zostaje przy tej stronie. */}
          {sheetGuide && (
            <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
              Powyższa tabela zestawia oba tryby według skali wysyłki. Gdy sama liczba adresów
              niczego nie przesądza, decydują dwie inne rzeczy — treść nadruku i miejsce, w którym
              dane już są. Rozstrzygamy je w poradniku{' '}
              <Link href={`/blog/${sheetGuide.slug}`}>{sheetGuide.title.toLowerCase()}</Link>.
            </p>
          )}

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" personalization className="btn">
              Zamów koperty adresowane
            </ConfigureLink>
          </div>
        </div>
      </section>

      {/* ── Wymagania dla listy danych — tabela wprost z generatora szablonu ── */}
      <section className="section section-surface" id="lista-danych">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dane odbiorców</span>
            <h2>Jak przygotować listę do nadruku</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Szablon pobierany z konfiguratora ma tyle wierszy, ile kopert Państwo zamawiają, i tyle
            kolumn, ile wymaga wybrany zakres. Przy przesyłce pocztowej trzeba podać komplet pól
            adresowych; przy kopertach wręczanych do ręki wystarczy nazwisko. Liczba wypełnionych
            wierszy musi zgadzać się z liczbą kopert — różnicę zgłaszamy przy wgrywaniu pliku,
            zanim zamówienie trafi do produkcji.
          </p>

          {/* Obie tabele powstają z `PERSONALIZATION_SCOPES` — z tej samej
              definicji, z której generator buduje szablon XLSX, a walidacja
              czyta pola wymagane. Dopisanie kolumny przepisuje szablon,
              walidację i tę stronę jednocześnie. */}
          {PERSONALIZATION_SCOPES.map((scope) => (
            <div key={scope.id}>
              <h3 style={{ marginTop: 'var(--space-7)' }}>{scope.label}</h3>
              <p className="small muted" style={{ maxWidth: '68ch' }}>
                {scope.hint}
              </p>
              <div className="table-wrap m-cards" style={{ marginTop: 'var(--space-4)' }}>
                <table className="data">
                  <caption className="sr-only">
                    Kolumny szablonu „{scope.label}" wraz z oznaczeniem pól wymaganych
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Kolumna</th>
                      <th scope="col">Wymagana</th>
                      <th scope="col">Jak wypełnić</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scope.columns.map((column) => (
                      <tr key={column.label}>
                        <th scope="row">{column.label}</th>
                        <td data-label="Wymagana">{column.required ? 'Tak' : 'Nie'}</td>
                        <td data-label="Jak wypełnić">{column.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Przyjmujemy pliki {PERSONALIZATION_SHEET_EXTENSIONS_LABEL}, do{' '}
            {PERSONALIZATION_SHEET_MAX_ROWS.toLocaleString('pl-PL')} wierszy. Tekst odtwarzamy
            dokładnie w postaci, w jakiej został przekazany — nie poprawiamy odmiany nazwisk,
            wielkich liter ani skrótów. Jeśli w arkuszu stoi „ul." przed nazwą ulicy, taki zapis
            znajdzie się na kopercie. To celowe: dane bywają pobierane z systemów, w których zapis
            jest już ustandaryzowany, i nie chcemy go po cichu zmieniać.
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
            Personalizacja przyjmuje dowolny tekst, nie tylko adres pocztowy. Na kopercie może
            stanąć imię i nazwisko, nazwa firmy, pełny adres albo dedykacja — zależnie od tego, do
            czego koperta ma posłużyć. Cena jest w każdym z tych przypadków ta sama.
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
                Koperty wręczane do ręki: karty powitalne w hotelu, dyplomy dla grupy szkoleniowej,
                decyzje o premii, bony podarunkowe. Nic nie jedzie pocztą, więc adresu nie ma po co
                podawać — szablon dla takiej listy ma same nazwiska. Wariant voucherowy opisaliśmy
                osobno na stronie <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink
                  format="DL"
                  personalization
                  personalizationScope="imiona"
                  className="btn btn-secondary btn-sm"
                >
                  Zamów koperty z samym nazwiskiem
                </ConfigureLink>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 19 }}>Dedykacja lub krótki tekst</h3>
              <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                Podziękowanie, nazwa wydarzenia, numer edycji kursu albo hasło kampanii. Treść
                wpisują Państwo w konfiguratorze i odtwarzamy ją dokładnie w podanej postaci.
              </p>
            </div>
          </div>

          {/* Trzy kadry pokrywają się jeden do jednego z trzema kartami wyżej:
              pełny adres, samo imię i nazwisko, zapis odręczny. Kolejność jest
              ta sama, żeby czytelnik zobaczył wariant, o którym właśnie czytał. */}
          <ShowcaseGrid shots={PERSONALIZATION_SHOTS} columns={3} />

          <p className="small muted" style={{ marginTop: 'var(--space-5)', maxWidth: '68ch' }}>
            Imiona i adresy na zdjęciach są przykładowe — pokazują układ nadruku, nie dane
            realnych odbiorców. Na Państwa kopertach drukujemy dane z przesłanego arkusza,
            w takiej postaci, w jakiej zostały w nim zapisane.
          </p>

          <p style={{ maxWidth: '68ch', marginTop: 'var(--space-6)' }}>
            Nasze koperty nie mają okienka adresowego, więc dane drukujemy na wolnej przedniej
            ściance. Personalizację da się połączyć z nadrukiem logo w jednym zamówieniu — logo
            nadawcy i dane odbiorcy powstają wtedy w tym samym przebiegu produkcyjnym, a nie na
            dwóch urządzeniach o różnym odcieniu czerni.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-5)' }}>
            <ConfigureLink format="DL" print personalization className="btn">
              Wyceń koperty z logo i adresem
            </ConfigureLink>
            <span className="small muted">
              Wizualizację zobaczą Państwo przed drukiem — obie usługi na jednym podglądzie.
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
              Odcień papieru nie zmienia kosztu adresowania — o czytelności danych decyduje
              kontrast, nie kolor. Na ciemnych kopertach drukujemy jasnym kolorem, na jasnych —
              ciemnym.
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
            {/* Zdanie o „pozostałych kolorach" wskazywało na Złoty, Srebrną
                Perłową i Szarobrązowy — wszystkie trzy mają dziś własny kadr
                i stoją w siatce wyżej, więc odsyłacz kierował donikąd. */}
            Nadruk danych przyjmuje wszystkie {PERSONALIZED_COLORS.length} odcieni z palety,
            w tej samej cenie. Adres widoczny na zdjęciach jest przykładowy — drukujemy dane
            z Państwa arkusza, w postaci, w jakiej zostały w nim zapisane.
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

      {/* ── Poradniki — treści wspierające filar (poz. 8, 14 i 15 planu) ──
          Sekcja wróciła po czystce wpisów startowych z 15 sierpnia 2026.
          Przy jednym wpisie renderujemy pojedynczą kartę zamiast siatki,
          żeby nie zostawiać pustych kolumn; siatka włącza się od drugiego. */}
      {GUIDES.length > 0 && (
        <section className="section section-surface" id="poradniki">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Poradniki</span>
              <h2>Jak przygotować dane do adresowania kopert</h2>
              <p>
                Personalizacja zaczyna się po Państwa stronie — od listy odbiorców. Poniższe
                poradniki prowadzą przez decyzje, które podejmują Państwo, zanim otworzą
                konfigurator.
              </p>
            </div>

            <div
              className={GUIDES.length > 1 ? 'grid grid-2' : undefined}
              style={{ gap: 'var(--space-5)' }}
            >
              {GUIDES.map((post) => (
                <article className="card card-lg" key={post.slug}>
                  <span className="badge">{post.category}</span>
                  <h3 style={{ fontSize: 21, marginTop: 'var(--space-3)' }}>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="small" style={{ marginTop: 'var(--space-2)' }}>
                    {post.lead}
                  </p>
                  <p className="small muted" style={{ marginBottom: 0 }}>
                    {post.readingMinutes} min czytania
                  </p>
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
                Konfigurator otworzy się z włączoną personalizacją. Wystarczy wybrać kolor i wskazać,
                co ma stanąć na kopercie — cenę widzą Państwo od razu.
              </p>
            </div>
            <ConfigureLink format="DL" personalization className="btn btn-lg">
              Wyceń koperty z adresowaniem
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" personalization />
    </>
  );
}
