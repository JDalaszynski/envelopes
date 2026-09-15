# Plan publikacji — envelopes.pl

Plan produkcji landing page'y i wpisów pod cele SEO/GEO. Prowadzi go agent
`seo-geo-strategist` (`.claude/agents/seo-geo-strategist.md`) w oparciu o klastry
z [keywords.md](keywords.md) i profil klienta z [knowledge-base.md](knowledge-base.md).

**Kadencja:** ~4 pozycje tygodniowo (LP + wpisy + aktualizacje łącznie).
**Horyzont planu:** 12 tygodni · 48 pozycji.
**Punkt startowy:** domena bez historii — pierwsze pozycje w wynikach spodziewane po 3–6 miesiącach
od publikacji. Kolejność faz jest podporządkowana temu opóźnieniu: najpierw powstaje szkielet
filarów, bo to on dojrzewa najdłużej.

---

## Legenda

| Kolumna | Znaczenie |
| --- | --- |
| **Format** | `Pillar (LP)` filar klastra · `Supporting LP` strona branżowa/wariantowa · `Supporting article` wpis blogowy · `Aktualizacja` przebudowa istniejącej treści |
| **Cel** | `KONWERSJA` wejście do konfiguratora · `RUCH` pozyskanie sesji · `AUTORYTET` wiarygodność tematyczna · `GEO` cytowalność w modelach |
| **Filar** | URL, do którego treść linkuje **w górę** |
| **Status** | `[ ]` do zrobienia · `[~]` w toku · `[x]` opublikowane · `[—]` wstrzymane do odblokowania |

**Zasada:** każda pozycja linkuje w górę do dokładnie jednego filara. Filar linkuje w dół do
3–6 treści wspierających. Publikacja bez dołożenia linków zwrotnych na stronach istniejących
jest niekompletna.

**Zamknięcie pozycji:** data w `PAGE_UPDATED` (`src/app/sitemap.ts`) i — po wdrożeniu —
zgłoszenie adresu przez `npm run indexnow`. Dotyczy każdej nowej trasy, każdego nowego wpisu
i każdej istotnej aktualizacji istniejącej strony. Bez tego Bing dowie się o publikacji za
kilka tygodni, a razem z nim ChatGPT Search i Copilot (brief agenta, pkt 5.7).

---

## Mapa filarów

| Filar | URL | Klaster | Obsługuje intencję |
| --- | --- | --- | --- |
| **F1 — Nadruk** | `/koperty-z-nadrukiem` | K1 | „chcę koperty z moim logo" |
| **F2 — Personalizacja** | `/koperty-personalizowane` | K2 | „chcę koperty zaadresowane imiennie" |
| **F3 — Format DL** | `/koperty-dl` | K4 | „jakie wymiary, co się zmieści" — opublikowany 14 sierpnia 2026 |
| **F4 — Vouchery** | `/koperty-na-vouchery` | K7 | „w co zapakować bon podarunkowy" — opublikowany 14 sierpnia 2026 |
| **F5 — Kolory** | ~~`/koperty`~~ → `/` | K3, K5 | „jaki kolor koperty wybrać" — przejęte przez `/` |
| **H — Hub** | `/` | K3, K5 | konfigurator + paleta 19 kolorów + rozdzielnik ruchu |

> **Zmiana z 13 sierpnia 2026.** Filar F5 nie dostaje własnego adresu. Po przebudowie strony
> głównej paleta 19 kolorów, tabela gramatur i wykończeń oraz `ItemList` w danych strukturalnych
> stoją na `/`. Osobny hub `/koperty` konkurowałby z `/` o frazę `koperty kolorowe`.
> Strony `/koperty/[kolor]` z Fazy 3 linkują w górę wprost do `/`.

---

## Faza 0 · Fundament (tydzień 1–2)

Cel fazy: postawić szkielet, na którym zawiśnie wszystko inne. Bez filarów każdy kolejny wpis
linkuje donikąd i nie buduje żadnego klastra.

### Tydzień 1

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Koperty z nadrukiem logo firmowego — `/koperty-z-nadrukiem` | Pillar (LP) | koperty z nadrukiem | KONWERSJA | **Każda firma z logo** — sekcja „Dla kogo" obejmuje 8–10 branż | — | Przejmuje intencję transakcyjną, którą dziś rozmywa wpis `koperty-firmowe-z-nadrukiem-…` (ten zostaje jako poradnik procesowy) | [x] |
| 2 | Personalizowane koperty i adresowanie — `/koperty-personalizowane` | Pillar (LP) | personalizowane koperty | KONWERSJA | **Każdy, kto wysyła imiennie** — sekretariat, HR, hotele, uczelnie, eventy | — | Obsługuje trzy nazwy jednej usługi (personalizacja / adresowanie / imiona i nazwiska) w jednym URL — nie rozbijać na osobne strony | [x] |
| 3 | Koperty DL — wymiary 110 × 220 mm — `/koperty-dl` | Pillar (LP) | koperty dl wymiary | GEO | Wszystkie (wejście TOFU) | — | Jedyna strona odpowiadająca na pytania o specyfikację. Sekcja kolorów linkuje do `/`, nie duplikuje palety; **brak nagłówka cenowego** — cena jest jednym wierszem tabeli specyfikacji, bo cennik należy do `/` | [x] |
| 4 | Koperty na vouchery i bony podarunkowe — `/koperty-na-vouchery` | Pillar (LP) | koperty na vouchery | KONWERSJA | **Każda usługa sprzedająca bon** — SPA, fryzjer, gastronomia, fitness, klinika, hotel, warsztat, szkoła | — | Klaster nietknięty przez istniejące treści — zero ryzyka nakładania. **Tabela liczy koszt gotowej serii bonów w trzech konfiguracjach** (gładka / z logo / z logo i imieniem), nie składniki ceny jednostkowej — te zostają na F1 | [x] |

> **Zasada zasięgu filarów (dotyczy poz. 1–5).** Filar mówi do **wszystkich** branż — zawężenie
> jest błędem, bo nadruku logo potrzebuje praktycznie każda firma. Każdy filar ma obowiązkową
> sekcję **„Dla kogo"** z 8–10 zastosowaniami branżowymi po jednym akapicie, z linkiem w dół do
> LP branżowego z Fazy 2 (dopóki nie istnieje — akapit bez linku, link dokładany przy publikacji LP).
> Kanibalizacji nie ma, bo filar celuje we frazę usługową (`koperty z nadrukiem`), a LP branżowe
> we frazę branżową (`koperty dla kancelarii`) — inna intencja, inny słownik, inny etap decyzji.
> Kolumna „Persona / Branża" przy filarze opisuje **akcent treści**, nie ograniczenie odbiorcy.

### Tydzień 2

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | ~~Koperty ozdobne — 19 kolorów — `/koperty`~~ | Pillar (LP) | koperty kolorowe | — | — | — | **Anulowane** przy poz. 6. Paleta, tabela gramatur i `ItemList` stoją na `/`; osobny hub konkurowałby z własną stroną główną o `koperty kolorowe` | [x] |
| 6 | Strona główna — pełna przebudowa treści — `/` | Aktualizacja | koperty ozdobne | KONWERSJA | Wszystkie | — | Fraza główna w leadzie i w H2 nad sekcją kolorów, **H1 bez zmian**; cennik dotyczy kopert gładkich, cennik nadruku zostaje w F1 | [x] |
| 7 | Jak przygotować pliki do druku na kopertach — `/blog/jak-przygotowac-pliki-do-druku-na-kopertach` | Aktualizacja | pliki do druku na kopertach | AUTORYTET | Grafik, marketing | F1 | **Wykonane 15 sierpnia 2026.** Tytuł, slug i wszystkie 8 sekcji przepisane pod intencję „jak przygotować plik"; wpis nie zawiera ceny ani MOQ (należą do F1, poz. 9 i 46). Filar odpowiada „jakie pliki przyjmujemy", wpis — „jak ten plik przygotować" | [x] |
| 8 | Adresowanie kopert z arkusza czy ręcznie — `/blog/adresowanie-kopert-z-arkusza-czy-recznie` | Supporting article | adresowanie kopert z arkusza | AUTORYTET | Office manager | F2 | **Wykonane 16 sierpnia 2026.** Treść napisana od zera; oś decyzji przesunięta ze skali na **treść nadruku i źródło danych**, bo skalę rozstrzyga tabela na filarze. Zero cen, zero MOQ, zero progów ilościowych. Tytuł doprecyzowany — slug niesie pełną frazę długiego ogona | [x] |

---

## Faza 1 · Cena, specyfikacja, cytowalność (tydzień 3–4)

Cel fazy: obudować filary treścią, którą modele językowe cytują najchętniej — konkretami
liczbowymi i porównaniami. Najtańszy dostępny kanał widoczności dla domeny bez historii.

### Tydzień 3

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Cena kopert z nadrukiem i koszt zamówienia — `/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia` | Supporting article | koperty z nadrukiem cena | GEO | Decydent budżetowy | F1 | **Wykonane 17 sierpnia 2026.** Fraza cenowa przeszła z `keywords` filara do wpisu — jeden właściciel na serwis. Filar zostaje przy frazie usługowej `koperty z nadrukiem` i całej warstwie transakcyjnej, a wpis przesuwa jednostkę rozliczenia ze **sztuki** na **całe zamówienie**: dostawa rozłożona na sztuki oraz tabela pozycji, których nie doliczamy. Sekcja `#cena` i pytanie cenowe w `PRINT_FAQ_ITEMS` zostają na filarze | [x] |
| 10 | Jaki format koperty wybrać do wkładki — `/blog/jaki-format-koperty-wybrac-do-wkladki` | Supporting article | format do koperty dl | GEO | Wszystkie | F3 | **Wykonane 17 sierpnia 2026.** Odwrotne mapowanie: wkładka → format. F3 podaje wymiary trzech formatów i status dostępności w tabeli; ten wpis prowadzi przez decyzję i uzasadnia różnice konstrukcyjne. Tytuł doprecyzowany — slug niesie pełną frazę długiego ogona. Pytanie „Czym różni się koperta DL od C6" nie wróciło (należy do `DL_FAQ_ITEMS`); zero CTA na C6/K4, zero kwot, zero MOQ | [x] |
| 11 | Ile kartek mieści koperta DL i jak je złożyć — `/blog/ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc` | Supporting article | kartka do koperty dl | GEO | Wszystkie | F3 | **Wykonane 18 sierpnia 2026.** Trzeci wymiar, którego F3 nie dotyka: grubość wkładu. Tabela dopuszczalnej liczby arkuszy per gramatura (80g do 5 szt., 90-100g do 4 szt., 120-135g do 3 szt.), instrukcja krok po kroku składania A4 w literę C (standard biurowy / listowy) i literę Z (harmonijkowe), fizyka zjawisk blokowania wkładu (sprężynowanie grzbietu, brak bigowania, zszywki) oraz pakowanie ręczne. Zero cen i stawek nadruku | [x] |
| 12 | Paleta 19 kolorów — jak wybrać odcień | Supporting article | kolory kopert | RUCH | Marketing, brand manager | F5 = `/` | **Wykonane 20 sierpnia 2026.** Format zmieniony z `Aktualizacja` na `Supporting article` 15 sierpnia 2026 — wpis startowy usunięty, treść powstała od zera. Link w górę wprost do `/` anchorem `koperty ozdobne` (huba `/koperty` nie ma — poz. 5 anulowana), w dół do stron kolorów z Fazy 3. Frazy `koperty ozdobne` i `koperty kolorowe` zostają przy `/`; wpis obsługuje dobór odcienia do identyfikacji wizualnej | [x] |

