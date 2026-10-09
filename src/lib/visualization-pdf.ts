import { COLOR_MAP, FORMAT_MAP, hasSurfaceFinish, personalizationScope, weightLabel } from './catalog';
import { CONTACT_DETAILS } from './orders';
import { parseTrueType } from './pdf-font';
import {
  A4,
  PdfDocument,
  rgb,
  type PdfFont,
  type PdfImage,
  type PdfPage,
  type Rgb,
  type TextStyle,
} from './pdf-writer';
import { formatDate, leadTimeDays, needsProduction, plural } from './pricing';
import { PRINT_SIDE_LABEL, printSides } from './print-sides';
import type { CartItem, Order } from './types';

/**
 * PDF z wizualizacją koperty do akceptacji klienta.
 *
 * Dokument powstaje w panelu Admina („Generator wizualizacji") z trzech
 * rzeczy: zamówienia, pliku JPG od grafika i numeru wersji. Admin wysyła go
 * klientowi samodzielnie, więc PDF musi się bronić bez wiadomości, do której
 * jest dołączony: mówi, czego dotyczy, co sprawdzić i jak odpowiedzieć.
 *
 * Wygląd trzyma się systemu projektowego serwisu (`globals.css`): papierowe
 * tło, białe karty z cienką linią, granat pieczęci jako jedyny akcent,
 * Fraunces w nagłówkach, IBM Plex Sans w tekście i IBM Plex Mono w danych,
 * w których liczy się precyzja — numerze zamówienia i nazwach plików.
 *
 * Moduł nie dotyka sieci ani DOM-u: fonty i obraz dostaje jako bajty, dzięki
 * czemu ten sam kod składa dokument w przeglądarce i w Node.
 */

/** Kroje osadzane w dokumencie — pliki leżą w `public/fonts/`. */
export const VISUALIZATION_FONTS = {
  display: { file: 'Fraunces.ttf', name: 'Fraunces-SemiBold' },
  sans: { file: 'IBMPlexSans-Regular.ttf', name: 'IBMPlexSans-Regular' },
  sansBold: { file: 'IBMPlexSans-SemiBold.ttf', name: 'IBMPlexSans-SemiBold' },
  mono: { file: 'IBMPlexMono-Regular.ttf', name: 'IBMPlexMono-Regular' },
  monoMedium: { file: 'IBMPlexMono-Medium.ttf', name: 'IBMPlexMono-Medium' },
} as const;

export type VisualizationFontRole = keyof typeof VISUALIZATION_FONTS;

export interface VisualizationPdfInput {
  order: Order;
  /** Pozycje zamówienia, których dotyczy wizualizacja */
  items: CartItem[];
  /** Wizualizacja jako JPEG w przestrzeni RGB */
  image: { data: Uint8Array; width: number; height: number };
  fonts: Record<VisualizationFontRole, Uint8Array>;
  /** Kolejna wersja projektu — rośnie po każdej rundzie uwag klienta */
  version: number;
  issuedAt: Date;
}

export function visualizationFileName(order: Order, version: number): string {
  return `wizualizacja-${order.number}-v${version}.pdf`;
}

/* ── Tokeny systemu projektowego (pkt 4.1 w `globals.css`) ──── */

const PAPER = rgb('#f4f2ec');
const SURFACE = rgb('#ffffff');
const INK = rgb('#1f2430');
const INK_SOFT = rgb('#575e6e');
const SEAL = rgb('#2a4e7e');
const SEAL_WASH = rgb('#e6ebf2');
const LINE = rgb('#dcd8cc');

/* ── Siatka strony A4, w punktach ───────────────────────────── */

const MARGIN = 42;
const WIDTH = A4.width - MARGIN * 2;
const TOP = 36;
const FOOTER_RULE = A4.height - 40;
/** Dolna granica treści — poniżej zostaje tylko stopka */
const BOTTOM = FOOTER_RULE - 14;
const GAP = 12;
const CARD_RADIUS = 6;

/** Dolny rząd strony: karta produktu po lewej, karta akceptacji po prawej */
const ACCEPT_WIDTH = 206;
const PRODUCT_WIDTH = WIDTH - ACCEPT_WIDTH - GAP;

