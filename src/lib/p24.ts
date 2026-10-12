import 'server-only';

import { createHash } from 'node:crypto';
import { warsawDay, warsawTime } from './accounting';
import type { Order, P24Transaction } from './types';

/**
 * Przelewy24 — REST API (pkt 1.5, 1.8).
 * Numer zamówienia ENV-RRRRMMDD-XXXX jest przekazywany jako `sessionId`,
 * dzięki czemu płatność da się jednoznacznie powiązać z zamówieniem
 * w obie strony.
 */

const SANDBOX = process.env.P24_ENV === 'production' ? false : process.env.P24_SANDBOX !== 'false';
const API_BASE = SANDBOX
  ? 'https://sandbox.przelewy24.pl/api/v1'
  : 'https://secure.przelewy24.pl/api/v1';
const REDIRECT_BASE = SANDBOX
  ? 'https://sandbox.przelewy24.pl/trnRequest'
  : 'https://secure.przelewy24.pl/trnRequest';

const MERCHANT_ID = process.env.P24_MERCHANT_ID;
const POS_ID = process.env.P24_POS_ID ?? MERCHANT_ID;
const CRC = process.env.P24_CRC;
const API_KEY = process.env.P24_API_KEY;

export const isP24Configured = Boolean(MERCHANT_ID && CRC && API_KEY);

/** Metody płatności w Przelewy24 — 154 to BLIK. */
const BLIK_METHOD_ID = 154;

function sign(payload: Record<string, unknown>): string {
  return createHash('sha384').update(JSON.stringify(payload), 'utf8').digest('hex');
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${POS_ID}:${API_KEY}`).toString('base64')}`;
}

export interface P24RegisterResult {
  ok: boolean;
  redirectUrl: string;
  token?: string;
  simulated?: boolean;
  reason?: string;
}

/**
 * Rejestruje transakcję i zwraca URL, na który przekierowujemy klienta.
 * Kwota w groszach, waluta PLN.
 */
