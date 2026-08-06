import { NextResponse } from 'next/server';

import { readLocalFile } from '@/lib/storage';

export const runtime = 'nodejs';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
};

/**
 * Serwuje pliki zapisane lokalnie (tryb bez Firebase Storage).
 * Przy podłączonym Firebase klient dostaje podpisany URL prosto z bucketa
 * i ten endpoint nie jest używany.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sciezka: string[] }> }
) {
  const { sciezka } = await params;
  const objectPath = sciezka.map((part) => decodeURIComponent(part)).join('/');

  if (objectPath.includes('..')) {
    return NextResponse.json({ error: 'Nieprawidłowa ścieżka.' }, { status: 400 });
  }

  const buffer = await readLocalFile(objectPath);
  if (!buffer) {
    return NextResponse.json({ error: 'Nie znaleziono pliku.' }, { status: 404 });
  }

  const ext = objectPath.split('.').pop()?.toLowerCase() ?? '';
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'content-type': MIME[ext] ?? 'application/octet-stream',
      'content-disposition': `inline; filename="${objectPath.split('/').pop()}"`,
    },
  });
}
