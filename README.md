# Envelopes — sklep z kopertami ozdobnymi

Prototyp sklepu B2B zbudowany w Next.js (App Router), gotowy do wdrożenia na Vercel.
Dane i pliki obsługuje Firebase, e-maile transakcyjne i newsletter — Brevo, płatności — Przelewy24,
wybór punktu odbioru — InPost Geowidget.

Serwis jest wyłącznie w języku polskim — bez przełącznika języka i bez struktury i18n.

---

## Szybki start

```bash
npm install
npm run dev
```

Aplikacja startuje pod `http://localhost:3000` i działa **bez żadnej konfiguracji** — patrz „Tryb DEV FALLBACK”.

Produkcyjnie:

```bash
npm run build
npm run start
```

---

## Tryb DEV FALLBACK

Bez uzupełnionych zmiennych środowiskowych aplikacja pozostaje w pełni przejezdna:

| Usługa | Produkcja | Bez konfiguracji |
| --- | --- | --- |
| Firestore | kolekcje `orders`, `users`, `pricing`, `counters` | plik `.data/db.json` (ta sama warstwa `src/lib/store.ts`) |
| Firebase Storage | bucket projektu, podpisane URL-e | katalog `.data/uploads`, serwowany przez `/api/uploads/[...]` |
| Firebase Auth | e-mail+hasło oraz Google OAuth, rola jako custom claim | sesja demonstracyjna w `localStorage`; adres zaczynający się od `admin@` dostaje rolę administratora |
| Brevo | API `/smtp/email` i `/contacts` | pełna treść wiadomości trafia do logu serwera |
| Przelewy24 | rejestracja transakcji + webhook | płatność bramkowa oznaczana jako opłacona lokalnie (`SYMULACJA-…`) |
| InPost Geowidget | mapa punktów z oficjalnego widgetu | pole na kod paczkomatu + komunikat, czego brakuje |

Każda z tych usług ma **realny punkt integracji w kodzie** — fallback jest wyłącznie ścieżką awaryjną,
uruchamianą, gdy brakuje kluczy.

Konta demonstracyjne (tryb bez Firebase, dowolne hasło min. 6 znaków):

- `admin@envelopes.pl` → panel administracyjny `/admin`
- `klient@przyklad.pl` → panel klienta z przykładowymi zamówieniami

Reset danych demonstracyjnych: `rm -rf .data`.

---

## Konfiguracja

Skopiuj `.env.example` do `.env.local` (lokalnie) albo ustaw wartości jako Vercel Environment Variables.
Klucze serwerowe nigdy nie trafiają do bundla klienta — używane są wyłącznie w API Routes.

Nadanie roli administratora przy podłączonym Firebase:

```js
// funkcja pomocnicza w src/lib/firebase/admin.ts
await grantAdminRole('<uid użytkownika>'); // ustawia custom claim { role: 'admin' }
```

Rola jest weryfikowana **po stronie serwera** przy każdym wywołaniu API panelu, nie tylko ukrywana w UI.

---

## Struktura

```
src/
  app/                     trasy (App Router)
    page.tsx               strona główna z konfiguratorem
    koperty/[kolor]/       strony wariantów kolorystycznych (SSG, lista w color-pages.ts)
    blog/                  lista + wpisy (SSG + ISR)
    koszyk, zamowienie/    ścieżka zakupowa
    zamowienia/, profil/   panel klienta
    akceptacja/[token]/    akceptacja wizualizacji dla gości
    admin/                 panel administracyjny (noindex, osobne logowanie)
    api/                   backend: zamówienia, płatności, pliki, dokumenty, Brevo
    sitemap.ts, robots.ts  SEO
  components/
    configurator/          wizard 6 kroków + panel podsumowania
    cart/, checkout/       koszyk i checkout
    account/, admin/       panele
    ui/                    placeholdery, swatche, pieczęcie kroków, upload
  lib/
    catalog.ts             formaty i 19 kolorów
    color-pages.ts         treść stron kolorów = lista opublikowanych odcieni
    pricing.ts             cennik i kalkulacja — jedyne źródło ceny w serwisie
    product-name.ts        ustandaryzowana nazwa produktu
    orders.ts              numeracja, statusy, reguła bramkująca „Do druku”
    store.ts               warstwa danych (Firestore ↔ plik lokalny)
    brevo.ts, p24.ts       integracje
    pdf.ts, documents.ts   generator PDF (proforma, faktura, regulamin)
```

