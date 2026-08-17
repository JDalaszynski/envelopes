import { COLOR_MAP, type EnvelopeColor } from './catalog';

/**
 * Treść stron kolorów `/koperty/[kolor]` (content-plan.md, Faza 3).
 *
 * **Ten plik jest listą opublikowanych stron.** Klucze mapy zasilają
 * `generateStaticParams`, sitemapę, linkowanie z palety na `/` oraz — docelowo —
 * warianty w feedzie produktowym. Nie ma osobnego rejestru „które kolory mają
 * stronę": kolor ma stronę wtedy i tylko wtedy, gdy ma tu wpis z treścią.
 * Dzięki temu nie da się opublikować adresu bez tekstu ani zgłosić do
 * wyszukiwarek strony, której nie ma.
 *
 * **Dlaczego treść nie jest generowana z szablonu.** Dziewiętnaście stron
 * zbudowanych z jednego zdania z podmienioną nazwą koloru to dziewiętnaście
 * stron cienkich — Google traktuje je jako powielenie tej samej treści, a model
 * językowy nie ma z nich czego zacytować. Każdy kolor dostaje więc własny opis
 * charakteru, własną sekcję o nadruku i własne FAQ. Parametry (wymiary,
 * gramatura, cena, terminy) są **czytane z katalogu i cennika** — tu wchodzi
 * wyłącznie to, co dla danego odcienia jest naprawdę inne.
 */

export interface ColorPageFaqItem {
  question: string;
  answer: string;
}

export interface ColorPageSection {
  heading: string;
  paragraphs: string[];
}

export interface ColorPageContent {
  /** `title` bez marki — szablon z `layout.tsx` dokleja „| Envelopes". Do 60 znaków łącznie. */
  title: string;
  /** 140–155 znaków. Bez kwot — decyzja właściciela z 17 sierpnia 2026. */
  description: string;
  /**
   * Odmieniona nazwa produktu — „czarne koperty DL" i „czarne koperty".
   *
   * Nazwa katalogowa jest przymiotnikiem w mianowniku liczby pojedynczej
   * („Czarny", „Szara", „Ecru") i **nie da się jej wstawić do zdania**:
   * „koperty czarny" jest błędem, a rodzaj gramatyczny bywa różny w obrębie
   * palety. Formy podajemy więc wprost, raz na kolor, i szablon używa ich
   * w nagłówkach, w przycisku koszyka, w okruszkach i w anchorach linków
   * przychodzących. Obie w mianowniku — dla liczby mnogiej niemęskoosobowej
   * jest identyczny z biernikiem („zamów czarne koperty DL").
   */
  phrase: string;
  phraseShort: string;
  eyebrow: string;
  h1: string;
  /** Blok odpowiedzi GEO — pierwszy akapit pod H1, cytowalny bez kontekstu. */
  lead: string;
  /** Kadry aranżacyjne z `showcase.ts` pokazujące ten odcień (nazwy plików). */
  shotFiles: string[];
  character: ColorPageSection;
  printing: ColorPageSection;
  audience: { heading: string; intro: string; items: { name: string; text: string }[] };
  caution: ColorPageSection;
  faq: ColorPageFaqItem[];
  /** Obraz wyróżniający z `public/images/og/`. */
  ogImageSlug: string;
  ogImageAlt: string;
}

