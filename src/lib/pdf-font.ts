/**
 * Czytanie i przycinanie fontów TrueType dla dokumentów PDF składanych
 * w krojach marki (Fraunces, IBM Plex Sans, IBM Plex Mono).
 *
 * `pdf.ts` obywa się bez plików fontów, bo faktury i dokumenty prawne idą
 * wbudowaną Helvetiką. Dokument, który klient ma obejrzeć i zaakceptować,
 * musi wyglądać jak reszta serwisu, a to wymaga osadzenia kroju. Do osadzenia
 * potrzebne są trzy rzeczy i tylko je ten moduł potrafi: mapa znak → glif
 * (`cmap`), szerokości glifów (`hmtx`) do łamania i wyrównywania tekstu oraz
 * przycięcie pliku do glifów faktycznie użytych w dokumencie.
 *
 * Moduł działa tak samo w przeglądarce i w Node — operuje wyłącznie na
 * `Uint8Array` i `DataView`.
 */

export interface TrueTypeFont {
  /** Nazwa PostScript, np. `IBMPlexSans-Regular` */
  name: string;
  /** Metryki w tysięcznych firetu — w jednostkach, w jakich liczy PDF */
  ascent: number;
  descent: number;
  capHeight: number;
  bbox: [number, number, number, number];
  /** Indeks glifu dla punktu kodowego; 0 oznacza brak znaku w kroju */
  glyphFor(codePoint: number): number;
  /** Szerokość glifu w tysięcznych firetu */
  advance(glyphId: number): number;
  /** Plik fontu ograniczony do podanych glifów, z zachowaniem ich indeksów */
  subset(glyphIds: Iterable<number>): Uint8Array<ArrayBuffer>;
}

interface TableRecord {
  offset: number;
  length: number;
}

/** Flagi glifu złożonego (tabela `glyf`) */
const ARG_1_AND_2_ARE_WORDS = 0x0001;
const WE_HAVE_A_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
const WE_HAVE_A_TWO_BY_TWO = 0x0080;

/**
 * Tabele, które musi nieść font osadzony w PDF jako CIDFontType2. `cmap`,
 * `name`, `post` i tabele OpenType są zbędne: dokument adresuje glify
 * bezpośrednio po indeksie, a tekst do kopiowania opisuje osobna mapa
 * ToUnicode. Trzy ostatnie to programy hintingu — kopiujemy je, jeśli są.
 */
const EMBEDDED_TABLES = ['head', 'hhea', 'maxp', 'hmtx', 'loca', 'glyf', 'cvt ', 'fpgm', 'prep'];

function pad4(length: number): number {
  return (length + 3) & ~3;
}

function tableChecksum(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let sum = 0;
  for (let i = 0; i + 4 <= bytes.byteLength; i += 4) sum = (sum + view.getUint32(i)) >>> 0;
  return sum;
}

/** Mapa punkt kodowy → glif z podtabeli formatu 4 (podstawowa płaszczyzna Unicode). */
function readCharacterMap(view: DataView, cmap: TableRecord): Map<number, number> {
  const count = view.getUint16(cmap.offset + 2);
  let subtable = -1;

  for (let i = 0; i < count; i += 1) {
    const record = cmap.offset + 4 + i * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    const offset = cmap.offset + view.getUint32(record + 4);
    const isUnicode = platform === 0 || (platform === 3 && encoding === 1);
    if (isUnicode && view.getUint16(offset) === 4) {
      subtable = offset;
      if (platform === 3) break;
    }
  }
  if (subtable < 0) throw new Error('Font nie zawiera tabeli cmap w formacie 4.');

  const segments = view.getUint16(subtable + 6) / 2;
  const endAt = subtable + 14;
  const startAt = endAt + segments * 2 + 2;
  const deltaAt = startAt + segments * 2;
  const rangeAt = deltaAt + segments * 2;
  const map = new Map<number, number>();

  for (let s = 0; s < segments; s += 1) {
    const end = view.getUint16(endAt + s * 2);
    const start = view.getUint16(startAt + s * 2);
    const delta = view.getUint16(deltaAt + s * 2);
    const rangeOffset = view.getUint16(rangeAt + s * 2);

    for (let code = start; code <= end && code < 0xffff; code += 1) {
      let glyph: number;
      if (rangeOffset === 0) {
        glyph = (code + delta) & 0xffff;
      } else {
        glyph = view.getUint16(rangeAt + s * 2 + rangeOffset + (code - start) * 2);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) map.set(code, glyph);
    }
  }
  return map;
}

