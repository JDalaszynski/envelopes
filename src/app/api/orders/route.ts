import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getPricing, listOrders, nextOrderNumber, saveOrder } from '@/lib/store';
import { calculatePrice, estimatedDeliveryDate, round2 } from '@/lib/pricing';
import { buildProductName } from '@/lib/product-name';
import {
  generateApprovalToken,
  isDeferredInvoice,
  isGatewayPayment,
  requiresVisualization,
} from '@/lib/orders';
import { adminNewOrderEmail, orderConfirmationEmail, sendEmail } from '@/lib/brevo';
import { isP24Configured, registerTransaction } from '@/lib/p24';
import { SITE_URL } from '@/lib/seo';
import type { CartItem, EnvelopeConfig, Order, PaymentMethod } from '@/lib/types';

export const runtime = 'nodejs';

/** GET — lista zamówień: własne dla klienta, wszystkie dla roli admin. */
export async function GET(request: Request) {
  const user = await verifyRequest(request);
  const { searchParams } = new URL(request.url);

  if (!user) {
    // Gość może odpytać wyłącznie o zamówienia powiązane z jego adresem e-mail,
    // po podaniu numeru zamówienia — pełna lista wymaga zalogowania.
    const email = searchParams.get('email');
    const number = searchParams.get('numer');
    if (!email || !number) {
      return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });
    }
    const orders = await listOrders({ email });
    return NextResponse.json({ orders: orders.filter((o) => o.number === number) });
  }

  const isAdmin = user.role === 'admin';
  const orders = await listOrders({
    ...(isAdmin ? {} : { userId: user.uid }),
    paymentStatus: searchParams.get('platnosc') ?? undefined,
    from: searchParams.get('od') ?? undefined,
    to: searchParams.get('do') ?? undefined,
    search: searchParams.get('szukaj') ?? undefined,
  });

  // Klient zalogowany widzi też zamówienia złożone wcześniej jako gość
  // na ten sam adres e-mail.
  if (!isAdmin && user.email) {
    const byEmail = await listOrders({ email: user.email });
    const merged = new Map(orders.map((o) => [o.number, o]));
    byEmail.forEach((o) => merged.set(o.number, o));
    return NextResponse.json({
      orders: [...merged.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    });
  }

  return NextResponse.json({ orders });
}

interface CreateOrderBody {
  items: { config: EnvelopeConfig }[];
  customer: Order['customer'];
  delivery: Order['delivery'];
  paymentMethod: PaymentMethod;
  marketingConsent?: boolean;
}

