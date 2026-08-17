import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddColorToCart } from '@/components/cart/AddColorToCart';
import { ConfigureLink } from '@/components/home/ConfigureLink';
import { StickyCta } from '@/components/ui/StickyCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { ShowcaseGrid } from '@/components/ui/ShowcaseGrid';
import { COLORS, COLOR_MAP, FORMAT_MAP, type FormatId } from '@/lib/catalog';
import { COLOR_PAGES, COLOR_PAGE_IDS, capitalize, colorPagePath } from '@/lib/color-pages';
import { DEFAULT_PRICING, DELIVERY_COST, calculatePrice, formatPrice } from '@/lib/pricing';
import {
  SITE_URL,
  breadcrumbJsonLd,
  colorEnvelopeProductJsonLd,
  faqJsonLd,
  ogImage,
} from '@/lib/seo';
import { shotByFile, showcaseSrc } from '@/lib/showcase';
import type { EnvelopeConfig } from '@/lib/types';

/**
 * Strona wariantu kolorystycznego — `/koperty/[kolor]` (content-plan.md, Faza 3).
 *
 * Filarem klastra K5 jest **strona główna**, nie osobny hub `/koperty`
 * (decyzja z 13 sierpnia 2026), więc każda strona koloru linkuje w górę do `/`
 * anchorem `koperty ozdobne`. Frazy `koperty ozdobne` i `koperty kolorowe`
 * zostają przy `/`; tutaj celujemy w `[kolor] koperty dl` i w warianty
 * z nadrukiem, które w `keywords.md` należą jednocześnie do K1 — właścicielem
 * jest strona koloru, filar F1 wyłącznie linkuje.
 *
 * Trzy rozgraniczenia pilnowane świadomie:
 * 1. Wobec `/koperty-dl` (K4): tamta strona jest właścicielem **wymiarów** —
 *    tabeli formatów, geometrii i dopasowań wkładek. Tutaj wymiary są jednym
 *    wierszem specyfikacji, a treść dotyczy odcienia.
 * 2. Wobec `/` (K3): paleta wszystkich odcieni i cennik kopert gładkich stoją
 *    na stronie głównej. Tutaj pojawia się cena **tego wariantu** — bo to jest
 *    strona produktowa i strona docelowa oferty w Merchant Center, a oferta bez
 *    widocznej ceny jest odrzucana.
 * 3. Wobec F1 i F2: nadruk i personalizacja to po jednej sekcji z odesłaniem.
 *    Wymagania plikowe, proces akceptacji i cennik usług zostają na filarach.
 *
 * Treść mieszka w `src/lib/color-pages.ts` i **to ona jest listą opublikowanych
 * stron** — kolor bez wpisu nie ma adresu, więc nie da się wygenerować strony
 * bez tekstu ani zgłosić jej do wyszukiwarek.
 */

/**
 * Format wiodący strony koloru. Dziś `DL` jest jedynym, który da się kupić,
 * więc strona opisuje wariant kolorystyczny w tym formacie.
 *
 * **Adres jest kolorowy, nie formatowy** — gdy ruszą C6 i K4, ta sama strona
 * pokaże po jednym wariancie na format zamiast rozmnażać się na `czarny-c6`
 * i `czarny-k4`. Reguła i lista rzeczy do zmiany: `src/lib/color-pages.ts`.
 */
const FORMAT: FormatId = 'DL';
const SPEC = FORMAT_MAP[FORMAT];

export function generateStaticParams() {
  return COLOR_PAGE_IDS.map((kolor) => ({ kolor }));
}

/** Kolor spoza listy nie ma strony — 404 zamiast pustego szablonu. */
export const dynamicParams = false;

function getPage(kolor: string) {
  const content = COLOR_PAGES[kolor];
  const color = COLOR_MAP[kolor];
  return content && color ? { content, color } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kolor: string }>;
}): Promise<Metadata> {
  const { kolor } = await params;
  const page = getPage(kolor);
  if (!page) return { title: 'Nie znaleziono koloru' };

  const { content } = page;
  const image = ogImage(content.ogImageSlug, content.ogImageAlt);

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: colorPagePath(kolor) },
    openGraph: {
      type: 'website',
      title: content.title,
      description: content.description,
      url: colorPagePath(kolor),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [image.url],
    },
  };
}

