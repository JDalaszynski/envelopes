# Instrukcja Tworzenia Pinów na Pinterest — Envelopes

Kompleksowy standard techniczny, graficzny oraz SEO dla tworzenia pinów produktowych marki **Envelopes** na Pinterest na bazie zdjęć z katalogu `public/images/zastosowania/`.

---

## 1. Specyfikacja Graficzna Pina (Format 4:5)

Każdy pin na Pinterest musi spełniać poniższe parametry kompozycji i rozdzielczości:

- **Rozdzielczość pliku**: `1080 × 1350 px` (proporcja pionowa 4:5).
- **Format wyjściowy**: `JPG` o wysokiej jakości (`quality: 96`, progresywny `mozjpeg`).
- **Przestrzeń barw**: RGB / sRGB.

### Podział pionowy kadru (suma = 1350 px):
1. **Pasek górny (Top Bar)**:
   - **Wysokość**: `140 px` (szerokość `1080 px`).
   - **Kolor tła**: `#FFFFFE` (ciepła biel).
   - **Element**: Oficjalne logo Envelopes (`public/images/logo-envelopes.png`).
   - **Wymiary logo**: wysokość `74 px`, szerokość proporcjonalna `~363 px`.
   - **Wyrównanie**: idealnie wyśrodkowane pionowo i poziomo.
2. **Kadr główny (Środek)**:
   - **Wysokość**: `1080 px` (szerokość `1080 px`).
   - **Treść**: Oryginalne zdjęcie produktowe 1:1 z `public/images/zastosowania/`.
   - **Zasada kadrowania**: Zdjęcie nie może być obcinane po bokach ani od góry/dołu — zachowuje 100% oryginalnego kadru aranżacyjnego.
3. **Pasek dolny (Bottom Bar / Primary)**:
   - **Wysokość**: `130 px` (szerokość `1080 px`).
   - **Kolor tła**: Jednolity prostokąt w kolorze **Primary / Seal** (`#2a4e7e` z Design System). **Brak białego tła, brak ramki wokół przycisku**.
   - **Typografia**: Font **Fraunces** (`weight: 600`, rozmiar `42px`, kolor `#ffffff`).
   - **Treść napisu**: `Zamów Koperty Ozdobne`.
   - **Wyrównanie**: wyśrodkowane pionowo i poziomo.

---

## 2. Generator Automatyczny (`scripts/pinterest-generator.mjs`)

Do generowania grafik służy dedykowany skrypt Node.js wykorzystujący bibliotekę `sharp` oraz wektorowy silnik SVG z osadzonym fontem Fraunces w formacie base64.

### Zależności:
- Font: `public/fonts/Fraunces.ttf` (osadzany automatycznie w base64).
- Logo: `public/images/logo-envelopes.png`.
- Biblioteka: `sharp`.

### Uruchomienie skryptu:
```bash
# Uruchomienie generatora
node scripts/pinterest-generator.mjs
```

### Funkcja w kodzie:
```javascript
import { generatePin } from './scripts/pinterest-generator.mjs';

await generatePin({
  photoPath: 'public/images/zastosowania/nazwa-zdjecia-1024.webp',
  outputPath: 'socials/pinterest/nazwa-pina.jpg',
  ctaText: 'Zamów Koperty Ozdobne', // Domyślna treść
  quality: 96
});
```

---

## 3. Standard SEO Copywritingu (Pinterest SEO)

Każdy wpis w pliku `socials/pinterest-piny.txt` musi zawierać 4 elementy ściśle zoptymalizowane pod algorytm wyszukiwarki Pinterest oraz intencję zakupową (BOFU/MOFU z `keywords.md`):

### A. Tytuł Pina (Title)
- **Długość**: 60–90 znaków (max 100 znaków, w aplikacji mobilnej widoczne pierwsze ~60).
- **Formuła**: `[Kolor/Cecha] Koperty Ozdobne [z Nadrukiem Logo] | [Zastosowanie / Branża]`
- **Obowiązkowe frazy**: Musi zawierać minimum dwie silne frazy z bazy `keywords.md`, np.:
  - `koperty ozdobne`
  - `koperty z nadrukiem` / `koperty z logo firmy`
  - `koperty na vouchery` / `koperty na bony podarunkowe`
  - `koperty DL` / `eleganckie koperty na zaproszenia`

### B. Opis Pina (Description)
- **Długość**: 350–500 znaków.
- **Struktura**:
  1. **Hak branżowy (Problem/Kontrast)**: Dlaczego zwykła biała koperta biurowa niszczy wrażenie, a koperta ozdobna buduje prestiż.
  2. **Lista korzyści (Bullet points z frazami kluczowymi)**:
     - Format (np. DL 110 × 220 mm — idealny na voucher, zaproszenie, bon podarunkowy),
     - Jakość papieru (np. papier barwiony w masie, gramatura 120–140 g/m²),
     - Usługa (nadruk logo już od 1 sztuki, brak okienka, personalizacja),
     - Proces (konfigurator online, szybka dostawa).
  3. **Wyraźne Call to Action**: Bezpośrednie wezwanie do akcji z powtórzeniem frazy kluczowej, np. *„👉 Kliknij pin, przejdź do konfiguratora i zamów koperty ozdobne z logo na envelopes.pl!”*.
  4. **Tagi (Hashtags)**: Zestaw 10–14 branżowych tagów opartych na słowach kluczowych.

