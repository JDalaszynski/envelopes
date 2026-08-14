# Baza fraz kluczowych — Envelopes

Źródło: eksport Semstorm (nisza: koperty ozdobne, nadruk, personalizacja).
Status: **62 unikalne frazy** (z listy wejściowej usunięto 6 duplikatów: `koperty z nadrukiem`,
`koperta personalizowana`, `personalizowane koperty`, `koperty z logo firmy` — powtórzone w liczbie
pojedynczej/mnogiej jako osobne rekordy).

Frazy zapisane są **w formie, w jakiej wystąpiły w eksporcie** (część bez polskich znaków —
`slub`, `pieniadze`, `voucherow`). To celowe: to realne zapytania użytkowników i mają wpływ na
dobór wariantów w treści, ale **w treści na stronie zawsze piszemy poprawną polszczyzną**.

> **Do uzupełnienia z Semstorm:** wolumen miesięczny, trudność (KD), CPC, trend sezonowy.
> Kolumna `Wol.` została przygotowana pod te dane — bez nich priorytety poniżej opierają się na
> ocenie intencji zakupowej i dopasowaniu do oferty, nie na twardych wolumenach.

---

## Legenda

| Oznaczenie | Znaczenie |
| --- | --- |
| **Intencja** | `TRANS` transakcyjna · `KOM` komercyjna (porównanie/wybór) · `INFO` informacyjna |
| **Lejek** | `BOFU` gotowy do zakupu · `MOFU` wybiera dostawcę · `TOFU` szuka wiedzy |
| **P** | Priorytet: `P0` natychmiast · `P1` kwartał · `P2` backlog |
| **URL** | `[ISTNIEJE]` strona już jest · `[PROPOZYCJA]` do zbudowania |

**Zasada jednego właściciela:** każdy klaster ma dokładnie jeden URL docelowy. Frazy wspierające
nie dostają własnych podstron — trafiają do nagłówków H2/H3, FAQ i tekstu strony właściciela.
Naruszenie tej zasady = kanibalizacja.

---

## K1 — Koperty z nadrukiem / logo firmowe (rdzeń B2B) · P0

Najsilniejszy komercyjnie klaster. Pokrywa się 1:1 z płatną usługą (+1,99 zł/szt.) i z profilem
klienta z bazy wiedzy (kancelarie, hotele, kliniki, agencje). Intencja niemal wyłącznie firmowa.

**URL docelowy:** `/koperty-z-nadrukiem` `[ISTNIEJE]` — opublikowany 13 sierpnia 2026.
Wpis blogowy `koperty-firmowe-z-nadrukiem-co-przygotowac-przed-zamowieniem` oddał frazę
transakcyjną filarowi (przepisane `keywords`, link w górę) i obsługuje wyłącznie intencję
procesową „jak przygotować plik do druku".

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty z nadrukiem | **główna** | TRANS | BOFU | — | P0 |
| koperta z nadrukiem | wariant lp. | TRANS | BOFU | — | P0 |
| koperty firmowe z nadrukiem | wspierająca | TRANS | BOFU | — | P0 |
| koperty z nadrukiem firmowym | wspierająca | TRANS | BOFU | — | P0 |
| koperty z logo firmy | wspierająca | TRANS | BOFU | — | P0 |
| koperta z logo firmy | wariant lp. | TRANS | BOFU | — | P0 |
| koperty firmowe z logo | wspierająca | TRANS | BOFU | — | P0 |
| koperty z logo | wspierająca | TRANS | BOFU | — | P1 |
| koperty z własnym nadrukiem | wspierająca | TRANS | BOFU | — | P1 |
| koperta z własnym nadrukiem | wariant lp. | TRANS | BOFU | — | P1 |
| koperty z własnym logo | wspierająca | TRANS | BOFU | — | P1 |
| koperty na zamówienie z nadrukiem | wspierająca | TRANS | BOFU | — | P1 |
| koperty z nadrukiem cena | **sekcja cenowa** | KOM | BOFU | — | P0 |
| koperty dl z nadrukiem | pomost do K4 | TRANS | BOFU | — | P0 |
| koperta dl z nadrukiem | wariant lp. | TRANS | BOFU | — | P0 |
| czarne koperty z logo | pomost do K5 | TRANS | BOFU | — | P1 |