/** POST — złożenie zamówienia. */
export async function POST(request: Request) {
  const user = await verifyRequest(request);
  const body = (await request.json()) as CreateOrderBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: 'Koszyk jest pusty.' }, { status: 400 });
  }
  if (!body.customer?.email) {
    return NextResponse.json({ error: 'Brak adresu e-mail zamawiającego.' }, { status: 400 });
  }

  const pricing = await getPricing();

  /* Tryb wysyłki normalizujemy dla całego zamówienia:
     — ekspres dotyczy całej przesyłki, więc obejmuje wszystkie pozycje albo żadnej,
     — zamówienie bez nadruku i personalizacji nie przechodzi przez produkcję,
       więc nie ma czego przyspieszać: dopłaty ekspresowej nie naliczamy. */
  const needsProduction = body.items.some(
    (entry) => entry.config.print || entry.config.personalization
  );
  const orderSpeed =
    needsProduction && body.items.some((entry) => entry.config.shippingSpeed === 'ekspres')
      ? 'ekspres'
      : 'standard';

  // Ceny liczymy zawsze po stronie serwera — wartości przysłane przez
  // klienta są ignorowane.
  const items: CartItem[] = body.items.map((entry, index) => {
    const config = { ...entry.config, shippingSpeed: orderSpeed } as EnvelopeConfig;
    const price = calculatePrice(config, pricing);
    return {
      id: `it-${Date.now().toString(36)}-${index}`,
      config,
      name: buildProductName(config),
      price,
      addedAt: new Date().toISOString(),
    };
  });

  const minimumViolation = items.find(
    (item) => item.config.print && item.price.quantity < pricing.moqWithPrint
  );
  if (minimumViolation) {
    return NextResponse.json(
      { error: `Minimalna ilość dla koperty z nadrukiem to ${pricing.moqWithPrint} szt.` },
      { status: 400 }
    );
  }

  const itemsGross = round2(items.reduce((sum, item) => sum + item.price.gross, 0));
  const deliveryGross = pricing.delivery[body.delivery?.method ?? 'kurier'];
  const gross = round2(itemsGross + deliveryGross);
  const net = round2(gross / (1 + pricing.vatRate));

  const now = new Date();
  const number = await nextOrderNumber(now);
  const needsVisualization = requiresVisualization(items);
  // Bez nadruku i personalizacji zamówienie nie idzie do produkcji — termin
  // liczymy wtedy wg trybu magazynowego, niezależnie od przysłanej wartości.

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);

  const order: Order = {
    number,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    userId: user?.uid ?? null,
    customer: body.customer,
    delivery: { ...body.delivery, cost: deliveryGross },
    items,
    totals: {
      itemsGross,
      deliveryGross,
      gross,
      net,
      vat: round2(gross - net),
    },
    paymentMethod: body.paymentMethod,
    paymentStatus: 'oczekuje',
    p24Reference: null,
    paymentDueDate: isDeferredInvoice(body.paymentMethod) ? dueDate.toISOString() : null,
    requiresVisualization: needsVisualization,
    visualizationStatus: 'brak',
    visualizations: [],
    approvalToken: generateApprovalToken(),
    estimatedDelivery: estimatedDeliveryDate(
      { speed: orderSpeed, requiresProduction: needsVisualization },
      pricing,
      now
    ).toISOString(),
    trackingNumber: null,
    marketingConsent: Boolean(body.marketingConsent),
    history: [{ at: now.toISOString(), by: 'system', action: 'Zamówienie złożone' }],
  };

  let redirectUrl: string | null = null;

  if (isGatewayPayment(order.paymentMethod)) {
    const result = await registerTransaction(
      order,
      `${SITE_URL}/zamowienie/potwierdzenie/${order.number}`,
      `${SITE_URL}/api/platnosci/p24/webhook`
    );

    if (result.simulated) {
      // Brak konfiguracji bramki — potwierdzamy płatność lokalnie, żeby
      // ścieżka zakupowa pozostała przejezdna od końca do końca.
      order.paymentStatus = 'oplacone';
      order.p24Reference = `SYMULACJA-${order.number}`;
      order.history.push({
        at: now.toISOString(),
        by: 'Przelewy24',
        action: 'Płatność potwierdzona (symulacja — brak kluczy bramki)',
      });
    } else if (result.ok) {
      redirectUrl = result.redirectUrl;
      order.p24Reference = result.token ?? null;
    } else {
      return NextResponse.json(
        { error: `Nie udało się rozpocząć płatności: ${result.reason ?? 'błąd bramki'}` },
        { status: 502 }
      );
    }
  }

  await saveOrder(order);

  // Zawsze wysyłamy powiadomienie do obsługi sklepu o nowym zamówieniu.
  // Nie czekamy na webhook, aby sklep wiedział o każdym rozpoczętym zamówieniu.
  await sendEmail(await adminNewOrderEmail(order));

  // E-mail potwierdzający — treść zależna od metody płatności (pkt 1.12).
  // Przy płatności bramką wysyłamy go dopiero po potwierdzeniu transakcji.
  if (!isGatewayPayment(order.paymentMethod) || order.paymentStatus === 'oplacone') {
    await sendEmail(orderConfirmationEmail(order));
  }

  return NextResponse.json({
    order,
    redirectUrl,
    gatewayConfigured: isP24Configured,
  });
}
