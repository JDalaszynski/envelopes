import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { deleteOrder, getOrder, updateOrder } from '@/lib/store';
import { paymentConfirmedEmail, sendEmail } from '@/lib/brevo';
import { isValidDay, warsawDay } from '@/lib/accounting';
import { customerView } from '@/lib/orders';
import type { Order } from '@/lib/types';

export const runtime = 'nodejs';

/** GET — szczegóły zamówienia. Klient widzi wyłącznie własne. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);
  const order = await getOrder(numer);

  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  const isOwner =
    user &&
    (order.userId === user.uid ||
      (user.email && order.customer.email.toLowerCase() === user.email.toLowerCase()));

  if (user?.role !== 'admin' && !isOwner) {
    return NextResponse.json({ error: 'Brak dostępu do tego zamówienia.' }, { status: 403 });
  }

  return NextResponse.json({ order: user?.role === 'admin' ? order : customerView(order) });
}

interface PatchBody {
  paymentStatus?: 'oczekuje' | 'oplacone';
  /** Dzień wpływu na konto (RRRR-MM-DD) przy ręcznym potwierdzeniu wpłaty */
  paidDay?: string;
  trackingNumber?: string;
  customer?: Partial<Order['customer']>;
  items?: Order['items'];
}

/** PATCH — zmiany dostępne wyłącznie dla roli admin (pkt 6.12). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);

  // Rola weryfikowana po stronie serwera, nie tylko ukrywana w UI (pkt 8.1)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  const order = await getOrder(numer);
  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  const body = (await request.json()) as PatchBody;
  const now = new Date().toISOString();
  const history = [...order.history];
  const patch: Partial<Order> = {};

  if (body.paymentStatus && body.paymentStatus !== order.paymentStatus) {
    patch.paymentStatus = body.paymentStatus;
    /* Dzień wpływu podaje Admin, bo przelew potwierdza się nieraz dzień po
       zaksięgowaniu, a ewidencja sprzedaży ma się zgadzać z wyciągiem.
       Południe UTC wypada w Polsce zawsze tego samego dnia kalendarzowego. */
    const today = warsawDay(new Date());
    const paidDay = body.paidDay && isValidDay(body.paidDay) && body.paidDay <= today ? body.paidDay : today;
    patch.paidAt =
      body.paymentStatus === 'oplacone' ? (paidDay === today ? now : `${paidDay}T12:00:00.000Z`) : null;
    history.push({
      at: now,
      by: user.email ?? 'admin',
      action:
        body.paymentStatus === 'oplacone'
          ? 'Oznaczono jako opłacone (ręczne potwierdzenie wpłaty)'
          : 'Cofnięto potwierdzenie płatności',
      ...(body.paymentStatus === 'oplacone' && paidDay !== today
        ? { detail: `Dzień wpływu: ${paidDay}` }
        : {}),
    });
    if (body.paymentStatus === 'oplacone') {
      await sendEmail(paymentConfirmedEmail({ ...order, paymentStatus: 'oplacone' }));
    }
  }

  if (body.trackingNumber !== undefined && body.trackingNumber !== order.trackingNumber) {
    patch.trackingNumber = body.trackingNumber;
    history.push({ at: now, by: user.email ?? 'admin', action: 'Zaktualizowano numer przesyłki' });
  }

  if (body.customer) {
    patch.customer = { ...order.customer, ...body.customer };
    history.push({
      at: now,
      by: user.email ?? 'admin',
      action: 'Edycja danych zamówienia',
      detail: Object.keys(body.customer).join(', '),
    });
  }

  if (body.items) {
    patch.items = body.items;
    history.push({ at: now, by: user.email ?? 'admin', action: 'Korekta pozycji zamówienia' });
  }

  const updated = await updateOrder(numer, { ...patch, history });
  return NextResponse.json({ order: updated });
}

/** DELETE — trwałe usunięcie zamówienia, wyłącznie dla roli admin. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  // Faktura bez zamówienia zostałaby w ewidencji sprzedaży jako sprzedaż bez pokrycia
  const order = await getOrder(numer);
  if (order?.invoice) {
    return NextResponse.json(
      {
        error: `Zamówienie ma fakturę ${order.invoice.number}. Najpierw odłącz fakturę w szczegółach zamówienia.`,
      },
      { status: 409 }
    );
  }

  const deleted = await deleteOrder(numer);
  if (!deleted) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  // Zamówienie znika bez śladu w bazie, więc kto i co usunął zostaje w logu serwera.
  console.info(`[Zamówienie ${numer}] Usunięte przez ${user.email ?? user.uid}`);
  return NextResponse.json({ ok: true });
}
