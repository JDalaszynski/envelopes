/**
 * Treści dokumentów prawnych. Jedno źródło dla stron serwisu oraz dla
 * wersji PDF regulaminu.
 *
 * Zasada nadrzędna: dokumenty opisują sklep taki, jaki jest naprawdę.
 *
 * Kwot nie ma tu celowo. Cennik bywa nadpisywany w czasie działania sklepu
 * dokumentem Firestore `pricing/current`, więc każda stawka wpisana w tym
 * pliku prędzej czy później rozjechałaby się z tą, którą widzi klient.
 * Regulamin odsyła zamiast tego do Cennika prezentowanego w Konfiguratorze
 * i w podsumowaniu Koszyka (§2 „Cennik”, §5).
 *
 * Pozostałe wartości — MOQ, terminy realizacji, limity plików — pochodzą
 * z tego samego miejsca co logika aplikacji (`pricing.ts`, `catalog.ts`,
 * `orders.ts`). Uwaga: biorą one wartości domyślne z kodu, więc nadpisanie
 * ich w Firestore również wymagałoby zmiany tekstu Regulaminu.
 */

import {
  BULK_QUOTE_THRESHOLD,
  PRINT_FILE_EXTENSIONS,
  PRINT_FILE_MAX_COUNT,
} from './catalog';
import { BANK_TRANSFER_DETAILS, CONTACT_DETAILS } from './orders';
import { DEFAULT_PRICING } from './pricing';

/* ── Model dokumentu ────────────────────────────────────────── */

/** Ustęp numerowany w obrębie paragrafu, opcjonalnie z podpunktami. */
export interface LegalClause {
  text: string;
  points?: string[];
}

export interface LegalTable {
  headers: string[];
  rows: string[][];
}

export interface LegalSection {
  id: string;
  heading: string;
  /** Tekst wprowadzający — bez numeracji */
  paragraphs?: string[];
  /** Numerowane ustępy (§ X ust. 1, 2, 3…) */
  clauses?: LegalClause[];
  /** Lista wypunktowana */
  list?: string[];
  table?: LegalTable;
  /** Uwaga pod sekcją — mniejszym drukiem */
  note?: string;
  /** Oznacza sekcję jako załącznik — inny nagłówek na stronie i w PDF */
  annex?: boolean;
}

