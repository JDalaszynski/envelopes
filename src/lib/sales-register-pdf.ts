import { formatDay, warsawDay, warsawTime } from './accounting';
import { CONTACT_DETAILS } from './orders';
import { parseTrueType } from './pdf-font';
import { PdfDocument, rgb, type PdfFont, type PdfPage, type TextStyle } from './pdf-writer';
import { plural } from './pricing';
import {
  P24_STATUS_LABEL,
  monthBounds,
  monthLabel,
  type RegisterCheck,
  type RegisterRow,
  type SalesRegister,
} from './sales-register';
import { VISUALIZATION_FONTS, type VisualizationFontRole } from './visualization-pdf';

/**
 * PDF ewidencji sprzedaży — ten sam zestaw danych, który Admin widzi
 * w podglądzie, złożony do druku i archiwum. Arkusz A4 poziomo, bo jeden
 * wiersz niesie zamówienie, fakturę i transakcję obok siebie.
 *
 * Dokument powstaje w przeglądarce z odpowiedzi `/api/ewidencja`, więc PDF
 * nie może pokazać niczego innego niż podgląd. Kroje i pisarz PDF są te same
 * co w wizualizacji (`visualization-pdf.ts`).
 */

export interface RegisterPdfInput {
  register: SalesRegister;
  fonts: Record<VisualizationFontRole, Uint8Array>;
}

export function registerFileName(register: SalesRegister): string {
  return `ewidencja-sprzedazy-${register.month}.pdf`;
}

/* ── Arkusz i kolory (tokeny z `globals.css`) ───────────────── */

const PAGE = { width: 841.89, height: 595.28 };
const MARGIN = 30;
const WIDTH = PAGE.width - MARGIN * 2;
const TOP = 30;
const FOOTER_RULE = PAGE.height - 30;
const BOTTOM = FOOTER_RULE - 10;

const PAPER = rgb('#f4f2ec');
const INK = rgb('#1f2430');
const INK_SOFT = rgb('#575e6e');
const LINE = rgb('#dcd8cc');
const ERROR = rgb('#9c4221');
const WARN = rgb('#7a5c1e');

const PAD_X = 4;
const PAD_Y = 4.5;

interface Type {
  display: PdfFont;
  sans: PdfFont;
  sansBold: PdfFont;
  mono: PdfFont;
  monoMedium: PdfFont;
}

interface Para {
  text: string;
  style: TextStyle;
}

interface Column {
  label: string;
  width: number;
  align?: 'right';
}

function lineHeight(style: TextStyle): number {
  return style.size + 2.4;
}

/**
 * Łamie akapit do szerokości kolumny. Ciąg bez spacji dłuższy od kolumny —
 * numer KSeF, adres e-mail — dzielimy w środku: w ewidencji nie wolno niczego
 * ucinać wielokropkiem.
 */
