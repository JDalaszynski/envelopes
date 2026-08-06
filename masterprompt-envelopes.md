# MASTERPROMPT: „Envelopes” — kompaktowy, konwersyjny e-commerce B2B

> **Jak używać:** Skopiuj całą poniższą treść i wklej jako pierwszą wiadomość do narzędzia generującego kod (Claude, v0, Cursor itp.) — najlepiej takiego, które sprawnie obsługuje Next.js. Stack jest już ustalony (Vercel + Firebase + Brevo, szczegóły w sekcji 8.1) i nie wymaga decyzji. Wszystkie założenia biznesowe w Sekcji 1 są potwierdzone, łącznie z cenami bazowymi (pkt 1.2) — dokument jest kompletny i gotowy do wysłania.

---

## 0. ROLA I CEL

Jesteś senior product designerem i frontend developerem specjalizującym się w e-commerce B2B nastawionym na konwersję sprzedażową. Zbuduj kompaktowy, w pełni klikalny prototyp sklepu internetowego **„Envelopes”**, sprzedającego koperty ozdobne. Priorytety w kolejności: (1) jasność ścieżki zakupowej, (2) zaufanie i wiarygodność B2B, (3) estetyka spójna z produktem (korespondencja, papeteria), (4) kompletność funkcjonalna wszystkich podstron wymienionych w sekcji 3.

**Stack technologiczny (ustalony):** Next.js (App Router) wdrożony na **Vercel**. Backend/dane w **Firebase**: Firestore jako baza danych, Firebase Authentication do logowania (e-mail+hasło oraz Google OAuth), Firebase Storage do plików nadruku/personalizacji/wizualizacji. E-maile transakcyjne i newsletter przez **Brevo** (dawniej Sendinblue). Pełny podział odpowiedzialności między te trzy usługi opisany w sekcji 8.1. Kod ma być modularny — osobne komponenty dla konfiguratora, kart produktowych, formularzy itd.

**Zdjęcia:** Nie generuj ani nie linkuj żadnych prawdziwych zdjęć. Wszędzie, gdzie w realnym sklepie byłoby zdjęcie produktu/koperty, wstaw jednolity, stonowany placeholder (prostokąt w proporcjach realnego zdjęcia, z ikoną koperty i podpisem tekstowym, np. „[Koperta — DL, Granatowy]”). Placeholdery powinny dynamicznie odzwierciedlać wybrany kolor jako tło (subtelny odcień), żeby konfigurator dawał namiastkę podglądu bez prawdziwej fotografii produktowej.

---

## 1. PARAMETRY BIZNESOWE (w pełni potwierdzone)

### 1.1 Produkt
- Formaty: **K4, C6, DL** (dodaj realne wymiary mm przy każdym, np. DL 110×220, C6 114×162, K4 230×330 — użyj standardowych wartości poligraficznych).
- Kolory (19): Biały, Eko, Czarny, Złoty, Matcha, Taupe, Granatowy, Niebieski, Błękit Łupkowy, Ecru, Ciemnozielony, Jasnozielony, Czerwony, Szara, Biała Perłowa, Srebrna Perłowa, Jasnoniebieska, Żółta, Różowa.

### 1.2 Cennik (potwierdzone)
- Cena zależy **wyłącznie od formatu** koperty (K4 / C6 / DL) — wszystkie 19 kolorów mają identyczną cenę w danym formacie, bez dopłat za kolory „premium” (perłowe/metaliczne).
- Konkretne stawki cenowe per format (przechowywane jako edytowalna konfiguracja w kolekcji Firestore `pricing`, patrz sekcja 8.1): **DL — 1,35 zł/szt, C6 — 0,89 zł/szt, K4 — 0,92 zł/szt** (brutto).
- **Brak rabatów ilościowych** — cena jednostkowa jest stała niezależnie od wielkości zamówienia.
- Nadruk: **+1,83 zł brutto/szt.**
- Personalizacja/adresowanie: **+2,94 zł brutto/szt.**
- Wysyłka ekspresowa: **+1,50 zł brutto/szt.** (standard bez dopłaty, 5 dni roboczych; ekspres 2 dni robocze).
- MOQ: **10 szt.** dla koperty z nadrukiem. Koperta **bez nadruku — od 1 szt.** (brak minimum).

### 1.3 Personalizacja (adresowanie) — potwierdzone
Klient wybiera jedną z dwóch metod (oba warianty dostępne równolegle w konfiguratorze):
- **Wpisz ręcznie** — formularz z polami adresowymi wprost w konfiguratorze, dla mniejszych/pojedynczych zamówień. Przy większej ilości kopert formularz pozwala dodać kolejne komplety adresowe (powtarzalny blok pól).
- **Pobierz i uzupełnij szablon** — klient pobiera z poziomu konfiguratora gotowy plik Excel (wygenerowany automatycznie na podstawie wybranej ilości kopert, z odpowiednią liczbą wierszy do wypełnienia), uzupełnia go poza systemem, a następnie wgrywa wypełniony plik z powrotem (drag&drop, walidacja liczby wierszy vs. wybrana ilość, komunikat o niezgodności/błędach formatu).

### 1.4 Nadruk — pliki
Akceptowane formaty: **PDF, AI, EPS, CDR, PNG, JPG, SVG**. Maks. 10 MB/plik, do 3 załączników. Każdy załącznik pokazany jako karta: ikona typu pliku, nazwa, rozmiar, status („Przesłano” / „Weryfikacja” / „Błąd formatu”), przycisk usuń/podmień.

### 1.5 Płatności i dostawa — potwierdzone
- Płatności: **Przelewy24** (obejmuje kartę i szybkie przelewy), **BLIK**, **przelew tradycyjny**, oraz **faktura z odroczonym terminem płatności** — ta ostatnia widoczna wyłącznie dla zweryfikowanych kont firmowych z historią zamówień (wymaga akceptacji przez BOK przy pierwszym użyciu). Ekran potwierdzenia i e-mail różnią się zależnie od metody — pełna logika w pkt 1.12.
- Dostawa: **kurier** oraz **Paczkomaty InPost** — wybór punktu przez wbudowany, funkcjonalny **InPost Geowidget** (nie graficzny placeholder — wybrany punkt zapisuje się jako dane dostawy zamówienia). **Brak progu darmowej dostawy** — koszt dostawy widoczny zawsze w podsumowaniu koszyka/checkoutu, niezależnie od wartości zamówienia.

### 1.6 Fakturowanie
Pole NIP **w pełni fakultatywne** przy zaznaczeniu „Kupuję jako firma” — z automatycznym podpowiadaniem danych firmy (placeholder integracji z bazą GUS/REGON). Domyślny dokument sprzedaży: faktura VAT; dla zakupów bez NIP — paragon/faktura imienna.

### 1.7 Blog i język
Cel bloga: **wyłącznie SEO** (ruch organiczny, budowanie widoczności na frazy związane z korespondencją firmową i kopertami ozdobnymi). Poniższe kategorie to propozycja do akceptacji — dostosuj lub zmień wedle strategii contentowej: **Poradniki, Inspiracje, Realizacje klientów, Aktualności**. Język: **wyłącznie polski** — nie buduj przełącznika języka ani struktury i18n, cała treść i UI mają być po polsku.