const IMAGE_PADDING = 8;
/**
 * Poniżej tej wysokości wizualizacja przestaje być czytelna na pierwszy rzut
 * oka. Jeśli obok kart nie ma na nią tyle miejsca, obraz dostaje całą
 * pierwszą stronę, a szczegóły przechodzą na drugą.
 */
const IMAGE_MIN_HEIGHT = 230;
/** Miejsce na zdanie odsyłające do drugiej strony */
const NEXT_PAGE_NOTE = 24;

/**
 * Sygnet z nagłówka serwisu (`logo-icon.png`) jako wektor: granatowy
 * prostokąt 258 × 193 i wycięta w nim klapka koperty. Punkty opisują klapkę.
 */
const LOGO_SIZE = { width: 258, height: 193 };
const LOGO_FLAP: [number, number][] = [
  [0, 13.5],
  [0, 0],
  [18, 0],
  [175, 117.75],
  [258, 55.5],
  [258, 81.75],
  [174.5, 144.4],
];

interface Type {
  display: PdfFont;
  sans: PdfFont;
  sansBold: PdfFont;
  mono: PdfFont;
  monoMedium: PdfFont;
}

/* ── Skład tekstu ───────────────────────────────────────────── */

function textWidth(text: string, style: TextStyle): number {
  return style.font.width(text, style.size, style.tracking);
}

/** Przycina tekst do szerokości, kończąc wielokropkiem. */
function fit(text: string, style: TextStyle, maxWidth: number): string {
  if (textWidth(text, style) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}…`, style) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Przycina od środka — końcówka z rozszerzeniem pliku zostaje widoczna. */
function fitFileName(text: string, style: TextStyle, maxWidth: number): string {
  if (textWidth(text, style) <= maxWidth) return text;
  const tail = text.slice(-8);
  let head = text.slice(0, -8);
  while (head.length > 1 && textWidth(`${head}…${tail}`, style) > maxWidth) head = head.slice(0, -1);
  return `${head}…${tail}`;
}

/**
 * Łamie tekst na linie. Dzieli wyłącznie na zwykłych spacjach — twarda spacja
 * po jednoliterowym spójniku trzyma go przy następnym słowie, więc „i" ani „w"
 * nie zostają na końcu wiersza.
 */
function wrap(text: string, style: TextStyle, maxWidth: number, maxLines = Infinity): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || textWidth(candidate, style) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const rest = lines.splice(maxLines - 1).join(' ');
    lines.push(rest);
  }
  return lines.map((entry) => fit(entry, style, maxWidth));
}

/* ── Nagłówek i stopka ──────────────────────────────────────── */

/** Sygnet, nazwa i plakietka wersji. Zwraca położenie linii pod nagłówkiem. */
function drawHeader(page: PdfPage, type: Type, version: number): number {
  const logoHeight = 16;
  const scale = logoHeight / LOGO_SIZE.height;
  const logoWidth = LOGO_SIZE.width * scale;

  page.rect(0, 0, page.width, page.height, { fill: PAPER });
  page.rect(MARGIN, TOP, logoWidth, logoHeight, { fill: SEAL });
  page.polygon(
    LOGO_FLAP.map(([x, y]) => [MARGIN + x * scale, TOP + y * scale]),
    PAPER
  );
  page.text('Envelopes', MARGIN + logoWidth + 8, TOP + 13.9, {
    font: type.display,
    size: 17,
    color: INK,
  });

  // Plakietka w języku `.badge-seal` — jedyne miejsce nagłówka z akcentem
  const badge: TextStyle = { font: type.sansBold, size: 6.6, color: SEAL, tracking: 0.5 };
  const label = `WIZUALIZACJA · WERSJA ${version}`;
  const badgeWidth = textWidth(label, badge) + 14;
  const badgeX = MARGIN + WIDTH - badgeWidth;
  page.rect(badgeX, TOP + 0.5, badgeWidth, 15, {
    fill: SEAL_WASH,
    stroke: SEAL,
    lineWidth: 0.6,
    radius: 3,
  });
  page.text(label, badgeX + 7, TOP + 10.3, badge);

  page.line(MARGIN, TOP + 30, MARGIN + WIDTH, TOP + 30, LINE);
  return TOP + 30;
}

function drawFooter(page: PdfPage, type: Type, index: number, total: number): void {
  const style: TextStyle = { font: type.sans, size: 7.6, color: INK_SOFT };
  const baseline = FOOTER_RULE + 15;
  const contact = `${CONTACT_DETAILS.email} · ${CONTACT_DETAILS.phone} · ${CONTACT_DETAILS.hours}`;
  const site = 'envelopes.pl';

  page.line(MARGIN, FOOTER_RULE, MARGIN + WIDTH, FOOTER_RULE, LINE);
  page.text(`${CONTACT_DETAILS.brand} · ${site}`, MARGIN, baseline, style);
  page.text(contact, MARGIN + WIDTH, baseline, style, 'right');
  if (total > 1) {
    page.text(`Strona ${index + 1} z ${total}`, MARGIN + WIDTH / 2, baseline, style, 'center');
  }

  const emailWidth = textWidth(CONTACT_DETAILS.email, style);
  page.link(
    MARGIN + WIDTH - textWidth(contact, style),
    baseline - 9,
    emailWidth,
    12,
    `mailto:${CONTACT_DETAILS.email}`,
    `Napisz na ${CONTACT_DETAILS.email}`
  );
  page.link(
    MARGIN,
    baseline - 9,
    textWidth(`${CONTACT_DETAILS.brand} · ${site}`, style),
    12,
    `https://${site}`,
    'Strona sklepu Envelopes'
  );
}

