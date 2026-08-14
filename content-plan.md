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
| **F3 — Format DL** | `/koperty-dl` | K4 | „jakie wymiary, co się zmieści" |
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
| 2 | Personalizowane koperty i adresowanie — `/koperty-personalizowane` | Pillar (LP) | personalizowane koperty | KONWERSJA | **Każdy, kto wysyła imiennie** — sekretariat, HR, hotele, uczelnie, eventy | — | Obsługuje trzy nazwy jednej usługi (personalizacja / adresowanie / imiona i nazwiska) w jednym URL — nie rozbijać na osobne strony | [ ] |
| 3 | Koperty DL — wymiary 110 × 220 mm — `/koperty-dl` | Pillar (LP) | koperty dl wymiary | GEO | Wszystkie (wejście TOFU) | — | Jedyna strona odpowiadająca na pytania o specyfikację. Sekcja kolorów DL linkuje do F5, nie duplikuje jej | [ ] |
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
| 8 | Adresowanie kopert: ręcznie czy z arkusza | Aktualizacja | adresowanie kopert z arkusza | AUTORYTET | Office manager | F2 | Zawęzić do porównania dwóch trybów; frazę `adresowanie kopert` oddać filarowi F2 | [ ] |

---

## Faza 1 · Cena, specyfikacja, cytowalność (tydzień 3–4)

Cel fazy: obudować filary treścią, którą modele językowe cytują najchętniej — konkretami
liczbowymi i porównaniami. Najtańszy dostępny kanał widoczności dla domeny bez historii.

### Tydzień 3

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Ile kosztuje nadruk logo na kopertach — pełny cennik | Supporting article | koperty z nadrukiem cena | GEO | Decydent budżetowy | F1 | Jedyne miejsce z rozpisanym działaniem 2,58 + 1,99 zł; filar F1 pokazuje cenę, ale nie rozkłada jej na czynniki | [ ] |
| 10 | Koperta DL, C6 czy K4 — czym się różnią | Supporting article | format do koperty dl | GEO | Wszystkie | F3 | Porównanie formatów; **wzmianka o C6/K4 jako „wkrótce"**, bez CTA zakupowego na te formaty | [ ] |
| 11 | Jaka kartka zmieści się w kopercie DL | Supporting article | kartka do koperty dl | GEO | Wszystkie | F3 | Tabela dopasowań wkładek; nie powtarza sekcji wymiarów z F3, tylko ją rozwija o zastosowanie | [ ] |
| 12 | Paleta 19 kolorów — jak wybrać odcień | Aktualizacja | kolory kopert | RUCH | Marketing, brand manager | F5 | Podlinkować w górę do nowego huba `/koperty` i w dół do stron kolorów z Fazy 3 | [ ] |

### Tydzień 4

| # | Tytuł / URL | Format | Główna fraza | Cel | Persona / Branża | Filar | Uwagi (antykanibalizacja) | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 13 | Koperty bez okienka — kiedy je wybrać | Supporting article | koperty bez okienka | GEO | Kancelarie, biura rachunkowe | F3 | Cała oferta jest bez okienka — treść wykorzystuje to jako wyróżnik, nie jako filtr produktowy | [ ] |
| 14 | Jak zaadresować kopertę wysyłaną przez firmę — wzór | Supporting article | adresowanie koperty od firmy | GEO | Sekretariat, office manager | F2 | Intencja **instruktażowa**, nie zakupowa: wzór adresu i układ, CTA dopiero pod treścią merytoryczną | [ ] |
| 15 | Koperty z imieniem i nazwiskiem — jak przygotować listę | Supporting article | koperty z imieniem i nazwiskiem | RUCH | Office manager, HR | F2 | Dotyczy przygotowania danych (arkusz, odmiana nazwisk); poz. 8 dotyczy wyboru trybu — inne pytanie użytkownika | [ ] |
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
| 41 | Jak dobrać kopertę do zaproszeń | Aktualizacja | koperty na zaproszenia | RUCH | Eventy, ślub | F3 | Rozbudowa istniejącego wpisu o tabelę dopasowań i zapis na powiadomienie. **Nowej strony nie tworzymy — właściciel frazy już istnieje** | [ ] |
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
- **do filara:** nagłówek serwisu (nawigacja), stopka (sekcja „Sklep"), strona główna
  (sekcja „Realizacje"), wpisy `koperty-firmowe-z-nadrukiem-…` i `ekspresowa-realizacja-2-dni-robocze`
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