### 1.8 Identyfikacja zamówienia
Każde zamówienie otrzymuje unikalny numer w formacie **`ENV-RRRRMMDD-XXXX`** (np. `ENV-20260805-0147`), generowany w momencie złożenia zamówienia. Numer ten:
- jest widoczny dla klienta na stronie potwierdzenia, w panelu „Złożone zamówienia” i na fakturze,
- jest przekazywany jako identyfikator referencyjny do bramki **Przelewy24**, dzięki czemu płatność w Przelewy24 da się jednoznacznie powiązać z konkretnym zamówieniem w sklepie i odwrotnie,
- jest głównym identyfikatorem wyszukiwania w panelu Admina (sekcja 6.12).

### 1.9 Ustandaryzowana nazwa produktu
Każda pozycja koszyka/zamówienia wyświetlana jest wg jednego, spójnego szablonu — używanego konsekwentnie w konfiguratorze, koszyku, checkoucie, panelu klienta i panelu Admina:

`Koperta [Format] [Kolor] [z nadrukiem] [z personalizacją] [wysyłka standard/ekspres]`

Elementy w nawiasach pojawiają się tylko, jeśli dotyczą danej konfiguracji. Przykłady:
- `Koperta DL Granatowy wysyłka standard`
- `Koperta C6 Ecru z nadrukiem wysyłka ekspres`
- `Koperta K4 Biała Perłowa z nadrukiem z personalizacją wysyłka ekspres`

### 1.10 Statusy zamówień
Kanoniczny zestaw statusów, spójny w panelu klienta i panelu Admina:
**Nowe → W trakcie → Czeka na akceptację → Do druku → Zrealizowane.**
Status **Czeka na akceptację** dotyczy wyłącznie zamówień z nadrukiem i/lub personalizacją — zamówienia bez tych opcji pomijają go całkowicie (patrz pkt 1.11). Dodatkowo (rekomendowane rozszerzenie, do akceptacji): **Anulowane** — dla obsługi zwrotów/rezygnacji, żeby Admin miał gdzie „odłożyć” zamówienie, które nie przejdzie dalej w procesie.

### 1.11 Akceptacja wizualizacji (przy nadruku/personalizacji)
Jeśli zamówienie zawiera nadruk i/lub personalizację, po jego złożeniu **grafik ręcznie przygotowuje wizualizację** produktu — to proces manualny, nie automatyczny podgląd generowany przez konfigurator, i toczy się **niezależnie od tego, czy płatność już wpłynęła** (patrz pkt 1.12). Przebieg:
1. Zamówienie ma status **Nowe**, następnie **W trakcie** — grafik pracuje nad wizualizacją na bazie przesłanych plików/danych adresowych.
2. Gdy wizualizacja jest gotowa, Admin dołącza ją do zamówienia w panelu (6.12). System automatycznie wysyła klientowi e-mail i zmienia status na **Czeka na akceptację**.
3. E-mail zawiera: numer zamówienia, podgląd wizualizacji (placeholder), oraz dwie jasne akcje: **„Akceptuję projekt”** i **„Zgłoś uwagi”**. Link prowadzi do dedykowanego widoku akceptacji — dostępnego też z poziomu panelu „Złożone zamówienia” (6.11) dla zalogowanych klientów, bez konieczności logowania dla gości (bezpieczny token w linku).
4. Klient akceptuje → wizualizacja oznaczona jako zaakceptowana. Zamówienie przechodzi do statusu **Do druku** tylko, gdy spełniona jest też reguła bramkująca dot. płatności z pkt 1.12 (dla części zamówień akceptacja projektu i wpłata mogą nadejść w innej kolejności).
5. Klient zgłasza uwagi → zamówienie zostaje w statusie **Czeka na akceptację**, uwagi trafiają do grafika (widoczne w panelu Admina), grafik przygotowuje poprawioną wersję, cykl się powtarza.
6. Zamówienia **bez** nadruku i personalizacji pomijają ten krok całkowicie: **Nowe → W trakcie → Do druku → Zrealizowane** — klient nie otrzymuje żadnego e-maila z prośbą o akceptację.

Ten mechanizm warto zakomunikować klientowi **zanim** złoży zamówienie — patrz mikrocopy w Kroku 4/5 konfiguratora (sekcja 5) — żeby nie było zaskoczenia dodatkowym krokiem po zapłacie; to buduje zaufanie i redukuje niepewność przy zamawianiu spersonalizowanego produktu.

### 1.12 Potwierdzenie zamówienia i status płatności — dwie ścieżki

Niezależnie od głównego **Statusu zamówienia** (pkt 1.10), system śledzi osobne pole **Status płatności: Oczekuje na wpłatę / Opłacone**. Ekran potwierdzenia i e-mail transakcyjny różnią się w zależności od wybranej metody płatności:

**A. Płatność przez bramkę (Przelewy24 — BLIK, karta, szybki przelew).** Płatność potwierdzana automatycznie i natychmiastowo przez bramkę → Status płatności od razu **Opłacone**. Ekran potwierdzenia i e-mail: „Płatność przyjęta — przystępujemy do realizacji zamówienia [numer].” Jeśli zamówienie zawiera nadruk/personalizację, dodatkowo: „Wkrótce otrzymasz e-mail z wizualizacją projektu do akceptacji.”

**B. Płatność przelewem tradycyjnym (proforma).** Status płatności zostaje **Oczekuje na wpłatę**. Ekran potwierdzenia i e-mail zawierają: dane do przelewu (numer konta, kwota, tytuł przelewu = numer zamówienia z pkt 1.8), fakturę proforma do pobrania (PDF), oraz komunikat: „Czekamy na zaksięgowanie wpłaty — druk ruszy dopiero po jej otrzymaniu.” **Niezależnie od statusu płatności**, jeśli zamówienie zawiera nadruk/personalizację, proces przygotowania i wysyłki wizualizacji (pkt 1.11) toczy się równolegle — klient dostaje e-mail z wizualizacją, nawet jeśli jeszcze nie zapłacił. Dzięki temu, gdy wpłata w końcu dotrze, a projekt jest już zaakceptowany, produkcja może ruszyć bez dodatkowej zwłoki.

**Faktura z odroczonym terminem płatności** — traktowana odrębnie: z definicji to zaufany mechanizm kredytowy dla zweryfikowanych klientów B2B, więc **nie blokuje** rozpoczęcia produkcji. Status płatności pozostaje Oczekuje na wpłatę do terminu płatności na fakturze, ale zamówienie może przejść do statusu Do druku od razu po spełnieniu pozostałych warunków. *(To założenie interpretacyjne z mojej strony — jeśli wolisz, żeby faktura z odroczonym terminem również wstrzymywała druk do potwierdzenia wpłaty, tak jak przelew tradycyjny, daj znać i zmienię tę regułę.)*

**Reguła bramkująca status „Do druku”:** zamówienie może zmienić Status zamówienia na **Do druku** wyłącznie, gdy: (1) Status płatności = Opłacone, **lub** metoda płatności to faktura z odroczonym terminem, **oraz** (2) jeśli zamówienie zawiera nadruk/personalizację — wizualizacja została zaakceptowana przez klienta (pkt 1.11). W panelu Admina (6.12) opcja „Do druku” jest zablokowana/wyszarzona, dopóki oba warunki nie są spełnione, z podpowiedzią wyjaśniającą, którego warunku brakuje.

---

## 2. TON MARKI I JĘZYK KOMUNIKACJI

Ton: **profesjonalny, rzeczowy, „korespondencyjny”** — jak dobrze napisany list biznesowy, nie jak agresywny sklep z gadżetami. Unikaj wykrzykników, emoji, sloganów typu „SUPER PROMOCJA!!!”. Stawiaj na precyzję, konkret, szacunek do czasu klienta biznesowego. Zwroty per Ty tylko w kontekście B2C (np. panel klienta indywidualnego); w komunikacji B2B — forma „Państwo” lub neutralna bezosobowa.