### Tydzień 4

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Koperty bez okienka — kiedy je wybrać | Supporting article | koperty bez okienka | GEO | Kancelarie, biura rachunkowe | F3 | Cała oferta jest bez okienka — treść wykorzystuje to jako wyróżnik, nie jako filtr produktowy. **Wykonane 21 sierpnia 2026.** F3 podaje sam fakt (wiersz specyfikacji + akapit „Brak okienka na całej ofercie"); ten wpis obsługuje intencję decyzyjną: kiedy okienko przeszkadza, a kiedy jego brak wymusza adresowanie | [x] |
| 14 | Jak zaadresować kopertę wysyłaną przez firmę — wzór | Supporting article | adresowanie koperty od firmy | GEO | Sekretariat, office manager | F2 | Intencja **instruktażowa**, nie zakupowa: wzór adresu i układ, CTA dopiero pod treścią merytoryczną. Filar F2 świadomie **nie ma** sekcji ze wzorem adresu — opisuje wyłącznie zakres usługi („co drukujemy"), więc ta pozycja nie koliduje. **Wykonane 22 sierpnia 2026.** | [x] |
| 15 | Koperty z imieniem i nazwiskiem — jak przygotować listę | Supporting article | koperty z imieniem i nazwiskiem | RUCH | Office manager, HR | F2 | Dotyczy **przygotowania danych po stronie klienta** (eksport z CRM, odmiana nazwisk, ujednolicenie zapisu); filar F2 podaje wyłącznie specyfikację arkusza (kolumny, pola wymagane, walidacja), poz. 8 — wybór trybu. Trzy różne pytania użytkownika. **Granica dopisana 16 sierpnia 2026:** poz. 8 zajęła już tabelę „skąd pochodzi lista → tryb" oraz przyczyny odrzucenia arkusza (druga zakładka, przemianowany nagłówek, wiersze ukryte filtrem). Ta pozycja zaczyna się **po** wyborze trybu: co zrobić z danymi między eksportem a wgraniem pliku. **Wykonane 25 sierpnia 2026.** Tytuł doprecyzowany na „Koperty z imieniem i nazwiskiem — lista do nadruku" (slug niesie pełną frazę długiego ogona). Granica utrzymana: zero tabeli „skąd pochodzi lista → tryb", zero przyczyn odrzucenia pliku, zero specyfikacji kolumn — wpis obsługuje wyłącznie higienę danych (scalanie kolumn, wersaliki, kodowanie polskich znaków, odmiana nazwiska, duplikaty, minimalizacja danych osobowych). Bez kwot, MOQ i terminów | [x] |
| 16 | Szybka realizacja kopert — terminy i ekspres — `/blog/szybka-realizacja-kopert-terminy-i-ekspres` | Supporting article | szybka realizacja kopert | KONWERSJA | Agencje eventowe, „na już" | F1 | **Format zmieniony z `Aktualizacja` na `Supporting article` 15 sierpnia 2026** — wpis startowy usunięty, treść powstała od zera. **Wykonane 26 sierpnia 2026.** Tytuł doprecyzowany — slug niesie frazę główną i różnicę intencji. Oś przesunięta z **ile trwa** na **od kiedy liczymy**: filar podaje liczbę dni w tabeli `#terminy` i w `PRINT_FAQ_ITEMS`, a wpis dokłada arytmetykę kalendarza — późniejsze z dwóch zdarzeń uruchamiających bieg terminu, równoległość wpłaty i wizualizacji, czas przewoźnika poza terminem realizacji i liczenie wstecz od daty wydarzenia. Cennik nadruku i personalizacji nieobecny; dopłata ekspresowa wyłącznie w tabeli przeliczeniowej na jeden zyskany dzień roboczy | [x] |

---

## Faza 2 · Branże (tydzień 5–7)

Cel fazy: przełożyć 22 profile klienta z bazy wiedzy na strony, które mówią językiem branży.
**Warunek wejścia:** każda pozycja opiera się na istniejącym zdjęciu z `public/images/prints/`
lub `personalized/` — buduj treść wokół zdjęcia, które faktycznie masz.

### Tydzień 5

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | Koperty dla kancelarii prawnych — `/koperty-dla-kancelarii` | Supporting LP | koperty dla kancelarii | KONWERSJA | Kancelarie, notariusze | F1 | **Wykonane 7 września 2026.** Kolory stonowane (czarny, granat, taupe), pisma i akty. Nie powtarza cennika z poz. 9 — linkuje. Trzecia i ostatnia LP z realnym kadrem aranżacyjnym z trójki wskazanej przy poz. 19/23 — bez presji sezonowej, więc zrobiona jako ostatnia z trzech | [x] |
| 18 | Koperty firmowe dla hotelu — `/koperty-dla-hoteli` | Supporting LP | koperty firmowe dla hotelu | KONWERSJA | Hotele 4–5*, resorty | F4 | **Wykonane 14 września 2026.** Welcome letters i vouchery pobytowe; filar F4, bo dominuje zastosowanie voucherowe. **Rozgraniczenie:** F4 poświęca hotelom jeden akapit w sekcji „Dla kogo", ten LP celuje we frazę branżową i dokłada scenariusz welcome letter, którego filar nie ma — personalizacja imienna w zakresie `imiona` (nazwisko gościa bez adresu, lista z systemu rezerwacji). Pierwsza LP branżowa **bez** własnego kadru aranżacyjnego: trójkę kadrów branżowych zamknęła poz. 17, więc przy karcie powitalnej stoi realny kadr personalizacji odręcznej, a kolory rekomendowane pokazują kadry katalogowe | [x] |
| 19 | Koperty na bony do salonu SPA — `/koperty-dla-salonow-spa` | Supporting LP | koperty na bony podarunkowe | KONWERSJA | SPA, kosmetyka, masaż | F4 | **Wykonane 5 września 2026.** Fraza `koperty na bony podarunkowe` przeniesiona z `keywords` filara F4 (zostaje przy `koperty na vouchery`, `koperty do voucherów`, `koperta do vouchera`, `koperta na bon podarunkowy`). Wybrana jako pierwsza LP Fazy 2 zamiast poz. 17/18: sezonowe okno („publikować przed IV kw.") jest jedynym twardym terminem w całym planie, a domena potrzebuje 3–6 miesięcy dojrzewania w indeksie (K7, keywords.md) | [x] |
| 20 | Koperta ozdobna na voucher — jaki format i kolor — `/blog/koperta-ozdobna-na-voucher-jaki-format-i-kolor` | Supporting article | koperta ozdobna na voucher | GEO | Właściciel salonu | F4 | **Wykonane 10 września 2026.** Doradcza; filar F4 sprzedaje, ten wpis odpowiada na pytanie „jaka". **Granica po publikacji F4:** filar podaje wymiary trzech postaci bonu (DL / A6 / karta ID-1) i jeden fakt o kolorze — nadruk kosztuje tyle samo na każdym odcieniu, a o czytelności decyduje kontrast. Ten wpis dostaje dobór odcienia do branży i okazji oraz kiedy sięgnąć po metalik i perłę. Tabeli wymiarów bonu nie powtarza (odsyła do `#wymiar-bonu`); wobec LP poz. 19 i 23 zestawia wiele branż naraz i linkuje do nich zamiast powtarzać ich kosztorys i kalendarz | [x] |

### Tydzień 6

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | Koperty dla biur rachunkowych — `/koperty-dla-biur-rachunkowych` | Supporting LP | koperty dla biur rachunkowych | KONWERSJA | Biura rachunkowe, audyt | F1 | **Wykonane 14 września 2026.** **Fraza skorygowana 7 września 2026** — `koperty firmowe z logo` należy do K1 (keywords.md, wspierająca fraza filara F1), a LP branżowa musi celować we frazę branżową, nie frazę filara pod którym stoi; strona nie ma jej w `keywords`. **Rozgraniczenie wobec poz. 17 wdrożone na czterech osiach:** częstotliwość (ten sam portfel klientów kilka razy w roku przeciw jednorazowej sprawie), kalendarz roku obrotowego (poz. 17 nie ma sezonowości wcale), jednostka nakładu (tabela liczy partię wielkością portfela, nie liczbą sztuk) i kolor (Biały i Ecru przeciw ciemnej trójce kancelaryjnej). Adresowanie serii zostaje przy poz. 17 — tutaj wyłącznie kolumna tabeli i odnośnik do F2 | [x] |
| 22 | Koperty dla klinik i gabinetów — `/koperty-dla-klinik` | Supporting LP | koperty na vouchery dla kliniki | KONWERSJA | Med. estetyczna, stomatologia | F4 | **Wykonane 14 września 2026.** Jasne, „czyste" barwy; osobno od poz. 19 — inny cykl zakupowy i inny język. **Rozgraniczenie wdrożone:** cały wybór koloru dzieje się **wewnątrz barw jasnych** (Biały i Błękitna pod stomatologię przeciw perle pod medycynę estetyczną), gdy poz. 19 zestawia jasne z naturalnym Szarobrązowym; dochodzi drugi obieg kopert gabinetowych zużywanych przez cały rok i kalendarz z sezonem ślubnym, którego salon nie ma | [x] |
| 23 | Koperty dla restauracji — `/koperty-dla-restauracji` | Supporting LP | koperty na vouchery do restauracji | KONWERSJA | Fine dining, winiarnie | F4 | **Wykonane 6 września 2026.** Vouchery na kolacje; wybrana jako druga LP Fazy 2 zaraz po poz. 19 z tego samego powodu — szczyt sprzedażowy w grudniu i przed Walentynkami, domena potrzebuje czasu na dojrzewanie w indeksie. Brak konfliktu frazowego — fraza nie występowała wcześniej w `keywords` żadnej strony | [x] |
| 24 | Bon podarunkowy — jak go wręczyć, żeby wyglądał jak prezent | Supporting article | ~~koperta do vouchera~~ → `jak wręczyć bon podarunkowy` | RUCH | Właściciel usługi | F4 | **Wykonane 7 września 2026.** Poradnik prezentacyjny; poz. 20 dotyczy doboru koperty, ten — sposobu wręczenia. **Fraza główna przepisana 14 sierpnia 2026:** `koperta do vouchera` to liczba pojedyncza frazy filara `koperty do voucherów` — dwa adresy na tę samą intencję to kanibalizacja z definicji. Fraza zostaje przy F4 (jest w jego `keywords`), wpis celuje w intencję czynnościową. `title` skrócony do 66 znaków z sufiksem marki — pełna wersja z planu dawała 71 | [x] |

### Tydzień 7

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Koperty dla agencji eventowych — `/koperty-dla-agencji-eventowych` | Supporting LP | koperty na zaproszenia firmowe | KONWERSJA | Agencje eventowe, PR | F1 | **Wykonane 15 września 2026.** Warunek brzegowy spełniony: żaden przycisk na stronie nie prowadzi do C6/K4, a zaproszenie kwadratowe ma w tabeli status policzony z katalogu przez `fitsInFormat()`. **Rozgraniczenie wobec poz. 41 i 42 przebiega po pytaniu, nie po temacie:** ta LP odpowiada „jak poprowadzić wysyłkę zaproszeń na wydarzenie firmowe" (lista gości, fale kampanii, nakład z zapasem), poz. 41 odpowie „którą kopertę dobrać do tego zaproszenia" (wkładka → format), poz. 42 weźmie personę ślubną. Frazy `koperty na zaproszenia` **nie ma** w `keywords` tej strony | [x] |
| 26 | Koperty dla biur nieruchomości — `/koperty-dla-nieruchomosci` | Supporting LP | koperty na dokumenty firmowe | KONWERSJA | Nieruchomości premium, deweloperzy | F1 | Akty i umowy; format DL naturalnie pasuje do dokumentów składanych | [ ] |
| 27 | Koperty na certyfikaty i dyplomy — `/koperty-na-certyfikaty` | Supporting LP | koperty na certyfikaty | RUCH | Uczelnie, firmy szkoleniowe | F1 | **Ostrożnie:** dyplom A4 płaski wymaga K4 (niedostępny). Treść mówi wprost o A4 składanym na trzy i kieruje resztę na listę powiadomień | [ ] |
| 28 | Realizacja: koperty z nadrukiem dla hotelu | Supporting article | realizacja kopert z nadrukiem dla hotelu | AUTORYTET | Hotele | F4 | **Fraza skorygowana 7 września 2026** — `koperty z nadrukiem firmowym` należy do K1 (keywords.md, wspierająca fraza filara F1); studium przypadku celuje we frazę dowodową, nie transakcyjną, i nie koliduje też z `koperty firmowe dla hotelu` (poz. 18). Dowód wykonania na realnym zdjęciu; uzupełnia poz. 18 o warstwę E-E-A-T. **Warunek wejścia dopisany 15 sierpnia 2026:** wpis powstaje wyłącznie na realnym zamówieniu, potwierdzonym przez właściciela — samo zdjęcie nadruku z `public/images/prints/` nie wystarczy, bo studium przypadku niesie też klienta, skalę i efekt. **Warunek niespełniony na 7 września 2026** — status wraca do `[—]`, jak poz. 47 | [—] |

---

## Faza 3 · Strony kolorów (tydzień 8–9)

Cel fazy: najtańszy przyrost powierzchni indeksowej w projekcie — dane (hex, gramatura,
bestseller) i zdjęcia już istnieją w `src/lib/catalog.ts` i `public/images/colors/`.
Szablon: `/koperty/[kolor]`, generowany z `COLORS`. CTA wchodzi do konfiguratora
z **preselekcją koloru**.

> **Reguła adresowania (17 sierpnia 2026): kolor ma adres, format jest wariantem na stronie.**
> `/koperty/czarny` nie niesie formatu w adresie świadomie. Gdy ruszą C6 i K4, ta sama strona
> pokaże trzy warianty zamiast rozmnażać się na `czarny-dl`, `czarny-c6` i `czarny-k4` —
> 19 kolorów × 3 formaty to 57 stron różniących się jednym wierszem tabeli i konkurujących
> o tę samą frazę kolorystyczną. Zapytania idą po kolorze **albo** po formacie, rzadko po obu.
> Lista rzeczy do zmiany w dniu uruchomienia formatów stoi w nagłówku `src/lib/color-pages.ts`;
> symbole handlowe (`colorSku`, `colorGroupId`) i komponent koszyka są już sparametryzowane
> formatem. Furtka na wypadek realnego wolumenu na „kolor + format": podstrona
> `/koperty/czarny/c6`, bez przekierowania istniejącego adresu.

> **Filar F5 to `/`, nie `/koperty`** (zmiana z 13 sierpnia 2026). Strony kolorów linkują
> w górę do strony głównej anchorem `koperty ozdobne`, a strona główna linkuje w dół z tabeli
> gramatur — nazwa koloru w tabeli zamienia się wtedy z odnośnika do konfiguratora na odnośnik
> do strony koloru. Każda strona koloru celuje w `[kolor] koperty dl`; frazy `koperty ozdobne`
> i `koperty kolorowe` pozostają przy `/`.

### Tydzień 8

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 29 | Czarne koperty DL — `/koperty/czarny` | Supporting LP | czarne koperty z logo | KONWERSJA | Kancelarie, tatuaż, premium | F5 | **Wykonane 17 sierpnia 2026.** Fraza należy jednocześnie do K1 — właścicielem jest strona koloru, F1 tylko linkuje. Szablon `/koperty/[kolor]` i przycisk „dodaj do koszyka" powstały przy tej pozycji; treść mieszka w `src/lib/color-pages.ts`, który jest jednocześnie listą opublikowanych kolorów | [x] |
| 30 | Granatowe koperty DL — `/koperty/granatowy` | Supporting LP | granatowe koperty dl | KONWERSJA | Kancelarie, korporacje | F5 | **Wykonane 17 sierpnia 2026.** Wariant kolorystyczny, bez powielania treści usługowej z F1/F2. Sekcja „charakter" porównuje granat z czernią i z jaśniejszymi błękitami — to jedyna treść, której nie da się odtworzyć z parametrów katalogu | [x] |
| 31 | Złote koperty DL — `/koperty/zloty` | Supporting LP | złote koperty dl | KONWERSJA | Eventy, wesela, gale | F5 | **Wykonane 17 sierpnia 2026.** Wykończenie metaliczne bez dopłaty jest głównym argumentem strony — dostało pierwszą pozycję paska faktów i pytanie cenowe w FAQ. Sekcja „charakter" rozgranicza papier metaliczny od złocenia, którego nie wykonujemy | [x] |
| 32 | Koperty ecru DL — `/koperty/ecru` | Supporting LP | koperta dl beżowa | KONWERSJA | Ślub, kliniki, hotele | F5 | **Wykonane 17 sierpnia 2026.** Most nazewniczy „beżowa/kremowa/kość słoniowa" → Ecru stoi w treści i w FAQ, bez tworzenia koloru w katalogu. Jedyna z czterech stron bez kadru aranżacyjnego — siatka kadrów się nie renderuje | [x] |

### Tydzień 9

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 33 | Białe koperty DL — `/koperty/bialy` | Supporting LP | białe koperty dl | KONWERSJA | Wszystkie | F5 | **Wykonane 18 sierpnia 2026.** Podkreślona czytelność nadruku w pełnym kolorze i pisma odręcznego, różnice konstrukcyjne wobec masowej koperty biurowej 75–80 g/m² z okienkiem i szarym poddrukiem oraz wobec Białej Perłowej | [x] |
| 34 | Koperty matcha DL — `/koperty/matcha` | Supporting LP | koperty matcha | RUCH | Agencje kreatywne, eko-marki | F5 | **Wykonane 18 sierpnia 2026.** Szałwiowa pastelowa zieleń, podwyższona gramatura 120 g/m² i barwienie w masie. Dwa kadry aranżacyjne w galerii nadruków. Mosty nazewnicze: szałwiowy, pistacjowy, oliwkowy | [x] |
| 35 | Koperty błękit łupkowy DL — `/koperty/blekit-lupkowy` | Supporting LP | koperty błękit łupkowy | RUCH | Agencje, hotele | F5 | **Wykonane 18 sierpnia 2026.** Stalowy błękit (w katalogu: Jeansowy), gramatura 120 g/m² i barwienie w masie. Kadr aranżacyjny z białym nadrukiem. Most nazewniczy: jeansowy, błękit łupkowy, stalowy błękit, slate blue | [x] |
| 36 | Koperty taupe DL — `/koperty/taupe` | Supporting LP | koperty taupe | RUCH | Kancelarie, nieruchomości | F5 | **Wykonane 18 sierpnia 2026.** Ziemisty odcień szarobrązowy, najwyższa gramatura w ofercie 140 g/m² i barwienie w masie. Kadr aranżacyjny z białym logo salonu SPA. Mosty nazewnicze: taupe, szarobrązowy, greige, ciemny beż, ciepły szary. Zamknięcie Fazy 3 | [x] |
| 36a | Szare koperty DL — `/koperty/szara` | Supporting LP | szare koperty dl | RUCH | Architekci, technologia, minimalizm | F5 | **Wykonane 18 sierpnia 2026.** Popielaty, neutralny odcień barwiony w masie (115 g/m²). Nowoczesna alternatywa dla biurowej bieli. Mosty nazewnicze: szary, popielaty, jasnoszary, jasnografitowy | [x] |
| 36b | Niebieskie koperty DL — `/koperty/niebieski` | Supporting LP | niebieskie koperty dl | KONWERSJA | Finanse, edukacja, gale | F5 | **Wykonane 18 sierpnia 2026.** Nasycony odcień kobaltowy / chabrowy barwiony w masie (115 g/m²). Kadr aranżacyjny z personalizacją imienną. Mosty nazewnicze: niebieski, chabrowy, kobaltowy, szafirowy, royal blue | [x] |
| 36c | Błękitne koperty DL — `/koperty/jasnoniebieska` | Supporting LP | błękitne koperty dl | RUCH | Kliniki, wellness, chrzest/baby shower | F5 | **Wykonane 18 sierpnia 2026.** Pastelowy baby blue barwiony w masie (115 g/m²). Czysty kontrast pod ciemny nadruk i pismo odręczne. Mosty nazewnicze: błękitna, jasnoniebieska, baby blue, pastelowy błękit | [x] |
| 36d | Ciemnozielone koperty DL — `/koperty/ciemnozielony` | Supporting LP | ciemnozielone koperty dl | KONWERSJA | Luksus, leśnictwo, jubilerzy | F5 | **Wykonane 18 sierpnia 2026.** Głęboka butelkowa zieleń barwiona w masie (115 g/m²). Znakomity kontrast pod jasny nadruk logo (biel, złoto, krem, srebro). Mosty: butelkowa zieleń, ciemnozielony, zieleń leśna, szmaragdowy, bottle green | [x] |
| 36e | Zielone koperty DL — `/koperty/jasnozielony` | Supporting LP | zielone koperty dl | RUCH | Florystyka, eko, edukacja | F5 | **Wykonane 18 sierpnia 2026.** Świeża jasna zieleń trawiasta barwiona w masie (115 g/m²). Czysty kontrast dla ciemnego nadruku i pisma odręcznego. Mosty: zielony, jasnozielony, zieleń trawiasta, soczysta zieleń, light green | [x] |
| 36f | Czerwone koperty DL — `/koperty/czerwony` | Supporting LP | czerwone koperty dl | KONWERSJA | Restauracje, święta, kultura | F5 | **Wykonane 18 sierpnia 2026.** Karminowo-bordowy szlachetny odcień barwiony w masie (115 g/m²). Kadr aranżacyjny z czarnym nadrukiem logo restauracji. Mosty: czerwony, karminowy, bordowy, wiśniowy, rubinowy | [x] |

| 36g | Różowe koperty DL — `/koperty/rozowa` | Supporting LP | różowe koperty dl | RUCH | Beauty, moda, florystyka | F5 | **Wykonane 19 sierpnia 2026.** Przygaszony, dojrzały róż barwiony w masie (115 g/m²). Argument własny: jedyny ciepły kolor w palecie, który zostaje jasny — przyjmuje ciemny nadruk przy pełnej sile barwy. Rozgraniczenie wobec `czerwony` stoi w sekcji „charakter" i w FAQ. Mosty: brudny róż, pudrowy, wrzosowy, róż angielski | [x] |
| 36h | Koperty eko kraft DL — `/koperty/eko` | Supporting LP | koperty eko dl | KONWERSJA | Kawa, slow fashion, kosmetyki naturalne, ESG | F5 | **Wykonane 19 sierpnia 2026.** Naturalnie brązowy papier kraftowy (115 g/m²). Argument własny: jedyny odcień, który komunikuje materiał, a nie dobraną barwę. Kadr aranżacyjny z logo palarni kawy. Rozgraniczenie wobec `taupe` i `ecru` w sekcji „charakter" i w FAQ. Mosty: kraft, brązowy, papier z odzysku | [x] |
| 36i | Żółte koperty DL — `/koperty/zolta` | Supporting LP | żółte koperty dl | RUCH | Edukacja, agencje kreatywne, turystyka | F5 | **Wykonane 19 sierpnia 2026.** Nasycona słoneczna żółć barwiona w masie (115 g/m²). Argument własny: najjaśniejszy mocny kolor w palecie, czyli najwyższy kontrast pod nadruk ciemny. Cała sekcja „charakter" rozgranicza **żółty od złotego** — to największa kolizja nazewnicza w palecie. Mosty: żółty, słoneczny, kanarkowy; „musztardowy" świadomie odesłany jako barwa spoza oferty | [x] |
| 36j | Srebrne perłowe koperty DL — `/koperty/srebrna-perlowa` | Supporting LP | srebrne perłowe koperty dl | KONWERSJA | Technologia, motoryzacja, stomatologia | F5 | **Wykonane 19 sierpnia 2026.** Chłodny połysk perłowy (115 g/m²). Argument własny: jedyny odcień z połyskiem w tonacji zimnej. Rozgraniczenie dwustronne — wobec `szara` (powierzchnia) i wobec `biala-perlowa` (jasność i temperatura). Pytanie o hot stamping zostaje tutaj; pytanie cenowe pozostaje przy `zloty` | [x] |
| 36k | Białe perłowe koperty DL — `/koperty/biala-perlowa` | Supporting LP | białe perłowe koperty dl | KONWERSJA | Uroczystości, beauty, detailing, moda | F5 | **Wykonane 19 sierpnia 2026.** Neutralna perła (115 g/m²). Argument własny: jedyny papier z połyskiem, który przyjmuje nadruk w pełnym kolorze. Trzy kadry aranżacyjne (auto detailing, salon fryzjerski, adresowanie z arkusza) — najbogatsza galeria w klastrze. Zamknięcie palety 19 odcieni | [x] |

> **Backlog kolorów wyczerpany 19 sierpnia 2026.** Wszystkie 19 odcieni z `COLORS` ma opublikowaną
> stronę; `COLOR_PAGES` i `catalog.ts` są komplementarne, więc kolejny kolor w katalogu wymaga
> jednocześnie wpisu treściowego, inaczej nie powstanie adres.

---

## Faza 4 · Premium, pieniądze, klaster ślubny (tydzień 10–12)

### Tydzień 10

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 37 | Eleganckie koperty premium — `/koperty-premium` | Pillar (LP) | koperty premium | KONWERSJA | Premium B2B | H `/` | **Wykonane 18 sierpnia 2026.** Kompletny filar K6 z twardymi parametrami poligraficznymi (115–140 g/m², perła i metalik bez dopłaty, barwienie w masie, brak okienka i poddruku, MOQ 10 dla nadruku). **14 września 2026 dołożone linkowanie w dół** — do czasu poz. 38 filar linkuje do czterech wpisów istniejących. | [x] |
| 38 | Gramatura papieru w kopertach — 115, 120 i 140 g | Supporting article | gramatura papieru na koperty | GEO | Zakupowiec, grafik | `/koperty-premium` | **Fraza skorygowana 7 września 2026** — `eleganckie koperty premium` należy do K6 (keywords.md, wspierająca fraza filara `/koperty-premium`); wpis o gramaturze celuje we frazę faktograficzną, zgodną z jego rzeczywistą treścią (tabela gramatur). Materiał wprost pod cytowanie przez modele | [ ] |
| 39 | Koperty na pieniądze — `/koperty-na-pieniadze` | Pillar (LP) | koperty na pieniądze | KONWERSJA | Detal + firmy (premie, nagrody) | H `/` | **Wykonane 7 września 2026, wyprzedzająco z Fazy 4.** Klaster detaliczny — termin realizacji podany nad CTA (hero, pasek faktów, sekcja kosztowa), inaczej wygeneruje odbicia. Prerekwizyt „dopiero po wdrożeniu K1, K2, K7" spełniony — wszystkie trzy istnieją. **14 września 2026 dołożone linkowanie w dół** — do czasu poz. 40 i 44 filar linkuje do czterech wpisów istniejących | [x] |
| 40 | Personalizowana koperta na pieniądze — kiedy się opłaca | Supporting article | personalizowana koperta na pieniądze | KONWERSJA | Detal, HR (premie imienne) | F2 | Upsell usługi +2,99 zł; poz. 39 sprzedaje kopertę gładką, ta pozycja usługę | [ ] |

### Tydzień 11 — klaster ślubny w trybie content-first

> Bez CTA zakupowego na C6/K4. Konwersją jest zapis na powiadomienie o dostępności formatów.
> Wyjątek: personalizacja i koperty na pieniądze są dostępne **dziś** na formacie DL.

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | Jak dobrać kopertę do zaproszeń | Supporting article | koperty na zaproszenia | RUCH | Eventy, ślub | F3 | **Format zmieniony z `Aktualizacja` na `Supporting article` 15 sierpnia 2026** — wpis startowy usunięty, fraza `koperty na zaproszenia` jest dziś **bez właściciela**, więc treść powstaje od zera z linkiem w górę do F3. Bez CTA zakupowego na C6/K4, konwersją jest zapis na powiadomienie. **Tabeli dopasowań nie dublować** — stoi na F3; wpis zostaje przy doborze koperty do zaproszenia. **Uwaga dopisana 15 września 2026, po publikacji poz. 25:** wpis zaczyna się od **wkładki**, nie od nadawcy — „mam zaproszenie o takim wymiarze, jakiej koperty potrzebuję". Cztery rzeczy należą już do poz. 25 i tu nie wracają: fale kampanii zapraszającej, nakład liczony listą gości, dobór odcienia do charakteru wydarzenia i tabela materiałów eventowych. Fraza `koperty na zaproszenia firmowe` ma właściciela w poz. 25 i nie wchodzi do `keywords` tego wpisu | [ ] |
| 42 | Koperty na zaproszenia ślubne — poradnik doboru | Supporting article | koperty na zaproszenia ślubne | RUCH | Para młoda, wedding planner | poz. 41 | Inna persona i inny słownik niż poz. 41 — to jedyne, co uzasadnia osobny URL. **Uwaga przepisana 15 września 2026:** rozgraniczenie „firmowe kontra ślubne" nie przebiega już między poz. 41 a 42, bo wariant firmowy wyszedł do poz. 25. Poz. 41 jest dziś stroną **doboru koperty do wkładki**, niezależną od okazji; poz. 42 bierze wyłącznie personę ślubną (para młoda, wedding planner) i jej słownik. Zero treści B2B i zero odwołań do kampanii eventowej — te należą do poz. 25 | [ ] |
| 43 | Personalizowane koperty ślubne — adresowanie drukiem | Supporting article | personalizowane koperty slubne | KONWERSJA | Para młoda, wedding planner | F2 | **Jedyna pozycja ślubna z realnym CTA** — personalizacja działa dziś na DL | [ ] |
| 44 | Koperty na pieniądze na ślub — format i kolor | Supporting article | koperty na pieniadze na slub | RUCH | Gość weselny, detal | `/koperty-na-pieniadze` | Wąska intencja okazjonalna; poz. 39 obsługuje ogólną | [ ] |

### Tydzień 12 — procesy B2B i przegląd

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 45 | Faktura VAT i odroczony termin przy zamówieniu kopert | Supporting article | koperty firmowe faktura vat | KONWERSJA | Instytucje, jednostki budżetowe | F1 | Rozbraja barierę rozliczeniową — realna przewaga oferty, nieopisana nigdzie indziej | [ ] |
| 46 | Dlaczego koperty z nadrukiem są od 10 sztuk — `/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk` | Supporting article | koperty z nadrukiem od 10 sztuk | GEO | Małe firmy, pierwszy zakup | F1 | **Wykonane 14 września 2026, wyprzedzająco z tygodnia 12.** Odpowiedź na realną obiekcję; F1 podaje próg jako parametr (tytuł, pasek faktów, wiersz specyfikacji, pytanie w `PRINT_FAQ_ITEMS`), wpis uzasadnia go pracą przygotowawczą i podaje wyjścia dla nakładu mniejszego niż minimum. Zero kwot — koszt krótkiej serii należy do poz. 9 | [x] |
| 47 | ~~Realizacja: 3 000 kopert DL dla kancelarii~~ | Supporting article | koperty dla kancelarii | AUTORYTET | Kancelarie | `/koperty-dla-kancelarii` | **Wstrzymane 15 sierpnia 2026 — brak realizacji do opisania.** Wpis startowy opisywał klienta, jego problem z poprzednim dostawcą i efekt wdrożenia; właściciel potwierdził, że przykład był wymyślony, więc został usunięty. Pozycja wraca do planu **dopiero wtedy, gdy powstanie realne zamówienie**, na które właściciel da zgodę i zdjęcia. Do tego czasu autorytet w klastrze kancelaryjnym buduje wyłącznie LP z poz. 17 | [—] |
| 48 | Przegląd kwartalny: audyt kanibalizacji i aktualizacja map | Aktualizacja | — | — | — | — | Przegląd `keywords.md` i `content-plan.md`, weryfikacja pozycji, kwalifikacja treści do przepisania lub scalenia | [ ] |

---

## Poza fazami · strony serwisowe

Trasy, które nie należą do żadnego klastra z `keywords.md` i nie celują we frazę produktową.
Powstają na polecenie właściciela albo dlatego, że bez nich serwis jest niepełny jako sklep —
nie liczą się do kadencji czterech pozycji tygodniowo i nie mają filara.

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | O nas — marka kopert ozdobnych dla firm — `/o-nas` | Strona serwisowa | `envelopes o nas` (brandowa, poza `keywords.md`) | AUTORYTET · GEO | Decydent poznający markę przed pierwszym zamówieniem | — (encja firmy) | **Zero fraz produktowych i zero parametrów oferty.** Bez kwot, wymiarów, terminów, progów i liczby odcieni — te należą do `/`, F1, F2 i F3. Bez danych rejestrowych i FAQ — te należą do `/kontakt` i do zestawów w `faq.ts`. Jedyna trasa, której tematem jest **marka**, a nie koperta | [x] |

---

## Dziennik wdrożeń

### 15 września 2026 — poz. 25: `/koperty-dla-agencji-eventowych` · siódma LP Fazy 2

**Trzecia LP branżowa pod filarem F1** — po kancelariach (poz. 17) i biurach rachunkowych
(poz. 21) — i otwarcie Tygodnia 7. Filar poświęca agencjom eventowym jedną kartę w sekcji
„Dla kogo"; ta strona celuje we frazę branżową `koperty na zaproszenia firmowe` i dokłada
sytuację, której filar nie opisuje: **wysyłka prowadzona wstecz od daty wydarzenia i listy
gości**.

**Warunek brzegowy z planu (C6/K4) spełniony bez wyjątków.** Zaproszenia ciągną rynek w stronę
formatów, których nie ma w sprzedaży, więc cała strona prowadzi do DL, a ograniczenie jest
powiedziane wprost w dwóch miejscach: w tabeli `#format` i w akapicie pod nią. Wszystkie pięć
CTA otwiera konfigurator z `format=DL`. Status w tabeli **nie jest wpisany ręcznie** — liczy go
`fitsInFormat()` z wymiarów katalogowych, osobno dla DL i dla K4, więc uruchomienie formatu
w `catalog.ts` przepisze tabelę zamiast ją unieważnić. Zaproszenie kwadratowe dostaje wtedy
komunikat „potrzebny format K4 155 × 155 mm, dziś ze statusem »Dostępne wkrótce«", a program A5
— „za szeroka o 38 mm, do wysyłki trzeba ją złożyć". Mikrokonwersji „zapis na powiadomienie
o dostępności formatów" **nie użyliśmy, bo w kodzie jej nie ma** (brief pkt 7 wymienia ją wśród
trzech dostępnych; w repozytorium nie istnieje ani formularz, ani lista). Zamiast obiecywać
mechanizm, którego nie ma, akapit odsyła do formularza kontaktowego i mówi wprost, że nie
proponujemy zamiennika na siłę.

**Rozgraniczenie wobec poz. 41 i 42, które czekają w planie.** Fraza `koperty na zaproszenia`
należy do poz. 41, `koperty na zaproszenia ślubne` do poz. 42 — żadnej z nich nie ma
w `keywords` tej strony. Granicę poprowadziliśmy po **pytaniu, na które treść odpowiada**, a nie
po temacie, bo po temacie wszystkie trzy pozycje są o zaproszeniach:
- **Poz. 25 (ta LP):** „jak poprowadzić wysyłkę zaproszeń na wydarzenie firmowe". Kupującym jest
  agencja albo dział marketingu, czyli podmiot robiący to cyklicznie. Stąd fale kampanii, lista
  gości jako jednostka nakładu, zapas na dopisanych w ostatnim tygodniu i rozróżnienie dwóch
  zakresów personalizacji (pełny adres przy wysyłce pocztą, samo nazwisko przy rejestracji).
- **Poz. 41:** „którą kopertę dobrać do tego konkretnego zaproszenia" — odwrotne mapowanie
  wkładka → format, bez agencji, bez kalendarza kampanii, bez listy gości.
- **Poz. 42:** persona ślubna i jej słownik.
Uwagi do poz. 41 i 42 zostały w tabeli planu przepisane, bo dotychczasowe rozgraniczenie
(„41 firmowe kontra 42 ślubne") przestało być prawdziwe w chwili publikacji tej LP.

**Rozgraniczenie wobec poz. 16** (`szybka-realizacja-kopert-terminy-i-ekspres`) — to było drugie
realne ryzyko kanibalizacji, bo wpis ma sekcję „Jak policzyć termin wstecz od daty wydarzenia".
Rozstrzygnięte przez rozdzielenie dwóch kalendarzy, które w tej branży istnieją naprawdę obok
siebie: tabela `#kalendarz` na LP liczy **odstęp od wysyłki do wydarzenia** (konwencja branżowa,
widełki, zero parametrów oferty), a wpis liczy **odstęp od zamówienia do nadania przesyłki**
(nasza produkcja, kurier, akceptacja wizualizacji). Obie strony mówią to o sobie wprost,
wzajemnym odnośnikiem.

**Jednostka nakładu — trzecia różna w trzech LP pod F1.** Poz. 17 nie ma tabeli kosztowej wcale,
poz. 21 liczy partię wielkością portfela klientów, tutaj liczy się **listą gości**: 30 osób
(kolacja branżowa, śniadanie prasowe), 120 (konferencja, premiera), 300 (gala jubileuszowa).
Do tego akapit o zapasie, którego żadna z sąsiednich stron nie ma — dodruk to osobne zamówienie
i osobny termin, więc zapas jest tańszy niż druga produkcja.

**Trzeci w serwisie odnośnik z `zakres=imiona` — świadome odejście od zapisu z 14 września.**
Przy poz. 22 zanotowaliśmy, że ten parametr „zostaje wyłączny dla poz. 18 i F2". Ta LP go używa,
bo warunek, który stał za tamtą decyzją, jest tutaj spełniony: CTA stoi pod akapitem, który mówi
dokładnie o zakresie imiennym (nazwisko gościa bez adresu, wręczanie przy rejestracji), a nie
obok wzmianki o personalizacji w ogóle. Reguła obowiązuje więc dalej w brzmieniu właściwym —
`zakres=imiona` wchodzi tam, gdzie sekcja jest o samym nazwisku; przy poz. 22 nie była, bo bon
kupuje osoba, która wpisuje cudze imię na dokumencie, a nie na kopercie. Pozostałe cztery CTA
tej strony otwierają konfigurator z formatem DL i nadrukiem.

**Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 21, 22 i 23. Pytanie „Czy nadruk jest dostępny
na formatach C6 i K4?" ma właściciela w `PRINT_FAQ_ITEMS` na F1, a „Czym różni się koperta DL
od C6?" w `DL_FAQ_ITEMS` na F3. `WebPage.mainEntity` wskazuje na węzeł `Product` filara.

**Pierwsza LP branżowa Fazy 2 z trzema realnymi kadrami, mimo braku kadru branżowego.** Zdjęcia
z logo agencji eventowej w repozytorium nie ma i nie podstawiamy pod branżę cudzego znaku — ta
sama reguła co przy poz. 18, 21 i 22. Okazało się jednak, że biblioteka ma trzy kadry
pokazujące dokładnie to, o czym mówi tekst: nadruk słowa „Zaproszenie" na czerni
(`czarna-koperta-dl-nadruk-zaproszenie`), zaproszenie instytucji kultury na granacie
(`granatowa-koperta-dl-nadruk-logo-orkiestry`) i adresowanie imienne krojem odręcznym
(`niebieska-koperta-dl-personalizacja-odreczna`). Podpis pod galerią mówi wprost, że nadruki są
projektami przykładowymi. Trzy odcienie z sekcji koloru stoją jako kadry katalogowe
z zaznaczonym polem nadruku. Karta OG wygenerowana `scripts/og-card.mjs` z kadru czarnej koperty
(`public/images/og/koperty-dla-agencji-eventowych.jpg`) — kadr niewykorzystany dotąd przez żadną
kartę OG, więc dwie strony nie dzielą jednego obrazu w podglądzie odnośnika.

Linkowanie w obie strony:
- **do LP (10 odnośników):** nowy rozdział „Dla kogo pracujemy" na `/`, karta „Agencje eventowe,
  PR i kreatywne" na F1, F2 i F3, karta „Agencje eventowe i PR" na `/koperty-premium`, trzy karty
  „Dla kogo" na stronach kolorów, które ta LP rekomenduje — „Agencje kreatywne i eventowe"
  (Czarny), „Instytucje kultury i orkiestry" (Granatowy), „Organizatorzy gal i eventów" (Złoty) —
  oraz dwa wpisy: `szybka-realizacja-kopert-terminy-i-ekspres` (akapit rozgraniczający dwa
  kalendarze) i `dlaczego-koperty-z-nadrukiem-od-10-sztuk` (akapit o wydarzeniach kameralnych).
  Stron kolorów Matcha i Jeansowy **nie linkujemy**, mimo że filar wymienia je przy tej branży:
  ta LP ich nie rekomenduje, a odnośnik do odcienia, którego strona nie proponuje, jest
  odnośnikiem bez pokrycia.
- **z LP:** `/koperty-z-nadrukiem#cena`, `/koperty-dl`, `/koperty-personalizowane`,
  `/koperty-premium`, `/#kolory`, `/kontakt`, `/kontakt#wycena`, `/koperty/czarny`,
  `/koperty/granatowy`, `/koperty/zloty` oraz cztery wpisy:
  `ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc`, `szybka-realizacja-kopert-terminy-i-ekspres`,
  `cena-kopert-z-nadrukiem-i-koszt-zamowienia`, `dlaczego-koperty-z-nadrukiem-od-10-sztuk`.

`PAGE_UPDATED` ustawione dla nowej trasy na 15 września i podbite dla siedmiu stron, które
dostały odnośnik (`/`, `/koperty-z-nadrukiem`, `/koperty-dl`, `/koperty-personalizowane`,
`/koperty-premium`, `/koperty/czarny`, `/koperty/granatowy`, `/koperty/zloty`); oba wpisy
blogowe dostały `updated: '2026-09-15'`. `llms.txt` i sitemapa (wpis + sześć obrazów)
zaktualizowane w tym samym wdrożeniu. **`keywords.md` zmieniony** — inaczej niż przy poz. 17,
18, 21, 22 i 23, bo tym razem fraza sąsiaduje z klastrem, który ma już przypisanego właściciela:
notatki K9 dostały punkt o wyjściu wariantu firmowego do K1, a pytanie generatywne „jakie koperty
na zaproszenia firmowe" w sekcji „Luki" jest odhaczone jako obsłużone.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **80/80 stron statycznie**
(było 79). Strona obecna w `sitemap.xml` z sześcioma obrazami — dokładnie tymi, które renderuje
HTML — i w `/llms.txt`. `title` 54 znaki z sufiksem marki, `description` 143 znaki, jeden `<h1>`
z frazą główną w mianowniku, pięć `<h2>` treściowych plus finalne CTA. Komplet dziesięciu
odnośników zwrotnych potwierdzony w zbudowanym HTML-u wszystkich dziesięciu stron. Budżet
parametrów (pkt 10.1 briefu) policzony w prozie poza tabelami: żadna sekcja nie przekracza
jednego wystąpienia ceny ani wymiaru. Serwer produkcyjny podniesiony lokalnie: trasa, karta OG,
`sitemap.xml` i `/llms.txt` zwracają 200.

**Czego nie sprawdziliśmy:** wyglądu w przeglądarce — ani nowej LP, ani strony głównej, na
desktopie i na 375 px. Weryfikację wizualną prowadzi sesja główna, tak jak przy poz. 21.
Nie sprawdziliśmy też, czy tabela `#format` i tabela nakładu mieszczą się bez przewijania
poziomego na wąskim ekranie — obie są trzykolumnowe, więc zachowają się jak tabele `.data`
w całym serwisie (własna szerokość 720 px, przewijanie wewnątrz `.table-wrap`).

**Bez commita i bez `npm run indexnow`** — część gitową i zgłoszenie prowadzi sesja główna.
Zgłoszenie ma sens dopiero po wdrożeniu: na 15 września produkcja nadal nie serwuje poz. 21
z 14 września (`envelopes.pl/koperty-dla-biur-rachunkowych` zwraca 404), więc zaległość
wdrożeniowa opisana przy poz. 18 i 21 trwa trzeci dzień. Po wdrożeniu jedno `npm run indexnow`
obejmie oknem siedmiu dni wszystkie trzy zaległe adresy naraz.

### 15 września 2026 — rozdział 09 „Dla kogo pracujemy" na stronie głównej

**Strona główna do dziś nie linkowała do żadnej LP branżowej.** Sześć stron branżowych zbierało
odnośniki wyłącznie z filarów, stron kolorów i wpisów, czyli z podstron słabszych od `/`.
Najmocniejsza strona w serwisie nie przekazywała im nic.

**Decyzja o formie: osobny rozdział, nie rozbudowa `#zastosowania` ani `chapter-note`.**
Trzy warianty ważone celem, nie objętością strony:
- **Rozbudowa `#zastosowania` odpada z powodu technicznego i treściowego naraz.** Każda z sześciu
  kart jest w całości `ConfigureLink` — wejściem do konfiguratora z preselekcją koloru i usługi.
  Wstawienie do karty drugiego odnośnika rozbija cel kliknięcia (zagnieżdżony link jest też
  nieprawidłowy w HTML). Treściowo spis odpowiada na pytanie „do czego", a rejestr branż na
  pytanie „kto to zamawia" — łączenie ich zatarłoby obie intencje.
- **`chapter-note` w istniejącym rozdziale** byłby najtańszy, ale siedem odnośników w jednym
  akapicie to ściana linków: żaden anchor nie zostaje zauważony, a użytkownik nie znajdzie w niej
  swojej branży wzrokiem.
- **Osobny rozdział wygrywa**, bo jako jedyny daje każdej branży własny wiersz z anchorem równym
  frazie głównej strony docelowej i zdaniem mówiącym, co ta strona rozstrzyga.

**Umiejscowienie: pod paletą kolorów, przed „Dla firm".** To rozstrzyga warunek z zadania —
konfigurator i paleta nie schodzą przez nowy rozdział ani o piksel, bo oba stoją wyżej.
Umiejscowienie ma też uzasadnienie czytelnicze: czytelnik, który właśnie obejrzał 19 odcieni,
ma naturalne pytanie „a który do mojej pracy", a rejestr branż odpowiada nazwą branży zamiast
kolejną tabelą papieru. Numeracja rozdziałów jest licznikiem CSS, więc dalsze rozdziały
przenumerowały się same; komentarze w `page.tsx` i nagłówki sekcji w `home.css` zostały
doprowadzone do zgodności ręcznie.

**Lista mieszka w `src/lib/industry-pages.ts`** — kolejna LP branżowa to dopisanie jednego wpisu
(`path`, `branch`, `anchor`, `text`), a nie kopiowanie znaczników. Poz. 25 weszła do rejestru
w tym samym wdrożeniu, więc rozdział startuje z siedmioma pozycjami. Kolejność jest tematyczna:
najpierw korespondencja dokumentowa (F1), potem wysyłka zaproszeń, na końcu koperty wręczane
do ręki razem z bonem (F4).

**Zero dublowania treści z `#zastosowania`:** opis każdej pozycji mówi, co dana strona
**rozstrzyga** (typologia pism, kalendarz roku obrotowego, fale kampanii, karta powitalna),
a nie do czego służy koperta. Zgodnie z pkt 10.1 briefu karty branżowe nie niosą żadnego
parametru oferty — ani ceny, ani gramatury, ani minimum nakładu. Zamykający `chapter-note`
kieruje branże spoza rejestru do dwóch stron ogólnych (F1 i F4), więc rozdział przekazuje sygnał
także w górę, a nie tylko w dół.

Forma: spis dwukolumnowy oddzielony kreskami (`.branch-index` w `home.css`), a nie siatka kart.
Siedem kart w ramkach wyglądałoby jak siedem produktów do porównania i dołożyłoby wysokości
rozdziałowi, który stoi między paletą a warunkami handlowymi. Poniżej 720 px spis schodzi
do jednej kolumny.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów. Kolejność sekcji na `/`
potwierdzona w zbudowanym HTML-u: `kolory` → `branze` → `dla-firm`, czyli konfigurator i paleta
bez zmiany pozycji. Siedem odnośników branżowych plus dwa do filarów obecne w HTML.
`PAGE_UPDATED['/']` podbite na 15 września. **Wyglądu rozdziału w przeglądarce nie
sprawdziliśmy** — ani dwóch kolumn na desktopie, ani zejścia do jednej kolumny na 375 px.

### 14 września 2026 — poz. 21: `/koperty-dla-biur-rachunkowych` · szósta LP Fazy 2

**Druga LP branżowa pod filarem F1** — po kancelariach (poz. 17) — i druga pozycja Tygodnia 6.
Filar poświęca biurom rachunkowym jedną kartę w sekcji „Dla kogo"; ta strona celuje we frazę
branżową `koperty dla biur rachunkowych` i dokłada sytuację, której filar nie opisuje:
**korespondencja wraca do tego samego portfela klientów w powtarzalnych oknach kalendarza**.
Fraza `koperty firmowe z logo` zostaje przy K1 zgodnie z uwagą planu — nie ma jej w `keywords`
tej strony.

**Rozgraniczenie wobec poz. 17** (`/koperty-dla-kancelarii` — ten sam filar, ten sam szablon
i ta sama materia: dokumenty na papierze A4). To było jedyne realne ryzyko kanibalizacji w tej
pozycji, więc rozstrzygnięte zostało na czterech osiach naraz:
- **Częstotliwość.** Kancelaria wysyła pod pojedynczą sprawę, do zmiennego kręgu adresatów.
  Biuro rachunkowe wysyła do **tego samego portfela**, kilka razy w roku. Stąd oś całej strony:
  rozpoznawalność nadawcy wracającego co kwartał, a nie powaga jednego pisma. Trzy karty sekcji
  „Po co koperta" są wprost o tym — usługa, której klient nie widzi; skrzynka pełna kopert
  z okienkiem od urzędu, ubezpieczyciela i banku; liczby, które zostają w środku.
- **Kalendarz** (wprost z uwag planu do poz. 21). Poz. 17 nie ma sezonowości wcale. Tutaj jest
  ona spinaczem strony: pięć okien roku obrotowego — PIT-11 w styczniu i lutym, sprawozdanie
  w marcu, rozliczenia roczne w kwietniu, uchwały o zatwierdzeniu w czerwcu, aneksy cenowe
  i korespondencja świąteczna w listopadzie i grudniu. Terminy zewnętrzne w drugiej kolumnie
  (informacja PIT-11 dla podatnika do końca lutego, sporządzenie sprawozdania za rok kalendarzowy
  do końca marca, zatwierdzenie do końca czerwca) zostały sprawdzone przed publikacją i stoją
  osobno od trzeciej kolumny, która wynika z naszego terminu realizacji. Dwóch rodzajów faktów
  nie mieszamy w jednej komórce.
- **Jednostka nakładu.** Poz. 17 nie ma tabeli kosztowej w ogóle (odsyła do F1), a poz. 22 liczy
  nakład w sztukach. Tutaj tabela liczy partię **wielkością portfela klientów** — 20, 50 i 120 —
  przy jawnym założeniu jednej koperty na klienta w jednym oknie. To jedyna jednostka, w której
  biuro rachunkowe planuje wysyłkę.
- **Kolor.** Poz. 17 jest właścicielem kierunku ciemnego (Granatowy, Czarny, Szarobrązowy).
  Tutaj wybór dzieje się **wewnątrz barw neutralnych**: Biały jako konwencja obiegu dokumentów
  przeciw Ecru jako wyjściu ze stosu białych kopert. Granica podana wprost na obu stronach —
  poz. 17 dostała akapit odsyłający tutaj, ta strona odsyła do poz. 17.

**Adresowania serii nie powtarzamy.** Sekcja „Adresowanie wielu klientów w jednym zamówieniu"
należy do poz. 17 od 7 września. Tutaj personalizacja występuje wyłącznie jako druga kolumna
tabeli kosztowej i jedno zdanie odsyłające do F2 — inaczej obie strony miałyby ten sam rozdział
pod dwoma adresami.

**Bez własnego `FAQPage`**, jak poz. 17, 18, 19, 22 i 23. `PRINT_FAQ_ITEMS` na F1 pokrywa już
pytania o cenę, minimum nakładu, pliki i terminy. `WebPage.mainEntity` wskazuje na węzeł
`Product` filara zamiast tworzyć drugi.

**Trzecia LP branżowa bez własnego kadru aranżacyjnego** — po poz. 18 i 22, z tego samego powodu:
trójkę kadrów branżowych zamknęła poz. 17, a zdjęcia z logo biura rachunkowego w repozytorium
nie ma. Zamiast podstawiać cudzy kadr strona pokazuje `PLAIN_ENVELOPE_SHOT` **dokładnie tam,
gdzie jest o nim mowa** — przy akapicie o budowie koperty i jednolitej przedniej ściance.
Dwa rekomendowane odcienie stoją jako kadry katalogowe **z zaznaczonym polem nadruku**
(`EnvelopePlaceholder` z `hasPrint`), czyli zdjęcia z `public/images/prints/`, które pokazują
miejsce na logo i nie obiecują cudzego znaku. Karta OG wygenerowana z kadru Białego przez
`scripts/og-card.mjs` (`public/images/og/koperty-dla-biur-rachunkowych.jpg`) — inny kadr niż
karta poz. 22, żeby dwie LP nie dzieliły jednego obrazu w podglądzie odnośnika.

Linkowanie w obie strony:
- **do LP:** karta „Biura rachunkowe i doradztwo finansowe" na F1, karta „Biura rachunkowe
  i doradztwo podatkowe" na F3, karta „Zarządy spółek i relacje inwestorskie" na
  `/koperty-premium`, akapit granicy branżowej w sekcji koloru na `/koperty-dla-kancelarii`,
  akapit o powierzchni nadruku we wpisie `koperty-bez-okienka-kiedy-je-wybrac` (wymienia tę
  branżę z nazwy) oraz dwie strony kolorów, które ta LP rekomenduje: Biały i Ecru. Reguła
  z 10 września utrzymana — karta „Biura rachunkowe i audytorskie" na `/koperty/bialy` nazywa
  branżę wprost, a karta „Biura, które nie chcą bieli" na `/koperty/ecru` nazywa ją przez
  sytuację („ten sam obieg dokumentów"); przy `/koperty-premium` decyzja jest osądem, nie
  dopasowaniem nazwy: karta mówi o raportach rocznych dla zarządów, czyli o przesyłce, którą
  wysyła właśnie biuro obsługujące spółkę. Stron kolorów Granatowy, Szara i Niebieski **nie
  linkujemy** — ich karty mówią o doradcach finansowych, biznesowych i instytucjach
  finansowych, a nie o biurach rachunkowych, i ta LP tych odcieni nie rekomenduje.
- **z LP:** `/koperty-z-nadrukiem#cena` (rozbicie ceny nadruku), `/koperty-dl` (tabela
  dopasowań wkładek), `/koperty-personalizowane` (arkusz z listą odbiorców),
  `/koperty-dla-kancelarii` (granica branżowa w sekcji koloru), `/koperty/bialy`,
  `/koperty/ecru` oraz pięć wpisów: `ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc`,
  `koperty-bez-okienka-kiedy-je-wybrac`, `szybka-realizacja-kopert-terminy-i-ekspres`,
  `cena-kopert-z-nadrukiem-i-koszt-zamowienia`, `dlaczego-koperty-z-nadrukiem-od-10-sztuk`.

`PAGE_UPDATED` podbite dla `/koperty-dla-biur-rachunkowych` i sześciu stron, które dostały
odnośnik (`/koperty-z-nadrukiem`, `/koperty-dl`, `/koperty-premium`, `/koperty-dla-kancelarii`,
`/koperty/bialy`, `/koperty/ecru`); wpis blogowy dostał `updated: '2026-09-14'`. `llms.txt`
i sitemapa (wpis + trzy obrazy) zaktualizowane w tym samym wdrożeniu. **`keywords.md` bez
zmian** — fraza `koperty dla biur rachunkowych` nie występowała dotąd w `keywords` żadnej
strony ani w mapie fraz, więc nie ma czego przenosić; nie ma jej też w sekcji „Luki", a wpisanie
jej tam od razu ze statusem „obsłużona" byłoby szumem. Ta sama sytuacja co przy poz. 17, 18,
22 i 23.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **79/79 stron statycznie**, strona
obecna w `sitemap.xml` (z trzema obrazami) i w `/llms.txt`. `title` 56 znaków (z sufiksem marki),
`description` 153 znaki, jeden `<h1>` z frazą główną w mianowniku, pięć `<h2>` treściowych.
Komplet siedmiu odnośników zwrotnych potwierdzony w zbudowanym HTML-u wszystkich siedmiu stron;
wszystkie pięć CTA otwiera konfigurator z `format=DL&kolor=bialy&nadruk=1`. Serwer produkcyjny
podniesiony lokalnie: trasa, karta OG, oba kadry katalogowe, `sitemap.xml` i `/llms.txt` zwracają
200.

**Sprawdzone w przeglądarce** (sesja główna, bo sesja agenta przeglądarki nie miała): desktop
1024 px i 375 px, zero błędów w konsoli, brak przewijania poziomego na wąskim ekranie
(`scrollWidth` równy `innerWidth`). Obie tabele trzykolumnowe mają szerokość własną 720 px
i przewijają się poziomo **wewnątrz** `.table-wrap` — to zachowanie tabel `.data` w całym
serwisie, nie regresja tej strony. Kadr koperty gładkiej i oba kadry katalogowe (`prints/`
Biały i Ecru) ładują się realnie, alty opisowe i różne dla każdego kadru. `title` 56 znaków,
`description` 153 znaki, jeden `<h1>`, sześć `<h2>` (pięć treściowych plus finalne CTA).

**Wypchnięte do `master` 14 września 2026, commit `17bc550`** (razem z potwierdzeniem wdrożenia
poz. 22). **Produkcja tego commita jeszcze nie serwuje** — 17 minut po pushu `envelopes.pl`
oddaje 404 na tej trasie, a `sitemap.xml` na produkcji nadal nie zawiera adresu; strona główna
idzie z poprzedniego builda. To **druga** odsłona zaległości wdrożeniowej opisanej 14 września
przy poz. 18 (produkcja stała wtedy na buildzie z 7 września), więc wniosek z tamtego dnia
zostaje w mocy i dostaje wzmocnienie: **push do `master` nie jest dowodem wdrożenia i nie da się
go wymusić z repozytorium** — w projekcie nie ma ani deploy hooka, ani CLI Vercela.

**Do wykonania po wdrożeniu:** sprawdzenie adresu na `envelopes.pl` (200, `canonical` na domenę
produkcyjną, komplet odnośników zwrotnych) i `npm run indexnow` — zgłoszenie obejmie wtedy także
`/koperty-dla-klinik` i pozostałe adresy z okna 7 dni.

### 14 września 2026 — poz. 22: `/koperty-dla-klinik` · piąta LP Fazy 2

**Zamyka klaster voucherowy w Fazie 2** — czwarta LP branżowa pod filarem F4 (po SPA,
restauracjach i hotelach) i pierwsza pozycja Tygodnia 6. Filar poświęca klinikom pół akapitu
w karcie „Salony SPA i kliniki medycyny estetycznej"; ta strona celuje we frazę branżową
`koperty na vouchery dla kliniki` i dokłada sytuację zakupową, której filar nie opisuje:
**kupujący nie zna procedury**. Bon kupuje partner albo rodzina osoby, która przyjdzie na
zabieg, wybierając kwotę lub pakiet — pierwszą wizytą i tak jest konsultacja, więc koperta jest
jedyną częścią prezentu oglądaną w chwili zakupu.

**Rozgraniczenie wobec poz. 19** (SPA — ten sam filar, ten sam szablon i **ten sam punkt 5 bazy
wiedzy**, który łączy kliniki z salonami). To było jedyne realne ryzyko kanibalizacji w tej
pozycji, więc rozstrzygnięte zostało na trzech osiach naraz:
- **Kolor.** Poz. 19 zestawia kierunek naturalny (Szarobrązowy, realny kadr) z jasnym. Tutaj
  cały wybór dzieje się **wewnątrz barw jasnych** i dzieli je na dwie rodziny: chłodna biel
  i pastelowy błękit pod stomatologię (Biały, Błękitna) przeciw perle pod medycynę estetyczną
  (Biała Perłowa, Srebrna Perłowa). Wspólne z poz. 19 zostają dwa odcienie z czterech, ale oś
  argumentu jest inna — nie „jasne kontra ziemiste", tylko „chłód gabinetu kontra papier
  oglądany z bliska".
- **Cykl zakupowy** (wprost z uwag planu). Osobna sekcja „Klinika zamawia koperty w dwóch
  rytmach": bon sezonowy zamawiany partią pod jedną akcję i **koperta gabinetowa** — plan
  leczenia z kosztorysem, zalecenia pozabiegowe, karta pacjenta stałego, zaproszenie na dzień
  otwarty — zużywana równo przez cały rok. Salon i restauracja mają tylko pierwszy z tych
  rytmów. To ta sama konstrukcja co „drugi obieg kopert" na poz. 18, ale treść jest inna:
  tam koperta wraca do gościa, tutaj nie opuszcza recepcji.
- **Kalendarz.** Zamiast trzeciej okazji prezentowej wchodzi **sezon ślubny i wakacyjny**
  (maj–sierpień, zamówienie w kwietniu): zabiegi wykonuje się w serii rozłożonej na tygodnie,
  więc bon pod konkretny termin kupuje się z wyprzedzeniem. Dzień Kobiet zostaje przy poz. 19,
  tu jego miejsce zajmuje Dzień Matki.

**Bez własnego `FAQPage`**, jak poz. 19, 23 i 18. `VOUCHER_FAQ_ITEMS` na F4 pokrywa już pytania
o nadruk, o imię obdarowanego i o kilka kolorów w jednym zamówieniu. `WebPage.mainEntity`
wskazuje na węzeł `Product` filara zamiast tworzyć drugi.

**Druga LP branżowa bez własnego kadru aranżacyjnego** — po poz. 18 i z tego samego powodu:
trójkę kadrów branżowych zamknęła poz. 17, a zdjęcia z logo kliniki w repozytorium nie ma.
Zamiast podstawiać cudzy kadr strona pokazuje `PLAIN_ENVELOPE_SHOT` (Biała Perłowa, przód
i klapka) **dokładnie tam, gdzie jest o nim mowa** — przy zdaniu o jednolitej przedniej ściance
bez okienka, czyli w sekcji o dyskrecji dokumentu gabinetowego. Cztery rekomendowane odcienie
stoją jako kadry katalogowe. Karta OG wygenerowana z tego samego kadru przez `scripts/og-card.mjs`
(`public/images/og/koperty-dla-klinik.jpg`).

**Bez CTA z `zakres=imiona`.** Personalizację imienną na bonie strona wymienia i odsyła po nią
do F2, ale nie otwiera konfiguratora z tym parametrem — ten odnośnik zostaje wyłączny dla poz. 18
i F2, zgodnie z zapisem z 14 września. Pozostałe CTA otwierają konfigurator z formatem DL
i nadrukiem.

Linkowanie w obie strony:
- **do LP:** karty kliniczne w sekcjach „Dla kogo" na F4, F1, F2 i `/koperty-premium` (na F4
  i `/koperty-premium` jako **drugi** odnośnik w karcie, obok istniejącego do poz. 19 — karta
  mówi o obu branżach naraz) oraz na czterech stronach kolorów, które ta LP rekomenduje: Biały,
  Błękitna, Biała Perłowa, Srebrna Perłowa. Reguła z 10 września utrzymana — link z karty
  kolorowej idzie tylko tam, gdzie karta „Dla kogo" mówi o klinikach **i** strona docelowa ten
  odcień poleca (Ecru poleca kliniki, ale ta LP go nie rekomenduje — linku nie dokładamy).
- **z LP:** `/koperty-na-vouchery` (pełna tabela konfiguracji bonu, pozostałe branże),
  `/koperty-z-nadrukiem#cena` (rozbicie ceny nadruku), `/koperty-personalizowane` (imię
  obdarowanego), `/koperty-dla-salonow-spa` (rozgraniczenie branżowe podane wprost w sekcji
  koloru), `/koperty/bialy`, `/koperty/jasnoniebieska`, `/koperty/biala-perlowa`,
  `/koperty/srebrna-perlowa`.

`PAGE_UPDATED` podbite dla `/koperty-dla-klinik` i ośmiu stron, które dostały odnośnik. `llms.txt`
i sitemapa (wpis + obrazy: kadr koperty gładkiej i cztery kadry katalogowe) zaktualizowane w tym
samym wdrożeniu. `keywords.md` bez zmian — fraza `koperty na vouchery dla kliniki` nie występowała
dotąd w `keywords` żadnej strony, a pokrewne `koperty firmowe dla kliniki` stoi w bazie w sekcji
„Luki" jako zapytanie branżowe (ta sama sytuacja co przy poz. 23 i 18).

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **78/78 stron statycznie**, strona
obecna w `sitemap.xml` (z pięcioma obrazami) i w `/llms.txt`. `title` 54 znaki (z sufiksem marki),
`description` 149 znaków, jeden `<h1>` z frazą główną w mianowniku. Sprawdzone w przeglądarce
(desktop i 375 px): hero, trzy karty „po co koperta", sekcja dwóch rytmów z kadrem, dwie rodziny
kolorów, tabela kosztu i kalendarz renderują się poprawnie, zero błędów konsoli, kadr zwraca 200,
brak przewijania poziomego na 375 px, a komplet ośmiu odnośników zwrotnych jest obecny w HTML-u.

**Wdrożone na produkcję 14 września 2026** (commit `940456d`, jeden commit razem z poz. 46
i audytem linkowania w dół). Sprawdzone na `envelopes.pl` zgodnie z wnioskiem z tego samego dnia
— push do `master` nie jest dowodem wdrożenia: strona zwraca 200, `canonical` wskazuje domenę
produkcyjną, `title` i `<h1>` zgodne z lokalnym buildem, karta OG dostępna, wpis obecny
w `/llms.txt` i w `sitemap.xml`, a komplet ośmiu odnośników zwrotnych obecny w HTML-u wszystkich
ośmiu stron. Wpis z poz. 46 również zwraca 200 — zaległość wdrożeniowa z 14 września zamknięta.

**Do wykonania:** `npm run indexnow`.

### 14 września 2026 — audyt linkowania w dół: `/koperty-premium` i `/koperty-na-pieniadze`

**Naruszenie zasady z legendy tego dokumentu, wykryte w audycie.** Zasada mówi: „filar linkuje
w dół do 3–6 treści wspierających". Dwa filary miały **zero** takich odnośników.
`/koperty-premium` (poz. 37, K6) i `/koperty-na-pieniadze` (poz. 39, K8) linkowały wyłącznie
w bok — do stron kolorów, LP branżowych i pozostałych filarów — oraz do `/`. Żaden wpis blogowy
nie ma też któregokolwiek z nich w polu `pillar`, więc oba klastry nie miały warstwy wspierającej
w **żadnym** kierunku.

**Przyczyna: wpisy dedykowane tym klastrom nie istnieją.** Poz. 38 (gramatura papieru → K6),
poz. 40 (personalizowana koperta na pieniądze) i poz. 44 (koperty na pieniądze na ślub) mają
status `[ ]`. Filary czekały na własne wpisy zamiast linkować do treści, które **już** odpowiadają
na pytania zadawane na ich stronach.

**Decyzja: linkujemy do wpisów istniejących, bez czekania na poz. 38/40/44.** Wpis wspierający
nadal linkuje w górę do **jednego** filara (pole `pillar` nietknięte), ale filar może linkować
w dół do treści, która w górę linkuje gdzie indziej. Precedens stoi na F4 od 7 września:
`filesPost` (`jak-przygotowac-pliki-do-druku-na-kopertach`, `pillar` = F1). Kryterium doboru:
wpis odpowiada na pytanie, które **ta strona** stawia i zostawia bez odpowiedzi.

`/koperty-premium` — cztery wpisy:
- `koperty-bez-okienka-kiedy-je-wybrac` — wiersz „Przednia ścianka" w tabeli porównawczej mówi
  tylko, że okienka nie ma; pierwsza sekcja wpisu („Koperty bez okienka to standard
  w korespondencji premium") jest wprost o tej stronie. Odnośnik kontekstowy pod tabelą;
- `paleta-19-kolorow-jak-wybrac-odcien` — sekcja palety pokazuje 8 z 19 odcieni i nie mówi,
  jak wybierać. Odnośnik pod siatką kolorów;
- `jak-przygotowac-pliki-do-druku-na-kopertach` — sekcja o kontraście na papierach szlachetnych
  urywa się przed plikiem. Hak wzięty wprost z wpisu i tutejszy: JPG niesie tło, więc na
  Granatowym czy Ecru wychodzi biały prostokąt wokół logo. Specyfikacja zostaje na F1
  (rozgraniczenie 2 w nagłówku pliku) — odsyłamy, nie powtarzamy;
- `szybka-realizacja-kopert-terminy-i-ekspres` — korespondencja premium ma zwykle twardą datę
  (gala, jubileusz). Tylko w siatce „Poradników", bez odnośnika kontekstowego.

`/koperty-na-pieniadze` — cztery wpisy:
- `paleta-19-kolorow-jak-wybrac-odcien` — sekcja koloru podaje trzy odcienie i nie tłumaczy
  różnicy między perłą a barwieniem w masie;
- `dlaczego-koperty-z-nadrukiem-od-10-sztuk` (poz. 46, opublikowana tego samego dnia) —
  najostrzejsze tarcie tej strony: filar sprzedaje kopertę **od 1 sztuki**, a obie usługi
  dodatkowe zaczynają się od 10. `MONEY_FAQ_ITEMS` próg stwierdza („bo tyle wynosi minimalny
  nakład"), ale nie tłumaczy, skąd się bierze. Odnośnik w karcie „Nadruk okolicznościowy";
- `koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste` — karta personalizacji mówi o nagrodach
  i kopertach dla całej rodziny; przygotowanie samej listy imion należy do wpisu;
- `szybka-realizacja-kopert-terminy-i-ekspres` — sekcja kosztowa ostrzega „prosimy liczyć czas
  z zapasem", a wpis pokazuje, jak policzyć datę wysyłki wstecz od dnia uroczystości.

**Świadomie pominięte na K8:** `jak-wreczyc-bon-podarunkowy-zeby-wygladal-jak-prezent`
i `koperta-ozdobna-na-voucher-jaki-format-i-kolor`. Oba opisują wydanie bonu przez firmę usługową,
czyli intencję K7 — wciągnięcie ich rozmyłoby granicę między prezentem pieniężnym a voucherem,
którą ten filar trzyma od publikacji (ostrzeżenie przy `USE_CASE_SHOTS`).

Wzorzec sekcji „Poradniki" wzięty z F2 i F3 (karta `card card-lg` bez kadru, siatka od drugiego
wpisu), nie z F4 (`BlogCoverImage`) — dzięki temu do sitemapy nie wchodzą obrazy, których te
strony wcześniej nie zgłaszały. Oba filary dostały siatkę 2 × 2.

Odnośniki w dół z treści (`<main>`): `/koperty-premium` 0 → 4 wpisy (7 odnośników łącznie),
`/koperty-na-pieniadze` 0 → 4 wpisy (8 odnośników). `PAGE_UPDATED` podbite dla obu tras
(`/koperty-na-pieniadze` 2026-09-07 → 2026-09-14).

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **77/77 stron statycznie**.
Sprawdzone w przeglądarce (1000 px i 375 px): odnośniki kontekstowe stoją w sekcjach
`#porownanie`, `#kolory`, `#nadruk` i `#cena-i-terminy`, siatki „Poradników" renderują się bez
pustych kolumn, brak przewijania poziomego na 375 px, zero błędów konsoli.
**Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

**Pozostaje otwarte.** To jest łata, nie domknięcie klastrów. K6 i K8 nadal nie mają **ani jednego**
wpisu linkującego w górę do nich — poz. 38, 40 i 44 zostają w kolejce i dopiero one dadzą tym
filarom własną warstwę wspierającą. Po ich publikacji listy `GUIDES` na obu stronach trzeba
przejrzeć ponownie i wypchnąć z nich wpisy najsłabiej związane z tematem.

### 14 września 2026 — poz. 46: `/blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk`

**Wyprzedzenie kolejki planu** — pozycja z tygodnia 12 (procesy B2B). Powód: to jedyna treść
w klastrze K1, która odpowiada na obiekcję **przed** pierwszym zakupem, a domena potrzebuje
3–6 miesięcy na dojrzenie w indeksie. Fraza `koperty z nadrukiem od 10 sztuk` stoi w `keywords.md`
na liście luk (grupa procesowa) i nie miała dotąd właściciela.

**Oś wpisu to uzasadnienie progu, nie sam próg.** Filar F1 podaje minimum w czterech miejscach
jako parametr oferty (tytuł, pasek faktów, wiersz specyfikacji, pytanie w `PRINT_FAQ_ITEMS`).
Wpis odpowiada na to, czego filar nie tłumaczy: **dlaczego akurat tyle**. Odpowiedź jest jedna
i pada w leadzie — cztery czynności przed drukiem (weryfikacja pliku, wizualizacja do akceptacji,
przygotowanie druku, kontrola pierwszych kopert) wyglądają tak samo przy pięciu i przy pięciuset
kopertach, a ich kosztu nie fakturujemy osobno. Minimalny nakład jest warunkiem, na którym taka
konstrukcja ceny się broni — to spina wpis z tabelą „czego nie doliczamy" z poz. 9, zamiast ją
powtarzać.

**Druga rzecz, której nie ma nigdzie indziej: wyjścia dla nakładu poniżej progu.** Tabela czterech
sytuacji (jedna koperta do jednego odbiorcy, kilka na jedno wydarzenie, kilka miesięcznie stale,
seria próbna) z rozwiązaniem i z ostrzeżeniem w każdym wierszu. Do tego rozstrzygnięcie, którego
nie było w treści, a jest w konfiguratorze: **próg dotyczy pojedynczej pozycji**, więc dwa kolory
z tym samym logo to dwa minima, a nadruk razem z personalizacją — jedno, bo idą w jednym przebiegu.

Rozgraniczenia:
- **wobec F1 `/koperty-z-nadrukiem`:** żaden H2 nie powtarza nagłówka filara. Wpis nie ma sekcji
  „Dla kogo", cennika ani tabeli nakładów; fraza filara pada wyłącznie jako anchor w bloku
  „Strona oferty".
- **wobec poz. 9 (koszt zamówienia):** zero kwot w całym wpisie. Koszt krótkiej serii razem
  z rozłożoną dostawą zostaje tam, gdzie był; tutaj pada jedno zdanie o stałej stawce jednostkowej,
  bez liczby, jako odpowiedź na pytanie „czy mała seria jest droższa za sztukę".
- **wobec poz. 16 (terminy):** termin pada raz, bez liczby dni — wpis mówi tylko tyle, że nakład
  go nie zmienia, i odsyła po resztę.
- **wobec poz. 7 (pliki do druku):** zero wymagań plikowych. Sprawdzenie pliku występuje jako etap
  pracy, nie jako specyfikacja.
- **`FAQPage` zostaje na filarze** — wpis nie dostaje własnych danych, mimo że dwa nagłówki mają
  formę pytań (zasada z poz. 7, 8 i 9).

**Kalibracja tonu.** W prozie żadna sekcja nie ma więcej niż dwa parametry oferty; próg pada
w nagłówkach, w tabelach i w liście kontrolnej, czyli tam, gdzie modele go ekstrahują. Wszystkie
wystąpienia liczą się z `DEFAULT_PRICING.moqWithPrint` i `moqWithoutPrint` — zmiana progu przepisze
tytuł, cztery nagłówki, obie tabele i listę kontrolną razem z konfiguratorem. Slug zostaje stały,
bo adres nie może się zmieniać; zapisano to w komentarzu przy wpisie.

Linkowanie w obie strony:
- **do wpisu:** F1 ×2 — akapit pod tabelą specyfikacji (przy wierszu „Minimalna ilość") i czwarta
  karta w sekcji „Poradniki"; F2 `/koperty-personalizowane` — akapit pod cennikiem, bo przy
  adresowaniu obowiązuje ten sam próg; poz. 9 — zdanie w sekcji „Jak policzyć koszt własnego
  nakładu" (`updated: 2026-09-14`); `/` i `/blog` — siatki wpisów, automatycznie; `/llms.txt` —
  mapa dla modeli.
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `koperty z nadrukiem`), poz. 9
  (kotwica `#czego-nie-doliczamy`), poz. 16, F2 i paleta kolorów na `/`.
- Sekcja „Poradniki" na F1 przełącza się przy czterech kartach na `grid grid-2` — trzy kolumny
  zostawiałyby w drugim rzędzie dwa puste miejsca. Warunek liczy teraz podzielność przez trzy,
  a nie próg „więcej niż dwa".

**Karta OG z kadru przyciętego u źródła.** `public/images/og/blog-nadruk-od-10-sztuk.jpg`
(1200 × 630, 36 kB) powstała z kadru `biala-perlowa-koperta-dl-nadruk-logo-auto-detailing`
obciętego do górnych 540 px, więc **przykładowa nazwa firmy z nadruku nie wchodzi w kadr** — ta
sama zasada, co przy karcie poz. 9. Zdjęcie nagłówkowe wpisu pokazuje pełny kadr z nadrukiem;
kadr był dotąd nieużywany w treści blogowej i pokazuje dokładnie tego czytelnika, do którego wpis
mówi: mała firma usługowa, jedno logo, krótka seria.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, wpis prerenderowany statycznie
(`● /blog/dlaczego-koperty-z-nadrukiem-od-10-sztuk`), obecny w `sitemap.xml` z dwoma obrazami,
w `/blog`, na `/` i w `/llms.txt`. `title` 55 znaków z sufiksem marki, `description` 151, jeden
`<h1>`, sześć `<h2>`, dwie tabele, dwie listy, spis treści na sześć pozycji, JSON-LD `Article` +
`BreadcrumbList` + `WebPage` (**bez `FAQPage`**), CTA prowadzi do `/?format=DL&nadruk=1#konfigurator`.
W przeglądarce sprawdzone też oba filary i wpis poz. 9 — odnośniki obecne w HTML-u, zero błędów
konsoli, na szerokości 375 px tabele przechodzą w karty bez przewijania w poziomie.
`PAGE_UPDATED` podbite dla `/koperty-z-nadrukiem`, `/koperty-personalizowane` i `/blog`.
**Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 14 września 2026 — poz. 18: `/koperty-dla-hoteli` · czwarta LP Fazy 2

**Zamyka tydzień 5 planu** i czwartą LP branżową Fazy 2. Filar F4 poświęca hotelom jeden akapit
w sekcji „Dla kogo" (voucher pobytowy i bon na kolację sylwestrową, sprzedawane na miejscu
i wysyłkowo). Ta strona celuje we frazę branżową `koperty firmowe dla hotelu` i dokłada obieg,
którego filar nie ma wcale: **kartę powitalną z nazwiskiem gościa** — personalizację imienną
w zakresie `imiona`, bez kolumn adresowych, z listy eksportowanej z systemu rezerwacji. Filar
mówi wyłącznie o bonie kupowanym w prezencie; hotel zamawia obok niego drugą partię kopert,
która nigdy nie trafia na pocztę.

**Rozgraniczenie wobec poz. 19 i 23** (SPA, restauracje — ten sam filar i szablon). Tamte
odpowiadają na pytanie „jaki kolor pod bon i kiedy zamówić przed sezonem prezentowym". Ta
zaczyna od typologii sytuacji w obiekcie (pokój, recepcja, sala bankietowa, biuro sprzedaży —
6 kart), ma **trzy** kierunki kolorystyczne zamiast dwóch i kalendarz, w którym obok szczytów
prezentowych stoi **start sezonu wysokiego** — zdarzenie, którego salon i restauracja nie mają.
Tabela kosztu została na osi wspólnej z F4, ale z nakładami w skali obiektu (10 / 50 / 150)
i z trzecią kolumną opisującą kartę powitalną, nie bon z imieniem obdarowanego.

**Rozgraniczenie wobec F2 `/koperty-personalizowane`.** Mechanizm arkusza (kolumny, walidacja,
formaty pliku) zostaje na filarze personalizacji — tutaj wchodzi wyłącznie to, co z niego
w hotelu wynika. Sekcja linkuje do F2 zamiast powtarzać specyfikację.

**Bez własnego `FAQPage`**, jak poz. 19 i 23. Pytania hotelarza pokrywają już dwa zestawy:
`VOUCHER_FAQ_ITEMS` na F4 i `PERSONALIZATION_FAQ_ITEMS` na F2, gdzie odpowiedź na „Czy mogę
zamówić koperty z samym imieniem, bez adresu?" wprost wymienia hotele. `WebPage.mainEntity`
wskazuje na węzeł `Product` filara.

**Pierwsza LP branżowa bez własnego kadru aranżacyjnego.** Trójkę kadrów branżowych (kancelaria,
SPA, restauracja) zamknęła poz. 17, a zdjęcia z logo hotelu w repozytorium nie ma. Zamiast
podstawiać cudzy kadr strona pokazuje realny kadr personalizacji odręcznej
(`niebieska-koperta-dl-personalizacja-odreczna`) **dokładnie tam, gdzie jest o niej mowa** —
przy karcie powitalnej — a pięć rekomendowanych odcieni jako kadry katalogowe. Karta OG
wygenerowana z tego samego kadru przez `scripts/og-card.mjs`
(`public/images/og/koperty-dla-hoteli.jpg`).

**Ciągłość intencji.** CTA sekcji „Karta powitalna" wchodzi do konfiguratora z nadrukiem,
personalizacją i `zakres=imiona` — jedyny taki odnośnik w serwisie poza F2. Pozostałe CTA
otwierają konfigurator z formatem DL i nadrukiem.

Linkowanie w obie strony:
- **do LP:** karty hotelowe w sekcjach „Dla kogo" na F4, F1, F2 i `/koperty-premium` oraz na
  czterech stronach kolorów, które ta LP rekomenduje — Ecru, Złoty, Butelkowa Zieleń, Jeansowy.
  Reguła z 10 września utrzymana: link z karty kolorowej idzie tylko tam, gdzie strona docelowa
  ten odcień poleca (Biała Perłowa jest na LP polecana, ale jej karta „Dla kogo" nie mówi
  o hotelach — linku nie dokładamy).
- **z LP:** `/koperty-na-vouchery` (pełna tabela konfiguracji bonu, pozostałe branże),
  `/koperty-z-nadrukiem#cena` (rozbicie ceny nadruku), `/koperty-personalizowane` (arkusz),
  `/koperty/ecru`, `/koperty/biala-perlowa`, `/koperty/zloty`, `/koperty/ciemnozielony`,
  `/koperty/blekit-lupkowy`.

`PAGE_UPDATED` podbite dla `/koperty-dla-hoteli` i ośmiu stron, które dostały odnośnik. `llms.txt`
i sitemapa (wpis + obrazy: kadr personalizacji i pięć kadrów katalogowych) zaktualizowane w tym
samym wdrożeniu. `keywords.md` bez zmian — fraza `koperty firmowe dla hotelu` nie występowała
dotąd w `keywords` żadnej strony, a w bazie stoi w sekcji „Luki" jako zapytanie branżowe.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **76/76 stron statycznie**, strona
obecna w `sitemap.xml` i w `/llms.txt`. `title` 56 znaków (z sufiksem marki), `description`
151 znaków, jeden `<h1>` z frazą główną w mianowniku. Sprawdzone w przeglądarce (desktop i 375 px):
hero, 6 kart zastosowań, sekcja karty powitalnej z kadrem, trzy kierunki kolorów, tabela kosztu
i kalendarz renderują się poprawnie, zero błędów konsoli, odnośniki zwrotne obecne w HTML-u na
wszystkich ośmiu stronach.

**Wdrożone na produkcję 14 września 2026** (commit `b4f91e7`). Sprawdzone na `envelopes.pl`:
strona zwraca 200, `canonical` wskazuje domenę produkcyjną, karta OG jest dostępna, komplet
ośmiu odnośników zwrotnych i wpis w `/llms.txt` obecne w HTML-u.

**Zaległość wdrożeniowa wykryta przy tej publikacji.** Do momentu tego deployu produkcja
serwowała build z 7 września — poz. 20 (commit `9df4d80` z 10 września) **nie była na produkcji**,
mimo statusu `[x]` w planie. Wniosek na przyszłość: po odhaczeniu pozycji sprawdzamy adres na
`envelopes.pl`, a nie tylko lokalny build; sam push do `master` nie jest dowodem wdrożenia.

**IndexNow — wykonane.** `npm run indexnow` zgłosił 19 adresów z okna 7 dni (poz. 18, poz. 20,
cztery filary i dziewięć stron, które dostały odnośniki): **HTTP 200 — przyjęte**. Plik klucza
dostępny pod `https://envelopes.pl/ec2f0cba42b2f14bd410a15d19813a6d.txt`.

### 10 września 2026 — poz. 20: `/blog/koperta-ozdobna-na-voucher-jaki-format-i-kolor` · linki do LP branżowych · `sameAs`

**IndexNow dla publikacji z 5–7 września — wykonane.** `npm run indexnow -- --days 14` zgłosił
9 adresów (`/`, F1, F4, `/koperty-premium`, poz. 19, 23, 17, 39 i wpis z poz. 24): HTTP 200.
Szersze okno, bo domyślne 7 dni od 13 września gubiłoby stronę SPA.

**Poz. 20.** Wpis doradczy pod F4, fraza `koperta ozdobna na voucher`. Oś: format rozstrzyga się
sam (DL), więc wpis zajmuje się kolorem — trzy kryteria wyboru (marka, kolor nadruku, sposób
wręczenia), tabela branż (8 wierszy), tabela okazji (5 wierszy), porównanie trzech papierów
z połyskiem i checklista. Rozgraniczenia: wymiarów bonu nie powtarza (odsyła do `#wymiar-bonu`
na F4); wobec poz. 19 i 23 zestawia wiele branż naraz i linkuje do nich zamiast powtarzać
kosztorys i kalendarz; dopasowania odcieni wzięte z sekcji „Dla kogo" stron kolorów, żeby wpis
nie polecał koloru, którego jego własna strona nie wiąże z daną branżą. W prozie trzy liczby,
każda raz i czytana z kodu: liczba odcieni, minimum z nadrukiem, termin standardowy. `title`
60 znaków z sufiksem, `description` 153. Kadr `zlota-koperta-dl-nadruk-logo-studia-tatuazu`
(dotąd nieużywany na blogu), karta OG `public/images/og/blog-koperta-ozdobna-na-voucher.jpg`.

Linkowanie w obie strony:
- **do wpisu:** F4 — trzecia karta w „Poradnikach" (siatka przechodzi na `grid-3`) i odnośnik pod
  siatką kolorów; poz. 24 — nowy akapit w sekcji o przygotowaniu koperty; poz. 12 — zdanie
  w sekcji o odcieniach jasnych;
- **z wpisu:** F4 (`pillar` i `#wymiar-bonu`), poz. 19 i 23, poz. 10, poz. 16, trzy strony
  kolorów z połyskiem, F2.

**Linki przychodzące do LP branżowych i K8.** Karty „Dla kogo" na stronach kolorów dostały
opcjonalne pole `link` (`ColorPageAudienceLink` w `color-pages.ts`), renderowane pod tekstem
karty. Reguła: link tylko tam, gdzie karta mówi o tej samej branży **i** odcień jest na stronie
docelowej rekomendowany albo pokazany na zdjęciu. Czarny, Granatowy, Szarobrązowy →
`/koperty-dla-kancelarii`; Szarobrązowy → `/koperty-dla-salonow-spa`; Czerwony →
`/koperty-dla-restauracji`; Złoty i Biała Perłowa → `/koperty-na-pieniadze`. Świadomie pominięte:
Złoty → restauracje (LP restauracyjna Złotego nie poleca) i karty klinik → SPA (kliniki dostaną
własną LP w poz. 22). Poza stronami kolorów: poz. 13 → kancelarie, poz. 24 → SPA i restauracje.

Linki przychodzące z treści (`<main>`, 47 adresów z sitemapy, po zmianie): restauracje 1 → 4,
kancelarie 2 → 6, SPA 2 → 5, koperty na pieniądze 2 → 4.

**`sameAs`.** Nowa stała `SOCIAL_PROFILES` w `orders.ts` zasila stopkę i `Organization.sameAs`
— jedno źródło dla obu miejsc. LinkedIn i Instagram odpowiadają HTTP 200; Facebooka w stopce nie
ma, więc nie ma go też w `sameAs`.

Daty: `PAGE_UPDATED` — sześć stron kolorów, `/koperty-na-vouchery` i `/blog` (dotąd nieaktualne
26 sierpnia) na 2026-09-10; `updated: 2026-09-10` we wpisach poz. 12, 13 i 24.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, sitemapa 47 adresów z nowymi
datami, wpis w `/blog` i w `llms.txt`. W przeglądarce: jeden `<h1>`, sześć `<h2>`, trzy tabele,
JSON-LD `Article` + `BreadcrumbList` + `WebPage`, `sameAs` w węźle `OnlineStore`, zero błędów
konsoli. **Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 7 września 2026 — poz. 24: `/blog/jak-wreczyc-bon-podarunkowy-zeby-wygladal-jak-prezent`

**Pierwszy wpis blogowy tej sesji roboczej — dotąd wyłącznie strony statyczne.** Różnica
w mechanice: blog niesie własną datę i `dateModified` w treści (`post.date` / `post.updated`),
więc **nie wchodzi do `page-updated.ts`** — ten rejestr obsługuje wyłącznie trasy statyczne
(komentarz w samym pliku).

**Rozgraniczenie wobec sąsiadów w klastrze K7.** Poz. 19 i 23 (LP branżowe) oraz przyszła poz. 20
odpowiadają na pytanie „jaką kopertę i jaki kolor wybrać". Ten wpis odpowiada na inne pytanie —
„jak fizycznie wręczyć bon, żeby nie zepsuć wrażenia" — więc nie powiela ich treści, tylko dodaje
brakującą warstwę: moment sprzedaży, nie parametry produktu.

**Fraza główna z korekty z 14 sierpnia 2026 pozostaje aktualna** (`jak wręczyć bon podarunkowy` —
`koperta do vouchera` była liczbą pojedynczą frazy filara i wyszła z tej pozycji już wcześniej).

**Tytuł skrócony w trakcie pisania.** Wersja z planu, z sufiksem `| Envelopes`, dawała 71 znaków —
więcej niż jakikolwiek inny tytuł w bazie (maks. 66 do tej pory). Przeformułowany tak, żeby fraza
docelowa stała na początku: „Jak wręczyć bon podarunkowy, żeby wyglądał jak prezent" (66 znaków
z sufiksem). Znaczenie bez zmian, `lead`/`description` przycięty do ok. 155 znaków tym samym
tokiem.

Kadr nagłówkowy: `biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego` — dotąd nieużywany
w treści blogowej, sceneria kontuaru pasująca tematycznie do wpisu o wręczaniu. Karta OG
wygenerowana `scripts/og-card.mjs` (`public/images/og/blog-jak-wreczyc-bon-podarunkowy.jpg`).

Linkowanie w obie strony:
- **do wpisu:** `/koperty-na-vouchery` — nowa pozycja w sekcji „Poradniki" (siatka przełączona
  na `grid-2` przy dwóch kartach, ten sam wybór co na F1 przy dwóch/trzech wpisach).
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `koperty na vouchery`) oraz link
  kontekstowy do `/koperty-personalizowane` w sekcji o wysyłce zdalnej.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, wpis prerenderowany statycznie,
