import { NextResponse } from 'next/server';

import { buildInvoiceDraft, warsawDay, type InvoiceStatusResponse } from '@/lib/accounting';
import { verifyRequest } from '@/lib/firebase/admin';
import {
  InfaktError,
  isInfaktConfigured,
  isInfaktSandbox,
  isKsefActive,
  nextInvoiceNumber,
} from '@/lib/infakt';
import {
  InvoiceActionError,
  emailInvoice,
  errorText,
  issueInvoice,
  ksefInvoice,
  linkInvoice,
  payInvoice,
  refreshInvoice,
  resumeInvoiceTask,
  unlinkInvoice,
  type InvoiceActionResult,
} from '@/lib/order-invoice';
import { getOrder } from '@/lib/store';

export const runtime = 'nodejs';
// Wystawienie czeka na asynchroniczne utworzenie faktury po stronie inFakt
export const maxDuration = 60;

const NOT_CONFIGURED =
  'Integracja z inFakt nie jest skonfigurowana — dodaj zmienną INFAKT_API_KEY w ustawieniach Vercela i wdróż ponownie.';

/** GET — stan faktury zamówienia, odświeżony z inFakt. Tylko dla roli admin. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  let order = await getOrder(numer);
  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  const status: InvoiceStatusResponse = {
    configured: isInfaktConfigured,
    sandbox: isInfaktSandbox,
    order,
    draft: null,
    ksefActive: null,
    nextNumber: null,
    invoiceMissing: false,
    pending: false,
    error: null,
  };

  if (isInfaktConfigured) {
    try {
      if (!order.invoice && order.invoiceTask?.reference) {
        const resumed = await resumeInvoiceTask(order, user.email ?? 'admin', 0);
        order = resumed.order;
        status.pending = Boolean(resumed.pending);
      }
      if (order.invoice) {
        const refreshed = await refreshInvoice(order);
        order = refreshed.order;
        status.invoiceMissing = refreshed.missing;
      }
      const [ksef, next] = await Promise.allSettled([
        isKsefActive(),
        order.invoice ? Promise.resolve(null) : nextInvoiceNumber(),
      ]);
      status.ksefActive = ksef.status === 'fulfilled' ? ksef.value : null;
      status.nextNumber = next.status === 'fulfilled' ? next.value : null;
      // Sam odczyt statusu KSeF bywa niedostępny w planie — klucz mógł jednak zostać odrzucony w całości
      if (ksef.status === 'rejected' && next.status === 'rejected') {
        status.error = errorText(next.reason);
      }
    } catch (error) {
      if (error instanceof InvoiceActionError && error.order) order = error.order;
      status.error = errorText(error);
    }
  }

  status.order = order;
  if (!order.invoice) {
    status.draft = buildInvoiceDraft(order, { today: warsawDay(new Date()) });
  }
  return NextResponse.json(status);
}

interface ActionBody {
  action?: 'issue' | 'link' | 'unlink' | 'email' | 'ksef' | 'markPaid';
  saleDate?: string;
  sendToKsef?: boolean;
  invoiceNumber?: string;
  uuid?: string;
}

/** POST — akcje na fakturze zamówienia. Tylko dla roli admin. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowe żądanie.' }, { status: 400 });
  }

  const by = user.email ?? 'admin';
  // Odłączenie niczego nie wysyła do inFakt, więc działa także bez klucza
  if (body.action !== 'unlink' && !isInfaktConfigured) {
    return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
  }

  try {
    let result: InvoiceActionResult;
    switch (body.action) {
      case 'issue':
        result = await issueInvoice(numer, {
          by,
          saleDate: body.saleDate,
          sendToKsef: body.sendToKsef,
        });
        break;
      case 'link':
        result = await linkInvoice(numer, { by, invoiceNumber: body.invoiceNumber, uuid: body.uuid });
        break;
      case 'unlink':
        result = await unlinkInvoice(numer, by);
        break;
      case 'email':
        result = await emailInvoice(numer, by);
        break;
      case 'ksef':
        result = await ksefInvoice(numer, by);
        break;
      case 'markPaid':
        result = await payInvoice(numer, by);
        break;
      default:
        return NextResponse.json({ error: 'Nieznana akcja.' }, { status: 400 });
    }
    return NextResponse.json(result, { status: result.pending ? 202 : 200 });
  } catch (error) {
    if (error instanceof InvoiceActionError) {
      return NextResponse.json(
        { error: error.message, ...(error.order ? { order: error.order } : {}) },
        { status: error.status }
      );
    }
    if (error instanceof InfaktError) {
      // 401 z inFakt to problem klucza, a nie sesji Admina — przeglądarka nie może uznać go za wylogowanie
      const status = error.status === 401 || error.status === 403 ? 502 : error.status;
      return NextResponse.json({ error: error.message }, { status: status >= 400 ? status : 502 });
    }
    console.error(`[Faktura ${numer}] Nieobsłużony błąd akcji ${body.action}:`, error);
    return NextResponse.json(
      { error: 'Nie udało się wykonać operacji na fakturze. Spróbuj ponownie.' },
      { status: 500 }
    );
  }
}
