import type { Metadata } from 'next';
import Link from 'next/link';

import { ConfigureLink } from '@/components/home/ConfigureLink';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { aboutPageJsonLd, breadcrumbJsonLd, ogImage } from '@/lib/seo';
import { ABOUT_SHOTS } from '@/lib/showcase';

/**
 * Strona „O nas" — jedyna trasa w serwisie, której tematem jest **marka**,
 * a nie koperta.
 *
 * Po co istnieje. Kupujący w tej niszy wydaje cudze pieniądze i zanim wpisze
 * dane do konfiguratora, sprawdza, komu je wpisuje (`knowledge-base.md`, pkt 2).
 * Ta strona odpowiada na pytanie „z kim mam do czynienia i co z tego mam",
 * a nie na pytanie „ile to kosztuje".
 *
 * Świadomie **bez parametrów oferty**: żadnych kwot, wymiarów, terminów,
 * progów ani liczby odcieni. Każda taka wartość ma na stronie swojego
 * właściciela — cennik należy do `/`, wymiary do `/koperty-dl`, cena nadruku
 * do `/koperty-z-nadrukiem`, specyfikacja listy do `/koperty-personalizowane`.
 * Powtórzenie ich tutaj tworzy drugą kopię, która przy pierwszej zmianie
 * cennika zaczyna kłamać. Dane rejestrowe i kontaktowe mają własną trasę —
 * `/kontakt` — i tam zostają.
 *
 * Strona mówi w liczbie mnogiej, tak jak reszta serwisu: opisuje markę
 * Envelopes i sposób jej pracy, nie osobę właściciela.
 */

/** Potrzeby, z którymi klient tu trafia — język korzyści, nie specyfikacji. */
const NEEDS: { heading: string; text: string }[] = [
  {
    heading: 'Korespondencja, która ma coś znaczyć',
    text: 'Zaproszenie na galę, list do kontrahenta, podziękowanie po współpracy. Wszędzie tam koperta jest pierwszą rzeczą, którą odbiorca bierze do ręki — i jedyną, którą widzi, zanim zdecyduje, czy w ogóle otworzy przesyłkę.',
  },
  {
    heading: 'Spójny wizerunek marki w każdej przesyłce',
    text: 'Firmy, które dbają o identyfikację wizualną w sieci i w materiałach drukowanych, rzadko mają ją domkniętą na kopercie. Nadruk logo sprawia, że przesyłka wygląda jak część marki, a nie jak przypadkowa poczta.',
  },
  {
    heading: 'Prezenty i vouchery gotowe do wręczenia',
    text: 'Bon podarunkowy, karta lojalnościowa, kupon dla pracownika. Odpowiednio dobrana koperta zmienia kartonik w upominek, który wypada wręczyć osobiście — bez dodatkowego pudełka i bez wstążki.',
  },
  {
    heading: 'Wysyłki imienne bez ręcznej pracy',
    text: 'Listy do klientów, kartki świąteczne, zaproszenia dla całej listy gości. Zamiast wypisywać adresy odręcznie albo naklejać etykiety, otrzymują Państwo koperty z gotowymi danymi każdego odbiorcy.',
  },
];

/** Korzyści — powód, dla którego klient zostaje, a nie lista funkcji. */
const BENEFITS: { heading: string; text: string }[] = [
  {
    heading: 'Zamówienie bez czekania na ofertę',
    text: 'Nie ma formularza zapytania ofertowego ani telefonu od handlowca. Wybierają Państwo kolor, nakład i usługę, a konfigurator od razu pokazuje wartość zamówienia — całą decyzję można podjąć w jednym posiedzeniu.',
  },
  {
    heading: 'Projekt zatwierdzony przed drukiem',
    text: 'Zanim maszyna ruszy, przygotowujemy wizualizację koperty i wysyłamy ją do akceptacji. Nic nie trafia do druku bez Państwa zgody, a uwagi można zgłaszać tyle razy, ile potrzeba.',
  },
  {
    heading: 'Powtarzalność między zamówieniami',
    text: 'Pracujemy na stałej, wąskiej palecie papierów. Dzięki temu koperta z kolejnego zamówienia wygląda tak samo jak ta sprzed pół roku — różnicy odcienia między partiami nie da się nikomu wytłumaczyć, więc wolimy do niej nie dopuszczać.',
  },
  {
    heading: 'Zakup przygotowany pod firmę',
    text: 'Faktura VAT do każdego zamówienia, płatność online lub przelewem, wysyłka kurierem na terenie całej Polski. Instytucje publiczne, które nie mogą płacić z góry, rozliczamy z odroczonym terminem.',
  },
  {
    heading: 'Jeden rozmówca od pytania do paczki',
    text: 'Nie przekazujemy sprawy między działami. Osoba, która odpowiada na pytanie o odcień papieru, prowadzi to samo zamówienie aż do nadania przesyłki.',
  },
  {
    heading: 'Uczciwie o tym, czego nie zrobimy',
    text: 'Jeśli pomysł nie wyjdzie dobrze na papierze albo termin jest nierealny, mówimy o tym od razu. Wolimy stracić jedno zamówienie niż wysłać nakład, który wyląduje w koszu.',
  },
];