export default async function ColorPage({ params }: { params: Promise<{ kolor: string }> }) {
  const { kolor } = await params;
  const page = getPage(kolor);
  if (!page) notFound();

  const { content, color } = page;
  const shots = content.shotFiles.map(shotByFile);
  const weightLabel = color.weight?.replace('g', ' g/m²');

  /* Cena tego wariantu. Liczona z `DEFAULT_PRICING`, czyli z tego samego
     źródła co konfigurator, koszyk, dane strukturalne i feed produktowy —
     kwota widoczna w tabeli nie może różnić się od naliczanej. */
  const baseConfig: EnvelopeConfig = {
    format: FORMAT,
    color: color.id,
    quantity: 1,
    print: false,
    printFiles: [],
    personalization: false,
    shippingSpeed: 'standard',
  };
  const plain = calculatePrice(baseConfig);

  /* Zdjęcia do danych strukturalnych: trzy kadry katalogowe tego odcienia
     (gładki, z nadrukiem, z personalizacją) i kadry aranżacyjne, które strona
     faktycznie renderuje. Adresy bezwzględne — JSON-LD nie ma `metadataBase`. */
  const productImages = [
    color.images?.[FORMAT],
    color.printImages?.[FORMAT],
    color.personalizedImages?.[FORMAT],
    ...shots.map(showcaseSrc),
  ]
    .filter((path): path is string => Boolean(path))
    .map((path) => `${SITE_URL}${path}`);

  return (
    <>
      <JsonLd
        data={colorEnvelopeProductJsonLd({
          colorId: color.id,
          colorName: color.name,
          format: FORMAT,
          weight: color.weight,
          finish: color.finish,
          images: productImages,
        })}
      />
      <JsonLd data={faqJsonLd(content.faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Strona główna', url: '/' },
          { name: `Koperty ${FORMAT} ${SPEC.dimensions}`, url: '/koperty-dl' },
          { name: capitalize(content.phrase), url: colorPagePath(color.id) },
        ])}
      />

      {/* ── Hero — blok odpowiedzi GEO i pierwsze CTA nad linią zgięcia ── */}
      <section className="hero">
        <div className="container">
          <nav
            aria-label="Ścieżka nawigacji"
            className="small muted"
            style={{ marginBottom: 'var(--space-4)' }}
          >
            <Link href="/">Strona główna</Link> <span aria-hidden="true">›</span>{' '}
            <Link href="/koperty-dl">Koperty DL</Link> <span aria-hidden="true">›</span>{' '}
            {color.name}
          </nav>

          {/* Kolumna tekstowa i zdjęcie odcienia obok siebie. Strona koloru
              sprzedaje **wygląd papieru**, więc pierwszy ekran musi go pokazać
              — sam nagłówek z nazwą odcienia zostawiał decyzję zakupową bez
              tego jednego argumentu, po który klient tu wchodzi.

              Kadr jest oznaczony jako `eager`: to kandydat na LCP tej strony,
              a `aspect-ratio` w `.placeholder` rezerwuje mu miejsce, więc
              wejście zdjęcia nie przesuwa nagłówka (pkt 5.5 briefu). */}
          <div className="color-hero">
            <div className="color-hero-copy">
              <span className="eyebrow">{content.eyebrow}</span>
              <h1>{content.h1}</h1>
              <p className="hero-lead">{content.lead}</p>

              <div className="row">
                <Link href="#zamow" className="btn btn-lg">
                  Zamów {content.phrase}
                </Link>
                <ConfigureLink format={FORMAT} color={color.id} print className="btn btn-secondary">
                  Dodaj nadruk logo
                </ConfigureLink>
              </div>
            </div>

            <EnvelopePlaceholder
              format={FORMAT}
              colorId={color.id}
              ratio="photo"
              eager
              sizes="(max-width: 900px) calc(100vw - 48px), 516px"
            />
          </div>
        </div>

        <div className="hero-usp-section">
          <div className="container">
            <div className="usp-bar" style={{ flexWrap: 'wrap' }}>
              {[
                /* Pierwsza pozycja paska należy do koloru, nie do szablonu:
                   dla odcieni matowych barwienie w masie jest najmocniejszym
                   argumentem, ale dla Złotego (`finish: 'metaliczne'`) mówi
                   o papierze najmniej istotną rzecz. Kolor bez własnej
                   wartości zostaje przy domyślnej — `color-pages.ts`. */
                content.paperUsp ?? {
                  title: 'Barwiony w masie',
                  note: 'Kolor sięga w głąb arkusza — zgięcie i krawędź zostają w odcieniu papieru',
                },
                ...(weightLabel
                  ? [
                      {
                        title: weightLabel,
                        note: 'Gramatura papieru w tym odcieniu, bez okienka adresowego',
                      },
                    ]
                  : []),
                {
                  title: `Od ${DEFAULT_PRICING.moqWithoutPrint} sztuki`,
                  note: `${formatPrice(plain.unitTotal)} brutto za sztukę — tyle samo co każdy z ${COLORS.length} odcieni`,
                },
                {
                  title: `${DEFAULT_PRICING.leadDaysPlain} dni robocze`,
                  note: 'Koperty gładkie nie przechodzą przez produkcję ani przez akceptację projektu',
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

      {/* ── Charakter odcienia — jedyna sekcja, której nie da się przepisać
             z parametrów katalogu ── */}
      <section className="section" id="charakter">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Papier</span>
            <h2>{content.character.heading}</h2>
          </div>

          {/* Bez zdjęcia: ten sam kadr stoi w hero, dwa ekrany wyżej. Sekcja
              opisuje cechy papieru, których zdjęcie produktowe i tak nie
              pokazuje — kolor na zgięciu, zachowanie w świetle — więc jego
              powtórzenie niczego by nie dowiodło. */}
          {content.character.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* ── Specyfikacja — tu stoi cena wariantu (strona docelowa oferty) ── */}
      <section className="section section-surface" id="specyfikacja">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Specyfikacja</span>
            <h2>
              {capitalize(content.phrase)} — parametry
            </h2>
          </div>

          <table className="data">
            <tbody>
              <tr>
                <th scope="row">Format i wymiary</th>
                <td>
                  {FORMAT} {SPEC.dimensions} —{' '}
                  <Link href="/koperty-dl">co się mieści w kopercie DL</Link>
                </td>
              </tr>
              <tr>
                <th scope="row">Kolor katalogowy</th>
                <td>{color.name}</td>
              </tr>
              <tr>
                <th scope="row">Papier</th>
                <td>Ozdobny, barwiony w masie{weightLabel ? `, ${weightLabel}` : ''}</td>
              </tr>
              {color.finish && (
                <tr>
                  <th scope="row">Wykończenie</th>
                  <td>{color.finish} — bez dopłaty</td>
                </tr>
              )}
              <tr>
                <th scope="row">Okienko adresowe</th>
                <td>Brak — przednia ścianka jest jednolitą płaszczyzną papieru</td>
              </tr>
              <tr>
                <th scope="row">Cena</th>
                <td>
                  {formatPrice(plain.unitTotal)} brutto ({formatPrice(plain.net)} netto) za sztukę,
                  identyczna we wszystkich {COLORS.length} odcieniach
                </td>
              </tr>
              <tr>
                <th scope="row">Minimalna ilość</th>
                <td>
                  {DEFAULT_PRICING.moqWithoutPrint} sztuka bez nadruku,{' '}
                  {DEFAULT_PRICING.moqWithPrint} sztuk z nadrukiem lub personalizacją
                </td>
              </tr>
              <tr>
                <th scope="row">Czas realizacji</th>
                <td>
                  {DEFAULT_PRICING.leadDaysPlain} dni robocze dla kopert gładkich,{' '}
                  {DEFAULT_PRICING.leadDaysStandard} dni roboczych z nadrukiem
                </td>
              </tr>
              <tr>
                <th scope="row">Dostawa</th>
                <td>Kurier, {formatPrice(DELIVERY_COST)} brutto za zamówienie</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Nadruk i personalizacja — po jednej sekcji, reszta na filarach ── */}
      <section className="section" id="nadruk">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nadruk</span>
            <h2>{content.printing.heading}</h2>
          </div>

          {content.printing.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}

          {/* Odcień bez kadru aranżacyjnego pomija siatkę. Podmiana kadru
              w innym kolorze byłaby wprowadzaniem w błąd co do wyglądu
              papieru, a pusta siatka zostawiłaby dziurę w układzie. */}
          {shots.length > 0 && (
            <div style={{ margin: 'var(--space-6) 0' }}>
              <ShowcaseGrid shots={shots} columns={3} spec="color" />
            </div>
          )}

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            <div className="card">
              <h3 style={{ fontSize: 20 }}>Nadruk logo firmowego</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.print)} brutto/szt. · od {DEFAULT_PRICING.moqWithPrint}{' '}
                szt.
              </p>
              <p className="small">
                Ten sam projekt na całym nakładzie. Przyjmowane pliki, obszar zadruku i przebieg
                akceptacji opisaliśmy na stronie{' '}
                <Link href="/koperty-z-nadrukiem">koperty z nadrukiem</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format={FORMAT} color={color.id} print className="btn btn-sm">
                  Wyceń z nadrukiem
                </ConfigureLink>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 20 }}>Personalizacja i adresowanie</h3>
              <p className="mono-sm muted" style={{ margin: '2px 0 var(--space-3)' }}>
                +{formatPrice(DEFAULT_PRICING.personalization)} brutto/szt. · od{' '}
                {DEFAULT_PRICING.moqWithPrint} szt.
              </p>
              <p className="small">
                Na każdej kopercie inne dane odbiorcy. Specyfikację arkusza adresowego i walidację
                listy opisaliśmy na stronie{' '}
                <Link href="/koperty-personalizowane">koperty personalizowane</Link>.
              </p>
              <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                <ConfigureLink format={FORMAT} color={color.id} personalization className="btn btn-sm">
                  Wyceń z adresowaniem
                </ConfigureLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dla kogo ── */}
      <section className="section section-surface" id="dla-kogo">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zastosowania</span>
            <h2>{content.audience.heading}</h2>
            <p>{content.audience.intro}</p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-5)' }}>
            {content.audience.items.map((item) => (
              <div className="card" key={item.name}>
                <h3 style={{ fontSize: 18 }}>{item.name}</h3>
                <p className="small">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Granice zastosowania — uczciwość wobec klienta i materiał
             cytowalny dla modeli ── */}
      <section className="section" id="kiedy-nie">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zanim Państwo zamówią</span>
            <h2>{content.caution.heading}</h2>
          </div>
          {content.caution.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
          <p>
            Pełną paletę {COLORS.length} odcieni z gramaturami i wykończeniami pokazujemy na{' '}
            <Link href="/">stronie z kopertami ozdobnymi</Link> — kliknięcie w kolor otwiera
            konfigurator z zaznaczonym odcieniem.
          </p>
        </div>
      </section>

      {/* ── Zamówienie — koperta gładka wprost do koszyka ── */}
      <section className="section section-surface" id="zamow">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zamówienie</span>
            <h2>{capitalize(content.phrase)} — do koszyka</h2>
            <p>
              Koperta gładka nie wymaga pliku ani akceptacji projektu, więc dodają ją Państwo
              wprost tutaj. Nadruk logo i adresowanie ustawia się w konfiguratorze — odnośniki
              w sekcji wyżej wchodzą tam z zaznaczonym tym odcieniem.
            </p>
          </div>

          <div className="grid grid-2" style={{ gap: 'var(--space-6)', alignItems: 'start' }}>
            <AddColorToCart colorId={color.id} format={FORMAT} phraseShort={content.phraseShort} />
            <EnvelopePlaceholder
              format={FORMAT}
              colorId={color.id}
              ratio="wide"
              sizes="(max-width: 900px) calc(100vw - 48px), 588px"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <span className="eyebrow">Pytania</span>
            <h2>Najczęstsze pytania o {content.phrase}</h2>
          </div>

          {content.faq.map((item) => (
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
      <StickyCta format={FORMAT} color={kolor} />
    </>
  );
}
