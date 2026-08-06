import { NextResponse } from 'next/server';

import { getOrder, updateOrder } from '@/lib/store';
import { verifyNotificationSignature, verifyTransaction, type P24Notification } from '@/lib/p24';
import { orderConfirmationEmail, sendEmail } from '@/lib/brevo';

export const runtime = 'nodejs';

/**
 * Webhook Przelewy24 (pkt 8.1).
 * `sessionId` to numer zamówienia ENV-RRRRMMDD-XXXX (pkt 1.8), dzięki czemu
 * płatność wiąże się jednoznacznie z konkretnym zamówieniem.
 */
export async function POST(request: Request) {
  let notification: P24Notification;
  try {
    notification = (await request.json()) as P24Notification;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy format notyfikacji.' }, { status: 400 });
  }

  if (!verifyNotificationSignature(notification)) {
    console.warn('[Przelewy24] Odrzucono notyfikację — niezgodny podpis.');
    return NextResponse.json({ error: 'Niezgodny podpis notyfikacji.' }, { status: 401 });
  }

  const order = await getOrder(notification.sessionId);
  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  const expected = Math.round(order.totals.gross * 100);
  if (notification.amount !== expected) {
    console.warn(
      `[Przelewy24] Kwota niezgodna dla ${order.number}: otrzymano ${notification.amount}, oczekiwano ${expected}.`
    );
    return NextResponse.json({ error: 'Kwota niezgodna z zamówieniem.' }, { status: 409 });
  }

  const confirmed = await verifyTransaction(notification);
  if (!confirmed) {
    return NextResponse.json({ error: 'Transakcja niepotwierdzona przez bramkę.' }, { status: 402 });
  }

  if (order.paymentStatus === 'oplacone') {
    // Notyfikacje bywają ponawiane — operacja musi być idempotentna
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const now = new Date().toISOString();
  const updated = await updateOrder(order.number, {
    paymentStatus: 'oplacone',
    p24Reference: String(notification.orderId),
    history: [
      ...order.history,
      {
        at: now,
        by: 'Przelewy24',
        action: 'Płatność potwierdzona',
        detail: `Identyfikator transakcji: ${notification.orderId}`,
      },
    ],
  });

  if (updated) await sendEmail(orderConfirmationEmail(updated));

  return NextResponse.json({ ok: true });
}