obecny w `/blog` i w `sitemap.xml` (przez `getAllPosts()`, automatycznie). `title` 66 znaków
z sufiksem, `description` 155 znaków, jeden `<h1>`, tabela czterech błędów, lista sześciu
punktów checklisty, osiem bloków JSON-LD (2 własne + 6 globalnych). Sprawdzone w przeglądarce:
spis treści, tabela, checklist, blok „Strona oferty", CTA, link do `/koperty-na-vouchery`
obecny w HTML-u filara, zero błędów konsoli. **Do wykonania po wdrożeniu na produkcję:**
`npm run indexnow`.

### 7 września 2026 — poz. 39: `/koperty-na-pieniadze` · pillar K8, wyprzedzająco z Fazy 4

**Wyprzedzenie kolejki planu, drugi raz w tej sesji roboczej.** K8 ma duży wolumen i szczyt
sezonowy w grudniu — ta sama zasada dojrzewania indeksu, która przesunęła poz. 19 i 23 przed
poz. 17. Prerekwizyt zapisany przy tej pozycji („dopiero po wdrożeniu K1, K2, K7") jest spełniony:
`/koperty-z-nadrukiem`, `/koperty-personalizowane` i `/koperty-na-vouchery` już istnieją.

**Pierwszy pillar tej sesji z własnym węzłem `Product` i własnym `FAQPage`.** Poz. 17/19/23
pożyczały węzeł produktu filara, bo były „Supporting LP" pod istniejącym pillarem. Ta pozycja ma
format „Pillar (LP)" wprost pod Hub `/`, własną frazę główną i intencję detaliczną odrębną od
reszty serwisu — dostała więc `moneyEnvelopeProductJsonLd()` (nowa funkcja w `seo.ts`, ten sam
wzorzec co `voucherEnvelopeProductJsonLd()` i `premiumEnvelopeProductJsonLd()`) i `MONEY_FAQ_ITEMS`
(nowy zestaw w `faq.ts`, sześć pytań).

**Jedyny pillar z dominującym klientem detalicznym.** MOQ 1 sztuka dla koperty gładkiej jest
głównym argumentem strony (pasek faktów, hero, FAQ), nie szczegółem w tabeli — pozostałe pillary
sprzedają od 10 sztuk z nadrukiem.

**Termin realizacji nad CTA — wymóg z notatek K8 w `keywords.md`, nie stylistyka.** Zdanie
„2 dni robocze, ale nie wysyłka tego samego dnia" stoi w leadzie hero, w pasku faktów i w sekcji
kosztowej — zawsze przed przyciskiem. Klient detaliczny szuka koperty „na już"; brak tego
zastrzeżenia z góry generowałby odbicia i reklamacje.

**Rozgraniczenie wobec F3.** `DL_FAQ_ITEMS` ma już pytanie „Czy w kopercie DL zmieści się
banknot?" z wymiarami trzech nominałów — `MONEY_FAQ_ITEMS` go nie powtarza, tylko odsyła do F3
i dokłada pytanie o dwa banknoty naraz, którego F3 nie miał.

**Jedyny realny kadr to kadr ślubny „W dniu Ślubu" na Białej Perłowej** (`USE_CASE_SHOTS`,
`biala-perlowa-koperta-dl-nadruk-w-dniu-slubu`) — ten sam, który już renderuje strona główna
w karcie „Koperty na pieniądze i nagrody". Treść trzyma się wyłącznie pieniędzy, zgodnie
z ostrzeżeniem w `showcase.ts` (kadr pokazuje kopertę na prezent pieniężny, nie na zaproszenie
ślubne — to wymagałoby formatu K4 ze statusem „Dostępne wkrótce"). Złoty i Srebrna Perłowa pokazane
jako próbki katalogowe, nie zdjęcia.

Karta OG wygenerowana przez `scripts/og-card.mjs` z tego samego kadru
(`public/images/og/koperty-na-pieniadze.jpg`) — bez kwoty w overlayu poza ceną bazową (stała,
niezależna od kolorów).

Linkowanie w obie strony:
- **do pillara:** sekcja „Do czego używa się kopert ozdobnych" na `/` (akapit `chapter-note` obok
  odnośników do F4 i do `/koperty-premium`). Karta „Koperty na pieniądze i nagrody" w siatce
  `USE_CASES` na `/` **nie** dostała odnośnika — cała karta jest już linkiem do konfiguratora
  (`ConfigureLink`), a zagnieżdżenie drugiego odnośnika `<a>` w środku byłoby nieprawidłowym HTML-em.
- **z pillara:** `/koperty-z-nadrukiem` (nadruk okolicznościowy), `/koperty-personalizowane`
  (personalizacja imienia), `/koperty-dl` (wymiary i dopasowanie wkładek), `/koperty/biala-perlowa`,
  `/koperty/zloty`, `/koperty/srebrna-perlowa`, `/#kolory` (pełna paleta).

`PAGE_UPDATED` podbite dla `/koperty-na-pieniadze` i `/` (nowy odnośnik). `llms.txt` i sitemapa
(wpis priorytet 0.9 jak pozostałe pillary + obrazy: kadr ślubny i dwa zdjęcia katalogowe odcieni
odświętnych) zaktualizowane w tym samym wdrożeniu.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, strona obecna w `sitemap.xml`
i w `/llms.txt`. `title` 55 znaków (z sufiksem marki), `description` 142 znaki, jeden `<h1>`,
dziesięć bloków JSON-LD renderuje się serwerowo (4 własne + 6 globalnych z `layout.tsx`).
Sprawdzone w przeglądarce: hero z terminem realizacji widocznym przed CTA, sześć kart okazji,
sekcja kolorów (kadr ślubny + dwie próbki), tabela cena/termin, akordeon FAQ, zero błędów konsoli,
odnośnik z `/` obecny w HTML-u. **Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 7 września 2026 — poz. 17: `/koperty-dla-kancelarii` · trzecia LP Fazy 2

