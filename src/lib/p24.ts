import 'server-only';

import { createHash } from 'node:crypto';
import type { Order } from './types';

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
    description: `Zamówienie ${order.number} — Envelopes`,
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
      headers: { authorization: authHeader(), 'content-type': 'application/json' },
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
    const res = await fetch(`${API_BASE}/transaction/verify`, {
      method: 'POST',
      headers: { authorization: authHeader(), 'content-type': 'application/json' },
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
    const json = (await res.json()) as { data?: { status?: string } };
    return json.data?.status === 'success';
  } catch {
    return false;
  }
}
