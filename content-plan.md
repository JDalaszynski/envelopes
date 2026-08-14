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
| **Status** | `[ ]` do zrobienia · `[~]` w toku · `[x]` opublikowane |

**Zasada:** każda pozycja linkuje w górę do dokładnie jednego filara. Filar linkuje w dół do
3–6 treści wspierających. Publikacja bez dołożenia linków zwrotnych na stronach istniejących
jest niekompletna.

---

## Mapa filarów

| Filar | URL | Klaster | Obsługuje intencję |
| --- | --- | --- | --- |
| **F1 — Nadruk** | `/koperty-z-nadrukiem` | K1 | „chcę koperty z moim logo" |
| **F2 — Personalizacja** | `/koperty-personalizowane` | K2 | „chcę koperty zaadresowane imiennie" |
| **F3 — Format DL** | `/koperty-dl` | K4 | „jakie wymiary, co się zmieści" — opublikowany 14 sierpnia 2026 |
| **F4 — Vouchery** | `/koperty-na-vouchery` | K7 | „w co zapakować bon podarunkowy" |
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
| 4 | Koperty na vouchery i bony podarunkowe — `/koperty-na-vouchery` | Pillar (LP) | koperty na vouchery | KONWERSJA | **Każda usługa sprzedająca bon** — SPA, fryzjer, gastronomia, fitness, klinika, hotel, warsztat, szkoła | — | Klaster nietknięty przez istniejące treści — zero ryzyka nakładania | [ ] |

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
| 7 | Koperty firmowe z nadrukiem — co przygotować | Aktualizacja | pliki do druku na kopertach | AUTORYTET | Grafik, marketing | F1 | Zawęzić do procesu przygotowania plików; frazę `koperty z nadrukiem` oddać filarowi F1 i podlinkować w górę. **Częściowo wykonane przy poz. 1:** `keywords` przepisane na frazy procesowe, link w górę do F1 dodany. Zostaje przepisanie tytułu i sekcji pod intencję „jak przygotować plik" | [ ] |
| 8 | Adresowanie kopert: ręcznie czy z arkusza | Aktualizacja | adresowanie kopert z arkusza | AUTORYTET | Office manager | F2 | Zawęzić do porównania dwóch trybów; frazę `adresowanie kopert` oddać filarowi F2. **Częściowo wykonane przy poz. 2:** `keywords` przepisane na frazy procesowe, link w górę do F2 dodany. Zostaje przepisanie sekcji pod intencję „który tryb wybrać przy mojej skali" — dziś wpis powtarza progi 30/100 adresów, które filar podaje w tabeli porównawczej | [ ] |

---

## Faza 1 · Cena, specyfikacja, cytowalność (tydzień 3–4)

Cel fazy: obudować filary treścią, którą modele językowe cytują najchętniej — konkretami
liczbowymi i porównaniami. Najtańszy dostępny kanał widoczności dla domeny bez historii.