/* ── Tytuł i dane zamówienia ────────────────────────────────── */

/** Nazwa klienta do nagłówka dokumentu: firma, a przy osobie prywatnej imię i nazwisko. */
export function customerName(order: Order): string {
  const { customer } = order;
  return customer.isCompany && customer.firma
    ? customer.firma
    : `${customer.imie} ${customer.nazwisko}`.trim();
}

function drawTitle(page: PdfPage, type: Type, y: number): number {
  page.text('Wizualizacja do akceptacji', MARGIN, y + 36, {
    font: type.display,
    size: 25,
    color: INK,
  });

  const lead: TextStyle = { font: type.sans, size: 10, color: INK_SOFT };
  const lines = wrap(
    'Prosimy sprawdzić projekt przed drukiem\u00a0— produkcję rozpoczynamy dopiero po\u00a0Państwa akceptacji.',
    lead,
    WIDTH
  );
  lines.forEach((line, index) => page.text(line, MARGIN, y + 55 + index * 15, lead));
  return y + 55 + (lines.length - 1) * 15 + 7;
}

function drawMeta(page: PdfPage, type: Type, input: VisualizationPdfInput, y: number): number {
  const label: TextStyle = { font: type.sansBold, size: 6.4, color: INK_SOFT, tracking: 0.5 };
  const value: TextStyle = { font: type.sans, size: 9.6, color: INK };
  const number: TextStyle = { font: type.monoMedium, size: 9.6, color: INK };
  const dateWidth = 112;
  const numberWidth = 132;
  const cells = [
    { label: 'ZAMÓWIENIE', text: input.order.number, style: number, width: numberWidth },
    {
      label: 'KLIENT',
      text: customerName(input.order),
      style: value,
      width: WIDTH - numberWidth - dateWidth * 2,
    },
    { label: 'DATA ZAMÓWIENIA', text: formatDate(input.order.createdAt), style: value, width: dateWidth },
    { label: 'DATA WIZUALIZACJI', text: formatDate(input.issuedAt), style: value, width: dateWidth },
  ];

  let x = MARGIN;
  for (const cell of cells) {
    page.text(cell.label, x, y + 17, label);
    page.text(fit(cell.text, cell.style, cell.width - 14), x, y + 30.5, cell.style);
    x += cell.width;
  }
  return y + 37;
}

/* ── Wizualizacja ───────────────────────────────────────────── */

function drawImage(page: PdfPage, image: PdfImage, y: number, height: number): void {
  page.rect(MARGIN, y, WIDTH, height, {
    fill: SURFACE,
    stroke: LINE,
    lineWidth: 0.75,
    radius: CARD_RADIUS,
  });

  const boxWidth = WIDTH - IMAGE_PADDING * 2;
  const boxHeight = height - IMAGE_PADDING * 2;
  const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
  const width = image.width * scale;
  const drawn = image.height * scale;
  page.image(
    image,
    MARGIN + IMAGE_PADDING + (boxWidth - width) / 2,
    y + IMAGE_PADDING + (boxHeight - drawn) / 2,
    width,
    drawn,
    3
  );
}