**Notatki wdrożeniowe:**
- `koperty z nadrukiem cena` to fraza o najwyższym potencjale GEO — wymaga jawnej, cytowalnej
  tabeli cenowej (2,58 zł DL + 1,99 zł nadruk = 4,57 zł brutto/szt., MOQ 10 szt.). Modele językowe
  cytują konkretne liczby z jednostką i statusem VAT, nie „ceny od".
- Wejście do konfiguratora z tej strony musi ustawiać krok nadruku (`step`), nie krok 1.

---

## K2 — Personalizacja i adresowanie kopert · P0

Drugi filar usługowy (+2,99 zł/szt.) i jedyny realny wyróżnik wobec hurtowni papierniczych.
Klaster jest rozdrobniony leksykalnie — jedna strona musi obsłużyć trzy nazwy tej samej usługi:
*personalizacja*, *adresowanie*, *imiona i nazwiska na kopertach*.

**URL docelowy:** `/koperty-personalizowane` `[PROPOZYCJA]`
**Wsparcie:** wpis `adresowanie-kopert-recznie-czy-z-arkusza` `[ISTNIEJE]` — zostaje jako TOFU,
z linkiem do nowej strony usługowej.

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| personalizowane koperty | **główna** | TRANS | BOFU | — | P0 |
| personalizowana koperta | wariant lp. | TRANS | BOFU | — | P0 |
| koperta personalizowana | wariant szyku | TRANS | BOFU | — | P0 |
| adresowanie kopert | **główna (usługa)** | TRANS | BOFU | — | P0 |
| koperty adresowane | wspierająca | TRANS | BOFU | — | P1 |
| koperta z adresem | wspierająca | KOM | MOFU | — | P1 |
| adresowanie koperty od firmy | wspierająca B2B | INFO | MOFU | — | P1 |
| koperty z imieniem i nazwiskiem | wspierająca | TRANS | BOFU | — | P1 |
| koperty imienne | wspierająca | TRANS | BOFU | — | P1 |
| nazwiska na kopertach | wspierająca | INFO | MOFU | — | P2 |