const META_DESCRIPTION =
  'Envelopes to polska marka kopert ozdobnych dla firm, instytucji i agencji. Drukujemy logo i dane odbiorcy, wysyłamy kurierem w całej Polsce. Poznaj nasz sposób pracy.';

export const metadata: Metadata = {
  /* Bez słowa „Envelopes" w tytule — szablon z layoutu dokleja markę na końcu,
     a podwójna nazwa zjadałaby limit bez żadnego zysku. */
  title: 'O nas — marka kopert ozdobnych dla firm',
  description: META_DESCRIPTION,
  keywords: [
    'envelopes o nas',
    'o firmie envelopes',
    'producent kopert ozdobnych',
    'koperty firmowe z nadrukiem',
    'koperty ozdobne dla firm',
  ],
  alternates: { canonical: '/o-nas' },
  openGraph: {
    type: 'website',
    title: 'O nas — marka kopert ozdobnych dla firm | Envelopes',
    description: META_DESCRIPTION,
    url: '/o-nas',
    images: [
      ogImage('o-nas', 'Zbliżenie na złoty papier metaliczny koperty DL z katalogu Envelopes'),
    ],
  },
  /* `layout.tsx` ustawia `twitter.images` na kartę strony głównej dla całego
     serwisu, a Next scala te obiekty płytko — bez tego nadpisania podgląd
     odnośnika na X pokazywałby paletę kolorów zamiast strony marki. */
  twitter: {
    card: 'summary_large_image',
    title: 'O nas — marka kopert ozdobnych dla firm',
    description: META_DESCRIPTION,
    images: [ogImage('o-nas', 'Zbliżenie na złoty papier metaliczny koperty DL').url],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={aboutPageJsonLd({
          description: META_DESCRIPTION,
          image: ogImage('o-nas', '').url,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: 'O nas', url: '/o-nas' },
        ])}
      />

      {/* ── Hero ── */}
      <section className="hero hero-with-bg">
        <div className="hero-main-content">
          <ParallaxBackground imageUrl="/images/Hero%20Envelopes%20Robocze.png" />
          <div className="container">
            <nav
              aria-label="Ścieżka nawigacji"
              className="small muted"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span> O nas
            </nav>

            <span className="eyebrow">O nas</span>
            <h1>Robimy koperty, które robią wrażenie</h1>
            <p className="hero-lead">
              Envelopes to polska marka kopert ozdobnych dla firm, instytucji i agencji.
              Drukujemy na nich logo i dane odbiorcy, a gotowe zamówienie wysyłamy kurierem
              na terenie całej Polski. Wierzymy, że koperta nie jest opakowaniem, tylko
              pierwszym zdaniem, które marka wypowiada do odbiorcy.
            </p>

            <div className="row">
              <ConfigureLink format="DL" className="btn btn-lg">
                Otwórz konfigurator
              </ConfigureLink>
              <Link href="#dlaczego-my" className="btn btn-secondary">
                Dlaczego Envelopes
              </Link>
            </div>
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Wycena od razu',
                  note: 'Cena widoczna w konfiguratorze, bez czekania na ofertę',
                },
                {
                  title: 'Akceptacja przed drukiem',
                  note: 'Wizualizacja koperty do zatwierdzenia przed produkcją',
                },
                {
                  title: 'Wysyłka w całej Polsce',
                  note: 'Kurier pod wskazany adres, sprzedaż wyłącznie wysyłkowa',
                },
                {
                  title: 'Faktura VAT',
                  note: 'Do każdego zamówienia, także dla instytucji publicznych',
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

      {/* ── Kim jesteśmy ── */}
      <section className="section section-surface" id="kim-jestesmy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Kim jesteśmy</span>
            <h2>Marka, która zajmuje się jedną rzeczą</h2>
          </div>

          <p style={{ maxWidth: '68ch' }}>
            Envelopes powstało z prostej obserwacji: firmy potrafią zadbać o każdy szczegół
            swojej identyfikacji — logo, stronę, wizytówki, papier firmowy — a potem wkładają
            to wszystko do zwykłej białej koperty. Przesyłka, w którą włożono tygodnie pracy,
            trafia na biurko odbiorcy wyglądając jak rachunek za prąd.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Postanowiliśmy zająć się wyłącznie tym jednym elementem i zrobić go dobrze.
            Nie sprzedajemy papeterii, wkładek ani gadżetów reklamowych. Sprzedajemy koperty
            ozdobne oraz dwie usługi wykonywane na nich: nadruk logo i personalizację danych
            odbiorcy. Wąska oferta pozwala nam trzymać stałą jakość papieru i druku zamiast
            pilnować katalogu, w którym połowa pozycji byłaby przypadkowa.
          </p>
          <p style={{ maxWidth: '68ch' }}>
            Pracujemy przede wszystkim z firmami, instytucjami, agencjami eventowymi
            i organizatorami wydarzeń — wszędzie tam, gdzie korespondencja wychodzi seriami
            i ma reprezentować nadawcę. Sprzedaż prowadzimy wyłącznie wysyłkowo, dzięki czemu
            obsługujemy klientów w każdym miejscu w Polsce na tych samych zasadach.
          </p>
        </div>
      </section>

      {/* ── Potrzeby klientów ── */}
      <section className="section" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dla kogo pracujemy</span>
            <h2>Potrzeby, z którymi do nas przychodzą</h2>
            <p>
              Za każdym zamówieniem stoi konkretna sytuacja. Poniżej te, które powtarzają się
              najczęściej — jeśli Państwa przypadek jest inny, tym chętniej o nim porozmawiamy.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {NEEDS.map((need) => (
              <div className="card" key={need.heading}>
                <h3 style={{ fontSize: 19 }}>{need.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {need.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Korzyści ── */}
      <section className="section section-surface" id="dlaczego-my">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Dlaczego Envelopes</span>
            <h2>Co dostają Państwo od nas</h2>
            <p>
              Sześć rzeczy, które staramy się robić lepiej niż jest to w tej branży przyjęte.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {BENEFITS.map((benefit) => (
              <div className="card" key={benefit.heading}>
                <h3 style={{ fontSize: 19 }}>{benefit.heading}</h3>
                <p className="small" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <ConfigureLink format="DL" print className="btn">
              Wyceń koperty z nadrukiem
            </ConfigureLink>
            <span className="small muted">
              Konfigurator otworzy się z włączonym nadrukiem. Wizualizację dostaną Państwo do
              akceptacji, zanim cokolwiek trafi do druku.
            </span>
          </div>
        </div>
      </section>

      {/* ── Oferta — rozdzielacz ruchu do czterech filarów ── */}
      <section className="section" id="czym-sie-zajmujemy">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Oferta</span>
            <h2>Czym się zajmujemy</h2>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk logo firmowego</h3>
              <p className="small">
                Ten sam projekt na całym nakładzie: znak firmowy, dane kontaktowe albo pełna
                grafika. Szczegóły opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Personalizacja i adresowanie</h3>
              <p className="small">
                Na każdej kopercie inne dane: pełny adres pocztowy albo samo imię i nazwisko.
                Sposób przekazania listy opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Koperty DL</h3>
              <p className="small">
                Podstawowy format korespondencji firmowej. Co się do niego zmieści i jak dobrać
                wkładkę, sprawdzą Państwo na stronie{' '}
                <Link href="/koperty-dl">koperty DL</Link>.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Koperty pod bony i vouchery</h3>
              <p className="small">
                Najczęstsze zastosowanie poza korespondencją. Dobór odcienia do marki opisaliśmy
                na stronie <Link href="/koperty-na-vouchery">koperty na vouchery</Link>.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            {/* Sam odcień — gramatura jest parametrem sprzedażowym i ma
                właściciela na stronach filarowych, nie tutaj. */}
            <ShowcaseGrid shots={ABOUT_SHOTS} columns={3} spec="color" />
          </div>
          <p className="small muted" style={{ marginTop: 'var(--space-4)', maxWidth: '68ch' }}>
            Nadruki na powyższych zdjęciach są przykładowe i powstały na potrzeby prezentacji.
            Nazwy firm, które na nich widać, nie są nazwami naszych klientów — realizacji klientów
            nie publikujemy.
          </p>

          <div className="row" style={{ marginTop: 'var(--space-6)' }}>
            <Link href="/kontakt" className="btn btn-secondary">
              Kontakt i wycena indywidualna
            </Link>
            <span className="small muted">
              Zamówienia wielkonakładowe wyceniamy przez formularz — ustalamy wtedy harmonogram
              dostaw i sposób rozliczenia.
            </span>
          </div>
        </div>
      </section>

      {/* ── Finalne CTA ── */}
      <section className="section-tight">
        <div className="container">
          <div className="final-cta">
            <div>
              <h2>Koperty można zamówić od razu</h2>
              <p>
                Konfigurator stoi na stronie głównej i przelicza wartość zamówienia na bieżąco.
                Nie ma formularza ofertowego, nie ma oczekiwania na odpowiedź — wybór koloru
                i ilości zajmuje minutę. Poradniki o kopertach i korespondencji firmowej zebraliśmy
                na <Link href="/blog">blogu Envelopes</Link>.
              </p>
            </div>
            <ConfigureLink format="DL" className="btn btn-lg">
              Otwórz konfigurator
            </ConfigureLink>
          </div>
        </div>
      </section>
      <StickyCta format="DL" />
    </>
  );
}
