#!/usr/bin/env node
/**
 * Generator obrazów wyróżniających (`public/images/og/*.jpg`).
 *
 * Karta OG ma w tym serwisie stały układ: zdjęcie w kadrze 1200 × 630,
 * przyciemnienie od lewej, nadtytuł wersalikami, tytuł szeryfowy, kreska
 * w kolorze pieczęci, dwie linijki parametrów i domena w stopce. Skrypt
 * odtwarza ten układ, żeby kolejne karty — kolorów z Fazy 3 i wpisów
 * blogowych — nie rozjeżdżały się z rodziną robioną ręcznie.
 *
 * **Bez kwot na karcie.** Cena zmienia się wdrożeniem, a obraz OG bywa
 * zbuforowany przez Facebooka i komunikatory na wiele miesięcy — karta
 * z nieaktualną kwotą przeżyłaby zmianę cennika. Parametry stałe (gramatura,
 * format, brak okienka) takiego problemu nie mają.
 *
 * Użycie:
 *   node scripts/og-card.mjs \
 *     --photo public/images/zastosowania/czarna-koperta-dl-nadruk-zaproszenie-1024.webp \
 *     --eyebrow "Kolor czarny" \
 *     --title "Czarne koperty DL" \
 *     --line1 "Papier barwiony w masie · 115 g/m²" \
 *     --line2 "Nadruk logo jasnym kolorem, od 1 sztuki" \
 *     --out public/images/og/koperty-czarne.jpg
 */

import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
/** Kolor pieczęci z `globals.css` — jedyny akcent w palecie. */
const SEAL = '#2a4e7e';

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    options[key] = argv[i + 1];
  }
  return options;
}

/** Escape tekstu wchodzącego do SVG — nazwy kolorów bywają z „&". */
function escapeXml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function overlay({ eyebrow, title, line1, line2 }) {
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#12151c" stop-opacity="0.94"/>
      <stop offset="42%" stop-color="#12151c" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#12151c" stop-opacity="0.06"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scrim)"/>
  <text x="72" y="128" font-family="Segoe UI, Arial, sans-serif" font-size="22"
        letter-spacing="6" fill="#ffffff" fill-opacity="0.72">${escapeXml(
          eyebrow
        ).toUpperCase()}</text>
  <text x="72" y="300" font-family="Georgia, Times New Roman, serif" font-size="62"
        font-weight="700" fill="#ffffff">${escapeXml(title)}</text>
  <rect x="72" y="342" width="68" height="5" fill="${SEAL}"/>
  <text x="72" y="412" font-family="Segoe UI, Arial, sans-serif" font-size="27"
        fill="#ffffff" fill-opacity="0.92">${escapeXml(line1)}</text>
  <text x="72" y="458" font-family="Segoe UI, Arial, sans-serif" font-size="27"
        fill="#ffffff" fill-opacity="0.92">${escapeXml(line2)}</text>
  <text x="72" y="578" font-family="Segoe UI, Arial, sans-serif" font-size="22"
        letter-spacing="2" fill="#ffffff" fill-opacity="0.66">envelopes.pl</text>
</svg>`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  for (const key of ['photo', 'eyebrow', 'title', 'line1', 'line2', 'out']) {
    if (!options[key]) {
      console.error(`✗ Brakuje argumentu --${key}`);
      process.exitCode = 1;
      return;
    }
  }

  await sharp(options.photo)
    /* Kadr z środka, nie `attention`: automat wybierałby dla każdego zdjęcia
       inny wycinek, a karty mają tworzyć rodzinę o powtarzalnej kompozycji. */
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay(options), top: 0, left: 0 }])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(options.out);

  const meta = await sharp(options.out).metadata();
  console.log(`✓ ${options.out} — ${meta.width} × ${meta.height}, ${meta.format}`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
});