**Zamyka trójkę LP z realnym kadrem aranżacyjnym** wskazaną przy publikacji poz. 19: kancelarie,
salony SPA (7.09), restauracje (8.09) — w tej kolejności odwróconej względem numeracji planu,
bo dwie pierwsze miały twardy termin sezonowy, a kancelarie nie. Filar F1 i `/koperty-premium`
poświęcają kancelariom po jednej karcie; ta strona dokłada typologię pism (akt notarialny,
wezwanie do zapłaty, pismo procesowe, opinia prawna, umowa) i scenariusz, którego LP voucherowe
nie miały — adresowanie **wielu różnych odbiorców** w jednym zamówieniu, nie jednego imienia na
serii identycznych bonów. Sekcja linkuje do `/koperty-personalizowane` po mechanizm arkusza
zamiast powtarzać wymagane kolumny.

**Nie powtarza cennika F1**, zgodnie z uwagą przy tej pozycji w planie — sekcja „Cena i terminy"
podaje jedną cenę z hero i linkuje do `#cena` na filarze zamiast rozpisywać składniki drugi raz.

**Bez własnego `FAQPage`** — `PRINT_FAQ_ITEMS` na F1 pokrywa już pytania o cenę, MOQ i pliki.
`WebPage.mainEntity` wskazuje na węzeł `Product` filara.

Karta OG wygenerowana przez `scripts/og-card.mjs` z kadru Granatowego
(`public/images/og/koperty-dla-kancelarii.jpg`) — tego samego, którego już używają F1
i `/koperty-premium`.

Linkowanie w obie strony:
- **do LP:** karta „Kancelarie prawne i notarialne" na F1 i na `/koperty-premium` (obie sekcje
  „Dla kogo").
- **z LP:** `/koperty-z-nadrukiem#cena` (cennik), `/koperty-personalizowane` (mechanizm arkusza
  adresowego), `/koperty/granatowy`, `/koperty/czarny`, `/koperty/taupe`.

`PAGE_UPDATED` podbite dla `/koperty-dla-kancelarii`, `/koperty-z-nadrukiem` i `/koperty-premium`
(nowe odnośniki). `llms.txt` i sitemapa (wpis + obrazy: kadr Granatowy i dwa zdjęcia katalogowe
odcieni stonowanych) zaktualizowane w tym samym wdrożeniu.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, strona obecna w `sitemap.xml`
i w `/llms.txt`. `title` 58 znaków (z sufiksem marki), `description` 137 znaków, jeden `<h1>`.
Sprawdzone w przeglądarce: hero, typologia pism (5 kart), sekcja kolorów (kadr Granatowy + dwie
próbki), sekcja adresowania, zero błędów konsoli, oba odnośniki zwrotne (F1, premium) obecne
w HTML-u. **Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 6 września 2026 — poz. 23: `/koperty-dla-restauracji` · druga LP Fazy 2

**Opublikowane zaraz po poz. 19, z tego samego powodu.** F4 wspomina restauracje jednym zdaniem
w sekcji „Dla kogo" („Koperta w Ciemnozielonym albo Czarnym sprawia, że bon nie wygląda jak
rachunek"). Ta LP zawęża się do fine diningu, winiarni i kawiarni i dokłada dobór koloru między
kierunkiem stonowanym (rekomendacja F4) a mocnym — Czerwony, jedyny realny kadr aranżacyjny dla
tej branży (`czerwona-koperta-dl-nadruk-logo-restauracji`) — argument dyskrecji przy
niespodziance i kalendarz dwóch szczytów sprzedażowych (Walentynki, sezon świąteczny).

**Bez konfliktu frazowego.** W przeciwieństwie do poz. 19 fraza `koperty na vouchery do
restauracji` nie występowała dotąd w `keywords` żadnej strony — `keywords.md` nie wymagał zmian.

**Bez własnego `FAQPage`**, z tego samego powodu co poz. 19: `VOUCHER_FAQ_ITEMS` na F4 pokrywa już
pytania o nadruk, personalizację i wielokolorowe zamówienia. `WebPage.mainEntity` wskazuje na
węzeł `Product` filara zamiast tworzyć drugi.

Karta OG wygenerowana przez `scripts/og-card.mjs` z kadru Czerwonego
(`public/images/og/koperty-dla-restauracji.jpg`).

Linkowanie w obie strony:
- **do LP:** karta „Restauracje fine dining, winiarnie i kawiarnie" na F4 (sekcja „Dla kogo").
- **z LP:** `/koperty-na-vouchery` (koszt, pełna tabela branż), `/koperty-z-nadrukiem` (rozbicie
  ceny nadruku), `/koperty/czerwony`, `/koperty/ciemnozielony`, `/koperty/czarny`.

`PAGE_UPDATED` podbite dla `/koperty-dla-restauracji` i `/koperty-na-vouchery` (nowy odnośnik).
`llms.txt` i sitemapa (wpis + obrazy: kadr Czerwony i dwa zdjęcia katalogowe odcieni stonowanych)
zaktualizowane w tym samym wdrożeniu.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **71/71 stron statycznie**, strona
obecna w `sitemap.xml` i w `/llms.txt`. `title` 46 znaków (z sufiksem marki), `description`
147 znaków, jeden `<h1>`. Sprawdzone w przeglądarce: hero, sekcja kolorów (kadr Czerwony + dwie
próbki), tabela kosztu i kalendarz sezonowy renderują się poprawnie, zero błędów konsoli, oba
odnośniki z F4 obecne w HTML-u. **Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 5 września 2026 — poz. 19: `/koperty-dla-salonow-spa` · pierwsza LP Fazy 2

**Opublikowane poza kolejnością planu.** Faza 2 zaczynała się od poz. 17 (kancelarie) i poz. 18
(hotele), ale poz. 19 miała w uwagach jedyny twardy termin całego planu — „publikować przed
IV kw." — i K7 w `keywords.md` ostrzega, że domena startująca od zera potrzebuje 3–6 miesięcy
dojrzewania w indeksie. Publikacja we wrześniu zamiast w kolejce oznaczała różnicę między
złapaniem sezonu Walentynek/Dnia Kobiet a stratą go.

**Właściciel frazy `koperty na bony podarunkowe`.** Fraza siedziała w `keywords` filara
`/koperty-na-vouchery` jako wariant nazewniczy (K7). Usunięta stamtąd i przeniesiona tutaj;
filar zostaje przy `koperty na vouchery`, `koperty do voucherów`, `koperta do vouchera`
i `koperta na bon podarunkowy`.

**Rozgraniczenie wobec F4.** Filar mówi do dziesięciu branż naraz i podaje jeden fakt
o kolorze. Ta strona zawęża się do SPA i dokłada to, czego filar nie ma: dobór odcienia między
kierunkiem klinicznym (Biała Perłowa, Ecru, Biały — z pkt 5 bazy wiedzy) a naturalnym (Taupe),
argument dyskrecji przy zabiegach medycyny estetycznej i kalendarz trzech szczytów sprzedażowych
(Walentynki, Dzień Kobiet, święta) z terminem zamówienia liczonym wstecz. Wymiar bonu i pełna
tabela branż zostają na F4 — stąd tylko odnośnik.

**Bez własnego `FAQPage`.** Pytania, które mogłaby zadać ta strona — czy voucher musi mieć
nadruk, czy da się dopisać imię, czy można zamówić kilka kolorów naraz — pokrywa już
`VOUCHER_FAQ_ITEMS` na F4. Drugi adres z tym samym zestawem pytań konkurowałby o ten sam wynik
rozszerzony, więc `WebPage.mainEntity` wskazuje na węzeł `Product` filara zamiast tworzyć drugi.

**Jedyny realny kadr aranżacyjny dla SPA to Taupe** (`taupe-koperta-dl-nadruk-logo-salonu-spa`).
Sekcja kolorów pokazuje ten kadr wprost i obok niego trzy próbki katalogowe (nie zdjęcia
aranżacyjne, których nie ma) dla kierunku jasnego — `EnvelopePlaceholder`, nie podszywanie się
pod fotografię.

Karta OG wygenerowana przez `scripts/og-card.mjs` z tego samego kadru
(`public/images/og/koperty-dla-salonow-spa.jpg`), zgodnie z regułą „bez kwot na karcie" —
parametry stałe (gramatura, brak okienka), żadnej ceny.

Linkowanie w obie strony:
- **do LP:** karta „Salony SPA i kliniki medycyny estetycznej" na F4 (sekcja „Dla kogo") i karta
  „Kliniki medycyny estetycznej i SPA" na `/koperty-premium` (sekcja „Dla kogo").
- **z LP:** `/koperty-na-vouchery` (koszt, pełna tabela branż), `/koperty-z-nadrukiem` (rozbicie
  ceny nadruku), `/koperty/taupe`, `/koperty/biala-perlowa`, `/koperty/ecru`, `/koperty/bialy`.

`PAGE_UPDATED` podbite dla `/koperty-dla-salonow-spa`, `/koperty-na-vouchery` i `/koperty-premium`
(nowe odnośniki). `llms.txt` i sitemapa (wpis + obrazy: kadr Taupe i trzy zdjęcia katalogowe
jasnych odcieni) zaktualizowane w tym samym wdrożeniu.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **70/70 stron statycznie**,
strona obecna w `sitemap.xml` i w `/llms.txt`. `title` 53 znaki (z sufiksem marki), `description`
153 znaki, jeden `<h1>`, sześć bloków JSON-LD renderują się serwerowo (`WebPage` + `BreadcrumbList`
własne, cztery globalne z `layout.tsx`). Sprawdzone w przeglądarce: hero, sekcja kolorów (kadr
Taupe + trzy próbki), tabela kosztu i kalendarz sezonowy renderują się poprawnie, zero błędów
konsoli, zdjęcia zwracają 200. **Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 26 sierpnia 2026 — poz. 16: `/blog/szybka-realizacja-kopert-terminy-i-ekspres`

**Druga treść wspierająca filar K1 i właściciel frazy `szybka realizacja kopert`**
(keywords.md, K1). Filar `/koperty-z-nadrukiem` zostaje przy frazie usługowej, poz. 9 —
przy cenowej.

**1. Rozgraniczenie: ile trwa kontra od kiedy liczymy.** Liczbę dni realizacji podaje dziś
pięć miejsc w serwisie (tabela `#terminy` na filarze, pasek ekspresu na `/`, `FAQ_ITEMS`,
`PRINT_FAQ_ITEMS`, `/llms.txt`) — powtórzenie jej byłoby kanibalizacją własnego filara.
Wpis bierze więc to, czego nie opisuje nikt: bieg terminu rusza od **późniejszego** z dwóch
zdarzeń (zaksięgowanie wpłaty, akceptacja wizualizacji), wizualizacja powstaje niezależnie
od statusu płatności, więc oba warunki mogą zamknąć się tego samego dnia, czas przewoźnika
(1–2 dni robocze) dolicza się **poza** terminem realizacji, a data z potwierdzenia jest
szacunkiem liczonym od dnia złożenia zamówienia. Wszystkie te reguły są cytowane
z `legal.ts` (§ 8–11) i z README, nie z pamięci.

**2. Siedem sekcji, pięć tabel.** Dwa warunki startu terminu (kto je spełnia); tabela
terminów z trzecią kolumną „od kiedy liczymy" zamiast kolumny z dopłatą, żeby nie
odtwarzać tabeli filara; równoległość wpłaty i wizualizacji; **dopłata ekspresowa
w przeliczeniu na jeden zyskany dzień roboczy** (10 / 100 / 500 szt. — kwoty liczone
z `DEFAULT_PRICING.express`, nie wpisane); czego ekspres nie przyspiesza (księgowanie,
akceptacja, korekty, kurier, koperty gładkie); liczenie wstecz od daty wydarzenia
z przykładem na dniach tygodnia — bez dat kalendarzowych, żeby przykład nie zdezaktualizował
się z rokiem; tabela sześciu pytań. Bez własnego `FAQPage` — dane strukturalne pytań
zostają na filarze (zasada z poz. 7).

**3. Czego w tekście nie ma.** Ceny nadruku i personalizacji (filar, poz. 9), MOQ jako
temat (poz. 46), wymagania dla pliku (poz. 7 — wpis tylko do niej linkuje). Dopłata
ekspresowa zostaje, bo jest osią pozycji, ale wyłącznie w jednej tabeli i w wierszu tabeli
terminów. Odroczony termin 14 dni pada dwa razy i za każdym razem z zawężeniem do
instytucji publicznych i urzędów — persona wpisu (agencja eventowa) go nie dostanie.

**4. Linkowanie w obie strony.** Wpis linkuje w górę do filara (anchor `koperty
z nadrukiem`), w bok do poz. 7 i do regulaminu (`/regulamin#realizacja`). Linki
przychodzące: sekcja „Poradniki" na filarze urosła z dwóch kart do trzech, pod akapitem
o terminach stanął odnośnik kontekstowy anchorem `szybka realizacja kopert`, a poz. 9
dostała akapit o tym, że ekspresem kupuje się wyłącznie czas — z odesłaniem do tego wpisu.
Poz. 9 ma `updated: '2026-08-26'`.

**5. Zasoby i indeksacja.** Kadr nagłówkowy: `granatowa-koperta-dl-nadruk-logo-orkiestry`
(zaproszenia na koncert — wysyłka ze sztywną datą w kalendarzu), nieużywany przez żaden
inny wpis. Karta OG `public/images/og/blog-szybka-realizacja.jpg` wygenerowana
`scripts/og-card.mjs` (1200 × 630, bez kwot). `PAGE_UPDATED` podbite dla `/`, `/blog`,
`/koperty-z-nadrukiem` i poz. 9; nowy adres dopisany do rejestru. Sitemapa urosła do
41 adresów. `npx tsc --noEmit` bez błędów, `npm run build` kończy się kodem 0
i prerenderuje wpis jako SSG. **Do wykonania po wdrożeniu na produkcję:**
`npm run indexnow`.

### 25 sierpnia 2026 — poz. 15: `/blog/koperty-z-imieniem-i-nazwiskiem-jak-przygotowac-liste`

**Trzecia treść wspierająca filar K2 i właściciel frazy `koperty z imieniem i nazwiskiem`**
(keywords.md, K2, P1). Filar `/koperty-personalizowane` zostaje przy frazach
`personalizowane koperty` i `adresowanie kopert`.

**1. Rozgraniczenie w klastrze — trzy pytania, trzy adresy.** Filar podaje specyfikację
arkusza (kolumny, pola wymagane, walidacja), poz. 8 rozstrzyga wybór trybu, a ten wpis
zaczyna się dopiero po tym wyborze: co zrobić z danymi **między eksportem a wgraniem pliku**.
Punktem zaczepienia jest zdanie, które już stało na filarze — tekst odtwarzamy dokładnie
w postaci, w jakiej został przekazany, bez poprawiania odmiany, wielkich liter i skrótów.
Skoro nie poprawiamy niczego, o wyglądzie serii decyduje arkusz, a nie produkcja; z tego
wynika cała treść wpisu. Świadomie nieobecne: tabela „skąd pochodzi lista → tryb", druga
zakładka skoroszytu, przemianowany nagłówek i wiersze ukryte filtrem (poz. 8), wzór
rozmieszczenia adresu na kopercie (poz. 14), limit wierszy i cennik (filar, poz. 9).

**2. Dziewięć sekcji, cztery tabele.** Scalanie kolumny „Imię i nazwisko" i wklejanie
wartości zamiast formuły; wersaliki, kodowanie polskich znaków w CSV i odstępy na końcu
komórek; **przypadek gramatyczny zależnie od tego, czym jest nadruk** (mianownik przy samym
nazwisku, dopełniacz przy dedykacji, wołacz przy zwrocie grzecznościowym); tytuły naukowe
i nazwiska dwuczłonowe; duplikaty i wiersze testowe; minimalizacja danych osobowych
(administratorem pozostaje klient, Envelopes jest podmiotem przetwarzającym — Załącznik nr 2
do regulaminu, 12 miesięcy przechowywania, wszystko czytane z `legal.ts`). Zamknięcie:
ośmiopunktowa lista kontrolna i tabela pięciu pytań. Nagłówki kolumn szablonu nie są wpisane
ręcznie — powstają z `PERSONALIZATION_NAME_COLUMNS`, więc przemianowanie kolumny w katalogu
przepisuje treść poradnika.

**3. Nowe pole `personalizationScope` w CTA wpisu.** `BlogCta` dostało zakres personalizacji,
a `src/app/blog/[slug]/page.tsx` przekazuje go do `ConfigureLink` i `StickyCta`. Wpis
o liście imiennej wchodzi do konfiguratora na wariancie „samo imię i nazwisko"
(`/?format=DL&personalizacja=1&zakres=imiona#konfigurator`), zamiast otwierać wariant
adresowy i kazać czytelnikowi cofnąć wybór. Pole jest opcjonalne — pozostałe wpisy działają
bez zmian.

**4. Linkowanie w obie strony.** Wpis linkuje w górę do filara (anchor `personalizowane
koperty`), w bok do poz. 8 i poz. 14 oraz do `#lista-danych` na filarze, a w warstwie prawnej
do regulaminu i polityki prywatności. Linki przychodzące: sekcja „Poradniki" na filarze
urosła z jednej karty do trzech (doszły poz. 14 i 15 — poz. 14 nie została tam dopisana przy
swojej publikacji), doszedł odnośnik kontekstowy pod tabelą kolumn arkusza, a poz. 8 i poz. 14
dostały po akapicie odsyłającym do przygotowania listy. Obie zaktualizowane treści mają
`updated: '2026-08-25'`.

**5. Jedna fraza, jeden właściciel.** Frazy `koperty z imieniem i nazwiskiem` i `koperty
imienne` stały dotąd w `keywords` filara. Przeszły do wpisu — filar zostaje przy
`personalizowane koperty` i `adresowanie kopert`, a w treści używa fraz imiennych dalej,
razem z przyciskiem wchodzącym do konfiguratora na wariancie imiennym. Zmiana dotyczy
wyłącznie rejestru fraz; `keywords` nie są czynnikiem rankingowym, ale w tym projekcie
pełnią funkcję mapy własności i rozjazd z `keywords.md` byłby mylący przy kolejnym audycie.

**6. Zasoby i indeksacja.** Kadr nagłówkowy: `czarna-koperta-dl-personalizacja-imienna`
(trzy czarne koperty DL, każda z innym nazwiskiem) — kadr nieużywany przez poz. 8 i 14.
Karta OG `public/images/og/blog-koperty-imienne.jpg` wygenerowana `scripts/og-card.mjs`
(1200 × 630, bez kwot). `PAGE_UPDATED` podbite dla `/`, `/blog`, `/koperty-personalizowane`
i poz. 14; nowy adres dopisany do rejestru. Sitemapa urosła do 40 adresów. `npx tsc --noEmit`
bez błędów, `npm run build` kończy się kodem 0 i prerenderuje wpis jako SSG.
**Do wykonania po wdrożeniu na produkcję:** `npm run indexnow`.

### 19 sierpnia 2026 — audyt kompletu 19 stron kolorów

**Przegląd całego klastra K5 po domknięciu palety (poz. 36g–36k).** Kontrola objęła
komplet dziewiętnastu wpisów w `src/lib/color-pages.ts`, a nie tylko pięć nowych, bo
domknięcie palety zmienia warunki brzegowe dla stron opublikowanych wcześniej —
zwłaszcza dla rodzin, w których dopiero teraz stanął pełny komplet odcieni.

**Co przeszło bez zastrzeżeń.** Wszystkie 19 wpisów ma komplet pól kontraktu
`ColorPageContent` — żadna strona nie jest cienka: każda ma cztery pytania FAQ i pięć
grup odbiorców. Nie ma zdublowanych `phrase`, nie ma zdublowanych pytań FAQ (reguła
antykanibalizacyjna trzyma: pytanie cenowe zostaje wyłącznie przy `zloty`), a każda
strona wymienia swoją nazwę katalogową, więc most nazewniczy działa w obie strony —
łącznie z odcieniami, których nazwa handlowa rozjeżdża się z frazą wyszukiwania
(`blekit-lupkowy` → Jeansowy, `jasnoniebieska` → Błękitna, `taupe` → Szarobrązowy).
Pliki OG istnieją dla wszystkich 19 slugów, kadry katalogowe stoją w trzech
szerokościach z `COLOR_IMAGE_WIDTHS`, a wszystkie `shotFiles` mają pokrycie
w `showcase.ts`. Barwienie w masie nigdzie nie stoi przy papierze z połyskiem —
`zloty`, `srebrna-perlowa` i `biala-perlowa` są w tej kwestii czyste.

**1. Wykryta sprzeczność między filarem K6 a stronami perłowymi.** FAQ na
`/koperty-premium` twierdziło, że na papierze złotym metalicznym **oraz jasnym
perłowym** drukujemy wyłącznie kolorem ciemnym. Po publikacji poz. 36k to zdanie stało
się nieprawdziwe i — co gorsza — kasowało jedyny argument własny Białej Perłowej:
to jedyne podłoże z połyskiem, które przyjmuje nadruk wielobarwny. Odpowiedź rozdziela
teraz trzy papiery zamiast wrzucać je do jednego worka: ciemny nadruk zostaje przy
Złotym i Srebrnej Perłowej, a Biała Perłowa dostaje wprost zapisany wyjątek. Filar
i strona koloru mówią wreszcie to samo, a różnicowanie idzie w stronę, w której klaster
ma sprzedawać.

**2. Jedyne powtórzenie tekstu w klastrze — usunięte.** Zdanie o pigmencie sięgającym
przez całą grubość arkusza stało dosłownie tak samo na `granatowy` i na `szara`.
Przy dziewiętnastu stronach opisujących ten sam parametr papieru to była jedna kolizja
na cały klaster, ale akurat w bloku FAQ, czyli w treści zgłaszanej jako `FAQPage` —
tam powielenie kosztuje najwięcej. Odpowiedź na `szara` została przeredagowana.

**3. Fałszywy trop, który warto zapisać: długości metaopisów.** Pierwszy pomiar na
zbudowanym HTML pokazał dziesięć opisów ponad kontraktowe 155 znaków, w tym cztery
powyżej 160. Pomiar liczył jednak bajty UTF-8, a nie znaki — przy polskich znakach
diakrytycznych zawyża długość o kilka do kilkunastu procent. Zmierzone na źródle
wszystkie 19 opisów mieszczą się w przedziale 143–155 znaków, a tytuły łącznie z marką
nie przekraczają 60. **Metadanych nie trzeba ruszać** — i nie należy ich skracać na
podstawie pomiaru bajtowego przy kolejnych partiach treści.

**Weryfikacja.** `npx tsc --noEmit` bez błędów. `npm run build` kończy się kodem 0
i prerenderuje komplet dziewiętnastu tras `/koperty/[kolor]`. Dane strukturalne na
próbce (`srebrna-perlowa`) niosą `ItemPage`, `Product` z `Offer`, `FAQPage`
i `BreadcrumbList`, a `material` czyta wykończenie z katalogu („wykończenie perłowe"),
nie ze stałej w treści.

**Otwarte — do decyzji właściciela.** W katalogu leży nieśledzony plik `env.local`
obok `.env.local`; oba wyglądają na warianty tej samej konfiguracji z sekretami
Firebase. Nie ruszam go, ale duplikat prędzej czy później rozjedzie się z oryginałem.

### 18 sierpnia 2026 — poz. 36d–36f: `/koperty/ciemnozielony`, `/koperty/jasnozielony`, `/koperty/czerwony`

**Wdrożona piąta partia stron kolorów z backlogu klastra K5.** Trzy kolejne odcienie otrzymały
kompletne podstrony w ramach dynamicznego szablonu `src/app/koperty/[kolor]/page.tsx`
i rejestru `src/lib/color-pages.ts`. Łączna liczba opublikowanych stron kolorów wzrosła do 14 z 19.

**1. Zróżnicowanie merytoryczne i intencje antykanibalizacyjne:**
- **Butelkowa Zieleń (`/koperty/ciemnozielony`):** głęboki, dostojny, leśny odcień barwiony w masie (115 g/m²).
  Zoptymalizowany pod jasny nadruk logo (biel, srebro, złoto, krem) oraz ekskluzywne zastosowania (jubilerzy,
  leśnictwo, winnice, hotele w naturze, private banking). Mosty nazewnicze: butelkowa zieleń, ciemnozielony,
  zieleń leśna, szmaragdowy, bottle green.
- **Zielony (`/koperty/jasnozielony`):** świeży, żywy odcień trawiasty barwiony w masie (115 g/m²).
  Idealny pod ciemny nadruk firmowy (czerń, grafit, butelkowa zieleń, granat) i pismo odręczne. Zastosowania:
  florystyka, eko-marki, agroturystyka, fundacje proekologiczne, yoga & wellness. Mosty nazewnicze:
  zielony, jasnozielony, zieleń trawiasta, soczysta zieleń, light green.
- **Czerwony (`/koperty/czerwony`):** nasycony, dojrzały karmin z nutą szlachetnego bordo, barwiony w masie (115 g/m²).
  Kadr aranżacyjny `czerwona-koperta-dl-nadruk-logo-restauracji` z czarnym logo restauracji na drewnie.
  Zastosowania: restauracje fine dining i winiarnie (bony podarunkowe), kampanie świąteczne i bożonarodzeniowe,
  teatry, instytucje kultury, walentynki. Mosty nazewnicze: czerwony, karminowy, bordowy, wiśniowy, rubinowy.

**2. Open Graph i metadane:**
Wygenerowano trzy obrazy wyróżniające 1200 × 630 w `public/images/og/` za pomocą `scripts/og-card.mjs`:
`koperty-ciemnozielone.jpg`, `koperty-zielone.jpg`, `koperty-czerwone.jpg`. Metaopisy (dokładnie 151–154 zn.)
mieszczą się w rygorystycznym kontrakcie 140–155 znaków (0 cen i kwot w description), leady GEO 51–57 słów
(próg 40–60 słów), po 4 unikalne pytania FAQ na stronę.

**3. Linkowanie i indeksacja:**
Wpisy w `PAGE_UPDATED` w `src/lib/page-updated.ts` podbite na `2026-08-18`. Paleta na `/`, sekcja
na `/koperty-dl` i lista odcieni na `/koperty-z-nadrukiem` zaktualizowały się automatycznie
poprzez rejestr `color-pages.ts`. Sitemapa wzrosła do 29 adresów.

### 18 sierpnia 2026 — poz. 37: `/koperty-premium` (Filar K6)

**Opublikowany filar klastra K6 — Eleganckie koperty premium.** Strona ofertowo-wizerunkowa dla decydentów B2B, kancelarii, instytucji i marek luksusowych, udowadniająca jakość twardymi faktami poligraficznymi.

**1. Konstrukcja merytoryczna i GEO:**
- **Lead GEO (51 słów):** precyzyjna, samowystarczalna definicja oferty premium (format DL, 115–140 g/m², barwienie w masie, perła/metalik, brak okienka, MOQ 10, równa cena bazowa).
- **Tabela porównawcza:** twarde zderzenie parametrów kopert Envelopes z masową kopertą biurową 75–80 g/m².
- **Cztery filary materiałowe:** Złoty metalik, Biała i Srebrna Perła, Taupe 140 g/m² (najgrubszy papier w ofercie) oraz głębokie maty barwione w masie.
- **Siatka realizacji `ShowcaseGrid`:** wyselekcjonowane kadry premium z logotypami i personalizacją.
- **Sekcja „Dla kogo":** 8 profili zastosowań biznesowych i oficjalnych (zarządy, kancelarie, hotele boutique, medycyna estetyczna, salony jubilerskie, PR, architektura, śluby).
- **Zasady kontrastu druku:** reguły doboru bieli/srebra na ciemnych tłach i czerni/grafitu na złocie i perle.
- **Sekcja rozbrajania obiekcji:** kiedy koperta premium nie jest potrzebna (masowa wysyłka transakcyjna).
- **FAQ:** 6 pytań w `PREMIUM_FAQ_ITEMS` zasila komponent i schemat `FAQPage`.

**2. Aspekty techniczne, SEO i linkowanie:**
- Metadane zoptymalizowane pod limit znaków (title 48 zn., description dokładnie 154 zn., 0 cen w opisie).
- Schemat `Product` z `AggregateOffer` (widełki 2,58–7,56 zł) i pełnym opisem materiałowym.
- Karta Open Graph wygenerowana w `public/images/og/koperty-premium.jpg` (1200 × 630 px).
- Dodany wpis w sitemapie (`priority: 0.9`) wraz z zestawem zdjęć produktowych i aranżacyjnych oraz w `PAGE_UPDATED`.
- Linkowanie wewnętrzne: stopka globalna (kolumna Oferta), sekcja zastosowań na `/`, podsumowanie gramatur na `/koperty-dl`.

### 18 sierpnia 2026 — poz. 36a–36c: `/koperty/szara`, `/koperty/niebieski`, `/koperty/jasnoniebieska`

**Wdrożona czwarta partia stron kolorów z backlogu klastra K5.** Trzy kolejne odcienie otrzymały
kompletne podstrony w ramach dynamicznego szablonu `src/app/koperty/[kolor]/page.tsx`
i rejestru `src/lib/color-pages.ts`. Łączna liczba opublikowanych stron kolorów wynosi 11 z 19.

**1. Zróżnicowanie merytoryczne i intencje antykanibalizacyjne:**
- **Szara (`/koperty/szara`):** neutralny, popielaty odcień matowy (115 g/m²), barwiony w masie.
  Pozycjonowany jako nowoczesna, minimalistyczna alternatywa dla biurowej bieli. Zgodność z ciemnym nadrukiem,
  kontrastową bielą i pismem odręcznym. Mosty nazewnicze: szary, popielaty, jasnoszary, jasnografitowy.
- **Niebieski (`/koperty/niebieski`):** nasycony odcień kobaltowy / chabrowy (115 g/m²), ciemny odcień barwiony w masie.
  Kadr aranżacyjny `niebieska-koperta-dl-personalizacja-odreczna` z jasną personalizacją imienną.
  Rozgraniczenie wobec formalnego Granatowego i zgaszonego Błękitu Łupkowego. Mosty nazewnicze:
  niebieski, chabrowy, kobaltowy, szafirowy, royal blue.
- **Błękitna (`/koperty/jasnoniebieska`):** pastelowy baby blue (115 g/m²), barwiony w masie.
  Zoptymalizowany pod ciemny nadruk firmowy (granat, czerń, grafit) i pismo odręczne. Zastosowania: kliniki, wellness,
  uroczystości dziecięce (chrzest, baby shower). Mosty nazewnicze: błękitna, jasnoniebieska, baby blue, pastelowy błękit.

**2. Open Graph i metadane:**
Wygenerowano trzy obrazy wyróżniające 1200 × 630 w `public/images/og/` za pomocą `scripts/og-card.mjs`:
`koperty-szare.jpg`, `koperty-niebieskie.jpg`, `koperty-blekitne.jpg`. Metaopisy (dokładnie 154 zn.)
mieszczą się w rygorystycznym kontrakcie 140–155 znaków (0 cen i kwot w description), leady GEO 49–50 słów
(próg 40–60 słów), po 4 unikalne pytania FAQ na stronę.

**3. Linkowanie i indeksacja:**
Wpisy w `PAGE_UPDATED` w `src/lib/page-updated.ts` podbite na `2026-08-18`. Paleta na `/`, sekcja
na `/koperty-dl` i lista odcieni na `/koperty-z-nadrukiem` zaktualizowały się automatycznie
poprzez rejestr `color-pages.ts`. Sitemapa wzrosła do 26 adresów.

### 18 sierpnia 2026 — węzeł `WebPage`, zdarzenia GA4 i tło hero w WebP

Trzy pozycje techniczne z przeglądu widoczności, wszystkie poza kadencją treści.
Żadna nie zmienia tekstu na stronie, więc **`PAGE_UPDATED` zostaje nietknięte** — data
w rejestrze mówi, kiedy zmieniła się treść, a nie kiedy zmienił się kod pod nią.
Z tego samego powodu nie idzie zgłoszenie przez `npm run indexnow`.

**1. Węzeł `WebPage` — spoiwo grafu danych strukturalnych.**
Do tej pory każda trasa wysyłała zestaw bloków stojących obok siebie: `Product` opisywał
towar, `BreadcrumbList` ścieżkę, `FAQPage` pytania — i nic nie mówiło, że to jedna strona,
że należy do tego serwisu i że jej tematem jest właśnie ten produkt. Parser musiał się tego
domyślać z adresu. Doszedł `webPageJsonLd()` w `seo.ts`: `@id` trasy, `isPartOf` → `WebSite`,
`mainEntity` → `Product` tej samej strony, `breadcrumb` → węzeł okruszków, `primaryImageOfPage`
i `dateModified`. Podtyp schodzi z roli trasy: `ItemPage` na filarach i stronach kolorów,
`CollectionPage` na `/blog`, `ContactPage` na `/kontakt`.

Przy okazji domknęły się dwie wiszące referencje: `BreadcrumbList` dostał `@id` wyprowadzony
z ostatniej pozycji ścieżki (czyli z adresu strony bieżącej), a `Article.mainEntityOfPage`
wskazywał dotąd na `@id`, pod którym **nie było żadnego węzła** — teraz wskazuje na węzeł
strony wpisu, a ten odwzajemnia się przez `mainEntity` → `#article`.

`FAQPage` i `HowTo` zostają samodzielne. Wciągnięcie ich pod węzeł strony wymagałoby nadania
jej drugiego typu i byłoby przebudową działających bloków bez zysku — tym bardziej że Google
wygasił wyniki rozszerzone dla obu, więc ich rolą jest dziś wyłącznie cytowalność w modelach.
Zysk z `WebPage` jest zresztą tej samej natury: żadnej gwiazdki w wynikach nie doda i dodać
nie może.

**Rejestr dat wyjechał z `sitemap.ts` do `src/lib/page-updated.ts`.** Ta sama data zasila teraz
dwa wyjścia — `lastmod` w sitemapie i `dateModified` w węźle strony. Dwie różne odpowiedzi na
to samo pytanie, z tej samej domeny, byłyby sygnałem gorszym niż brak drugiego pola, więc
rejestr stoi poza obydwoma konsumentami. Zawartość bez zmian; sitemapa nadal wystawia 24 adresy,
każdy z `lastmod`.

**2. Zdarzenia GA4 — i bramka zgody, bez której nie mogły powstać.**
`gtag` był skonfigurowany i na tym kończył rolę: zbierał odsłony. Odsłona mówi, że ktoś wszedł
na `/koperty-z-nadrukiem`, ale nie mówi, czy z tej strony ktokolwiek wszedł do konfiguratora
i czy cokolwiek zamówił — czyli plan treści prowadzony był na danych urwanych w połowie drogi
do pieniędzy. Doszły cztery zdarzenia: `configurator_start` (własne — krok „wszedł i zaczął
wybierać" nie ma odpowiednika w standardzie, a konfigurator nie ma własnego adresu),
oraz `add_to_cart`, `begin_checkout` i `purchase` pod nazwami zarezerwowanymi przez GA4,
więc wchodzą do gotowych raportów e-commerce bez konfigurowania czegokolwiek w panelu.

`item_id` w pozycjach to `colorSku()` — ten sam symbol, który idzie do danych strukturalnych
i do Merchant Center. Dzięki temu raport sprzedaży da się zestawić z ofertą w Shopping bez
mapowania po nazwie produktu.

**Przy okazji naprawiona niezgodność z własną polityką.** Skrypt `gtag` był w `layout.tsx`
renderowany bezwarunkowo, przy samym `NEXT_PUBLIC_GA_ID` — podczas gdy baner obiecywał wprost
„do czasu dokonania wyboru nie ładujemy żadnych skryptów analitycznych", a Polityka Cookies
powtarzała to jako zobowiązanie. Skrypt szedł więc do przeglądarki przed decyzją, także wtedy,
gdy odwiedzający wybierał „Odrzuć niekonieczne". Ładowanie przeniosło się do komponentu
`Analytics`, który wpuszcza `gtag` dopiero po zgodzie analitycznej; wycofanie zgody zamyka
wysyłkę zdarzeń natychmiast, jeszcze przed przeładowaniem strony. Sprawdzone w przeglądarce:
bez zgody brak żądania do `googletagmanager.com`, po zgodzie `configurator_start` leci raz na
sesję strony, `add_to_cart` i `begin_checkout` niosą poprawne kwoty (258 zł towar, 277,99 zł
z dostawą), po cofnięciu zgody nie leci nic. `purchase` przetestuje dopiero pierwsze realne
zamówienie — jest zabezpieczony podwójnie: `sessionStorage` i `transaction_id`.

**3. Tło hero na WebP: 3,06 MB → 127 kB.**
`Hero Envelopes Robocze.png` był w blokadach opisany jako „najprawdopodobniej nieużywane
źródło". Okazał się plikiem używanym — stoi jako tło hero na `/` (w `components.css`)
i na pięciu filarach przez `ParallaxBackground`, a nie znajdowały go wyszukiwania, bo adres
jest zapisany z `%20` w miejscu spacji. Konwersja na WebP przy jakości 70 (obraz i tak leży
pod 85-procentowym białym przesłonięciem, więc różnicy nie widać) dała **127 kB zamiast
3,06 MB** — na sześciu najważniejszych trasach serwisu, w zasobie blokującym pierwsze
wrażenie. Nazwa przy okazji straciła spacje.

Faktycznie nieużywane były `koperta-gorna.png`, `koperta-dolna.png` (mają warianty WebP
w `srcSet`) i `2.png` — usunięte. `public/images/` zeszło z 11 MB na 7 MB.
`DL.pdf` zostaje: nie jest nigdzie podlinkowany, ale mógł zostać wysłany klientowi mailem,
a 404 pod adresem, który ktoś ma zapisany, kosztuje więcej niż 450 kB na dysku.


### 18 sierpnia 2026 — poz. 36: `/koperty/taupe` (zamknięcie Fazy 3)

**Wdrożona ósma podstrona koloru — zamykająca Tydzień 9 i Fazę 3 planu publikacji.** Odcień Taupe
otrzymał pełną podstronę w ramach dynamicznego szablonu `src/app/koperty/[kolor]/page.tsx`
oraz rejestru `src/lib/color-pages.ts`.

**1. Zróżnicowanie merytoryczne i intencje antykanibalizacyjne:**
- **Taupe (`/koperty/taupe`):** ziemisty, szarobrązowy odcień (w katalogu i konfiguratorze
  występujący pod nazwą **Szarobrązowy**), łączący chłodną szarość z ciepłym brązem i beżem.
- **USP / Kąt GEO:** najwyższa gramatura w całym katalogu — **140 g/m²** i barwienie w masie,
  stanowiące bezpośredni dowód na jakość premium (sztywność w dłoni, pełne krycie).
- **Galeria i aranżacja:** kadr `taupe-koperta-dl-nadruk-logo-salonu-spa` z białym nadrukiem logo salonu SPA.
- **Mosty nazewnicze:** taupe, szarobrązowy, greige, ciemny beż, ciepły szary.

**2. Open Graph i metadane:**
Wygenerowano obraz wyróżniający 1200 × 630 w `public/images/og/` za pomocą `scripts/og-card.mjs`:
`koperty-taupe.jpg` na bazie kadru `taupe-koperta-dl-nadruk-logo-salonu-spa-1024.webp`.
Metaopis (151 zn.) w kontrakcie 140–155 znaków, lead GEO 51 słów (próg 40–60 słów), 4 unikalne pytania FAQ
(bez pytania cenowego).

**3. Linkowanie i indeksacja:**
Wpis w `PAGE_UPDATED` w `src/app/sitemap.ts` podbity na `2026-08-18`. Paleta na `/`, sekcja
na `/koperty-dl` i lista odcieni na `/koperty-z-nadrukiem` zaktualizowały się automatycznie
poprzez rejestr w `color-pages.ts`. Sitemapa urosła do 23 adresów.

### 18 sierpnia 2026 — poz. 33–35: `/koperty/bialy`, `/koperty/matcha`, `/koperty/blekit-lupkowy`

**Wdrożona trzecia partia stron kolorów (Faza 3, Tydzień 9).** Trzy nowe odcienie otrzymały
kompletne podstrony w ramach dynamicznego szablonu `src/app/koperty/[kolor]/page.tsx`
i rejestru `src/lib/color-pages.ts`.

**1. Zróżnicowanie merytoryczne i intencje antykanibalizacyjne:**
- **Biały (`/koperty/bialy`):** intencja uniwersalna i formalna. Oś merytoryczna: pełny kontrast dla
  każdego koloru nadruku (w tym znaki wielobarwne w CMYK/Pantone) oraz możliwość bezproblemowego
  pisania odręcznego (pióro/długopis/cienkopis). Różnice konstrukcyjne wobec masowej koperty
  biurowej: brak okienka adresowego i grubszy, jednolity papier ozdobny — oraz rozgraniczenie
  z Białą Perłową (matowość bez refleksów).
- **Matcha (`/koperty/matcha`):** pastelowa szałwiowa zieleń, papier barwiony w masie o podwyższonej
  gramaturze 120 g/m² (własny `paperUsp`). Dwa realne kadry aranżacyjne z nadrukami okolicznościowymi
  (`matcha-koperta-dl-nadruk-podziekowania`, `matcha-koperta-dl-nadruk-wyrazy-uznania`). Zbudowany most
  nazewniczy: szałwiowy, pistacjowy, oliwkowy, jasnozielony zgaszony.
- **Błękit Łupkowy (`/koperty/blekit-lupkowy`):** zgaszony stalowy błękit (w katalogu i konfiguratorze
  występujący pod nazwą **Jeansowy**), gramatura 120 g/m² i barwienie w masie. Kadr aranżacyjny
  `blekit-lupkowy-koperta-dl-nadruk-na-chrzest` z białym nadrukiem. Most nazewniczy dla fraz:
  błękit łupkowy, stalowy błękit, jeansowy, slate blue.

**2. Open Graph i metadane:**
Wygenerowano trzy obrazy wyróżniające 1200 × 630 w `public/images/og/` za pomocą `scripts/og-card.mjs`:
`koperty-biale.jpg`, `koperty-matcha.jpg`, `koperty-blekit-lupkowy.jpg`. Wszystkie opisy (143–149 zn.)
zgodne z wytycznymi — 0 cen i kwot w description, leady GEO 45–52 słowa, po 4 unikalne pytania FAQ.

**3. Linkowanie i indeksacja:**
Wpisy w `PAGE_UPDATED` w `src/app/sitemap.ts` podbite na `2026-08-18`. Paleta na `/`, sekcja
na `/koperty-dl` i lista odcieni na `/koperty-z-nadrukiem` zaktualizowały się automatycznie,
bo czytają rejestr z `color-pages.ts`. `Product` na stronie koloru schodzi z katalogu i cennika.
`ItemList` palety na `/` **nie** zaktualizował się sam — czyta `COLORS`, nie rejestr stron,
i do przeglądu z 18 sierpnia nie niósł adresów opublikowanych odcieni.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, 3 nowe trasy prerenderowane statycznie.

### 18 sierpnia 2026 — poz. 11: `/blog/ile-kartek-miesci-koperta-dl-i-jak-je-zlozyc`

**Opublikowane.** Nowy wpis w `POSTS` (`src/lib/blog.ts`), prerenderowany statycznie. Zakres
dostawy: H1 + 7 sekcji H2, blok odpowiedzi GEO w intro i leadzie, **dwie tabele specyfikacji**
(dopuszczalna liczba arkuszy per gramatura papieru oraz porównanie składania w literę C i Z),
lista kontrolna na siedem punktów, własna karta OG (`public/images/og/blog-ile-kartek-koperta-dl.jpg`)
i kontekstowe CTA wchodzące do konfiguratora z `format=DL`.

**Oś wpisu: trzeci wymiar wkładki.** Filar `/koperty-dl` rozstrzyga dopasowanie w dwóch wymiarach
(tabela wkładek w mm), poz. 10 mapuje wkładkę na format. Ten wpis odpowiada na pytanie o **grubość
wkładu**: ile arkuszy A4 i jakiej gramatury mieści koperta DL (bezpiecznie 1–5 arkuszy 80 g/m², limit
maksymalny 6–8), dlaczego koperta płaska ma limit 3–4 mm grubości oraz dlaczego zagięty plik może się
nie mieścić mimo poprawnych wymiarów 99 × 210 mm (sprężynowanie grzbietu, pękanie papieru bez bigowania,
zszywki narożne). Do tego instrukcja krok po kroku dwóch metod składania A4 (litera C — standard
listowy/poufny oraz litera Z — harmonijkowy/ulotkowy) i wyjaśnienie optymalizacji pod pakowanie ręczne.

**Antykanibalizacja:**
- **wobec F3 `/koperty-dl`:** filar podaje wymiary geometryczne w 2D; ten wpis dostaje grubość,
  fizykę zginania i instrukcję manualną. Żaden H2 nie powtarza nagłówka filara.
- **wobec poz. 10 (`jaki-format-koperty-wybrac-do-wkladki`):** poz. 10 prowadzi od nietypowej wkładki
  do formatu; ten wpis skupia się w całości na formacie A4 i wkładkach podłużnych w kopercie DL.
- **wobec poz. 9 (koszt zamówienia):** zero kwot, zero cennika nadruku.
- **`FAQPage`:** wpis nie ma własnego schematu pytań (dane strukturalne pytań zostają na filarze).

Linkowanie w obie strony:
- **do wpisu:** `/koperty-dl` ×2 — akapit pod tabelą dopasowań oraz sekcja „Poradniki" (włączony
  `grid grid-2` dla dwóch wpisów wspierających klastra K4); `/` — siatka blogowa; `/blog` — listing.
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `wymiary koperty DL`).

