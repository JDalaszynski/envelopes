import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getOrder, updateOrder } from '@/lib/store';
import { paymentConfirmedEmail, sendEmail } from '@/lib/brevo';
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

  return NextResponse.json({ order });
}

interface PatchBody {
  paymentStatus?: 'oczekuje' | 'oplacone';
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
    history.push({
      at: now,
      by: user.email ?? 'admin',
      action:
        body.paymentStatus === 'oplacone'
          ? 'Oznaczono jako opłacone (ręczne potwierdzenie wpłaty)'
          : 'Cofnięto potwierdzenie płatności',
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
