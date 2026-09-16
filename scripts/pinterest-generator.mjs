import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const WIDTH = 1080;
const HEIGHT = 1350; // Pionowy format 4:5 (rekomendowany standard Pinterest / Instagram)
const TOP_BAR_HEIGHT = 140; // Górny biały pasek z logo
const PHOTO_HEIGHT = 1080; // Pełne, nieprzycięte zdjęcie 1:1
const BOTTOM_BAR_HEIGHT = 130; // 140 + 1080 + 130 = 1350 px (dokładnie 4:5)

const WHITE = '#FFFFFE';
const PRIMARY_COLOR = '#2a4e7e'; // Kolor primary / seal z Design System Envelopes

/**
 * Wczytuje font Fraunces jako base64 do osadzenia w SVG
 */
function getFrauncesBase64() {
  const fontPath = 'public/fonts/Fraunces.ttf';
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Brak pliku fontu ${fontPath}. Pobierz font przed generowaniem.`);
  }
  return fs.readFileSync(fontPath).toString('base64');
}

/**
 * Generuje pin Pinterest w formacie pionowym 4:5 (1080x1350 px).
 */
export async function generatePin({
  photoPath,
  outputPath,
  ctaText = 'Zamów Koperty Ozdobne',
  quality = 96
}) {
  const frauncesBase64 = getFrauncesBase64();

  // 1. Bazowe tło z białym paskiem na górze
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: WHITE
    }
  });

  // 2. Logo Envelopes (powiększone do h=74 px)
  const logoMeta = await sharp('public/images/logo-envelopes.png').metadata();
  const targetLogoHeight = 74;
  const targetLogoWidth = Math.round(logoMeta.width * (targetLogoHeight / logoMeta.height)); // ok. 363 px
  const logo = await sharp('public/images/logo-envelopes.png')
    .resize(targetLogoWidth, targetLogoHeight)
    .toBuffer();

  const logoLeft = Math.round((WIDTH - targetLogoWidth) / 2);
  const logoTop = Math.round((TOP_BAR_HEIGHT - targetLogoHeight) / 2);

  // 3. Zdjęcie w pełnym kadrze 1080x1080
  const photo = await sharp(photoPath)
    .resize(WIDTH, PHOTO_HEIGHT, { fit: 'cover', position: 'centre' })
    .toBuffer();

  // 4. Dolny pasek: solidny prostokąt primary na całą szerokość z fontem Fraunces
  const bottomBarY = TOP_BAR_HEIGHT + PHOTO_HEIGHT;
  const textY = bottomBarY + Math.round(BOTTOM_BAR_HEIGHT / 2) + 14;

  const bottomOverlaySvg = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: 'Fraunces';
            src: url('data:font/truetype;charset=utf-8;base64,${frauncesBase64}') format('truetype');
            font-weight: 600;
          }
          .cta-text {
            font-family: 'Fraunces', Georgia, serif;
            font-size: 42px;
            font-weight: 600;
            fill: #ffffff;
            letter-spacing: -0.01em;
          }
        </style>
      </defs>
      <!-- Dolny prostokąt w kolorze primary bez białego tła -->
      <rect x="0" y="${bottomBarY}" width="${WIDTH}" height="${BOTTOM_BAR_HEIGHT}" fill="${PRIMARY_COLOR}" />
      <!-- Duży tekst fontem Fraunces -->
      <text x="${WIDTH / 2}" y="${textY}" text-anchor="middle" class="cta-text">
        ${ctaText}
      </text>
    </svg>
  `);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  await base
    .composite([
      { input: photo, top: TOP_BAR_HEIGHT, left: 0 },
      { input: logo, top: logoTop, left: logoLeft },
      { input: bottomOverlaySvg, top: 0, left: 0 }
    ])
    .jpeg({ quality, progressive: true, mozjpeg: true })
    .toFile(outputPath);

  console.log(`✓ Wygenerowano pin: ${outputPath}`);
}