function wrap(para: Para, maxWidth: number): string[] {
  const { style } = para;
  const measure = (text: string) => style.font.width(text, style.size, style.tracking);
  const lines: string[] = [];
  let line = '';

  for (const word of para.text.split(' ')) {
    let token = word;
    while (measure(token) > maxWidth && token.length > 1) {
      let cut = token.length - 1;
      while (cut > 1 && measure(token.slice(0, cut)) > maxWidth) cut -= 1;
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(token.slice(0, cut));
      token = token.slice(cut);
    }
    const candidate = line ? `${line} ${token}` : token;
    if (!line || measure(candidate) <= maxWidth) line = candidate;
    else {
      lines.push(line);
      line = token;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Kwota z odstępem tysięcy; walutę niesie nagłówek kolumny. */
function money(value: number): string {
  const [whole, fraction] = Math.abs(value).toFixed(2).split('.');
  // Twarda spacja: kwota nie może złamać się w kolumnie na dwie linie
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${value < 0 ? '-' : ''}${grouped},${fraction}`;
}

class Sheet {
  readonly pages: PdfPage[] = [];
  page!: PdfPage;
  y = TOP;

  constructor(private readonly doc: PdfDocument) {
    this.addPage();
  }

  addPage(): void {
    this.page = this.doc.addPage(PAGE.width, PAGE.height);
    this.pages.push(this.page);
    this.y = TOP;
  }

  /** Przechodzi na nową stronę, jeśli blok o tej wysokości się nie zmieści. */
  ensure(height: number, onBreak?: () => void): void {
    if (this.y + height <= BOTTOM) return;
    this.addPage();
    onBreak?.();
  }
}

function measureRow(columns: Column[], cells: Para[][]): { lines: string[][][]; height: number } {
  const lines = cells.map((cell, index) =>
    cell.map((para) => wrap(para, columns[index].width - PAD_X * 2))
  );
  const height = Math.max(
    ...cells.map((cell, index) =>
      cell.reduce((sum, para, i) => sum + lines[index][i].length * lineHeight(para.style), 0)
    ),
    0
  );
  return { lines, height: height + PAD_Y * 2 };
}

function drawRow(sheet: Sheet, columns: Column[], cells: Para[][], lines: string[][][]): void {
  let x = MARGIN;
  cells.forEach((cell, index) => {
    const column = columns[index];
    let baseline = sheet.y + PAD_Y;
    cell.forEach((para, i) => {
      for (const text of lines[index][i]) {
        baseline += lineHeight(para.style);
        if (column.align === 'right') {
          sheet.page.text(text, x + column.width - PAD_X, baseline - 2.4, para.style, 'right');
        } else {
          sheet.page.text(text, x + PAD_X, baseline - 2.4, para.style);
        }
      }
    });
    x += column.width;
  });
}

function drawTableHead(sheet: Sheet, type: Type, columns: Column[]): void {
  const style: TextStyle = { font: type.sansBold, size: 5.8, color: INK_SOFT, tracking: 0.35 };
  const cells = columns.map((column) => [{ text: column.label.toUpperCase(), style }]);
  const { lines, height } = measureRow(columns, cells);
  sheet.page.rect(MARGIN, sheet.y, WIDTH, height, { fill: PAPER });
  drawRow(sheet, columns, cells, lines);
  sheet.y += height;
  sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, LINE);
}

/* ── Tabela główna ──────────────────────────────────────────── */

const MAIN_COLUMNS: Column[] = [
  { label: 'Lp.', width: 22 },
  { label: 'Data sprzedaży', width: 46 },
  { label: 'Zamówienie w sklepie', width: 88 },
  { label: 'Nabywca', width: 126 },
  { label: 'Przedmiot sprzedaży', width: 134 },
  { label: 'Faktura (inFakt)', width: 96 },
  { label: 'Netto zł', width: 52, align: 'right' },
  { label: 'VAT zł', width: 46, align: 'right' },
  { label: 'Brutto zł', width: 54, align: 'right' },
  { label: 'Zapłata', width: WIDTH - 664 },
];

/**
 * Numer KSeF (NIP-data-identyfikator-suma) nie mieści się w kolumnie w jednej
 * linii — dzielimy go po dacie, a nie w przypadkowym miejscu.
 */
function ksefLines(number: string): string[] {
  const parts = number.split('-');
  return parts.length >= 4
    ? [`KSeF ${parts[0]}-${parts[1]}-`, parts.slice(2).join('-')]
    : [`KSeF ${number}`];
}

function rowCells(row: RegisterRow, type: Type): Para[][] {
  const text: TextStyle = { font: type.sans, size: 6.8, color: INK };
  const soft: TextStyle = { font: type.sans, size: 6.2, color: INK_SOFT };
  const mono: TextStyle = { font: type.mono, size: 6.6, color: INK };
  const monoStrong: TextStyle = { font: type.monoMedium, size: 6.6, color: INK };
  const tiny: TextStyle = { font: type.mono, size: 5.4, color: INK_SOFT };
  const alert: TextStyle = { font: type.sansBold, size: 6.6, color: ERROR };

  const { invoice, payment } = row;

  const invoiceCell: Para[] = invoice
    ? [
        { text: invoice.number, style: monoStrong },
        { text: `wyst. ${formatDay(invoice.invoiceDate)}`, style: soft },
        ...(invoice.ksefNumber
          ? ksefLines(invoice.ksefNumber).map((text) => ({ text, style: tiny }))
          : invoice.ksefStatus === 'sent' || invoice.ksefStatus === 'pending'
            ? [{ text: 'KSeF: w trakcie przetwarzania', style: soft }]
            : []),
      ]
    : [{ text: 'brak faktury', style: alert }];

  const paymentCell: Para[] = [
    { text: payment.label, style: text },
    {
      text: payment.paid
        ? `zapłacono ${formatDay(payment.paidDay)}`
        : `nieopłacone${payment.dueDay ? `, termin ${formatDay(payment.dueDay)}` : ''}`,
      style: soft,
    },
  ];
  if (payment.transaction) paymentCell.push({ text: `P24 nr ${payment.transaction}`, style: mono });
  if (payment.p24Status !== null) {
    paymentCell.push({
      text:
        `wg bramki: ${P24_STATUS_LABEL[payment.p24Status] ?? payment.p24Status}` +
        (payment.p24Amount !== null ? `, ${money(payment.p24Amount)} zł` : ''),
      style: soft,
    });
  }
  if (payment.statement) paymentCell.push({ text: `tytuł: ${payment.statement}`, style: soft });
  if (payment.batchId) paymentCell.push({ text: `wypłata nr ${payment.batchId}`, style: soft });

  return [
    [{ text: String(row.lp), style: mono }],
    [
      { text: formatDay(row.day), style: text },
      ...(row.basis === 'zaplata' ? [{ text: 'wg wpłaty', style: soft }] : []),
    ],
    [
      { text: row.orderNumber, style: mono },
      { text: `z ${formatDay(row.orderDay)}`, style: soft },
    ],
    [
      { text: row.buyer.name, style: text },
      ...(row.buyer.nip ? [{ text: `NIP ${row.buyer.nip}`, style: soft }] : []),
      { text: row.buyer.address, style: soft },
    ],
    row.lines.map((line) => ({
      // Twarde spacje trzymają „— 100 szt.” razem, gdy nazwa łamie się na końcu kolumny
      text: line.unit === 'szt.' ? `${line.name} —\u00a0${line.quantity}\u00a0szt.` : line.name,
      style: text,
    })),
    invoiceCell,
    [{ text: money(row.net), style: mono }],
    [{ text: money(row.vat), style: mono }],
    [{ text: money(row.gross), style: monoStrong }],
    paymentCell,
  ];
}

/** Uwagi do wiersza — pod nim, od kolumny zamówienia do prawego marginesu. */
function checkLines(checks: RegisterCheck[], type: Type): { para: Para; lines: string[] }[] {
  const indent = MAIN_COLUMNS[0].width + MAIN_COLUMNS[1].width;
  return checks.map((check) => {
    const para: Para = {
      text: `${check.level === 'blad' ? 'BŁĄD' : 'UWAGA'}: ${check.message}`,
      style: { font: type.sansBold, size: 6.2, color: check.level === 'blad' ? ERROR : WARN },
    };
    return { para, lines: wrap(para, WIDTH - indent - PAD_X * 2) };
  });
}

function drawMainTable(sheet: Sheet, type: Type, register: SalesRegister): void {
  const head = () => drawTableHead(sheet, type, MAIN_COLUMNS);
  sheet.ensure(60);
  head();

  if (register.rows.length === 0) {
    sheet.page.text('Brak sprzedaży w tym miesiącu.', MARGIN + PAD_X, sheet.y + 16, {
      font: type.sans,
      size: 8,
      color: INK_SOFT,
    });
    sheet.y += 26;
    sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, LINE);
    return;
  }

  const indent = MAIN_COLUMNS[0].width + MAIN_COLUMNS[1].width;
  for (const row of register.rows) {
    const cells = rowCells(row, type);
    const { lines, height } = measureRow(MAIN_COLUMNS, cells);
    const checks = checkLines(row.checks, type);
    const checksHeight = checks.reduce(
      (sum, check) => sum + check.lines.length * lineHeight(check.para.style),
      0
    );

    sheet.ensure(height + checksHeight + (checks.length ? 3 : 0), head);
    drawRow(sheet, MAIN_COLUMNS, cells, lines);
    sheet.y += height;

    if (checks.length) {
      let baseline = sheet.y - 2;
      for (const check of checks) {
        for (const text of check.lines) {
          baseline += lineHeight(check.para.style);
          sheet.page.text(text, MARGIN + indent + PAD_X, baseline - 2.4, check.para.style);
        }
      }
      sheet.y += checksHeight + 3;
    }
    sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, LINE, 0.5);
  }

  const strong: TextStyle = { font: type.sansBold, size: 7, color: INK };
  const number: TextStyle = { font: type.monoMedium, size: 6.8, color: INK };
  const totalRow = (label: string, amounts: { net: number; vat: number; gross: number }) => {
    const cells: Para[][] = MAIN_COLUMNS.map(() => []);
    cells[4] = [{ text: label, style: strong }];
    cells[6] = [{ text: money(amounts.net), style: number }];
    cells[7] = [{ text: money(amounts.vat), style: number }];
    cells[8] = [{ text: money(amounts.gross), style: number }];
    const measured = measureRow(MAIN_COLUMNS, cells);
    sheet.ensure(measured.height, head);
    drawRow(sheet, MAIN_COLUMNS, cells, measured.lines);
    sheet.y += measured.height;
  };

  const { totals } = register;
  sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, INK, 0.9);
  totalRow(`Razem sprzedaż (${totals.sales.count})`, totals.sales);
  if (totals.corrections.count > 0) {
    totalRow(`Faktury korygujące (${totals.corrections.count})`, totals.corrections);
    totalRow('Razem po korektach', totals.afterCorrections);
  }
  sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, LINE);
}

/* ── Sekcje pod tabelą ──────────────────────────────────────── */

function drawSection(
  sheet: Sheet,
  type: Type,
  title: string,
  lead: string,
  columns: Column[],
  rows: Para[][][]
): void {
  const heading: TextStyle = { font: type.sansBold, size: 9, color: INK };
  const leadPara: Para = { text: lead, style: { font: type.sans, size: 7, color: INK_SOFT } };
  const leadLines = wrap(leadPara, WIDTH);

  sheet.ensure(60 + leadLines.length * lineHeight(leadPara.style));
  sheet.y += 18;
  sheet.page.text(title, MARGIN, sheet.y, heading);
  for (const line of leadLines) {
    sheet.y += lineHeight(leadPara.style);
    sheet.page.text(line, MARGIN, sheet.y, leadPara.style);
  }
  sheet.y += 8;

  const head = () => drawTableHead(sheet, type, columns);
  head();
  for (const cells of rows) {
    const { lines, height } = measureRow(columns, cells);
    sheet.ensure(height, head);
    drawRow(sheet, columns, cells, lines);
    sheet.y += height;
    sheet.page.line(MARGIN, sheet.y, MARGIN + WIDTH, sheet.y, LINE, 0.5);
  }
}

function drawParagraphs(sheet: Sheet, type: Type, title: string, paragraphs: string[]): void {
  const heading: TextStyle = { font: type.sansBold, size: 9, color: INK };
  const body: TextStyle = { font: type.sans, size: 7, color: INK_SOFT };
  sheet.ensure(50);
  sheet.y += 18;
  sheet.page.text(title, MARGIN, sheet.y, heading);
  sheet.y += 4;
  for (const text of paragraphs) {
    const lines = wrap({ text, style: body }, WIDTH);
    sheet.ensure(lines.length * lineHeight(body) + 4);
    for (const line of lines) {
      sheet.y += lineHeight(body);
      sheet.page.text(line, MARGIN, sheet.y, body);
    }
    sheet.y += 3;
  }
}

/* ── Nagłówek pierwszej strony i stopki ─────────────────────── */

function drawTitle(sheet: Sheet, type: Type, register: SalesRegister): void {
  const { page } = sheet;
  const bounds = monthBounds(register.month);
  const soft: TextStyle = { font: type.sans, size: 8, color: INK_SOFT };

  page.text('Ewidencja sprzedaży', MARGIN, TOP + 20, { font: type.display, size: 22, color: INK });
  page.text(
    `${monthLabel(register.month)} · okres ${formatDay(bounds.from)} – ${formatDay(bounds.to)}`,
    MARGIN,
    TOP + 36,
    { font: type.sans, size: 9.5, color: INK }
  );

  const right = MARGIN + WIDTH;
  page.text(`${CONTACT_DETAILS.company} · ${CONTACT_DETAILS.brand}`, right, TOP + 10, {
    font: type.sansBold,
    size: 8.5,
    color: INK,
  }, 'right');
  page.text(CONTACT_DETAILS.address, right, TOP + 22, soft, 'right');
  page.text(`NIP ${CONTACT_DETAILS.nip} · REGON ${CONTACT_DETAILS.regon}`, right, TOP + 33, soft, 'right');
  page.line(MARGIN, TOP + 46, right, TOP + 46, LINE);
  sheet.y = TOP + 56;

  /* Kafle podsumowania */
  const { totals, issues } = register;
  const tiles: [string, string][] = [
    ['Sprzedaż', String(totals.sales.count)],
    ['Netto', `${money(totals.sales.net)} zł`],
    ['VAT', `${money(totals.sales.vat)} zł`],
    ['Brutto', `${money(totals.sales.gross)} zł`],
    ['Opłacone przez Przelewy24', `${money(totals.paidGateway.gross)} zł`],
    ['Opłacone przelewem', `${money(totals.paidTransfer.gross)} zł`],
    [
      'Do wyjaśnienia',
      `${issues.errors} ${plural(issues.errors, 'błąd', 'błędy', 'błędów')} · ` +
        `${issues.warnings} ${plural(issues.warnings, 'uwaga', 'uwagi', 'uwag')}`,
    ],
  ];
  const gap = 6;
  const tileWidth = (WIDTH - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([label, value], index) => {
    const x = MARGIN + index * (tileWidth + gap);
    page.rect(x, sheet.y, tileWidth, 34, { fill: PAPER, radius: 4 });
    page.text(label.toUpperCase(), x + 7, sheet.y + 12, {
      font: type.sansBold,
      size: 5.6,
      color: INK_SOFT,
      tracking: 0.35,
    });
    const alarm = index === tiles.length - 1 && issues.errors > 0;
    page.text(value, x + 7, sheet.y + 26, {
      font: type.monoMedium,
      size: index === tiles.length - 1 ? 7.4 : 9,
      color: alarm ? ERROR : INK,
    });
  });
  sheet.y += 34 + 10;

  /* Skąd pochodzą dane — kontrolujący musi wiedzieć, co z czym porównano */
  const { sources } = register;
  const infakt =
    sources.infakt.state === 'ok'
      ? `inFakt, odczyt ${formatDay(warsawDay(register.generatedAt))} ${warsawTime(register.generatedAt)}` +
        (sources.infakt.sandbox ? ' (konto testowe)' : '')
      : sources.infakt.state === 'blad'
        ? 'inFakt był niedostępny — dane faktur z ostatniego zapisu w sklepie'
        : 'inFakt nieskonfigurowany — dane faktur z zapisu w sklepie';
  const p24 =
    sources.p24.state === 'ok'
      ? 'Przelewy24, transakcje potwierdzone odczytem z bramki'
      : sources.p24.state === 'blad'
        ? 'Przelewy24 — części transakcji nie udało się potwierdzić'
        : 'Przelewy24 nieskonfigurowane — dane z zapisu w sklepie';
  const line = `Źródła: zamówienia — sklep envelopes.pl · faktury — ${infakt} · płatności — ${p24}.`;
  for (const text of wrap({ text: line, style: soft }, WIDTH)) {
    page.text(text, MARGIN, sheet.y + 6, soft);
    sheet.y += lineHeight(soft);
  }
  sheet.y += 8;
}

function drawFooters(sheet: Sheet, type: Type, register: SalesRegister): void {
  const style: TextStyle = { font: type.sans, size: 6.8, color: INK_SOFT };
  const baseline = FOOTER_RULE + 13;
  const stamp = `Wygenerowano ${formatDay(warsawDay(register.generatedAt))} ${warsawTime(register.generatedAt)}`;
  sheet.pages.forEach((page, index) => {
    page.line(MARGIN, FOOTER_RULE, MARGIN + WIDTH, FOOTER_RULE, LINE);
    page.text(
      `Ewidencja sprzedaży · ${monthLabel(register.month)} · ${CONTACT_DETAILS.company}, NIP ${CONTACT_DETAILS.nip}`,
      MARGIN,
      baseline,
      style
    );
    page.text(`Strona ${index + 1} z ${sheet.pages.length}`, MARGIN + WIDTH / 2, baseline, style, 'center');
    page.text(stamp, MARGIN + WIDTH, baseline, style, 'right');
  });
}

/* ── Dokument ───────────────────────────────────────────────── */

export async function buildRegisterPdf(input: RegisterPdfInput): Promise<Uint8Array<ArrayBuffer>> {
  const { register } = input;
  const doc = new PdfDocument({
    title: `Ewidencja sprzedaży — ${monthLabel(register.month)}`,
    author: `${CONTACT_DETAILS.company} · ${CONTACT_DETAILS.brand}`,
    subject: 'Powiązanie zamówień sklepu, faktur z inFakt i transakcji Przelewy24',
    creator: 'Envelopes — ewidencja sprzedaży',
    language: 'pl-PL',
    createdAt: new Date(register.generatedAt),
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

  const sheet = new Sheet(doc);
  drawTitle(sheet, type, register);
  drawMainTable(sheet, type, register);

  const text: TextStyle = { font: type.sans, size: 6.8, color: INK };
  const soft: TextStyle = { font: type.sans, size: 6.2, color: INK_SOFT };
  const mono: TextStyle = { font: type.mono, size: 6.6, color: INK };

  if (register.unlinkedInvoices.length > 0) {
    drawSection(
      sheet,
      type,
      'Faktury w inFakt bez zamówienia w sklepie',
      'Faktury z datą sprzedaży w tym miesiącu, których nie przypisano do żadnego zamówienia — sprzedaż poza sklepem albo faktura do powiązania. Nie wchodzą do sum ewidencji.',
      [
        { label: 'Faktura', width: 90 },
        { label: 'Data wystawienia', width: 70 },
        { label: 'Data sprzedaży', width: 70 },
        { label: 'Nabywca', width: 200 },
        { label: 'Netto zł', width: 60, align: 'right' },
        { label: 'VAT zł', width: 55, align: 'right' },
        { label: 'Brutto zł', width: 60, align: 'right' },
        { label: 'Prawdopodobne zamówienie', width: WIDTH - 605 },
      ],
      register.unlinkedInvoices.map((invoice) => [
        [{ text: invoice.number, style: mono }],
        [{ text: formatDay(invoice.invoiceDate), style: text }],
        [{ text: formatDay(invoice.saleDate), style: text }],
        [
          { text: invoice.client || '—', style: text },
          ...(invoice.nip ? [{ text: `NIP ${invoice.nip}`, style: soft }] : []),
        ],
        [{ text: money(invoice.net), style: mono }],
        [{ text: money(invoice.vat), style: mono }],
        [{ text: money(invoice.gross), style: mono }],
        invoice.suggestion
          ? [
              { text: invoice.suggestion.orderNumber, style: mono },
              { text: invoice.suggestion.basis, style: soft },
            ]
          : [{ text: '—', style: soft }],
      ])
    );
  }

  if (register.corrections.length > 0) {
    drawSection(
      sheet,
      type,
      'Faktury korygujące',
      'Korekty wystawione w tym miesiącu. Kwoty to różnica wynikająca z korekty.',
      [
        { label: 'Korekta', width: 100 },
        { label: 'Data wystawienia', width: 70 },
        { label: 'Do faktury', width: 90 },
        { label: 'Zamówienie', width: 100 },
        { label: 'Nabywca i przyczyna', width: WIDTH - 535 },
        { label: 'Netto zł', width: 60, align: 'right' },
        { label: 'VAT zł', width: 55, align: 'right' },
        { label: 'Brutto zł', width: 60, align: 'right' },
      ],
      register.corrections.map((correction) => [
        [{ text: correction.number, style: mono }],
        [{ text: formatDay(correction.invoiceDate), style: text }],
        [{ text: correction.correctedNumber || '—', style: mono }],
        [{ text: correction.orderNumber ?? '—', style: mono }],
        [
          { text: correction.client || '—', style: text },
          ...(correction.reason ? [{ text: correction.reason, style: soft }] : []),
        ],
        [{ text: money(correction.net), style: mono }],
        [{ text: money(correction.vat), style: mono }],
        [{ text: money(correction.gross), style: mono }],
      ])
    );
  }

  if (register.pendingOrders.length > 0) {
    drawSection(
      sheet,
      type,
      'Zamówienia nieopłacone i bez faktury',
      'Złożone w tym miesiącu, bez wpłaty i bez faktury — sprzedażą jeszcze nie są, więc nie wchodzą do ewidencji.',
      [
        { label: 'Zamówienie', width: 110 },
        { label: 'Data', width: 70 },
        { label: 'Zamawiający', width: 260 },
        { label: 'Sposób zapłaty', width: WIDTH - 520 },
        { label: 'Brutto zł', width: 80, align: 'right' },
      ],
      register.pendingOrders.map((order) => [
        [{ text: order.orderNumber, style: mono }],
        [{ text: formatDay(order.orderDay), style: text }],
        [{ text: order.buyer, style: text }],
        [{ text: order.label, style: text }],
        [{ text: money(order.gross), style: mono }],
      ])
    );
  }

  drawParagraphs(sheet, type, 'Objaśnienia', [
    'Wiersz ewidencji łączy trzy zapisy jednej sprzedaży: zamówienie w sklepie envelopes.pl (numer ENV-…), fakturę wystawioną w inFakt i zapłatę. Numer zamówienia jest identyfikatorem transakcji (sessionId) w Przelewy24, tytułem przelewu przy płatności tradycyjnej i stoi w uwagach faktury.',
    'Sprzedaż należy do miesiąca wg daty sprzedaży z faktury. Opłacone zamówienie, które nie ma jeszcze faktury, stoi w miesiącu wpłaty z adnotacją „wg wpłaty”. Kwoty netto, VAT i brutto pochodzą z faktury, a przy jej braku — z zamówienia.',
    'Przy płatności przez Przelewy24 kolumna „Zapłata” podaje numer transakcji nadany przez bramkę, jej status i kwotę odczytane z Przelewy24, tytuł, pod którym wpłata trafia na rachunek, oraz numer paczki wypłaty. Adnotacje BŁĄD i UWAGA pod wierszem wskazują rozbieżności między zamówieniem, fakturą i płatnością.',
  ]);

  drawFooters(sheet, type, register);
  return doc.save();
}