/* ── Karta produktu ─────────────────────────────────────────── */

interface SpecRow {
  label: string;
  value: string;
  /** Dopowiedzenie w tej samej linii, cichszym krojem */
  detail?: string;
  /** Nazwy plików składamy krojem mono, jak w serwisie */
  detailMono?: boolean;
  swatch?: Rgb;
}

/** Nakład od pięciu cyfr dzielimy na tysiące — 12 500, ale 2500. */
function formatQuantity(value: number): string {
  const digits = String(value);
  return digits.length > 4 ? digits.replace(/\B(?=(\d{3})+$)/g, '\u00a0') : digits;
}

function specRows(item: CartItem): SpecRow[] {
  const { config } = item;
  const format = FORMAT_MAP[config.format];
  const color = COLOR_MAP[config.color];
  const sides = printSides(config);
  const requiresProduction = needsProduction(config);
  const days = leadTimeDays({ speed: config.shippingSpeed, requiresProduction });

  const printRow = (side: 'przod' | 'zamkniecie'): SpecRow => {
    const spec = sides.find((entry) => entry.side === side);
    const count = spec?.files.length ?? 0;
    return {
      label: PRINT_SIDE_LABEL[side],
      value: spec ? 'Tak' : 'Nie',
      // Jeden plik pokazujemy z nazwy; przy kilku w linii mieści się tylko ich liczba
      detail:
        count === 1
          ? spec!.files[0].name
          : count > 1
            ? `${count} ${plural(count, 'plik', 'pliki', 'plików')}`
            : undefined,
      detailMono: count === 1,
    };
  };

  const personalization: SpecRow = { label: 'Personalizacja', value: 'Nie' };
  if (config.personalization) {
    personalization.value = personalizationScope(config.personalizationScope).label;
    if (config.personalizationMethod === 'reczna') {
      personalization.detail = 'treść z zamówienia';
    } else if (config.personalizationFile) {
      personalization.detail = config.personalizationFile.name;
      personalization.detailMono = true;
    }
  }

  return [
    { label: 'Format', value: config.format, detail: format?.dimensions },
    { label: 'Kolor', value: color?.name ?? config.color, swatch: color ? rgb(color.hex) : undefined },
    {
      label: 'Papier',
      value: color?.weight ? weightLabel(color.weight) : 'ozdobny',
      detail: !color?.weight
        ? undefined
        : hasSurfaceFinish(color.finish)
          ? `ozdobny, wykończenie ${color.finish}`
          : 'ozdobny, barwiony w masie',
    },
    { label: 'Nakład', value: `${formatQuantity(item.price.quantity)} szt.` },
    printRow('przod'),
    printRow('zamkniecie'),
    personalization,
    {
      label: 'Czas realizacji',
      value: `${days} ${plural(days, 'dzień roboczy', 'dni robocze', 'dni roboczych')}`,
      detail: !requiresProduction
        ? undefined
        : config.shippingSpeed === 'ekspres'
          ? 'tryb ekspresowy'
          : 'tryb standardowy',
    },
  ];
}

const PRODUCT_PADDING = 14;
const SPEC_ROW_HEIGHT = 16.5;
const SPEC_ROW_STRETCH = 5;

interface ProductCard {
  eyebrow: string;
  name: string[];
  rows: SpecRow[];
  height: number;
}

function measureProduct(item: CartItem, index: number, total: number, type: Type): ProductCard {
  const name = wrap(
    item.name,
    { font: type.sansBold, size: 11, color: INK },
    PRODUCT_WIDTH - PRODUCT_PADDING * 2,
    3
  );
  const rows = specRows(item);
  return {
    eyebrow: total > 1 ? `POZYCJA ${index + 1} Z ${total}` : 'ZAMAWIANY PRODUKT',
    name,
    rows,
    height: 37 + (name.length - 1) * 14.5 + 13 + rows.length * SPEC_ROW_HEIGHT + 7,
  };
}