export async function registerTransaction(
  order: Order,
  returnUrl: string,
  statusUrl: string
): Promise<P24RegisterResult> {
  const sessionId = order.number;
  const amount = Math.round(order.totals.gross * 100);

  if (!isP24Configured) {
    // DEV FALLBACK — brak danych dostępowych do bramki. Zamiast bramki
    // wracamy prosto na stronę potwierdzenia z oznaczeniem symulacji.
    return {
      ok: true,
      simulated: true,
      redirectUrl: `${returnUrl}?symulacja=1`,
      reason: 'Brak konfiguracji Przelewy24 — transakcja zasymulowana lokalnie.',
    };
  }

  const body: Record<string, unknown> = {
    merchantId: Number(MERCHANT_ID),
    posId: Number(POS_ID),
    sessionId,
    amount,
    currency: 'PLN',
    // Myślnik zamiast pauzy: dokumentacja P24 dopuszcza w polach tekstowych
    // wyłącznie [a-zA-Z0-9 ęółśążźćń ĘÓŁŚĄŻŹĆŃ . / \ : -], a pauzy nie ma
    // też w ISO-8859-2, na które bramka potrafi przepisać opis.
    description: `Zamówienie ${order.number} - Envelopes`,
    // Bez tego pola bramka czyta opis jako ISO-8859-2, choć JSON idzie
    // w UTF-8 — „Zamówienie" wychodziło na stronie płatności jako
    // „ZamĂłwienie". Sam `charset=utf-8` w nagłówku tego nie zmienia.
    encoding: 'UTF-8',
    email: order.customer.email,
    country: 'PL',
    language: 'pl',
    urlReturn: returnUrl,
    urlStatus: statusUrl,
    sign: sign({ sessionId, merchantId: Number(MERCHANT_ID), amount, currency: 'PLN', crc: CRC }),
  };

  if (order.paymentMethod === 'blik') {
    body.method = BLIK_METHOD_ID;
  }

  try {
    const res = await fetch(`${API_BASE}/transaction/register`, {
      method: 'POST',
      headers: { authorization: authHeader(), 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { data?: { token?: string }; error?: string };
    if (!res.ok || !json.data?.token) {
      return { ok: false, redirectUrl: returnUrl, reason: json.error ?? `Status ${res.status}` };
    }
    return { ok: true, token: json.data.token, redirectUrl: `${REDIRECT_BASE}/${json.data.token}` };
  } catch (error) {
    console.error('[Przelewy24] Błąd rejestracji transakcji:', error);
    return { ok: false, redirectUrl: returnUrl, reason: 'Brak połączenia z bramką.' };
  }
}

export interface P24Notification {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

/** Weryfikuje podpis notyfikacji przychodzącej z bramki. */
export function verifyNotificationSignature(n: P24Notification): boolean {
  if (!isP24Configured) return true;
  const expected = sign({
    merchantId: n.merchantId,
    posId: n.posId,
    sessionId: n.sessionId,
    amount: n.amount,
    originAmount: n.originAmount,
    currency: n.currency,
    orderId: n.orderId,
    methodId: n.methodId,
    statement: n.statement,
    crc: CRC,
  });
  return expected === n.sign;
}

/**
 * Potwierdza transakcję po otrzymaniu notyfikacji — dopiero pozytywna
 * odpowiedź na `transaction/verify` oznacza, że środki są zaksięgowane.
 */
export async function verifyTransaction(n: P24Notification): Promise<boolean> {
  if (!isP24Configured) return true;
  try {
    // Weryfikacja to PUT — w odróżnieniu od rejestracji. Na POST bramka
    // odpowiada stroną HTML „Nieprawidłowe żądanie", wpłata zostaje w panelu
    // ze statusem „Do wykorzystania" i trzeba ją księgować ręcznie.
    const res = await fetch(`${API_BASE}/transaction/verify`, {
      method: 'PUT',
      headers: { authorization: authHeader(), 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        merchantId: n.merchantId,
        posId: n.posId,
        sessionId: n.sessionId,
        amount: n.amount,
        currency: n.currency,
        orderId: n.orderId,
        sign: sign({
          sessionId: n.sessionId,
          orderId: n.orderId,
          amount: n.amount,
          currency: n.currency,
          crc: CRC,
        }),
      }),
    });
    const raw = await res.text();
    let json: { data?: { status?: string } } = {};
    try {
      json = JSON.parse(raw) as typeof json;
    } catch {
      /* odpowiedź nie jest JSON-em — treść trafia do logu poniżej */
    }
    if (json.data?.status === 'success') return true;
    console.error(
      `[Przelewy24] Weryfikacja ${n.sessionId} odrzucona: HTTP ${res.status}, ${raw.slice(0, 300)}`
    );
    return false;
  } catch (error) {
    console.error(`[Przelewy24] Błąd połączenia przy weryfikacji ${n.sessionId}:`, error);
    return false;
  }
}

/* ── Dane transakcji do ewidencji sprzedaży ─────────────────── */

/**
 * Bramka podaje datę jako ciąg cyfr `RRRRMMDDGGmm` w czasie polskim; na
 * wypadek innego zapisu próbujemy też zwykłej daty.
 */
export function parseP24Date(raw: unknown): { day: string; time: string | null } | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  const value = String(raw).trim();
  const digits = /^(\d{4})(\d{2})(\d{2})(?:(\d{2})(\d{2}))?/.exec(value);
  if (digits && /^\d{8,14}$/.test(value)) {
    const [, year, month, date, hour, minute] = digits;
    return { day: `${year}-${month}-${date}`, time: hour ? `${hour}:${minute}` : null };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return { day: warsawDay(parsed), time: warsawTime(parsed) };
}

export type P24Lookup =
  | { found: true; transaction: P24Transaction }
  | { found: false; reason: 'brak-konfiguracji' | 'nie-znaleziono' | 'blad' };

/**
 * Pobiera transakcję po numerze zamówienia (`sessionId`). To niezależne od
 * notyfikacji potwierdzenie wpłaty: status, kwota, dzień zapłaty, tytuł
 * przelewu i numer paczki wypłaty, po którym wpłatę widać na wyciągu.
 */
export async function fetchTransaction(sessionId: string): Promise<P24Lookup> {
  if (!isP24Configured) return { found: false, reason: 'brak-konfiguracji' };
  try {
    const res = await fetch(
      `${API_BASE}/transaction/by/sessionId/${encodeURIComponent(sessionId)}`,
      { headers: { authorization: authHeader() }, cache: 'no-store', signal: AbortSignal.timeout(15_000) }
    );
    if (res.status === 404) return { found: false, reason: 'nie-znaleziono' };
    const raw = await res.text();
    let json: { data?: Record<string, unknown> } = {};
    try {
      json = JSON.parse(raw) as typeof json;
    } catch {
      /* odpowiedź nie jest JSON-em — treść trafia do logu poniżej */
    }
    const data = json.data;
    if (!res.ok || !data || !data.orderId) {
      console.error(`[Przelewy24] Odczyt transakcji ${sessionId}: HTTP ${res.status}, ${raw.slice(0, 300)}`);
      return { found: false, reason: res.ok ? 'nie-znaleziono' : 'blad' };
    }
    const paid = parseP24Date(data.dateOfTransaction) ?? parseP24Date(data.date);
    return {
      found: true,
      transaction: {
        orderId: Number(data.orderId),
        amount: Number(data.amount ?? 0),
        currency: String(data.currency ?? 'PLN'),
        status: Number(data.status ?? 0),
        statement: data.statement ? String(data.statement) : null,
        methodId: data.paymentMethod ? Number(data.paymentMethod) : null,
        paidDay: paid?.day ?? null,
        paidTime: paid?.time ?? null,
        batchId: data.batchId ? Number(data.batchId) : null,
        source: 'api',
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`[Przelewy24] Błąd połączenia przy odczycie transakcji ${sessionId}:`, error);
    return { found: false, reason: 'blad' };
  }
}
