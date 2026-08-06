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
    pricing.ts             cennik i kalkulacja (nadpisywalny z Firestore)
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
3. **Faktura z odroczonym terminem** — dostępna przy każdym zamówieniu, bez warunków (opcja dla
   instytucji i jednostek budżetowych). Nie wstrzymuje produkcji; termin płatności 14 dni.
4. **Status „Anulowane”** — dodany zgodnie z rekomendacją z briefu.
5. **Dokumenty prawne** — regulamin, polityka prywatności i polityka cookies mają charakter wzorcowy
   i wymagają weryfikacji prawnej przed uruchomieniem sprzedaży.
6. **Dane rejestrowe firmy** — placeholdery w `src/lib/orders.ts` (`CONTACT_DETAILS`, `BANK_TRANSFER_DETAILS`).
