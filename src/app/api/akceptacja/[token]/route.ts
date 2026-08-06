import { NextResponse } from 'next/server';

import { getOrderByToken, updateOrder } from '@/lib/store';
import { evaluatePrintGate, ORDER_STATUS_LABEL } from '@/lib/orders';
import { sendEmail, statusChangeEmail } from '@/lib/brevo';
import type { Order } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * Akceptacja wizualizacji przez klienta (pkt 1.11).
 * Dostęp zabezpieczony tokenem z e-maila — działa również dla gości,
 * bez konieczności logowania.
 */

/** Zwraca okrojone dane zamówienia potrzebne do widoku akceptacji. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) {
    return NextResponse.json({ error: 'Link jest nieprawidłowy lub wygasł.' }, { status: 404 });
  }
  return NextResponse.json({ order: publicView(order) });
}

interface ActionBody {
  action: 'akceptuj' | 'uwagi';
  comment?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) {
    return NextResponse.json({ error: 'Link jest nieprawidłowy lub wygasł.' }, { status: 404 });
  }
  if (order.visualizationStatus !== 'oczekuje') {
    return NextResponse.json(
      { error: 'To zamówienie nie oczekuje obecnie na akceptację wizualizacji.' },
      { status: 409 }
    );
  }

  const body = (await request.json()) as ActionBody;
  const now = new Date().toISOString();
  const latest = order.visualizations[order.visualizations.length - 1];

  if (body.action === 'akceptuj') {
    const visualizations = order.visualizations.map((v) =>
      v.id === latest?.id ? { ...v, status: 'zaakceptowano' as const, respondedAt: now } : v
    );

    // Po akceptacji sprawdzamy regułę bramkującą — zamówienie przechodzi
    // do druku tylko wtedy, gdy płatność jest już potwierdzona (pkt 1.12).
    const gate = evaluatePrintGate({
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      requiresVisualization: order.requiresVisualization,
      visualizationStatus: 'zaakceptowano',
    });

    const status: Order['status'] = gate.allowed ? 'do_druku' : 'czeka_na_akceptacje';

    const updated = await updateOrder(order.number, {
      visualizations,
      visualizationStatus: 'zaakceptowano',
      status,
      history: [
        ...order.history,
        { at: now, by: 'klient', action: 'Wizualizacja zaakceptowana' },
        ...(gate.allowed
          ? [{ at: now, by: 'system', action: `Status: ${ORDER_STATUS_LABEL.do_druku}` }]
          : []),
      ],
    });

    if (updated && gate.allowed) {
      await sendEmail(statusChangeEmail(updated, ORDER_STATUS_LABEL.do_druku));
    }

    return NextResponse.json({
      order: updated ? publicView(updated) : null,
      movedToPrint: gate.allowed,
      note: gate.allowed ? null : 'Czekamy jeszcze na wpłatę — po jej zaksięgowaniu zamówienie trafi do druku.',
    });
  }

  const comment = (body.comment ?? '').trim();
  if (!comment) {
    return NextResponse.json({ error: 'Prosimy opisać uwagi do projektu.' }, { status: 400 });
  }

  const visualizations = order.visualizations.map((v) =>
    v.id === latest?.id
      ? { ...v, status: 'uwagi' as const, customerComment: comment, respondedAt: now }
      : v
  );

  const updated = await updateOrder(order.number, {
    visualizations,
    visualizationStatus: 'uwagi',
    status: 'czeka_na_akceptacje',
    history: [
      ...order.history,
      { at: now, by: 'klient', action: 'Zgłoszono uwagi do wizualizacji', detail: comment },
    ],
  });

  return NextResponse.json({ order: updated ? publicView(updated) : null });
}

/** Widok publiczny — bez danych, które nie są potrzebne do akceptacji. */
function publicView(order: Order) {
  return {
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    visualizationStatus: order.visualizationStatus,
    visualizations: order.visualizations,
    items: order.items.map((item) => ({ name: item.name, config: item.config })),
    customerFirstName: order.customer.imie,
    estimatedDelivery: order.estimatedDelivery,
  };
}
