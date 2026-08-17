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

/**
 * **Reguła adresowania: kolor ma adres, format jest wariantem na stronie.**
 *
 * `/koperty/czarny` opisuje dziś kopertę DL, bo tylko ten format da się kupić,
 * ale w adresie formatu nie ma — i to jest decyzja, nie przeoczenie. Gdy ruszą
 * C6 i K4, ta sama strona pokaże trzy warianty zamiast rozmnażać się na
 * `czarny-dl`, `czarny-c6` i `czarny-k4`.
 *
 * Powód jest wyszukiwarkowy: zapytania idą albo po kolorze („czarne koperty"),
 * albo po formacie („koperty c6 wymiary"), rzadko po obu naraz. Dziewiętnaście
 * kolorów razy trzy formaty to 57 stron różniących się jednym wierszem tabeli,
 * konkurujących ze sobą o tę samą frazę kolorystyczną — czyli treść cienka
 * i kanibalizacja z definicji. Format jest wariantem zakupowym, tak samo jak
 * w konfiguratorze; kolor jest tematem strony.
 *
 * **Co trzeba ruszyć w dniu uruchomienia C6 i K4:**
 * 1. `phrase` i `phraseShort` tracą „DL" (`czarne koperty DL` → `czarne koperty`),
 *    a `h1` i `title` zostają przy formacie wiodącym albo obejmują wszystkie —
 *    do rozstrzygnięcia treścią, nie kodem.
 * 2. Tabela specyfikacji dostaje wiersz na format: wymiary **i cenę**, bo ceny
 *    formatów się różnią (`DEFAULT_PRICING.base`).
 * 3. `AddColorToCart` dostaje wybór formatu przed ilością — przyjmuje go już
 *    parametrem, więc to zmiana w interfejsie, nie w logice.
 * 4. Dane strukturalne: dziś jeden `Offer`, wtedy `ProductGroup` z `hasVariant`
 *    albo trzy `Offer`. Symbole są gotowe — `colorSku()` niesie format,
 *    a `colorGroupId()` daje grupę wariantów per format.
 * 5. Feed produktowy: dochodzą `ENV-C6-<KOLOR>` i `ENV-K4-<KOLOR>` wskazujące
 *    **ten sam adres** — Merchant Center to dopuszcza, jeśli wariant da się na
 *    stronie wybrać, czyli po wykonaniu punktu 3.
 * 6. Zdjęcia: `EnvelopeColor.images` ma już miejsce na kadry per format
 *    (`Partial<Record<FormatId, string>>`), brakuje wyłącznie plików.
 *
 * Gdyby kiedyś Search Console pokazała realny wolumen na „kolor + format",
 * furtką jest podstrona `/koperty/czarny/c6`: strona koloru staje się hubem,
 * a istniejący adres zostaje nietknięty i **nie wymaga przekierowania**.
 */

