import { COLORS, COLOR_MAP, type EnvelopeColor } from './catalog';

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
          text: 'Zaproszenia na premiery, gale i pokazy. Jedno jasne słowo na czerni działa tu tak samo jak pełne logo — kadr z takim nadrukiem pokazujemy wyżej.',
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
        question: 'Czy koperta grafitowa to ten sam produkt co czarna?',
        answer:
          'Tak. W rozmowie ten odcień bywa nazywany grafitowym, ale w katalogu, w konfiguratorze i na fakturze występuje jako Czarny. To jeden papier i jedna karta produktu, nie dwa warianty do wyboru.',
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
          text: 'Zaproszenia na koncert, karnety abonamentowe i pisma do mecenasów. Kadr wyżej pokazuje taki nadruk: jeden znak i nazwa zespołu, bez dodatków.',
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
          text: 'Vouchery na sesję i karty podarunkowe. Czerń na złocie to zestawienie, które ta branża stosuje na co dzień — kadr wyżej pokazuje taki bon.',
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
        answer: `Nie. Cena zależy wyłącznie od formatu — wszystkie ${COLORS.length} odcieni kosztuje tyle samo, łącznie z wykończeniami metalicznymi i perłowymi. Dopłata za nadruk i za personalizację również nie zmienia się z kolorem papieru.`,
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
          'Temperaturą odcienia. Ecru jest ciepłą, złamaną bielą, więc obok papieru śnieżnobiałego wygląda wyraźnie cieplej. Format, gramatura i dostępny nadruk są w obu wypadkach takie same.',
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

  bialy: {
    title: 'Białe koperty DL z nadrukiem logo',
    description:
      'Białe koperty ozdobne DL 110 × 220 mm bez okienka adresowego. Czyste tło pod nadruk w pełnym kolorze i pod pismo odręczne. Wysyłka kurierem w Polsce.',
    phrase: 'białe koperty DL',
    phraseShort: 'białe koperty',
    eyebrow: 'Kolor · Biały',
    h1: 'Białe koperty DL 110 × 220 mm',
    lead: 'Biała koperta DL w wersji ozdobnej jest zrobiona z gładkiego, jednolitego papieru bez okienka adresowego — przednia ścianka zostaje pełną płaszczyzną. Daje maksymalny kontrast dla każdego koloru nadruku, od czerni po pastele, łącznie z logo wielobarwnym. Adres można na niej wypisać zwykłym długopisem albo piórem.',
    paperUsp: {
      title: 'Bez okienka adresowego',
      note: 'Przednia ścianka jest pełną płaszczyzną papieru, a nie ramką wokół folii',
    },
    shotFiles: [],
    character: {
      heading: 'Czym biała koperta ozdobna różni się od standardowej koperty biurowej',
      paragraphs: [
        'Standardowa koperta pocztowa jest cieńsza, ma okienko foliowe i wzór maskujący nadrukowany w środku. Biała koperta ozdobna DL to papier grubszy i jednolity: przednia ścianka nie ma okienka, a klapka biegnie wzdłuż dłuższego boku.',
        'Od Białej Perłowej odróżnia ją całkowicie matowa powierzchnia. Nie odbija światła i nie zmienia odcienia pod kątem, dzięki czemu dokumenty czyta się bez odblasków, a skanowanie i fotografowanie przesyłki nie tworzy jasnych plam.',
        'Czysta biel stanowi najbardziej neutralne tło w poligrafii. W zestawieniu z kolorowym papierem firmowym lub kartą okolicznościową nie narzuca własnej tonacji i pozwala wybrzmieć zawartości.',
      ],
    },
    printing: {
      heading: 'Nadruk logo firmowego i adresowanie na białej kopercie',
      paragraphs: [
        'Biały papier przyjmuje każdy kolor nadruku bez zniekształceń barwnych. Kolorowe logotypy, drobne detale graficzne oraz wielobarwne herby drukujemy bezpośrednio w oryginalnych barwach marki, bez konieczności upraszczania znaku do jednej barwy.',
        'Na białej kopercie można bez przeszkód pisać odręcznie. Papier nie ma powłoki śliskiej, więc tusz z długopisu, pióra czy cienkopisu schnie natychmiast i nie rozmazuje się przy dotknięciu.',
        'Przed uruchomieniem druku przesyłamy cyfrową wizualizację z naniesionym projektem. Produkcja rusza dopiero po Państwa jednoznacznej akceptacji pliku.',
      ],
    },
    audience: {
      heading: 'Kto zamawia białe koperty ozdobne',
      intro:
        'Biel wybierają instytucje i firmy stawiające na klasyczną estetykę, oficjalny obieg dokumentów lub pełne odwzorowanie kolorystyki własnego znaku.',
      items: [
        {
          name: 'Kancelarie prawne i notariusze',
          text: 'Korespondencja urzędowa, odpisy aktów i pisma przewodnie. Czysta biel o podwyższonej gramaturze podkreśla formalny charakter dokumentu bez odwracania uwagi od treści.',
        },
        {
          name: 'Biura rachunkowe i audytorskie',
          text: 'Sprawozdania finansowe, deklaracje i raporty roczne dla zarządów. Format DL mieści arkusz A4 złożony na trzy, a brak okienka zapewnia pełną dyskrecję korespondencji.',
        },
        {
          name: 'Firmy szkoleniowe i uczelnie',
          text: 'Certyfikaty ukończenia kursów, zaświadczenia i listy gratulacyjne. Na białym tle wielobarwne herby i logotypy patronów zachowują stuprocentową zgodność z księgą znaku.',
        },
        {
          name: 'Agencje marketingowe i PR',
          text: 'Wysyłki prasowe, zaproszenia z wielokolorowym brandingiem i karty powitalne. Biel pozwala na precyzyjne odwzorowanie kolorów Pantone i pełnej palety CMYK.',
        },
        {
          name: 'Gabinety lekarskie i kliniki',
          text: 'Wyniki badań, zalecenia lekarskie i oficjalne zaświadczenia. Odcień budzi naturalne skojarzenie z czystością, sterylnością i profesjonalizmem placówki.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy biała koperta nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy przesyłka ma wyraźnie wyróżnić się w stosie poczty przychodzącej na biurko odbiorcy. Standardowa biel może zlać się ze zwykłą korespondencją pocztową — wtedy lepszy efekt daje odcień kontrastowy, jak Granatowy, Matcha czy Złoty.',
        'Gdy identyfikacja wizualna marki opiera się na ciepłych, naturalnych odcieniach ziemi i drewna. W takim zestawieniu chłodna biel bywa zbyt surowa i warto rozważyć ciepły odcień Ecru lub papier Eko.',
      ],
    },
    faq: [
      {
        question: 'Czy biała koperta DL ma okienko adresowe?',
        answer:
          'Nie. Przednia ścianka jest pełną płaszczyzną papieru, więc nadruk i dane odbiorcy rozkładamy na całej jej powierzchni. Koperta pocztowa oddaje część tego pola na foliowe okno i na ramkę wokół niego.',
      },
      {
        question: 'Czym biała koperta ozdobna różni się od Białej Perłowej?',
        answer:
          'Powierzchnią. Biała koperta jest matowa i wygląda tak samo w każdym oświetleniu, a Biała Perłowa ma poświatę, która zmienia jasność razem z kątem padania światła.',
      },
      {
        question: 'Czy na białej kopercie można wydrukować wielokolorowe logo?',
        answer:
          'Tak. Białe podłoże pozwala na druk w pełnym kolorze bez przekłamywania odcieni znaku. Na ciemnych papierach zalecamy nadruk jednobarwny, natomiast na bieli drukujemy pełną paletę barw.',
      },
      {
        question: 'Czy na białej kopercie można wypisać adres ręcznie?',
        answer:
          'Tak. Matowy papier doskonale chłonie tusz długopisu, pióra wiecznego oraz pisaka, nie powodując rozmazywania ani przebijania na drugą stronę.',
      },
    ],
    ogImageSlug: 'koperty-biale',
    ogImageAlt:
      'Dwie białe koperty ozdobne DL bez nadruku — przednia od strony klapki, druga ustawiona płasko za nią',
  },

  matcha: {
    title: 'Koperty matcha DL z nadrukiem logo',
    description:
      'Koperty ozdobne DL 110 × 220 mm w odcieniu Matcha — pastelowa, szałwiowa zieleń barwiona w masie. Ciemny i jasny nadruk logo, wysyłka kurierem.',
    phrase: 'koperty matcha DL',
    phraseShort: 'koperty matcha',
    eyebrow: 'Kolor · Matcha',
    h1: 'Koperty matcha DL 110 × 220 mm',
    lead: 'Koperta DL w kolorze Matcha to pastelowa, szałwiowa zieleń wykonana z papieru barwionego w masie. Kolor jest jednolity w całym przekroju arkusza, także na zagięciach klapki i na rozciętych krawędziach. Na tym tle czytają się zarówno nadruki ciemne — butelkowa zieleń, grafit i czerń — jak i biel przy napisach okolicznościowych.',
    paperUsp: {
      title: 'Gramatura 120 g/m²',
      note: 'Grubszy papier barwiony w masie — szałwiowy odcień na całej grubości arkusza',
    },
    shotFiles: [
      'matcha-koperta-dl-nadruk-podziekowania',
      'matcha-koperta-dl-nadruk-wyrazy-uznania',
    ],
    character: {
      heading: 'Charakter odcienia Matcha — pastelowa zieleń szałwiowa',
      paragraphs: [
        'Matcha to zgaszona, naturalna zieleń o pastelowym, szałwiowym tonie. W odróżnieniu od jaskrawych zieleni biurowych prezentuje się spokojnie i nowocześnie, budząc bezpośrednie skojarzenia z naturą, roślinnością i estetyką organiczną.',
        'Arkusz jest wyraźnie sztywniejszy od podstawowej palety, więc koperta trzyma kształt w przesyłce zbiorczej i nie faluje w dłoni. Papier jest barwiony w masie, więc po złożeniu klapki oraz na rozciętych krawędziach nie pojawiają się białe przebarwienia.',
        'W zapytaniach klientów ten kolor bywa określany jako szałwiowy, pistacjowy, oliwkowy lub jasnozielony zgaszony. W naszym katalogu i konfiguratorze figuruje pod nazwą Matcha — to jeden, unikalny odcień papieru.',
      ],
    },
    printing: {
      heading: 'Nadruk logo i personalizacja na kopercie matcha',
      paragraphs: [
        'Na odcieniu Matcha doskonale prezentują się ciemne nadruki: głęboka butelkowa zieleń, czerń, ciemny grafit oraz czekoladowy brąz. Taki zestaw tworzy subtelny, organiczny kontrast czytelny z dużej odległości.',
        'Równie efektownie wygląda nadruk biały lub kremowy, zwłaszcza przy krojach odręcznych i dedykacjach okolicznościowych — kadr z białym nadrukiem prezentujemy w galerii poniżej.',
        'Wizualizację przygotowujemy bezpłatnie na dokładnym tle koloru Matcha, dzięki czemu przed rozpoczęciem druku widzą Państwo rzeczywisty kontrast i układ elementów na kopercie.',
      ],
    },
    audience: {
      heading: 'Kto zamawia koperty w odcieniu Matcha',
      intro:
        'Kolor Matcha jest chętnie wybierany przez marki promujące zrównoważony rozwój, branżę beauty oraz organizatorów uroczystości w stylu botanicznym.',
      items: [
        {
          name: 'Marki ekologiczne i kosmetyki naturalne',
          text: 'Podziękowania za zakupy, karty ze składem produktów i certyfikaty autentyczności. Szałwiowa zieleń naturalnie współgra z filozofią eko i minimalistycznym brandingiem.',
        },
        {
          name: 'Salony wellness, SPA i gabinety masażu',
          text: 'Bony podarunkowe i zaproszenia na zabiegi relaksacyjne. Spokojny, pastelowy odcień wprowadza klienta w atmosferę wyciszenia i pielęgnacji.',
        },
        {
          name: 'Kawiarnie, cukiernie i pracownie rzemieślnicze',
          text: 'Karty podarunkowe, vouchery na warsztaty kulinarne i bileciki degustacyjne. Format DL idealnie mieści bon podłużny lub zaproszenie na event.',
        },
        {
          name: 'Pracownie florystyczne i dekoratorzy',
          text: 'Bileciki do bukietów, podziękowania dla klientów oraz zaproszenia na warsztaty florystyczne. Odcień Matcha harmonizuje z zielenią roślin i naturalnym papierem.',
        },
        {
          name: 'Przyjęcia i śluby w stylu boho lub greenery',
          text: 'Koperty na podziękowania dla gości, karty menu i wkładki informacyjne. Zgaszona zieleń stanowi wiodący motyw przyjęć ogrodowych i rustykalnych.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy odcień Matcha nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy logo firmy zawiera bardzo jasne, pastelowe żółcie lub jasne szarości. Elementy o niskim kontraście mogą zlewać się z zielonym tłem — w takiej sytuacji rekomendujemy zastosowanie ciemniejszej wersji znaku.',
        'Gdy identyfikacja marki wymaga ściśle zdefiniowanego, chłodnego błękitu korporacyjnego. Zieleń Matcha ma ciepły, organiczny charakter, który może gryźć się z rygorystycznym błękitnym manualem identyfikacji.',
      ],
    },
    faq: [
      {
        question: 'Czy kolor Matcha to to samo co zieleń szałwiowa lub pistacjowa?',
        answer:
          'Tak. Matcha to nasza katalogowa nazwa dla pastelowej, zgaszonej zieleni szałwiowej. Klienci poszukujący kopert pistacjowych lub oliwkowych wybierają właśnie ten odcień.',
      },
      {
        question: 'Czy papier w kolorze Matcha jest barwiony w masie?',
        answer:
          'Tak. Pigment znajduje się w całej strukturze arkusza, dzięki czemu zgięcia klapki i krawędzie boczne zachowują jednolity, zielony kolor.',
      },
      {
        question: 'Jaki kolor nadruku najlepiej wygląda na kopertach Matcha?',
        answer:
          'Najlepszy kontrast daje nadruk w kolorze butelkowej zieleni, grafitowym lub czarnym. Bardzo elegancko prezentuje się także nadruk biały, szczególnie przy napisach okolicznościowych.',
      },
      {
        question: 'Czym Matcha różni się od Zielonego i Butelkowej Zieleni?',
        answer:
          'Nasyceniem, a w praktyce doborem nadruku. Matcha jest pastelowa i zgaszona, Zielony wyraźnie jaśniejszy, a Butelkowa Zieleń na tyle ciemna, że przyjmuje wyłącznie nadruk jasny. Na Matchy pracuje i ciemny, i jasny.',
      },
    ],
    ogImageSlug: 'koperty-matcha',
    ogImageAlt:
      'Dwie koperty DL w kolorze Matcha z ciemnozielonym nadrukiem słowa „Dziękujemy” na drewnianym blacie',
  },

  'blekit-lupkowy': {
    title: 'Koperty błękit łupkowy DL z nadrukiem logo',
    description:
      'Koperty ozdobne DL 110 × 220 mm w kolorze błękitu łupkowego — zgaszony stalowy odcień, papier barwiony w masie. Nadruk logo i adresowanie imienne.',
    phrase: 'koperty DL w kolorze błękitu łupkowego',
    phraseShort: 'koperty w kolorze błękitu łupkowego',
    eyebrow: 'Kolor · Błękit Łupkowy',
    h1: 'Koperty błękit łupkowy DL 110 × 220 mm',
    lead: 'Koperta DL w kolorze błękitu łupkowego to zgaszony, stalowy błękit z papieru barwionego w masie. W katalogu, w konfiguratorze i na fakturze ten odcień występuje pod nazwą Jeansowy. Jest wyraźnie jaśniejszy od granatu i spokojniejszy od pastelowego błękitu, a jako podłoże przyjmuje zarówno nadruk biały i srebrny, jak i grafitowy oraz czarny.',
    paperUsp: {
      title: 'Gramatura 120 g/m²',
      note: 'Sztywny papier barwiony w masie — stalowy błękit na całej grubości arkusza',
    },
    shotFiles: ['blekit-lupkowy-koperta-dl-nadruk-na-chrzest'],
    character: {
      heading: 'Czym błękit łupkowy różni się od granatu i jasnego błękitu',
      paragraphs: [
        'Błękit łupkowy, nazwany w naszym katalogu Jeansowym, to odcień pośredni o stalowo-szarym zabarwieniu. Jest znacznie jaśniejszy od ciemnego granatu, ale bardziej stonowany i dostojny niż klasyczna, pastelowa błękitna koperta.',
        'Papier jest barwiony w masie, a arkusz wyraźnie grubszy od podstawowej palety. Sztywność czuć w dłoni przy wyjmowaniu koperty z paczki, a pigment sięgający przez cały przekrój sprawia, że krawędzie po rozcięciu i zagięcia klapki zachowują jednolity, szaroniebieski ton.',
        'W zapytaniach użytkowników odcień ten występuje jako błękit łupkowy, stalowy błękit, jeansowy, gołębi błękit lub slate blue. W konfiguratorze i na fakturze oznaczony jest jako Jeansowy — to dokładnie ten sam papier.',
      ],
    },
    printing: {
      heading: 'Nadruk logo firmowego i personalizacja na błękicie łupkowym',
      paragraphs: [
        'Na stalowoniebieskim tle świetnie pracują dwa kierunki kolorystyczne: kontrastowy nadruk biały (oraz srebrny) lub klasyczny nadruk czarny i grafitowy. Oba warianty zapewniają nienaganną czytelność tekstu i znaków graficznych.',
        'Biały nadruk nadaje przesyłce lekkości i świeżości — doskonale sprawdza się przy zaproszeniach okolicznościowych i voucherach, co prezentuje kadr w galerii poniżej.',
        'Ciemny nadruk podkreśla formalny, techniczny profil korespondencji, chętnie wybierany przez biura inżynieryjne, pracownie architektoniczne i firmy konsultingowe.',
      ],
    },
    audience: {
      heading: 'Kto zamawia koperty w kolorze błękitu łupkowego',
      intro:
        'Zgaszony błękit łupkowy wybierają nadawcy szukający koloru eleganckiego, nowoczesnego i neutralnego biznesowo.',
      items: [
        {
          name: 'Biura architektoniczne i projektowe',
          text: 'Oferty koncepcyjne, umowy projektowe i dokumentacja dla inwestorów. Stalowy odcień nawiązuje do rysunku technicznego i nowoczesnych materiałów konstrukcyjnych.',
        },
        {
          name: 'Hotele, resorty i apartamenty nadmorskie',
          text: 'Vouchery pobytowe, karty powitalne i materiały informacyjne dla gości. Kolor harmonizuje z motywami marynistycznymi bez popadania w dosłowność.',
        },
        {
          name: 'Agencje doradcze i firmy technologiczne',
          text: 'Korespondencja z kluczowymi klientami, raporty analityczne i zaproszenia na konferencje branżowe. Stonowany błękit buduje zaufanie i poczucie stabilności.',
        },
        {
          name: 'Uroczystości rodzinne i jubileusze',
          text: 'Zaproszenia na chrzest, komunię czy rocznice. Kadr wyżej pokazuje realizację z białym nadrukiem okolicznościowym na jasnych deskach.',
        },
        {
          name: 'Kliniki medyczne i stomatologia estetyczna',
          text: 'Bony na zabiegi i pakiety powitalne. Błękit łupkowy łączy profesjonalizm medyczny ze współczesnym, eleganckim wzornictwem.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy błękit łupkowy nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy logo marki jest utrzymane w średnich odcieniach błękitu lub szarości. Znaki o tonacji zbliżonej do koloru podłoża stracą kontrast — w takim wypadku grafik na wizualizacji zaproponuje wersję białą lub czarną.',
        'Gdy przesyłka ma mieć charakter ciepły, rustykalny lub eko. W takich projektach lepiej sprawdzają się odcienie ziemiste: Taupe, Eko lub Matcha.',
      ],
    },
    faq: [
      {
        question: 'Czy błękit łupkowy i jeansowy to ten sam kolor koperty?',
        answer:
          'Tak. Jeansowy to nasza oficjalna nazwa katalogowa odcienia błękitu łupkowego (slate blue / stalowoniebieski). Na stronie, w konfiguratorze i na fakturze to ten sam produkt.',
      },
      {
        question: 'Czym błękit łupkowy różni się od koperty granatowej?',
        answer:
          'Jasnością i wydźwiękiem. Granat jest ciemny i czyta się jako kolor urzędowy, a błękit łupkowy pozostaje wyraźnie jaśniejszy i bardziej stalowy. Granat wymaga nadruku jasnego, na błękicie łupkowym sprawdza się także czerń i grafit.',
      },
      {
        question: 'Jaki kolor nadruku najlepiej sprawdza się na błękicie łupkowym?',
        answer:
          'Zarówno nadruk biały (dający świeży, wyrazisty kontrast), jak i czarny lub grafitowy (o charakterze formalnym) gwarantują doskonałą czytelność na tym papierze.',
      },
      {
        question: 'Czy na kopercie w kolorze błękitu łupkowego można zamówić adresowanie imienne?',
        answer:
          'Tak. W ramach usługi personalizacji na każdej kopercie drukujemy inne dane odbiorcy białym lub ciemnym kolorem, zgodnie z przekazanym arkuszem.',
      },
    ],
    ogImageSlug: 'koperty-blekit-lupkowy',
    ogImageAlt:
      'Trzy koperty DL w kolorze błękitu łupkowego ułożone jedna na drugiej, matowy stalowy papier na jasnych deskach',
  },

  taupe: {
    title: 'Koperty taupe DL z nadrukiem logo',
    description:
      'Koperty ozdobne DL 110 × 220 mm w odcieniu taupe — szarobrązowy papier 140 g/m² barwiony w masie. Nadruk logo i adresowanie imienne, wysyłka kurierem.',
    phrase: 'koperty taupe DL',
    phraseShort: 'koperty taupe',
    eyebrow: 'Kolor · Taupe',
    h1: 'Koperty taupe DL 110 × 220 mm',
    lead: 'Koperta DL w odcieniu taupe to szarobrązowy, ciepły i ziemisty kolor wykonany z najgrubszego papieru w ofercie o gramaturze 140 g/m². W katalogu i konfiguratorze występuje pod nazwą Szarobrązowy. Papier jest barwiony w masie, więc krawędzie i zagięcia klapki zachowują jednolity ton. Przyjmuje zarówno kontrastowy nadruk biały, jak i elegancką czerń.',
    paperUsp: {
      title: 'Gramatura 140 g/m²',
      note: 'Najgrubszy papier w katalogu — wyjątkowa sztywność i barwienie w masie',
    },
    shotFiles: ['taupe-koperta-dl-nadruk-logo-salonu-spa'],
    character: {
      heading: 'Czym odcień taupe różni się od szarości i klasycznego brązu',
      paragraphs: [
        'Taupe to zbalansowany odcień łączący chłodną szarość z ciepłym brązem i beżem. W odróżnieniu od surowego grafitu ma organiczny, naturalny ton, a w porównaniu z ciemnym brązem pozostaje lekki i neutralny. W świetle dziennym ujawnia ciepłe, ziemiste nuty, które przy sztucznym oświetleniu nabierają głębszego, eleganckiego wyrazu.',
        'Papier o gramaturze 140 g/m² to najgrubszy arkusz w całym naszym katalogu. Zapewnia wyjątkową sztywność w dłoni, co od razu buduje wrażenie produktu z najwyższej półki. Papier jest barwiony w masie — pigment sięga w głąb struktury, więc zagięcia klapki oraz rozcięte krawędzie nie odsłaniają jasnego rdzenia.',
        'W zapytaniach klientów odcień ten bywa nazywany taupe, szarobrązowym, ciemnym beżem, greige lub ciepłym szarym. W naszym konfiguratorze, katalogu i na fakturze występuje pod nazwą Szarobrązowy — to dokładnie ten sam odcień papieru.',
      ],
    },
    printing: {
      heading: 'Nadruk logo i adresowanie na kopercie taupe',
      paragraphs: [
        'Na szarobrązowym tle znakomicie pracują dwa kierunki kolorystyczne: świeży nadruk biały lub kremowy oraz głęboka czerń, ciemny grafit i czekoladowy brąz. Zastosowanie bieli nadaje projektowi lekkości, co widać na kadrze z logo salonu SPA poniżej.',
        'Ciemny nadruk podkreśla formalny, minimalistyczny i prestiżowy charakter korespondencji, chętnie wybierany przez biura prawne i agencje nieruchomości.',
        'Wizualizację przygotowujemy bezpłatnie na rzeczywistym tle odcienia taupe przed uruchomieniem maszyn. Produkcja rusza dopiero po jednoznacznej akceptacji projektu przez Państwa.',
      ],
    },
    audience: {
      heading: 'Kto zamawia koperty w odcieniu taupe',
      intro:
        'Kolor taupe wybierają nadawcy szukający bezkompromisowej jakości papieru, prestiżu i stonowanej, naturalnej elegancji.',
      items: [
        {
          name: 'Kancelarie prawne i doradcy podatkowi',
          text: 'Umowy, opinie prawne i pisma zarządcze. Gramatura 140 g/m² daje poczucie solidności i bezpieczeństwa ważnych dokumentów.',
        },
        {
          name: 'Agencje nieruchomości premium i deweloperzy',
          text: 'Prezentacje luksusowych inwestycji, akty notarialne i vouchery dla nabywców. Ziemisty odcień doskonale współgra ze współczesną architekturą.',
        },
        {
          name: 'Salony SPA, kliniki beauty i medycyna estetyczna',
          text: 'Karty podarunkowe i ekskluzywne zaproszenia na zabiegi. Kadr wyżej prezentuje realizację z białym nadrukiem logo salonu wellness.',
        },
        {
          name: 'Studia architektury i projektowania wnętrz',
          text: 'Oferty projektowe, próbki materiałowe i korespondencja do klientów indywidualnych. Odcień greige to standard współczesnego designu.',
        },
        {
          name: 'Marki modowe i biżuteria autorska',
          text: 'Bileciki z podziękowaniem za zakup i certyfikaty autentyczności dołączane do przesyłek w segmencie luksusowym.',
        },
      ],
    },
    caution: {
      heading: 'Kiedy odcień taupe nie jest najlepszym wyborem',
      paragraphs: [
        'Gdy logo marki zawiera średnie, zgaszone odcienie brązu lub szarości o niskim kontraście względem podłoża. W takiej sytuacji nasz grafik na wizualizacji zaproponuje wersję w bieli lub głębokiej czerni.',
        'Gdy przesyłka wymaga ekspresyjnych, jaskrawych kolorów neonowych. Naturalna, ziemista tonacja taupe najlepiej prezentuje się z kolorami stonowanymi lub w zdecydowanym kontraście.',
      ],
    },
    faq: [
      {
        question: 'Czy koperta taupe i szarobrązowa to ten sam produkt?',
        answer:
          'Tak. Szarobrązowy to oficjalna nazwa katalogowa odcienia taupe (greige / ciepły szary). W konfiguratorze, w katalogu i na fakturze jest to dokładnie ten sam papier.',
      },
      {
        question: 'Czym wyróżnia się gramatura 140 g/m² w kopercie taupe?',
        answer:
          'To najgrubszy papier w całej naszej ofercie — zapewnia wyjątkową sztywność, elegancję w dotyku i pełne krycie korespondencji bez ryzyka prześwitywania.',
      },
      {
        question: 'Jaki kolor nadruku najlepiej wygląda na kopercie taupe?',
        answer:
          'Najwyższy kontrast i elegancję daje nadruk biały lub kremowy (dający świeży efekt) oraz głęboka czerń i ciemny brąz (do oficjalnej korespondencji biznesowej).',
      },
      {
        question: 'Czy na kopertach taupe można zamówić personalizację imienną?',
        answer:
          'Tak. W ramach usługi personalizacji na każdej kopercie drukujemy inne dane odbiorcy lub pełny adres pocztowy, wybranym jasnym lub ciemnym kolorem.',
      },
    ],
    ogImageSlug: 'koperty-taupe',
    ogImageAlt:
      'Koperta DL w odcieniu taupe z białym nadrukiem logo salonu SPA, na jasnym drewnianym blacie',
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