export const ALL_PINS = [
  {
    id: 1,
    photo: 'biala-perlowa-koperta-dl-adresowanie-odbiorcy-1024.webp',
    output: 'pin-01-biala-perlowa-adresowanie-odbiorcy.jpg',
    title: 'Adresowanie Kopert DL z Nadrukiem Odbiorcy | Biała Perła'
  },
  {
    id: 2,
    photo: 'biala-perlowa-koperta-dl-gladka-przod-i-tyl-1024.webp',
    output: 'pin-02-biala-perlowa-gladka.jpg',
    title: 'Białe Perłowe Koperty Ozdobne DL bez Nadruku | Baza pod Zaproszenia'
  },
  {
    id: 3,
    photo: 'biala-perlowa-koperta-dl-nadruk-logo-auto-detailing-1024.webp',
    output: 'pin-03-biala-perlowa-auto-detailing.jpg',
    title: 'Koperty Firmowe z Logo Auto Detailing | Perłowe Koperty DL na Vouchery'
  },
  {
    id: 4,
    photo: 'biala-perlowa-koperta-dl-nadruk-logo-salonu-fryzjerskiego-1024.webp',
    output: 'pin-04-biala-perlowa-salon-fryzjerski.jpg',
    title: 'Koperty z Logo dla Salonu Fryzjerskiego | Bony Podarunkowe Beauty DL'
  },
  {
    id: 5,
    photo: 'biala-perlowa-koperta-dl-nadruk-w-dniu-slubu-1024.webp',
    output: 'pin-05-biala-perlowa-w-dniu-slubu.jpg',
    title: 'Koperty Ślubne z Nadrukiem W Dniu Ślubu | Elegancka Koperta na Pieniądze'
  },
  {
    id: 6,
    photo: 'blekit-lupkowy-koperta-dl-nadruk-na-chrzest-1024.webp',
    output: 'pin-06-blekit-lupkowy-chrzest.jpg',
    title: 'Koperta na Chrzest Święty z Nadrukiem | Błękit Łupkowy DL na Pamiątkę'
  },
  {
    id: 7,
    photo: 'ciemnozielona-koperta-dl-miejsce-na-logo-1024.webp',
    output: 'pin-07-ciemnozielona-miejsce-na-logo.jpg',
    title: 'Ciemnozielone Koperty Ozdobne DL z Miejscem na Logo Firmy'
  },
  {
    id: 8,
    photo: 'czarna-koperta-dl-nadruk-zaproszenie-1024.webp',
    output: 'pin-08-czarna-zaproszenie.jpg',
    title: 'Czarne Koperty Ozdobne z Nadrukiem Zaproszenie | Ekskluzywne DL na Event'
  },
  {
    id: 9,
    photo: 'czarna-koperta-dl-personalizacja-imienna-1024.webp',
    output: 'pin-09-czarna-personalizacja-imienna.jpg',
    title: 'Czarne Koperty z Personalizacją Imienną | Zaproszenia z Nazwiskiem Gościa'
  },
  {
    id: 10,
    photo: 'czerwona-koperta-dl-nadruk-logo-restauracji-1024.webp',
    output: 'pin-10-czerwona-logo-restauracji.jpg',
    title: 'Czerwone Koperty Ozdobne z Nadrukiem Logo | Eleganckie Koperty na Vouchery DL'
  },
  {
    id: 11,
    photo: 'eko-koperta-dl-nadruk-logo-palarni-kawy-1024.webp',
    output: 'pin-11-eko-kraft-palarnia-kawy.jpg',
    title: 'Koperty Eko Kraft z Nadrukiem Logo | Ekologiczne Koperty DL dla Palarni'
  },
  {
    id: 12,
    photo: 'granatowa-koperta-dl-nadruk-logo-kancelarii-1024.webp',
    output: 'pin-12-granatowa-logo-kancelarii.jpg',
    title: 'Granatowe Koperty z Logo Kancelarii Prawnej | Prestiżowe Koperty DL B2B'
  },
  {
    id: 13,
    photo: 'granatowa-koperta-dl-nadruk-logo-orkiestry-1024.webp',
    output: 'pin-13-granatowa-logo-orkiestry.jpg',
    title: 'Granatowe Koperty Ozdobne z Logo dla Instytucji Kultury i Filharmonii'
  },
  {
    id: 14,
    photo: 'matcha-koperta-dl-nadruk-podziekowania-1024.webp',
    output: 'pin-14-matcha-podziekowania.jpg',
    title: 'Szałwiowe Koperty Matcha z Nadrukiem Podziękowania | Koperty DL dla Firm'
  },
  {
    id: 15,
    photo: 'matcha-koperta-dl-nadruk-wyrazy-uznania-1024.webp',
    output: 'pin-15-matcha-wyrazy-uznania.jpg',
    title: 'Koperty Ozdobne Matcha z Nadrukiem Wyrazy Uznania | Certyfikaty i Nagrody'
  },
  {
    id: 16,
    photo: 'niebieska-koperta-dl-personalizacja-odreczna-1024.webp',
    output: 'pin-16-niebieska-personalizacja-odreczna.jpg',
    title: 'Niebieskie Koperty Ozdobne DL do Kaligrafii i Personalizacji Odręcznej'
  },
  {
    id: 17,
    photo: 'taupe-koperta-dl-nadruk-logo-salonu-spa-1024.webp',
    output: 'pin-17-taupe-logo-salonu-spa.jpg',
    title: 'Koperty z Logo dla Salonu SPA i Wellness | Eleganckie Vouchery Taupe DL'
  },
  {
    id: 18,
    photo: 'zlota-koperta-dl-nadruk-logo-studia-tatuazu-1024.webp',
    output: 'pin-18-zlota-logo-studia-tatuazu.jpg',
    title: 'Złote Metaliczne Koperty Ozdobne z Logo | Vouchery na Tatuaż i Sztukę'
  },
  {
    id: 19,
    photo: 'socials/Bez nazwy-1-01.jpg',
    output: 'pin-19-czarna-gladka-przod-i-tyl.jpg',
    title: 'Czarne Koperty Ozdobne DL Gładkie | Elegancka Baza pod Zaproszenia i Vouchery'
  },
  {
    id: 20,
    photo: 'socials/Bez nazwy-1-02.jpg',
    output: 'pin-20-czarna-miejsce-na-logo.jpg',
    title: 'Czarne Koperty z Nadrukiem Logo Firmy | Ekskluzywne Koperty Firmowe DL'
  },
  {
    id: 21,
    photo: 'socials/Bez nazwy-1-03.jpg',
    output: 'pin-21-czarna-adresowanie-odbiorcy.jpg',
    title: 'Czarne Koperty DL z Adresowaniem Odbiorcy | Personalizowane Koperty VIP'
  },
  {
    id: 22,
    photo: 'socials/Bez nazwy-1-05.jpg',
    output: 'pin-22-biala-perlowa-gladka.jpg',
    title: 'Białe Perłowe Koperty Ozdobne DL Gładkie | Luksusowa Baza na Zaproszenia Ślubne'
  },
  {
    id: 23,
    photo: 'socials/Bez nazwy-1-06.jpg',
    output: 'pin-23-biala-perlowa-miejsce-na-logo.jpg',
    title: 'Perłowe Koperty z Nadrukiem Logo | Eleganckie Koperty na Vouchery i Bony DL'
  },
  {
    id: 24,
    photo: 'socials/Bez nazwy-1-07.jpg',
    output: 'pin-24-biala-perlowa-adresowanie-odbiorcy.jpg',
    title: 'Białe Perłowe Koperty DL z Adresowaniem | Personalizowane Zaproszenia z Nadrukiem'
  },
  {
    id: 25,
    photo: 'socials/Bez nazwy-1-08.jpg',
    output: 'pin-25-matcha-gladka-przod-i-tyl.jpg',
    title: 'Szałwiowe Koperty Ozdobne Matcha DL Gładkie | Baza Greenery i Boho pod Zaproszenia'
  },
  {
    id: 26,
    photo: 'socials/Bez nazwy-1-09.jpg',
    output: 'pin-26-matcha-miejsce-na-logo.jpg',
    title: 'Szałwiowe Koperty Matcha z Nadrukiem Logo | Ekologiczne Koperty Firmowe DL'
  },
  {
    id: 27,
    photo: 'socials/Bez nazwy-1-10.jpg',
    output: 'pin-27-matcha-adresowanie-odbiorcy.jpg',
    title: 'Szałwiowe Koperty DL Matcha z Adresowaniem | Personalizowane Koperty Greenery'
  },
  {
    id: 28,
    photo: 'socials/1.jpg',
    output: 'pin-28-granatowa-gladka-przod-i-tyl.jpg',
    title: 'Granatowe Koperty Ozdobne DL Gładkie | Prestiżowa Baza pod Zaproszenia i Vouchery'
  },
  {
    id: 29,
    photo: 'socials/2.jpg',
    output: 'pin-29-granatowa-miejsce-na-logo.jpg',
    title: 'Granatowe Koperty Firmowe DL z Logo | Prestiżowe Koperty z Nadrukiem B2B'
  },
  {
    id: 30,
    photo: 'socials/3.jpg',
    output: 'pin-30-granatowa-adresowanie-odbiorcy.jpg',
    title: 'Granatowe Koperty DL z Adresowaniem Odbiorcy | Personalizowana Korespondencja B2B'
  }
];

async function main() {
  console.log(`Generowanie ${ALL_PINS.length} pinów Pinterest w formacie 4:5...`);
  const inputDir = 'public/images/zastosowania';
  const outputDir = 'socials/pinterest';

  for (const item of ALL_PINS) {
    const photoPath = fs.existsSync(item.photo) ? item.photo : path.join(inputDir, item.photo);
    const outputPath = path.join(outputDir, item.output);
    await generatePin({
      photoPath,
      outputPath,
      ctaText: 'Zamów Koperty Ozdobne'
    });
  }

  // Zachowaj również plik testowy dla kompatybilności wstecznej
  const testPhoto = path.join(inputDir, 'czerwona-koperta-dl-nadruk-logo-restauracji-1024.webp');
  await generatePin({
    photoPath: testPhoto,
    outputPath: path.join(outputDir, 'pin-test-czerwona-koperta-dl-restauracja.jpg'),
    ctaText: 'Zamów Koperty Ozdobne'
  });

  console.log('✓ Zakończono generowanie wszystkich pinów!');
}

main().catch(console.error);