export function parseTrueType(source: Uint8Array, name: string): TrueTypeFont {
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const tables = new Map<string, TableRecord>();
  const tableCount = view.getUint16(4);

  for (let i = 0; i < tableCount; i += 1) {
    const record = 12 + i * 16;
    const tag = String.fromCharCode(...source.subarray(record, record + 4));
    tables.set(tag, { offset: view.getUint32(record + 8), length: view.getUint32(record + 12) });
  }

  const table = (tag: string): TableRecord => {
    const record = tables.get(tag);
    if (!record) throw new Error(`Font ${name} nie zawiera tabeli ${tag.trim()}.`);
    return record;
  };

  const head = table('head');
  const hhea = table('hhea');
  const hmtx = table('hmtx');
  const loca = table('loca');
  const glyf = table('glyf');
  const os2 = tables.get('OS/2');

  const scale = 1000 / view.getUint16(head.offset + 18);
  const glyphCount = view.getUint16(table('maxp').offset + 4);
  const metricCount = view.getUint16(hhea.offset + 34);
  const longLoca = view.getInt16(head.offset + 50) === 1;
  const characters = readCharacterMap(view, table('cmap'));

  const ascent = view.getInt16(hhea.offset + 4) * scale;
  // Wysokość wersalików jest w OS/2 od wersji 2; starszym fontom wystarcza przybliżenie
  const capHeight =
    os2 && view.getUint16(os2.offset) >= 2 ? view.getInt16(os2.offset + 88) * scale : ascent * 0.7;

  const glyphStart = (glyphId: number): number =>
    longLoca
      ? view.getUint32(loca.offset + glyphId * 4)
      : view.getUint16(loca.offset + glyphId * 2) * 2;

  /** Glify, z których zbudowany jest glif złożony — np. „ą" z „a" i ogonka. */
  function components(glyphId: number): number[] {
    const start = glyf.offset + glyphStart(glyphId);
    const end = glyf.offset + glyphStart(glyphId + 1);
    if (end - start < 10 || view.getInt16(start) >= 0) return [];

    const parts: number[] = [];
    let at = start + 10;
    let flags: number;
    do {
      flags = view.getUint16(at);
      parts.push(view.getUint16(at + 2));
      at += 4 + (flags & ARG_1_AND_2_ARE_WORDS ? 4 : 2);
      if (flags & WE_HAVE_A_SCALE) at += 2;
      else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) at += 4;
      else if (flags & WE_HAVE_A_TWO_BY_TWO) at += 8;
    } while (flags & MORE_COMPONENTS);
    return parts;
  }

  /**
   * Przycięcie zachowuje indeksy glifów: nieużyte dostają pusty obrys, ale
   * numeracja zostaje ta sama. Dzięki temu tabela szerokości i kody znaków
   * w treści dokumentu nie wymagają przeliczania, a z pliku i tak znika
   * to, co waży — obrysy kilkuset glifów, których dokument nie pokazuje.
   */
  function subset(glyphIds: Iterable<number>): Uint8Array<ArrayBuffer> {
    const keep = new Set<number>();
    const visit = (glyphId: number) => {
      if (glyphId >= glyphCount || keep.has(glyphId)) return;
      keep.add(glyphId);
      components(glyphId).forEach(visit);
    };
    visit(0);
    for (const glyphId of glyphIds) visit(glyphId);

    let glyfLength = 0;
    for (const glyphId of keep) glyfLength += pad4(glyphStart(glyphId + 1) - glyphStart(glyphId));

    const newGlyf = new Uint8Array(glyfLength);
    const newLoca = new Uint8Array((glyphCount + 1) * 4);
    const locaView = new DataView(newLoca.buffer);
    let cursor = 0;
    for (let glyphId = 0; glyphId < glyphCount; glyphId += 1) {
      locaView.setUint32(glyphId * 4, cursor);
      if (!keep.has(glyphId)) continue;
      const start = glyf.offset + glyphStart(glyphId);
      const end = glyf.offset + glyphStart(glyphId + 1);
      newGlyf.set(source.subarray(start, end), cursor);
      cursor += pad4(end - start);
    }
    locaView.setUint32(glyphCount * 4, cursor);

    const newHead = source.slice(head.offset, head.offset + head.length);
    const headView = new DataView(newHead.buffer);
    headView.setUint32(8, 0); // checkSumAdjustment — wyliczany na końcu
    headView.setInt16(50, 1); // nowa `loca` jest zawsze w formacie długim

    const parts = EMBEDDED_TABLES.filter((tag) => tables.has(tag))
      .sort()
      .map((tag) => {
        if (tag === 'head') return { tag, data: newHead };
        if (tag === 'loca') return { tag, data: newLoca };
        if (tag === 'glyf') return { tag, data: newGlyf };
        const record = table(tag);
        return { tag, data: source.subarray(record.offset, record.offset + record.length) };
      });

    const headerLength = 12 + parts.length * 16;
    const total = parts.reduce((sum, part) => sum + pad4(part.data.byteLength), headerLength);
    const out = new Uint8Array(total);
    const outView = new DataView(out.buffer);
    const entrySelector = Math.floor(Math.log2(parts.length));
    const searchRange = 2 ** entrySelector * 16;

    outView.setUint32(0, 0x00010000);
    outView.setUint16(4, parts.length);
    outView.setUint16(6, searchRange);
    outView.setUint16(8, entrySelector);
    outView.setUint16(10, parts.length * 16 - searchRange);

    let offset = headerLength;
    let headOffset = 0;
    parts.forEach((part, index) => {
      const record = 12 + index * 16;
      for (let i = 0; i < 4; i += 1) out[record + i] = part.tag.charCodeAt(i);
      out.set(part.data, offset);
      const padded = out.subarray(offset, offset + pad4(part.data.byteLength));
      outView.setUint32(record + 4, tableChecksum(padded));
      outView.setUint32(record + 8, offset);
      outView.setUint32(record + 12, part.data.byteLength);
      if (part.tag === 'head') headOffset = offset;
      offset += padded.byteLength;
    });

    outView.setUint32(headOffset + 8, (0xb1b0afba - tableChecksum(out)) >>> 0);
    return out;
  }

  return {
    name,
    ascent,
    descent: view.getInt16(hhea.offset + 6) * scale,
    capHeight,
    bbox: [
      view.getInt16(head.offset + 36) * scale,
      view.getInt16(head.offset + 38) * scale,
      view.getInt16(head.offset + 40) * scale,
      view.getInt16(head.offset + 42) * scale,
    ],
    glyphFor: (codePoint) => characters.get(codePoint) ?? 0,
    advance: (glyphId) =>
      view.getUint16(hmtx.offset + Math.min(glyphId, metricCount - 1) * 4) * scale,
    subset,
  };
}