Przykładowe frazy w duchu marki: „Skonfiguruj korespondencję, która robi wrażenie, zanim zostanie otwarta.”, „Twoje zamówienie w drodze — jak dobrze zaadresowany list.”

---

## 3. ARCHITEKTURA INFORMACJI (mapa strony)

1. Strona główna (z konfiguratorem)
2. Blog (lista + widok artykułu)
3. Kontakt
4. Regulamin
5. Polityka Prywatności
6. Pliki Cookies
7. Koszyk
8. Zamówienie (checkout)
9. Logowanie / Rejestracja (w tym Google OAuth)
10. Profil Użytkownika
11. Złożone zamówienia

Dodatkowo: **Panel Administracyjny** — osobna, chroniona ścieżka (np. `/admin`), niewidoczna w publicznym menu i nawigacji klienta, opisana szczegółowo w sekcji 6.12.

Header (globalny): logo „Envelopes”, menu (Sklep/Konfigurator, Kolory, Jak to działa, Blog, Kontakt), ikona konta, ikona koszyka z licznikiem, widoczny numer telefonu/e-mail BOK, CTA „Skonfiguruj koperty” (scroll do konfiguratora).

Footer (globalny): mapa strony, linki prawne (Regulamin, Polityka Prywatności, Cookies), dane kontaktowe i rejestrowe firmy (placeholder), ikony metod płatności, social media (placeholder), newsletter signup.

---

## 4. SYSTEM PROJEKTOWY (DESIGN SYSTEM)

### 4.0 Punkt wyjścia i sygnatura

Zamiast domyślnego „premium B2B" (granat + złoto — ta kombinacja jest tak częsta w brandingu korporacyjnym, że sama w sobie nic nie mówi o kopertach), system opiera się wprost na fizyczności korespondencji: papier, atrament, **lak do pieczętowania**. To jedyny naprawdę rozpoznawalny element tej marki — koperty pieczętuje się lakiem — więc lak (a nie złoto) jest tu akcentem i sygnaturą.

**Sygnatura projektu:** wskaźnik kroków w konfiguratorze to nie generyczne kółka z checkmarkiem, tylko **odciski pieczęci lakowej** — każdy ukończony krok „pieczętuje się" (mała bordowa pieczęć wskakuje na miejsce krótką animacją), krok aktywny to pusty, niezapieczętowany okrąg w kolorze atramentu. To jeden odważny, celowy element — reszta interfejsu ma być spokojna i zdyscyplinowana.

### 4.1 Kolory (tokeny)

