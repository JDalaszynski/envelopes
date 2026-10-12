import { NextResponse } from 'next/server';

import { addDays, orderPaidDay, warsawDay } from '@/lib/accounting';
import { verifyRequest } from '@/lib/firebase/admin';
import {
  InfaktError,
  getInvoice,
  isInfaktConfigured,
  isInfaktSandbox,
  isKsefActive,
  listCorrectiveInvoices,
  listInvoices,
  type InfaktInvoice,
} from '@/lib/infakt';
import { errorText, refreshedSnapshot } from '@/lib/order-invoice';
import { isGatewayPayment } from '@/lib/orders';
import { fetchTransaction, isP24Configured } from '@/lib/p24';
import {
  MONTH_PATTERN,
  buildSalesRegister,
  monthBounds,
  type RegisterSources,
} from '@/lib/sales-register';
import { listOrders, updateOrder } from '@/lib/store';
import type { Order } from '@/lib/types';

export const runtime = 'nodejs';
// Ewidencja odpytuje inFakt o faktury z okresu i Przelewy24 o każdą transakcję
export const maxDuration = 60;

/** Ile transakcji naraz sprawdzamy w bramce */
const P24_CONCURRENCY = 5;

async function mapLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await task(item);
      }
    })
  );
}

/**
 * GET — ewidencja sprzedaży za miesiąc (`?miesiac=RRRR-MM`). Tylko dla roli admin.
 *
 * Przy okazji utrwala w zamówieniach to, co odczytała: aktualny stan faktur
 * z inFakt i dane transakcji z Przelewy24. Dzięki temu ewidencję da się
 * odtworzyć także wtedy, gdy któraś z usług przestanie oddawać stare dane.
 */
export async function GET(request: Request) {
  const user = await verifyRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  const month = new URL(request.url).searchParams.get('miesiac') ?? '';
  if (!MONTH_PATTERN.test(month)) {
    return NextResponse.json({ error: 'Podaj miesiąc w formacie RRRR-MM.' }, { status: 400 });
  }
  const bounds = monthBounds(month);
  const orders = await listOrders();
  const byNumber = new Map(orders.map((order) => [order.number, order]));
  const replace = (order: Order | null) => {
    if (order) byNumber.set(order.number, order);
  };

  const sources: RegisterSources = {
    infakt: { state: isInfaktConfigured ? 'ok' : 'brak-konfiguracji', sandbox: isInfaktSandbox },
    p24: { state: isP24Configured ? 'ok' : 'brak-konfiguracji' },
  };

  /* ── inFakt: faktury z okna wokół miesiąca ──
     Faktura z datą sprzedaży w danym miesiącu bywa wystawiona miesiąc
     wcześniej albo do 15. dnia następnego, stąd zapas po obu stronach. */
  let invoices: InfaktInvoice[] | null = null;
  let corrections: InfaktInvoice[] | null = null;
  let ksefActive: boolean | null = null;
  const invoiceMissing = new Set<string>();

  if (isInfaktConfigured) {
    try {
      invoices = await listInvoices(addDays(bounds.from, -31), addDays(bounds.to, 45));
    } catch (error) {
      sources.infakt = { ...sources.infakt, state: 'blad', detail: errorText(error) };
    }
  }

  if (invoices) {
    const [correctionList, ksef] = await Promise.allSettled([
      listCorrectiveInvoices(bounds.from, bounds.to),
      isKsefActive(),
    ]);
    if (correctionList.status === 'fulfilled') corrections = correctionList.value;
    else {
      sources.infakt.detail = `Nie udało się pobrać faktur korygujących: ${errorText(correctionList.reason)}`;
    }
    ksefActive = ksef.status === 'fulfilled' ? ksef.value : null;

    const fetched = new Map(invoices.map((invoice) => [invoice.uuid, invoice]));
    const linkedOrders = [...byNumber.values()].filter((order) => order.invoice);
    await mapLimit(linkedOrders, 4, async (order) => {
      const current = order.invoice!;
      let fresh = fetched.get(current.uuid) ?? null;
      if (!fresh) {
        // Faktura spoza okna — sprawdzamy ją tylko, gdy dotyczy tego miesiąca
        const relevant =
          current.saleDate.startsWith(month) || (orderPaidDay(order) ?? '').startsWith(month);
        if (!relevant) return;
        try {
          fresh = await getInvoice(current.uuid);
        } catch (error) {
          if (error instanceof InfaktError && error.status === 404) invoiceMissing.add(order.number);
          return;
        }
      }
      const next = refreshedSnapshot(current, fresh);
      if (next) replace(await updateOrder(order.number, { invoice: next }));
    });
  }

  /* ── Przelewy24: potwierdzenie każdej wpłaty z miesiąca ── */
  const p24Unknown = new Set<string>();
  if (isP24Configured) {
    const toCheck = [...byNumber.values()].filter((order) => {
      if (!isGatewayPayment(order.paymentMethod) || order.paymentStatus !== 'oplacone') return false;
      if (order.p24Reference?.startsWith('SYMULACJA')) return false;
      // Dzień wg sklepu może różnić się od dnia wg bramki o dobę — stąd margines
      const paidDay = orderPaidDay(order) ?? warsawDay(order.createdAt);
      const near = paidDay >= addDays(bounds.from, -3) && paidDay <= addDays(bounds.to, 3);
      if (!near && !order.invoice?.saleDate.startsWith(month)) return false;
      // Pełny zapis ma numer paczki wypłaty; do tego czasu dane mogą się jeszcze zmienić
      const complete = order.p24?.source === 'api' && order.p24.status >= 2 && order.p24.batchId;
      return !complete;
    });

    let failures = 0;
    await mapLimit(toCheck, P24_CONCURRENCY, async (order) => {
      const lookup = await fetchTransaction(order.number);
      if (!lookup.found) {
        if (lookup.reason === 'nie-znaleziono') p24Unknown.add(order.number);
        else failures += 1;
        return;
      }
      replace(
        await updateOrder(order.number, {
          p24: lookup.transaction,
          // Zamówienia potwierdzone ręcznie niosą tu token rejestracji zamiast numeru transakcji
          p24Reference: String(lookup.transaction.orderId),
        })
      );
    });
    if (failures > 0) {
      sources.p24 = {
        state: 'blad',
        detail: `Nie udało się sprawdzić ${failures} z ${toCheck.length} transakcji.`,
      };
    }
  }

  const register = buildSalesRegister({
    month,
    orders: [...byNumber.values()],
    invoices,
    corrections,
    p24Unknown,
    invoiceMissing,
    ksefActive,
    sources,
    generatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ register }, { headers: { 'cache-control': 'no-store' } });
}