function drawProduct(page: PdfPage, type: Type, card: ProductCard, y: number, height: number): void {
  const x = MARGIN;
  const left = x + PRODUCT_PADDING;
  const right = x + PRODUCT_WIDTH - PRODUCT_PADDING;

  page.rect(x, y, PRODUCT_WIDTH, height, {
    fill: SURFACE,
    stroke: LINE,
    lineWidth: 0.75,
    radius: CARD_RADIUS,
  });
  page.text(card.eyebrow, left, y + 20, {
    font: type.sansBold,
    size: 6.4,
    color: INK_SOFT,
    tracking: 0.5,
  });
  card.name.forEach((line, index) =>
    page.text(line, left, y + 37 + index * 14.5, { font: type.sansBold, size: 11, color: INK })
  );

  const label: TextStyle = { font: type.sans, size: 8.6, color: INK_SOFT };
  const value: TextStyle = { font: type.sansBold, size: 8.8, color: INK };
  // Karta wyższa niż jej treść (wyrównana do karty akceptacji) rozdaje zapas
  // wierszom, zamiast zostawiać pustą przestrzeń pod listą
  const rowHeight =
    SPEC_ROW_HEIGHT + Math.min(SPEC_ROW_STRETCH, (height - card.height) / card.rows.length);
  let rowTop = y + 37 + (card.name.length - 1) * 14.5 + 13;

  for (const row of card.rows) {
    const baseline = rowTop + rowHeight / 2 + 3.1;
    page.line(left, rowTop, right, rowTop, LINE, 0.5);
    page.text(row.label, left, baseline, label);

    const detailStyle: TextStyle = row.detailMono
      ? { font: type.mono, size: 7.8, color: INK_SOFT }
      : { font: type.sans, size: 8.6, color: INK_SOFT };
    const room = right - left - textWidth(row.label, label) - 14;
    const valueText = fit(row.value, value, room);
    const valueWidth = textWidth(valueText, value);
    // Dopowiedzenie mieści się w tym, co zostało po wartości; jeśli zostało
    // mniej niż na kilka znaków, lepiej go nie pokazać niż pokazać urwane
    const detailRoom = room - valueWidth - 7;
    const detailText =
      row.detail && detailRoom > 36
        ? (row.detailMono ? fitFileName : fit)(row.detail, detailStyle, detailRoom)
        : '';
    const detailWidth = detailText ? textWidth(detailText, detailStyle) + 7 : 0;

    if (detailText) page.text(detailText, right, baseline, detailStyle, 'right');
    page.text(valueText, right - detailWidth, baseline, value, 'right');
    if (row.swatch) {
      page.rect(right - detailWidth - valueWidth - 12, baseline - 6.6, 7, 7, {
        fill: row.swatch,
        stroke: LINE,
        lineWidth: 0.5,
        radius: 3.5,
      });
    }
    rowTop += rowHeight;
  }
}

/* ── Karta akceptacji ───────────────────────────────────────── */

const ACCEPT_PADDING = 14;
const BUTTON_HEIGHT = 26;

const CHECKLIST = [
  'pisownię nazw, numerów i\u00a0adresów',
  'układ i\u00a0wielkość nadruku',
  'kolor i\u00a0format koperty',
  'nakład i\u00a0parametry zamówienia',
];

function mailto(subject: string, body: string): string {
  // RFC 6068: znak końca linii w treści wiadomości to CRLF
  const encoded = encodeURIComponent(body.replace(/\n/g, '\r\n'));
  return `mailto:${CONTACT_DETAILS.ordersEmail}?subject=${encodeURIComponent(subject)}&body=${encoded}`;
}

interface AcceptCard {
  heading: string[];
  hint: string[];
  height: number;
}

function measureAccept(type: Type): AcceptCard {
  const inner = ACCEPT_WIDTH - ACCEPT_PADDING * 2;
  const heading = wrap(
    'Przed akceptacją prosimy sprawdzić',
    { font: type.display, size: 13, color: INK },
    inner
  );
  const hint = wrap(
    `Przyciski otwierają gotową wiadomość na\u00a0adres ${CONTACT_DETAILS.ordersEmail}. Można też odpowiedzieć na\u00a0wiadomość, w\u00a0której przesłaliśmy ten plik.`,
    { font: type.sans, size: 7.4, color: INK_SOFT },
    inner
  );
  return {
    heading,
    hint,
    height:
      26 +
      (heading.length - 1) * 16 +
      12 +
      CHECKLIST.length * 14 +
      8 +
      BUTTON_HEIGHT * 2 +
      7 +
      14 +
      (hint.length - 1) * 10 +
      12,
  };
}

