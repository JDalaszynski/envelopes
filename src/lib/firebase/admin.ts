import 'server-only';

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

/**
 * Firebase Admin SDK — używany wyłącznie w API Routes / Server Actions na Vercel.
 * Weryfikuje tokeny użytkowników i egzekwuje rolę `admin` (custom claim)
 * PRZED dostępem do panelu administracyjnego — nie tylko ukryciem w UI (pkt 8.1).
 */

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export const isAdminConfigured = Boolean(projectId && clientEmail && privateKey);

let adminApp: App | null = null;

function ensureApp(): App | null {
  if (!isAdminConfigured) return null;
  if (adminApp) return adminApp;
  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
  return adminApp;
}

export function getDb(): Firestore | null {
  const instance = ensureApp();
  return instance ? getFirestore(instance) : null;
}

export function getAdminAuth(): Auth | null {
  const instance = ensureApp();
  return instance ? getAuth(instance) : null;
}

export function getBucket() {
  const instance = ensureApp();
  return instance ? getStorage(instance).bucket() : null;
}

export interface VerifiedUser {
  uid: string;
  email: string | null;
  role: 'user' | 'admin';
}

/**
 * Weryfikuje token Bearer z nagłówka Authorization.
 * Zwraca null, gdy token jest nieobecny lub nieprawidłowy.
 */
export async function verifyRequest(request: Request): Promise<VerifiedUser | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const auth = getAdminAuth();
  if (!auth) {
    // Tryb DEV FALLBACK — brak kluczy Admin SDK. Token pochodzi z lokalnej
    // sesji demonstracyjnej; nie jest kryptograficznie weryfikowany.
    return decodeDevToken(token);
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const role = decoded.role === 'admin' ? 'admin' : 'user';
    return { uid: decoded.uid, email: decoded.email ?? null, role };
  } catch {
    return null;
  }
}

/** Sesja demonstracyjna używana wyłącznie, gdy Admin SDK nie jest skonfigurowany. */
function decodeDevToken(token: string): VerifiedUser | null {
  if (!token.startsWith('dev.')) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.slice(4), 'base64url').toString('utf8')
    ) as { uid?: string; email?: string; role?: string };
    if (!payload.uid) return null;
    return {
      uid: payload.uid,
      email: payload.email ?? null,
      role: payload.role === 'admin' ? 'admin' : 'user',
    };
  } catch {
    return null;
  }
}

/** Nadaje użytkownikowi rolę admina (custom claim). Wywoływane ręcznie/skryptem. */
export async function grantAdminRole(uid: string): Promise<boolean> {
  const auth = getAdminAuth();
  if (!auth) return false;
  await auth.setCustomUserClaims(uid, { role: 'admin' });
  return true;
}
