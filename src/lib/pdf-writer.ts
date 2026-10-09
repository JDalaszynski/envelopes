import type { TrueTypeFont } from './pdf-font';

/**
 * Pisarz PDF dla dokumentów projektowanych — z osadzonymi krojami marki,
 * zdjęciem, grafiką wektorową i klikalnymi odnośnikami.
 *
 * `pdf.ts` układa listę linii Helvetiką i w zupełności wystarcza fakturom.
 * Tutaj dokument ma być rozrysowany co do punktu, więc pisarz udostępnia
 * stronę jako płótno: tekst, prostokąty, linie, obraz. Podobnie jak tamten
 * moduł nie ma zależności zewnętrznych — dokument powstaje wprost w składni
 * PDF — i działa zarówno w przeglądarce, jak i w Node.
 *
 * Współrzędne płótna liczymy **od lewego górnego rogu**, tak jak w CSS.
 * Przeliczenie na układ PDF (początek w lewym dolnym rogu) dzieje się
 * w jednym miejscu, w metodach `PdfPage`.
 */

export type Rgb = readonly [number, number, number];

/** Kolor z zapisu szesnastkowego tokenów (`#2a4e7e`). */
export function rgb(hex: string): Rgb {
  const value = parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

export const A4 = { width: 595.28, height: 841.89 } as const;

/** Stała krzywych Béziera przybliżających ćwiartkę okręgu */
const KAPPA = 0.5523;

function num(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function hex4(value: number): string {
  return value.toString(16).padStart(4, '0').toUpperCase();
}

function utf16Hex(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) out += hex4(text.charCodeAt(i));
  return out;
}

function ascii(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
}

function concat(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Kompresja strumieni (FlateDecode). `CompressionStream` jest w każdej
 * współczesnej przeglądarce i w Node; gdyby go zabrakło, strumienie idą
 * nieskompresowane — dokument jest wtedy większy, ale nadal poprawny.
 */
async function deflate(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer> | null> {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export interface FontTraits {
  serif?: boolean;
  fixedPitch?: boolean;
  bold?: boolean;
}

export class PdfFont {
  /** Użyte glify z ich punktami kodowymi — podstawa przycięcia fontu i mapy ToUnicode */
  readonly used = new Map<number, number>();

  constructor(
    readonly id: string,
    readonly face: TrueTypeFont,
    readonly traits: FontTraits
  ) {}

  private glyphs(text: string): { glyph: number; codePoint: number }[] {
    const out: { glyph: number; codePoint: number }[] = [];
    for (const char of text) {
      let codePoint = char.codePointAt(0)!;
      // Twarda spacja zachowuje się w składzie jak zwykła — font nie musi jej mieć
      if (codePoint === 0xa0) codePoint = 0x20;
      let glyph = this.face.glyphFor(codePoint);
      if (glyph === 0) {
        codePoint = 0x3f;
        glyph = this.face.glyphFor(codePoint);
      }
      out.push({ glyph, codePoint });
    }
    return out;
  }

  /** Szerokość tekstu w punktach; `tracking` to dodatkowy odstęp między znakami. */
  width(text: string, size: number, tracking = 0): number {
    const glyphs = this.glyphs(text);
    const advance = glyphs.reduce((sum, entry) => sum + this.face.advance(entry.glyph), 0);
    return (advance * size) / 1000 + tracking * Math.max(0, glyphs.length - 1);
  }

  /** Tekst jako ciąg indeksów glifów; zapamiętuje, których glifów dokument używa. */
  encode(text: string): string {
    let out = '';
    for (const { glyph, codePoint } of this.glyphs(text)) {
      if (!this.used.has(glyph)) this.used.set(glyph, codePoint);
      out += hex4(glyph);
    }
    return out;
  }
}

export interface PdfImage {
  id: string;
  data: Uint8Array;
  width: number;
  height: number;
}

export interface TextStyle {
  font: PdfFont;
  size: number;
  color: Rgb;
  /** Dodatkowy odstęp między znakami, w punktach */
  tracking?: number;
}

export interface Paint {
  fill?: Rgb;
  stroke?: Rgb;
  lineWidth?: number;
  radius?: number;
}

interface Link {
  rect: [number, number, number, number];
  uri: string;
  label: string;
}

export class PdfPage {
  readonly ops: string[] = [];
  readonly links: Link[] = [];

  constructor(
    readonly width: number,
    readonly height: number
  ) {}

  /** Ścieżka prostokąta w układzie PDF; `radius` zaokrągla narożniki. */
  private rectPath(x: number, y: number, w: number, h: number, radius = 0): string {
    const bottom = this.height - y - h;
    const r = Math.min(radius, w / 2, h / 2);
    if (r <= 0) return `${num(x)} ${num(bottom)} ${num(w)} ${num(h)} re`;

    const k = r * KAPPA;
    const right = x + w;
    const top = bottom + h;
    return [
      `${num(x + r)} ${num(bottom)} m`,
      `${num(right - r)} ${num(bottom)} l`,
      `${num(right - r + k)} ${num(bottom)} ${num(right)} ${num(bottom + r - k)} ${num(right)} ${num(bottom + r)} c`,
      `${num(right)} ${num(top - r)} l`,
      `${num(right)} ${num(top - r + k)} ${num(right - r + k)} ${num(top)} ${num(right - r)} ${num(top)} c`,
      `${num(x + r)} ${num(top)} l`,
      `${num(x + r - k)} ${num(top)} ${num(x)} ${num(top - r + k)} ${num(x)} ${num(top - r)} c`,
      `${num(x)} ${num(bottom + r)} l`,
      `${num(x)} ${num(bottom + r - k)} ${num(x + r - k)} ${num(bottom)} ${num(x + r)} ${num(bottom)} c`,
      'h',
    ].join(' ');
  }

  private paint(path: string, paint: Paint): void {
    const ops: string[] = [];
    if (paint.fill) ops.push(`${paint.fill.map(num).join(' ')} rg`);
    if (paint.stroke) {
      ops.push(`${paint.stroke.map(num).join(' ')} RG`, `${num(paint.lineWidth ?? 1)} w`);
    }
    ops.push(path, paint.fill && paint.stroke ? 'B' : paint.fill ? 'f' : 'S');
    this.ops.push(ops.join(' '));
  }

  /** Tekst w jednej linii; `baseline` to położenie linii bazowej od góry strony. */
  text(
    text: string,
    x: number,
    baseline: number,
    style: TextStyle,
    align: 'left' | 'right' | 'center' = 'left'
  ): void {
    if (!text) return;
    const tracking = style.tracking ?? 0;
    const width = align === 'left' ? 0 : style.font.width(text, style.size, tracking);
    const left = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
    this.ops.push(
      `BT /${style.font.id} ${num(style.size)} Tf ${num(tracking)} Tc ` +
        `${style.color.map(num).join(' ')} rg ` +
        `1 0 0 1 ${num(left)} ${num(this.height - baseline)} Tm <${style.font.encode(text)}> Tj ET`
    );
  }

  rect(x: number, y: number, w: number, h: number, paint: Paint): void {
    this.paint(this.rectPath(x, y, w, h, paint.radius), paint);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Rgb, lineWidth = 0.75): void {
    this.paint(
      `${num(x1)} ${num(this.height - y1)} m ${num(x2)} ${num(this.height - y2)} l`,
      { stroke: color, lineWidth }
    );
  }

  /** Wypełniony wielokąt — sygnet w nagłówku. */
  polygon(points: [number, number][], fill: Rgb): void {
    const path = points
      .map(([x, y], index) => `${num(x)} ${num(this.height - y)} ${index === 0 ? 'm' : 'l'}`)
      .join(' ');
    this.paint(`${path} h`, { fill });
  }

  /** Łamana z zaokrąglonymi końcami i złączeniami — znak „sprawdzone". */
  polyline(points: [number, number][], color: Rgb, lineWidth: number): void {
    const path = points
      .map(([x, y], index) => `${num(x)} ${num(this.height - y)} ${index === 0 ? 'm' : 'l'}`)
      .join(' ');
    this.ops.push(
      `q 1 J 1 j ${color.map(num).join(' ')} RG ${num(lineWidth)} w ${path} S Q`
    );
  }

  /** Obraz wpisany w prostokąt; `radius` przycina narożniki. */
  image(image: PdfImage, x: number, y: number, w: number, h: number, radius = 0): void {
    const clip = radius > 0 ? `${this.rectPath(x, y, w, h, radius)} W n ` : '';
    this.ops.push(
      `q ${clip}${num(w)} 0 0 ${num(h)} ${num(x)} ${num(this.height - y - h)} cm /${image.id} Do Q`
    );
  }

  /** Ogranicza rysowanie do prostokąta — np. żeby krawędź karty szła po jej zaokrągleniu. */
  clipped(x: number, y: number, w: number, h: number, radius: number, draw: () => void): void {
    this.ops.push(`q ${this.rectPath(x, y, w, h, radius)} W n`);
    draw();
    this.ops.push('Q');
  }

  /** Klikalny obszar otwierający adres — `label` czytają czytniki ekranu. */
  link(x: number, y: number, w: number, h: number, uri: string, label: string): void {
    this.links.push({ rect: [x, this.height - y - h, x + w, this.height - y], uri, label });
  }
}

export interface PdfMeta {
  title: string;
  author: string;
  subject: string;
  creator: string;
  /** Znacznik języka dokumentu, np. `pl-PL` */
  language: string;
  createdAt: Date;
}

function pdfDate(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return (
    `D:${date.getUTCFullYear()}${part(date.getUTCMonth() + 1)}${part(date.getUTCDate())}` +
    `${part(date.getUTCHours())}${part(date.getUTCMinutes())}${part(date.getUTCSeconds())}Z`
  );
}

/** Tablica szerokości `/W` — kolejne indeksy glifów łączymy w jeden zakres. */
function widthsArray(font: PdfFont): string {
  const ids = [...font.used.keys()].sort((a, b) => a - b);
  const groups: string[] = [];
  for (let i = 0; i < ids.length; ) {
    let j = i;
    while (j + 1 < ids.length && ids[j + 1] === ids[j] + 1) j += 1;
    const widths = ids.slice(i, j + 1).map((id) => Math.round(font.face.advance(id)));
    groups.push(`${ids[i]} [${widths.join(' ')}]`);
    i = j + 1;
  }
  return `[${groups.join(' ')}]`;
}

/**
 * Mapa glif → znak. Bez niej tekst wygląda poprawnie, ale nie da się go
 * zaznaczyć, skopiować ani wyszukać — a klient zwykle kopiuje z dokumentu
 * numer zamówienia.
 */
function toUnicodeMap(font: PdfFont): string {
  const entries = [...font.used]
    .sort((a, b) => a[0] - b[0])
    .map(([glyph, codePoint]) => `<${hex4(glyph)}> <${utf16Hex(String.fromCodePoint(codePoint))}>`);

  const blocks: string[] = [];
  for (let i = 0; i < entries.length; i += 100) {
    const block = entries.slice(i, i + 100);
    blocks.push(`${block.length} beginbfchar\n${block.join('\n')}\nendbfchar`);
  }

  return [
    '/CIDInit /ProcSet findresource begin',
    '12 dict begin',
    'begincmap',
    '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def',
    '/CMapName /Adobe-Identity-UCS def',
    '/CMapType 2 def',
    '1 begincodespacerange',
    '<0000> <FFFF>',
    'endcodespacerange',
    ...blocks,
    'endcmap',
    'CMapName currentdict /CMap defineresource pop',
    'end',
    'end',
  ].join('\n');
}

export class PdfDocument {
  private readonly fonts: PdfFont[] = [];
  private readonly images: PdfImage[] = [];
  private readonly pages: PdfPage[] = [];

  constructor(private readonly meta: PdfMeta) {}

  addFont(face: TrueTypeFont, traits: FontTraits = {}): PdfFont {
    const font = new PdfFont(`F${this.fonts.length + 1}`, face, traits);
    this.fonts.push(font);
    return font;
  }

  /** Obraz JPEG w przestrzeni RGB, 8 bitów na składową — osadzany bez przekodowania. */
  addJpeg(data: Uint8Array, width: number, height: number): PdfImage {
    const image: PdfImage = { id: `Im${this.images.length + 1}`, data, width, height };
    this.images.push(image);
    return image;
  }

  addPage(width: number = A4.width, height: number = A4.height): PdfPage {
    const page = new PdfPage(width, height);
    this.pages.push(page);
    return page;
  }

  async save(): Promise<Uint8Array<ArrayBuffer>> {
    const objects: Uint8Array[] = [];
    const reserve = (): number => objects.push(new Uint8Array(0));
    const put = (id: number, body: string | Uint8Array) => {
      objects[id - 1] = typeof body === 'string' ? ascii(body) : body;
    };

    async function stream(dict: string, data: Uint8Array<ArrayBuffer>, compress: boolean) {
      const packed = compress ? await deflate(data) : null;
      const body = packed ?? data;
      const filter = packed ? ' /Filter /FlateDecode' : '';
      return concat([
        ascii(`<< ${dict}${filter} /Length ${body.byteLength} >>\nstream\n`),
        body,
        ascii('\nendstream'),
      ]);
    }

    const catalog = reserve();
    const info = reserve();
    const pageTree = reserve();
    const resources = reserve();

    const fontRefs: string[] = [];
    for (const [index, font] of this.fonts.entries()) {
      // Krój, którym nie złożono ani znaku, nie trafia do pliku
      if (font.used.size === 0) continue;
      const type0 = reserve();
      const cidFont = reserve();
      const descriptor = reserve();
      const file = reserve();
      const toUnicode = reserve();
      const { face, traits } = font;

      // Sześć wersalików przed nazwą to wymagany przez specyfikację znacznik podzbioru
      const baseFont = `/ENVAA${String.fromCharCode(65 + (index % 26))}+${face.name}`;
      const flags = 32 | (traits.fixedPitch ? 1 : 0) | (traits.serif ? 2 : 0);
      const program = face.subset(font.used.keys());

      put(
        type0,
        `<< /Type /Font /Subtype /Type0 /BaseFont ${baseFont} /Encoding /Identity-H ` +
          `/DescendantFonts [${cidFont} 0 R] /ToUnicode ${toUnicode} 0 R >>`
      );
      put(
        cidFont,
        `<< /Type /Font /Subtype /CIDFontType2 /BaseFont ${baseFont} ` +
          '/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> ' +
          `/FontDescriptor ${descriptor} 0 R /DW 1000 /W ${widthsArray(font)} /CIDToGIDMap /Identity >>`
      );
      put(
        descriptor,
        `<< /Type /FontDescriptor /FontName ${baseFont} /Flags ${flags} ` +
          `/FontBBox [${face.bbox.map((value) => Math.round(value)).join(' ')}] /ItalicAngle 0 ` +
          `/Ascent ${Math.round(face.ascent)} /Descent ${Math.round(face.descent)} ` +
          `/CapHeight ${Math.round(face.capHeight)} /StemV ${traits.bold ? 120 : 80} ` +
          `/FontFile2 ${file} 0 R >>`
      );
      put(file, await stream(`/Length1 ${program.byteLength}`, program, true));
      put(toUnicode, await stream('', ascii(toUnicodeMap(font)), true));
      fontRefs.push(`/${font.id} ${type0} 0 R`);
    }

    const imageRefs: string[] = [];
    for (const image of this.images) {
      const id = reserve();
      put(
        id,
        await stream(
          `/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
            '/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode',
          new Uint8Array(image.data),
          false
        )
      );
      imageRefs.push(`/${image.id} ${id} 0 R`);
    }

    const pageIds: number[] = [];
    for (const page of this.pages) {
      const id = reserve();
      const contents = reserve();
      const annotations = page.links.map((link) => {
        const annotation = reserve();
        const uri = link.uri.replace(/[\\()]/g, (char) => `\\${char}`);
        put(
          annotation,
          `<< /Type /Annot /Subtype /Link /Rect [${link.rect.map(num).join(' ')}] /Border [0 0 0] ` +
            `/Contents <FEFF${utf16Hex(link.label)}> /A << /Type /Action /S /URI /URI (${uri}) >> >>`
        );
        return `${annotation} 0 R`;
      });

      put(contents, await stream('', ascii(page.ops.join('\n')), true));
      put(
        id,
        `<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 ${num(page.width)} ${num(page.height)}] ` +
          `/Resources ${resources} 0 R /Contents ${contents} 0 R` +
          (annotations.length ? ` /Annots [${annotations.join(' ')}]` : '') +
          ' >>'
      );
      pageIds.push(id);
    }

    put(
      catalog,
      `<< /Type /Catalog /Pages ${pageTree} 0 R /Lang (${this.meta.language}) ` +
        '/ViewerPreferences << /DisplayDocTitle true >> >>'
    );
    put(
      info,
      `<< /Title <FEFF${utf16Hex(this.meta.title)}> /Author <FEFF${utf16Hex(this.meta.author)}> ` +
        `/Subject <FEFF${utf16Hex(this.meta.subject)}> /Creator <FEFF${utf16Hex(this.meta.creator)}> ` +
        `/Producer <FEFF${utf16Hex(this.meta.creator)}> /CreationDate (${pdfDate(this.meta.createdAt)}) >>`
    );
    put(
      pageTree,
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
    );
    put(
      resources,
      `<< /Font << ${fontRefs.join(' ')} >>` +
        (imageRefs.length ? ` /XObject << ${imageRefs.join(' ')} >>` : '') +
        ' >>'
    );

    // Druga linia nagłówka niesie bajty spoza ASCII — sygnał, że plik jest binarny
    const chunks: Uint8Array[] = [ascii('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n')];
    const offsets: number[] = [];
    let position = chunks[0].byteLength;
    objects.forEach((body, index) => {
      const chunk = concat([ascii(`${index + 1} 0 obj\n`), body, ascii('\nendobj\n')]);
      offsets.push(position);
      position += chunk.byteLength;
      chunks.push(chunk);
    });

    const documentId = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');

    chunks.push(
      ascii(
        `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
          offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('') +
          `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R ` +
          `/ID [<${documentId}> <${documentId}>] >>\nstartxref\n${position}\n%%EOF\n`
      )
    );
    return concat(chunks);
  }
}