| Token | Hex | Zastosowanie |
|---|---|---|
| `--color-paper` | `#F5F1E6` | Tło strony — ciepły, papierowy odcień kości słoniowej |
| `--color-surface` | `#FFFFFF` | Karty, panele, pola formularzy — jak czysty arkusz na biurku |
| `--color-ink` | `#20242E` | Tekst główny, nagłówki, ikony, elementy nawigacji |
| `--color-ink-soft` | `#565C6E` | Tekst drugorzędny, opisy, placeholdery pól |
| `--color-wax` | `#7A2A2E` | **Jedyny akcent konwersyjny** — CTA, pieczęć kroku, zaznaczenie, linki aktywne |
| `--color-wax-deep` | `#5E1F22` | Hover/active dla elementów w `--color-wax` |
| `--color-wax-wash` | `#F3E1DE` | Tło zaznaczonego swatcha/karty (delikatny „laka" odcień) |
| `--color-line` | `#E3D9C4` | Obramowania, linie podziału, pole przerywane (drag&drop) |
| `--color-success` | `#3F6B4A` | Stany „zaakceptowano", „przesłano poprawnie" |
| `--color-error` | `#9C4221` | Błędy walidacji (MOQ, zły format pliku) — celowo inny odcień niż `--color-wax`, żeby błąd nigdy nie wyglądał jak akcja |

Zasada: `--color-wax` używany wyłącznie do (1) CTA konwersyjnych, (2) pieczęci kroków, (3) stanu zaznaczenia. Nigdy jako tło dużej powierzchni ani kolor body-tekstu (nie przechodzi kontrastu AA na `--color-paper`).

### 4.2 Typografia

Dwie role, celowo dobrane pod temat korespondencji — bez oczywistej pary „elegancki serif + Inter":

- **Fraunces** (display, nagłówki H1–H3, wordmark „Envelopes") — serif o miękkich, niemal odbitych-tuszem kształtach; przy większych rozmiarach ma charakter zbliżony do typografii pisanej ręcznie/tłoczonej, pasujący do papeterii bez wpadania w kicz zaproszeń ślubnych.
- **IBM Plex Sans** (UI, treść, formularze, nawigacja, przyciski) — czytelna, neutralna, z lekko „urzędowym"/dokumentowym charakterem, który wzmacnia ton „korespondencyjny" z sekcji 2.
- **IBM Plex Mono** (rola utility) — wyłącznie dla: numeru zamówienia (`ENV-...`), cen i podsumowania w koszyku/konfiguratorze, nazw i rozmiarów przesłanych plików, statusu płatności. Efekt „wpisanej na maszynie" danej — dokładnie tam, gdzie precyzja się liczy.

**Skala typograficzna:**

| Token | Rozmiar / line-height | Font / waga | Użycie |
|---|---|---|---|
| `--text-h1` | 44px / 1.1 | Fraunces 600 | Hero, tytuł strony |
| `--text-h2` | 32px / 1.15 | Fraunces 600 | Nagłówki sekcji |
| `--text-h3` | 24px / 1.25 | Fraunces 600 | Tytuły kart, kroków |
| `--text-label` | 18px / 1.4 | Plex Sans 600 | Etykiety kroków, nazwy pól |
| `--text-body` | 16px / 1.6 | Plex Sans 400 | Treść, opisy |
| `--text-small` | 14px / 1.5 | Plex Sans 400 | Podpisy, pomocniczy tekst |
| `--text-eyebrow` | 12px / 1.4, uppercase, spacing 0.08em | Plex Sans 600 | Etykiety kategorii, badge'e |
| `--text-price` | 24px / 1.2 | Plex Mono 500 | Cena łączna w podsumowaniu |
| `--text-mono-sm` | 13px / 1.4 | Plex Mono 400 | Numer zamówienia, nazwy plików |

### 4.3 Odstępy, promienie, cienie

- **Odstępy** (siatka 8px): `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 24px`, `--space-6: 32px`, `--space-7: 48px`, `--space-8: 64px`, `--space-9: 96px`.
- **Promienie** — celowo skromne, bliżej „ciętego papieru" niż miękkiego SaaS-owego UI: `--radius-sm: 4px` (pola, plakietki), `--radius-md: 8px` (przyciski, karty), `--radius-lg: 14px` (duże panele, hero). Bez w pełni owalnych przycisków.
- **Cienie** — miękkie, ciepłe (nie czysto czarne): `--shadow-sm: 0 1px 2px rgba(32,36,46,.08)`, `--shadow-md: 0 6px 20px rgba(32,36,46,.10)`, `--shadow-lg: 0 16px 40px rgba(32,36,46,.14)`.

### 4.4 Ruch

- `--duration-fast: 150ms`, `--duration-base: 220ms`, `--duration-seal: 420ms` (tylko dla animacji pieczęci — patrz 4.0), `--ease-standard: cubic-bezier(.4,0,.2,1)`.
- Jedyny „zorkiestrowany" moment ruchu w całym serwisie to pieczętowanie kroku konfiguratora. Poza tym: wyłącznie ciche przejścia hover/focus (150–220ms) na przyciskach, polach i swatchach koloru. Żadnych animacji wejścia sekcji przy scrollu — to nie jest strona typu landing-showcase, tylko narzędzie zakupowe, które ma działać szybko.
- `prefers-reduced-motion`: animacja pieczęci zredukowana do zwykłego fade, bez skalowania.

### 4.5 Layout konfiguratora

```
DESKTOP
┌────────────────────────────────────────────────────┐
│   ◉───◉───◉───○───○───○   (pieczęcie kroków)        │
├───────────────────────────────┬────────────────────┤
│                                │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │ ← górna krawędź „oderwanej kartki"
│   KARTA KROKU                 │  TWOJA KONFIGURACJA│
│   (format / kolor / ilość...) │  ─────────────────  │
│                                │  Koperta DL         │
│                                │  Granatowy          │
│                                │  ─────────────────  │
│   [← Wstecz]      [Dalej →]   │  Razem: 13,50 zł   │
│                                │  [ Dodaj do koszyka]│ ← przycisk w --color-wax
└────────────────────────────────┴────────────────────┘

MOBILE
┌──────────────────────┐
│  ◉─◉─○─○─○─○          │
├──────────────────────┤
│  KARTA KROKU          │
│  ...                  │
├──────────────────────┤ ← sticky dolny pasek
│ 13,50 zł  [Dodaj ▾]  │
└──────────────────────┘
```

Panel podsumowania ma subtelną, przerywaną górną krawędź (efekt „oderwanej kartki/paragonu") — to jedyny dodatkowy detal ozdobny poza pieczęcią, wzmacniający metaforę papieru bez przesady.

### 4.6 Specyfikacja komponentów

- **Wskaźnik kroków** — 6 kropek połączonych cienką linią `--color-line`. Ukończony krok: wypełniona pieczęć `--color-wax` z drobnym reliefem (subtelny inset-shadow), animacja wejścia 420ms (scale 0.6→1.05→1, easing standard). Krok aktywny: obrys `--color-ink`, wypełnienie `--color-surface`. Kroki przyszłe: obrys `--color-line`, wyszarzony numer. Klikalne wyłącznie kroki już ukończone (powrót), nie przyszłe.
- **Swatch koloru koperty** — kształt koperty (prostokąt + trójkątna klapka rysowana w SVG/clip-path), nie zwykłe kółko/kwadrat — to spójne z placeholderami z sekcji 0 i wzmacnia rozpoznawalność produktu nawet bez zdjęć. Rozmiar 64×48px w gridzie, 96×72px po najechaniu. Stan zaznaczony: obrys 2px `--color-wax` + tło karty `--color-wax-wash` + mała plakietka ✓ w rogu.
- **Panel podsumowania** — sticky (desktop: prawa kolumna, mobile: dolny pasek rozwijany). Nazwa produktu wg standardu z pkt 1.9 w `--text-label`, rozbicie ceny w `--text-mono-sm`, suma w `--text-price`. CTA na pełną szerokość panelu, `--color-wax`, tekst `--color-surface`.
- **Przycisk pierwotny** (`--color-wax` bg, biały tekst): hover → `--color-wax-deep` + `--shadow-md`; active → scale 0.98; disabled → 40% opacity, kursor not-allowed, bez cienia; focus-visible → obrys 2px `--color-ink` z 2px odstępem.
- **Przycisk drugorzędny** („Wstecz", filtry): transparentne tło, obrys 1px `--color-line`, tekst `--color-ink`; hover → tło `--color-paper`.
- **Pola formularzy** (adres, ilość, uwagi): wysokość 44px, obrys 1px `--color-line`, radius `--radius-sm`; focus → obrys 2px `--color-ink` + delikatny halo `0 0 0 3px rgba(32,36,46,.08)`. Błąd walidacji: obrys `--color-error` + komunikat pod polem w `--text-small` tym samym kolorem (bez czerwonego tła całego pola — to zbyt agresywne).
- **Toggle Tak/Nie** (nadruk, personalizacja): pigułka 40×22px, off = `--color-line`, on = `--color-wax`, kółko `--color-surface` z `--shadow-sm`, przejście 150ms.
- **Karta uploadu pliku**: strefa z obrysem przerywanym `--color-line`, radius `--radius-md`; po przesłaniu zamienia się w kartę z ikoną typu pliku, nazwą i rozmiarem w `--text-mono-sm`, plakietką statusu (`--color-success`/`--color-error`) i ikoną usuń/podmień.
- **Stepper ilości**: przyciski +/− 32×32px w `--color-paper` z obrysem `--color-line`, pole liczby wyśrodkowane w `--text-mono-sm`.

### 4.7 Dostępność

WCAG AA obowiązkowe: `--color-ink` na `--color-paper`/`--color-surface` ≈ 12:1 (bardzo bezpieczne), biały tekst na `--color-wax` ≈ 7:1. `--color-wax` nigdy jako jedyny nośnik informacji (zawsze + ikona/tekst — patrz stan błędu pola). Pełna nawigacja klawiaturą po krokach konfiguratora (Tab/Shift+Tab, Enter zatwierdza krok), widoczny `focus-visible` na każdym interaktywnym elemencie, `aria-current="step"` na aktywnym kroku wskaźnika, `aria-live="polite"` na panelu podsumowania (żeby zmiana ceny była ogłaszana czytnikom ekranu).

### 4.8 Zasady konwersji (bez zmian względem wcześniejszej wersji)

Wyraźna hierarchia CTA (tylko `--color-wax` dla akcji konwersyjnych), duża przestrzeń wokół konfiguratora, widoczne elementy zaufania blisko punktów decyzyjnych, minimalna liczba kroków do zakupu, layout kompaktowy bez zbędnego przewijania.

---

## 5. KONFIGURATOR KOPERTY (serce strony głównej, pod hero)

Konfigurator to sekwencyjny wizard z widocznym paskiem postępu i stałym (sticky) panelem podsumowania ceny. Kroki:

**Krok 1 — Format.** Karty wyboru (K4 / C6 / DL) z wymiarami mm, placeholderem wizualnym w skali względem siebie, krótkim opisem zastosowania (np. „DL — standardowa korespondencja biurowa”, „K4 — zaproszenia i większe dokumenty”).

**Krok 2 — Kolor.** Siatka 19 swatchy kolorów z nazwą pod każdym. Hover/tap powiększa placeholder w danym kolorze. Wszystkie kolory mają identyczną cenę — brak plakietek „Premium” czy dopłat, wybór koloru jest czysto estetyczny.

**Krok 3 — Ilość.** Input liczbowy ze stepperem +/−, walidacja MOQ w czasie rzeczywistym (od 1 szt. bez nadruku, od 10 szt. jeśli w kroku 4 włączono nadruk — jeśli klient zmniejszy ilość poniżej 10 przy aktywnym nadruku, system wyświetla komunikat blokujący i sugeruje zwiększenie ilości lub wyłączenie nadruku).

**Krok 4 — Nadruk (opcjonalnie).** Przełącznik Tak/Nie. Po włączeniu: strefa drag&drop do 3 plików (dozwolone formaty wypisane jawnie), karty przesłanych plików ze statusem, pole uwag dla grafika, informacja o dopłacie za szt. i blokada/komunikat jeśli ilość < 10 szt. Widoczna, spokojna informacja pod polem uwag: „Po złożeniu zamówienia nasz grafik przygotuje wizualizację nadruku do Twojej akceptacji — prześlemy ją e-mailem. Produkcja ruszy dopiero po Twoim zatwierdzeniu.”

**Krok 5 — Personalizacja / adresowanie (opcjonalnie).** Przełącznik Tak/Nie. Wybór metody: „Wpisz ręcznie” (formularz adresowy, z możliwością dodania kolejnych kompletów) albo „Pobierz i uzupełnij szablon” (przycisk generuje i pobiera plik Excel z liczbą wierszy odpowiadającą wybranej ilości kopert; po uzupełnieniu klient wgrywa plik z powrotem — drag&drop + walidacja liczby wierszy i formatu). Informacja o dopłacie za szt. Ta sama informacja o wizualizacji do akceptacji co w Kroku 4 (jeśli nadruk nie był włączony, komunikat i tak się pojawia, bo personalizacja też wymaga akceptacji wizualizacji).

**Krok 6 — Czas realizacji.** Wybór: Standard (5 dni roboczych, bez dopłaty) / Ekspres (2 dni robocze, +1,50 zł/szt.) — z dynamicznie wyliczaną orientacyjną datą dostawy.

**Panel podsumowania (sticky, widoczny przez cały proces):** wybrane parametry, cena jednostkowa, cena łączna brutto, szacowana data dostawy, duży przycisk **„Dodaj do koszyka”**. Na mobile: zwinięty pasek dolny z ceną i CTA, rozwijany w pełny widok podsumowania.

Dodatkowo: link „Potrzebujesz większej ilości? Poproś o wycenę indywidualną” dla zamówień powyżej ustalonego progu (lead gen B2B) oraz opcja „Zapisz konfigurację” dla zalogowanych użytkowników.

---

## 6. SPECYFIKACJA PODSTRON

### 6.1 Strona główna
Poniżej pełny układ strony głównej. Każda sekcja poza konfiguratorem ma być zwarta (1 ekran lub mniej) — zgodnie z zasadą kompaktowego layoutu z sekcji 4, nie tworzymy długich bloków tekstu.

1. **Hero** — nagłówek korzyściowy + subheadline + CTA „Skonfiguruj koperty” (scroll do konfiguratora). Tuż pod nagłówkiem krótki pasek 4 ikon/fraz USP: „19 kolorów”, „Nadruk i personalizacja”, „Wysyłka od 2 dni roboczych”, „Faktura VAT / odroczony termin dla firm” — to pierwsze, co klient widzi, więc od razu odpowiada na najczęstsze pytania („czy mają mój kolor”, „czy da się zapłacić fakturą” itd.).
2. **Konfigurator** (sekcja 5) — od razu pod hero, zgodnie z założeniem z briefu.
3. **„Jak to działa”** — już zdefiniowane w pkt 6.1 wcześniej: Skonfiguruj → Opłać → *(warunkowo)* Zaakceptuj wizualizację → Odbierz przesyłkę.
4. **Formaty i zastosowania** (jedna, połączona sekcja zamiast dwóch osobnych) — 3 karty (K4/C6/DL), każda z wymiarem, typowym zastosowaniem i przykładowym odbiorcą (np. „DL — standardowa korespondencja biurowa: kancelarie, biura rachunkowe, pisma firmowe”, „C6 — zaproszenia i mniejsze wysyłki eventowe”, „K4 — większe dokumenty, zaproszenia firmowe, dyplomy”). Klik przenosi do konfiguratora z danym formatem wstępnie zaznaczonym. To odpowiada na pytanie „czy to jest koperta dla mnie” bez potrzeby czytania długiego opisu.
5. **Paleta kolorów** — kompaktowy poziomy pasek/scroller 19 swatchy (bez opisów, same kolory + nazwa przy hover). Klik od razu przenosi do Kroku 2 konfiguratora z zaznaczonym kolorem. Cel: wizualnie zakomunikować bogactwo wyboru, nie rozbudowaną sekcją tekstową, tylko jednym zwartym elementem.
6. **Zaufanie i social proof** — 3 karty z opiniami klientów (placeholder, docelowo z nazwą firmy i branżą), obok liczby (zrealizowane zamówienia, lata na rynku), plus wzmianka o certyfikacie eco dla koperty „Eko”.
7. **Dla firm** — faktura z odroczonym terminem płatności, stała i przejrzysta cena niezależnie od wielkości zamówienia, CTA „Załóż konto firmowe”.
8. **FAQ (akordeon)** — 5–6 pytań redukujących niepewność przed zakupem bez kontaktu z BOK, np.: „Czy mogę zamówić tylko 1 kopertę?”, „Jak wygląda akceptacja projektu z nadrukiem?”, „Jakie pliki mogę przesłać do nadruku?”, „Ile trwa realizacja zamówienia?”, „Czy wystawiacie faktury VAT i fakturę z odroczonym terminem?”, „Mam zamówienie na dużą ilość — jak wycenić?”. Akordeon zamknięty domyślnie, więc nie zajmuje miejsca, dopóki klient nie rozwinie pytania — zgodne z zasadą kompaktowości.
9. **Blog** — 3 najnowsze wpisy (karty z tytułem, leadem, kategorią).
10. **Newsletter** — signup z checkboxem zgody RODO.
11. **Finalne CTA przed stopką** — krótki, wyróżniony pasek z przyciskiem powrotu do konfiguratora — dla osób, które przewinęły całą stronę bez decyzji; ostatnia szansa na konwersję przed opuszczeniem strony.

### 6.2 Blog
- Widok listy: filtry kategorii (Poradniki, Inspiracje, Realizacje, Aktualności), wyszukiwarka, sortowanie po dacie/popularności, karty artykułów (placeholder grafiki, tytuł, lead, czas czytania, tag kategorii).
- Widok artykułu: spis treści dla dłuższych tekstów, treść, kontekstowe CTA do konfiguratora, sekcja powiązanych artykułów, przyciski udostępniania.
- Dane strukturalne Article/Breadcrumb dla SEO.

### 6.3 Kontakt
- Formularz: imię i nazwisko, firma, e-mail, telefon, temat (dropdown: Zapytanie ofertowe / Wsparcie zamówienia / Współpraca / Inne), wiadomość, zgoda RODO, zabezpieczenie antyspamowe.
- Osobny blok „Zapytaj o wycenę hurtową” z polem szacowanej ilości — dedykowany lead B2B.
- Dane kontaktowe, godziny pracy BOK, placeholder mapy, link do FAQ.

### 6.4 Regulamin
- Struktura: Postanowienia ogólne, Definicje, Warunki zawierania umów, Ceny i płatności, Realizacja zamówień (w tym MOQ i czas produkcji dla nadruków/personalizacji), Reklamacje, Odstąpienie od umowy — **z jasnym zastrzeżeniem, że towary spersonalizowane (z nadrukiem/adresowaniem) są wyłączone z prawa odstąpienia zgodnie z przepisami o towarach nieprefabrykowanych wg specyfikacji konsumenta**, Ochrona danych osobowych (odesłanie), Postanowienia końcowe.
- Spis treści z kotwicami, data ostatniej aktualizacji, opcja pobrania PDF.

### 6.5 Polityka Prywatności
- Administrator danych, cele i podstawy prawne przetwarzania, okres przechowywania, prawa użytkownika (dostęp, sprostowanie, usunięcie, przenoszalność, sprzeciw), odbiorcy danych (operatorzy płatności, kurierzy, hosting), odesłanie do polityki cookies, kontakt do IOD.

### 6.6 Pliki Cookies
- Wyjaśnienie kategorii cookies (niezbędne, analityczne, marketingowe, funkcjonalne), tabela nazw/celu/czasu przechowywania (placeholder), zarządzanie zgodami z poziomu strony.

**Baner cookies (globalny, wyświetlany przy pierwszej wizycie):**
- Warstwa 1 (dolny pasek lub modal, widoczny od razu): krótki tekst o wykorzystaniu cookies + link do Polityki Cookies, trzy przyciski: **„Akceptuj wszystkie”**, **„Odrzuć niekonieczne”**, **„Ustawienia”**.
- Warstwa 2 (po kliknięciu „Ustawienia”): granularne przełączniki per kategoria — Niezbędne (zawsze aktywne, bez możliwości wyłączenia), Analityczne, Marketingowe, Funkcjonalne — każdy z krótkim opisem, przyciski **„Zapisz wybór”** i **„Akceptuj wszystkie”**.
- Do momentu wyboru zgody baner blokuje ładowanie skryptów analitycznych i marketingowych (zgodnie z zasadą privacy-by-default).
- Wybór zapamiętywany — baner nie pojawia się ponownie przy kolejnych wizytach, ale ustawienia można zmienić w dowolnym momencie przez link „Zarządzaj cookies” w stopce.

### 6.7 Koszyk
- Lista pozycji: placeholder w wybranym kolorze, pełna konfiguracja (format, kolor, ilość, nadruk + załączniki, personalizacja, czas wysyłki), cena jednostkowa/łączna, edycja (powrót do konfiguratora z zachowanym stanem), usuwanie.
- Pole kodu rabatowego, podsumowanie netto/VAT/brutto/dostawa/suma.
- Cross-sell („Klienci dodają też…”), trust badges (bezpieczne płatności, gwarancja jakości).
- Opcja „Zapisz koszyk i wyślij link” — przydatna, gdy decyzję zakupową podejmuje ktoś inny w firmie.
- Pusty stan koszyka z CTA powrotu do konfiguratora.

### 6.8 Zamówienie (checkout)
Wieloetapowy proces z paskiem postępu i możliwością cofania:
1. Dane zamawiającego — trzy ścieżki do wyboru: „Zaloguj się” (e-mail + hasło lub Google), „Kontynuuj jako gość”, lub — po wpisaniu e-maila jako gość — checkbox **„Utwórz konto, żeby śledzić to i przyszłe zamówienia”**: konto zakładane jest na bazie danych już wpisanych w formularzu (e-mail, adres, dane do faktury), więc klient uzupełnia wyłącznie hasło.
2. Dane do faktury i dostawy (checkbox „Kupuję jako firma” → pole NIP z auto-uzupełnieniem; checkbox „Inny adres dostawy”).
3. Metoda dostawy (kurier / Paczkomat InPost — wybór konkretnego punktu przez wbudowany InPost Geowidget).
4. Metoda płatności (Przelewy24 / BLIK / przelew tradycyjny / faktura z odroczonym terminem — ta ostatnia tylko dla zweryfikowanych kont firmowych).
5. Podsumowanie (pozycje wyświetlone wg ustandaryzowanej nazwy z pkt 1.9), akceptacja regulaminu, zgody marketingowe (opcjonalne), przycisk „Zamawiam i płacę” jednoznacznie oznaczony jako zobowiązanie do zapłaty.
- Strona potwierdzenia — treść zależna od wybranej metody płatności (pełna logika w pkt 1.12):
  - **Płatność przez Przelewy24 (BLIK/karta/szybki przelew):** „Płatność przyjęta — przystępujemy do realizacji zamówienia [numer].” + warunkowo (nadruk/personalizacja): „Wkrótce otrzymasz e-mail z wizualizacją projektu do akceptacji.”
  - **Przelew tradycyjny (proforma):** dane do przelewu (numer konta, kwota, tytuł = numer zamówienia), faktura proforma do pobrania (PDF), komunikat „Czekamy na zaksięgowanie wpłaty — druk ruszy po jej otrzymaniu.” + jeśli nadruk/personalizacja: informacja, że wizualizacja i tak zostanie przesłana do akceptacji niezależnie od statusu płatności.
  - **Faktura z odroczonym terminem:** potwierdzenie przyjęcia do realizacji (jak przy Przelewy24) + informacja o terminie płatności faktury.
  - We wszystkich wariantach: numer zamówienia (format z pkt 1.8), podsumowanie zamówienia, CTA założenia konta dla gości, którzy nie skorzystali z opcji w kroku 1.

### 6.9 Logowanie / Rejestracja
- Logowanie: e-mail + hasło, przycisk „Zaloguj przez Google”, link do resetu hasła.
- Rejestracja: wybór typu konta (Firmowe / Indywidualne) z odpowiednimi polami (NIP + nazwa firmy vs. imię/nazwisko), e-mail, hasło + potwierdzenie, zgody (regulamin obowiązkowy, marketing opcjonalny), przycisk „Zarejestruj przez Google”.
- Ekran resetu hasła, walidacja inline, jasne komunikaty błędów.

### 6.10 Profil Użytkownika
- Edycja danych osobowych/firmowych, zmiana hasła, zarządzanie zgodami marketingowymi.
- Zapisane adresy dostawy i dane do faktury (wiele wpisów, adres domyślny).
- **Zapisane konfiguracje kopert** (szablony/ulubione) — kluczowe dla firm zamawiających cyklicznie te same koperty, wspiera powtarzalność zakupów.
- Panel statusu konta (np. widoczna informacja o uprawnieniu do płatności fakturą z odroczonym terminem po historii zamówień).
- Opcja usunięcia konta zgodnie z RODO.

### 6.11 Złożone zamówienia
- Lista: numer zamówienia (format z pkt 1.8), data, nazwa produktu wg ustandaryzowanego szablonu (pkt 1.9), status (Nowe / W trakcie / Czeka na akceptację / Do druku / Zrealizowane / Anulowane), kwota, CTA szczegółów. Filtrowanie po statusie/dacie, wyszukiwarka po numerze.
- Widok szczegółów: pełna konfiguracja (nazwa wg pkt 1.9), **Status zamówienia** i osobno **Status płatności** (Oczekuje na wpłatę / Opłacone — z danymi do przelewu i fakturą proforma widocznymi, dopóki płatność nie jest potwierdzona), pliki nadruku z podglądem/akceptacją poprawek, status i numer przesyłki (placeholder), faktura do pobrania (PDF), przycisk **„Zamów ponownie”** — dodaje do koszyka identyczną konfigurację (format, kolor, nadruk, personalizacja, czas wysyłki) przeliczoną wg aktualnego cennika, opcja zgłoszenia reklamacji.
- **Sekcja „Wizualizacja do akceptacji”** (widoczna wyłącznie, gdy zamówienie ma status Czeka na akceptację i zawiera nadruk/personalizację): placeholder podglądu wizualizacji przygotowanej przez grafika, data przesłania, dwa przyciski — **„Akceptuję projekt”** (oznacza wizualizację jako zaakceptowaną; zamówienie przechodzi do statusu Do druku od razu, jeśli płatność jest już opłacona lub metodą jest faktura z odroczonym terminem — w przeciwnym razie zostaje w Czeka na akceptację z dopiskiem „Czekamy jeszcze na wpłatę”, patrz reguła bramkująca w pkt 1.12) i **„Zgłoś uwagi”** (otwiera pole tekstowe na komentarz, zamówienie zostaje w statusie Czeka na akceptację). Historia poprzednich wersji wizualizacji i uwag widoczna poniżej, jeśli doszło do poprawek.

### 6.12 Panel Administracyjny (Admin)
Osobna, chroniona część serwisu — dostępna wyłącznie dla roli **Admin** (jeden poziom uprawnień, pełny dostęp do zamówień), niewidoczna w publicznym menu, pod dedykowaną ścieżką logowania (np. `/admin`, osobny formularz logowania niż klienci). Zakres wyłącznie zamówienia klientów — bez zarządzania cennikiem, kolorami czy treścią bloga.

- **Lista zamówień** — tabela wszystkich zamówień wszystkich klientów: numer (format z 1.8), data, klient (imię/nazwisko lub nazwa firmy), nazwa produktu (standard z 1.9), ilość, kwota, status zamówienia, **status płatności** (Oczekuje na wpłatę / Opłacone), metoda płatności. Filtrowanie po statusie i zakresie dat, wyszukiwarka po numerze zamówienia lub kliencie.
- **Szczegóły zamówienia** — pełne dane: konfiguracja produktu, dane zamawiającego oraz adres dostawy/faktury, przesłane pliki nadruku (podgląd/pobranie), dane/plik personalizacji (adresy), wybrana metoda dostawy i punkt Paczkomatu, metoda i status płatności wraz z numerem referencyjnym Przelewy24 (dla zamówień opłaconych przez bramkę).
- **Oznacz jako opłacone** — dla zamówień przelewem tradycyjnym/proformą: przycisk, którym Admin ręcznie potwierdza zaksięgowanie wpłaty na koncie firmowym (system nie ma automatycznego callbacku dla przelewów tradycyjnych), zmieniając Status płatności na Opłacone.
- **Zmiana statusu zamówienia** — dropdown ze statusami z pkt 1.10 (Nowe / W trakcie / Czeka na akceptację / Do druku / Zrealizowane / Anulowane). Opcja **Do druku** jest nieaktywna (wyszarzona z podpowiedzią), dopóki nie są spełnione oba warunki z reguły bramkującej w pkt 1.12 — Status płatności = Opłacone (lub faktura z odroczonym terminem) oraz, jeśli dotyczy, zaakceptowana wizualizacja. Każda zmiana statusu jest natychmiast widoczna klientowi w jego panelu „Złożone zamówienia”.
- **Edycja danych zamówienia** — Admin może poprawić dane zamówienia (np. literówkę w adresie, korektę ilości), z zapisem historii zmian (kto i kiedy dokonał edycji) widocznym w szczegółach zamówienia.
- **Wizualizacja do akceptacji** (dla zamówień z nadrukiem/personalizacją) — Admin dołącza przygotowaną przez grafika wizualizację (upload pliku, placeholder podglądu) **niezależnie od statusu płatności** (patrz pkt 1.12), co automatycznie wysyła e-mail do klienta i zmienia status zamówienia na Czeka na akceptację (patrz proces w pkt 1.11). W szczegółach zamówienia widoczny jest status akceptacji (Oczekuje / Zaakceptowano / Zgłoszono uwagi) wraz z ewentualnym komentarzem klienta, oraz historia wszystkich przesłanych wersji.

---

## 7. ELEMENTY WSPIERAJĄCE KONWERSJĘ (przekrojowo)

- Sticky pasek zaufania widoczny globalnie (bezpieczne płatności, czas wysyłki, liczba obsłużonych firm).
- Formularz „Poproś o wycenę” dla dużych ilości — dedykowana ścieżka lead-gen poza standardowym checkoutem.
- Cross-sell/upsell w koszyku i podsumowaniu konfiguratora.
- Newsletter z rabatem powitalnym dla nowych kont.
- Widoczne opinie/case studies klientów B2B na stronie głównej i przy konfiguratorze.
- Zapisywanie stanu konfiguratora (dla zalogowanych) — zero utraconej pracy przy przerwaniu procesu.

---

## 8. WYMAGANIA TECHNICZNE

### 8.1 Podział odpowiedzialności: Vercel / Firebase / Brevo

**Vercel** — hosting i deployment aplikacji Next.js; API Routes / Server Actions jako backend (m.in. webhook odbierający callback płatności z Przelewy24, endpointy wyzwalające e-maile przez Brevo); wszystkie klucze i dane dostępowe (Firebase config po stronie serwera, klucz API Brevo, dane Przelewy24, klucz InPost Geowidget) jako Vercel Environment Variables — nigdy w kodzie widocznym po stronie klienta.

**Firebase:**
- **Authentication** — logowanie e-mail+hasło oraz Google OAuth (natywny provider Google); role `user`/`admin` jako custom claims, weryfikowane po stronie serwera przed każdym dostępem do Panelu Administracyjnego (6.12) — nie tylko ukrywane w UI.
- **Firestore** — kolekcje: `users` (dane konta, zapisane adresy, zapisane konfiguracje kopert z pkt 6.10), `orders` (pełne dane zamówienia: konfiguracja, ceny, Status zamówienia i Status płatności z pkt 1.10/1.12, numer z pkt 1.8, referencje do plików w Storage), `pricing` (edytowalna konfiguracja cen bazowych i dopłat z pkt 1.2 — zmiana ceny nie wymaga zmian w kodzie). Opcjonalnie `blog`, jeśli wpisy mają być zarządzane z danych, a nie hardcodowane w kodzie — w takim wypadku dane muszą być pobierane po stronie serwera (SSG/ISR), nie w kliencie, zgodnie z wymogami SEO z pkt 8.3.
- **Storage** — pliki nadruku (do 3/zamówienie), wypełniony plik Excel z personalizacją, wizualizacja przesyłana przez Admina (pkt 1.11) — każdy plik powiązany z ID zamówienia.
- **Reguły bezpieczeństwa** (Firestore/Storage rules) — klient ma dostęp wyłącznie do własnych dokumentów (`orders` filtrowane po `userId`), rola `admin` ma dostęp do wszystkich zamówień; reguły egzekwowane po stronie Firebase, nie tylko logiką w interfejsie.

**Brevo** — e-maile transakcyjne wysyłane przez API Brevo z serwerowych endpointów na Vercel: potwierdzenie zamówienia (dwa warianty wg pkt 1.12), e-mail z wizualizacją do akceptacji (pkt 1.11), potwierdzenie zaksięgowania płatności, powiadomienie o zmianie statusu zamówienia. Zapisy do newslettera (pkt 6.1) trafiają do listy kontaktów w Brevo, z zachowaniem zgody RODO zaznaczonej przy zapisie.

### 8.2 Pozostałe wymagania

- Mobile-first, w pełni responsywny; konfigurator na mobile jako pionowy wizard z dolnym paskiem podsumowania.
- Dostępność WCAG AA: kontrast, aria-labels, focus states, pełna nawigacja klawiaturą w konfiguratorze i formularzach.
- SEO i crawlability — pełna specyfikacja w sekcji 8.3, obowiązkowa, nie opcjonalna.
- Wydajność: lazy loading placeholderów, optymalizacja pod Core Web Vitals (bezpośredni wpływ na SEO — patrz 8.3).
- Serwis wyłącznie w języku polskim — bez przełącznika języka i bez struktury i18n.
- Integracje zewnętrzne (InPost Geowidget, Przelewy24, Brevo) mogą działać w trybie sandbox/dane testowe, ale muszą być zaimplementowane jako realne punkty integracji, a nie graficzne placeholdery.

### 8.3 SEO i crawlability (Google)

Priorytet: strony publiczne (strona główna, blog, kontakt, regulamin, polityka prywatności, cookies) muszą być w pełni widoczne dla Googlebota bez konieczności wykonywania złożonego JS, a strony prywatne/nieistotne dla SEO nie mogą zaśmiecać indeksu.

**Renderowanie treści:**
- Strona główna, lista blogowa i pojedyncze wpisy blogowe: renderowane po stronie serwera (SSG/ISR w Next.js App Router — `generateStaticParams` + `revalidate`), tak żeby pełny HTML z treścią był dostępny od razu, bez polegania na kliencie renderującym dane z Firestore w `useEffect`. To gwarantuje indeksację niezależnie od tego, jak dobrze Googlebot poradzi sobie z JS danego dnia.
- Konfigurator (dynamiczny, stanowy) może pozostać client-side, ale strona główna wokół niego (hero, sekcje treściowe, FAQ) musi być częścią serwerowo renderowanego HTML.

**Metadane i dane strukturalne:**
- Unikalne, opisowe `<title>` i meta description dla każdej strony publicznej i każdego wpisu blogowego (Next.js Metadata API), plus tagi Open Graph/Twitter Card (ważne przy udostępnianiu linków, pośrednio wpływa na CTR w wynikach wyszukiwania).
- JSON-LD: `Organization` (globalnie), `Product` dla strony głównej/konfiguratora (koperty ozdobne Envelopes), `Article` dla każdego wpisu blogowego, `BreadcrumbList` na blogu i podstronach, `FAQPage` dla sekcji FAQ na stronie głównej (pkt 6.1) — to realna szansa na rich snippet w wynikach Google.
- Jedno `<h1>` na stronę, logiczna hierarchia nagłówków (h2/h3) — szczególnie w artykułach blogowych.
- Opisowy `alt` na każdym placeholderze produktowym (np. `alt="Koperta ozdobna, format DL, kolor granatowy"`) — realnie wspiera też wyszukiwanie obrazów.

**Indeksowalność wg typu strony:**
- **Indeksowalne i w sitemapie:** strona główna, blog (lista + wpisy), kontakt, regulamin, polityka prywatności, cookies.
- **`noindex, nofollow`** (meta robots w Next.js Metadata API) i pominięte w sitemapie: koszyk, zamówienie/checkout, logowanie/rejestracja, profil użytkownika, złożone zamówienia, panel administracyjny (6.12) — to strony prywatne/przejściowe bez wartości SEO, a część z nich zawiera dane osobowe, więc nie powinny w ogóle trafiać do indeksu.
- `robots.txt` jawnie blokujący `/koszyk`, `/zamowienie`, `/profil`, `/zamowienia`, `/admin` oraz endpointy API (`/api/*`), zezwalający na resztę.

**Sitemap i infrastruktura:**
- Dynamicznie generowany `sitemap.xml` (Next.js `sitemap.ts`) obejmujący wyłącznie strony indeksowalne wymienione wyżej, z automatycznym dodawaniem nowych wpisów blogowych.
- Kanoniczne URL-e (`rel=canonical`) na liście blogowej przy filtrach/sortowaniu/paginacji, żeby uniknąć duplicate content.
- Czytelne, keyword-friendly slugi URL dla wpisów blogowych (np. `/blog/jak-dobrac-koperte-do-zaproszen-firmowych`), nie identyfikatory techniczne.
- Branded, poprawnie zwracająca kod HTTP 404 strona błędu (nie „soft 404” z kodem 200).

**Core Web Vitals** (LCP, INP, CLS) zoptymalizowane pod próg „Good” Google — to bezpośredni czynnik rankingowy, nie tylko kwestia wydajności: obrazy/placeholdery z jawnie zdefiniowanymi wymiarami (unikanie CLS), krytyczny CSS ładowany priorytetowo, minimalny JS blokujący render na stronie głównej.

---

## 9. KRYTERIA „GOTOWE”

- Wszystkie 11 podstron klienckich oraz osobny Panel Administracyjny (6.12) istnieją, są połączone spójną nawigacją i odzwierciedlają sekcję 6.
- Konfigurator na stronie głównej realizuje pełną sekwencję z sekcji 5, z poprawnym przeliczaniem ceny w czasie rzeczywistym.
- Ścieżka: konfigurator → koszyk → checkout → potwierdzenie działa end-to-end bez martwych linków.
- Logowanie/rejestracja obsługuje ścieżkę e-mail+hasło oraz przycisk Google (może być zamockowany, ale widoczny i klikalny); klient może też założyć konto w trakcie składania zamówienia bez ponownego wpisywania danych.
- Klient może zamówić ponownie dowolne wcześniejsze zamówienie jednym kliknięciem z poziomu panelu „Złożone zamówienia”.
- Admin (rola z pełnym dostępem) widzi listę wszystkich zamówień wszystkich klientów ze szczegółami, może zmieniać status zamówienia (wg statusów z pkt 1.10) oraz edytować jego dane.
- Każde zamówienie ma unikalny numer w formacie z pkt 1.8, spójnie widoczny w sklepie, panelu klienta, panelu Admina i przekazywany jako referencja do Przelewy24.
- Zamówienia z nadrukiem i/lub personalizacją poprawnie przechodzą przez status Czeka na akceptację: Admin może dołączyć wizualizację, klient otrzymuje wyraźną informację o tym kroku (w konfiguratorze, na potwierdzeniu i w panelu zamówień) i może zaakceptować lub zgłosić uwagi z poziomu panelu „Złożone zamówienia”. Zamówienia bez tych opcji pomijają ten krok całkowicie.
- Ekran i e-mail potwierdzenia poprawnie różnią się wg metody płatności (pkt 1.12): płatność przez Przelewy24 potwierdza się natychmiast i komunikuje przystąpienie do realizacji, przelew tradycyjny pokazuje dane do wpłaty i informację o oczekiwaniu na nią, a wizualizacja do akceptacji jest wysyłana niezależnie od statusu płatności. Status zamówienia nie da się zmienić na Do druku, dopóki nie są spełnione oba warunki reguły bramkującej (płatność + akceptacja projektu, jeśli dotyczy).
- Nazwa produktu wyświetlana jest konsekwentnie wg szablonu z pkt 1.9 we wszystkich miejscach (konfigurator, koszyk, checkout, panel klienta, panel Admina).
- Strona główna zawiera wszystkie sekcje z pkt 6.1 (hero z paskiem USP, konfigurator, jak to działa, formaty i zastosowania, paleta kolorów, zaufanie, dla firm, FAQ, blog, newsletter, finalne CTA) w zwartej, nieprzegadanej formie.
- Aplikacja zbudowana w Next.js gotowym do wdrożenia na Vercel; logowanie (w tym Google), dane zamówień/użytkowników i pliki obsługiwane przez Firebase (Authentication/Firestore/Storage) zgodnie z pkt 8.1; e-maile transakcyjne i newsletter wysyłane przez Brevo — żadna z tych trzech usług nie jest zastąpiona lokalnym mockiem bez realnego punktu integracji.
- Strona główna i blog są w pełni indeksowalne: pełny HTML z treścią dostępny bez wykonywania JS (SSR/SSG), unikalne metadane i dane strukturalne (w tym FAQPage i Article) na miejscu, sitemap.xml i robots.txt poprawnie rozróżniają strony publiczne od prywatnych (koszyk, checkout, konto, panel admina) zgodnie z pkt 8.3.
- Brak jakichkolwiek prawdziwych zdjęć — wyłącznie spójne, tekstowo opisane placeholdery.
- Ton komunikatów w całym serwisie odpowiada wytycznym z sekcji 2.