Weryfikacja: `typecheck` i `build` bez błędów, wpis prerenderowany statycznie, `title` 48 znaków,
`description` 153 znaki, sitemapa zaktualizowana (`lastModified` 2026-08-18 dla `/koperty-dl`, `/blog`
i `/`), nowa karta OG 1200 × 630.

### 18 sierpnia 2026 — audyt stron kolorów i runda poprawek

**Przegląd siedmiu opublikowanych stron `/koperty/[kolor]` po trzeciej partii.** Poprawki:

1. **Wiersz „Papier" w tabeli specyfikacji** liczy się teraz z wykończenia odcienia
   (`paperSpecLabel()` w `catalog.ts`). Wcześniej mówił „barwiony w masie" także przy Złotym,
   sprzecznie z `Product.material` na tej samej stronie. Warunek stoi w jednym miejscu i korzysta
   z niego zarówno tabela, jak i `colorEnvelopeProductJsonLd()`.
2. **Fraza `blekit-lupkowy`** przeszła na formę odmienioną (`koperty DL w kolorze błękitu
   łupkowego`). Mianownik wchodził do CTA, nagłówków, okruszków i przycisku koszyka jako zdanie
   niegramatyczne („Dodaj koperty błękit łupkowy do koszyka").
3. **Pytanie cenowe w FAQ zostało wyłącznie na `/koperty/zloty`.** `czarny` dostał w zamian most
   nazewniczy (grafitowy), `matcha` — porównanie trzech zieleni z palety. Liczba odcieni schodzi
   z `COLORS.length`, a nie jest wpisana ręcznie.
4. **Gramatura ma jednego właściciela na stronie** — pasek faktów i tabelę. Zeszła z `description`,
   `lead`, sekcji o charakterze papieru i z FAQ na trzech nowych odcieniach.
5. **Deklaracje o nieprześwitywaniu papieru usunięte** (`bialy`, `blekit-lupkowy`) — nie ma ich
   czym potwierdzić w katalogu. W ich miejsce weszły pytania odpowiadalne z katalogu: o brak
   okienka adresowego i o różnicę wobec granatu.
6. **Teksty alternatywne obrazów OG** `bialy` i `blekit-lupkowy` opisują to, co na kadrze faktycznie
   widać — poprzednie zapowiadały nadruk logo i jasne tło, których tam nie ma.
7. **Odesłania „kadr niżej" w sekcji „Dla kogo"** wskazywały w złą stronę: galeria renderuje się
   w sekcji o nadruku, czyli wyżej. Poprawione na czterech stronach.
8. **`ItemList` palety na `/`** niesie `url` dla odcieni z opublikowaną stroną (przez
   `hasColorPage()`), a nazwy w `BreadcrumbList` odpowiadają widocznej ścieżce nawigacji.
9. **Drobne:** tytuł `bialy` bez „i adresowaniem" (to temat filara F2), własny `paperUsp` dla bieli
   zamiast pustego „barwiony w masie", metaopisy trzech nowych odcieni w kontrakcie 140–155 znaków,
   lead `blekit-lupkowy` w progu 40–60 słów.

**Pozostawione świadomie:** zdublowany kadr produktowy (hero i sekcja zamówienia renderują ten sam
plik), brak linkowania poziomego między kolorami wymienianymi w prozie (wymaga zmiany typu
`ColorPageSection` na treść z odnośnikami) oraz nieodróżnialność kart OG Granatowego i Błękitu
Łupkowego przy obecnej ciemnej nakładce w `scripts/og-card.mjs`.

Weryfikacja: `npx tsc --noEmit` bez błędów.

### 18 sierpnia 2026 — zdjęcie odcienia w hero stron kolorów i trzy nowe kadry

**Polecenie właściciela: w hero podstrony koloru ma stać zdjęcie koperty w tym
odcieniu.** Do tego trzy zdjęcia wrzucone do `public/images/new-images/`, do rozdysponowania.

**1. Hero strony koloru jest dwukolumnowy.** Tekst po lewej, zdjęcie katalogowe odcienia po
prawej (`.color-hero` w `components.css`, kolumny 1,15 : 1 — lead ma 56ch i przy podziale po
połowie łamał się na sześć wierszy). Poniżej 900 px kadr schodzi pod treść i zwęża się do
320 px, żeby CTA nie wypadło poniżej pierwszego ekranu. Kadr dostał `loading="eager"`
i `fetchPriority="high"` przez nowe pole `eager` w `EnvelopePlaceholder`: to kandydat na LCP
tej strony, a leniwe ładowanie opóźniałoby dokładnie ten element, który mierzy Core Web Vitals.

**2. Sekcja „Papier" straciła zdjęcie i to jest celowe.** Stał tam ten sam kadr katalogowy, co
teraz w hero — dwa ekrany niżej, w sekcji, która opisuje cechy niewidoczne na zdjęciu
produktowym (kolor na zgięciu, zachowanie w świetle). Proza idzie tam dziś na pełną szerokość.
**Do rozważenia przy kolejnych kolorach:** zbliżenia z `public/images/details/` pasowałyby do
tej sekcji idealnie (klapka dla czerni, papier metaliczny dla złota), ale ich opisy mieszkają
dziś w tablicy lokalnej w `page.tsx`, więc wymagałoby to przeniesienia ich do `showcase.ts`.

**3. Nazwy wrzuconych plików opisywały miejsce docelowe, nie zawartość.** Kolor ustalony
pomiarem mediany kadru centralnego i porównaniem ze zdjęciami z `colors/` — nie z nazwy pliku:
„Certyfikaty, dyplomy i podziękowania" to **Matcha** (odległość 36 do matchy, 62 do następnego
kandydata), a „Koperty na pieniądze i nagrody" to **Biała Perłowa** (10 do bieli perłowej, 18
do ecru), nie Srebrna Perłowa, którą podstawiał dotychczasowy kadr zastępczy.

**4. Kadr „na pieniądze" wymusił poprawkę treści, a nie odwrotnie.** Na zdjęciu jest nadruk
„W dniu Ślubu", a akapit mówił wyłącznie o premiach i nagrodach w konkursach pracowniczych.
Zasada z tej sekcji jest twarda — kadr musi pokazywać to, co mówi nagłówek — więc akapit
prowadzi teraz banknotem mieszczącym się płasko i obejmuje oba konteksty: prezent na ślub
i premię. **To nadal koperta na pieniądze, nie na zaproszenie ślubne**; zaproszenie kwadratowe
wymagałoby K4 ze statusem „Dostępne wkrótce", więc treść wokół tego kadru nie może zejść
z pieniędzy. Ostrzeżenie zapisane przy `USE_CASE_SHOTS`.

**5. Pole `shot` w spisie zastosowań jest od dziś wymagane.** Wszystkie sześć pozycji ma kadr
aranżacyjny, więc gałąź zastępcza z kadrem katalogowym była martwa — razem z nią zniknęło pole
`colorId`. Typ wymusza teraz regułę, którą komentarz sekcji i tak deklarował.

**6. Trzecie zdjęcie — gładka Biała Perłowa — poszło na filar formatu.** `/koperty-dl` nie miał
ani jednego kadru aranżacyjnego, a wszystkie kadry w bibliotece miały nadruk albo
personalizację, więc żaden nie pokazywał samego produktu. Kadr stanął w sekcji „Budowa": widać
na nim jednolitą przednią ściankę bez okienka i klapkę wzdłuż dłuższego boku, czyli dokładnie
to, o czym mówią oba akapity tej sekcji (zeszły do jednej kolumny obok zdjęcia). Doszedł wariant
kadru `gladka` — `makieta` włącza w konfiguratorze krok nadruku, co dla koperty czystej byłoby
obietnicą niezgodną z tym, co widać.

**7. Mastery poza katalogiem serwowanym.** Trzy pliki po ~2,5 MB leżały w `public/images/`,
czyli pod adresem publicznym. Po konwersji do WebP w dwóch szerokościach (75–99 kB dla 1024 px,
20–24 kB dla 512 px, budżet 120/30 kB) oryginały przeniesione do `.data/source-images/`,
a katalog `public/images/new-images/` usunięty.

Weryfikacja: `typecheck` i `build` bez błędów. Hero dwukolumnowy na wszystkich czterech
kolorach, zdjęcie `eager` z `fetchPriority=high`, bez poziomego przewijania w 1280 px i po
zwężeniu poniżej progu 900 px. Sześć kart zastosowań ma kadr aranżacyjny i wchodzi do
konfiguratora z właściwym odcieniem (m.in. `kolor=matcha` i `kolor=biala-perlowa`). Galeria
„Nadruk okolicznościowy" nadal pokazuje trzy kadry, więc nowe zdjęcia nie dublują się na
stronie głównej. Sitemapa obrazów: `/` 24 obrazy, `/koperty-dl` 7, każdy nowy plik zgłoszony
dokładnie raz. **Niesprawdzone:** wygląd na realnym telefonie — pomiar szerokości robiłem
w oknie przeglądarki, zrzuty ekranu w tym środowisku nie działają.

### 17 sierpnia 2026 — poz. 30–32: `/koperty/granatowy`, `/koperty/zloty`, `/koperty/ecru`

**Tydzień 8 Fazy 3 zamknięty.** Cztery kolory mają własne strony. Szablon z poz. 29 przyjął trzy
kolejne odcienie bez przepisywania — zmiany poniżej wynikły z treści, a nie z architektury.

**1. Każdy kolor ma inny argument główny, bo inaczej cztery strony byłyby jedną.** Granat:
porównanie z czernią i z jaśniejszymi błękitami plus trzy kolory nadruku, które się na nim
bronią. Złoty: rozgraniczenie papieru metalicznego od złocenia, którego **nie wykonujemy**.
Ecru: most nazewniczy i jedyny odcień z tej czwórki, na którym adres da się wypisać ręcznie.
Sekcja „nadruk" nie powtarza się między stronami — czerń mówi o gubieniu detali, granat
o sprowadzaniu logo do jednej barwy, złoty o zanikaniu jasnego znaku, ecru o pełnej palecie.

**2. Pytanie cenowe dostało jednego właściciela: `zloty`.** „Czy ten kolor kosztuje więcej"
jest realne przy każdym odcieniu, ale powtórzone na dziewiętnastu stronach daje dziewiętnaście
prawie identycznych bloków `FAQPage`. Parytet ceny jest tematem strony złotej (wykończenie
metaliczne bez dopłaty), więc pytanie stoi tam, a pozostałe kolory pytają o swoje różnice.
Reguła zapisana w nagłówku `ColorPageFaqItem`.

**3. Pasek faktów zszedł z szablonu na kolor — z powodu Złotego.** Pierwsza pozycja mówiła
„Barwiony w masie" na każdej stronie, a dla papieru z `finish: 'metaliczne'` to najmniej
istotna jego cecha i w dodatku przykrywa sedno oferty. Nowe pole `paperUsp` jest opcjonalne:
kolor bez własnej wartości zostaje przy domyślnej, `zloty` mówi o połysku.

**4. Dane strukturalne przestały twierdzić „barwiony w masie" o papierach z wykończeniem.**
`colorEnvelopeProductJsonLd()` składał wcześniej opis wewnętrznie sprzeczny — „barwiony w masie,
wykończenie metaliczne" — a wykończenie jest z definicji cechą powierzchni. Teraz `material`,
opis i właściwość „Barwienie papieru" schodzą z `finish`: odcienie matowe dostają barwienie,
odcienie z wykończeniem dostają wykończenie. Merchant Center czyta `material` wprost, więc
sprzeczność byłaby widoczna przy ofercie. **Otwarte:** czy papiery metaliczne i perłowe są
barwione w masie, wie wyłącznie właściciel — do potwierdzenia, bo `src/lib/blog.ts` twierdzi
o całej ofercie „barwione w masie, a nie powlekane".

**5. Ecru nie ma kadru aranżacyjnego i strona to pokazuje, zamiast udawać.** W
`public/images/zastosowania/` nie ma zdjęcia tego odcienia. `shotFiles` przyjmuje pustą tablicę,
a szablon pomija wtedy siatkę kadrów — podmiana kadru w innym kolorze byłaby wprowadzaniem
w błąd co do wyglądu papieru. Karta OG powstała z kadru zdjęcia katalogowego, bo przyciemnienie
rozciągnięte na pełny kwadrat na białym tle gasiło ciepło odcienia; kadr master leży w `.data/`.

**6. Linki przychodzące dołożyły się same.** Paleta na `/`, sekcja kolorów na `/koperty-dl`
i akapit o odcieniach na `/koperty-z-nadrukiem` renderują listę z `color-pages.ts`, więc trzy
nowe adresy weszły w linkowanie bez edycji tych stron. To była cała stawka rozwiązania z poz. 29.

Weryfikacja: `typecheck` i `build` bez błędów, trzy adresy prerenderowane statycznie. Metadane
w normie na wszystkich czterech kolorach — `title` z marką 45–51 znaków, `description` 147–150,
lead 47–52 słowa, po cztery pytania FAQ. Sitemapa urosła z 16 do 19 adresów. JSON-LD: `ENV-DL-GRANATOWY`,
`ENV-DL-ZLOTY` i `ENV-DL-ECRU` w grupie `ENV-DL`, ceną 2.58 i kompletem zdjęć, do tego `FAQPage`
i `BreadcrumbList` na każdej. **Niesprawdzone:** wygląd stron w przeglądarce — weryfikacja
wizualna nie była uruchamiana, kontrola objęła typy, build i wygenerowane metadane.

### 17 sierpnia 2026 — poz. 10: `/blog/jaki-format-koperty-wybrac-do-wkladki`

**Opublikowane.** Wpis w `POSTS` (`src/lib/blog.ts`), prerenderowany statycznie. Zakres dostawy:
H1 + 7 sekcji H2, blok odpowiedzi GEO w intro, **dwie tabele** (dziesięć wkładek z formatem, który
je przyjmie, oraz trzy formaty z kształtem wkładki i statusem), lista kontrolna na siedem punktów,
kadr nagłówkowy, własna karta OG i kontekstowe CTA z preselekcją formatu DL.

**Oś wpisu: kierunek pytania, nie temat.** Filar `/koperty-dl` odpowiada „czy ta wkładka mieści
się w kopercie DL" — ma tabelę dopasowań z werdyktem i zapasem w milimetrach. Ten wpis odwraca
kierunek: wychodzi od tego, co klient trzyma w ręku, i prowadzi do formatu. Stąd inna oś tabeli
(wkładka → format, nie wkładka → mieści się) i cała metoda doboru, której filar nie opisuje:
pomiar po złożeniu, wielkość zapasu, kształt wkładki i granica, za którą trzeba szukać koperty
spoza oferty. Ta różnica jest jedynym powodem istnienia osobnego adresu i tak też jest zapisana
w komentarzu przy wpisie.

**Kolejność szukania formatu jest sprzedażowa, nie geometryczna.** `verdictForInsert()` sprawdza
najpierw `AVAILABLE_FORMATS`, dopiero potem `UPCOMING_FORMATS`. Kolejność odwrotna — od
najmniejszego formatu — podpowiadałaby do wizytówki kopertę C6, czyli mniejszą, ale ze statusem
„Dostępne wkrótce": obietnicę bez pokrycia (brief pkt 4.2). Przy dzisiejszym katalogu tabela daje
siedem wierszy „do zamówienia od ręki", jeden wiersz z formatem K4 opisanym jako niedostępny
i dwa wiersze bez formatu w ogóle.

**Dwie wkładki bez formatu to fakt geometryczny, nie brak w ofercie.** Arkusz A4 złożony na pół
(148 × 210 mm) i arkusz A4 płasko (210 × 297 mm) nie zmieszczą się także po uruchomieniu C6
i K4 — sprawdzone `fitsInFormat()` na wszystkich trzech formatach. Sekcja „Co zrobić, gdy wkładka
nie mieści się" mówi to wprost i podaje trzy drogi w kolejności: inne złożenie, poczekanie na
format, koperta spoza tej oferty. Trzecia droga jest wpisana świadomie: dyplomu, którego nie wolno
zginać, nie obsłużymy i lepiej to powiedzieć niż zaproponować złożenie niszczące dokument.

**Wszystkie liczby liczone, żadna wpisana.** Wymiary wkładek pochodzą z `STANDARD_INSERTS`,
werdykty z `fitsInFormat()`, największa wkładka z `maxInsertSize()`, proporcja boków i statusy
z `FORMATS`. Wkładki przywoływane w prozie wyszukuje `insertByLabel()`, która **rzuca wyjątkiem**
zamiast zwrócić `undefined` — usunięcie pozycji z katalogu zatrzyma budowanie zamiast wypuścić
na stronę zdanie z „undefined mm". Uruchomienie formatów C6 i K4 przepisze obie tabele bez
dotykania treści.

Świadomie nieobecne: pytanie „Czym różni się koperta DL od C6" (`DL_FAQ_ITEMS` na filarze),
grubość wkładu i równe składanie A4 (poz. 11), decyzja o braku okienka (poz. 13), dobór koperty
do zaproszeń (poz. 41). Zero kwot, zero MOQ, zero terminów — kontrola na wyrenderowanym HTML-u
wykazała **0 wystąpień kwot**. Wpis nie ma własnego `FAQPage`: dane strukturalne pytań zostają
na filarze (zasada z poz. 7).

Linkowanie w obie strony:
- **do wpisu:** `/koperty-dl` ×2 — akapit pod tabelą dopasowań („jeżeli Państwa wkładki nie ma
  w tabeli") oraz **przywrócona sekcja „Poradniki"** z nagłówkiem „Zanim wybiorą Państwo format";
  `/` — siatka blogowa; `/blog` — listing.
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `wymiary koperty DL`) oraz sekcja
  „Powiązane wpisy".
- Sekcja „Poradniki" na F3 była usunięta 16 sierpnia, bo wszystkie jej wpisy przepadły. Wraca
  z **pojedynczą kartą `card card-lg`** — siatka włącza się od drugiego wpisu, więc nie ma pustych
  kolumn. Wypełnią ją poz. 11 i 13.

**Karta OG** `public/images/og/blog-format-do-wkladki.jpg` (1200 × 630, 36 kB) z generatora
`scripts/og-card.mjs`, na kadrze kopert Szarobrązowych — jedyna karta w rodzinie używająca tego
zdjęcia. Bez kwot, zgodnie z regułą z 17 sierpnia.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, wpis prerenderowany jako SSG,
`title` 37 znaków (49 z marką), `lead` 141 znaków, kanoniczny adres i własny obraz OG. Dane
strukturalne: `Article` z obrazem, `BreadcrumbList`, `Organization` z layoutu. Obie tabele
sprawdzone w wyrenderowanym HTML-u wiersz po wierszu. Cztery wejścia do konfiguratora, wszystkie
z `format=DL`; **żaden odnośnik nie prowadzi do C6 ani K4**. Sitemapa urosła do 16 adresów, daty
podbite dla `/`, `/koperty-dl` i `/blog`.

**Zgłoszenie do wyszukiwarek:** `npm run indexnow` po wdrożeniu na produkcję. Do tego czasu adres
nie istnieje publicznie i zgłoszenie wróciłoby z 404.

### 17 sierpnia 2026 — poz. 29: `/koperty/czarny` i szablon stron kolorów

**Faza 3 otwarta pierwszym kolorem.** Powstał szablon `/koperty/[kolor]`, a razem z nim
rozstrzygnięcia, które obowiązują wszystkie kolejne odcienie.

**1. Lista opublikowanych kolorów to plik z treścią.** `src/lib/color-pages.ts` trzyma teksty
i jednocześnie **jest rejestrem stron**: kolor ma adres wtedy i tylko wtedy, gdy ma tam wpis.
Ta sama lista zasila `generateStaticParams`, sitemapę, linkowanie z palety na `/` i docelowo
warianty w feedzie. Nie da się więc wygenerować strony bez tekstu, zgłosić do wyszukiwarek
adresu, którego nie ma, ani wystawić oferty bez strony docelowej. `dynamicParams = false`
domyka to od strony routingu — kolor spoza listy dostaje 404, nie pusty szablon.

**2. Treść nie jest generowana z szablonu.** Dziewiętnaście stron z jednym zdaniem i podmienioną
nazwą koloru to dziewiętnaście stron cienkich. Każdy odcień dostaje własny opis charakteru,
własną sekcję o nadruku, własne „dla kogo", własną sekcję o granicach zastosowania i własne FAQ.
Parametry — wymiary, gramatura, cena, terminy — są czytane z katalogu i cennika, więc do treści
wchodzi wyłącznie to, co dla tego odcienia jest naprawdę inne.