---

## Kluczowe reguły biznesowe

**Numer zamówienia** — `ENV-RRRRMMDD-XXXX`, licznik dzienny inkrementowany transakcyjnie.
Ten sam numer jest identyfikatorem `sessionId` w Przelewy24, tytułem przelewu, kluczem wyszukiwania
w panelu Admina i numerem na fakturze.

**Nazwa produktu** — `Koperta [Format] [Kolor] [z nadrukiem] [z personalizacją]`, budowana
w jednym miejscu (`buildProductName`) i używana wszędzie. Nazwa opisuje sam produkt; czas
realizacji dotyczy całej przesyłki, więc jest osobnym atrybutem zamówienia, nie częścią nazwy.

**Cennik** — DL 2,58 zł, C6 2,12 zł, K4 2,15 zł brutto za sztukę; nadruk +1,99 zł,
personalizacja +2,99 zł, ekspres +1,50 zł. Cena zależy wyłącznie od formatu — wszystkie 19 kolorów
kosztuje tyle samo, bez rabatów ilościowych.

**Klient płaci tyle, ile zobaczył** — `DEFAULT_PRICING` w `src/lib/pricing.ts` jest jedynym
źródłem ceny dla konfiguratora, koszyka, cenników na stronach, danych strukturalnych `Offer`,
`/llms.txt` **i serwera** wyliczającego wartość zamówienia. Strony budują się statycznie, więc
**zmiana ceny wymaga wdrożenia** — a po nim podbicia daty w `PAGE_UPDATED` i `npm run indexnow`.
Kolekcja `pricing/current` w Firestore jest czytana, ale nadpisanie **nie jest stosowane**:
zmieniłoby wyłącznie kwotę naliczaną po stronie serwera, nie tę pokazaną klientowi. Rozbieżność
trafia do logu serwera jako błąd (`resolvePricing` w `pricing.ts`).

**Podział decyzji** — sklep pyta o format, kolor i opcje zadruku (3 kroki); ilość zmienia się
w pasku podsumowania; czas realizacji wybiera się raz w koszyku, bo dotyczy całej przesyłki.

**Przebieg konfiguratora** — krok 1 to sam wybór formatu, bez podsumowania (nie ma jeszcze czego
podsumowywać). Wybór formatu i koloru przenosi automatycznie do kolejnego kroku po ok. 220 ms —
tyle, by zaznaczenie zdążyło się pokazać. Od kroku 2 u dołu ekranu przykleja się pasek
podsumowania (`SummaryBar`) z nazwą produktu, skrótami do kroków, ilością, ceną i przyciskiem
dodania do koszyka.
Dopłata ekspresowa nalicza się od łącznej liczby sztuk w koszyku i jest wliczona w ceny pozycji —
w podsumowaniu pokazujemy ją osobno wyłącznie informacyjnie, żeby nie policzyć jej dwa razy.

**Czas realizacji** — 5 dni roboczych (standard) lub 2 dni robocze (ekspres, +1,50 zł/szt.)
dla zamówień z nadrukiem lub personalizacją. Zamówienie bez tych opcji nie przechodzi przez
produkcję: idzie w 2 dni robocze bez dopłaty i bez pytania klienta o wybór (`leadDaysPlain`).
Regułę trzyma `leadTimeDays` w `src/lib/pricing.ts` i stosuje ją zarówno koszyk, jak i serwer
przy wyliczaniu daty dostawy zamówienia.

**Kody rabatowe** — pole zostało usunięte z koszyka, ale mechanizm (`applyDiscount`,
`DISCOUNT_CODES`, pole `discountGross` w zamówieniu) pozostaje w kodzie i jest gotowy do
ponownego włączenia.

**Reguła bramkująca „Do druku”** (`evaluatePrintGate`) — status można ustawić wyłącznie, gdy:
1. płatność jest potwierdzona **albo** metodą jest faktura z odroczonym terminem, oraz
2. jeśli zamówienie zawiera nadruk/personalizację — wizualizacja została zaakceptowana.

Reguła jest egzekwowana po stronie serwera (HTTP 409), a w panelu Admina opcja jest wyszarzona
z podpowiedzią, którego warunku brakuje.

**Wizualizacja** — przygotowywana i wysyłana niezależnie od statusu płatności. Zamówienia bez nadruku
i personalizacji pomijają ten krok całkowicie.

---

## SEO