function drawAccept(
  page: PdfPage,
  type: Type,
  card: AcceptCard,
  input: VisualizationPdfInput,
  y: number,
  height: number
): void {
  const x = MARGIN + PRODUCT_WIDTH + GAP;
  const left = x + ACCEPT_PADDING;
  const inner = ACCEPT_WIDTH - ACCEPT_PADDING * 2;
  const { number } = input.order;
  const version = `wersja ${input.version}`;

  // Język `.notice-seal`: tło zaznaczenia i granatowa krawędź z lewej
  page.rect(x, y, ACCEPT_WIDTH, height, {
    fill: SEAL_WASH,
    stroke: LINE,
    lineWidth: 0.75,
    radius: CARD_RADIUS,
  });
  page.clipped(x, y, ACCEPT_WIDTH, height, CARD_RADIUS, () =>
    page.rect(x, y, 2.5, height, { fill: SEAL })
  );

  card.heading.forEach((line, index) =>
    page.text(line, left, y + 26 + index * 16, { font: type.display, size: 13, color: INK })
  );

  let cursor = y + 26 + (card.heading.length - 1) * 16 + 12;
  for (const entry of CHECKLIST) {
    const baseline = cursor + 9;
    page.polyline(
      [
        [left + 0.8, baseline - 3],
        [left + 3.2, baseline - 0.6],
        [left + 7.6, baseline - 5.6],
      ],
      SEAL,
      1.3
    );
    page.text(entry, left + 13, baseline, { font: type.sans, size: 8.8, color: INK });
    cursor += 14;
  }
  cursor += 8;

  const buttons = [
    {
      label: 'Akceptuję projekt',
      primary: true,
      uri: mailto(
        `Akceptacja wizualizacji — zamówienie ${number} (${version})`,
        `Akceptuję wizualizację (${version}) do zamówienia ${number} i zatwierdzam projekt do druku.\n`
      ),
    },
    {
      label: 'Zgłaszam uwagi',
      primary: false,
      uri: mailto(
        `Uwagi do wizualizacji — zamówienie ${number} (${version})`,
        `Uwagi do wizualizacji (${version}) do zamówienia ${number}:\n\n1. `
      ),
    },
  ];
  for (const button of buttons) {
    page.rect(
      left,
      cursor,
      inner,
      BUTTON_HEIGHT,
      button.primary
        ? { fill: SEAL, radius: 5 }
        : { fill: SURFACE, stroke: LINE, lineWidth: 0.75, radius: 5 }
    );
    page.text(
      button.label,
      left + inner / 2,
      cursor + BUTTON_HEIGHT / 2 + 3.3,
      { font: type.sansBold, size: 9.4, color: button.primary ? SURFACE : INK },
      'center'
    );
    page.link(left, cursor, inner, BUTTON_HEIGHT, button.uri, `${button.label} — wiadomość e-mail`);
    cursor += BUTTON_HEIGHT + 7;
  }

  card.hint.forEach((line, index) =>
    page.text(line, left, cursor + 7 + index * 10, { font: type.sans, size: 7.4, color: INK_SOFT })
  );
}

/* ── Zasady akceptacji (Regulamin §8 i §9) ──────────────────── */

const NOTES = [
  {
    title: 'Akceptacja zatwierdza druk',
    body: 'To ostatni moment na\u00a0korektę treści, pisowni i\u00a0układu projektu.',
  },
  {
    title: 'Dwie korekty w\u00a0cenie',
    body: 'Uwagi najlepiej zebrać w\u00a0jednej wiadomości\u00a0— przygotujemy kolejną wersję.',
  },
  {
    title: 'Kolory poglądowe',
    body: 'Odcień widoczny na\u00a0ekranie może różnić się od\u00a0wydruku na\u00a0papierze.',
  },
];

const NOTE_GAP = 18;
const NOTE_WIDTH = (WIDTH - NOTE_GAP * (NOTES.length - 1)) / NOTES.length;

function measureNotes(type: Type): { bodies: string[][]; height: number } {
  const bodies = NOTES.map((note) =>
    wrap(note.body, { font: type.sans, size: 7.8, color: INK_SOFT }, NOTE_WIDTH)
  );
  return { bodies, height: 10 + Math.max(...bodies.map((lines) => lines.length)) * 10.5 + 2 };
}

