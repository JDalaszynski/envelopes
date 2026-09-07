import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getBucket, getDb } from './firebase/admin';
import type { UploadedFile } from './types';

/**
 * Zapis plików: Firebase Storage w produkcji, katalog `.data/uploads`
 * gdy Firebase nie jest skonfigurowany. Każdy plik powiązany jest
 * z identyfikatorem zamówienia albo z sesją konfiguratora (pkt 8.1).
 *
 * Pliki lądują w folderze nazwanym datą dnia (np. `2026-08-03/nadruk/...`),
 * żeby dało się przejrzeć w konsoli Firebase, jakiego typu załączniki
 * (logo, adresówki) klienci dodają danego dnia — również gdy nie
 * dokończą zamówienia. Ten sam wpis trafia też do kolekcji Firestore
 * `uploads`, żeby dało się to przeglądać/filtrować jako listę, nie
 * tylko jako drzewo folderów w Storage.
 */

const UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads');

export type FilePurpose = 'nadruk' | 'personalizacja' | 'wizualizacja';

/** Data dnia w strefie Europe/Warsaw, w formacie RRRR-MM-DD. */
function todayFolder(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw' }).format(new Date());
}

async function logUpload(entry: {
  id: string;
  purpose: FilePurpose;
  name: string;
  size: number;
  ext: string;
  path: string;
  url: string;
  dateFolder: string;
  orderNumber?: string;
  storedIn: 'firebase' | 'local';
}): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db
      .collection('uploads')
      .doc(entry.id)
      .set({
        ...entry,
        orderNumber: entry.orderNumber ?? null,
        createdAt: new Date().toISOString(),
      });
  } catch (err) {
    console.warn('[storage] Błąd zapisu rejestru uploadu w Firestore:', err);
  }
}

export async function storeFile(
  file: File,
  purpose: FilePurpose,
  orderNumber?: string
): Promise<UploadedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
  const dateFolder = todayFolder();
  const objectPath = `${dateFolder}/${purpose}/${orderNumber ?? 'sesja'}-${id}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const bucket = getBucket();
  if (bucket) {
    try {
      const blob = bucket.file(objectPath);
      await blob.save(buffer, { contentType: file.type || 'application/octet-stream' });
      // Podpisany URL ważny 7 dni — pliki nie są publiczne
      const [url] = await blob.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      await logUpload({
        id,
        purpose,
        name: file.name,
        size: file.size,
        ext,
        path: objectPath,
        url,
        dateFolder,
        orderNumber,
        storedIn: 'firebase',
      });
      return { id, name: file.name, size: file.size, ext, path: objectPath, url, status: 'przeslano' };
    } catch (err) {
      console.warn('[storage] Błąd zapisu w Firebase Storage, próbuję zapisu lokalnego:', err);
    }
  }

  const target = path.join(UPLOAD_DIR, objectPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  const url = `/api/uploads/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
  await logUpload({
    id,
    purpose,
    name: file.name,
    size: file.size,
    ext,
    path: objectPath,
    url,
    dateFolder,
    orderNumber,
    storedIn: 'local',
  });
  return {
    id,
    name: file.name,
    size: file.size,
    ext,
    path: objectPath,
    url,
    status: 'przeslano',
  };
}

export async function readLocalFile(objectPath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, objectPath));
  } catch {
    return null;
  }
}