### Tydzień 3

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Ile kosztuje nadruk logo na kopertach — pełny cennik | Supporting article | koperty z nadrukiem cena | GEO | Decydent budżetowy | F1 | Jedyne miejsce z rozpisanym działaniem 2,58 + 1,99 zł; filar F1 pokazuje cenę, ale nie rozkłada jej na czynniki | [ ] |
| 10 | Który format koperty wybrać do mojej wkładki | Supporting article | format do koperty dl | GEO | Wszystkie | F3 | **Odwrotne mapowanie: wkładka → format.** F3 podaje wymiary trzech formatów i status dostępności w tabeli; ten wpis prowadzi przez decyzję („mam zaproszenie A6 / program / dyplom — co wybrać") i uzasadnia różnice konstrukcyjne. **Zakaz powtórzenia pytania „Czym różni się koperta DL od C6" w FAQ** — należy do F3. Bez CTA zakupowego na C6/K4 | [ ] |
| 11 | Ile kartek mieści koperta DL i jak je złożyć | Supporting article | kartka do koperty dl | GEO | Wszystkie | F3 | **Trzeci wymiar, którego F3 nie dotyka: grubość wkładu.** F3 rozstrzyga dopasowanie w dwóch wymiarach (tabela wkładek w mm), ten wpis odpowiada, ile arkuszy i jakiej gramatury wchodzi, jak złożyć A4 na trzy równo i kiedy plik przestaje się mieścić mimo poprawnych wymiarów | [ ] |
| 12 | Paleta 19 kolorów — jak wybrać odcień | Aktualizacja | kolory kopert | RUCH | Marketing, brand manager | F5 | Podlinkować w górę do nowego huba `/koperty` i w dół do stron kolorów z Fazy 3 | [ ] |

### Tydzień 4

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Koperty bez okienka — kiedy je wybrać | Supporting article | koperty bez okienka | GEO | Kancelarie, biura rachunkowe | F3 | Cała oferta jest bez okienka — treść wykorzystuje to jako wyróżnik, nie jako filtr produktowy. **F3 podaje sam fakt** (wiersz specyfikacji + akapit „Brak okienka na całej ofercie"); ten wpis obsługuje intencję decyzyjną: kiedy okienko przeszkadza, a kiedy jego brak wymusza adresowanie | [ ] |
| 14 | Jak zaadresować kopertę wysyłaną przez firmę — wzór | Supporting article | adresowanie koperty od firmy | GEO | Sekretariat, office manager | F2 | Intencja **instruktażowa**, nie zakupowa: wzór adresu i układ, CTA dopiero pod treścią merytoryczną. Filar F2 świadomie **nie ma** sekcji ze wzorem adresu — opisuje wyłącznie zakres usługi („co drukujemy"), więc ta pozycja nie koliduje | [ ] |
| 15 | Koperty z imieniem i nazwiskiem — jak przygotować listę | Supporting article | koperty z imieniem i nazwiskiem | RUCH | Office manager, HR | F2 | Dotyczy **przygotowania danych po stronie klienta** (eksport z CRM, odmiana nazwisk, ujednolicenie zapisu); filar F2 podaje wyłącznie specyfikację arkusza (kolumny, pola wymagane, walidacja), poz. 8 — wybór trybu. Trzy różne pytania użytkownika | [ ] |
| 16 | Realizacja ekspresowa w 2 dni robocze | Aktualizacja | szybka realizacja kopert | KONWERSJA | Agencje eventowe, „na już" | F1 | Dodać tabelę terminów i linki w górę do F1 i F3 | [ ] |

---

## Faza 2 · Branże (tydzień 5–7)

Cel fazy: przełożyć 22 profile klienta z bazy wiedzy na strony, które mówią językiem branży.
**Warunek wejścia:** każda pozycja opiera się na istniejącym zdjęciu z `public/images/prints/`
lub `personalized/` — buduj treść wokół zdjęcia, które faktycznie masz.

### Tydzień 5

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | Koperty dla kancelarii prawnych — `/koperty-dla-kancelarii` | Supporting LP | koperty dla kancelarii | KONWERSJA | Kancelarie, notariusze | F1 | Kolory stonowane (czarny, granat, taupe), pisma i akty. Nie powtarza cennika z poz. 9 — linkuje | [ ] |
| 18 | Koperty dla hoteli — `/koperty-dla-hoteli` | Supporting LP | koperty firmowe dla hotelu | KONWERSJA | Hotele 4–5*, resorty | F4 | Welcome letters i vouchery pobytowe; filar F4, bo dominuje zastosowanie voucherowe | [ ] |
| 19 | Koperty na bony do salonu SPA — `/koperty-dla-salonow-spa` | Supporting LP | koperty na bony podarunkowe | KONWERSJA | SPA, kosmetyka, masaż | F4 | Język branży usługowej („bon", „zabieg"), nie poligrafii. Sezon: publikować przed IV kw. | [ ] |
| 20 | Koperta na voucher — jaki format i kolor wybrać | Supporting article | koperta ozdobna na voucher | GEO | Właściciel salonu | F4 | Doradcza; filar F4 sprzedaje, ten wpis odpowiada na pytanie „jaka" | [ ] |

### Tydzień 6

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 21 | Koperty dla biur rachunkowych — `/koperty-dla-biur-rachunkowych` | Supporting LP | koperty firmowe z logo | KONWERSJA | Biura rachunkowe, audyt | F1 | Sprawozdania i korespondencja cykliczna; odróżnia się od poz. 17 sezonowością (zamknięcie roku) | [ ] |
| 22 | Koperty dla klinik i gabinetów — `/koperty-dla-klinik` | Supporting LP | koperty na vouchery dla kliniki | KONWERSJA | Med. estetyczna, stomatologia | F4 | Jasne, „czyste" barwy; osobno od poz. 19 — inny cykl zakupowy i inny język | [ ] |
| 23 | Koperty dla restauracji — `/koperty-dla-restauracji` | Supporting LP | koperty na vouchery do restauracji | KONWERSJA | Fine dining, winiarnie | F4 | Vouchery na kolacje; publikacja przed sezonem świątecznym | [ ] |
| 24 | Bon podarunkowy — jak go wręczyć, żeby wyglądał jak prezent | Supporting article | koperta do vouchera | RUCH | Właściciel usługi | F4 | Poradnik prezentacyjny; poz. 20 dotyczy doboru koperty, ten — sposobu wręczenia | [ ] |

### Tydzień 7

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | Koperty dla agencji eventowych — `/koperty-dla-agencji-eventowych` | Supporting LP | koperty na zaproszenia firmowe | KONWERSJA | Agencje eventowe, PR | F1 | **Uwaga:** zaproszenia sugerują C6/K4 — treść prowadzi do DL (zaproszenia składane, programy), reszta jako „wkrótce" | [ ] |
| 26 | Koperty dla biur nieruchomości — `/koperty-dla-nieruchomosci` | Supporting LP | koperty na dokumenty firmowe | KONWERSJA | Nieruchomości premium, deweloperzy | F1 | Akty i umowy; format DL naturalnie pasuje do dokumentów składanych | [ ] |
| 27 | Koperty na certyfikaty i dyplomy — `/koperty-na-certyfikaty` | Supporting LP | koperty na certyfikaty | RUCH | Uczelnie, firmy szkoleniowe | F1 | **Ostrożnie:** dyplom A4 płaski wymaga K4 (niedostępny). Treść mówi wprost o A4 składanym na trzy i kieruje resztę na listę powiadomień | [ ] |
| 28 | Realizacja: koperty z nadrukiem dla hotelu | Supporting article | koperty z nadrukiem firmowym | AUTORYTET | Hotele | F4 | Dowód wykonania na realnym zdjęciu; uzupełnia poz. 18 o warstwę E-E-A-T | [ ] |

---

## Faza 3 · Strony kolorów (tydzień 8–9)

Cel fazy: najtańszy przyrost powierzchni indeksowej w projekcie — dane (hex, gramatura,
bestseller) i zdjęcia już istnieją w `src/lib/catalog.ts` i `public/images/colors/`.
Szablon: `/koperty/[kolor]`, generowany z `COLORS`. CTA wchodzi do konfiguratora
z **preselekcją koloru**.

> **Filar F5 to `/`, nie `/koperty`** (zmiana z 13 sierpnia 2026). Strony kolorów linkują
> w górę do strony głównej anchorem `koperty ozdobne`, a strona główna linkuje w dół z tabeli
> gramatur — nazwa koloru w tabeli zamienia się wtedy z odnośnika do konfiguratora na odnośnik
> do strony koloru. Każda strona koloru celuje w `[kolor] koperty dl`; frazy `koperty ozdobne`
> i `koperty kolorowe` pozostają przy `/`.

### Tydzień 8

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 29 | Czarne koperty DL — `/koperty/czarny` | Supporting LP | czarne koperty z logo | KONWERSJA | Kancelarie, tatuaż, premium | F5 | Fraza należy jednocześnie do K1 — właścicielem jest strona koloru, F1 tylko linkuje | [ ] |
| 30 | Granatowe koperty DL — `/koperty/granatowy` | Supporting LP | granatowe koperty dl | KONWERSJA | Kancelarie, korporacje | F5 | Wariant kolorystyczny, bez powielania treści usługowej z F1/F2 | [ ] |
| 31 | Złote koperty DL — `/koperty/zloty` | Supporting LP | złote koperty dl | KONWERSJA | Eventy, wesela, gale | F5 | Wykończenie metaliczne bez dopłaty — to główny argument strony | [ ] |
| 32 | Koperty ecru DL — `/koperty/ecru` | Supporting LP | koperta dl beżowa | KONWERSJA | Ślub, kliniki, hotele | F5 | **Most nazewniczy:** „beżowa" → Ecru. Zdanie mostkujące w treści, bez tworzenia koloru w katalogu | [ ] |

### Tydzień 9

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 33 | Białe koperty DL — `/koperty/bialy` | Supporting LP | białe koperty dl | KONWERSJA | Wszystkie | F5 | Podkreślić czytelność nadruku i adresowania — argument techniczny, nie estetyczny | [ ] |
| 34 | Koperty matcha DL — `/koperty/matcha` | Supporting LP | koperty matcha | RUCH | Agencje kreatywne, eko-marki | F5 | Kolor niszowy = niska konkurencja; realna szansa na szybką pozycję | [ ] |
| 35 | Koperty błękit łupkowy DL — `/koperty/blekit-lupkowy` | Supporting LP | koperty błękit łupkowy | RUCH | Agencje, hotele | F5 | Gramatura 120 g — wyróżnik do wyeksponowania | [ ] |
| 36 | Koperty taupe DL — `/koperty/taupe` | Supporting LP | koperty taupe | RUCH | Kancelarie, nieruchomości | F5 | Gramatura 140 g — najgrubszy papier w ofercie, mocny argument „premium" | [ ] |

> **Backlog kolorów (11 pozycji):** szara, niebieski, jasnoniebieska, ciemnozielony, jasnozielony,
> czerwony, różowa, eko, żółta, srebrna perłowa, biała perłowa. Do realizacji w partiach po 4
> po zamknięciu Fazy 4 — priorytet niższy, bo brak dla nich fraz w eksporcie.

---

## Faza 4 · Premium, pieniądze, klaster ślubny (tydzień 10–12)

### Tydzień 10

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 37 | Eleganckie koperty premium — `/koperty-premium` | Pillar (LP) | koperty premium | KONWERSJA | Premium B2B | H `/` | „Premium" udowodnione parametrem (115–140 g, perła i metalik bez dopłaty), nie przymiotnikiem | [ ] |
| 38 | Gramatura papieru w kopertach — 115, 120 i 140 g | Supporting article | eleganckie koperty premium | GEO | Zakupowiec, grafik | `/koperty-premium` | Tabela gramatur per kolor — materiał wprost pod cytowanie przez modele | [ ] |
| 39 | Koperty na pieniądze — `/koperty-na-pieniadze` | Pillar (LP) | koperty na pieniądze | KONWERSJA | Detal + firmy (premie, nagrody) | H `/` | Klaster detaliczny — **termin realizacji podany nad CTA**, inaczej wygeneruje odbicia | [ ] |
| 40 | Personalizowana koperta na pieniądze — kiedy się opłaca | Supporting article | personalizowana koperta na pieniądze | KONWERSJA | Detal, HR (premie imienne) | F2 | Upsell usługi +2,99 zł; poz. 39 sprzedaje kopertę gładką, ta pozycja usługę | [ ] |

### Tydzień 11 — klaster ślubny w trybie content-first

> Bez CTA zakupowego na C6/K4. Konwersją jest zapis na powiadomienie o dostępności formatów.
> Wyjątek: personalizacja i koperty na pieniądze są dostępne **dziś** na formacie DL.

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 41 | Jak dobrać kopertę do zaproszeń | Aktualizacja | koperty na zaproszenia | RUCH | Eventy, ślub | F3 | Rozbudowa istniejącego wpisu o zapis na powiadomienie. **Nowej strony nie tworzymy — właściciel frazy już istnieje.** Link w górę do F3 (pole `pillar`) dodany przy poz. 3. **Tabeli dopasowań nie dublować** — stoi na F3; wpis zostaje przy doborze koperty do zaproszenia | [ ] |
| 42 | Koperty na zaproszenia ślubne — poradnik doboru | Supporting article | koperty na zaproszenia ślubne | RUCH | Para młoda, wedding planner | poz. 41 | Inna persona i inny słownik niż poz. 41 (firmowe/eventowe) — to jedyne, co uzasadnia osobny URL | [ ] |
| 43 | Personalizowane koperty ślubne — adresowanie drukiem | Supporting article | personalizowane koperty slubne | KONWERSJA | Para młoda, wedding planner | F2 | **Jedyna pozycja ślubna z realnym CTA** — personalizacja działa dziś na DL | [ ] |
| 44 | Koperty na pieniądze na ślub — format i kolor | Supporting article | koperty na pieniadze na slub | RUCH | Gość weselny, detal | `/koperty-na-pieniadze` | Wąska intencja okazjonalna; poz. 39 obsługuje ogólną | [ ] |

### Tydzień 12 — procesy B2B i przegląd

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 45 | Faktura VAT i odroczony termin przy zamówieniu kopert | Supporting article | koperty firmowe faktura vat | KONWERSJA | Instytucje, jednostki budżetowe | F1 | Rozbraja barierę rozliczeniową — realna przewaga oferty, nieopisana nigdzie indziej | [ ] |
| 46 | Koperty z nadrukiem od 10 sztuk — dlaczego jest minimum | Supporting article | koperty z nadrukiem od 10 sztuk | GEO | Małe firmy, pierwszy zakup | F1 | Odpowiedź na realną obiekcję; F1 podaje MOQ, ta pozycja je uzasadnia | [ ] |
| 47 | Realizacja: 3 000 kopert DL dla kancelarii | Aktualizacja | koperty dla kancelarii | AUTORYTET | Kancelarie | `/koperty-dla-kancelarii` | Podlinkować w górę do LP z poz. 17 i uzupełnić o zdjęcia realizacji | [ ] |
| 48 | Przegląd kwartalny: audyt kanibalizacji i aktualizacja map | Aktualizacja | — | — | — | — | Przegląd `keywords.md` i `content-plan.md`, weryfikacja pozycji, kwalifikacja treści do przepisania lub scalenia | [ ] |

---

## Dziennik wdrożeń

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
| Brak analityki (GA4 / GSC) | Cel „wejścia do konfiguratora" niemierzalny; priorytety opierają się na intencji, nie na danych | Wdrożenie zapowiedziane |
| Formaty C6 i K4 `disabled` | Klaster ślubny (K9) bez CTA zakupowego; poz. 27 ograniczona do A4 składanego | Właściciel — uruchomienie formatów |
| Zdjęcia produktowe to PNG po 0,5–0,75 MB, serwowane przez `<img>` bez `next/image` | Strona główna pobiera ~9 MB obrazów; realne ryzyko dla LCP i pozycji. Doraźnie założono `loading="lazy"`, ale to nie zmniejsza wagi plików | Właściciel — konwersja do WebP/AVIF albo przejście na `next/image` |
| Profile FB / Instagram / LinkedIn | `Organization.sameAs` pusty do czasu utworzenia | Właściciel — po założeniu przekazać adresy |

---

*Plan jest dokumentem żywym. Po każdej publikacji agent odhacza pozycję i weryfikuje,
czy kolejne wpisy nie kolidują z tym, co już powstało. Zmiana oferty (nowy format, nowy kolor,
zmiana ceny) wymaga przeglądu całego planu, nie tylko dotkniętej pozycji.*
