/**
 * Treści dokumentów prawnych. Jedno źródło dla stron serwisu oraz dla
 * wersji PDF regulaminu (pkt 6.4–6.6).
 *
 * Dokumenty mają charakter wzorcowy — przed uruchomieniem sprzedaży powinny
 * zostać zweryfikowane przez radcę prawnego i uzupełnione o dane rejestrowe.
 */

export interface LegalSection {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS: LegalDocument = {
  title: 'Regulamin sklepu Envelopes',
  description:
    'Regulamin sprzedaży kopert ozdobnych Envelopes: zawieranie umów, ceny i płatności, realizacja zamówień, reklamacje i odstąpienie od umowy.',
  updated: '2026-07-01',
  intro:
    'Regulamin określa zasady sprzedaży kopert ozdobnych, w tym kopert z nadrukiem i adresowaniem, prowadzonej za pośrednictwem serwisu envelopes.pl.',
  sections: [
    {
      id: 'postanowienia-ogolne',
      heading: '§1. Postanowienia ogólne',
      paragraphs: [
        'Sprzedawcą jest Envelopes sp. z o.o. z siedzibą w Warszawie, ul. Przykładowa 12, 00-001 Warszawa, wpisana do rejestru przedsiębiorców Krajowego Rejestru Sądowego pod numerem 0000000000, NIP 000-000-00-00, REGON 000000000.',
        'Kontakt ze Sprzedawcą jest możliwy pod adresem kontakt@envelopes.pl oraz numerem telefonu +48 22 000 00 00, w godzinach pracy Biura Obsługi Klienta: od poniedziałku do piątku, 8:00–16:00.',
        'Regulamin jest udostępniany nieodpłatnie w postaci umożliwiającej jego pobranie, utrwalenie i wydrukowanie.',
      ],
    },
    {
      id: 'definicje',
      heading: '§2. Definicje',
      list: [
        'Klient — osoba fizyczna, osoba prawna albo jednostka organizacyjna składająca zamówienie w Sklepie.',
        'Konsument — Klient będący osobą fizyczną dokonującą czynności prawnej niezwiązanej bezpośrednio z jej działalnością gospodarczą lub zawodową.',
        'Produkt — koperta ozdobna w formacie DL, C6 lub K4, w jednym z 19 kolorów, opcjonalnie z nadrukiem lub adresowaniem.',
        'Konfigurator — narzędzie w Sklepie służące do ustalenia parametrów Produktu i ceny zamówienia.',
        'Wizualizacja — projekt graficzny nadruku lub adresowania przygotowany przez Sprzedawcę i przesyłany Klientowi do akceptacji.',
        'MOQ — minimalna ilość zamówienia: 10 sztuk dla kopert z nadrukiem, 1 sztuka dla kopert bez nadruku.',
      ],
    },
    {
      id: 'zawieranie-umow',
      heading: '§3. Warunki zawierania umów',
      paragraphs: [
        'Umowa sprzedaży zostaje zawarta z chwilą złożenia zamówienia przyciskiem oznaczonym „Zamawiam i płacę”, co stanowi potwierdzenie obowiązku zapłaty.',
        'Każdemu zamówieniu nadawany jest unikalny numer w formacie ENV-RRRRMMDD-XXXX, widoczny na potwierdzeniu, w panelu Klienta i na dokumencie sprzedaży.',
        'Zamówienia można składać jako Klient zalogowany lub jako gość. Konto można założyć również w trakcie składania zamówienia, na podstawie danych już wprowadzonych w formularzu.',
      ],
    },
    {
      id: 'ceny-platnosci',
      heading: '§4. Ceny i płatności',
      paragraphs: [
        'Wszystkie ceny podane w Sklepie są cenami brutto wyrażonymi w złotych polskich i zawierają podatek VAT w stawce 23%.',
        'Cena jednostkowa Produktu zależy wyłącznie od formatu koperty i jest identyczna dla wszystkich dostępnych kolorów. Sprzedawca nie stosuje rabatów ilościowych — cena jednostkowa nie zmienia się wraz z wielkością zamówienia.',
        'Do ceny Produktu doliczane są opłaty za nadruk, adresowanie oraz realizację ekspresową, zgodnie z cennikiem prezentowanym w Konfiguratorze, a także koszt dostawy, widoczny w podsumowaniu koszyka niezależnie od wartości zamówienia.',
      ],
      list: [
        'Przelewy24 — karta płatnicza oraz szybki przelew, potwierdzenie natychmiastowe.',
        'BLIK — potwierdzenie natychmiastowe.',
        'Przelew tradycyjny — na podstawie faktury proforma; realizacja rozpoczyna się po zaksięgowaniu wpłaty.',
        'Faktura z odroczonym terminem płatności — 14 dni od daty wystawienia; przeznaczona dla instytucji, jednostek budżetowych i firm rozliczających zakupy po dostawie. Realizacja zamówienia rozpoczyna się bez oczekiwania na wpłatę.',
      ],
    },
    {
      id: 'realizacja',
      heading: '§5. Realizacja zamówień',
      paragraphs: [
        'Termin realizacji wynosi 5 dni roboczych dla realizacji standardowej oraz 2 dni robocze dla realizacji ekspresowej. Termin biegnie od zaksięgowania wpłaty, a w przypadku faktury z odroczonym terminem — od przyjęcia zamówienia.',
        'W zamówieniach obejmujących nadruk lub adresowanie termin realizacji biegnie od akceptacji Wizualizacji przez Klienta. Sprzedawca przygotowuje Wizualizację niezależnie od statusu płatności i przesyła ją na adres e-mail wskazany w zamówieniu.',
        'Klient może zaakceptować Wizualizację albo zgłosić uwagi. Zgłoszenie uwag skutkuje przygotowaniem kolejnej wersji projektu. Produkcja rozpoczyna się po łącznym spełnieniu dwóch warunków: potwierdzenia płatności (lub wyboru faktury z odroczonym terminem) oraz akceptacji Wizualizacji, jeżeli jest wymagana.',
        'Minimalna ilość zamówienia dla kopert z nadrukiem wynosi 10 sztuk. Koperty bez nadruku są dostępne od 1 sztuki.',
        'Pliki do nadruku przyjmowane są w formatach PDF, AI, EPS, CDR, PNG, JPG i SVG, o wielkości do 10 MB, maksymalnie trzy pliki na zamówienie. Sprzedawca nie odpowiada za wady Produktu wynikające z nieprawidłowo przygotowanych plików przekazanych przez Klienta.',
      ],
    },
    {
      id: 'dostawa',
      heading: '§6. Dostawa',
      paragraphs: [
        'Dostawa realizowana jest za pośrednictwem kuriera albo do wskazanego przez Klienta punktu InPost. Koszt dostawy prezentowany jest w podsumowaniu zamówienia przed jego złożeniem.',
        'Sprzedawca nie stosuje progu darmowej dostawy — koszt przesyłki naliczany jest do każdego zamówienia.',
      ],
    },
    {
      id: 'reklamacje',
      heading: '§7. Reklamacje',
      paragraphs: [
        'Reklamacje można składać na adres kontakt@envelopes.pl albo za pośrednictwem formularza kontaktowego, podając numer zamówienia oraz opis zastrzeżeń.',
        'Sprzedawca rozpatruje reklamację w terminie 14 dni od jej otrzymania i informuje Klienta o sposobie jej rozpatrzenia.',
        'W przypadku uznania reklamacji Sprzedawca wymienia Produkt na wolny od wad, obniża cenę albo zwraca zapłaconą kwotę — stosownie do żądania Klienta i charakteru wady.',
      ],
    },
    {
      id: 'odstapienie',
      heading: '§8. Odstąpienie od umowy',
      paragraphs: [
        'Konsument oraz przedsiębiorca na prawach konsumenta może odstąpić od umowy w terminie 14 dni od otrzymania Produktu, bez podawania przyczyny, składając stosowne oświadczenie.',
        'Prawo odstąpienia nie przysługuje w odniesieniu do umów, których przedmiotem jest rzecz nieprefabrykowana, wyprodukowana według specyfikacji Konsumenta lub służąca zaspokojeniu jego zindywidualizowanych potrzeb. Dotyczy to kopert z nadrukiem oraz kopert z adresowaniem, które są wykonywane na indywidualne zamówienie i nie podlegają zwrotowi.',
        'Koperty bez nadruku i bez adresowania podlegają prawu odstąpienia na zasadach ogólnych, pod warunkiem zwrotu w stanie nienaruszonym.',
      ],
    },
    {
      id: 'dane-osobowe',
      heading: '§9. Ochrona danych osobowych',
      paragraphs: [
        'Administratorem danych osobowych jest Sprzedawca. Zasady przetwarzania danych, podstawy prawne, okresy przechowywania i prawa osób, których dane dotyczą, opisuje Polityka Prywatności dostępna w Sklepie.',
      ],
    },
    {
      id: 'postanowienia-koncowe',
      heading: '§10. Postanowienia końcowe',
      paragraphs: [
        'W sprawach nieuregulowanych Regulaminem zastosowanie mają przepisy prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o prawach konsumenta.',
        'Sprzedawca zastrzega sobie prawo zmiany Regulaminu. Do zamówień złożonych przed wejściem zmiany w życie stosuje się Regulamin w brzmieniu obowiązującym w chwili złożenia zamówienia.',
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Polityka Prywatności',
  description:
    'Zasady przetwarzania danych osobowych w serwisie Envelopes: administrator, cele i podstawy prawne, okresy przechowywania, prawa użytkownika i odbiorcy danych.',
  updated: '2026-07-01',
  intro:
    'Dokument opisuje, jakie dane osobowe zbieramy w związku z prowadzeniem sklepu envelopes.pl, w jakim celu je przetwarzamy i jakie prawa przysługują osobom, których dane dotyczą.',
  sections: [
    {
      id: 'administrator',
      heading: 'Administrator danych',
      paragraphs: [
        'Administratorem danych osobowych jest Envelopes sp. z o.o. z siedzibą w Warszawie, ul. Przykładowa 12, 00-001 Warszawa.',
        'W sprawach dotyczących ochrony danych osobowych prosimy o kontakt: iod@envelopes.pl.',
      ],
    },
    {
      id: 'cele',
      heading: 'Cele i podstawy prawne przetwarzania',
      list: [
        'Realizacja zamówienia i umowy sprzedaży — art. 6 ust. 1 lit. b RODO (niezbędność do wykonania umowy).',
        'Wystawianie i przechowywanie dokumentów księgowych — art. 6 ust. 1 lit. c RODO (obowiązek prawny).',
        'Obsługa reklamacji i zapytań kierowanych przez formularz kontaktowy — art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes).',
        'Wysyłka newslettera i informacji handlowych — art. 6 ust. 1 lit. a RODO (zgoda), którą można wycofać w każdej chwili.',
        'Analiza ruchu w serwisie — art. 6 ust. 1 lit. a RODO (zgoda wyrażona w banerze cookies).',
      ],
    },
    {
      id: 'zakres',
      heading: 'Zakres przetwarzanych danych',
      paragraphs: [
        'W związku z zamówieniem przetwarzamy: imię i nazwisko lub nazwę firmy, adres, numer NIP (jeżeli został podany), adres e-mail, numer telefonu, dane adresowe dostawy oraz dane zawarte w plikach przekazanych do nadruku i adresowania.',
        'Dane adresowe przekazane w arkuszu personalizacji przetwarzamy wyłącznie w celu wykonania zamówienia i usuwamy je po upływie okresu reklamacyjnego, chyba że przepisy nakazują dłuższe przechowywanie.',
      ],
    },
    {
      id: 'okres',
      heading: 'Okres przechowywania',
      list: [
        'Dane zamówienia — przez okres przedawnienia roszczeń, nie krócej niż 5 lat od końca roku podatkowego (dokumenty księgowe).',
        'Dane konta użytkownika — do czasu usunięcia konta.',
        'Dane przetwarzane na podstawie zgody — do czasu jej wycofania.',
        'Pliki do nadruku i arkusze adresowe — 12 miesięcy od realizacji zamówienia, w celu obsługi zamówień powtarzalnych i reklamacji.',
      ],
    },
    {
      id: 'prawa',
      heading: 'Prawa użytkownika',
      list: [
        'Prawo dostępu do danych oraz otrzymania ich kopii.',
        'Prawo do sprostowania danych nieprawidłowych lub niekompletnych.',
        'Prawo do usunięcia danych („prawo do bycia zapomnianym”) — z zastrzeżeniem obowiązków wynikających z przepisów podatkowych.',
        'Prawo do ograniczenia przetwarzania.',
        'Prawo do przenoszenia danych.',
        'Prawo do sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.',
        'Prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.',
      ],
    },
    {
      id: 'odbiorcy',
      heading: 'Odbiorcy danych',
      list: [
        'Operator płatności — Przelewy24 (PayPro S.A.), w zakresie danych niezbędnych do realizacji płatności.',
        'Przewoźnicy — InPost oraz firmy kurierskie, w zakresie danych adresowych przesyłki.',
        'Dostawca infrastruktury — Vercel Inc. (hosting aplikacji) oraz Google Ireland Ltd. (Firebase: uwierzytelnianie, baza danych, magazyn plików).',
        'Dostawca usługi e-mail — Brevo (Sendinblue SAS), w zakresie wysyłki wiadomości transakcyjnych i newslettera.',
      ],
    },
    {
      id: 'cookies-odeslanie',
      heading: 'Pliki cookies',
      paragraphs: [
        'Zasady korzystania z plików cookies, ich kategorie oraz sposób zarządzania zgodami opisuje odrębny dokument — Polityka Cookies.',
      ],
    },
  ],
};

export const COOKIES: LegalDocument = {
  title: 'Pliki Cookies',
  description:
    'Kategorie plików cookies używanych w serwisie Envelopes, cele ich stosowania, czas przechowywania oraz sposób zarządzania zgodami.',
  updated: '2026-07-01',
  intro:
    'Serwis korzysta z plików cookies. Do momentu wyrażenia zgody nie ładujemy żadnych skryptów analitycznych ani marketingowych — działają wyłącznie pliki niezbędne do funkcjonowania sklepu.',
  sections: [
    {
      id: 'czym-sa',
      heading: 'Czym są pliki cookies',
      paragraphs: [
        'Cookies to niewielkie pliki tekstowe zapisywane na urządzeniu użytkownika przez przeglądarkę. Umożliwiają rozpoznanie urządzenia przy kolejnych wizytach i utrzymanie stanu sesji, na przykład zawartości koszyka.',
      ],
    },
    {
      id: 'kategorie',
      heading: 'Kategorie plików cookies',
      list: [
        'Niezbędne — utrzymanie sesji, zawartość koszyka, zabezpieczenie formularzy. Nie można ich wyłączyć, ponieważ bez nich sklep nie działa.',
        'Analityczne — anonimowe statystyki ruchu, pozwalające poprawiać ścieżkę zakupową.',
        'Marketingowe — pomiar skuteczności kampanii i dopasowanie komunikatów reklamowych.',
        'Funkcjonalne — zapamiętanie preferencji, na przykład ostatnio wybranego formatu koperty.',
      ],
    },
    {
      id: 'wykaz',
      heading: 'Wykaz plików',
      paragraphs: [
        'Poniższy wykaz ma charakter poglądowy i zostanie uzupełniony o rzeczywiste identyfikatory po wdrożeniu narzędzi analitycznych.',
      ],
      list: [
        'envelopes.cart — niezbędny — zawartość koszyka — 30 dni.',
        'envelopes.cookieConsent — niezbędny — zapis decyzji o zgodach — 12 miesięcy.',
        'envelopes.devSession — niezbędny — sesja użytkownika — czas trwania sesji.',
        '_ga / _ga_* — analityczny — statystyki ruchu — 24 miesiące (ładowany wyłącznie po wyrażeniu zgody).',
      ],
    },
    {
      id: 'zarzadzanie',
      heading: 'Zarządzanie zgodami',
      paragraphs: [
        'Zgody można zmienić w dowolnym momencie linkiem „Zarządzaj cookies” w stopce serwisu. Wycofanie zgody nie wpływa na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.',
        'Pliki cookies można również usuwać i blokować z poziomu ustawień przeglądarki. Zablokowanie plików niezbędnych może uniemożliwić złożenie zamówienia.',
      ],
    },
  ],
};