**Notatki wdrożeniowe:**
- `adresowanie koperty od firmy` ma intencję instruktażową („jak zaadresować kopertę wysyłaną
  przez firmę") — to nie jest fraza zakupowa. Obsłużyć blokiem H2 z wzorem adresu + zdjęciem,
  a dopiero pod nim CTA. Wepchnięcie tu oferty zabije trafność.
- Dwa tryby zamawiania (wpisanie danych w konfiguratorze / arkusz XLSX) opisać jako tabelę
  porównawczą — to gotowy fragment pod odpowiedzi generatywne.

---

## K3 — Koperty ozdobne / kolorowe (head, brand-defining) · P0

Klaster najszerszy i najbardziej ogólny. Właścicielem jest **strona główna**, bo to tam stoi
konfigurator — przeniesienie tej intencji na podstronę kategorii oddaliłoby użytkownika od
konwersji o jedno kliknięcie.

**URL docelowy:** `/` `[ISTNIEJE]` — przebudowana 13 sierpnia 2026 (content-plan.md poz. 6).

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty ozdobne | **główna** | KOM | MOFU | — | P0 |
| koperta ozdobna | wariant lp. | KOM | MOFU | — | P0 |
| koperty kolorowe | wspierająca | KOM | MOFU | — | P0 |
| koperty ozdobne dl | wspierająca | KOM | BOFU | — | P0 |
| koperta ozdobna dl | wariant lp. | KOM | BOFU | — | P0 |
| koperty dl ozdobne | wariant szyku | KOM | BOFU | — | P0 |
| koperty na listy | peryferyjna | KOM | MOFU | — | P2 |

**Notatki wdrożeniowe:**
- ~~Obecny H1 nie zawiera frazy głównej~~ — **wykonane.** H1 sprzedażowy został zachowany,
  a fraza główna weszła do leadu (pierwsze dwa słowa strony), do H2 nad sekcją kolorów
  („Koperty ozdobne w 19 kolorach — jedna cena za każdy odcień", `#kolory`), do H2 cennika
  i do H2 zastosowań. Nagłówka nie wymieniono na suchy keyword.
- `koperty na listy` to intencja bardziej pocztowa niż ozdobna (koperty białe, tanie, hurtowo).
  Nisko-wartościowa dla tej oferty — obsłużona akapitem w sekcji zastosowań, nie stroną.
- **Rozgraniczenie z filarem K1.** Strona główna wymienia usługę nadruku i jej dopłatę
  (+1,99 zł/szt.), ale **nie ma nagłówka o cenie nadruku i nie rozkłada tej ceny na czynniki** —
  ten materiał należy do `/koperty-z-nadrukiem`. Cennik na stronie głównej dotyczy kopert
  **gładkich** (1 / 50 / 100 / 500 / 1 000 szt.), filar liczy koperty **z nadrukiem**
  (10 / 100 / 500 / 1 000 szt.). Dwie różne tabele, dwa różne produkty, zero nakładania.
- **Rozgraniczenie z K4.** Strona główna podaje wymiary DL i status C6/K4 w tabeli formatów,
  bo bez tego obiecywałaby produkt niedostępny. Nie buduje jednak sekcji „co się zmieści"
  ani nagłówka z frazą `koperty dl wymiary` — to zostaje dla `/koperty-dl`.
- **FAQ rozdzielone.** `FAQ_ITEMS` (strona główna) obsługuje pytania o kopertę ozdobną jako
  produkt: czym jest, ile kosztuje, jakie formaty, jaka dostawa, jakie rozliczenie.
  `PRINT_FAQ_ITEMS` (filar K1) obsługuje pytania drukarskie. Pytanie „Jakie pliki mogę przesłać
  do nadruku?" **usunięto ze strony głównej** — dwa adresy nie mogą konkurować o ten sam wynik
  rozszerzony.

---

## K4 — Format DL: wymiary i specyfikacja · P0

Klaster informacyjny o **najwyższym potencjale GEO w całej bazie**. To pytania o fakty
(wymiary, dopasowanie kartki, okienko) — dokładnie ten typ zapytań, na który odpowiadają
AI Overviews, ChatGPT i Perplexity. Odpowiedź jest jednoznaczna i weryfikowalna, więc łatwo
zostać cytowanym źródłem. Ruch jest TOFU, ale to jedyny format faktycznie dostępny w sprzedaży,
więc ścieżka do konwersji jest krótka.

**URL docelowy:** `/koperty-dl` `[PROPOZYCJA]` — strona hybrydowa: specyfikacja + oferta.

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty dl wymiary | **główna** | INFO | TOFU | — | P0 |
| format do koperty dl | wspierająca | INFO | TOFU | — | P0 |
| kartka do koperty dl | wspierająca | INFO | TOFU | — | P1 |
| koperta prostokątna | wspierająca | KOM | MOFU | — | P2 |
| koperty prostokątne | wariant lm. | KOM | MOFU | — | P2 |
| koperty bez okienka | wspierająca | KOM | MOFU | — | P1 |

**Notatki wdrożeniowe:**
- Wymiar w katalogu to **110 × 220 mm** (`src/lib/catalog.ts`). Każda treść musi używać tej
  wartości — rozbieżność z kartą produktu jest natychmiast wykrywalna i kosztuje wiarygodność.
- `kartka do koperty dl` i `format do koperty dl` wymagają tabeli dopasowań (co się zmieści:
  A4 składane na trzy = 99 × 210 mm, DL wkładka, złożony program). To najczęściej cytowalny
  fragment tego typu strony.
- `koperty bez okienka` — cała oferta jest bez okienka. To gotowy, darmowy wyróżnik: jedno
  zdanie potwierdzające wprost („wszystkie koperty Envelopes są bez okienka adresowego").

---

## K5 — Kolory i warianty formatu (long-tail) · P1

Frazy z eksportu pokrywają tylko 3 z 19 kolorów, ale wzorzec jest oczywisty i skalowalny na
cały katalog: `[kolor] koperty dl`, `koperta dl [kolor]`, `[kolor] koperty z logo`.

**URL docelowy:** `/koperty/[kolor]` `[PROPOZYCJA]` — szablon generowany z `COLORS`
w `src/lib/catalog.ts` (19 stron, każda z własnym zdjęciem produktowym, gramaturą i CTA
wchodzącym do konfiguratora z **preselekcją koloru**).

| Fraza | Rola | Kolor w katalogu | Intencja | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| złote koperty dl | główna wariantu | `zloty` (metaliczne, 115g) | TRANS | — | P1 |
| koperta dl beżowa | główna wariantu | `ecru` / `taupe` — patrz notatka | TRANS | — | P1 |
| czarne koperty z logo | główna wariantu | `czarny` (115g) + nadruk | TRANS | — | P1 |

**Notatki wdrożeniowe:**
- **Luka nazewnicza:** w katalogu nie ma koloru „beżowy". Zapytanie `koperta dl beżowa` obsługują
  `ecru` (#EADFC8) i `taupe` (#9C8C7E). Rozwiązanie: na stronach tych kolorów dodać zdanie
  mostkujące („odcień beżowy — w naszym katalogu **Ecru**"), a nie tworzyć fikcyjnego koloru
  w katalogu produktowym. To samo dotyczy potocznych nazw: kremowy → Ecru, grafitowy → Czarny,
  butelkowy → Ciemnozielony, morelowy/pudrowy → Różowa.
- `czarne koperty z logo` należy jednocześnie do K1 i K5. Właścicielem jest strona koloru
  (bardziej szczegółowa), a strona `/koperty-z-nadrukiem` linkuje do niej z sekcji „popularne
  kolory pod nadruk".
- 19 stron kolorów to najtańszy przyrost powierzchni indeksowej w projekcie — zdjęcia i dane
  (gramatura, hex, bestseller) już istnieją w kodzie.

---

## K6 — Koperty premium / eleganckie · P1

Klaster wizerunkowy, idealnie zgodny z pozycjonowaniem cenowym z bazy wiedzy („nie walczymy ceną").
Niski wolumen, ale bardzo wysoka jakość ruchu — trafia tu klient, który nie porównuje groszy.

**URL docelowy:** `/koperty-premium` `[PROPOZYCJA]` lub sekcja na `/` — decyzja zależy od
wolumenu z Semstorm; przy wolumenie < 50/mc nie budować osobnego URL-a.

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty premium | **główna** | KOM | MOFU | — | P1 |
| koperta premium | wariant lp. | KOM | MOFU | — | P1 |
| eleganckie koperty premium | wspierająca | KOM | MOFU | — | P1 |

**Notatki wdrożeniowe:** „premium" trzeba **udowodnić parametrem**, nie przymiotnikiem —
gramatura 115–140 g, wykończenia perłowe i metaliczne bez dopłaty, 19 odcieni w jednej cenie.
Sama deklaracja luksusu nie rankuje i nie jest cytowana przez modele.

---

## K7 — Koperty na vouchery i bony podarunkowe · P0

**Najbardziej niedoceniony klaster w całej bazie.** Z bazy wiedzy: 9 z 22 profili klientów
(pkt 14–22) opiera sprzedaż na voucherach — salony kosmetyczne, SPA, fine dining, fitness,
tatuaż, biura podróży, teatry, szkoły gotowania. Format DL jest dla vouchera właściwy,
a zamówienia są **cykliczne i sezonowe** (Dzień Matki, Walentynki, Boże Narodzenie) — czyli
wprost pod cel LTV z bazy wiedzy.

**URL docelowy:** `/koperty-na-vouchery` `[PROPOZYCJA]`

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty na vouchery | **główna** | TRANS | BOFU | — | P0 |
| koperty do voucherów | wariant | TRANS | BOFU | — | P0 |
| koperty do voucherow | wariant bez PL znaków | TRANS | BOFU | — | P0 |
| koperta do vouchera | wariant lp. | TRANS | BOFU | — | P0 |
| koperta ozdobna na voucher | wspierająca | TRANS | BOFU | — | P1 |

**Notatki wdrożeniowe:** strona musi mówić językiem branży usługowej („bon podarunkowy",
„karta podarunkowa", „voucher na zabieg"), nie językiem poligrafii. Sekcje pod branże
(SPA / fryzjer / restauracja / klinika) dają naturalne pokrycie long-tail bez tworzenia
osobnych URL-i. Kalendarz publikacji: **wrzesień–październik**, żeby złapać sezon świąteczny.

---

## K8 — Koperty na pieniądze · P1

Klaster o wysokim wolumenie, ale **mieszanej wartości**: dominuje w nim klient detaliczny
(wesele, komunia, chrzciny) kupujący 1–5 sztuk, podczas gdy model biznesowy jest B2B.
Wartość realna: MOQ 1 szt. dla kopert gładkich pozwala go obsłużyć bez wyjątków w procesie,
a ruch buduje autorytet tematyczny domeny.

**URL docelowy:** `/koperty-na-pieniadze` `[PROPOZYCJA]` — **dopiero po** wdrożeniu K1, K2, K7.

| Fraza | Rola | Intencja | Lejek | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty na pieniądze | **główna** | TRANS | BOFU | — | P1 |
| ozdobna koperta na pieniądze | wspierająca | TRANS | BOFU | — | P1 |
| koperta ozdobna na pieniądze | wariant szyku | TRANS | BOFU | — | P1 |
| kolorowe koperty na pieniądze | wspierająca | TRANS | BOFU | — | P2 |
| personalizowana koperta na pieniądze | wspierająca (upsell) | TRANS | BOFU | — | P1 |
| koperty na pieniadze na slub | pomost do K9 | TRANS | BOFU | — | P2 |

**Notatki wdrożeniowe:** `personalizowana koperta na pieniądze` to najcenniejsza fraza klastra —
łączy niski wolumen z usługą za +2,99 zł/szt. i podnosi wartość koszyka. Uwaga na realizm
oczekiwań: klient detaliczny szuka koperty „na już", a realizacja z personalizacją to 5 dni
roboczych (2 dni ekspres). Termin musi być podany wprost nad CTA, inaczej klaster wygeneruje
odbicia i reklamacje.

---

## K9 — Ślub, wesele, zaproszenia · P2 — tryb przygotowawczy (content-first)

⚠️ **Ograniczenie produktowe.** Rynek ślubny zamawia zaproszenia w formatach **C6 (114 × 162 mm)**
i **K4 (155 × 155 mm)** — oba są w katalogu oznaczone `disabled: true` („Dostępne wkrótce").
Budowanie stron **sprzedażowych** na ten klaster teraz oznaczałoby sprowadzanie ruchu na ofertę,
której nie ma — wysoki bounce i spalone frazy.

**Decyzja właściciela:** treści przygotowawcze publikujemy **już teraz**, świadomie i z
wyprzedzeniem. Domena startuje od zera, a strona potrzebuje 3–6 miesięcy dojrzewania w indeksie —
publikowanie po uruchomieniu formatów oznaczałoby stratę całego sezonu. Obowiązuje jeden warunek:
**treść informacyjna i doradcza, zero CTA obiecującego zakup C6/K4**. Konwersja w tym klastrze
to zapis na powiadomienie o dostępności formatów, nie wejście do konfiguratora.

| Fraza | Rola | Format docelowy | Intencja | Wol. | P |
| --- | --- | --- | --- | --- | --- |
| koperty na zaproszenia | główna klastra | C6 / K4 | KOM | — | P2 |
| koperty na zaproszenia ślubne | wspierająca | C6 / K4 | TRANS | — | P2 |
| koperty na slub | wspierająca | C6 / K4 | TRANS | — | P2 |
| koperty weselne | wspierająca | C6 / K4 | TRANS | — | P2 |
| personalizowane koperty slubne | wspierająca | C6 / K4 + personalizacja | TRANS | — | P2 |
| koperta personalizowana na slub | wariant | C6 / K4 | TRANS | — | P2 |
| personalizowana koperta na slub | wariant szyku | C6 / K4 | TRANS | — | P2 |

**Notatki wdrożeniowe:**
- Istniejący wpis `jak-dobrac-koperte-do-zaproszen-firmowych` `[ISTNIEJE]` już opisuje C6 i K4 —
  utrzymać, bo buduje pozycję **zanim** produkt ruszy. To właściwa kolejność: treść wyprzedza
  ofertę o 3–6 miesięcy, bo tyle trwa dojrzewanie strony w indeksie.
- **B2B w tym klastrze jest dostępne już dziś:** wedding plannerzy i agencje eventowe kupują
  koperty DL na vouchery prezentowe i korespondencję z parami. To pomost K9 → K7.
- Nie dodawać fraz ślubnych do `keywords` istniejących wpisów blogowych „na zapas" — to sygnał
  niedopasowania, a nie przewagi.

---

## Mapa klaster → URL (podsumowanie)

| Klaster | URL docelowy | Status | Priorytet | Uzasadnienie kolejności |
| --- | --- | --- | --- | --- |
| K1 Nadruk / logo | `/koperty-z-nadrukiem` | **istnieje** | **P0** | Największa marża, produkt aktywny, intencja czysto zakupowa |
| K2 Personalizacja | `/koperty-personalizowane` | do zbudowania | **P0** | Najwyższa dopłata (+2,99 zł), realny wyróżnik rynkowy |
| K3 Ozdobne / kolorowe | `/` | **przebudowane** | **P0** | Optymalizacja istniejącego zasobu, zero kosztu wdrożenia |
| K4 Format DL | `/koperty-dl` | do zbudowania | **P0** | Najwyższy potencjał cytowań w AI, jedyny dostępny format |
| K7 Vouchery | `/koperty-na-vouchery` | do zbudowania | **P0** | 9 z 22 profili klienta, zakupy cykliczne, brak konkurencji tematycznej |
| K5 Kolory | `/koperty/[kolor]` × 19 | do zbudowania | P1 | Skalowalny long-tail na gotowych danych z katalogu |

> **Decyzja z 13 sierpnia 2026 — hub `/koperty` zdjęty z planu.** Po przebudowie strony głównej
> cała paleta 19 kolorów stoi na `/`: tabela gramatur i wykończeń, `ItemList` w danych
> strukturalnych, most nazewniczy dla nazw potocznych (beżowa → Ecru, butelkowa →
> Ciemnozielony) i 19 wejść do konfiguratora z preselekcją koloru. Osobny hub `/koperty`
> celujący w `koperty kolorowe` konkurowałby z `/` o tę samą frazę i tę samą intencję —
> to byłaby kanibalizacja własnej strony głównej. **Frazy `koperty ozdobne` i `koperty kolorowe`
> zostają przy `/`.** Strony `/koperty/[kolor]` z K5 powstają bez huba pośredniego: linkują
> w górę wprost do `/` i celują w `[kolor] koperty dl`, czyli w intencję wariantową, której
> strona główna nie obsługuje.
| K6 Premium | `/koperty-premium` | do zbudowania | P1 | Zgodność z pozycjonowaniem, ale niski wolumen |
| K8 Na pieniądze | `/koperty-na-pieniadze` | do zbudowania | P1 | Duży wolumen, niższa wartość klienta |
| K9 Ślub | blog + lista powiadomień | content-first | P2 | Treść wyprzedza ofertę; **bez CTA zakupowego do czasu startu C6/K4** |

---

## Luki w bazie (frazy, których w eksporcie brakuje, a powinny być)

Eksport Semstorm pokrywa popyt ogólny, ale pomija trzy grupy zapytań, które są najbliżej
profilu klienta z bazy wiedzy. Do zweryfikowania w kolejnym eksporcie:

1. **Branżowe:** `koperty dla kancelarii`, `koperty dla hotelu`, `koperty firmowe dla kliniki`,
   `koperty na certyfikaty`, `koperty na dyplomy`, `koperty do umów`.
2. **Procesowe / B2B:** `koperty firmowe faktura vat`, `koperty z nadrukiem od 10 sztuk`,
   `koperty hurtowo z logo`, `koperty z nadrukiem odroczony termin płatności`,
   `koperty z nadrukiem wysyłka kurierem`.
3. **Generatywne (pytania pełnym zdaniem)** — nie pojawiają się w klasycznych narzędziach
   keywordowych, bo są zadawane modelom, nie wyszukiwarkom: „jakie koperty na zaproszenia
   firmowe", „ile kosztuje nadruk logo na kopertach", „jaka koperta na voucher", „czym różni
   się koperta DL od C6", „ile trwa druk kopert z logo". To materiał na sekcje FAQ i akapity
   odpowiedzi — patrz agent `seo-geo-strategist`.

---

*Plan realizacji tych klastrów: [content-plan.md](content-plan.md).
Utrzymanie pliku: agent `seo-geo-strategist` (`.claude/agents/seo-geo-strategist.md`).
Przy każdej zmianie oferty (nowy format, nowy kolor, zmiana ceny) plik wymaga przeglądu —
w szczególności klaster K9, który odblokowuje się w momencie uruchomienia C6 i K4.*