### C. Link Docelowy (Destination URL)
Dopasowany do intencji zdjęcia:
- Branżowe: `/koperty-dla-restauracji`, `/koperty-dla-salonow-spa`, `/koperty-dla-kancelarii`.
- Zastosowania ogólne: `/koperty-na-vouchery`, `/koperty-z-nadrukiem`, `/koperty-personalizowane`, `/koperty-dl`.
- Zakup bezpośredni: `https://envelopes.pl/#konfigurator`.

---

## 4. Baza Zdjęć do Wykorzystania (`public/images/zastosowania/`)

Katalog zawiera 18 unikalnych kadrów wysokiej rozdzielczości (używać plików `-1024.webp`):

1. `czerwona-koperta-dl-nadruk-logo-restauracji-1024.webp` — Restauracja / Gastronomia (Vouchery).
2. `taupe-koperta-dl-nadruk-logo-salonu-spa-1024.webp` — Salony SPA / Kliniki Beauty.
3. `granatowa-koperta-dl-nadruk-logo-kancelarii-1024.webp` — Kancelarie Prawne / Notariusze.
4. `eko-koperta-dl-nadruk-logo-palarni-kawy-1024.webp` — Palarnie kawy / Marki rzemieślnicze.
5. `zlota-koperta-dl-nadruk-logo-studia-tatuazu-1024.webp` — Studia tatuażu / Branża kreatywna.
6. `biala-perlowa-koperta-dl-nadruk-w-dniu-slubu-1024.webp` — Ślub / Zaproszenia ślubne.
7. `blekit-lupkowy-koperta-dl-nadruk-na-chrzest-1024.webp` — Chrzest / Uroczystości rodzinne.
8. `czarna-koperta-dl-nadruk-zaproszenie-1024.webp` — Gale / Eventy / Ekskluzywne zaproszenia.
9. `czarna-koperta-dl-personalizacja-imienna-1024.webp` — Personalizacja imienna gości.
10. `matcha-koperta-dl-nadruk-podziekowania-1024.webp` — Podziękowania dla klientów / partnerów.
11. `matcha-koperta-dl-nadruk-wyrazy-uznania-1024.webp` — Certyfikaty i wyrazy uznania.
12. `biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego-1024.webp` — Salony fryzjerskie / Beauty.
13. `biala-perlowa-koperta-dl-nadruk-logo-auto-detailing-1024.webp` — Auto Detailing / Motoryzacja premium.
14. `granatowa-koperta-dl-nadruk-logo-orkiestry-1024.webp` — Instytucje kultury / Filharmonie.
15. `ciemnozielona-koperta-dl-miejsce-na-logo-1024.webp` — Ciemnozielona elegancka koperta DL.
16. `niebieska-koperta-dl-personalizacja-odreczna-1024.webp` — Pismo odręczne i kaligrafia.
17. `biala-perlowa-koperta-dl-adresowanie-odbiorcy-1024.webp` — Precyzyjne adresowanie odbiorcy.
18. `biala-perlowa-koperta-dl-gladka-przod-i-tyl-1024.webp` — Czysta perłowa koperta DL.

---

## 5. Baza Zdjęć z Katalogu `socials/` (Piny 19–30)

Studyjna kolekcja 12 kadrów produktowych z kompozycją na tle siatki kopert (4 linie kolorystyczne × 3 warianty prezentacji: gładka, z miejscem na logo, z nadrukiem adresowania):

19. `Bez nazwy-1-01.jpg` — Czarna koperta DL gładka (przód i tył).
20. `Bez nazwy-1-02.jpg` — Czarna koperta DL z miejscem na nadruk logo firmy.
21. `Bez nazwy-1-03.jpg` — Czarna koperta DL z nadrukiem adresowania odbiorcy.
22. `Bez nazwy-1-05.jpg` — Biała perłowa koperta DL gładka (przód i tył).
23. `Bez nazwy-1-06.jpg` — Biała perłowa koperta DL z miejscem na nadruk logo.
24. `Bez nazwy-1-07.jpg` — Biała perłowa koperta DL z nadrukiem adresowania odbiorcy.
25. `Bez nazwy-1-08.jpg` — Szałwiowa koperta Matcha DL gładka (przód i tył).
26. `Bez nazwy-1-09.jpg` — Szałwiowa koperta Matcha DL z miejscem na nadruk logo.
27. `Bez nazwy-1-10.jpg` — Szałwiowa koperta Matcha DL z nadrukiem adresowania odbiorcy.
28. `1.jpg` — Granatowa koperta DL gładka (przód i tył).
29. `2.jpg` — Granatowa koperta DL z miejscem na nadruk logo.
30. `3.jpg` — Granatowa koperta DL z nadrukiem adresowania odbiorcy.