export interface LegalDocument {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/* ── Wartości wspólne ───────────────────────────────────────── */

const SELLER = `${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.address}`;
const SELLER_FULL =
  `${CONTACT_DETAILS.company}, prowadzący działalność gospodarczą pod adresem ` +
  `${CONTACT_DETAILS.address}, wpisany do Centralnej Ewidencji i Informacji o Działalności ` +
  `Gospodarczej (CEIDG), NIP ${CONTACT_DETAILS.nip}, REGON ${CONTACT_DETAILS.regon}`;

const PRINT_EXT_LABEL = PRINT_FILE_EXTENSIONS.filter((ext) => ext !== 'jpeg')
  .map((ext) => ext.toUpperCase())
  .join(', ');

/** Data ostatniej aktualizacji — wspólna dla wszystkich trzech dokumentów. */
const UPDATED = '2026-08-11';

/* ── Regulamin ──────────────────────────────────────────────── */

export const TERMS: LegalDocument = {
  title: 'Regulamin sklepu Envelopes',
  description:
    'Regulamin sklepu envelopes.pl: zawieranie umów, ceny i płatności, akceptacja wizualizacji, terminy realizacji, dostawa, odstąpienie od umowy i reklamacje.',
  updated: UPDATED,
  intro:
    'Regulamin określa zasady sprzedaży kopert ozdobnych — gładkich oraz z nadrukiem i personalizacją — prowadzonej za pośrednictwem sklepu internetowego envelopes.pl, a także zasady korzystania z konta klienta i pozostałych usług świadczonych drogą elektroniczną.',
  sections: [
    {
      id: 'postanowienia-ogolne',
      heading: '§1. Postanowienia ogólne i dane Sprzedawcy',
      clauses: [
        {
          text: `Sklep internetowy dostępny pod adresem envelopes.pl prowadzi ${SELLER_FULL}, zwany dalej „Sprzedawcą”.`,
        },
        {
          text: 'Sprzedawca jest czynnym podatnikiem podatku od towarów i usług (VAT).',
        },
        {
          text: 'Kontakt ze Sprzedawcą możliwy jest:',
          points: [
            `pocztą elektroniczną — ${CONTACT_DETAILS.email},`,
            `telefonicznie — ${CONTACT_DETAILS.phone}, w godzinach pracy Biura Obsługi Klienta: ${CONTACT_DETAILS.hours},`,
            `korespondencyjnie — ${CONTACT_DETAILS.address},`,
            'przez formularz kontaktowy dostępny w Sklepie.',
          ],
        },
        {
          text: `Adresem właściwym do odsyłania towaru przy odstąpieniu od umowy oraz do wysyłki towaru reklamowanego jest: ${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.returnAddress}. Przed odesłaniem przesyłki prosimy o kontakt na adres ${CONTACT_DETAILS.email} — pozwoli to sprawniej powiązać zwrot z zamówieniem.`,
        },
        {
          text: 'Regulamin jest udostępniany nieodpłatnie, w postaci umożliwiającej jego pobranie, utrwalenie i wydrukowanie, w tym w formacie PDF pod przyciskiem „Pobierz dokument (PDF)” na tej stronie.',
        },
        {
          text: 'Regulamin jest skierowany zarówno do Konsumentów, jak i do Przedsiębiorców. Postanowienia dotyczące wyłącznie jednej z tych grup są w treści wyraźnie oznaczone.',
        },
      ],
    },
    {
      id: 'definicje',
      heading: '§2. Definicje',
      paragraphs: ['Użyte w Regulaminie pojęcia oznaczają:'],
      list: [
        'Sklep — sklep internetowy prowadzony przez Sprzedawcę pod adresem envelopes.pl.',
        'Klient — osoba fizyczna posiadająca pełną zdolność do czynności prawnych, osoba prawna albo jednostka organizacyjna nieposiadająca osobowości prawnej, której ustawa przyznaje zdolność prawną, składająca Zamówienie w Sklepie.',
        'Konsument — Klient będący osobą fizyczną dokonującą ze Sprzedawcą czynności prawnej niezwiązanej bezpośrednio z jej działalnością gospodarczą lub zawodową.',
        'Przedsiębiorca na prawach konsumenta (PNPK) — osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści tej umowy wynika, że nie ma ona dla niej charakteru zawodowego, wynikającego w szczególności z przedmiotu wykonywanej działalności ujawnionego w CEIDG. PNPK przysługują uprawnienia opisane w §12 i §13 na równi z Konsumentem.',
        'Przedsiębiorca — Klient niebędący Konsumentem ani PNPK.',
        'Produkt — koperta ozdobna oferowana w Sklepie, w wybranym formacie i kolorze, opcjonalnie z Nadrukiem lub Personalizacją.',
        'Nadruk — naniesienie na kopertę grafiki przekazanej przez Klienta (najczęściej logotypu lub projektu firmowego).',
        'Personalizacja — naniesienie na poszczególne koperty indywidualnych treści wskazanych przez Klienta: imion i nazwisk, dedykacji albo pełnych danych adresowych.',
        'Konfigurator — narzędzie w Sklepie służące do ustalenia parametrów Produktu, ilości i ceny.',
        'Koszyk — usługa elektroniczna umożliwiająca zebranie skonfigurowanych Produktów przed złożeniem Zamówienia.',
        'Zamówienie — oświadczenie woli Klienta zmierzające bezpośrednio do zawarcia Umowy sprzedaży, składane przyciskiem „Zamawiam i płacę”.',
        'Umowa sprzedaży — umowa zawierana między Klientem a Sprzedawcą za pośrednictwem Sklepu.',
        'Konto — usługa elektroniczna oznaczona indywidualnym adresem e-mail i hasłem, w której gromadzone są dane Klienta oraz historia jego Zamówień.',
        'Pliki Klienta — pliki graficzne przekazane przez Klienta do Nadruku oraz arkusze z danymi do Personalizacji.',
        'Wizualizacja — przygotowany przez Sprzedawcę podgląd projektu Nadruku lub Personalizacji, przesyłany Klientowi do akceptacji przed skierowaniem Zamówienia do produkcji.',
        'MOQ — minimalna ilość Zamówienia dla danej konfiguracji, określona w §5.',
        'Dzień roboczy — dzień od poniedziałku do piątku, z wyłączeniem dni ustawowo wolnych od pracy w Rzeczypospolitej Polskiej.',
        'Cennik — ceny Produktów oraz opłaty za usługi dodatkowe i dostawę, prezentowane w Konfiguratorze i w podsumowaniu Koszyka. Cennik jest jedynym źródłem informacji o wysokości opłat; Regulamin nie powtarza kwot, a zmiana Cennika nie stanowi zmiany Regulaminu i nie wpływa na Zamówienia już złożone.',
      ],
    },
    {
      id: 'uslugi-elektroniczne',
      heading: '§3. Usługi świadczone drogą elektroniczną i wymagania techniczne',
      clauses: [
        {
          text: 'Sprzedawca świadczy za pośrednictwem Sklepu następujące nieodpłatne usługi drogą elektroniczną:',
          points: [
            'Konfigurator i Koszyk — usługa jednorazowa, świadczona od dodania pierwszego Produktu do Koszyka do złożenia Zamówienia, opuszczenia Sklepu albo opróżnienia Koszyka;',
            'Konto — usługa świadczona w sposób ciągły i przez czas nieoznaczony, na zasadach opisanych w §4;',
            'formularz kontaktowy — usługa jednorazowa, kończąca się wysłaniem wiadomości;',
            'widok akceptacji Wizualizacji — usługa jednorazowa, dostępna pod indywidualnym linkiem przesłanym w wiadomości e-mail, na zasadach opisanych w §8.',
          ],
        },
        {
          text: 'Do korzystania ze Sklepu niezbędne są:',
          points: [
            'urządzenie z dostępem do sieci Internet,',
            'aktualna wersja przeglądarki internetowej (Chrome, Firefox, Safari, Edge) z obsługą języka JavaScript,',
            'włączona obsługa pamięci lokalnej przeglądarki (localStorage) — bez niej nie działa Koszyk ani zapamiętanie decyzji o zgodach,',
            'aktywne konto poczty elektronicznej — na wskazany adres Sprzedawca wysyła potwierdzenie Zamówienia, Wizualizację do akceptacji i informacje o statusie realizacji.',
          ],
        },
        {
          text: 'Klienta obowiązuje zakaz dostarczania treści o charakterze bezprawnym, w szczególności przekazywania w Plikach Klienta, w treści Personalizacji oraz w formularzu kontaktowym materiałów naruszających prawa osób trzecich, przepisy prawa lub dobre obyczaje.',
        },
        {
          text: `Reklamacje dotyczące funkcjonowania Sklepu i usług elektronicznych — na przykład błędów Konfiguratora, problemów z wgraniem pliku lub z logowaniem — Klient może zgłaszać na adres ${CONTACT_DETAILS.email}. Sprzedawca rozpatruje takie zgłoszenia w terminie 14 dni.`,
        },
        {
          text: 'Sprzedawca nie prowadzi newslettera ani innej wysyłki informacji handlowych. Wiadomości e-mail wysyłane są wyłącznie w związku z realizacją złożonego Zamówienia lub w odpowiedzi na zapytanie Klienta.',
        },
      ],
    },
    {
      id: 'konto',
      heading: '§4. Konto Klienta',
      clauses: [
        {
          text: 'Założenie Konta jest dobrowolne i nieodpłatne. Zamówienie można złożyć również bez rejestracji, jako gość.',
        },
        {
          text: 'Konto zakłada się przez formularz rejestracji, przez uwierzytelnienie kontem Google albo zaznaczając odpowiednią opcję w trakcie składania Zamówienia — wówczas Konto powstaje na podstawie danych już wpisanych w formularzu, a Klient ustala wyłącznie hasło.',
        },
        {
          text: 'Umowa o prowadzenie Konta zostaje zawarta z chwilą potwierdzenia rejestracji i obowiązuje przez czas nieoznaczony.',
        },
        {
          text: 'Konto może założyć wyłącznie osoba, która ukończyła 18 lat.',
        },
        {
          text: 'Klient zobowiązany jest podawać dane prawdziwe i aktualne oraz nie udostępniać danych logowania osobom nieuprawnionym.',
        },
        {
          text: `Klient może w każdej chwili i bez podania przyczyny wypowiedzieć umowę o prowadzenie Konta, wysyłając żądanie usunięcia Konta na adres ${CONTACT_DETAILS.email}. Konto zostaje usunięte niezwłocznie, nie później niż w terminie 14 dni.`,
        },
        {
          text: 'Usunięcie Konta nie powoduje usunięcia danych, które Sprzedawca ma obowiązek przechowywać na podstawie przepisów prawa — w szczególności dokumentów księgowych — ani danych niezbędnych do obrony przed roszczeniami. Szczegóły opisuje Polityka Prywatności.',
        },
        {
          text: 'Konsument oraz PNPK mogą odstąpić od umowy o prowadzenie Konta w terminie 14 dni od jej zawarcia, bez podania przyczyny, przez złożenie oświadczenia w dowolnej formie. Nie wpływa to na Umowy sprzedaży zawarte za pośrednictwem Konta.',
        },
        {
          text: 'Sprzedawca może wypowiedzieć umowę o prowadzenie Konta z zachowaniem 14-dniowego okresu wypowiedzenia w razie rażącego naruszenia Regulaminu przez Klienta, w szczególności podania danych nieprawdziwych lub dostarczania treści bezprawnych.',
        },
      ],
    },
    {
      id: 'produkty-ceny',
      heading: '§5. Produkty, ceny i minimalne ilości',
      clauses: [
        {
          text: 'Przedmiotem sprzedaży są koperty ozdobne. Aktualnie dostępne formaty, kolory, gramatury i ceny prezentuje Konfigurator; formaty oznaczone jako „Dostępne wkrótce” nie są jeszcze przedmiotem sprzedaży.',
        },
        {
          text: 'Cena jednostkowa Produktu zależy wyłącznie od formatu koperty i jest identyczna dla wszystkich dostępnych kolorów. Wykończenia perłowe, metaliczne i eko nie podlegają dopłacie.',
        },
        {
          text: 'Wszystkie ceny podane w Sklepie są cenami brutto wyrażonymi w złotych polskich i zawierają podatek VAT w obowiązującej stawce. Stawka i kwota podatku widoczne są w podsumowaniu Koszyka, w podsumowaniu Zamówienia oraz na dokumencie sprzedaży.',
        },
        {
          text: 'Regulamin nie zawiera kwot — aktualne stawki określa wyłącznie Cennik prezentowany w Konfiguratorze i w podsumowaniu Koszyka. Poza ceną jednostkową Produktu na wartość Zamówienia mogą składać się następujące opłaty:',
          points: [
            'opłata za Nadruk — naliczana za każdą sztukę,',
            'opłata za Personalizację — naliczana za każdą sztukę,',
            'dopłata za realizację ekspresową — naliczana za każdą sztukę, wyłącznie w Zamówieniach obejmujących Nadruk lub Personalizację,',
            'koszt dostawy — naliczany do każdego Zamówienia.',
          ],
        },
        {
          text: 'Każda z opłat wymienionych w ustępie poprzedzającym jest prezentowana wraz z jej wysokością w Konfiguratorze w chwili wyboru danej usługi oraz w podsumowaniu Zamówienia — przed jego złożeniem i przed jakimkolwiek zobowiązaniem do zapłaty.',
        },
        {
          text: 'Sprzedawca nie stosuje rabatów ilościowych — cena jednostkowa nie zmienia się wraz z wielkością Zamówienia. Sprzedawca nie prowadzi programu kodów rabatowych; w Sklepie nie ma pola do wpisania kodu i żadne kody nie są honorowane.',
        },
        {
          text: 'Minimalna ilość Zamówienia (MOQ) wynosi:',
          points: [
            `${DEFAULT_PRICING.moqWithPrint} sztuk dla Produktów z Nadrukiem lub Personalizacją,`,
            `${DEFAULT_PRICING.moqWithoutPrint} sztuka dla kopert gładkich.`,
          ],
        },
        {
          text: `Przy Zamówieniach przekraczających ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk Sprzedawca zastrzega konieczność indywidualnego uzgodnienia harmonogramu realizacji, sposobu rozliczenia oraz warunków dostawy. Kontakt w tej sprawie odbywa się przez formularz wyceny dostępny w Sklepie.`,
        },
        {
          text: 'Ceną wiążącą jest cena widoczna w podsumowaniu Zamówienia w chwili jego złożenia. Późniejsza zmiana Cennika nie wpływa na Zamówienia już złożone.',
        },
        {
          text: 'Informacje o Produktach prezentowane w Sklepie stanowią zaproszenie do zawarcia umowy w rozumieniu art. 71 Kodeksu cywilnego, a nie ofertę.',
        },
      ],
    },
    {
      id: 'zawieranie-umow',
      heading: '§6. Składanie Zamówień i zawarcie Umowy',
      clauses: [
        {
          text: 'Złożenie Zamówienia polega na skonfigurowaniu Produktu w Konfiguratorze, dodaniu go do Koszyka, uzupełnieniu danych w formularzu Zamówienia, wyborze metody płatności, zaakceptowaniu Regulaminu i potwierdzeniu przyciskiem „Zamawiam i płacę”.',
        },
        {
          text: 'Przycisk „Zamawiam i płacę” jest jednoznacznie oznaczony jako zobowiązanie do zapłaty. Umowa sprzedaży zostaje zawarta z chwilą jego kliknięcia.',
        },
        {
          text: 'Każdemu Zamówieniu nadawany jest unikalny numer w formacie ENV-RRRRMMDD-XXXX, widoczny na potwierdzeniu, w panelu Klienta oraz na dokumencie sprzedaży. Prosimy o powoływanie się na ten numer w całej korespondencji.',
        },
        {
          text: 'Niezwłocznie po zawarciu Umowy Sprzedawca przesyła na wskazany adres e-mail potwierdzenie zawarcia Umowy wraz z jej treścią, co stanowi utrwalenie, zabezpieczenie i udostępnienie Klientowi treści zawartej Umowy.',
        },
        {
          text: 'Ceny i inne wartości Zamówienia są przeliczane po stronie serwera Sprzedawcy na podstawie obowiązującego Cennika. W razie rozbieżności między kwotą przesłaną z przeglądarki a wyliczeniem serwera wiążące jest wyliczenie serwera.',
        },
        {
          text: 'Zamówienia przyjmowane są całodobowo. Zamówienia złożone po godzinie 12:00, a także w soboty, niedziele i dni ustawowo wolne od pracy, uznaje się za złożone w najbliższym Dniu roboczym — od tego dnia liczy się bieg terminów realizacji.',
        },
        {
          text: 'Sprzedawca może odmówić przyjęcia Zamówienia do realizacji, informując o tym Klienta i zwracając otrzymaną płatność w całości, jeżeli:',
          points: [
            'dane Klienta są niekompletne lub oczywiście nieprawdziwe i nie udało się ich uzupełnić,',
            'Pliki Klienta lub treść Personalizacji naruszają prawo, prawa osób trzecich albo dobre obyczaje (§7 ust. 6),',
            'realizacja Zamówienia jest niemożliwa z przyczyn niezależnych od Sprzedawcy, w szczególności z powodu trwałego braku dostępności papieru w wybranym kolorze.',
          ],
        },
      ],
    },
    {
      id: 'pliki-klienta',
      heading: '§7. Pliki Klienta, Nadruk i Personalizacja',
      clauses: [
        {
          text: `Pliki do Nadruku przyjmowane są w formatach ${PRINT_EXT_LABEL}, o wielkości do 10 MB każdy, w liczbie do ${PRINT_FILE_MAX_COUNT} plików na Zamówienie. Sprzedawca rekomenduje pliki wektorowe z czcionkami zamienionymi na krzywe.`,
        },
        {
          text: 'Dane do Personalizacji Klient przekazuje w jeden z dwóch sposobów:',
          points: [
            'wpisując treść bezpośrednio w Konfiguratorze — właściwe dla krótkiego, powtarzalnego tekstu,',
            'pobierając ze Sklepu arkusz w formacie XLSX z liczbą wierszy odpowiadającą zamówionej ilości kopert, uzupełniając go i wgrywając z powrotem. Sprzedawca automatycznie sprawdza kompletność wierszy oraz ich zgodność z zamówioną ilością; plik z niezgodną liczbą wierszy nie zostanie przyjęty.',
          ],
        },
        {
          text: 'Klient oświadcza, że przysługują mu prawa autorskie lub inne prawa do korzystania z materiałów przekazanych w Plikach Klienta w zakresie niezbędnym do realizacji Zamówienia, w tym prawa do znaków towarowych i wizerunków w nich zawartych.',
        },
        {
          text: 'Klient udziela Sprzedawcy nieodpłatnej, niewyłącznej licencji na zwielokrotnienie przekazanych materiałów wyłącznie w zakresie i przez czas niezbędny do wykonania Zamówienia.',
        },
        {
          text: 'Jeżeli osoba trzecia wystąpi wobec Sprzedawcy z roszczeniem z tytułu naruszenia praw do materiałów przekazanych przez Klienta, Klient zobowiązuje się przystąpić do sprawy i zwolnić Sprzedawcę z odpowiedzialności oraz pokryć uzasadnione koszty obrony. Postanowienie to nie dotyczy Konsumentów ani PNPK, którzy odpowiadają na zasadach ogólnych.',
        },
        {
          text: 'Sprzedawca może odmówić wykonania Nadruku lub Personalizacji, których treść jest bezprawna, narusza prawa osób trzecich, nawołuje do nienawiści albo jest sprzeczna z dobrymi obyczajami. O odmowie Sprzedawca informuje niezwłocznie, a otrzymana płatność podlega zwrotowi w całości.',
        },
        {
          text: 'Sprzedawca nie odpowiada za wady Produktu wynikające z właściwości Plików Klienta, w szczególności ze zbyt niskiej rozdzielczości grafiki, braku spadów, zastosowania przestrzeni barwnej RGB zamiast CMYK ani z błędów w treści przekazanej do Personalizacji. Skutki akceptacji Wizualizacji reguluje §8.',
        },
        {
          text: 'Pliki Klienta Sprzedawca przechowuje przez 12 miesięcy od realizacji Zamówienia — w celu obsługi ewentualnych reklamacji oraz ułatwienia Zamówień powtarzalnych — po czym je usuwa. Klient może w każdej chwili zażądać wcześniejszego usunięcia plików.',
        },
        {
          text: 'Sprzedawca nie wykorzystuje projektów Klienta w materiałach marketingowych, na stronie internetowej ani w mediach społecznościowych bez uprzedniej, odrębnej zgody Klienta.',
        },
      ],
    },
    {
      id: 'wizualizacja',
      heading: '§8. Wizualizacja i akceptacja projektu',
      clauses: [
        {
          text: 'Zamówienia obejmujące Nadruk lub Personalizację przechodzą przez etap akceptacji Wizualizacji. Zamówienia obejmujące wyłącznie koperty gładkie pomijają ten etap w całości.',
        },
        {
          text: 'Sprzedawca przygotowuje Wizualizację niezależnie od statusu płatności i przesyła ją na adres e-mail wskazany w Zamówieniu. Zamówienie otrzymuje wówczas status „Czeka na akceptację”.',
        },
        {
          text: 'Wizualizacja dostępna jest pod indywidualnym linkiem, który nie wymaga logowania. Link ma charakter poufny — Klient powinien chronić go przed dostępem osób nieuprawnionych. Akceptacji można dokonać także po zalogowaniu, w panelu „Złożone zamówienia”.',
        },
        {
          text: 'Klient może Wizualizację zaakceptować albo zgłosić do niej uwagi. Zgłoszenie uwag skutkuje przygotowaniem kolejnej wersji projektu.',
        },
        {
          text: 'W cenie Zamówienia mieszczą się dwie korekty Wizualizacji. Przygotowanie kolejnych wersji wymaga uprzedniego uzgodnienia ze Sprzedawcą, w tym uzgodnienia ewentualnej dopłaty; do czasu uzgodnienia bieg terminu realizacji ulega zawieszeniu.',
        },
        {
          text: 'Akceptacja Wizualizacji jest zatwierdzeniem projektu do produkcji. Z chwilą akceptacji Klient przyjmuje odpowiedzialność za treść, pisownię, układ, wielkość i rozmieszczenie elementów projektu oraz za poprawność danych adresowych. Reklamacje dotyczące zaakceptowanych elementów projektu nie przysługują; nie ogranicza to odpowiedzialności Sprzedawcy za wady wykonania, w tym za niezgodność wyrobu z zaakceptowaną Wizualizacją.',
        },
        {
          text: 'Jeżeli Klient nie zaakceptuje Wizualizacji ani nie zgłosi uwag, Sprzedawca wysyła przypomnienie po 3 Dniach roboczych. Brak reakcji w terminie 14 dni od przesłania Wizualizacji uprawnia Sprzedawcę do anulowania Zamówienia; otrzymana płatność podlega wówczas zwrotowi w całości, ponieważ produkcja nie została rozpoczęta.',
        },
      ],
    },
    {
      id: 'realizacja',
      heading: '§9. Realizacja Zamówienia',
      clauses: [
        {
          text: 'Terminy realizacji, liczone w Dniach roboczych, wynoszą:',
          points: [
            `koperty gładkie — ${DEFAULT_PRICING.leadDaysPlain} Dni robocze. Koperty gładkie nie przechodzą przez produkcję, dlatego nie ma dla nich wyboru trybu realizacji ani dopłaty ekspresowej;`,
            `koperty z Nadrukiem lub Personalizacją, realizacja standardowa — ${DEFAULT_PRICING.leadDaysStandard} Dni roboczych, bez dopłaty;`,
            `koperty z Nadrukiem lub Personalizacją, realizacja ekspresowa — ${DEFAULT_PRICING.leadDaysExpress} Dni robocze, za dopłatą według Cennika, naliczaną za każdą sztukę.`,
          ],
        },
        {
          text: 'Tryb realizacji jest wspólny dla całego Zamówienia — przesyłka wychodzi jedna, więc dopłata ekspresowa nalicza się od łącznej liczby sztuk w Zamówieniu.',
        },
        {
          text: 'Bieg terminu realizacji rozpoczyna się od późniejszego z następujących zdarzeń:',
          points: [
            'zaksięgowania wpłaty — a w przypadku wyboru faktury z odroczonym terminem płatności: przyjęcia Zamówienia do realizacji,',
            'akceptacji Wizualizacji przez Klienta — jeżeli Zamówienie jej wymaga.',
          ],
        },
        {
          text: 'Przewidywana data dostawy prezentowana w Sklepie i w wiadomościach e-mail ma charakter szacunkowy. Zakłada niezwłoczne opłacenie Zamówienia oraz — gdy jest wymagana — niezwłoczną akceptację Wizualizacji, i nie obejmuje czasu oczekiwania na te zdarzenia.',
        },
        {
          text: 'Zamówienie zostaje skierowane do produkcji po łącznym spełnieniu dwóch warunków: potwierdzenia płatności (albo wyboru faktury z odroczonym terminem płatności) oraz akceptacji Wizualizacji, jeżeli jest wymagana.',
        },
        {
          text: 'Status Zamówienia Klient śledzi w panelu „Złożone zamówienia”. Statusy oznaczają kolejno: przyjęcie Zamówienia, przygotowanie, oczekiwanie na akceptację projektu, skierowanie do produkcji, wysyłkę oraz anulowanie.',
        },
        {
          text: 'Ze względu na technologię druku i naturalny charakter papieru dopuszczalne są:',
          points: [
            'różnice kolorystyczne między wydrukiem a obrazem na ekranie monitora — barwy prezentowane w Sklepie i w Wizualizacji mają charakter poglądowy;',
            'nieznaczne różnice odcienia papieru między partiami produkcyjnymi, w tym między Zamówieniem powtarzalnym a poprzednim;',
            'nieznaczne odchylenia położenia Nadruku, mieszczące się w tolerancjach właściwych dla druku cyfrowego.',
          ],
        },
        {
          text: `Wobec Przedsiębiorców, przy Zamówieniach powyżej 500 sztuk z Nadrukiem lub Personalizacją, Sprzedawca zastrzega dopuszczalną tolerancję nakładu w wysokości ±2%; rozliczeniu podlega ilość faktycznie dostarczona. Tolerancja nie ma zastosowania do Zamówień Konsumentów ani PNPK, którym Sprzedawca wydaje pełną zamówioną ilość.`,
        },
        {
          text: 'Sprzedawca nie gwarantuje odwzorowania kolorów według wzorników Pantone ani zgodności z próbą drukarską, chyba że strony wyraźnie uzgodniły to na piśmie lub w wiadomości e-mail przed rozpoczęciem produkcji.',
        },
        {
          text: 'Klient może anulować Zamówienie bez ponoszenia kosztów do chwili skierowania go do produkcji (statusu „Do druku”), zgłaszając to na adres e-mail Sprzedawcy. Otrzymana płatność podlega wówczas zwrotowi w całości. Po skierowaniu Zamówienia do produkcji anulowanie Zamówienia obejmującego Nadruk lub Personalizację nie jest możliwe, ponieważ Produkt jest wykonywany na indywidualne zamówienie.',
        },
      ],
    },
    {
      id: 'platnosci',
      heading: '§10. Płatności i faktury',
      clauses: [
        {
          text: 'Sprzedawca udostępnia następujące metody płatności:',
          points: [
            'Przelewy24 — karta płatnicza albo szybki przelew; potwierdzenie natychmiastowe,',
            'BLIK — kod z aplikacji bankowej; potwierdzenie natychmiastowe,',
            'przelew tradycyjny — na podstawie faktury proforma; realizacja rozpoczyna się po zaksięgowaniu wpłaty,',
            'faktura z odroczonym terminem płatności — 14 dni od daty wystawienia; realizacja Zamówienia rozpoczyna się bez oczekiwania na wpłatę.',
          ],
        },
        {
          text: 'Płatności elektroniczne obsługuje PayPro S.A. (Przelewy24) z siedzibą w Poznaniu, będący krajową instytucją płatniczą nadzorowaną przez Komisję Nadzoru Finansowego. Sprzedawca nie ma dostępu do danych karty płatniczej Klienta.',
        },
        {
          text: 'Faktura z odroczonym terminem płatności adresowana jest przede wszystkim do firm, instytucji i jednostek budżetowych, których obieg zakupowy nie przewiduje przedpłaty. Sprzedawca może uzależnić jej udostępnienie od weryfikacji Klienta albo odmówić jej w indywidualnym przypadku, informując o tym przed rozpoczęciem realizacji.',
        },
        {
          text: 'Dane do przelewu tradycyjnego:',
          points: [
            `odbiorca — ${BANK_TRANSFER_DETAILS.odbiorca}, ${BANK_TRANSFER_DETAILS.adres},`,
            `numer rachunku — ${BANK_TRANSFER_DETAILS.konto} (${BANK_TRANSFER_DETAILS.bank}),`,
            'tytuł przelewu — numer Zamówienia w formacie ENV-RRRRMMDD-XXXX.',
          ],
        },
        {
          text: 'W razie wyboru przelewu tradycyjnego brak wpłaty w terminie 7 dni od złożenia Zamówienia uprawnia Sprzedawcę do anulowania Zamówienia, po uprzednim przypomnieniu wysłanym na adres e-mail Klienta.',
        },
        {
          text: 'Do każdego Zamówienia Sprzedawca wystawia fakturę VAT. Składając Zamówienie, Klient akceptuje wystawianie i przesyłanie faktur w formie elektronicznej, na adres e-mail wskazany w Zamówieniu, zgodnie z art. 106n ustawy o podatku od towarów i usług. Akceptację tę można w każdej chwili cofnąć, informując o tym Sprzedawcę.',
        },
        {
          text: 'W razie opóźnienia w zapłacie przez Przedsiębiorcę Sprzedawcy przysługują odsetki ustawowe za opóźnienie w transakcjach handlowych oraz rekompensata za koszty odzyskiwania należności, na zasadach określonych w ustawie o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych.',
        },
        {
          text: 'Zwrot płatności następuje tą samą metodą, której użył Klient, chyba że Klient wyraźnie zgodzi się na inne rozwiązanie — w każdym przypadku bez ponoszenia przez niego opłat.',
        },
      ],
    },
    {
      id: 'dostawa',
      heading: '§11. Dostawa',
      clauses: [
        {
          text: 'Dostawa realizowana jest wyłącznie na terytorium Rzeczypospolitej Polskiej, za pośrednictwem firmy kurierskiej wybranej przez Sprzedawcę. Wysyłka poza granice kraju jest możliwa wyłącznie po indywidualnym uzgodnieniu warunków i kosztów.',
        },
        {
          text: 'Koszt dostawy określa Cennik. Jest on naliczany do każdego Zamówienia, niezależnie od jego wartości i liczby sztuk, i widoczny w podsumowaniu Zamówienia przed jego złożeniem. Sprzedawca nie stosuje progu darmowej dostawy i nie prowadzi odbioru osobistego.',
        },
        {
          text: `Przy Zamówieniach przekraczających ${BULK_QUOTE_THRESHOLD.toLocaleString('pl-PL')} sztuk warunki i koszt dostawy ustalane są indywidualnie przed przyjęciem Zamówienia do realizacji (§5 ust. 8).`,
        },
        {
          text: 'Czas dostawy przez przewoźnika, zwykle 1–2 Dni robocze, doliczany jest do terminu realizacji określonego w §9.',
        },
        {
          text: 'Sprzedawca zaleca sprawdzenie stanu przesyłki przy odbiorze. W razie stwierdzenia uszkodzenia opakowania lub zawartości pomocne jest sporządzenie z kurierem protokołu szkody — ułatwia to dochodzenie roszczeń, ale jego brak nie pozbawia Konsumenta ani PNPK żadnych uprawnień.',
        },
        {
          text: 'Przedsiębiorca zobowiązany jest zgłosić braki ilościowe oraz uszkodzenia powstałe w transporcie w terminie 3 Dni roboczych od odbioru przesyłki, pod rygorem utraty roszczeń z tego tytułu.',
        },
        {
          text: 'Z chwilą wydania przesyłki przewoźnikowi korzyści i ciężary związane z Produktem oraz ryzyko przypadkowej utraty lub uszkodzenia przechodzą na Przedsiębiorcę (art. 548 § 3 Kodeksu cywilnego). W przypadku Konsumenta i PNPK ryzyko przechodzi z chwilą wydania Produktu Klientowi.',
        },
        {
          text: 'Jeżeli przesyłka nie zostanie odebrana i wróci do Sprzedawcy z przyczyn leżących po stronie Klienta, ponowna wysyłka nastąpi po opłaceniu kolejnego kosztu dostawy według Cennika obowiązującego w chwili ponownej wysyłki. Nie dotyczy to sytuacji, w której nieodebranie przesyłki wynikało z odstąpienia od Umowy przez Konsumenta lub PNPK.',
        },
      ],
    },
    {
      id: 'odstapienie',
      heading: '§12. Odstąpienie od Umowy (Konsument i PNPK)',
      clauses: [
        {
          text: 'Konsument oraz PNPK mogą odstąpić od Umowy sprzedaży w terminie 14 dni bez podania przyczyny. Termin biegnie od dnia objęcia Produktu w posiadanie przez Klienta lub wskazaną przez niego osobę trzecią inną niż przewoźnik. Do zachowania terminu wystarczy wysłanie oświadczenia przed jego upływem.',
        },
        {
          text: `Oświadczenie o odstąpieniu można złożyć w dowolnej formie, w szczególności wysyłając je na adres ${CONTACT_DETAILS.email} albo pocztą na adres ${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.returnAddress}. Można skorzystać z formularza stanowiącego Załącznik nr 1 do Regulaminu, dostępnego również w formacie PDF — nie jest to jednak obowiązkowe.`,
        },
        {
          text: 'PRAWO ODSTĄPIENIA NIE PRZYSŁUGUJE w odniesieniu do umów, w których przedmiotem świadczenia jest rzecz nieprefabrykowana, wyprodukowana według specyfikacji Konsumenta lub służąca zaspokojeniu jego zindywidualizowanych potrzeb (art. 38 ust. 1 pkt 3 ustawy o prawach konsumenta). Dotyczy to wszystkich kopert z Nadrukiem oraz kopert z Personalizacją: są one wykonywane na indywidualne zamówienie, według projektu zaakceptowanego przez Klienta, i nie podlegają zwrotowi ani wymianie z tytułu odstąpienia od Umowy.',
        },
        {
          text: 'Koperty gładkie — bez Nadruku i bez Personalizacji — podlegają prawu odstąpienia na zasadach ogólnych.',
        },
        {
          text: 'Klient odsyła Produkt niezwłocznie, nie później niż w terminie 14 dni od dnia odstąpienia. Bezpośrednie koszty zwrotu Produktu ponosi Klient.',
        },
        {
          text: 'Sprzedawca zwraca wszystkie otrzymane płatności, w tym koszty dostawy, niezwłocznie, nie później niż w terminie 14 dni od otrzymania oświadczenia o odstąpieniu. Sprzedawca może wstrzymać się ze zwrotem do chwili otrzymania Produktu z powrotem albo dostarczenia przez Klienta dowodu jego odesłania — w zależności od tego, które zdarzenie nastąpi wcześniej.',
        },
        {
          text: 'Jeżeli Klient wybrał sposób dostawy inny niż najtańszy zwykły sposób oferowany przez Sprzedawcę, Sprzedawca nie zwraca dodatkowych kosztów wynikających z tego wyboru.',
        },
        {
          text: 'Klient ponosi odpowiedzialność za zmniejszenie wartości Produktu będące wynikiem korzystania z niego w sposób wykraczający poza konieczny do stwierdzenia jego charakteru, cech i funkcjonowania.',
        },
        {
          text: 'Prawo odstąpienia od umowy zawartej na odległość nie przysługuje Przedsiębiorcy.',
        },
      ],
    },
    {
      id: 'reklamacje-konsument',
      heading: '§13. Reklamacje — Konsument i PNPK',
      clauses: [
        {
          text: 'Sprzedawca ma obowiązek dostarczyć Produkt zgodny z Umową i ponosi wobec Konsumenta oraz PNPK odpowiedzialność za brak takiej zgodności na zasadach określonych w rozdziale 5a ustawy o prawach konsumenta.',
        },
        {
          text: 'Sprzedawca odpowiada za brak zgodności Produktu z Umową istniejący w chwili jego dostarczenia i ujawniony w ciągu dwóch lat od tej chwili.',
        },
        {
          text: `Reklamację można złożyć na adres ${CONTACT_DETAILS.email} albo przez formularz kontaktowy, podając numer Zamówienia, opis stwierdzonej wady oraz — jeżeli to możliwe — zdjęcia Produktu.`,
        },
        {
          text: 'Sprzedawca ustosunkowuje się do reklamacji w terminie 14 dni od jej otrzymania i informuje Klienta o sposobie jej rozpatrzenia.',
        },
        {
          text: 'W razie braku zgodności Produktu z Umową Klient może żądać jego naprawy lub wymiany. Jeżeli naprawa albo wymiana są niemożliwe lub wymagałyby nadmiernych kosztów, a także w pozostałych przypadkach wskazanych w ustawie, Klient może złożyć oświadczenie o obniżeniu ceny albo o odstąpieniu od Umowy.',
        },
        {
          text: 'Koszty naprawy lub wymiany, w tym koszty odesłania Produktu do Sprzedawcy, ponosi Sprzedawca.',
        },
        {
          text: 'Zgodnie z §8 ust. 6 reklamacja nie obejmuje elementów projektu zaakceptowanych przez Klienta na etapie Wizualizacji, a zgodnie z §9 ust. 7 — odchyleń mieszczących się w opisanych tam tolerancjach.',
        },
        {
          text: 'Sprzedawca nie udziela na Produkty gwarancji w rozumieniu art. 577 Kodeksu cywilnego. Nie ogranicza to w żaden sposób ustawowej odpowiedzialności Sprzedawcy opisanej w niniejszym paragrafie.',
        },
      ],
    },
    {
      id: 'reklamacje-przedsiebiorca',
      heading: '§14. Reklamacje i odpowiedzialność — Przedsiębiorcy',
      paragraphs: [
        'Postanowienia niniejszego paragrafu dotyczą wyłącznie Klientów będących Przedsiębiorcami i nie mają zastosowania do Konsumentów ani do PNPK.',
      ],
      clauses: [
        {
          text: 'Na podstawie art. 558 § 1 Kodeksu cywilnego odpowiedzialność Sprzedawcy z tytułu rękojmi wobec Przedsiębiorcy zostaje wyłączona.',
        },
        {
          text: 'Niezależnie od wyłączenia rękojmi Sprzedawca przyjmuje i rozpatruje zgłoszenia wad jakościowych Przedsiębiorców w terminie 14 dni, dążąc do polubownego rozwiązania sprawy przez naprawę, wymianę albo obniżenie ceny.',
        },
        {
          text: 'Zgłoszenia braków ilościowych oraz uszkodzeń transportowych podlegają terminowi określonemu w §11 ust. 6.',
        },
        {
          text: 'Odpowiedzialność Sprzedawcy wobec Przedsiębiorcy z tytułu niewykonania lub nienależytego wykonania Umowy ograniczona jest do wartości brutto Zamówienia, którego dotyczy roszczenie. Sprzedawca nie odpowiada wobec Przedsiębiorcy za utracone korzyści ani za szkody pośrednie, w tym za skutki niedotrzymania terminu wydarzenia, na potrzeby którego Zamówienie zostało złożone.',
        },
        {
          text: 'Ograniczenia te nie mają zastosowania w przypadku szkody wyrządzonej umyślnie.',
        },
      ],
    },
    {
      id: 'spory',
      heading: '§15. Pozasądowe sposoby rozpatrywania reklamacji (Konsument)',
      clauses: [
        {
          text: 'Konsument ma możliwość skorzystania z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w szczególności:',
          points: [
            'zwrócenia się do stałego polubownego sądu konsumenckiego działającego przy wojewódzkim inspektoracie Inspekcji Handlowej z wnioskiem o rozstrzygnięcie sporu,',
            'zwrócenia się do wojewódzkiego inspektora Inspekcji Handlowej z wnioskiem o wszczęcie postępowania mediacyjnego,',
            'skorzystania z bezpłatnej pomocy powiatowego (miejskiego) rzecznika konsumentów albo organizacji społecznej, do której zadań statutowych należy ochrona konsumentów.',
          ],
        },
        {
          text: 'Informacje o zasadach dostępu do tych procedur dostępne są w siedzibach oraz na stronach internetowych powiatowych (miejskich) rzeczników konsumentów, wojewódzkich inspektoratów Inspekcji Handlowej oraz Urzędu Ochrony Konkurencji i Konsumentów, w tym pod adresem polubowne.uokik.gov.pl.',
        },
        {
          text: 'Skorzystanie z pozasądowych sposobów rozpatrywania reklamacji jest dobrowolne i wymaga zgody obu stron sporu. Sprzedawca nie zobowiązuje się z góry do korzystania z tych procedur ani nie jest do tego zobowiązany na podstawie odrębnych przepisów; każdy wniosek Konsumenta rozpatruje indywidualnie.',
        },
        {
          text: 'Europejska platforma internetowego rozstrzygania sporów (ODR) zakończyła działalność 20 lipca 2025 r. i nie jest już dostępna jako droga rozstrzygania sporów konsumenckich.',
        },
      ],
    },
    {
      id: 'wlasnosc-intelektualna',
      heading: '§16. Prawa własności intelektualnej',
      clauses: [
        {
          text: 'Wszelkie treści zamieszczone w Sklepie — w szczególności teksty, zdjęcia Produktów, wizualizacje, materiały blogowe, logotyp i układ graficzny — stanowią przedmiot praw wyłącznych Sprzedawcy albo są wykorzystywane na podstawie stosownych uprawnień.',
        },
        {
          text: 'Korzystanie z tych treści w zakresie wykraczającym poza dozwolony użytek osobisty, w szczególności ich zwielokrotnianie i rozpowszechnianie w celach komercyjnych, wymaga uprzedniej zgody Sprzedawcy wyrażonej na piśmie lub w wiadomości e-mail.',
        },
        {
          text: 'Prawa do materiałów przekazanych przez Klienta pozostają przy Kliencie; zakres uprawnień Sprzedawcy do tych materiałów określa §7 ust. 4.',
        },
      ],
    },
    {
      id: 'dane-osobowe',
      heading: '§17. Ochrona danych osobowych',
      clauses: [
        {
          text: 'Administratorem danych osobowych Klientów jest Sprzedawca. Cele i podstawy prawne przetwarzania, okresy przechowywania, kategorie odbiorców oraz prawa osób, których dane dotyczą, opisuje Polityka Prywatności dostępna w Sklepie.',
        },
        {
          text: 'Jeżeli Zamówienie obejmuje Personalizację, a Klient przekazuje Sprzedawcy dane osobowe osób trzecich — na przykład listę adresatów korespondencji — Klient pozostaje administratorem tych danych, a Sprzedawca przetwarza je wyłącznie jako podmiot przetwarzający, na udokumentowane polecenie Klienta.',
        },
        {
          text: 'Warunki takiego powierzenia określa Załącznik nr 2 do Regulaminu, stanowiący umowę powierzenia przetwarzania danych osobowych w rozumieniu art. 28 ust. 3 RODO. Umowa ta zostaje zawarta z chwilą złożenia Zamówienia obejmującego Personalizację.',
        },
        {
          text: 'Zasady korzystania z plików cookies i podobnych technologii opisuje odrębny dokument — Polityka Cookies.',
        },
      ],
    },
    {
      id: 'zmiany-regulaminu',
      heading: '§18. Zmiany Regulaminu',
      clauses: [
        {
          text: 'Sprzedawca zastrzega sobie prawo zmiany Regulaminu z ważnych przyczyn, w szczególności zmiany przepisów prawa, zmiany zakresu lub sposobu świadczenia usług, zmiany metod płatności lub dostawy albo zmian technicznych w Sklepie.',
        },
        {
          text: 'Klientów posiadających Konto Sprzedawca informuje o zmianie Regulaminu pocztą elektroniczną co najmniej 14 dni przed jej wejściem w życie. Klient, który nie akceptuje zmiany, może w tym terminie wypowiedzieć umowę o prowadzenie Konta ze skutkiem natychmiastowym.',
        },
        {
          text: 'Do Zamówień złożonych przed wejściem zmiany w życie stosuje się Regulamin w brzmieniu obowiązującym w chwili złożenia Zamówienia.',
        },
      ],
    },
    {
      id: 'postanowienia-koncowe',
      heading: '§19. Postanowienia końcowe',
      clauses: [
        {
          text: 'Umowy zawierane za pośrednictwem Sklepu zawierane są w języku polskim.',
        },
        {
          text: 'W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego, ustawy o prawach konsumenta oraz ustawy o świadczeniu usług drogą elektroniczną.',
        },
        {
          text: 'Sądem właściwym do rozstrzygania sporów ze Sprzedawcą jest — w przypadku Przedsiębiorcy — sąd właściwy miejscowo dla siedziby Sprzedawcy. Spory z udziałem Konsumenta i PNPK rozstrzyga sąd właściwy według zasad ogólnych.',
        },
        {
          text: 'Jeżeli którekolwiek postanowienie Regulaminu okaże się nieważne lub bezskuteczne, pozostałe postanowienia zachowują moc. Postanowienie nieważne zastępuje się postanowieniem najbliższym jego celowi gospodarczemu i zgodnym z prawem.',
        },
        {
          text: 'Żadne postanowienie Regulaminu nie ogranicza uprawnień Konsumenta ani PNPK wynikających z bezwzględnie obowiązujących przepisów prawa. W razie sprzeczności pierwszeństwo mają przepisy prawa.',
        },
        {
          text: `Regulamin obowiązuje od dnia ${UPDATED.split('-').reverse().join('.')}.`,
        },
      ],
    },

    /* ── Załączniki ─────────────────────────────────────────── */

    {
      id: 'zalacznik-odstapienie',
      heading: 'Załącznik nr 1 — Wzór formularza odstąpienia od umowy',
      annex: true,
      paragraphs: [
        'Formularz należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy. Skorzystanie z niego jest dobrowolne — oświadczenie o odstąpieniu można złożyć w dowolnej innej formie.',
        `Adresat: ${CONTACT_DETAILS.company}, ${CONTACT_DETAILS.returnAddress}, e-mail: ${CONTACT_DETAILS.email}`,
      ],
      list: [
        'Ja/My (*) niniejszym informuję/informujemy (*) o moim/naszym (*) odstąpieniu od umowy sprzedaży następujących towarów: ……………………………………………………………',
        'Numer zamówienia (ENV-RRRRMMDD-XXXX): ……………………………………………………',
        'Data zawarcia umowy (*) / odbioru (*): ………………………………………………………',
        'Imię i nazwisko konsumenta(-ów): …………………………………………………………………',
        'Adres konsumenta(-ów): ………………………………………………………………………………',
        'Numer rachunku bankowego do zwrotu płatności: ………………………………………………',
        'Podpis konsumenta(-ów) — tylko jeżeli formularz jest przesyłany w wersji papierowej: ………………………',
        'Data: ………………………………',
      ],
      note: '(*) Niepotrzebne skreślić. Formularz do pobrania w formacie PDF znajduje się pod przyciskiem na tej stronie.',
    },
    {
      id: 'zalacznik-powierzenie',
      heading: 'Załącznik nr 2 — Warunki powierzenia przetwarzania danych osobowych',
      annex: true,
      paragraphs: [
        'Niniejszy załącznik stanowi umowę powierzenia przetwarzania danych osobowych w rozumieniu art. 28 ust. 3 rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO). Ma zastosowanie wyłącznie do Zamówień obejmujących Personalizację, w ramach których Klient przekazuje Sprzedawcy dane osobowe osób trzecich.',
      ],
      clauses: [
        {
          text: 'Strony. Administratorem powierzonych danych jest Klient. Podmiotem przetwarzającym jest Sprzedawca. Umowa zostaje zawarta z chwilą złożenia Zamówienia obejmującego Personalizację i obowiązuje przez czas jego realizacji oraz okres przechowywania Plików Klienta określony w §7 ust. 8 Regulaminu.',
        },
        {
          text: 'Przedmiot i cel. Sprzedawca przetwarza powierzone dane wyłącznie w celu wykonania Zamówienia — naniesienia wskazanych treści na koperty — oraz w celu przygotowania Wizualizacji do akceptacji Klienta.',
        },
        {
          text: 'Zakres. Powierzenie obejmuje dane zawarte w arkuszu adresowym lub w treści Personalizacji, w szczególności: imię i nazwisko, nazwę firmy, ulicę i numer, kod pocztowy, miejscowość oraz kraj. Kategorie osób, których dane dotyczą, określa Klient — są to zwykle adresaci jego korespondencji.',
        },
        {
          text: 'Charakter przetwarzania. Przetwarzanie obejmuje utrwalanie, przechowywanie, wykorzystanie w procesie druku oraz usuwanie danych. Sprzedawca nie prowadzi na powierzonych danych żadnych operacji analitycznych, nie tworzy z nich własnych baz i nie wykorzystuje ich do celów marketingowych.',
        },
        {
          text: 'Polecenia Administratora. Sprzedawca przetwarza powierzone dane wyłącznie na udokumentowane polecenie Klienta. Za takie polecenie uznaje się złożenie Zamówienia wraz z przekazaniem danych oraz późniejszą korespondencję dotyczącą tego Zamówienia. Sprzedawca niezwłocznie informuje Klienta, jeżeli w jego ocenie polecenie narusza przepisy o ochronie danych osobowych.',
        },
        {
          text: 'Poufność. Do przetwarzania powierzonych danych Sprzedawca dopuszcza wyłącznie osoby zobowiązane do zachowania poufności i posiadające stosowne upoważnienie.',
        },
        {
          text: 'Bezpieczeństwo. Sprzedawca stosuje środki techniczne i organizacyjne odpowiadające ryzyku, o których mowa w art. 32 RODO, w tym: szyfrowanie transmisji (HTTPS/TLS), przechowywanie plików w magazynie bez dostępu publicznego, dostęp do plików wyłącznie przez odnośniki podpisane o ograniczonym czasie ważności oraz ograniczenie kręgu osób mających dostęp do danych.',
        },
        {
          text: 'Dalsze powierzenie. Klient udziela Sprzedawcy ogólnej zgody na korzystanie z podwykonawców (podprocesorów) w zakresie niezbędnym do realizacji Zamówienia. Sprzedawca korzysta w szczególności z dostawców infrastruktury informatycznej — hostingu aplikacji, chmurowej bazy danych i magazynu plików — oraz z dostawcy usługi wysyłki wiadomości e-mail. Aktualną listę podprocesorów Sprzedawca udostępnia na żądanie Klienta. O zamierzonej zmianie podprocesora Sprzedawca informuje Klienta, który może wnieść sprzeciw; skuteczny sprzeciw uprawnia każdą ze stron do rozwiązania umowy powierzenia i anulowania Zamówienia w części dotkniętej sprzeciwem.',
        },
        {
          text: 'Sprzedawca zapewnia, że na podprocesorów nakładane są obowiązki ochrony danych nie mniejsze niż określone w niniejszym załączniku, i odpowiada wobec Klienta za ich działania jak za własne.',
        },
        {
          text: 'Pomoc Administratorowi. Sprzedawca — w miarę możliwości i z uwzględnieniem charakteru przetwarzania — pomaga Klientowi w realizacji żądań osób, których dane dotyczą, oraz w wypełnieniu obowiązków wynikających z art. 32–36 RODO. Jeżeli osoba, której dane dotyczą, zwróci się bezpośrednio do Sprzedawcy, Sprzedawca przekaże to żądanie Klientowi i nie podejmie samodzielnych działań.',
        },
        {
          text: 'Naruszenia. O stwierdzonym naruszeniu ochrony powierzonych danych Sprzedawca informuje Klienta bez zbędnej zwłoki, nie później niż w ciągu 24 godzin od jego stwierdzenia, przekazując informacje niezbędne do wypełnienia przez Klienta obowiązku zgłoszenia naruszenia organowi nadzorczemu.',
        },
        {
          text: 'Zakończenie przetwarzania. Po upływie okresu przechowywania Plików Klienta Sprzedawca usuwa powierzone dane wraz z ich kopiami, chyba że obowiązek dalszego przechowywania wynika z przepisów prawa. Na wcześniejsze żądanie Klienta Sprzedawca usuwa powierzone dane niezwłocznie.',
        },
        {
          text: 'Kontrola. Sprzedawca udostępnia Klientowi na jego żądanie informacje niezbędne do wykazania spełnienia obowiązków określonych w art. 28 RODO oraz umożliwia przeprowadzenie audytu, w tym inspekcji, po uprzednim uzgodnieniu terminu z wyprzedzeniem co najmniej 14 dni i w sposób nieutrudniający bieżącej działalności. Koszty audytu ponosi Klient, chyba że audyt wykaże naruszenie po stronie Sprzedawcy.',
        },
        {
          text: 'Odpowiedzialność. Klient oświadcza, że dysponuje podstawą prawną do przetwarzania powierzanych danych i do ich powierzenia Sprzedawcy oraz że zrealizował wobec osób, których dane dotyczą, ciążące na nim obowiązki informacyjne.',
        },
      ],
    },
  ],
};

/* ── Polityka Prywatności ───────────────────────────────────── */

export const PRIVACY: LegalDocument = {
  title: 'Polityka Prywatności',
  description:
    'Zasady przetwarzania danych osobowych w sklepie envelopes.pl: administrator, cele i podstawy prawne, okresy przechowywania, odbiorcy danych i prawa osób, których dane dotyczą.',
  updated: UPDATED,
  intro:
    'Dokument opisuje, jakie dane osobowe zbieramy w związku z prowadzeniem sklepu envelopes.pl, w jakim celu i na jakiej podstawie je przetwarzamy, komu je przekazujemy, jak długo je przechowujemy oraz jakie prawa przysługują osobom, których dane dotyczą.',
  sections: [
    {
      id: 'administrator',
      heading: '1. Administrator danych',
      clauses: [
        {
          text: `Administratorem danych osobowych jest ${SELLER_FULL} — prowadzący sklep internetowy pod adresem envelopes.pl.`,
        },
        {
          text: `We wszystkich sprawach dotyczących ochrony danych osobowych prosimy o kontakt na adres ${CONTACT_DETAILS.email} albo korespondencyjnie na adres ${CONTACT_DETAILS.address}.`,
        },
        {
          text: 'Administrator nie powołał inspektora ochrony danych — nie zachodzi żadna z przesłanek wymienionych w art. 37 RODO. Wszystkie zgłoszenia rozpatruje bezpośrednio Administrator, pod adresem wskazanym powyżej.',
        },
      ],
    },
    {
      id: 'cele',
      heading: '2. Cele i podstawy prawne przetwarzania',
      table: {
        headers: ['Cel przetwarzania', 'Podstawa prawna', 'Okres przechowywania'],
        rows: [
          [
            'Zawarcie i wykonanie umowy sprzedaży: realizacja zamówienia, przygotowanie wizualizacji, kontakt w sprawie zamówienia, dostawa',
            'art. 6 ust. 1 lit. b RODO — niezbędność do wykonania umowy',
            'Czas realizacji zamówienia, następnie okres przedawnienia roszczeń',
          ],
          [
            'Prowadzenie konta klienta',
            'art. 6 ust. 1 lit. b RODO — niezbędność do wykonania umowy o prowadzenie konta',
            'Do usunięcia konta',
          ],
          [
            'Wystawianie i przechowywanie faktur oraz innych dokumentów księgowych',
            'art. 6 ust. 1 lit. c RODO — obowiązek prawny (przepisy podatkowe i o rachunkowości)',
            '5 lat od końca roku kalendarzowego, w którym upłynął termin płatności podatku',
          ],
          [
            'Rozpatrywanie reklamacji i odstąpień od umowy',
            'art. 6 ust. 1 lit. c RODO — obowiązek prawny',
            'Do zakończenia postępowania, następnie okres przedawnienia roszczeń',
          ],
          [
            'Obsługa zapytań kierowanych przez formularz kontaktowy i pocztą elektroniczną',
            'art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes polegający na udzieleniu odpowiedzi',
            '12 miesięcy od zakończenia korespondencji',
          ],
          [
            'Ustalenie, dochodzenie i obrona przed roszczeniami; zapewnienie bezpieczeństwa serwisu',
            'art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes',
            'Do upływu okresu przedawnienia roszczeń, maksymalnie 6 lat',
          ],
          [
            'Statystyka i pomiar ruchu w serwisie (jeżeli takie narzędzia zostaną uruchomione)',
            'art. 6 ust. 1 lit. a RODO — zgoda wyrażona w banerze cookies',
            'Do wycofania zgody',
          ],
        ],
      },
      note: 'Podanie danych jest dobrowolne, ale niezbędne do zawarcia i wykonania umowy — bez nich nie jest możliwe złożenie zamówienia, wystawienie faktury ani dostarczenie przesyłki.',
    },
    {
      id: 'zakres',
      heading: '3. Zakres przetwarzanych danych',
      clauses: [
        {
          text: 'W związku ze złożeniem zamówienia przetwarzamy: imię i nazwisko, nazwę firmy, numer NIP (jeżeli został podany), adres do faktury, adres dostawy (jeżeli jest inny), adres e-mail, numer telefonu oraz dane o zamówieniu i płatności.',
        },
        {
          text: 'W związku z prowadzeniem konta przetwarzamy: adres e-mail, hasło w postaci zaszyfrowanej, typ konta, dane kontaktowe i rozliczeniowe, zapisane adresy i konfiguracje oraz historię zamówień.',
        },
        {
          text: 'W związku z nadrukiem i personalizacją przetwarzamy zawartość przekazanych plików graficznych oraz treści przeznaczone do naniesienia na koperty.',
        },
        {
          text: 'W związku z korzystaniem z serwisu przetwarzamy dane techniczne zapisywane w logach serwera: adres IP, datę i godzinę zapytania, typ przeglądarki i system operacyjny. Służą one wyłącznie zapewnieniu bezpieczeństwa i poprawnego działania serwisu.',
        },
        {
          text: 'Nie przetwarzamy szczególnych kategorii danych osobowych (tzw. danych wrażliwych) i prosimy o nieprzekazywanie ich w treści zamówień ani w korespondencji.',
        },
      ],
    },
    {
      id: 'dane-osob-trzecich',
      heading: '4. Dane osób trzecich przekazywane do personalizacji',
      clauses: [
        {
          text: 'Jeżeli zamówienie obejmuje personalizację, klient przekazuje nam dane osobowe osób trzecich — najczęściej listę adresatów korespondencji w arkuszu XLSX albo treść wpisaną w konfiguratorze.',
        },
        {
          text: 'W odniesieniu do tych danych administratorem pozostaje klient, a my występujemy wyłącznie jako podmiot przetwarzający i działamy na jego udokumentowane polecenie. Nie wykorzystujemy tych danych do żadnych własnych celów.',
        },
        {
          text: 'Warunki powierzenia — w tym zasady bezpieczeństwa, korzystania z podprocesorów, zgłaszania naruszeń i usuwania danych — określa Załącznik nr 2 do Regulaminu, zawierany z chwilą złożenia zamówienia z personalizacją.',
        },
        {
          text: 'Dane adresowe przekazane do personalizacji przechowujemy przez 12 miesięcy od realizacji zamówienia — dla obsługi reklamacji i zamówień powtarzalnych — po czym je usuwamy. Na wcześniejsze żądanie klienta usuwamy je niezwłocznie.',
        },
      ],
    },
    {
      id: 'odbiorcy',
      heading: '5. Odbiorcy danych',
      paragraphs: [
        'Dane osobowe przekazujemy wyłącznie podmiotom, których udział jest niezbędny do prowadzenia sklepu i wykonania umowy. Są to:',
      ],
      list: [
        'operator płatności — PayPro S.A. (Przelewy24), w zakresie danych niezbędnych do rozliczenia transakcji;',
        'firma kurierska realizująca dostawę — w zakresie danych adresowych i kontaktowych potrzebnych do doręczenia przesyłki;',
        'dostawcy infrastruktury informatycznej — hosting aplikacji, chmurowa baza danych oraz magazyn plików, w których przechowywane są zamówienia i pliki klientów;',
        'dostawca usługi wysyłki wiadomości e-mail — w zakresie adresu e-mail i treści wiadomości transakcyjnych;',
        'dostawca systemu do wystawiania faktur oraz biuro rachunkowe — w zakresie danych niezbędnych do wystawienia i zaksięgowania dokumentów sprzedaży;',
        'doradcy prawni i firmy windykacyjne — wyłącznie w razie sporu lub dochodzenia należności;',
        'organy publiczne — wyłącznie gdy obowiązek przekazania danych wynika z przepisów prawa.',
      ],
      note: 'Z każdym z podmiotów przetwarzających dane na nasze zlecenie mamy zawartą umowę powierzenia przetwarzania danych osobowych. Aktualną listę tych podmiotów udostępniamy na żądanie.',
    },
    {
      id: 'panstwa-trzecie',
      heading: '6. Przekazywanie danych poza Europejski Obszar Gospodarczy',
      clauses: [
        {
          text: 'Część dostawców infrastruktury informatycznej, z których korzystamy, to podmioty o zasięgu globalnym. W związku z tym dane mogą być przekazywane do państw spoza Europejskiego Obszaru Gospodarczego, w szczególności do Stanów Zjednoczonych.',
        },
        {
          text: 'Przekazanie następuje wyłącznie przy zastosowaniu zabezpieczeń wymaganych przez rozdział V RODO: na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (Data Privacy Framework) albo standardowych klauzul umownych zatwierdzonych przez Komisję Europejską.',
        },
        {
          text: `Kopię zastosowanych zabezpieczeń można uzyskać, pisząc na adres ${CONTACT_DETAILS.email}.`,
        },
      ],
    },
    {
      id: 'prawa',
      heading: '7. Prawa osób, których dane dotyczą',
      paragraphs: ['Każdej osobie, której dane przetwarzamy, przysługuje prawo do:'],
      list: [
        'dostępu do swoich danych oraz otrzymania ich kopii;',
        'sprostowania danych nieprawidłowych lub uzupełnienia niekompletnych;',
        'usunięcia danych („prawo do bycia zapomnianym”) — z zastrzeżeniem danych, które musimy zachować na podstawie przepisów podatkowych i rachunkowych albo dla obrony przed roszczeniami;',
        'ograniczenia przetwarzania;',
        'przenoszenia danych przetwarzanych na podstawie umowy lub zgody — w ustrukturyzowanym, powszechnie używanym formacie nadającym się do odczytu maszynowego;',
        'wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie — z przyczyn związanych ze szczególną sytuacją osoby, której dane dotyczą;',
        'cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem;',
        'wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.',
      ],
      note: `Zgłoszenia realizujemy pod adresem ${CONTACT_DETAILS.email}. Odpowiadamy bez zbędnej zwłoki, nie później niż w terminie miesiąca od otrzymania żądania.`,
    },
    {
      id: 'automatyzacja',
      heading: '8. Zautomatyzowane podejmowanie decyzji i profilowanie',
      clauses: [
        {
          text: 'Nie podejmujemy wobec Państwa decyzji opierających się wyłącznie na zautomatyzowanym przetwarzaniu, w tym profilowaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie na Państwa wpływały.',
        },
        {
          text: 'Automatyczna weryfikacja arkusza personalizacji sprawdza wyłącznie kompletność wierszy i ich zgodność z zamówioną ilością kopert. Nie jest to profilowanie i nie prowadzi do żadnej oceny osób, których dane dotyczą.',
        },
      ],
    },
    {
      id: 'bezpieczenstwo',
      heading: '9. Bezpieczeństwo danych',
      list: [
        'Cała komunikacja z serwisem odbywa się z wykorzystaniem szyfrowanego połączenia HTTPS/TLS.',
        'Hasła do kont przechowywane są wyłącznie w postaci zaszyfrowanej — nie mamy do nich wglądu.',
        'Pliki przekazane przez klientów nie są publicznie dostępne; udostępniamy je wyłącznie przez odnośniki podpisane, o ograniczonym czasie ważności.',
        'Dostęp do danych zamówień mają wyłącznie osoby upoważnione, w zakresie niezbędnym do obsługi zamówienia.',
        'Ceny i wartości zamówień przeliczane są po stronie serwera, co uniemożliwia ich modyfikację z poziomu przeglądarki.',
      ],
    },
    {
      id: 'cookies-odeslanie',
      heading: '10. Pliki cookies i zmiany Polityki',
      clauses: [
        {
          text: 'Zasady korzystania z plików cookies i podobnych technologii, ich kategorie oraz sposób zarządzania zgodami opisuje odrębny dokument — Polityka Cookies.',
        },
        {
          text: 'Politykę Prywatności aktualizujemy w razie zmian w sposobie przetwarzania danych, zmian technicznych w serwisie albo zmian przepisów prawa. Aktualna wersja jest zawsze dostępna pod tym adresem, wraz z datą ostatniej aktualizacji.',
        },
      ],
    },
  ],
};

/* ── Polityka Cookies ───────────────────────────────────────── */

export const COOKIES: LegalDocument = {
  title: 'Polityka Cookies',
  description:
    'Pliki cookies i podobne technologie w serwisie envelopes.pl: co faktycznie zapisujemy w przeglądarce, w jakim celu, na jak długo i jak zarządzać zgodami.',
  updated: UPDATED,
  intro:
    'Dokument opisuje, co serwis envelopes.pl zapisuje w przeglądarce użytkownika. Opisuje stan faktyczny: dziś korzystamy wyłącznie z technologii niezbędnych do działania sklepu i nie uruchamiamy żadnych narzędzi analitycznych ani marketingowych.',
  sections: [
    {
      id: 'czym-sa',
      heading: '1. Czym są cookies i podobne technologie',
      clauses: [
        {
          text: 'Pliki cookies to niewielkie pliki tekstowe zapisywane przez przeglądarkę na urządzeniu użytkownika i odsyłane przy kolejnych zapytaniach do serwera.',
        },
        {
          text: 'Podobne technologie — pamięć lokalna przeglądarki (localStorage), pamięć sesji (sessionStorage) oraz baza IndexedDB — również przechowują dane na urządzeniu użytkownika, ale nie są automatycznie wysyłane do serwera. Przepisy o ochronie prywatności traktują je tak samo jak cookies, dlatego opisujemy je w tym dokumencie na równi.',
        },
      ],
    },
    {
      id: 'stan-faktyczny',
      heading: '2. Co serwis zapisuje na Państwa urządzeniu',
      clauses: [
        {
          text: 'Serwis envelopes.pl nie zapisuje własnych plików cookies. Wszystkie dane niezbędne do działania sklepu — zawartość koszyka, wybrany tryb realizacji, decyzja o zgodach i informacja o zalogowaniu — przechowywane są w pamięci lokalnej przeglądarki.',
        },
        {
          text: 'Nie korzystamy z Google Analytics, Meta Pixel, Google Ads ani z żadnego innego narzędzia analitycznego lub reklamowego. Nie osadzamy skryptów śledzących podmiotów trzecich i nie przekazujemy nikomu danych o Państwa zachowaniu w serwisie.',
        },
        {
          text: 'Kroje pisma używane w serwisie są pobierane z naszego serwera, a nie z serwerów zewnętrznych — samo otwarcie strony nie powoduje więc połączenia z dostawcą czcionek.',
        },
        {
          text: 'Uwierzytelnianie kont obsługuje dostawca usługi logowania, który zapisuje informację o zalogowanej sesji w pamięci przeglądarki. Jest to element niezbędny do działania logowania.',
        },
      ],
    },
    {
      id: 'wykaz',
      heading: '3. Wykaz zapisywanych danych',
      table: {
        headers: ['Nazwa', 'Rodzaj', 'Kategoria', 'Cel', 'Czas przechowywania'],
        rows: [
          [
            'envelopes.cart',
            'localStorage',
            'Niezbędne',
            'Zawartość koszyka między wizytami',
            'Do wyczyszczenia koszyka lub danych przeglądarki',
          ],
          [
            'envelopes.shippingSpeed',
            'localStorage',
            'Niezbędne',
            'Wybrany tryb realizacji zamówienia',
            'Do wyczyszczenia danych przeglądarki',
          ],
          [
            'envelopes.cookieConsent',
            'localStorage',
            'Niezbędne',
            'Zapis decyzji o zgodach wraz z datą jej podjęcia',
            '12 miesięcy — po tym czasie pytamy ponownie',
          ],
          [
            'envelopes.editConfig',
            'sessionStorage',
            'Niezbędne',
            'Przekazanie konfiguracji do edycji między koszykiem a konfiguratorem',
            'Do zamknięcia karty przeglądarki',
          ],
          [
            'envelopes.devSession',
            'localStorage',
            'Niezbędne',
            'Sesja użytkownika w środowisku testowym sklepu',
            'Do wylogowania',
          ],
          [
            'firebase:authUser:*',
            'localStorage / IndexedDB',
            'Niezbędne',
            'Sesja zalogowanego użytkownika utrzymywana przez dostawcę usługi logowania',
            'Do wylogowania',
          ],
        ],
      },
      note: 'Wykaz odzwierciedla stan na dzień ostatniej aktualizacji dokumentu. Jeżeli uruchomimy narzędzia analityczne lub marketingowe, uzupełnimy tabelę o ich nazwy, cele i czasy przechowywania, zanim zaczną działać.',
    },
    {
      id: 'kategorie',
      heading: '4. Kategorie i podstawa prawna',
      clauses: [
        {
          text: 'Niezbędne — utrzymanie sesji, zawartość koszyka, zapis decyzji o zgodach, bezpieczeństwo formularzy. Bez nich sklep nie działa, dlatego nie można ich wyłączyć. Podstawą ich stosowania jest niezbędność do świadczenia usługi żądanej przez użytkownika, co nie wymaga zgody.',
        },
        {
          text: 'Funkcjonalne — zapamiętanie preferencji użytkownika wykraczających poza podstawowe działanie sklepu. Obecnie nie stosujemy żadnych technologii tej kategorii.',
        },
        {
          text: 'Analityczne — statystyki ruchu pozwalające poprawiać ścieżkę zakupową. Obecnie nie stosujemy żadnych narzędzi tej kategorii. Ich uruchomienie nastąpi wyłącznie po uzyskaniu Państwa zgody.',
        },
        {
          text: 'Marketingowe — pomiar skuteczności kampanii i dopasowanie komunikatów reklamowych. Obecnie nie stosujemy żadnych narzędzi tej kategorii. Ich uruchomienie nastąpi wyłącznie po uzyskaniu Państwa zgody.',
        },
      ],
    },
    {
      id: 'zarzadzanie',
      heading: '5. Zarządzanie zgodami',
      clauses: [
        {
          text: 'Przy pierwszej wizycie wyświetlamy baner z trzema równorzędnymi możliwościami: „Akceptuj wszystkie”, „Odrzuć niekonieczne” oraz „Ustawienia”, gdzie można włączyć poszczególne kategorie osobno. Do momentu dokonania wyboru nie uruchamiamy niczego poza technologiami niezbędnymi.',
        },
        {
          text: 'Zgodę można zmienić lub wycofać w każdej chwili linkiem „Zarządzaj cookies” w stopce serwisu. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.',
        },
        {
          text: 'Zapis decyzji o zgodach zachowuje ważność przez 12 miesięcy. Po tym czasie baner pojawia się ponownie, aby umożliwić potwierdzenie lub zmianę wyboru.',
        },
        {
          text: 'Dane zapisane na urządzeniu można w każdej chwili usunąć samodzielnie — z poziomu ustawień przeglądarki („wyczyść dane przeglądania” lub „dane witryn”). Usunięcie danych niezbędnych spowoduje utratę zawartości koszyka i wylogowanie z konta.',
        },
        {
          text: 'Przeglądarki pozwalają również z góry blokować pliki cookies i pamięć lokalną. Zablokowanie technologii niezbędnych uniemożliwi korzystanie z koszyka i złożenie zamówienia.',
        },
      ],
    },
    {
      id: 'dane-osobowe-cookies',
      heading: '6. Cookies a dane osobowe',
      clauses: [
        {
          text: 'Dane zapisywane obecnie w przeglądarce dotyczą wyłącznie stanu sklepu (koszyk, preferencje, sesja) i nie służą identyfikacji użytkownika w celach analitycznych ani reklamowych.',
        },
        {
          text: 'Jeżeli w przyszłości informacje z technologii wymagających zgody będą stanowić dane osobowe, ich przetwarzanie będzie odbywać się na zasadach opisanych w Polityce Prywatności, na podstawie art. 6 ust. 1 lit. a RODO.',
        },
        {
          text: `Pytania dotyczące niniejszego dokumentu prosimy kierować na adres ${CONTACT_DETAILS.email}.`,
        },
      ],
    },
  ],
};

/** Skrót danych Sprzedawcy — używany m.in. w nagłówku dokumentów PDF. */
export const LEGAL_SELLER_LINE = SELLER;