**2a. Nazwa koloru nie wchodzi do zdania.** Katalog trzyma przymiotnik w mianowniku liczby
pojedynczej („Czarny", „Szara", „Ecru"), a szablon potrzebuje formy mnogiej — „koperty czarny"
to błąd, a rodzaj gramatyczny bywa różny w obrębie palety. Każdy kolor podaje więc dwie odmienione
frazy (`phrase`, `phraseShort`), z których szablon buduje nagłówki, przycisk koszyka, okruszki
i anchory linków przychodzących. **Przy dodawaniu kolejnego koloru to pole jest obowiązkowe.**

**3. Czerń ma jeden argument, którego nie ma żaden inny kolor:** papier barwiony w masie zostaje
czarny na zgięciu i na krawędzi, podczas gdy arkusz barwiony powierzchniowo pokazuje jasny rdzeń.
Wokół tego zbudowana jest sekcja „Papier". Do tego sekcja **„Kiedy czarna koperta nie jest
najlepszym wyborem"** — ręczne adresowanie długopisem i widoczność otarć — bo granica zastosowania
jest materiałem cytowalnym i uczciwym wobec klienta, a nie ubytkiem sprzedażowym.

**4. Cena wchodzi na stronę koloru — świadomy wyjątek od zasady „cennik należy do `/`".**
Strona koloru jest stroną docelową oferty produktowej: bez widocznej kwoty Merchant Center
odrzuca ofertę. Cena stoi więc w wierszu specyfikacji i w bloku zamówienia, ale strona nie
dostaje nagłówka cenowego ani rozbicia dopłat — te zostają na `/`, F1 i F2.

**5. „Dodaj do koszyka" tylko tutaj.** Na `/koperty-dl` kolor nie jest wybrany, więc przycisk
musiałby o niego zapytać, czyli powtórzyć konfigurator. Na stronie koloru decyzja jest podjęta
adresem URL: zostaje ilość. Nadruk i personalizacja przycisku nie dostają — wymagają pliku albo
listy adresów i akceptacji wizualizacji, więc prowadzą do konfiguratora z zaznaczonym kolorem.

**6. Linki przychodzące.** Paleta na `/` oddaje klik stronie koloru zamiast konfiguratorowi
(zapowiedziane przy zmianie z 13 sierpnia), a sekcja kolorów na `/koperty-dl` wymienia odcienie
z własną kartą. Oba miejsca renderują listę z `color-pages.ts`, więc kolejny kolor dokłada sobie
linki sam.

**7. Karta OG z generatora.** `scripts/og-card.mjs` odtwarza układ rodziny obrazów wyróżniających
(przyciemnienie od lewej, nadtytuł, tytuł szeryfowy, kreska w kolorze pieczęci, dwie linijki
parametrów, domena). **Bez kwot na karcie** — obraz OG bywa buforowany przez komunikatory
miesiącami i przeżyłby zmianę cennika.

**8. Adres jest kolorowy, nie formatowy — i tak zostanie.** Pytanie właściciela o przyszłe C6
i K4 w czerni rozstrzygnięte regułą wpisaną wyżej w tej fazie i w nagłówku `color-pages.ts`.
Żeby przyszła zmiana była mechaniczna, format przeszedł z wartości wpisanej na sztywno na
parametr: `colorSku()` niesie go w symbolu (`ENV-DL-CZARNY` → obok stanie `ENV-C6-CZARNY`),
`colorGroupId()` daje grupę wariantów per format, a `AddColorToCart` i blok danych
strukturalnych przyjmują go z góry. Dziś wszystkie dostają `DL`, więc wynik jest identyczny
co do znaku — sprawdzone porównaniem JSON-LD przed zmianą i po niej.

**Feed produktowy zostaje przy jednej pozycji.** Wariant `ENV-DL-CZARNY` obok zbiorczego `ENV-DL`
to dwie oferty na ten sam produkt. Warianty zastąpią pozycję zbiorczą naraz, gdy strony pokryją
paletę — inaczej Shopping pokazywałby jeden odcień zamiast dziewiętnastu.

Weryfikacja: `typecheck` i `build` bez błędów, `/koperty/czarny` prerenderowany statycznie.
`title` 46 znaków, `description` 147, kanoniczny adres i własna karta OG. JSON-LD: `Product`
z `sku ENV-DL-CZARNY`, `color Czarny`, `inProductGroupWithID ENV-DL`, ceną 2.58 i pięcioma
zdjęciami, do tego `FAQPage` i `BreadcrumbList`. Cena widoczna w treści pięć razy — warunek
strony docelowej oferty. Sitemapa urosła z 14 do 15 adresów, wpis koloru niesie datę i pięć
obrazów. Linki przychodzące renderują się na `/` i na `/koperty-dl`.

### 17 sierpnia 2026 — `/feed.xml`: jedna pozycja produktowa na próbę

**Feed dla Merchant Center jako trasa, nie jako plik.** Powód ten sam co przy `/llms.txt`:
wszystkie liczby pochodzą z `pricing.ts` i `catalog.ts`. Pozycja jest **budowana
z `dlEnvelopeProductJsonLd()`**, czyli z tego samego bloku, który opisuje produkt na stronie
docelowej — tytuł, opis, cena, zdjęcia i identyfikator nie są przepisane, tylko wzięte z jedynego
miejsca, które je definiuje. Feed, `Offer` na stronie, cennik w treści i faktura mają jedno
źródło; wgrany raz plik rozjechałby się przy pierwszej zmianie ceny.

**Jedna pozycja, i to nie z ostrożności.** Koperta DL gładka (`ENV-DL`, 2,58 zł brutto) jest
jedyną konfiguracją, którą kupujący może zamówić **od 1 sztuki** — cena jednostkowa w feedzie
jest więc ceną realnie dostępną. Nadruk i personalizacja mają MOQ 10, więc pozycja z ceną
4,57 zł byłaby ofertą, której nie da się kupić: wejdą jako komplet z `unit_pricing_measure`,
razem ze stronami kolorów, które dadzą im własne adresy docelowe.

**Dwie decyzje w szczegółach.** Kadrem wiodącym jest koperta **biała**, nie czarna — czarna
wypada pierwsza w kolejności katalogowej, ale zdjęcie główne nie może obiecywać jednego odcienia
mocniej niż tytuł, skoro oferta obejmuje wszystkie w jednej cenie; pozostałe kadry idą jako
`additional_image_link`, a tytuł niesie liczbę kolorów, więc zestaw zdjęć jest spójny z opisem.
Identyfikacja to `brand` + `mpn` z symbolem katalogowym (koperty nie mają GTIN, a Envelopes jest
producentem); gdyby Merchant Center zakwestionował MPN, alternatywą jest `identifier_exists: no`.
`transit_time` pominięty tak samo jak w danych strukturalnych — czasu przewozu nie ma w żadnym
źródle w projekcie (zob. tabela blokad).

Weryfikacja: `typecheck` i `build` bez błędów, `/feed.xml` prerenderowany jako statyczny.
Dokument sprawdzony parserem XML — poprawny składniowo, jedna pozycja. Pola: `id ENV-DL`,
tytuł 68 znaków (limit 150), opis 272 znaki, `price 2.58 PLN` zgodne z kwotą widoczną
na `/koperty-dl`, `availability in_stock`, `condition new`, czas obsługi 2–2 dni roboczych
(`leadDaysPlain`), wysyłka `PL / Kurier / 19.99 PLN`, siedem zdjęć z kadrem białym na czele.
Plik w UTF-8 bez BOM.

**Co zostaje po stronie właściciela:** konto Merchant Center, dane firmy, stawka wysyłki
i polityka zwrotów w ustawieniach konta, a następnie zaplanowane pobieranie
`https://envelopes.pl/feed.xml`. Własność witryny jest już potwierdzona przez Search Console.

### 17 sierpnia 2026 — jedno źródło ceny (warunek wejścia do Merchant Center)

**Zero zmian widocznych dla klienta.** Ceny na stronach, w konfiguratorze, w koszyku, w `Offer`
i w `/llms.txt` są dokładnie te same co wczoraj — zmienia się to, czego nie było widać.

**Rozjazd, który był możliwy.** Wszystko, co widzi klient, czyta `DEFAULT_PRICING` wkompilowane
w statyczny HTML. Serwer wyliczający wartość zamówienia (`/api/orders`) czytał natomiast
`getPricing()`, czyli cennik nadpisywalny dokumentem `pricing/current` w Firestore. Dokument nie
zmieniał żadnej liczby na stronie — zmieniłby wyłącznie kwotę naliczoną w koszyku. Klient
widziałby 2,58 zł na każdej stronie serwisu i zapłaciłby inną stawkę, nie mając jak tego
zauważyć. Nadpisanie było puste, więc do niczego takiego nie doszło; niezmiennik nie był jednak
niczym chroniony poza tym, że nikt nie dotknął bazy.

**Rozstrzygnięcie: cenę wolno zmienić tylko przez wdrożenie.** `resolvePricing()` w `pricing.ts`
czyta nadpisanie, porównuje je ze stawkami wkompilowanymi i **odrzuca rozjazd**, zwracając zawsze
`DEFAULT_PRICING`. Odczyt zostaje, bo to on wykrywa problem: rozjeżdżające się pola trafiają
do logu serwera jako błąd, z nazwami (`base.DL`, `print`) i ze wskazaniem właściwej drogi.
Odrzucone alternatywy: **zastosować nadpisanie i tylko ostrzec** — ostrzeżenie w logu nie cofa
obciążenia klienta ceną, której nie widział; **usunąć mechanizm** — wróci, gdy cenę będzie czytać
z jednego źródła także warstwa prezentacji (render dynamiczny albo rewalidacja wyzwalana zmianą
cennika), a do tego czasu jego odczyt pełni rolę czujnika.

**Dlaczego to sprawa SEO, a nie tylko porządek w kodzie.** Merchant Center odrzuca ofertę, gdy
cena w feedzie nie zgadza się z ceną na stronie docelowej, a przy powtarzalnym rozjeździe zawiesza
konto. Dopóki kwota naliczana mogła się różnić od pokazanej, feed produktowy (poz. „Feed + Merchant
Center" z listy priorytetów) był zbudowany na źródle, które wolno było rozjechać jednym wpisem
w bazie. Teraz feed, `Offer`, cennik na stronie i faktura mają jedno źródło.

Weryfikacja: `typecheck` i `build` bez błędów. Test jednostkowy na wyodrębnionym module —
brak nadpisania i brak dokumentu dają wynik **identyczny** z `DEFAULT_PRICING` (co do bajtu,
więc klient nie zobaczy różnicy), nadpisanie o tych samych wartościach nie generuje fałszywego
alarmu, nadpisanie `base.DL = 9,99` zostaje odrzucone (cena pozostaje 2,58) i wypisuje błąd
z listą pól, a koszyk 100 kopert z nadrukiem nadal liczy 4,57 zł/szt. i 457,00 zł brutto.

### 17 sierpnia 2026 — IndexNow i konto w Bing Webmaster Tools

**Zmiana infrastrukturalna, zero zmian w treści.** Google odkrywa nowe adresy sam i szybko.
Bing bez zgłoszenia potrafi zwlekać tygodniami — a jego indeks jest źródłem wyników dla
ChatGPT Search i Copilota, więc opóźnienie w Bing to opóźnienie w tym samym kanale, pod który
przygotowany jest `/llms.txt` i cała warstwa danych strukturalnych. Protokół IndexNow zamyka tę
lukę: jedno zgłoszenie idzie do punktu zbiorczego i trafia do Bing, Yandeksa, Seznamu i Navera.

**1. Klucz jako jedyny plik, nie jako stała w kodzie.** `public/ec2f0cba…d19813a6d.txt` — nazwa
pliku równa jego zawartości, tak wymaga protokół. Klucz **nie jest sekretem**: cała weryfikacja
polega na tym, że plik jest publicznie dostępny pod adresem domeny, więc leży w repozytorium,
a nie w zmiennych środowiskowych. Odrzucone: stała w kodzie obok pliku — dwie kopie tej samej
wartości rozjechałyby się przy pierwszej podmianie klucza, a jedynym objawem byłby HTTP 403
bez wskazania przyczyny. Skrypt czyta klucz z nazwy pliku i sprawdza zgodność z zawartością.

**2. Lista adresów pochodzi z sitemapy pobranej z serwera, nie z kodu.** Zgłoszenie adresu,
który nie jest jeszcze wdrożony, kończy się wizytą crawlera na 404 — sygnał gorszy niż brak
zgłoszenia. Sitemapa produkcyjna z definicji zawiera wyłącznie to, co faktycznie stoi, i niesie
`lastmod` z `PAGE_UPDATED`, czyli z dat wpisywanych w tym dzienniku. **Konsekwencja dla
kadencji:** publikacja bez podbicia daty w `sitemap.ts` nie tylko psuje sitemapę, ale też wypada
ze zgłoszenia do wyszukiwarek. Domyślne okno to 7 dni — tydzień odpowiada kadencji czterech
pozycji tygodniowo, więc `npm run indexnow` po deployu zgłasza dokładnie to, co w tym tygodniu
powstało. `--all` obsługuje zgłoszenie startowe, argumenty pozycyjne — pojedynczą stronę.

**3. Trzy blokady przed wysłaniem czegoś nieprawdziwego.** Skrypt pobiera plik klucza z serwera
i porównuje treść, zanim cokolwiek wyśle (odpowiedź 403 nie mówi, czego brakuje). Odmawia
zgłoszenia hosta lokalnego. Odrzuca argument, który powłoka Git Bash rozwinęła z `/koperty-dl`
do ścieżki systemowej — bez tej kontroli do wyszukiwarek poszedłby adres nieistniejący, czyli
dokładnie to, przed czym reszta skryptu chroni.

**4. Weryfikacja własności w Bing Webmaster Tools.** Znacznik `msvalidate.01` wchodzi do HTML
**wyłącznie**, gdy `NEXT_PUBLIC_BING_SITE_VERIFICATION` jest ustawione; `<meta content="undefined">`
byłby sygnałem gorszym niż brak znacznika. Prostsza droga to import serwisu z Search Console —
przenosi też zgłoszoną sitemapę i nie wymaga żadnej zmiennej. Przy okazji `.env.example` dostał
sekcję z `NEXT_PUBLIC_GA_ID` i `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, których nigdy nie
dokumentował, mimo że kod czyta obie od 16 sierpnia.

**5. Zgłoszenie weszło do definicji ukończonej publikacji**, a nie do listy dobrych praktyk.
Brief agenta dostał pkt 5.7 („IndexNow — obowiązkowe zgłoszenie po każdej nowej stronie i po
każdym wpisie") oraz osobny krok w pętli operacyjnej; kompletność dostawy z pkt 5.2 obejmuje
teraz datę w `PAGE_UPDATED` i zgłoszenie po wdrożeniu. Gdy wdrożenia jeszcze nie było, polecenie
trafia dosłownie do sekcji „Następny krok" w raporcie — agent nie zgłasza na wyrost i nie udaje,
że zgłosił. Zasada zamknięcia pozycji stoi też w legendzie tego planu, obok reguły o linkach
zwrotnych, bo to ten sam rodzaj długu: publikacja, o której nikt się nie dowiedział.

Przy okazji poprawione dwa nieaktualne miejsca w briefie: GA4 i Search Console figurowały jako
niewdrożone, mimo że działają od 16 sierpnia. Zakaz prognoz liczbowych zostaje — uzasadnia go
teraz brak okresu porównawczego i brak zdarzeń konfiguratora, a nie brak samych narzędzi.

**Co zostaje po stronie właściciela:** założenie konta w Bing Webmaster Tools (import z Search
Console), a po najbliższym wdrożeniu jednorazowe `npm run indexnow -- --all`. Do tego czasu
**nic nie zostało zgłoszone** — klucz nie jest jeszcze wdrożony na produkcji, więc każda wysyłka
i tak wróciłaby z 403.

Weryfikacja: `typecheck` i `build` bez błędów. Dry-run na lokalnym serwerze — 14 adresów stron
z sitemapy, bez adresów obrazów (`<image:loc>` nie wchodzi do listy), plik klucza zwraca 200
i zgadza się co do znaku, okno `--days 1` zawęża listę do 5 adresów zmienionych 17 sierpnia.
Ścieżki błędne kończą się kodem wyjścia 1, przebieg poprawny — 0, więc skrypt nadaje się do
wpięcia w hook wdrożeniowy.

### 17 sierpnia 2026 — poz. S1: `/o-nas`, przepisanie na polecenie właściciela

**Decyzja właściciela: strona ma być standardową stroną „o nas", a nie kartoteką podmiotu.**
Z pierwszej wersji usunięte zostały trzy sekcje: FAQ („Najczęstsze pytania o sklep Envelopes"),
tabela „Granice oferty" („Czego Envelopes nie robi") i tabela „Dane rejestrowe i kontaktowe".
Treść przepisana w liczbie mnogiej jako opis **marki**, nie osoby właściciela, i oczyszczona
z parametrów oferty — bez kwot, wymiarów, terminów, progów i liczby odcieni.

Struktura po zmianie: hero, pasek czterech korzyści, „Kim jesteśmy" (proza), „Dla kogo
pracujemy" (cztery potrzeby klienta), „Dlaczego Envelopes" (sześć korzyści), „Czym się
zajmujemy" (rozdzielacz ruchu do czterech filarów + kadry), CTA końcowe.

Konsekwencje w innych plikach:
- `ABOUT_FAQ_ITEMS` usunięte z `src/lib/faq.ts` — zestaw nie miał drugiego odbiorcy, więc plik
  wrócił do stanu sprzed poz. S1. `FAQPage` zniknął ze strony; `AboutPage` i `BreadcrumbList`
  zostają.
- `aboutPageJsonLd()` w `src/lib/seo.ts` — zaktualizowane `name`, doprecyzowany komentarz
  o braku `FAQPage`.
- `llms.txt`, kolofon na `/` i karta na `/kontakt` — anchory i noty przestały obiecywać dane
  rejestrowe oraz listę „czego nie robimy".

**Dane rejestrowe mają teraz jednego właściciela: `/kontakt`.** To jest czystsze niż stan
poprzedni, w którym stały w dwóch miejscach — ale kosztuje: strona „O nas" przestała odpowiadać
na zapytania o podmiot („kto prowadzi envelopes.pl", NIP, forma prawna). Te zapytania wracają
do `/kontakt`, gdzie karta „Dane rejestrowe" stoi od początku.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, `/o-nas` nadal prerenderowana
statycznie i obecna w `sitemap.xml`. Render sprawdzony na serwerze deweloperskim — wszystkie
sekcje i odnośniki obecne, konsola bez błędów. Lint nadal niedostępny (`next lint` usunięty
w Next 16, brak konfiguracji ESLint — stan zastany).

---

### 17 sierpnia 2026 — poz. S1: `/o-nas`, wdrożenie pierwotne

**Opublikowane.** Nowa trasa `src/app/o-nas/page.tsx`, prerenderowana statycznie. Zakres
dostawy: H1 + 5 sekcji H2, blok odpowiedzi GEO w leadzie, pasek czterech faktów o podmiocie,
**dwie tabele** (dane rejestrowe i granice oferty), sześć pytań FAQ, trzy kadry z odnośnikiem do
konfiguratora oraz kontekstowe CTA w czterech miejscach strony.

**Po co ta strona w ogóle powstała.** Kupującym w tej niszy bywa asystentka albo office manager,
która wydaje cudze pieniądze i nie może zaliczyć wpadki przed szefem (`knowledge-base.md`,
pkt 2). Zanim wpisze dane do konfiguratora, sprawdza, komu je wpisuje. Domena bez historii nie ma
tego kredytu z góry, a jedyne, czym można go zbudować, są sprawdzalne fakty: kto sprzedaje, pod
jakim numerem, na jakich zasadach i czego świadomie nie robi. Dotąd te dane były rozsypane po
stopce, karcie na `/kontakt` i regulaminie — nigdzie nie stały razem.

**Slug.** `/o-nas` zamiast `/o-firmie`: polski, bez ogonków, myślnik, zgodny z konwencją
pozostałych tras (`/koperty-dl`, `/koperty-na-vouchery`) i zgodny z tym, jak użytkownik pyta
(„envelopes o nas"). `grep` po `keywords.md`, `content-plan.md`, `src/app/` i `src/lib/blog.ts`
nie znalazł ani jednej wzmianki o takiej stronie — pozycja nie była wcześniej zaplanowana, więc
weszła do planu jako S1 w nowej sekcji „Poza fazami".

**Strona nie ma ani jednej kwoty — świadomie.** Zasada „parametr ma jednego właściciela na
stronie" ma tu wariant mocniejszy: strona nie zawiera tabeli, do której kwota mogłaby należeć,
więc każda cena byłaby drugą kopią cudzego parametru. Kontrola na wyrenderowanym HTML-u:
**0 wystąpień kwot**, 3 wystąpienia gramatury (wyłącznie podpisy kadrów generowane
z `catalog.ts`), 3 wystąpienia wymiaru w milimetrach — jedno w anchorze do F3 i dwa w wierszu
tabeli o formatach zapowiedzianych. Wszystkie dane rejestrowe czytane z `CONTACT_DETAILS`,
nie wpisane.

**Najmocniejszy materiał strony to tabela ośmiu rzeczy, których nie robimy.** Brak sklepu
stacjonarnego i odbioru osobistego, brak formatów poza DL, brak okienka adresowego, brak rabatów
ilościowych i progu darmowej dostawy, brak portfolio z realizacjami klientów, brak projektowania
logo, brak wzornika i próbek, brak papeterii i wkładek. Zaprzeczenie działa na modele lepiej niż
kolejne zdanie o tym, co jest — ta sama zasada, co sekcja „Czego Envelopes nie oferuje"
w `/llms.txt`, tyle że tutaj każdy wiersz ma drugą kolumnę: co to oznacza dla zamówienia.

Antykanibalizacja:
- **wobec `/kontakt`:** tamta strona obsługuje **zadanie** (napisać, zadzwonić, wysłać zapytanie
  o wycenę) i ma formularz; ta obsługuje **weryfikację podmiotu** i formularza nie ma. Karta
  „Dane rejestrowe" na `/kontakt` zostaje nietknięta, dostała tylko odnośnik w dół.
- **wobec czterech filarów:** żaden nagłówek nie powtarza nagłówka filara, a wszystkie cztery
  usługi opisane są jednym akapitem z anchorem będącym frazą filara.
- **wobec `/regulamin`:** prawo odstąpienia pada w jednym zdaniu i w roli skutku, z odesłaniem;
  strona nie przepisuje paragrafów.
- **`FAQPage` bez kolizji:** sześć pytań dotyczy wyłącznie sprzedawcy — kto prowadzi sklep, czy
  jest punkt stacjonarny, jaki obszar sprzedaży, czy sprzedajemy tylko firmom, skąd pochodzą
  zdjęcia nadruków, jak szybko odpowiadamy. Ani jedno nie dotyczy ceny, formatu, wymiaru, plików
  ani MOQ. Skan `src/lib/faq.ts` nie wykazał powtórzonego pytania w żadnym z sześciu zestawów.

**Dane strukturalne: nowy typ w projekcie.** `aboutPageJsonLd()` emituje `AboutPage`
z `mainEntity` i `about` wskazującymi na `#organization`. Kierunek jest odwrotny niż we
wszystkich pozostałych blokach: tam koperta odwołuje się do firmy jako sprzedawcy, tu firma jest
tematem strony. Bez tego powiązania „O nas" jest dla parsera anonimowym tekstem. Świadomie bez
`Product`, `Offer` i `HowTo`.

**Karta OG** `public/images/og/o-nas.jpg` (1200 × 630, 40 kB) w układzie pozostałych dziesięciu
kart, na zbliżeniu złotego papieru metalicznego (master z `.data/source-images/`) — kadr, którego
żadna inna karta nie używa, więc podglądy odnośników się nie powtarzają. Wiersz faktów pod kreską niesie nazwisko i NIP, czyli dokładnie to, po co
użytkownik na tę stronę wchodzi. Strona jako jedyna w serwisie nadpisuje też `twitter.images`:
`layout.tsx` ustawia je globalnie na kartę strony głównej, a Next scala te obiekty płytko.

Linkowanie w obie strony:
- **do strony:** stopka (kolumna „Informacje", nad regulaminem — sąsiaduje z dokumentami,
  w których występują te same dane rejestrowe); `/` — kolofon w sekcji „Więcej o kopertach";
  `/kontakt` — karta „Dane rejestrowe"; `/llms.txt` — mapa dla modeli.
- **ze strony:** cztery filary (anchory = ich frazy główne), `/kontakt`, `/regulamin`, `/blog`
  oraz cztery wejścia do konfiguratora, w tym jedno z preselekcją nadruku.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **37/37 stron statycznie**,
`/o-nas` prerenderowana i obecna w `sitemap.xml` z `lastModified` 2026-08-17 oraz z trzema
obrazami. `title` 50 znaków z sufiksem marki, `description` 150, jeden `<h1>`, 6 `<h2>`,
JSON-LD `AboutPage` + `FAQPage` + `BreadcrumbList` obok globalnego węzła firmy. Na serwerze
produkcyjnym 200 dla `/o-nas`, `/kontakt`, `/`, `/llms.txt` i pliku karty OG. **`npm run lint`
nie przeszedł — nie z powodu błędów w kodzie:** `next lint` został usunięty w Next 16, a projekt
nie ma konfiguracji ESLint, więc polecenie kończy się komunikatem o nieistniejącym katalogu.
**Podglądu w przeglądarce nie było** — render sprawdzony na HTML-u z serwera produkcyjnego
(cała treść, obie tabele, wszystkie odnośniki i FAQ obecne bez JS).

### 17 sierpnia 2026 — decyzja właściciela: żadnych kwot w tytułach

**Obowiązuje od teraz.** W `title`, `og:title`, H1 i nagłówkach H2 nie umieszczamy cen ani kwot.
Uzasadnienie właściciela: „to wygląda źle i nienaturalnie". Zakaz dotyczy konkretnych kwot
(2,58 zł, 1,99 zł, „od 4,57 zł"), a nie słów `cennik` i `ile kosztuje` — te są frazą docelową
i zostają. W `description` kwota jest dopuszczalna, ale liczy się do limitu konkretów: jedna,
nie trzy. Kwota ma jedno miejsce — cennik, tabelę i pasek faktów.

Audyt wszystkich tras publicznych wykazał **trzy tytuły z kwotą** i wszystkie zostały poprawione:

| Trasa | Było | Jest |
| --- | --- | --- |
| `/` | Koperty ozdobne i kolorowe DL od 2,58 zł | …DL w 19 kolorach (55 zn.) |
| `/koperty-z-nadrukiem` | Koperty z nadrukiem logo — 4,57 zł/szt. | …logo firmowego od 10 sztuk (58 zn.) |
| `/koperty-personalizowane` | Personalizowane koperty — adresowanie 5,57 zł | Personalizowane koperty i adresowanie kopert (56 zn.) |

Sprawdzone i **czyste**: wszystkie `openGraph.title` (żaden nie zawierał kwoty), nagłówki H1–H3
we wszystkich trasach i komponentach, nagłówki sekcji we wszystkich wpisach blogowych oraz teksty
tytułowe na dziewięciu kartach OG. Paski faktów (`usp-bar`) i podpisy kart usług zachowują kwoty
— to nie są nagłówki, tylko właśnie te miejsca, do których cena należy. Karta OG filara F1 ma
kwotę w wierszu faktów pod kreską, nie w tytule, więc zostaje bez zmian.

**Do potwierdzenia przez właściciela:** zasada nie została dopisana do briefu agenta
(`.claude/agents/seo-geo-strategist.md`), bo to plik konfiguracyjny agenta — zmieniam go wyłącznie
na bezpośrednie polecenie właściciela, nie na podstawie wiadomości od innego agenta. Do czasu
dopisania zasada żyje w tym dzienniku.

### 17 sierpnia 2026 — poz. 9: `/blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia`

**Opublikowane.** Nowy wpis w `POSTS` (`src/lib/blog.ts`), prerenderowany statycznie. Zakres
dostawy: H1 + 7 sekcji H2, blok odpowiedzi GEO w leadzie, **trzy tabele faktów**, lista kontrolna
na siedem punktów, kontekstowe CTA wchodzące do konfiguratora z `format=DL&nadruk=1`, link w górę
do filara F1 przez pole `pillar`. Tekst 1 059 słów w sekcjach, czas czytania 6 minut.

**Fraza cenowa dostała jednego właściciela.** `koperty z nadrukiem cena` była dotąd w `keywords`
filara F1 i jednocześnie planowana jako fraza główna tej pozycji. Fraza przeszła do wpisu, a filar
dostał w zamian `koperty z własnym nadrukiem`. Filar nie traci przy tym nic realnego: sekcja
`#cena` z tabelą składników i pytanie „Ile kosztuje nadruk logo na kopertach?"
w `PRINT_FAQ_ITEMS` zostają nietknięte — to sekcje strony sprzedażowej, a nie osobny adres
konkurujący o tę samą frazę.

**Oś wpisu to przesunięcie jednostki rozliczenia.** Filar odpowiada na pytanie „ile kosztuje
sztuka" (4,57 zł). Wpis odpowiada na pytanie „ile kosztuje całe zamówienie" i podaje wielkość,
której filar nie liczy nigdzie: **koszt jednej wysłanej koperty razem z rozłożoną dostawą** —
6,57 zł przy dziesięciu sztukach, 4,58 zł przy dwóch tysiącach. To jest liczba, którą decydent
budżetowy wpisuje do pozycji, a nie stawka z cennika.

**Tytuł i slug przepisane w trakcie pracy.** Pierwsza wersja brzmiała „Ile kosztuje 100 kopert
z nadrukiem logo" i celowała w zapytania z podanym nakładem. Decyzja właściciela z tego samego
dnia (wpis wyżej) wyklucza liczbę w tytule, więc tytuł, slug, pierwszy nagłówek H2 i tekst na
karcie OG powstały od nowa. Wersja z liczbą nie została nigdzie opublikowana.

**Druga rzecz, której nie ma nigdzie indziej: tabela pozycji, których nie doliczamy.** Osiem
wierszy — opłata przygotowawcza i matryca, wizualizacja, kolejne wersje wizualizacji, papier
perłowy i metaliczny, nadruk na ciemnym papierze, minimalna wartość zamówienia, rabat ilościowy,
projekt logo od zera. Dwa wiersze są świadomie na niekorzyść oferty: rabatów ilościowych nie
stosujemy, a logo drukujemy, nie projektujemy. Zaprzeczenie działa na modele lepiej niż kolejne
zdanie o tym, co jest — ta sama zasada, co sekcja „Czego Envelopes nie oferuje" w `/llms.txt`.

Antykanibalizacja:
- **wobec F1 `/koperty-z-nadrukiem`:** żaden H2 nie powtarza nagłówka filara — najbliższy,
  „Ile kosztuje zamówienie kopert z nadrukiem", różni się od filarowego „Ile kosztują koperty
  z nadrukiem" dokładnie tym słowem, które niesie różnicę intencji. Tabela nakładów ma
  inną oś (koszt sztuki z dostawą, nie wartość zamówienia), inne progi (10 / 25 / 50 / 100 / 250 /
  500 / 1 000 / 2 000 wobec 10 / 100 / 500 / 1 000) i inną ostatnią kolumnę. Sekcji „Dla kogo"
  wpis nie ma w ogóle.
- **wobec poz. 46 (MOQ od 10 sztuk):** próg pada **raz**, jako fakt w zdaniu „zamówienie
  z nadrukiem zaczyna się od 10 sztuk", bez ani jednego zdania uzasadnienia. Uzasadnienie zostaje
  materiałem poz. 46.
- **wobec poz. 16 (ekspres):** dopłata stoi w jednym wierszu tabeli opcji, bez liczby dni, bez
  momentu, od którego termin biegnie, i bez akapitu „kiedy się opłaca".
- **wobec poz. 45 (faktura i odroczony termin):** dwa zdania faktu — faktura VAT do każdego
  zamówienia, odroczony termin 14 dni wyłącznie dla instytucji publicznych i urzędów.
- **wobec poz. 7 (pliki do druku):** zero wymagań plikowych; wizualizacja występuje wyłącznie
  jako pozycja kosztowa, której nie ma.
- **`FAQPage` zostaje wyłącznie na filarze** — wpis nie dostaje własnych danych, mimo że dwie
  sekcje mają formę pytań (zasada z poz. 7 i 8).

**Wszystkie kwoty są liczone, nie wpisane.** Lead, intro, akapity, obie tabele cenowe i lista
kontrolna powstają z `DEFAULT_PRICING` przez `calculatePrice` — łącznie z kolumnami „koszt jednej
koperty" i „w tym dostawa", które są ilorazami. Zmiana cennika przepisuje wpis razem
z konfiguratorem. `blog.ts` importuje w tym celu `pricing.ts` po raz pierwszy.

**Zdanie poprawione na etapie weryfikacji.** Pierwsza wersja mówiła, że „faktura ma dwie pozycje:
koperty z nadrukiem i jedną przesyłkę kurierską". `documents.ts` wypisuje jednak **każdą pozycję
zamówienia** osobno i dopiero pod nimi wiersz „Dostawa", więc przy zamówieniu z dwoma
konfiguracjami zdanie byłoby nieprawdziwe. Akapit mówi teraz o pozycjach zamówienia i osobnym
wierszu z kosztem dostawy.

**Kalibracja tonu — sekcja przepisana po teście policzalnym.** Sekcja otwierająca miała pięć kwot
w prozie, bo powtarzała za intro wartość zamówienia i koszt dostawy. Po przepisaniu żadna sekcja
nie ma w prozie więcej niż trzy parametry: `sto-kopert` 3, `dostawa` 3, `netto-brutto` 3, reszta
0–2. Liczby, które wypadły z prozy, i tak stoją w tabelach — czyli tam, gdzie mają stać.

Linkowanie w obie strony:
- **do wpisu:** `/koperty-z-nadrukiem` ×2 — akapit pod tabelą wartości zamówienia w sekcji `#cena`
  oraz sekcja „Poradniki"; `/` — siatka blogowa (**trzecia karta z trzech wypełniona**, obserwacja
  z 15 sierpnia domknięta); `/blog` — listing; `/llms.txt` — mapa dla modeli. Anchor kontekstowy
  brzmi `cena kopert z nadrukiem i koszt zamówienia`, czyli frazą wpisu, a nie frazą filara.
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `koperty z nadrukiem`) oraz stopka.
- Sekcja „Poradniki" na F1 przełącza się teraz na `grid grid-2` poniżej trzech wpisów — przy
  dwóch kartach siatka trzykolumnowa zostawiałaby pustą kolumnę.

**Nowy obraz wyróżniający** `public/images/og/blog-koszt-zamowienia-z-nadrukiem.jpg`
(1200 × 630, 98 kB) w układzie pozostałych dziewięciu kart OG. Kadr `zastosowania/eko-koperta-dl-
nadruk-logo-palarni-kawy` przycięty tak, że **przykładowa nazwa firmy nie jest widoczna** — karta
OG krąży bez kontekstu strony, a zdanie o przykładowych nadrukach zostaje na stronie. Z tego
samego powodu nie użyliśmy kadru kancelaryjnego: stoi już na karcie OG filara F1 i dwa adresy
miałyby wizualnie ten sam podgląd.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **36/36 stron statycznie**,
wpis prerenderowany (`● /blog/cena-kopert-z-nadrukiem-i-koszt-zamowienia`), obecny w `sitemap.xml`
z `lastModified` 2026-08-17 i z dwoma obrazami, które zwracają 200. `title` 54 znaki (z sufiksem
marki), `description` 147 znaków, jeden `<h1>`, 7 `<h2>` treściowych, 3 tabele z 96 komórkami
opisanymi `data-label`, JSON-LD `Article` + `BreadcrumbList` (**bez `FAQPage`**), `Article.image`
wskazuje na nowy kadr OG. CTA prowadzi do `/?format=DL&nadruk=1#konfigurator`. `PAGE_UPDATED`
podbite dla `/koperty-z-nadrukiem` i `/blog`. Serwer produkcyjny zwraca 200 dla wpisu i dla
wszystkich stron, na których dołożono linki. **Podglądu w przeglądarce nie było** — w tej sesji
nie było dostępnego narzędzia podglądu, więc render sprawdzony na HTML-u z serwera produkcyjnego
(treść, tabele i oba odnośniki obecne bez JS).

### 16 sierpnia 2026 — graf encji, polityka zwrotów, `llms.txt` i sitemapa obrazów

**Pięć zmian technicznych, żadnej zmiany treści.** Audyt wskazał luki, których nie widać
w przeglądarce, a które decydują o tym, jak serwis jest opisany dla wyszukiwarki i dla modeli.

**1. Martwy odsyłacz w danych `Article`.** `articleJsonLd()` wskazywał `publisher.logo.url`
na `${SITE_URL}/logo.svg` — pliku, którego w `public/` nigdy nie było. Każdy wpis blogowy
wysyłał Google 404 w polu wymaganym dla wyniku rozszerzonego. Logo stoi teraz raz, na węźle
firmy, jako `ImageObject` z wymiarami pliku `logo-icon.png` (295 × 221).

**2. Graf encji zamiast luźnych bloków.** Osiem funkcji JSON-LD emitowało osobne, anonimowe
węzły: `Product.seller`, `Article.publisher` i `WebSite.publisher` opisywały tę samą firmę
trzy razy, nie wiedząc o sobie nawzajem. Wprowadzone `@id` (`#organization`, `#brand`,
`#website`, `#logo`, `<url>#product`) i odwołania zamiast powtórzeń. Węzeł firmy ma typ
`['Organization', 'OnlineStore']`, doszły `currenciesAccepted`, `paymentAccepted` i `areaServed`.
`sameAs` nadal nieobecne — profili społecznościowych nie ma, a pusta tablica jest sygnałem
gorszym niż brak pola.

**3. Oferta opisana tak, jak wymaga tego wynik produktowy.** Doszły `hasMerchantReturnPolicy`,
`shippingDetails.deliveryTime`, `priceValidUntil` i `sku`. **Polityka zwrotów nie jest jedna** —
koperta gładka ma 14 dni na odstąpienie (`MerchantReturnFiniteReturnWindow`, koszt odesłania
po stronie Klienta), a koperta z nadrukiem i z personalizacją jest z odstąpienia wyłączona jako
rzecz wykonana na indywidualne zamówienie (`MerchantReturnNotPermitted`, §12 ust. 5 regulaminu).
Dlatego pole dostają **wyłącznie strony z pojedynczym `Offer`** (F1, F2, F3). Widełki na `/`
i na `/koperty-na-vouchery` obejmują obie kategorie naraz, więc jedna polityka opisałaby połowę
zakresu fałszywie — a Google i tak czyta to pole tylko z `Offer`, nigdy z `AggregateOffer`.
Z tego samego powodu widełki nie dostają `sku` ani `priceValidUntil`.

**Pole, które zostaje otwarte: `transitTime`.** Czasu przewozu nie ma w żadnym źródle
w projekcie — regulamin mówi tylko „za pośrednictwem firmy kurierskiej", a `pricing.ts` zna
wyłącznie dni realizacji. Wpisanie „1–2 dni" byłoby deklaracją bez pokrycia w miejscu, z którego
Google liczy obiecywaną datę doręczenia. Zadeklarowany jest sam `handlingTime` (2 dni dla kopert
gładkich, 2–5 dla produkcyjnych) i dni robocze. Do domknięcia po potwierdzeniu przewoźnika.

**4. `/llms.txt` jako trasa, nie plik.** Komplet twardych faktów — format, paleta, cennik, MOQ,
terminy, wymagania plikowe, płatności — w jednym miejscu, bez interfejsu wokół. Wszystkie liczby
czytane z `pricing.ts` i `catalog.ts`, więc zmiana cennika przepisuje dokument razem
z konfiguratorem; plik statyczny rozjechałby się przy pierwszej zmianie ceny i nikt by tego nie
zauważył. Osobna sekcja **„Czego Envelopes nie oferuje"** — brak okienka, brak odbioru
osobistego, brak rabatów ilościowych, brak formatów poza DL, brak zwrotu przy nadruku. Modele
wypełniają luki tym, co typowe dla branży, więc zaprzeczenie działa lepiej niż kolejne zdanie
o tym, co jest.

**5. Sitemapa: `lastModified` i obrazy.** Strony statyczne nie miały daty w ogóle. Daty pochodzą
z tego dziennika i są wpisane ręcznie w `PAGE_UPDATED` — **zmiana treści strony wymaga podbicia
daty tam**. Odrzucone: `mtime` pliku źródłowego i data budowania, bo na hostingu obie dają
wszystkim stronom jedną datę zmieniającą się przy każdym deployu; niewiarygodny `lastmod` jest
powodem, dla którego Google przestaje go czytać dla całej domeny. Dokumenty prawne biorą datę
z `TERMS.updated`, więc zmiana regulaminu przepisuje sitemapę sama.

Doszła **sitemapa obrazów: 74 unikalne kadry** w 12 adresach. To jedyny kanał, którym zdjęcia
katalogowe i aranżacyjne trafiają do Grafiki Google — wszystkie ładowane są leniwie i część
leży poniżej pierwszego ekranu, a nazwy plików i alty zostały pod te zapytania przygotowane
15 sierpnia. Zestawy odpowiadają temu, co strona **faktycznie renderuje**: stąd sami bestsellerzy
dla `/koperty-dl` i sześć odcieni dla F4. `VOUCHER_COLOR_IDS` przeniesione z komponentu strony
do `showcase.ts`, bo dwie kopie tej samej listy rozjechałyby się przy pierwszej zmianie doboru.
Zbliżenia z `public/images/details/` pominięte — dekoracyjne, a ich lista mieszka w komponencie.

Weryfikacja: `typecheck` i `build` bez błędów, 12 tras statycznych w sitemapie, `/llms.txt`
prerenderowany jako statyczny. Na serwerze produkcyjnym: **wszystkie 74 obrazy z sitemapy
zwracają 200**, `logo-icon.png` 200, zero referencji do `logo.svg` w kodzie. JSON-LD sprawdzony
na trzech trasach — `/koperty-dl` (`sku ENV-DL`, 14 dni zwrotu, handling 2–2),
`/koperty-z-nadrukiem` (`sku ENV-DL-NADRUK`, zwrot niedozwolony, handling 2–5) i wpis blogowy
(`author` i `publisher` jako referencje do węzła firmy). Widełki na `/` bez polityki zwrotów
i bez `sku`, zgodnie z decyzją wyżej.

### 16 sierpnia 2026 — decyzja właściciela: ton treści i zamknięcie luki produktowej

**Dwie rzeczy naraz, bo jedna wynikała z drugiej.**

**1. Luka produktowa zamknięta — personalizacja ma teraz zakres.** Walidacja arkusza wymagała
pełnego adresu w każdym wierszu, więc lista samych nazwisk nie przechodziła plikiem. Przy
kilkuset imionach zostawało wklejanie do pola tekstowego, bez sprawdzenia liczby wpisów.

Konfigurator zadaje teraz dwa pytania zamiast jednego: **co** ma stanąć na kopercie (pełny adres
albo samo imię i nazwisko) i dopiero potem **jak** dane trafią do nas (ręcznie albo arkuszem).
Zakres ustawia kolumny szablonu i pola wymagane w walidacji — jedno źródło prawdy
`PERSONALIZATION_SCOPES` w `catalog.ts`, z którego korzystają generator XLSX, walidacja, obie
tabele na F2 i wiersz specyfikacji. Wariant imienny nie ma pól adresowych, więc lista nazwisk
przechodzi tą samą drogą co lista wysyłkowa.

Dołożone przy okazji: licznik wierszy w trybie ręcznym (sygnalizuje różnicę wobec nakładu, nie
blokuje — czasem ta sama treść ma iść na wszystkie koperty), `zakres` w `ConfigureLink`
i w preselekcji z adresu, zakres widoczny w koszyku, panelu klienta, panelu admina i w mailu do
produkcji. Helper `plural()` w `pricing.ts` — komunikaty pisały „3 wierszy" i „2 kopert".

**2. Ton treści — przegląd całego serwisu.** Właściciel: treści brzmiały jak „rocket science
wycenowo gramaturowo paletowo barwny". Diagnoza potwierdziła zarzut — cena występowała
41 razy na F1 i 44 razy na F2, a parametry wracały w akapitach, które nie były o parametrach.

Źródłem był brief, nie przypadek. Pkt 10.1.3 kazał zamieniać **każdy** przymiotnik na parametr
(„przymiotnik bez liczby to zdanie do wykreślenia"), pkt 6.3 kazał nazywać encję jako
„koperta DL 110 × 220 mm", a test końcowy kazał wstawiać liczby w miejsce usuniętych
przymiotników. Zastosowane literalnie w każdym zdaniu dały dokładnie to, co właściciel odrzucił.

Przepisane: karty branżowe na F1 (10), F2 (10) i F4 (10), karty zastosowań na `/` (6), leady
wszystkich czterech filarów, wstępy sekcji kolorów na F1, F2 i F4, sekcja „Więcej o kopertach"
na `/`, pięć metaopisów oraz cztery odpowiedzi FAQ. Zasada: **parametr ma jednego właściciela
na stronie** — stoi w tabeli, pasku faktów, wierszu specyfikacji albo w leadzie, a proza wokół
się do niego nie cofa. Tabele, cenniki i paski faktów zostały nietknięte; to tam liczby mają być.

**Naprawione przy okazji.** Sekcja „Cennik" na `/` miała nagłówek „Wartość zamówienia kopert
gładkich — przykłady" i zdanie „Poniższe kwoty dotyczą…", a pod nimi nie było żadnej tabeli —
ten sam typ usterki co pusta luka po tabeli formatów opisana 14 sierpnia. Nagłówek i zapowiedź
usunięte, treść scalona w dwa akapity.

**Zmiany w briefie agenta** (`.claude/agents/seo-geo-strategist.md`), żeby błąd nie wrócił:
przepisany pkt 10.1.3, trzy nowe zasady twarde (10–12: właściciel parametru, budżet jeden na
akapit, sekcja mówi o rzeczy, a nie o cenniku rzeczy), przeredagowane pkt 6.2 i 6.3, nowa tabela
„Kalibracja w drugą stronę — przeparametryzowanie" z czterema realnymi przykładami z tego
przeglądu, cztery testy końcowe zamiast jednego (w tym test czytania na głos i test policzalny),
limit konkretów w `description`. Usunięty też przykład w tabeli kalibracji, który pokazywał
**wymyśloną realizację** („Kancelaria z Poznania zamawia kwartalnie 3 000 kopert") jako wzór do
naśladowania — sprzeczny z pkt 4.1 i z decyzją przy poz. 47.

**Treść, która przestała być prawdziwa.** Wpis z poz. 8 był zbudowany wokół zniesionego
ograniczenia — jego oś brzmiała „arkusz nie przyjmie listy samych imion, więc idzie trybem
ręcznym". Przepisane: lead, intro, sekcja „Pierwsze pytanie", obie tabele w tej sekcji, akapit
o kontroli liczby wpisów i lista kontrolna. Nowa oś: zakres to pytanie osobne od trybu, a o trybie
decyduje źródło danych. Podobnie dwie odpowiedzi w `PERSONALIZATION_FAQ_ITEMS` i jedna
w `VOUCHER_FAQ_ITEMS`; doszło pytanie „Czy mogę zamówić koperty z samym imieniem, bez adresu?".

Weryfikacja: `typecheck` i `build` bez błędów, 34/34 strony statycznie. Sześć przypadków
walidacji sprawdzonych na działającym serwerze — lista nazwisk w wariancie imiennym przechodzi
(200), ta sama lista w wariancie adresowym odrzucona (422), pełne adresy bez regresji, żądanie
bez parametru `zakres` zachowuje się jak dotąd, kontrola liczby wierszy działa w obu wariantach,
generator zwraca arkusz „Odbiorcy" z czterema kolumnami. W przeglądarce: preselekcja
`?zakres=imiona` zaznacza właściwą kartę, link do szablonu niesie zakres, licznik wierszy
odmienia się poprawnie (1 wiersz / 3 wiersze / 12 wierszy), konsola czysta. Metadane pięciu
przepisanych tras w normie: title ≤ 57 znaków, description 141–156.

### 16 sierpnia 2026 — poz. 8: `/blog/adresowanie-kopert-z-arkusza-czy-recznie` · **Faza 0 zamknięta**

**Opublikowane.** Nowy wpis w `POSTS` (`src/lib/blog.ts`), prerenderowany pod
`/blog/adresowanie-kopert-z-arkusza-czy-recznie`. Zakres dostawy: H1 + 8 sekcji H2, blok
odpowiedzi GEO w leadzie, **trzy tabele faktów**, lista kontrolna na sześć pytań, kontekstowe CTA
wchodzące do konfiguratora z `format=DL&personalizacja=1`, link w górę do filara F2 przez pole
`pillar` (anchor `adresowanie kopert`). Tekst 1 407 słów, czas czytania 6 minut.

**Oś wpisu to przesunięcie kryterium decyzji.** Filar F2 zestawia oba tryby **według skali**
(„do 30 adresów" kontra „od 100 adresów"). Ten wpis odpowiada na pytanie, co zrobić, gdy sama
liczba kopert niczego nie przesądza — i wskazuje dwa kryteria, których filar nie ma: **co ma
stanąć na kopercie** oraz **gdzie te dane już są**. Zdanie otwierające sekcję pierwszą odsyła do
filara wprost („zestawienie obu trybów według liczby adresów stoi na stronie oferty"), więc treść
nie konkuruje z tabelą filara, tylko ją domyka.

**Najmocniejszy fakt wpisu wyszedł z kodu walidacji, nie z copy.** `POST /api/personalizacja/
walidacja` uznaje wiersz za wypełniony, gdy ma nazwisko **albo** ulicę, a następnie odrzuca cały
plik, jeśli w którymkolwiek takim wierszu brakuje ulicy, kodu pocztowego lub miejscowości.
Konsekwencja, której nie było napisanej nigdzie w serwisie: **arkusz nie przyjmie listy samych
imion**, więc koperty wręczane do ręki (karty powitalne, dyplomy, bony) muszą iść trybem ręcznym.
To jest jednocześnie oś sekcji „Pierwsze pytanie" i pierwszy, wiążący punkt listy kontrolnej.

Z tego samego kodu wyszły trzy dalsze fakty do tabeli „Co zatrzymuje wgranie arkusza": czytamy
**pierwszy arkusz w skoroszycie** (dane z drugiej zakładki są niewidoczne), nagłówki rozpoznajemy
po słowach kluczowych (przemianowana kolumna przestaje być rozpoznawana), a wiersze ukryte
filtrem liczą się razem z widocznymi.

Antykanibalizacja:
- **wobec F2 `/koperty-personalizowane`:** zero cen (2,58 / 2,99 / 5,57 zł), zero MOQ, zero progów
  ilościowych 10 / 100 / 300 / 1 000 i zero tabeli kolumn arkusza. Wymagane pola adresowe padają
  **raz, w jednym zdaniu i w roli skutku** („arkusz nie przyjmie wiersza bez adresu"), a nie jako
  specyfikacja szablonu. Żaden H2 nie powtarza nagłówka z filara.
- **wobec poz. 14 (wzór adresu od firmy):** wpis nie pokazuje układu adresu na kopercie ani
  kolejności wierszy — mówi wyłącznie o tym, którą drogą dane do nas trafiają.
- **wobec poz. 15 (jak przygotować listę):** zero instrukcji przygotowania eksportu, odmiany
  nazwisk i ujednolicania zapisu. Zdanie „eksport wystarczy przenieść do szablonu" jest granicą,
  za którą zaczyna się poz. 15.
- **wobec poz. 16 (ekspres):** termin pojawia się w jednym zdaniu i w roli konsekwencji poprawek
  („każda kolejna wersja przesuwa datę wysyłki"), bez liczby dni i bez dopłaty.
- **`FAQPage` zostaje wyłącznie na filarze.** Wpis nie ma własnych danych `FAQPage`, mimo że dwie
  sekcje mają formę pytań — zasada z poz. 7. Pytanie „W jaki sposób przekazać listę adresów do
  zadrukowania?" w `PERSONALIZATION_FAQ_ITEMS` zostaje nietknięte.

**Slug inny niż tytuł z planu — świadomie.** Plan zapowiadał
`adresowanie-kopert-recznie-czy-z-arkusza` (tak nazywał się usunięty wpis startowy). Fraza
docelowa brzmi jednak `adresowanie kopert z arkusza` i adres niesie ją teraz w całości.
Stary adres zwraca **404** i tak zostaje: to treść usunięta 15 sierpnia bez odpowiednika
w indeksie, więc nie ma czego przekierowywać (ta sama decyzja co przy pozostałych czterech
wpisach startowych).

Linkowanie w obie strony:
- **do wpisu:** `/koperty-personalizowane` ×2 — akapit pod tabelą porównawczą dwóch trybów oraz
  **przywrócona sekcja „Poradniki"**; `/` ×2 — karta usługi „Personalizacja i adresowanie"
  i siatka blogowa; `/blog` — listing. Anchory kontekstowe brzmią `adresowanie kopert z arkusza
  czy ręcznie`, czyli frazą wpisu, a nie frazą filara.
- **z wpisu:** blok „Strona oferty" (pole `pillar`, anchor `adresowanie kopert`) oraz stopka.
- Siatka blogowa na `/` ma teraz **dwie karty z trzech** — obserwacja z 15 sierpnia domknie się
  przy poz. 9.

**Sekcja „Poradniki" wróciła na F2** — była usunięta 15 sierpnia, bo wszystkie jej wpisy przepadły.
Przy jednej pozycji renderuje **pojedynczą kartę `card card-lg`**, a nie siatkę: `grid grid-2`
włącza się dopiero od drugiego wpisu, więc dziś nie ma pustych kolumn. Lista wypełni się przy
poz. 14 i 15. Sekcja na `/koperty-dl` pozostaje usunięta — jej wpisy to poz. 10, 11 i 13.

Zmiany w bibliotekach:
- **`BlogTable` i pole `table` w `BlogSection`** (`blog.ts`) plus renderer w
  `src/app/blog/[slug]/page.tsx`. Wpisy blogowe nie miały dotąd tabel, a tabela specyfikacji jest
  najczęściej ekstrahowaną strukturą przez modele generatywne (brief pkt 6.4). Pierwsza kolumna
  renderuje się jako `th[scope=row]`, komórki dostają `data-label`, więc na telefonie tabela
  przechodzi w karty przez istniejącą klasę `m-cards` — bez nowego CSS-u.
- **`image` w `articleJsonLd()`** (`seo.ts`). `Article` nie miał obrazu, choć obraz wyróżniający
  jest w wytycznych Google warunkiem wyniku rozszerzonego. Wskazuje ten sam kadr co `og:image`,
  z fallbackiem na zbiorczy obraz bloga — poprawka działa wstecz również dla poz. 7.
- Wymagane pola adresowe i lista rozszerzeń arkusza czytane w treści wpisu
  z `PERSONALIZATION_REQUIRED_COLUMNS` i `PERSONALIZATION_SHEET_EXTENSIONS_LABEL`, a nie wpisane
  ręcznie: zmiana szablonu XLSX przepisuje akapit, tabelę i listę kontrolną razem z walidacją.

**Nowy obraz wyróżniający** `public/images/og/blog-adresowanie-z-arkusza.jpg` (1200 × 630, 84 kB)
w układzie pozostałych ośmiu kart OG — kadr `zastosowania/biala-perlowa-koperta-dl-adresowanie-
odbiorcy` z realnym blokiem adresowym, ciemna płachta, nagłówek i dwa wiersze faktów.

**Zdanie usunięte na etapie pisania:** pierwsza wersja mówiła, że plik jest odrzucany „w trzech
sytuacjach". Walidacja zna ich więcej (pusty arkusz, plik nieczytelny), więc zamknięta lista
byłaby nieprawdziwa — akapit wymienia teraz przypadki bez deklarowania ich liczby.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, **34/34 strony statycznie** (o jedną
więcej niż przed publikacją), wpis prerenderowany (`● /blog/adresowanie-kopert-z-arkusza-czy-
recznie`), obecny w `sitemap.xml` z `lastModified` 2026-08-16. `title` 52 znaki, `description`
148 znaków, jeden `<h1>`, 8 `<h2>` treściowych, 3 tabele z 34 komórkami opisanymi `data-label`,
JSON-LD `Article` + `BreadcrumbList` (**bez `FAQPage`**), `Article.image` wskazuje na nowy kadr OG.
CTA prowadzi do `/?format=DL&personalizacja=1#konfigurator`. Serwer produkcyjny zwraca 200 dla
wpisu i dla wszystkich stron, na których dołożono linki; stary slug zwraca 404.
**Podglądu w przeglądarce nie było** — w tej sesji nie było dostępnego narzędzia podglądu, więc
render sprawdzony na HTML-u z serwera produkcyjnego (treść i tabele obecne bez JS).

### 15 sierpnia 2026 — `prints/` i `personalized/`: domknięcie blokady wagi zdjęć

**Wykonane.** 38 plików PNG (**20,21 MB**) → **1,21 MB** w 114 plikach WebP w trzech
szerokościach, **94 % mniej**. Mastery w `.data/source-images/prints/`
i `.data/source-images/personalized/`.

**Nazwy w liczbie mnogiej, spójne z `colors/`,** wyprowadzone z `COLORS[].name`:
`czarne-koperty-z-nadrukiem-dl-320.webp`, `czarne-koperty-personalizowane-dl-320.webp`.
Fraza produktowa w nazwie odpowiada frazie głównej filara — K1 „koperty z nadrukiem",
K2 „koperty personalizowane". Stare nazwy były niespójne nawet między sobą:
`jasnoniebieski-dl-koperta-z-nadrukiem` kontra
`jasnoniebieski-lupkowy-dl-koperta-z-personalizacja`, `jasnozielony-` kontra `jasnozielona-`.

**Znalezione przy okazji — alt opisywał coś, czego na zdjęciu nie ma.** Kadry z `prints/`
**nie pokazują logo**: na przedniej ściance stoi symbol grafiki oznaczający pole nadruku.
`buildImageAlt` mówił „z nadrukiem logo firmowego", a dwie strony pisały o „odcieniach,
w których wykonaliśmy nadruk". Użytkownik Grafiki Google zobaczyłby po kliknięciu co innego
niż w opisie. Alt opisuje teraz zaznaczone pole nadruku, a treść mówi wprost, że logo klienta
trafia w to miejsce po akceptacji wizualizacji.

**Druga nieaktualna obietnica.** Oba filary miały zdanie „Pozostałe kolory — między innymi
Złoty, Srebrna Perłowa i Szarobrązowy — również przyjmują nadruk", odsyłające do palety.
Wszystkie 19 odcieni ma dziś własny kadr w obu katalogach, więc „pozostałe kolory" był zbiorem
pustym, a odsyłacz kierował donikąd. Zastąpione zdaniem o tym, że nadruk przyjmuje cała paleta
w tej samej cenie. Na `/koperty-na-vouchery` zdanie zostaje — tam siatka jest celowo węższa
(6 wybranych odcieni z `VOUCHER_COLOR_IDS`), więc „pozostałe kolory" nadal ma desygnat.

Weryfikacja: `typecheck` i `build` bez błędów (33/33 statycznie), zero martwych referencji
do starych nazw, zero PNG-ów w obu katalogach. W przeglądarce `/koperty-z-nadrukiem` i
`/koperty-personalizowane` renderują po 19 kadrów, każdy pobiera wariant **320 px**, zero
nieudanych żądań, konsola czysta.

**Wynik łączny trzech katalogów: 30,8 MB → 2,1 MB.** Strona główna pobiera dziś
**197 kB obrazów** (41 zasobów, wszystkie załadowane) zamiast ~9 MB odnotowanych w blokadzie.

### 15 sierpnia 2026 — katalog kolorów, alty i obrazy wyróżniające dla wyszukiwarek

**Wykonane, część 1 — `public/images/colors/`.** 19 plików PNG po 400–740 kB
(**10,55 MB**) zamienione na WebP w trzech szerokościach 320 / 640 / 1200 px: **660 kB
w 57 plikach**, czyli **95 % mniej mimo trzech wariantów zamiast jednego**. Wszystko przy
jakości 84, żaden kadr nie musiał zejść niżej. Mastery w `.data/source-images/colors/`,
razem z `Envelopes.psd`, który leżał w katalogu serwowanym.

**Nazwy wzięte z `COLORS[].name`, nie z `id`.** To była realna luka: plik nazywał się
`blekit-lupkowy-koperta-dl.png`, a kolor jest sprzedawany jako **Jeansowy**; `taupe-…`
to **Szarobrązowy**. Nazwa pliku opisywała wewnętrzny identyfikator, a nie frazę, której
klient szuka. Nowa konwencja: **`<kolor>-koperty-ozdobne-dl-<szerokość>.webp`** — kolor w formie
zgodnej z nazwą katalogową, fraza główna klastra K3 w nazwie pliku.

**Liczba mnoga, nie pojedyncza** (decyzja właściciela). Plan celuje we frazy w liczbie mnogiej —
„czarne koperty z logo", „granatowe koperty dl" (poz. 29–36) — a kadr katalogowy pokazuje
**dwie** koperty, więc `koperty` opisuje go dokładniej niż `koperta` i zgadza się z altem
(„Dwie koperty ozdobne DL…"). Formy uzgodnione z rzeczownikiem `koperty`; nazwy nieodmienne
(Matcha, Ecru, Eko) zostają bez zmian.

**Jeden wyjątek: `ciemnozielony`.** Nazwa katalogowa „Butelkowa Zieleń" jest frazą
rzeczownikową i nie ma formy uzgadniającej się z `koperty` — `butelkowa-zielen-koperty-…`
czytałoby się jak sklejka dwóch mianowników. Plik nazywa się `ciemnozielone-koperty-ozdobne-dl`:
przymiotnik z `id` jest tu zarazem poprawny gramatycznie i bliższy temu, jak ten kolor jest
wyszukiwany. To jedyne miejsce, w którym nazwa pliku odchodzi od nazwy katalogowej, i jedyne,
w którym odejście jest uzasadnione.

**Odrzucone przy okazji: dosypanie przymiotników do nazw plików**
(`…-premium-prostokatna-elegancka`). „Premium" i „eleganckie koperty premium" to klaster **K6**
z docelowym URL-em `/koperty-premium`, a „koperta prostokątna" należy do K4 i jest już obsłużona
akapitem na `/koperty-dl` (`keywords.md`). Wstawienie ich do 19 nazw plików na stronie głównej
byłoby kanibalizacją dwóch klastrów naraz i keyword stuffingiem (brief pkt 4.3), a identyczny
ogon w każdej nazwie odbierałby plikom to, do czego nazwa faktycznie służy — rozróżnialność.

**`srcSet` wpięty w komponenty, bo bez tego oszczędność byłaby pozorna.** Swatch
w konfiguratorze ma **202 px** i pobierał plik **1200 px** — dziewiętnaście razy na jednym
ekranie. Teraz pobiera wariant 320 px (2 kB). `EnvelopePlaceholder` dostał `sizes` policzone
z siatki czterokolumnowej. `colorImageSrcSet()` zwraca `undefined` dla adresów spoza
konwencji, więc zdjęcia z `prints/` i `personalized/` przechodzą przez ten sam komponent
bez wyjątków w kodzie wywołującym.

**`buildImageAlt` przepisany.** Poprzedni alt („Koperta ozdobna, format DL, kolor czarny")
był poprawny, ale nie odróżniał tego zdjęcia od żadnego innego zdjęcia koperty w tym kolorze.
Nowy opisuje kadr — dwie koperty na białym tle, widok klapki i tylnej ścianki — i dokłada
gramaturę oraz wykończenie z katalogu. Nazwa koloru stoi **po dwukropku, w mianowniku**:
odmiana wymagałaby mapy przypadków, bo `COLORS[].name` miesza rodzaje (Czarny, Szara, Matcha,
Butelkowa Zieleń, Ecru) i żadna pojedyncza końcówka nie jest poprawna dla wszystkich.

**Wykonane, część 2 — obrazy wyróżniające.** Audyt wykazał, że **żadna trasa w serwisie nie
miała `og:image`**, mimo zadeklarowanej karty `summary_large_image`. Podgląd odnośnika
w wyszukiwarce, na Facebooku, LinkedInie i w komunikatorach renderował się jako goły tekst.

Osiem kadrów **1200 × 630** (proporcja 1,91:1 wymagana przez dużą kartę) w `public/images/og/`,
łącznie 904 kB. Każdy to zdjęcie produktowe z gradientem, nazwą sekcji, nagłówkiem i dwoma
wierszami faktów. **Liczby na obrazach czytane są z `pricing.ts` i `catalog.ts`** przez skrypt
generujący — obraz OG siedzi w cache'u Facebooka długo po zmianie cennika, więc wpisana ręcznie
cena rozjechałaby się trwale i niewidocznie. Strona główna dostała siatkę sześciu kolorów
zamiast jednego zdjęcia, bo „19 kolorów w jednej cenie" to jedyny komunikat, który odróżnia
ją od filarów, a pojedynczy kadr tego nie powie.

Domyślny obraz stoi w `layout.tsx`, więc trasa bez własnej deklaracji nie wychodzi z pustą kartą.
Wpisy blogowe dostały pola `ogImageSlug` i `ogImageAlt` z fallbackiem na kadr listy blogowej.

**Metadane doprowadzone do normy na wszystkich ośmiu trasach publicznych** — wcześniej cztery
były poza progami wyświetlania:

| Trasa | Było | Jest |
| --- | --- | --- |
| `/koperty-dl` | title 65 zn., desc 163 zn. | 48 / 154 |
| `/blog` | title 68 zn. | 52 |
| `/koperty-z-nadrukiem` | title 61 zn., desc 157 zn. | 54 / 151 |
| `/kontakt` | desc 97 zn., OG bez opisu | 155, OG z opisem i progiem wyceny |

**Poprawione przy okazji.** Opis `/blog` obiecywał „realizacje klientów" — wpisy tego typu
zostały z bloga usunięte 15 sierpnia. Zapowiadanie w wyniku wyszukiwania treści, której na
stronie nie ma, to obietnica bez pokrycia i najkrótsza droga do powrotu do wyników.

Weryfikacja: `typecheck` i `build` bez błędów (33/33 statycznie). W przeglądarce wszystkie
19 swatchy pobiera wariant **320 px** zamiast 1200 px, zero nieudanych żądań, stare nazwy
zwracają 404 i nie ma do nich referencji w kodzie. Wszystkie 8 tras ma `og:image`
i `twitter:image`, title ≤ 60 znaków i description w przedziale 140–156.

**Blokada „zdjęcia produktowe to PNG po 0,5–0,75 MB" — częściowo zamknięta.** `colors/`
zeszło z 10,55 MB do 660 kB. **Otwarte zostają `prints/` (5,9 MB) i `personalized/` (6,0 MB)** —
dwanaście megabajtów w PNG, ładowane na stronie głównej i na dwóch filarach. Ta sama ścieżka
co przy `colors/` załatwi je bez zmian w komponentach, bo `colorImageSrcSet()` jest już wpięty
i zacznie zwracać `srcSet`, gdy tylko pliki wejdą w konwencję.

### 15 sierpnia 2026 — 15 zdjęć aranżacyjnych: `public/images/zastosowania/`

**Wykonane.** Właściciel wrzucił 15 plików roboczych (`1.jpg`…`15.png`, 44 MB) do
`public/images/new-images/`. Przeprowadzone przez pełną ścieżkę z pkt 5.6 briefu.

**Kolor katalogowy ustalony pomiarem, nie na oko.** Dla każdego kadru policzona mediana barwy
centralnego wycinka w przestrzeni Lab i porównana z tak samo zmierzonymi zdjęciami
z `public/images/colors/`. Pomiar rozstrzygnął dwa przypadki, w których oko myli się
systematycznie: `11.png` to **Niebieski**, nie Granatowy (ΔE 6,5 vs 21,2), a `15.png` odwrotnie —
**Granatowy** (ΔE 4,4). Trzy biele (`2`, `8`, `12`) pomiar wskazał jako Biały, ale zbliżenie
pokazało wyraźne ziarno perłowe, więc weszły jako **Biała Perłowa** — pomiar rozstrzyga odcień,
nie wykończenie.

**Optymalizacja.** 44 MB → **1,72 MB** w 30 plikach WebP (dwie szerokości do `srcSet`).
Jakość dobierana adaptacyjnie pod budżet z briefu: wszystkie warianty 1024 px ≤ 120 kB
(najcięższy 117 kB), wszystkie 512 px ≤ 30 kB. Mastery przeniesione do
`.data/source-images/zastosowania/` (`.data` jest w `.gitignore`) — `public/images/new-images/`
nie istnieje.

**Dlaczego osobny katalog, a nie `catalog.ts`.** Cztery odcienie z tych kadrów nie mają dziś
zdjęcia z nadrukiem w katalogu (Biała Perłowa, Złoty, Szarobrązowy, Eko), więc kusiło, żeby
dopisać je do `printImages`. Świadomie nie: te pliki mają tło z drewna, marmuru i trawy, a
`printImages` zasila podgląd w konfiguratorze i swatch koloru, gdzie tło zaburzyłoby ocenę
papieru. Kadry aranżacyjne żyją w `src/lib/showcase.ts` i służą wyłącznie treści.

**Rozmieszczenie** — 19 miejsc, 15 unikalnych plików (4 współdzielone przez F1 i F4):

| Strona | Kadry | Miejsce |
| --- | --- | --- |
| `/koperty-z-nadrukiem` | 8 branżowych + 1 pole nadruku | nowa sekcja `#przyklady`; kadr z polem nadruku przy akapicie o marginesie bezpiecznym |
| `/koperty-personalizowane` | 3 | pod kartami „Co drukujemy", w tej samej kolejności co karty |
| `/koperty-na-vouchery` | 4 (współdzielone z F1) | H3 w sekcji `#kolory` |
| `/` | 3 okolicznościowe | H3 w sekcji `#zastosowania` |

**Każdy kadr jest odnośnikiem do konfiguratora** przez `ConfigureLink` z preselekcją koloru
i usługi — ciągłość intencji z pkt 7, a nie dekoracja.

**Nazwy firm na nadrukach są przykładowe** (Kancelaria Prawna Tomasz Wiśniewski, LUNA SPA,
ROGI Steakhouse, ZIARNO i inne). Wszystkie trzy galerie mają pod spodem zdanie mówiące to
wprost, a treść nigdzie nie nazywa ich realizacjami. Podpisanie ich jako zrealizowanych
zamówień powtórzyłoby błąd z `realizacja-3000-kopert-dl-dla-kancelarii` (pkt 4.1).
**Poz. 28 i 47 planu nadal wymagają realnego zamówienia** — te zdjęcia ich nie odblokowują.

**Naprawione przy okazji — podwójny ukośnik we wszystkich adresach kanonicznych.**
`.env.local` ma `NEXT_PUBLIC_SITE_URL=https://envelopes.pl/` z ukośnikiem na końcu, a każde
użycie stałej ma postać `${SITE_URL}/ścieżka`. Efekt: `https://envelopes.pl//koperty-dl`
w sitemapie, w `robots.host`, w `image` danych strukturalnych, w linkach e-mail i w adresach
powrotnych Przelewy24 — dla wyszukiwarki inny adres niż kanoniczny. `SITE_URL` ucina teraz
końcowe ukośniki, więc poprawność nie zależy od zapisu zmiennej na środowisku.

Weryfikacja: `typecheck` i `build` bez błędów (33/33 stron statycznie), 15/15 kadrów ma oba
warianty na dysku i zero plików bez wpisu w kodzie, wszystkie 4 strony renderują zdjęcia
serwerowo (alty obecne w HTML bez JS). W przeglądarce kolumna gridu ma 268 px i pobiera
wariant **512w** (24 kB), kadr 562 px pobiera **1024w** — `sizes` policzone poprawnie.
Boksy rezerwują miejsce przed pobraniem (jawne `width`/`height` + `aspect-ratio`), zero CLS,
konsola bez błędów.

**Blokada „zdjęcia produktowe to PNG po 0,5–0,75 MB" pozostaje otwarta** — dotyczy starych
plików w `colors/`, `prints/` i `personalized/`, których ta zmiana nie ruszała.

### 15 sierpnia 2026 — decyzja właściciela: czystka treści startowych na blogu

**Wykonane.** Z `POSTS` w `src/lib/blog.ts` usunięto **pięć wpisów z pierwszego commita**
(`27fe674`), postawionych po to, żeby blog nie był pusty. Na blogu zostaje jeden wpis —
`jak-przygotowac-pliki-do-druku-na-kopertach` z poz. 7, przepisany dzień wcześniej.

Usunięte: `jak-dobrac-koperte-do-zaproszen-firmowych`, `adresowanie-kopert-recznie-czy-z-arkusza`,
`paleta-19-kolorow-jak-wybrac-odcien-do-identyfikacji-firmy`,
`realizacja-3000-kopert-dl-dla-kancelarii`, `ekspresowa-realizacja-2-dni-robocze`.

**Powód (decyzja właściciela).** Treści powstały przed strategią i nie realizują żadnej z jej
zasad: brak bloku odpowiedzi GEO, brak tabel faktów, brak FAQ, liczby wpisane ręcznie zamiast
czytanych z `pricing.ts`, przymiotniki zamiast parametrów. Plan traktował je jako pozycje
`Aktualizacja`, ale przepisanie ich od zera kosztuje tyle samo co napisanie nowych, a niesie
dodatkowy koszt: trzymanie się cudzej struktury.

**Osobny powód przy jednej pozycji.** `realizacja-3000-kopert-dl-dla-kancelarii` opisywała
klienta, jego problem z poprzednim dostawcą i efekt wdrożenia. Właściciel potwierdził, że
przykład był **wymyślony**. To narusza pkt 4.1 briefu wprost i wypadłoby niezależnie od
jakości tekstu. Poz. 47 idzie na status `[—]` do czasu realnego zamówienia; poz. 28 (realizacja
dla hotelu) dostała ten sam warunek wejścia, zanim ktokolwiek zacznie ją pisać.

**Pięć pozycji planu zmieniło format z `Aktualizacja` na `Supporting article`** — 8, 12, 16, 41
oraz 47 (ta ostatnia dodatkowo wstrzymana). Nie ma już czego aktualizować; każda z nich powstaje
od zera pod intencję opisaną w kolumnie „Uwagi". **Kadencja i horyzont planu bez zmian** — liczba
pozycji się nie zmieniła, zmienił się nakład na pięciu z nich.

**Fraza bez właściciela.** `koperty na zaproszenia` (K9) straciła jedyną stronę, która na nią
celowała. Do czasu poz. 41 klaster zaproszeniowy nie ma w serwisie żadnej treści. Zapisane
w `keywords.md` przy K4 i K9, żeby nie wypłynęło jako „luka" przy najbliższym audycie.

Sprzątanie po stronie kodu — **17 martwych referencji na 5 stronach ofertowych**. Każde wywołanie
`getPost()` było osłonięte `{post && …}`, więc build nie protestował, ale strony po cichu
gubiłyby całe akapity:
- `/` — 5 akapitów kontekstowych i 5 deklaracji `getPost` (zostaje `filesPost`),
- `/koperty-z-nadrukiem` — akapit o ekspresie, `relatedPosts` skrócone do jednego wpisu,
- `/koperty-na-vouchery` — akapit o kolorach i o ekspresie, `relatedPosts` do jednego wpisu,
- `/koperty-personalizowane` i `/koperty-dl` — **cała sekcja „Poradniki" usunięta**, bo wszystkie
  jej wpisy przepadły. Wraca z poz. 8, 14, 15 (F2) oraz 10, 11, 13 (F3). Osierocone importy
  `getPost` i `BlogPost` skasowane.

**Naprawione przy okazji.** Sekcja „Powiązane wpisy" w `src/app/blog/[slug]/page.tsx` nie miała
osłony na pustą listę — przy jednym wpisie na blogu `getRelatedPosts()` zwraca `[]`, więc strona
renderowałaby nagłówek nad pustą siatką. Nagłówek stoi teraz pod warunkiem `related.length > 0`.

**Przekierowań nie zakładaliśmy.** Pięć adresów zwraca 404 i tak ma zostać: to treść usunięta
bez odpowiednika, a domena nie ma historii w indeksie, więc nie ma czego przenosić. 308 na
stronę zastępczą byłby przekierowaniem na treść o innej intencji — sygnał gorszy niż 404.
Przekierowanie z poz. 7 (stary slug wpisu o plikach) zostaje, bo tam odpowiednik istnieje.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów. Prerender zawiera **zero**
odwołań do pięciu usuniętych slugów, `sitemap.xml` wymienia jeden wpis blogowy
(`/blog/jak-przygotowac-pliki-do-druku-na-kopertach`), wszystkie cztery filary i `/` budują się
statycznie. **Do obserwacji:** sekcja „Blog" na `/` renderuje dziś jedną kartę w siatce
trzykolumnowej — wypełni się przy poz. 9 i 10.

### 15 sierpnia 2026 — poz. 7: poradnik plikowy `/blog/jak-przygotowac-pliki-do-druku-na-kopertach`

**Przepisane w całości.** Wpis `koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem`
zmienił tytuł, adres i wszystkie sekcje. Był poradnikiem o zamawianiu kopert z nadrukiem —
czyli treścią konkurującą z filarem F1 o intencję transakcyjną. Jest poradnikiem o jednej
czynności: przygotowaniu pliku, który przejdzie akceptację wizualizacji za pierwszym razem.

Zakres dostawy: H1 + 8 sekcji H2, blok odpowiedzi GEO w leadzie (rozstrzyga cztery warunki
w pierwszych dwóch zdaniach), przelicznik milimetry → piksele z trzema przykładami, dwie listy
wypunktowane w treści i lista kontrolna na osiem punktów, kontekstowe CTA wchodzące do
konfiguratora z `format=DL&nadruk=1`. Tekst 1 151 słów, czas czytania 6 minut.

**Oś wpisu to jedno rozróżnienie:** filar odpowiada na pytanie „jakie pliki przyjmujemy",
ten wpis na pytanie „jak ten plik przygotować". Wszystko, co jest ceną, terminem albo progiem
ilościowym, zostało z niego usunięte.

Antykanibalizacja:
- **wobec F1 `/koperty-z-nadrukiem`:** zero cen (2,58 / 1,99 / 4,57 zł), zero MOQ, zero tabeli
  terminów. Fakt o terminie pojawia się w jednym zdaniu i w innej roli niż na filarze — jako
  konsekwencja jakości pliku („termin zaczyna biec od akceptacji wizualizacji"), a nie jako
  parametr oferty. Nagłówki nie powtarzają żadnego H2 filara.
- **wobec poz. 9 (cennik nadruku):** wpis nie podaje ani jednej kwoty, więc pozycja 9 wchodzi
  na czyste pole.
- **wobec poz. 46 (MOQ od 10 sztuk):** próg ilościowy nie pada we wpisie ani razu.
- **wobec F3 `/koperty-dl`:** jedyne odwołanie do geometrii to nazwa formatu z wymiarem
  (`koperta DL 110 × 220 mm`) w jednym zdaniu, bez tabeli dopasowań i bez opisu wkładek.
- **`FAQPage` zostaje wyłącznie na filarze.** Wpis nie dostaje własnych danych `FAQPage`, mimo
  że sekcje mają formę pytań — dwa adresy nie mogą konkurować o ten sam wynik rozszerzony.
  Pytanie „Jakie pliki przyjmujemy do nadruku na kopertach?" w `PRINT_FAQ_ITEMS` zostaje
  nietknięte.

**Zmiana adresu (decyzja podjęta przy tej pozycji).** Stary slug niósł frazę
`koperty firmowe z nadrukiem` — wspierającą klastra K1, której właścicielem jest filar. Adres
to sygnał, którego nie da się zneutralizować treścią, więc slug zmieniliśmy na
`jak-przygotowac-pliki-do-druku-na-kopertach`. Przekierowanie 308 stoi w `next.config.mjs`
(pierwsze `redirects()` w projekcie). Domena nie ma historii, więc koszt zmiany jest dziś
zerowy — za trzy miesiące nie byłby.

**Naprawione trzy anchory prowadzące do wpisu.** `/`, `/koperty-z-nadrukiem`
i `/koperty-na-vouchery` linkowały do niego anchorami „co przygotować przed zamówieniem kopert
z nadrukiem" i „koperty firmowe z nadrukiem — co przygotować przed zamówieniem". Trzy strony
wzmacniały wpis dokładnie na tej frazie, którą miał oddać filarowi. Anchor brzmi teraz
`jak przygotować pliki do druku na kopertach` na wszystkich trzech.

Zmiany w bibliotekach:
- `PRINT_SAFE_MARGIN_MM` i `PRINT_MIN_DPI` w `catalog.ts` — margines nadruku i minimalna
  rozdzielczość były wpisane liczbą w siedmiu miejscach (`faq.ts` ×2, F1 ×2, F2 ×2, F3 ×1).
  Poradnik opisuje te wartości najdokładniej w całym serwisie, więc rozjazd byłby najbardziej
  widoczny właśnie z niego. Komentarz przy stałej ostrzega, że `PRINT_SAFE_MARGIN_MM` (margines
  nadruku) i `INSERT_CLEARANCE_MM` (zapas dla wkładki) to dwie różne wielkości, dziś przypadkiem
  równe 5 mm.
- `BlogCta` i pola `ctaConfigure` oraz `imageVariant` w `BlogPost`. CTA wpisu prowadziło do
  `/#konfigurator` z etykietą „Zamów koperty" — konfigurator otwierał się pusty, mimo że
  czytelnik przyszedł z gotowym plikiem logo. Teraz wchodzi z `format=DL&nadruk=1` i etykietą
  „Wgraj plik i wyceń nadruk”. `imageVariant` podmienia kadr nagłówkowy na realne zdjęcie
  koperty z nadrukiem (`/images/prints/biala-dl-koperta-z-nadrukiem.png`) z własnym tekstem
  alternatywnym z `buildImageAlt`. Oba pola są opcjonalne — pozostałe wpisy działają bez zmian.
- Podział przyjmowanych rozszerzeń na wektorowe i rastrowe liczony w `blog.ts`
  z `PRINT_FILE_EXTENSIONS`, a nie wypisany ręcznie: dopisanie formatu do uploadu przepisuje
  treść poradnika razem z walidacją.

**Liczby w treści są liczone, nie wpisane.** Przelicznik rozdzielczości (60 mm → 709 px,
1 200 px → 102 mm, logo ze strony 200–400 px → 17–34 mm) powstaje z `PRINT_MIN_DPI` i stałej
25,4 mm/cal. Zmiana wymaganej rozdzielczości przepisuje trzy akapity, listę kontrolną, lead
i `description` jednocześnie.

**Zdanie usunięte na etapie pisania:** pierwsza wersja twierdziła, że brak krzywych jest
„najczęstszą przyczyną poprawek". Nie mamy danych, które by to potwierdzały — akapit opisuje
teraz mechanizm (podmiana kroju tam, gdzie czcionki nie ma w systemie), a nie częstotliwość.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, wpis prerenderowany
(`● /blog/jak-przygotowac-pliki-do-druku-na-kopertach`), obecny w `sitemap.xml`
z `lastModified` z pola `updated`, stary slug zniknął z sitemapy i z HTML wszystkich stron.
`title` 55 znaków, `description` 147 znaków, jeden `<h1>`, 8 `<h2>` treściowych,
`Article` z `dateModified` 2026-08-15, zdjęcie nagłówkowe z nadrukiem i altem „Koperta ozdobna,
format DL, kolor biały, z nadrukiem logo firmowego", CTA prowadzi do
`/?format=DL&nadruk=1#konfigurator`.

### 14 sierpnia 2026 — poz. 4: filar F4 `/koperty-na-vouchery` (klaster K7) · **Faza 0 zamknięta**

**Opublikowane.** Trasa `src/app/koperty-na-vouchery/page.tsx` (SSR, prerender statyczny).
Zakres dostawy: H1 + 11 sekcji H2, blok odpowiedzi GEO w leadzie, trzy karty argumentacyjne
„po co koperta", **tabela kosztu gotowej serii bonów** (3 konfiguracje × 4 nakłady + wiersz
ceny jednostkowej), trzy karty postaci bonu z wymiarami, sześć kolorów ze zdjęciami nadruku,
dwie karty usług, sekcja „Dla kogo" z 10 branżami, tabela terminów, blok rozliczenia B2B,
proces w czterech krokach, FAQ na 6 pytań, osiem CTA kontekstowych. Wszystkie 15 wejść do
konfiguratora ustawia `format=DL`, trzynaście z nich dodatkowo `nadruk=1`.

**Oś strony to jedno zdanie:** bon drukowany na jednej trzeciej arkusza A4 — 99 × 210 mm —
wchodzi do koperty DL płasko, bez zaginania. Wszystko inne jest jego rozwinięciem.

Dane strukturalne: `Product` + `AggregateOffer`, `FAQPage`, `HowTo`, `BreadcrumbList`;
`Organization` dochodzi globalnie z `layout.tsx` — pięć bloków w HTML.
**Dlaczego `AggregateOffer`, a nie pojedynczy `Offer` jak na F1:** bon pakuje się w trzech
realnych konfiguracjach — koperta gładka (2,58 zł), z nadrukiem logo (4,57 zł) oraz z logo
i imieniem obdarowanego (7,56 zł). Podanie jednej ceny wymagałoby przemilczenia dwóch
pozostałych. Widełki 2,58–7,56 zł są jednocześnie węższe niż na `/` (tam górna granica 9,06 zł
obejmuje dopłatę ekspresową) i szersze niż na F1 (tam jedna konfiguracja). Ekspres do widełek
nie wchodzi, bo jest opcją terminu, a nie wariantem produktu. **`HowTo` zaczyna się przed
zamówieniem** — krok 1 to ustalenie wymiaru bonu, nie konfiguracja koperty; to odróżnia go od
trzech pozostałych procesów w serwisie.

Antykanibalizacja:
- **wobec F1 `/koperty-z-nadrukiem`:** zero rozbicia ceny nadruku na czynniki. Tabela liczy
  **gotowe konfiguracje razy nakład** (10 / 25 / 50 / 100 bonów), F1 liczy składniki ceny
  jednostkowej i nakłady 10 / 100 / 500 / 1 000. Inna oś, inne progi, inne pytanie
  użytkownika: „ile mnie wyjdzie seria bonów" kontra „z czego składa się cena nadruku".
  Odesłanie do F1 stoi wprost pod tabelą.
- **wobec F3 `/koperty-dl`:** zero tabeli dopasowań wkładek i zero sekcji o wymiarach formatu.
  F4 podaje wymiary **trzech postaci bonu** (DL 99 × 210, A6 105 × 148, karta ID-1 85,6 × 54)
  i odsyła po pełną tabelę dziesięciu wkładek do F3.
- **wobec F2 `/koperty-personalizowane`:** personalizacja to jedna karta z ceną jednostkową
  i linkiem; specyfikacja arkusza adresowego zostaje na F2.
- **wobec `/`:** F4 nie ma palety kolorów ani cennika kopert gładkich. Sześć kolorów pokazujemy
  ze zdjęciami nadruku i z podpisem **cenowym** (`4,57 zł brutto/szt.`), a nie gramaturowym
  jak F1 — inny podpis, węższy wybór, inne pytanie.
- **wobec poz. 18, 19, 22, 23 (LP branżowe) oraz 20 i 24 (wpisy doradcze):** filar mówi do
  wszystkich dziesięciu branż po jednym akapicie i celuje we frazę usługową. Zawężenie do
  branży i doradztwo „jaki kolor wybrać" należą do stron wspierających — granice dopisane
  w kolumnie „Uwagi" przy każdej z tych pozycji.
- `VOUCHER_FAQ_ITEMS` **nie zawiera pytania cenowego ani pytania o MOQ** — oba mają odpowiedź
  na F1. Cena jest na stronie w leadzie, pasku faktów i tabeli, ale nie w `FAQPage`.

**Dwie korekty planu wykonane przy tej pozycji:**
1. Poz. 24 miała frazę główną `koperta do vouchera`, czyli liczbę pojedynczą frazy filara
   `koperty do voucherów`. Dwa adresy na tę samą intencję to kanibalizacja z definicji —
   fraza zostaje przy F4 (jest w jego `keywords`), a wpis dostaje intencję czynnościową
   „jak wręczyć bon podarunkowy".
2. Fraza `koperty na bony podarunkowe` siedzi dziś w `keywords` filara jako wariant
   nazewniczy. Przy publikacji poz. 19 (`/koperty-dla-salonow-spa`) trzeba ją stamtąd zabrać —
   zapisane w uwagach do tej pozycji, żeby nie wypłynęło to dopiero w Search Console.

Linkowanie w obie strony:
- **do filara:** stopka (sekcja „Sklep"), strona główna (akapit pod siatką zastosowań —
  anchor `koperty na vouchery`), filar F1 (akapit pod sekcją „Dla kogo"), filar F2 (karta
  „Samo imię i nazwisko"), filar F3 (akapit pod tabelą dopasowań, przy wierszu z voucherem).
  **Nawigacji nie ruszaliśmy** — pasek celowo nie zawiera stron ofertowych.
- **z filara:** `/koperty-dl`, `/koperty-z-nadrukiem`, `/koperty-personalizowane`, `/#kolory`,
  `/kontakt#wycena` oraz wpisy `paleta-19-kolorow-…`,
  `koperty-firmowe-z-nadrukiem-co-przygotowac-…` i `ekspresowa-realizacja-2-dni-robocze`.

Zmiany w bibliotekach: `VOUCHER_FAQ_ITEMS` w `faq.ts`; `voucherEnvelopeProductJsonLd()`
w `seo.ts`. **Żadnego nowego pola w katalogu** — wymiary bonu, kartki A6 i karty ID-1 to
wartości normatywne opisane w treści, a nie parametry naszej oferty.

**Tytuł skrócony na etapie weryfikacji:** wersja „Koperty na vouchery i bony podarunkowe od
10 szt." miała z sufiksem marki 61 znaków. Wybraliśmy pełne dopasowanie frazy zamiast MOQ —
liczby niesie `description`.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, trasa prerenderowana statycznie
(`○ /koperty-na-vouchery`), obecna w `sitemap.xml`, pięć bloków JSON-LD renderuje się
serwerowo (`AggregateOffer` 2.58–7.56 PLN, `offerCount` 19, `minValue` 1, `FAQPage` 6 pytań,
`HowTo` 4 kroki), `title` 50 znaków, `description` 142 znaki, jeden `<h1>`, 11 `<h2>`,
7 unikalnych tekstów alternatywnych, 15 wejść do konfiguratora — **żadne nie ustawia formatu
C6 ani K4**. Serwer produkcyjny zwraca 200 dla `/koperty-na-vouchery` i dla wszystkich stron,
na których dołożono linki przychodzące.

### 14 sierpnia 2026 — decyzja właściciela: filary znikają z paska nawigacji

**Wykonane.** `NAV` w `src/components/layout/Header.tsx` zawiera już tylko `Blog` i `Kontakt`
obok przycisku „Zamów Koperty". Trzy pozycje ofertowe — `/koperty-dl`, `/koperty-z-nadrukiem`
i `/koperty-personalizowane` — zostały usunięte z nagłówka, również z menu mobilnego.

**Powód (decyzja właściciela, nie SEO):** trzy etykiety zaczynające się od słowa „Koperty"
konkurowały wizualnie z jedynym przyciskiem w pasku i odciągały użytkownika od konfiguratora,
zanim ten zdążył wybrać kolor. Argument SEO za trzymaniem filarów w nagłówku był słaby —
stopka (sekcja „Sklep") niesie te same trzy linki na każdej podstronie, więc linkowanie
serwisowe nie ucierpiało. Różnica między linkiem w nagłówku a w stopce jest marginalna.

**Stan linkowania po zmianie** (policzony na prerenderze w `.next/server/app/`):
`/` — 10 odnośników do filarów, `/koperty-dl` i `/koperty-z-nadrukiem` — po 5,
`/blog` — 3 (sama stopka), wpis blogowy — 4 (stopka + blok „Strona oferty" z pola `pillar`).
**Do obserwacji:** listing `/blog` jest jedyną stroną, na której filary opierają się wyłącznie
na stopce. Jeśli po wdrożeniu analityki okaże się, że listing generuje ruch, dokładamy tam
kontekstowy blok ofertowy.

**Cofnięta zmiana z poz. 3:** próg kompaktowej nawigacji wrócił z 1240 na 1080 px, a reguły
zwężające `.nav` przy sześciu elementach zostały usunięte z `components.css` — przy trzech
pozycjach nie mają zastosowania.

**Naprawione przy okazji.** Sekcja „Formaty" na `/` miała pustą lukę po tabeli formatów, którą
Dziennik poz. 6 opisuje jako wdrożoną („zastąpiona tabelą ze statusem dostępności") — w kodzie
tabeli nie było, a `AVAILABLE_FORMATS` wisiało jako nieużywany import. Tabela stoi teraz
w sekcji `#formaty`: cztery kolumny (Format · Wymiary · Cena od · Status), DL ze statusem
„W sprzedaży" i ceną z `pricing.ts`, C6 i K4 ze statusem „Dostępne wkrótce" **bez ceny**.
Rozgraniczenie z F3 zachowane zgodnie z `keywords.md`: strona główna podaje wymiar
i dostępność, kolumna „co się zmieści" i tabela dopasowań wkładek zostają na `/koperty-dl`.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów; prerender `/` zawiera trzy
odnośniki w pasku (`/#konfigurator`, `/blog`, `/kontakt`) i tabelę formatów renderowaną
serwerowo z poprawnymi statusami.

### 14 sierpnia 2026 — poz. 3: filar F3 `/koperty-dl` (klaster K4)

**Opublikowane.** Trasa `src/app/koperty-dl/page.tsx` (SSR, prerender statyczny).
Zakres dostawy: H1 + 11 sekcji H2, blok odpowiedzi GEO w leadzie, tabela specyfikacji na
13 wierszy, **tabela dopasowań 10 standardowych wkładek** (siedem mieści się, trzy nie),
tabela trzech formatów z wymiarami, największą wkładką i statusem dostępności, trzy rysunki
formatów we wzajemnej skali, sekcja o kształcie i braku okienka, sześć bestsellerów ze
zdjęciami, sekcja „Dla kogo" z 10 branżami, proces w trzech krokach, FAQ na 7 pytań,
osiem CTA kontekstowych. Wszystkie 15 wejść do konfiguratora ustawia `format=DL`.

**To jest strona specyfikacyjna, nie usługowa.** Trzy rzeczy, których świadomie na niej nie ma:
nagłówka cenowego (cena jest jednym wierszem tabeli specyfikacji), palety 19 kolorów oraz
rozbicia cen nadruku i personalizacji na czynniki. Każdy z tych bloków ma już właściciela.

Dane strukturalne: `Product` + `Offer`, `ItemList` formatów, `FAQPage`, `HowTo`,
`BreadcrumbList`; `Organization` dochodzi globalnie z `layout.tsx` — sześć bloków w HTML.
**Dlaczego `Product`, skoro strona główna też go ma:** `/` opisuje całą paletę jako ofertę
zbiorczą (`AggregateOffer`, 19 wariantów, widełki 2,58–9,06 zł), a ta strona opisuje jeden
wariant — kopertę DL gładką — i dokłada ładunek, którego `/` nie niesie: `width`, `height`
w milimetrach (`unitCode: MMT`) oraz sześć pozycji `additionalProperty` z geometrią formatu.
To jest dokładnie to, po co model przychodzi na zapytanie „jakie wymiary ma koperta DL".
**Dlaczego `ItemList`, a nie trzy `Product` w porównaniu formatów:** C6 i K4 mają
`disabled: true`, więc opisanie ich jako produktu z ofertą byłoby deklaracją sprzedaży, której
konfigurator nie zrealizuje. Lista niesie sam komplet faktów — nazwę, wymiary i status.

Antykanibalizacja:
- **wobec `/` (K3):** strona główna zostaje właścicielem fraz `koperty ozdobne` i `koperty
  kolorowe`, palety, cennika kopert gładkich i `ItemList` odcieni. F3 przejmuje wyłącznie
  intencję „jakie wymiary, co się zmieści": `koperty dl wymiary`, `koperta prostokątna`,
  `koperty bez okienka`. Żaden H2 na F3 nie zawiera frazy `koperty ozdobne` ani `koperty
  kolorowe`, sekcja kolorów pokazuje 6 bestsellerów zamiast 19 odcieni i odsyła do `/#kolory`.
  `DL_FAQ_ITEMS` nie ma ani jednego pytania cenowego — „Ile kosztuje koperta ozdobna?" zostaje
  w `FAQ_ITEMS`.
- **wobec F1 i F2:** nadruk i personalizacja to po jednej karcie z ceną jednostkową i linkiem;
  zero tabel składników, zero progów ilościowych, zero wymagań dla plików i arkusza.
- **wobec przyszłych poz. 10, 11 i 13:** F3 rozstrzyga **wymiary** — tabelę formatów i tabelę
  dopasowań wkładek w milimetrach. Poz. 10 dostaje odwrotne mapowanie (wkładka → format) jako
  przewodnik decyzyjny, poz. 11 — trzeci wymiar, czyli grubość wkładu (ile arkuszy, jaka
  gramatura, jak złożyć), poz. 13 — decyzję „kiedy brak okienka pomaga, a kiedy przeszkadza".
  Granice zapisane w kolumnie „Uwagi" przy każdej z tych pozycji; poz. 11 dostała nowy tytuł,
  bo poprzedni („Jaka kartka zmieści się w kopercie DL") opisywał już tabelę z F3.

Linkowanie w obie strony:
- **do filara:** stopka (sekcja „Sklep"),
  strona główna (sekcja „Formaty" — anchor `wymiary kopert DL`, oraz blok „Więcej o kopertach
  ozdobnych"), filar F1 i filar F2 (akapity nad tabelami specyfikacji), wpis
  `jak-dobrac-koperte-do-zaproszen-firmowych` (pole `pillar`, blok „Strona oferty"),
- **z filara:** `/#kolory`, `/koperty-z-nadrukiem`, `/koperty-personalizowane`,
  `/kontakt#wycena` oraz wpisy `jak-dobrac-koperte-do-zaproszen-firmowych`,
  `paleta-19-kolorow-…` i `realizacja-3000-kopert-dl-dla-kancelarii`.

Zmiany w bibliotekach: `INSERT_CLEARANCE_MM`, `STANDARD_INSERTS`, `fitsInFormat()`,
`maxInsertSize()` i `formatMm()` w `catalog.ts`; `DL_FAQ_ITEMS` w `faq.ts`;
`dlEnvelopeProductJsonLd()` i `envelopeFormatsJsonLd()` w `seo.ts`; `pillar` przy wpisie
o zaproszeniach w `blog.ts`; próg kompaktowej nawigacji w `components.css` podniesiony
z 1080 na 1240 px, bo w pasku stanęło sześć elementów zamiast pięciu.

**Dopasowania są liczone, nie wpisane.** Cała tabela wkładek, największa wkładka
(105 × 215 mm), zapasy w milimetrach, różnica DL względem C6 i stosunek boków powstają
z wymiarów w `FORMATS` i ze stałej `INSERT_CLEARANCE_MM`. Zmiana formatu w katalogu przepisuje
treść, metadane, FAQ i dane strukturalne jednocześnie — nie ma miejsca, w którym wymiar
istnieje po raz drugi jako liczba w tekście.

**Zdanie usunięte na etapie weryfikacji:** pierwsza wersja sekcji o kształcie twierdziła, że
koperty kwadratowe idą w sortowniach jako przesyłka niestandardowa. Poczta Polska klasyfikuje
przesyłkę listową po wymiarach, a nie po proporcji boków, więc twierdzenia nie da się poprzeć —
akapit przepisany na argument sprawdzalny (układ klapki a wsuwanie wkładki A4 na trzy).

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, trasa prerenderowana statycznie
(`○ /koperty-dl`), obecna w `sitemap.xml`, sześć bloków JSON-LD renderuje się serwerowo
(`Offer.price` = 2.58 PLN, `minValue` = 1, `FAQPage` 7 pytań, `HowTo` 3 kroki, `ItemList`
3 formaty), `title` 60 znaków, `description` 152 znaki, jeden `<h1>`, 11 `<h2>`, 6 unikalnych
tekstów alternatywnych, 15 wejść do konfiguratora — **żadne nie ustawia formatu C6 ani K4**.
Serwer produkcyjny zwraca 200 dla `/koperty-dl` oraz dla wszystkich stron, na których dołożono
linki przychodzące.

### 14 sierpnia 2026 — poz. 2: filar F2 `/koperty-personalizowane`

**Opublikowane.** Trasa `src/app/koperty-personalizowane/page.tsx` (SSR, prerender statyczny).
Zakres dostawy: H1 + 9 sekcji H2, blok odpowiedzi GEO w leadzie, dwie tabele cenowe (składniki
ceny i wartość wysyłki dla 10 / 100 / 300 / 1 000 adresów), tabela porównawcza dwóch trybów
przekazania danych, tabela wymagań dla arkusza adresowego, tabela specyfikacji, proces
w czterech krokach, 12 kolorów ze zdjęciami personalizacji, sekcja „Dla kogo" z 10 branżami,
FAQ na 7 pytań, sześć CTA kontekstowych wchodzących do konfiguratora z włączoną personalizacją.

Dane strukturalne: `Product` + `Offer` (z `shippingDetails`), `FAQPage`, `HowTo`,
`BreadcrumbList`; `Organization` dochodzi globalnie z `layout.tsx` — pięć bloków w HTML.
**Wybrano `Product`, nie `Service`:** klient nie kupuje usługi adresowania w oderwaniu od towaru,
tylko kopertę DL z nadrukowanymi danymi, wysyłaną kurierem. Cena, MOQ i dostawa dotyczą sztuki
produktu, więc `Service` bez ceny jednostkowej rozjechałby się z konfiguratorem i z fakturą.

Antykanibalizacja wobec F1 `/koperty-z-nadrukiem`: F1 rozkłada na czynniki cenę **nadruku**
(2,58 + 1,99 zł), F2 cenę **personalizacji** (2,58 + 2,99 zł). Nadruk pojawia się na F2 jednym
wierszem tabeli i akapitem z linkiem do F1 — bez własnego nagłówka i bez rozbicia na składniki.
Tabele ilościowe celowo mają inne progi: F1 liczy nakład jednego projektu (10 / 100 / 500 /
1 000), F2 liczy listę adresów (10 / 100 / 300 / 1 000). `PERSONALIZATION_FAQ_ITEMS` nie powtarza
ani jednego pytania z `PRINT_FAQ_ITEMS`. Filar świadomie **nie ma** sekcji ze wzorem adresu
pocztowego — ta intencja należy do poz. 14, więc sekcja „Co drukujemy" opisuje zakres usługi,
a nie zasady adresowania korespondencji.

Linkowanie w obie strony:
- **do filara:** stopka (sekcja „Sklep"), strona główna (karta
  usługi „Personalizacja i adresowanie" oraz sekcja „Realizacje"), filar F1 (akapit pod tabelą
  cenową), wpis `adresowanie-kopert-recznie-czy-z-arkusza` (pole `pillar`, blok „Strona oferty"),
- **z filara:** `/koperty-z-nadrukiem`, `/#kolory`, `/kontakt#wycena`, wpisy
  `adresowanie-kopert-recznie-czy-z-arkusza`, `paleta-19-kolorow-…`
  i `ekspresowa-realizacja-2-dni-robocze`.

Zmiany w bibliotekach: `PERSONALIZATION_SHEET_COLUMNS`, `PERSONALIZATION_REQUIRED_COLUMNS`,
`PERSONALIZATION_SHEET_EXTENSIONS(_LABEL)` i `PERSONALIZATION_SHEET_MAX_ROWS` w `catalog.ts`;
`PERSONALIZATION_FAQ_ITEMS` w `faq.ts` (wszystkie liczby z `pricing.ts`);
`personalizedEnvelopeProductJsonLd()` w `seo.ts`; `pillar` i procesowe `keywords` przy wpisie
o adresowaniu w `blog.ts`.

**Usunięta rozbieżność źródeł prawdy:** kolumny arkusza adresowego i lista akceptowanych
rozszerzeń istniały wyłącznie w kodzie API (`/api/personalizacja/szablon`, `/api/personalizacja/
walidacja`) i w komponencie `StepPersonalization`, w trzech osobnych miejscach. Opisanie ich
na stronie ofertowej oznaczałoby czwartą kopię — przy zmianie szablonu strona obiecywałaby
kolumny, których arkusz już nie ma. Wszystkie cztery miejsca czytają teraz jedną definicję
z `catalog.ts`; generator szablonu bierze też z niej limit 20 000 wierszy, wcześniej wpisany
liczbą w kodzie trasy.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, trasa prerenderowana statycznie
(`○ /koperty-personalizowane`), obecna w `sitemap.xml`, pięć bloków JSON-LD renderuje się
serwerowo (`Offer.price` = 5.57 PLN, `FAQPage` 7 pytań, `HowTo` 4 kroki), `title` 57 znaków,
`description` 150 znaków, 14 unikalnych tekstów alternatywnych, 5 CTA z preselekcją
personalizacji i 12 wejść z preselekcją koloru i personalizacji.

### 13 sierpnia 2026 — poz. 6: przebudowa strony głównej `/` (klaster K3)

**Opublikowane.** `src/app/page.tsx` przepisane w całości. Strona główna jest właścicielem
frazy `koperty ozdobne` i jednocześnie rozdzielnikiem ruchu do filarów.

Struktura: hero z blokiem odpowiedzi GEO → konfigurator → paleta 19 kolorów z tabelą gramatur
→ tabela formatów ze statusem dostępności → cennik kopert gładkich → usługi (nadruk,
personalizacja) → proces w czterech krokach → sześć zastosowań → realizacje na zdjęciach
→ rozliczenie B2B → FAQ na 9 pytań → blog → finalne CTA. Cztery CTA kontekstowe plus
19 wejść do konfiguratora z preselekcją koloru z tabeli i 19 z palety.

Dane strukturalne: `WebSite`, `Product` + `AggregateOffer` (z `shippingDetails`), `ItemList`
19 kolorów, `FAQPage`, `HowTo`. `Organization` renderuje się globalnie z `layout.tsx`.
`LocalBusiness` świadomie nieobecny — sprzedaż jest wyłącznie wysyłkowa.

**Naprawione błędy faktograficzne (najważniejsza część tej pozycji):**
- `title` i `description` obiecywały „DL, C6, K4" oraz cenę „od 2,12 zł/szt.". 2,12 zł to cena
  bazowa formatu C6, który ma `disabled: true` — strona sprzedawała w wynikach wyszukiwania
  produkt, którego konfigurator nie przyjmuje. Teraz metadane mówią o DL i 2,58 zł.
- `productJsonLd()` liczyło `lowPrice` ze wszystkich formatów, więc dane strukturalne
  publikowały tę samą nieosiągalną cenę 2,12 zł. Helper korzysta teraz z `AVAILABLE_FORMATS`.
- Sekcja „Formaty" renderowała C6 i K4 jako klikalne karty z napisem „Wybierz format C6 →",
  mimo że konfigurator odrzuca formaty `disabled`. Zastąpiona tabelą ze statusem dostępności.
- Blok „Dla firm" ilustrowała koperta K4 — format niedostępny i bez zdjęcia w repozytorium.
  Podmieniona na realne zdjęcie koperty DL granatowej.
- Literówki w kartach realizacji: „Eskluzywny" (×2), „Egancki". Karty przepisane.
- Usunięta martwa funkcja `Seal()`.

Antykanibalizacja wobec F1 `/koperty-z-nadrukiem`: strona główna podaje dopłatę za nadruk
(+1,99 zł/szt.), ale nie ma nagłówka o cenie nadruku i nie rozkłada jej na czynniki. Tabela
wartości zamówienia dotyczy kopert **gładkich** (1 / 50 / 100 / 500 / 1 000 szt.), filar liczy
koperty **z nadrukiem** (10 / 100 / 500 / 1 000 szt.). Z `FAQ_ITEMS` usunięto pytanie o pliki
do druku — należy do filara.

Linkowanie wychodzące ze strony głównej: `/koperty-z-nadrukiem` (hero, cennik, usługi,
realizacje), `/kontakt#wycena`, `/rejestracja?typ=firmowe`, `/blog` oraz **wszystkie sześć
wpisów blogowych podlinkowanych kontekstowo** — każdy pod sekcją, której temat rozwija.

Zmiany w bibliotekach: `AVAILABLE_FORMATS` i `UPCOMING_FORMATS` w `catalog.ts`;
`webSiteJsonLd()`, `colorPaletteJsonLd()` i przepisane `productJsonLd()` w `seo.ts`;
`FAQ_ITEMS` w `faq.ts` liczone z `pricing.ts` zamiast wpisanych ręcznie liczb;
`loading="lazy"` i `decoding="async"` w `EnvelopePlaceholder`.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, `/` prerenderowana statycznie,
sześć bloków JSON-LD renderuje się serwerowo, `title` 52 znaki, `description` 148 znaków.

### 13 sierpnia 2026 — poz. 1: filar F1 `/koperty-z-nadrukiem`

**Opublikowane.** Trasa `src/app/koperty-z-nadrukiem/page.tsx` (SSR, prerender statyczny).
Zakres dostawy: H1 + 9 sekcji H2, blok odpowiedzi GEO w leadzie, dwie tabele cenowe
(składniki ceny i wartość zamówienia dla 10 / 100 / 500 / 1 000 szt.), tabela specyfikacji,
proces w czterech krokach, 12 kolorów ze zdjęciami nadruku, sekcja „Dla kogo" z 10 branżami,
FAQ na 6 pytań, cztery CTA kontekstowe.

Dane strukturalne: `Product` + `Offer`, `FAQPage`, `HowTo`, `BreadcrumbList` — wszystkie liczby
liczone z `pricing.ts` i `catalog.ts`, więc zmiana cennika przepisuje treść, metadane i JSON-LD
jednocześnie.

Linkowanie w obie strony:
- **do filara:** stopka (sekcja „Sklep"), strona główna
  (sekcja „Realizacje" i baner w hero), wpisy `koperty-firmowe-z-nadrukiem-…` i `ekspresowa-realizacja-2-dni-robocze`
  (nowy blok „Strona oferty" — pole `pillar` w `BlogPost`),
- **z filara:** wpisy blogowe wspierające, paleta kolorów na stronie głównej, formularz wyceny.

Zmiany techniczne wykonane przy okazji (konieczne dla ciągłości intencji, pkt 7 briefu):
- `ConfigureLink` buduje realny adres `/?format=DL&kolor=…&nadruk=1#konfigurator`, działa
  między trasami i bez JavaScriptu; konfigurator czyta preselekcję z adresu i włącza nadruk
  lub personalizację. Wcześniej preselekcja działała wyłącznie w obrębie strony głównej,
  a opcji nadruku nie dało się wskazać wcale. **Odblokowuje to poz. 29–36 (strony kolorów).**
- `buildImageAlt` rozróżnia zdjęcie gładkie, z nadrukiem i z personalizacją — alty na stronie
  głównej i w konfiguratorze przestały opisywać trzy różne zdjęcia tym samym zdaniem.
- Formularz wyceny B2B (`QuoteForm`) był w repozytorium, ale nie był nigdzie renderowany —
  kotwica `/kontakt#wycena`, do której prowadziło CTA ze strony głównej, była martwa.
  Formularz stoi teraz na `/kontakt` pod tą kotwicą.

Weryfikacja: `npm run typecheck` i `npm run build` bez błędów, trasa prerenderowana statycznie,
obecna w `sitemap.xml`, JSON-LD renderuje się serwerowo (5 bloków), CTA wchodzi do konfiguratora
z konfiguracją „Koperta DL Czarny z nadrukiem", 4,57 zł/szt.

---

## Zależności i blokady

| Blokada | Wpływ | Kto odblokowuje |
| --- | --- | --- |
| ~~`NEXT_PUBLIC_SITE_URL` nieustawione~~ | **Odblokowane.** `SITE_URL` ma produkcyjny fallback `https://envelopes.pl` — sitemapa, robots, JSON-LD i OG wskazują na domenę | — |
| ~~Dane rejestrowe zastępcze~~ | **Odblokowane.** `CONTACT_DETAILS` zawiera realne dane (JDG, NIP 6972414844, REGON, adres, telefon, rachunek) | — |
| ~~Brak analityki (GA4 / GSC)~~ | **Odblokowane 16 sierpnia 2026.** GA4 wpięte przez `NEXT_PUBLIC_GA_ID`, właściciel zweryfikowany w Search Console. Dane o zapytaniach i wejściach do konfiguratora zaczynają się zbierać | — |
| `transitTime` w danych o dostawie | Google liczy obiecywaną datę doręczenia z `handlingTime` + `transitTime`; bez drugiego składnika adnotacja o dostawie jest niepełna. Zadeklarowanie czasu przewozu bez potwierdzenia przewoźnika byłoby obietnicą bez pokrycia | Właściciel — podanie realnego czasu przewozu kurierem |
| Formaty C6 i K4 `disabled` | Klaster ślubny (K9) bez CTA zakupowego; poz. 27 ograniczona do A4 składanego | Właściciel — uruchomienie formatów |
| ~~Zdjęcia produktowe to PNG po 0,5–0,75 MB~~ | **Odblokowane 15 sierpnia 2026.** `colors/`, `prints/` i `personalized/` przeszły na WebP w trzech szerokościach: **30,8 MB → 2,1 MB**. Strona główna pobiera dziś **197 kB** obrazów zamiast ~9 MB | — |
| ~~Kadry hero w `public/images/` nadal w PNG~~ | **Odblokowane 18 sierpnia 2026.** `Hero Envelopes Robocze.png` (3,06 MB) okazał się plikiem **używanym** — jako tło hero na `/` i pięciu filarach, przez adres z `%20`. Przeszedł na WebP (`hero-tlo-2015.webp`, 127 kB); `koperta-gorna/dolna.png` i `2.png` były faktycznie nieużywane i zostały usunięte | — |
| ~~Profile FB / Instagram / LinkedIn~~ | **Odblokowane 10 września 2026** dla LinkedIna i Instagrama — adresy ze stopki trafiły do `Organization.sameAs` przez wspólną stałą `SOCIAL_PROFILES` (`orders.ts`). Facebooka w stopce nie ma, więc nie ma go też w `sameAs` | Właściciel — adres profilu na Facebooku, jeśli powstanie |
| Konto w Bing Webmaster Tools | Kod po stronie serwisu gotowy (klucz IndexNow, `npm run indexnow`, znacznik `msvalidate.01`). Bez konta nie ma danych o indeksacji w Bing — a to indeks, z którego korzystają ChatGPT Search i Copilot | Właściciel — założenie konta, najprościej importem z Search Console |

---

*Plan jest dokumentem żywym. Po każdej publikacji agent odhacza pozycję i weryfikuje,
czy kolejne wpisy nie kolidują z tym, co już powstało. Zmiana oferty (nowy format, nowy kolor,
zmiana ceny) wymaga przeglądu całego planu, nie tylko dotkniętej pozycji.*