export const COLOR_PAGES: Record<string, ColorPageContent> = {
  czarny: {
    title: 'Czarne koperty DL z nadrukiem logo',
    description:
      'Czarne koperty ozdobne DL 110 × 220 mm, papier barwiony w masie — czarny także na zgięciu i krawędzi. Nadruk logo jasnym kolorem, wysyłka kurierem.',
    phrase: 'czarne koperty DL',
    phraseShort: 'czarne koperty',
    eyebrow: 'Kolor · Czarny',
    h1: 'Czarne koperty DL 110 × 220 mm',
    lead: 'Czarna koperta DL jest zrobiona z papieru barwionego w masie — czarnego na wylot, także na zgięciu i na krawędzi po rozcięciu. Kosztuje tyle samo co każdy inny odcień w katalogu. Logo drukujemy na niej jasnym kolorem, a dane odbiorcy tym samym drukiem, bo długopis nie zostawia na czarnym papierze czytelnego śladu.',
    shotFiles: ['czarna-koperta-dl-nadruk-zaproszenie', 'czarna-koperta-dl-personalizacja-imienna'],
    character: {
      heading: 'Czym czarny papier barwiony w masie różni się od zadrukowanego na czarno',
      paragraphs: [
        'Różnicę widać dopiero w dłoni, i to na krawędzi. Arkusz barwiony powierzchniowo ma pod warstwą farby jasny rdzeń, więc każde zagięcie i każde cięcie odsłania biały prążek. Nasz papier jest barwiony w masie: pigment idzie przez całą grubość arkusza, więc zagięta klapka i rozcięty bok zostają czarne.',
        'To jest cała przewaga tego odcienia i jednocześnie powód, dla którego czerń najbardziej różnicuje dostawców. Koperta, która po otwarciu pokazuje jasny środek, wygląda na przefarbowaną — przy zaproszeniu na galę albo przy piśmie z kancelarii to widać od razu.',
        'W rozmowie ten kolor bywa nazywany grafitowym. W katalogu, w konfiguratorze i na fakturze występuje jako Czarny — to ten sam odcień, nie dwa różne produkty.',
      ],
    },
    printing: {
      heading: 'Nadruk logo i adresowanie na czarnej kopercie',
      paragraphs: [
        'Na ciemnych kopertach drukujemy jasnym kolorem — o czytelności logo decyduje kontrast, nie sam odcień papieru. Nadruk kosztuje tyle samo na czerni co na bieli, bo cena zależy wyłącznie od formatu.',
        'Przed drukiem przygotowujemy wizualizację i pokazujemy ją na tym konkretnym odcieniu. Do produkcji trafia wyłącznie wersja zaakceptowana, więc nie trzeba zgadywać, jak jasny element zachowa się na czarnym tle.',
        'Logo o bardzo drobnych detalach w ciemnych barwach na czerni zniknie — w takim wypadku podpowiadamy jaśniejszy odcień z palety albo uproszczenie znaku do jednej barwy. To rozmowa na etapie wizualizacji, nie po druku.',
      ],
    },
    audience: {
      heading: 'Kto zamawia czarne koperty',
      intro:
        'Czerń wybierają branże, w których koperta ma sygnalizować powagę albo wysoką półkę — zanim jeszcze zostanie otwarta.',
      items: [
        {
          name: 'Kancelarie prawne i notarialne',
          text: 'Pisma procesowe, akty i umowy. Czarna koperta z jasnym nadrukiem nazwy kancelarii wyróżnia korespondencję w stosie kopert białych, a barwiona krawędź trzyma poziom przy dokumentach, które klient przechowuje latami.',
        },
        {
          name: 'Studia tatuażu i barbershopy',
          text: 'Vouchery na sesję i karty podarunkowe. To branża, w której czerń jest kolorem podstawowym identyfikacji, a bon w białej kopercie wygląda jak rachunek.',
        },
        {
          name: 'Marki modowe i sklepy premium',
          text: 'Bilecik do zamówienia, kod rabatowy, podziękowanie w paczce. Czarna koperta DL mieści kartę o wymiarach jednej trzeciej A4 i wchodzi płasko na wierzch zamówienia.',
        },
        {
          name: 'Agencje kreatywne i eventowe',
          text: 'Zaproszenia na premiery, gale i pokazy. Jedno jasne słowo na czerni działa tu tak samo jak pełne logo — kadr z takim nadrukiem pokazujemy niżej.',
        },
        {
          name: 'Gabinety i kliniki z ofertą premium',
          text: 'Vouchery na zabiegi i korespondencja do stałych pacjentów. Czerń trzyma dystans, którego jasne odcienie w tej roli nie dają.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy czarna koperta nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy adres ma być wypisany ręcznie. Długopis i cienkopis nie zostawiają na czarnym papierze czytelnego śladu, a jasny marker rozlewa się na powierzchni barwionej w masie. Przy wysyłce imiennej rozwiązaniem jest personalizacja, czyli nadruk danych odbiorcy razem z resztą zamówienia.',
        'Gdy przesyłka jedzie luzem w większej partii. Ślady palców i otarcia widać na czerni wyraźniej niż na papierze jasnym — przy transporcie zbiorczym warto przełożyć koperty kartonem, tak jak wysyłamy je z magazynu.',
      ],
    },
    faq: [
      {
        question: 'Czy czarna koperta jest czarna także na zgięciu i na krawędzi?',
        answer:
          'Tak. Papier jest barwiony w masie, więc pigment sięga przez całą grubość arkusza — zagięta klapka i rozcięty bok zostają czarne, bez jasnego prążka pod spodem.',
      },
      {
        question: 'Jakim kolorem drukujecie logo na czarnej kopercie?',
        answer:
          'Jasnym — na ciemnym papierze o czytelności decyduje kontrast. Przed drukiem przygotowujemy wizualizację na tym odcieniu i do produkcji trafia wyłącznie wersja zaakceptowana przez Państwa.',
      },
      {
        question: 'Czy czarne koperty kosztują więcej niż białe?',
        answer:
          'Nie. Cena zależy wyłącznie od formatu — wszystkie odcienie w katalogu kosztują tyle samo, łącznie z wykończeniami perłowymi i metalicznymi. Dopłata za nadruk i za personalizację też jest niezależna od koloru.',
      },
      {
        question: 'Czy na czarnej kopercie da się napisać adres ręcznie?',
        answer:
          'Nie polecamy — długopis jest na czarnym papierze nieczytelny. Dane odbiorcy drukujemy w ramach personalizacji: każda koperta z serii dostaje inne imię, nazwisko albo pełny adres, bez dopłaty za zmienny druk.',
      },
    ],
    ogImageSlug: 'koperty-czarne',
    ogImageAlt:
      'Dwie czarne koperty ozdobne DL na ciemnym drewnie, na wierzchniej biały nadruk słowa „Zaproszenie"',
  },
};

/** Identyfikatory kolorów z opublikowaną stroną — kolejność jak w katalogu. */
export const COLOR_PAGE_IDS = Object.keys(COLOR_PAGES);

/** Pierwsza litera wielką — odmieniona fraza w nagłówku i w okruszkach. */
export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Ścieżka strony koloru. Jedno miejsce, z którego bierze ją link, sitemapa i feed. */
export function colorPagePath(colorId: string): string {
  return `/koperty/${colorId}`;
}

export function hasColorPage(colorId: string): boolean {
  return colorId in COLOR_PAGES;
}

/** Kolor z katalogu razem z treścią jego strony — pominięty, jeśli któregoś brakuje. */
export function colorPages(): { color: EnvelopeColor; content: ColorPageContent }[] {
  return COLOR_PAGE_IDS.flatMap((id) => {
    const color = COLOR_MAP[id];
    return color ? [{ color, content: COLOR_PAGES[id] }] : [];
  });
}