/**
 * **Podział pytań FAQ między kolorami — reguła antykanibalizacyjna.**
 *
 * Pytanie „czy ten kolor kosztuje więcej" jest realne przy każdym odcieniu,
 * ale powtórzone na dziewiętnastu stronach daje dziewiętnaście prawie
 * identycznych bloków `FAQPage` — dokładnie ten rodzaj powielenia, którego
 * unikamy przez adres kolorowy zamiast kolorowo-formatowego. Pytanie cenowe
 * dostaje więc **jedną stronę-właściciela: `zloty`**, bo tam parytet ceny jest
 * tematem strony (wykończenie metaliczne bez dopłaty), a nie dopiskiem.
 * Pozostałe kolory pytają o to, co dla nich naprawdę różne: czytelność
 * nadruku, pisanie ręczne, most nazewniczy, porównanie z sąsiednim odcieniem.
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
  /**
   * Pierwsza pozycja paska faktów — cecha papieru, którą ta strona uznaje za
   * swój najmocniejszy argument. Domyślnie barwienie w masie, bo dla odcieni
   * matowych to właśnie ono różnicuje dostawców.
   *
   * Pole jest opcjonalne, bo pojawił się odcień, dla którego domyślna wartość
   * była myląca: **Złoty ma w katalogu `finish: 'metaliczne'`**, a pasek faktów
   * z hasłem „barwiony w masie" na pierwszym miejscu mówił o tym papierze
   * najmniej istotną rzecz i przykrywał to, co jest tam sednem oferty —
   * połysk metaliczny w cenie odcienia matowego.
   */
  paperUsp?: { title: string; note: string };
  /**
   * Kadry aranżacyjne z `showcase.ts` pokazujące ten odcień (nazwy plików).
   *
   * Pusta tablica jest dozwolona i oznacza dokładnie jedno: dla tego odcienia
   * nie ma jeszcze zdjęcia aranżacyjnego. Strona pomija wtedy siatkę kadrów
   * zamiast pokazywać kadr w innym kolorze — podmiana byłaby wprowadzaniem
   * w błąd co do wyglądu papieru, a pusta siatka błędem układu.
   */
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

  granatowy: {
    title: 'Granatowe koperty DL z nadrukiem logo',
    description:
      'Granatowe koperty ozdobne DL 110 × 220 mm, papier barwiony w masie. Jasny nadruk logo trzyma na nich pełny kontrast. Wysyłka kurierem w całej Polsce.',
    phrase: 'granatowe koperty DL',
    phraseShort: 'granatowe koperty',
    eyebrow: 'Kolor · Granatowy',
    h1: 'Granatowe koperty DL 110 × 220 mm',
    lead: 'Granatowa koperta DL jest zrobiona z papieru barwionego w masie — granatowego na wylot, także na zgięciu klapki i na krawędzi po rozcięciu. Logo drukujemy na niej jasnym kolorem: bielą, kremem albo srebrem. Granat czyta się jako kolor instytucjonalny, dlatego zamawiają go kancelarie, uczelnie i instytucje kultury.',
    shotFiles: [
      'granatowa-koperta-dl-nadruk-logo-kancelarii',
      'granatowa-koperta-dl-nadruk-logo-orkiestry',
    ],
    character: {
      heading: 'Czym granat różni się od czerni i od jaśniejszych błękitów',
      paragraphs: [
        'Granat jest ciemny, ale nie neutralny. Ma w sobie błękit, który przy świetle dziennym widać na całej powierzchni koperty, a przy żarówce przygasa niemal do czerni. Czerń wygląda tak samo w każdym oświetleniu — i to jest cała różnica w odbiorze: granat czyta się jako kolor, czerń jako jego brak.',
        'Od Niebieskiego i Błękitnej dzieli go kontrast. Na granacie jasny nadruk zachowuje pełną czytelność, a na średnim błękicie biel zaczyna się z papierem zlewać. Gdy logo ma zostać rozpoznane z odległości wyciągniętej ręki, to rozstrzyga wybór odcienia.',
        'Papier jest barwiony w masie, więc pigment sięga przez całą grubość arkusza. Zagięta klapka i rozcięty bok zostają granatowe, bez jasnego prążka, który na arkuszu barwionym powierzchniowo odsłania się przy każdym cięciu.',
        'W rozmowie ten odcień bywa nazywany navy, marynarskim albo ciemnoniebieskim. W katalogu, w konfiguratorze i na fakturze występuje jako Granatowy — to ten sam papier, nie trzy różne produkty.',
      ],
    },
    printing: {
      heading: 'Nadruk logo i adresowanie na granatowej kopercie',
      paragraphs: [
        'Na granacie pracują trzy kolory nadruku: biel, krem i srebro. Każdy z nich daje na tym papierze pełny kontrast, a wybór między nimi zmienia temperaturę całości — biel wygląda technicznie, krem cieplej, srebro najbardziej oficjalnie.',
        'Logo wielobarwne sprowadzamy przed drukiem do jednej barwy. Ciemne elementy znaku — grafit, brąz, butelkowa zieleń — na granacie przestają być widoczne, więc grafik pokazuje na wizualizacji, jak znak wygląda po przejściu na jeden jasny kolor.',
        'Wizualizację przygotowujemy na tym konkretnym odcieniu i czekamy na Państwa akceptację. Termin realizacji liczymy dopiero od niej, a kolejne wersje po Państwa uwagach są bez dopłaty.',
      ],
    },
    audience: {
      heading: 'Kto zamawia granatowe koperty',
      intro:
        'Granat jest kolorem instytucji. Wybierają go nadawcy, którzy chcą, żeby koperta wyglądała poważnie, ale nie żałobnie.',
      items: [
        {
          name: 'Kancelarie prawne i notarialne',
          text: 'Pisma procesowe, akty i umowy. Granat jest w tej branży kolorem konwencjonalnym, więc koperta nie zwraca na siebie uwagi kosztem treści — a nazwa kancelarii w bieli zostaje widoczna w stosie korespondencji.',
        },
        {
          name: 'Instytucje kultury i orkiestry',
          text: 'Zaproszenia na koncert, karnety abonamentowe i pisma do mecenasów. Kadr niżej pokazuje taki nadruk: jeden znak i nazwa zespołu, bez dodatków.',
        },
        {
          name: 'Uczelnie i szkoły wyższe',
          text: 'Listy gratulacyjne, korespondencja rektoratu i zaproszenia na inaugurację. Granat mieści się w większości identyfikacji akademickich, więc koperta nie kłóci się z papierem firmowym.',
        },
        {
          name: 'Korporacje i działy HR',
          text: 'Listy do kandydatów, umowy i pakiety powitalne dla nowych pracowników. Ten sam odcień działa w komunikacji wewnętrznej i zewnętrznej, więc jeden nakład obsługuje oba obiegi.',
        },
        {
          name: 'Biura nieruchomości i doradcy finansowi',
          text: 'Umowy, teczki ofertowe i korespondencja do klienta prywatnego. Granat jest w tych branżach kolorem oczekiwanym — koperta nie wnosi do rozmowy niczego, czego klient by się nie spodziewał.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy granatowa koperta nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy adres ma być wypisany ręcznie. Na granatowym papierze długopis jest nieczytelny, a cienkopis niewiele lepszy. Przy wysyłce imiennej rozwiązaniem jest personalizacja — dane odbiorcy drukujemy tym samym jasnym kolorem co logo, razem z resztą zamówienia.',
        'Gdy logo jest wielobarwne i nie ma wersji jednobarwnej. Sprowadzenie znaku do jednej jasnej barwy zmienia jego wygląd, a nie każda marka na to pozwala. W takim wypadku podpowiadamy odcień jasny, na którym logo drukuje się w oryginalnych kolorach.',
      ],
    },
    faq: [
      {
        question: 'Czy granatowa koperta jest granatowa także na zgięciu i na krawędzi?',
        answer:
          'Tak. Papier jest barwiony w masie, więc pigment sięga przez całą grubość arkusza — zagięta klapka i rozcięty bok zostają granatowe, bez jasnego prążka pod spodem.',
      },
      {
        question: 'Jakim kolorem drukujecie logo na granatowej kopercie?',
        answer:
          'Jasnym: bielą, kremem albo srebrem. Znak wielobarwny sprowadzamy przed drukiem do jednej barwy i pokazujemy efekt na wizualizacji, zanim zamówienie trafi do produkcji.',
      },
      {
        question: 'Czym granatowa koperta różni się od czarnej?',
        answer:
          'Odcieniem i odbiorem. Granat ma w sobie błękit, więc przy świetle dziennym czyta się jako kolor, a czerń jako jego brak. Kontrast dla jasnego nadruku obie dają porównywalny, a papier w obu wypadkach jest barwiony w masie.',
      },
      {
        question: 'Czy na granatowej kopercie da się wydrukować adres odbiorcy?',
        answer:
          'Tak, to usługa personalizacji: każda koperta z serii dostaje inne dane, wydrukowane tym samym jasnym kolorem co logo. Listę odbiorców przekazują Państwo w arkuszu, którego szablon i walidację opisaliśmy na stronie kopert personalizowanych.',
      },
    ],
    ogImageSlug: 'koperty-granatowe',
    ogImageAlt:
      'Granatowa koperta ozdobna DL z białym nadrukiem logo kancelarii prawnej, na ciemnym drewnianym blacie',
  },

  zloty: {
    title: 'Złote koperty DL z nadrukiem logo',
    description:
      'Złote koperty ozdobne DL 110 × 220 mm z metalicznym połyskiem, w cenie odcieni matowych. Nadruk logo ciemnym kolorem, wysyłka kurierem w całej Polsce.',
    phrase: 'złote koperty DL',
    phraseShort: 'złote koperty',
    eyebrow: 'Kolor · Złoty',
    h1: 'Złote koperty DL 110 × 220 mm',
    lead: 'Złota koperta DL jest zrobiona z papieru o metalicznym wykończeniu — powierzchnia odbija światło i zmienia jasność razem z kątem patrzenia. Logo drukujemy na niej kolorem ciemnym, najczęściej czernią, bo jasny znak na złocie przestaje być widoczny. Wykończenie metaliczne nie podnosi ceny: złota koperta kosztuje tyle samo co biała.',
    paperUsp: {
      title: 'Wykończenie metaliczne',
      note: 'Połysk na całej powierzchni arkusza, także na klapce — bez dopłaty',
    },
    shotFiles: ['zlota-koperta-dl-nadruk-logo-studia-tatuazu'],
    character: {
      heading: 'Czym złota koperta różni się od koperty ze złoceniem',
      paragraphs: [
        'Złocenie to osobna technika zdobienia: folię wgrzewa się w papier punktowo, w miejscu znaku. Nasza złota koperta to papier — metaliczne wykończenie obejmuje całą powierzchnię, a nie samo logo. Zapytanie „złote koperty" oznacza raz jedno, raz drugie, więc mówimy wprost, co Państwo dostają.',
        'Złocenia logo nie wykonujemy. Znak na złotej kopercie drukujemy, tak samo jak na każdym innym odcieniu z palety, i jest to jedyna technika, jaką na tym papierze stosujemy.',
        'Połysk zmienia się z kątem patrzenia. Ta sama koperta w świetle padającym z boku jest wyraźnie jaśniejsza niż położona płasko pod lampą — na zdjęciu widać to jako różnicę jasności między klapką a przednią ścianką, choć papier jest jeden.',
      ],
    },
    printing: {
      heading: 'Nadruk logo na złotej kopercie',
      paragraphs: [
        'Na złocie drukujemy kolorem ciemnym. Czerń daje pełny kontrast i tak wygląda kadr niżej: znak i nazwa w jednej barwie, bez cieniowania. Granat, brąz i butelkowa zieleń też się na tym papierze bronią.',
        'Nadruk jasny na złocie odpada. Biel traci kontrast przy pierwszym odbiciu światła, a złoto na złocie znika całkowicie — jeśli znak Państwa marki jest złoty, na wizualizacji pokażemy jego wersję ciemną i dopiero ona idzie do druku.',
        'Wizualizację przygotowuje grafik na tym odcieniu i przesyła ją do akceptacji. Zdjęcie nie odda połysku dokładnie, bo ten zależy od światła w pomieszczeniu — wizualizacja rozstrzyga układ i barwę nadruku, a nie stopień odblasku.',
      ],
    },
    audience: {
      heading: 'Kto zamawia złote koperty',
      intro:
        'Złoto zamawiają nadawcy, dla których koperta jest częścią prezentu, a nie opakowaniem korespondencji.',
      items: [
        {
          name: 'Organizatorzy gal i eventów',
          text: 'Zaproszenia na bal, galę i jubileusz firmy. Złota koperta ustawia rangę wydarzenia, zanim adresat wyjmie z niej kartę.',
        },
        {
          name: 'Studia tatuażu i barbershopy',
          text: 'Vouchery na sesję i karty podarunkowe. Czerń na złocie to zestawienie, które ta branża stosuje na co dzień — kadr niżej pokazuje taki bon.',
        },
        {
          name: 'Hotele i restauracje',
          text: 'Karty powitalne, bony na kolację i vouchery pobytowe. Koperta wręczana do ręki działa inaczej niż wysyłana pocztą: gość ogląda ją z bliska, w świetle sali.',
        },
        {
          name: 'Salony kosmetyczne i kliniki medycyny estetycznej',
          text: 'Bony na zabiegi, najczęściej przed świętami i Dniem Matki. Koperta jest tu opakowaniem prezentu i zastępuje pudełko.',
        },
        {
          name: 'Marki premium i sklepy jubilerskie',
          text: 'Bilecik do zamówienia, kod rabatowy, podziękowanie dołączone do paczki. Złoto trzyma poziom opakowania, w którym jedzie.',
        },
        {
          name: 'Wesela i przyjęcia rodzinne',
          text: 'Koperty na pieniądze i podziękowania dla gości. Format DL mieści banknot najwyższego nominału płasko, bez składania.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy złota koperta nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy koperta ma iść pocztą jako korespondencja firmowa. Złoto czyta się jako opakowanie prezentu, więc pismo urzędowe w takiej kopercie wygląda na materiał reklamowy i bywa odkładane bez otwierania.',
        'Gdy adres ma być wypisany ręcznie. Metaliczna powierzchnia nie przyjmuje tuszu równomiernie — długopis zostawia przerywany ślad, a pisak się rozlewa. Dane odbiorcy drukujemy wtedy w ramach personalizacji.',
        'Gdy logo jest złote albo bardzo jasne. Znak w kolorze zbliżonym do papieru znika, a przejście na czerń zmienia identyfikację marki — nie każda firma się na to zgadza.',
      ],
    },
    faq: [
      {
        question: 'Czy złota koperta ma metaliczny połysk na całej powierzchni?',
        answer:
          'Tak. Wykończenie obejmuje cały arkusz, więc połyskuje zarówno przednia ścianka, jak i klapka. Intensywność zależy od kąta, pod jakim pada światło.',
      },
      {
        question: 'Czy złote koperty kosztują więcej niż białe?',
        answer:
          'Nie. Cena zależy wyłącznie od formatu — wykończenia metaliczne i perłowe kosztują tyle samo co odcienie matowe. Dopłata za nadruk i za personalizację również nie zmienia się z kolorem papieru.',
      },
      {
        question: 'Czym złota koperta różni się od koperty ze złoceniem?',
        answer:
          'Złocenie to folia wgrzewana punktowo w miejscu znaku; złota koperta to papier o metalicznym wykończeniu na całej powierzchni. Złocenia nie wykonujemy — logo na złotej kopercie drukujemy.',
      },
      {
        question: 'Jakim kolorem drukować logo na złotej kopercie?',
        answer:
          'Ciemnym. Czerń daje pełny kontrast, dobrze wychodzą też granat, brąz i butelkowa zieleń. Nadruk jasny i nadruk złoty na tym papierze zanikają.',
      },
    ],
    ogImageSlug: 'koperty-zlote',
    ogImageAlt:
      'Złota koperta ozdobna DL z metalicznym połyskiem i czarnym nadrukiem logo studia tatuażu, na ciemnym blacie',
  },

  ecru: {
    title: 'Beżowe koperty ecru DL z nadrukiem logo',
    description:
      'Koperty ozdobne DL 110 × 220 mm w odcieniu ecru, czyli beżowym. Ciepła biel — czytelny na niej każdy kolor nadruku i pismo odręczne. Wysyłka kurierem.',
    phrase: 'koperty ecru DL',
    phraseShort: 'koperty ecru',
    eyebrow: 'Kolor · Ecru',
    h1: 'Beżowe koperty ecru DL 110 × 220 mm',
    lead: 'Ecru to w naszym katalogu odcień beżowy — ciepła, złamana biel bez żółtego przebarwienia. Na kopercie ecru czytelny jest nadruk w każdym kolorze, łącznie z logo wielobarwnym, a adres da się wypisać zwykłym długopisem. Papier jest barwiony w masie, więc zgięta klapka i rozcięta krawędź zostają w tym samym odcieniu.',
    shotFiles: [],
    character: {
      heading: 'Czym ecru różni się od bieli i od papieru perłowego',
      paragraphs: [
        'Ecru jest cieplejsze od bieli i spokojniejsze od kremu. Obok koperty białej różnicę widać od razu — biel wygląda przy nim technicznie, jak arkusz wyjęty z ryzy do drukarki. Samo ecru, bez punktu odniesienia, czyta się po prostu jako papier lepszego gatunku.',
        'Od Białej Perłowej dzieli je powierzchnia. Perła odbija światło i zmienia jasność z kątem patrzenia, ecru jest matowe i wygląda tak samo w każdym oświetleniu. Przy zdjęciach do sklepu i przy skanowaniu dokumentów to jest zaleta, a nie brak.',
        'Zapytania trafiają tu pod kilkoma nazwami: koperty beżowe, kremowe, w kolorze kości słoniowej. W katalogu, w konfiguratorze i na fakturze ten papier występuje jako Ecru — to jeden odcień, nie cztery różne produkty.',
      ],
    },
    printing: {
      heading: 'Nadruk logo i adresowanie na kopercie ecru',
      paragraphs: [
        'Na ecru drukujemy w dowolnym kolorze. Znak ciemny ma pełny kontrast, a logo wielobarwne nie wymaga sprowadzania do jednej barwy — to główna praktyczna różnica względem ciemnych odcieni z palety, na których każdy nadruk musi być jasny.',
        'Uwagi wymagają wyłącznie barwy bardzo jasne. Żółć, jasny beż i pastelowy róż zbliżają się na tym papierze do koloru tła i tracą czytelność; grafik pokazuje to na wizualizacji, zanim zamówienie trafi do druku.',
        'Adres na kopercie ecru można wypisać ręcznie. Papier jest matowy i nie odpycha tuszu, więc długopis i cienkopis zostawiają czysty ślad — przy krótkiej liście personalizacja nie jest konieczna, przy długiej jest po prostu szybsza.',
      ],
    },
    audience: {
      heading: 'Kto zamawia koperty ecru',
      intro:
        'Ecru wybierają nadawcy, dla których koperta ma być ciepła i neutralna jednocześnie — widoczna, ale bez deklaracji.',
      items: [
        {
          name: 'Pary młode i organizatorzy wesel',
          text: 'Podziękowania dla gości, koperty na pieniądze i karty do stołów. Format DL mieści banknot płasko, a kartę o wymiarze jednej trzeciej arkusza bez zaginania rogów.',
        },
        {
          name: 'Hotele, pensjonaty i domy gościnne',
          text: 'Karty powitalne zostawiane w pokoju, rachunki i vouchery pobytowe. Ecru pasuje do wnętrz z drewnem i lnem, w których ten segment się urządza.',
        },
        {
          name: 'Kliniki, gabinety i pracownie zdrowia',
          text: 'Bony na zabiegi i korespondencja do pacjentów. Ciepły odcień łagodzi kontekst medyczny, który biel raczej podkreśla.',
        },
        {
          name: 'Kwiaciarnie i pracownie rękodzieła',
          text: 'Bileciki do bukietów, podziękowania i karty podarunkowe. Na ecru pismo odręczne wygląda tak, jak ma wyglądać — jak odręczne, a nie jak niedodrukowane.',
        },
        {
          name: 'Biura, które nie chcą bieli',
          text: 'Pisma, umowy i oferty. Ten sam obieg dokumentów co na kopercie białej, tylko koperta nie wygląda na wyjętą z ryzy papieru do drukarki.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy koperta ecru nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy nadruk ma być jasny albo pastelowy. Barwy zbliżone do koloru papieru tracą na ecru kontrast — jeśli identyfikacja marki stoi na pastelach, lepiej sięgnąć po odcień ciemny i drukować w kontrze.',
        'Gdy koperta ma dopełniać materiały drukowane na papierze śnieżnobiałym. Ecru położone obok czystej bieli wygląda na przybrudzone, choć samo w sobie takie nie jest — złe wrażenie robi wtedy zestawienie, a nie odcień.',
      ],
    },
    faq: [
      {
        question: 'Czy ecru to to samo co beżowy?',
        answer:
          'Tak. Ecru jest naszą nazwą katalogową odcienia beżowego — ciepłej, złamanej bieli. Pod tym samym kolorem klienci szukają też kopert kremowych i w kolorze kości słoniowej.',
      },
      {
        question: 'Czy na kopercie ecru można wypisać adres ręcznie?',
        answer:
          'Tak. Papier jest matowy i przyjmuje długopis oraz cienkopis, więc przy krótkiej liście nie trzeba zamawiać personalizacji. Przy długiej nadruk danych odbiorcy jest po prostu szybszy i równiejszy.',
      },
      {
        question: 'Czym koperta ecru różni się od białej?',
        answer:
          'Temperaturą odcienia. Ecru jest ciepłą, złamaną bielą, więc obok papieru śnieżnobiałego wygląda wyraźnie cieplej. Gramatura, dostępny nadruk i cena są w obu wypadkach takie same.',
      },
      {
        question: 'Jakim kolorem drukujecie logo na kopercie ecru?',
        answer:
          'Dowolnym, łącznie z logo wielobarwnym — ecru nie wymusza sprowadzania znaku do jednej barwy. Ostrożności wymagają wyłącznie barwy bardzo jasne, które zbliżają się do koloru papieru.',
      },
    ],
    ogImageSlug: 'koperty-ecru',
    ogImageAlt:
      'Zbliżenie na kopertę ozdobną DL w odcieniu ecru — przednia ścianka z klapką, na jasnym tle',
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
