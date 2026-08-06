import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getBucket } from './firebase/admin';
import type { UploadedFile } from './types';

/**
 * Zapis plików: Firebase Storage w produkcji, katalog `.data/uploads`
 * gdy Firebase nie jest skonfigurowany. Każdy plik powiązany jest
 * z identyfikatorem zamówienia albo z sesją konfiguratora (pkt 8.1).
 */

const UPLOAD_DIR = path.join(process.cwd(), '.data', 'uploads');

export type FilePurpose = 'nadruk' | 'personalizacja' | 'wizualizacja';

export async function storeFile(
  file: File,
  purpose: FilePurpose,
  orderNumber?: string
): Promise<UploadedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_');
  const objectPath = `${purpose}/${orderNumber ?? 'sesja'}/${id}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const bucket = getBucket();
  if (bucket) {
    const blob = bucket.file(objectPath);
    await blob.save(buffer, { contentType: file.type || 'application/octet-stream' });
    // Podpisany URL ważny 7 dni — pliki nie są publiczne
    const [url] = await blob.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return { id, name: file.name, size: file.size, ext, path: objectPath, url, status: 'przeslano' };
  }

  const target = path.join(UPLOAD_DIR, objectPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return {
    id,
    name: file.name,
    size: file.size,
    ext,
    path: objectPath,
    url: `/api/uploads/${encodeURIComponent(objectPath)}`,
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
