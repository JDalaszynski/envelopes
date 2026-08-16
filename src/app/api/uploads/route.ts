import { NextResponse } from 'next/server';

import { storeFile, type FilePurpose } from '@/lib/storage';
import { PRINT_FILE_EXTENSIONS, PRINT_FILE_MAX_BYTES } from '@/lib/catalog';

export const runtime = 'nodejs';

const ALLOWED: Record<FilePurpose, string[]> = {
  nadruk: PRINT_FILE_EXTENSIONS,
  personalizacja: ['xlsx', 'xls', 'csv'],
  wizualizacja: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg'],
};

/** POST — przyjmuje plik i zapisuje go w Firebase Storage. */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');
  const purpose = (form.get('purpose') as FilePurpose) ?? 'nadruk';
  const orderNumber = (form.get('orderNumber') as string) || undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Brak pliku w żądaniu.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const allowed = ALLOWED[purpose] ?? PRINT_FILE_EXTENSIONS;

  if (!allowed.includes(ext)) {
    return NextResponse.json(
      { error: `Format .${ext} nie jest obsługiwany. Dozwolone: ${allowed.join(', ').toUpperCase()}.` },
      { status: 415 }
    );
  }
  if (file.size > PRINT_FILE_MAX_BYTES) {
    return NextResponse.json({ error: 'Plik przekracza 10 MB.' }, { status: 413 });
  }

  try {
    const stored = await storeFile(file, purpose, orderNumber);
    return NextResponse.json(stored);
  } catch (error) {
    console.error('[uploads] Błąd zapisu pliku:', error);
    return NextResponse.json({ error: 'Nie udało się zapisać pliku.' }, { status: 500 });
  }
}