function drawNotes(page: PdfPage, type: Type, bodies: string[][], y: number): void {
  NOTES.forEach((note, index) => {
    const x = MARGIN + index * (NOTE_WIDTH + NOTE_GAP);
    page.text(note.title, x, y + 8, { font: type.sansBold, size: 8.2, color: INK });
    bodies[index].forEach((line, lineIndex) =>
      page.text(line, x, y + 19.5 + lineIndex * 10.5, { font: type.sans, size: 7.8, color: INK_SOFT })
    );
  });
}

/* ── Dokument ───────────────────────────────────────────────── */

export async function buildVisualizationPdf(
  input: VisualizationPdfInput
): Promise<Uint8Array<ArrayBuffer>> {
  const { order, version } = input;
  const items = input.items.length ? input.items : order.items;

  const doc = new PdfDocument({
    title: `Wizualizacja do akceptacji — zamówienie ${order.number} (wersja ${version})`,
    author: CONTACT_DETAILS.brand,
    subject: items.map((item) => item.name).join('; '),
    creator: 'Envelopes — generator wizualizacji',
    language: 'pl-PL',
    createdAt: input.issuedAt,
  });

  const face = (role: VisualizationFontRole) =>
    parseTrueType(input.fonts[role], VISUALIZATION_FONTS[role].name);
  const type: Type = {
    display: doc.addFont(face('display'), { serif: true, bold: true }),
    sans: doc.addFont(face('sans')),
    sansBold: doc.addFont(face('sansBold'), { bold: true }),
    mono: doc.addFont(face('mono'), { fixedPitch: true }),
    monoMedium: doc.addFont(face('monoMedium'), { fixedPitch: true }),
  };
  const image = doc.addJpeg(input.image.data, input.image.width, input.image.height);

  const pages: PdfPage[] = [];
  let page!: PdfPage;
  /** Otwiera kolejną stronę i zwraca położenie pierwszej wolnej linii. */
  const newPage = (): number => {
    page = doc.addPage();
    pages.push(page);
    return drawHeader(page, type, version);
  };

  let y = newPage();
  y = drawTitle(page, type, y);
  y = drawMeta(page, type, input, y) + GAP;

  const products = items.map((item, index) => measureProduct(item, index, items.length, type));
  const accept = measureAccept(type);
  const notes = measureNotes(type);
  const productsHeight =
    products.reduce((sum, card) => sum + card.height, 0) + GAP * (products.length - 1);
  const rowHeight = Math.max(productsHeight, accept.height);

  // Wysokość karty, przy której obraz wypełnia całą jej szerokość
  const natural =
    ((WIDTH - IMAGE_PADDING * 2) * input.image.height) / input.image.width + IMAGE_PADDING * 2;
  const room = BOTTOM - y - GAP - rowHeight - GAP - notes.height;
  const singlePage = room >= Math.min(natural, IMAGE_MIN_HEIGHT);
  const imageHeight = Math.min(natural, singlePage ? room : BOTTOM - y - NEXT_PAGE_NOTE);

  drawImage(page, image, y, imageHeight);
  if (singlePage) {
    y += imageHeight + GAP;
  } else {
    page.text(
      'Szczegóły zamówienia i\u00a0przyciski akceptacji znajdują się na\u00a0następnej stronie.',
      MARGIN,
      y + imageHeight + 16,
      { font: type.sans, size: 8.6, color: INK_SOFT }
    );
    y = newPage() + 18;
  }

  // Karta akceptacji zostaje na stronie, na której zaczyna się rząd; karty
  // produktów w razie potrzeby płyną dalej na kolejne strony
  const rowPage = page;
  const single = products.length === 1;
  drawAccept(rowPage, type, accept, input, y, single ? rowHeight : accept.height);

  let productY = y;
  for (const card of products) {
    if (productY + card.height > BOTTOM) productY = newPage() + 18;
    drawProduct(page, type, card, productY, single ? rowHeight : card.height);
    productY += (single ? rowHeight : card.height) + GAP;
  }
  y = page === rowPage ? Math.max(productY, y + accept.height + GAP) : productY;

  if (y + notes.height > BOTTOM) y = newPage() + 18;
  drawNotes(page, type, notes.bodies, y);

  pages.forEach((entry, index) => drawFooter(entry, type, index, pages.length));
  return doc.save();
}