- Strona główna, blog i strony informacyjne renderowane serwerowo — pełny HTML bez wykonywania JS.
- Wpisy blogowe: `generateStaticParams` + `revalidate: 3600`.
- JSON-LD: `Organization` (globalnie), `Product` i `FAQPage` (strona główna), `Article` i `BreadcrumbList` (blog).
- `noindex, nofollow` + wykluczenie z sitemapy: koszyk, checkout, konto, panel zamówień, akceptacja, panel Admina.
- `robots.txt` blokuje te ścieżki oraz `/api/*`.
- Strona 404 zwraca prawidłowy kod HTTP 404 (bez „soft 404”).
- Placeholdery mają jawne proporcje (`aspect-ratio`) — zero CLS — oraz opisowy `alt`.
- `/llms.txt` — komplet faktów o ofercie dla modeli językowych, generowany z `pricing.ts` i `catalog.ts`.

### Strony kolorów i obrazy OG

Kolor ma stronę `/koperty/[kolor]` wtedy i tylko wtedy, gdy ma wpis z treścią
w `src/lib/color-pages.ts`. Ta sama lista zasila generowanie tras, sitemapę i linki z palety
na `/` — nie da się opublikować adresu bez tekstu. Nowy kolor wymaga też odmienionych fraz
(`phrase`, `phraseShort`), bo nazwa katalogowa („Czarny") nie wchodzi do zdania w liczbie mnogiej.

Kartę OG dla nowej strony generuje `scripts/og-card.mjs` — odtwarza układ rodziny obrazów
wyróżniających. Bez kwot: obraz bywa buforowany przez komunikatory miesiącami.

```bash
node scripts/og-card.mjs --photo public/images/zastosowania/<kadr>-1024.webp --eyebrow "Kolor czarny" --title "Czarne koperty DL" --line1 "Papier barwiony w masie · 115 g/m²" --line2 "Nadruk logo jasnym kolorem, od 1 sztuki" --out public/images/og/koperty-czarne.jpg
```

### Feed produktowy (Google Merchant Center)

`/feed.xml` — feed w formacie RSS 2.0 z przestrzenią `g:`, generowany z `pricing.ts`
i `catalog.ts`, budowany z tego samego bloku danych strukturalnych, który opisuje produkt
na `/koperty-dl`. Cena w feedzie nie może więc rozjechać się z ceną na stronie docelowej —
a to najczęstsza przyczyna odrzucenia oferty i, przy powtórzeniach, zawieszenia konta.

**Zawiera jedną pozycję: kopertę DL gładką** (`ENV-DL`, 2,58 zł brutto/szt.). To jedyna
konfiguracja, którą kupujący może zamówić od 1 sztuki, więc cena jednostkowa jest ceną realnie
dostępną. Koperty z nadrukiem i z personalizacją mają minimum 10 sztuk — wchodzą dopiero jako
pozycja wyceniona za komplet (`unit_pricing_measure`), razem ze stronami kolorów, które dadzą
im własne adresy docelowe.

W Merchant Center dodaje się to jako **zaplanowane pobieranie** z adresu
`https://envelopes.pl/feed.xml` (dzienne). Ustawienia po stronie konta, których feed nie niesie:
dane firmy, obszar i stawka wysyłki, polityka zwrotów, potwierdzenie własności witryny
(jest już przez Search Console).

### IndexNow

Google odkrywa nowe adresy sam; Bing bez zgłoszenia potrafi zwlekać tygodniami, a jego indeks
zasila ChatGPT Search i Copilota. `npm run indexnow` zgłasza adresy do punktu zbiorczego
protokołu (Bing, Yandex, Seznam, Naver) **po wdrożeniu** — lista pochodzi z sitemapy pobranej
z działającego serwisu, więc nie da się zgłosić strony, której jeszcze nie ma.

> **Reguła publikacji: każda nowa podstrona i każdy nowy wpis blogowy jest zgłaszany zaraz po
> wdrożeniu na produkcję.** To samo dotyczy istotnej aktualizacji istniejącej strony (przepisany
> filar, nowa sekcja, zmiana cennika); poprawka literówki — nie. Warunkiem jest podbita data
> w `PAGE_UPDATED` w `src/app/sitemap.ts`: bez niej adres wypada z domyślnego okna 7 dni.

```bash
npm run indexnow
```

| Wywołanie | Co zgłasza |
| --- | --- |
| `npm run indexnow` | adresy z `lastmod` z ostatnich 7 dni |
| `npm run indexnow -- --days 30` | to samo, szersze okno |
| `npm run indexnow -- --all` | całą sitemapę — zgłoszenie startowe, raz |
| `npm run indexnow -- koperty-dl` | wskazane ścieżki, z pominięciem sitemapy |
| `npm run indexnow -- --all --dry-run` | nic nie wysyła, wypisuje listę |

Domyślny host to `NEXT_PUBLIC_SITE_URL` (fallback `https://envelopes.pl`); `--host` go nadpisuje.
Zgłoszenie adresu lokalnego jest zablokowane — przy `localhost` działa wyłącznie `--dry-run`.
Ścieżki podawaj **bez wiodącego ukośnika** — Git Bash na Windowsie rozwija `/koperty-dl`
do ścieżki systemowej. Skrypt taki argument odrzuca zamiast zgłaszać nieistniejący adres.

Klucz protokołu leży w `public/<klucz>.txt` i **jest jawny** — cała weryfikacja polega na tym,
że plik jest publicznie dostępny pod adresem domeny. Nazwa pliku musi być równa jego zawartości;
skrypt sprawdza to lokalnie, a przed wysyłką dodatkowo pobiera plik z serwera, żeby nie wysyłać
zgłoszenia, które i tak wróci z błędem 403. Podmiana klucza to podmiana jednego pliku.

**Kroki po stronie właściciela** (jednorazowo, poza kodem):

1. Założyć konto w Bing Webmaster Tools i dodać `envelopes.pl` — najprościej importem z Search
   Console, który przenosi też zgłoszoną sitemapę. Alternatywnie weryfikacja znacznikiem:
   ustawić `NEXT_PUBLIC_BING_SITE_VERIFICATION` (wartość `content` ze znacznika `msvalidate.01`)
   i wdrożyć — bez tej zmiennej znacznik w ogóle nie trafia do HTML.
2. Zgłosić `https://envelopes.pl/sitemap.xml`, jeśli konto powstało bez importu.
3. Po pierwszym wdrożeniu uruchomić `npm run indexnow -- --all`. Później — `npm run indexnow`
   po każdym deployu, który dodał podstronę lub wpis albo istotnie zmienił istniejącą treść.

---

## Zdjęcia

W serwisie **nie ma żadnych prawdziwych zdjęć**. Każde miejsce, w którym w realnym sklepie byłoby
zdjęcie produktu, zajmuje komponent `EnvelopePlaceholder`: prostokąt w proporcjach zdjęcia
produktowego, z rysunkiem koperty, pieczęcią lakową i podpisem `[Koperta — DL, Granatowy]`.
Tło placeholdera przyjmuje odcień wybranego koloru, więc konfigurator daje namiastkę podglądu.

---

## Założenia wymagające potwierdzenia

1. **Format K4 to 155 × 155 mm** (kwadrat) — opisy zastosowań i treści blogowe zostały do tego
   dopasowane. Zmiana: `src/lib/catalog.ts`.
2. **Koszt dostawy: 19,99 zł brutto**, jedyny przewoźnik to kurier — bez progu darmowej dostawy,
   bez odbioru osobistego i bez Paczkomatów. Integracja z InPost Geowidget została w kodzie
   (`src/components/checkout/InpostGeowidget.tsx`), ale nie jest nigdzie renderowana; wystarczy
   przywrócić wybór metody w sekcji „Dostawa”, jeśli Paczkomaty wrócą do oferty.
3. **Faktura z odroczonym terminem** — oferta dla **instytucji publicznych i urzędów**
   (reguła z 14 sierpnia 2026), tak opisana we wszystkich treściach serwisu. Nie wstrzymuje
   produkcji; termin płatności 14 dni. Wyboru metody **nie bramkujemy w systemie** —
   `/api/profil` zwraca `deferredPaymentEligible: true` dla każdego zalogowanego użytkownika
   i tak ma zostać. Nie dodawać walidacji po NIP-ie ani po polu w profilu.
4. **Status „Anulowane”** — dodany zgodnie z rekomendacją z briefu.
5. **Dokumenty prawne** — regulamin, polityka prywatności i polityka cookies mają charakter wzorcowy
   i wymagają weryfikacji prawnej przed uruchomieniem sprzedaży.
6. **Dane rejestrowe firmy** — placeholdery w `src/lib/orders.ts` (`CONTACT_DETAILS`, `BANK_TRANSFER_DETAILS`).
