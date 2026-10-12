import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getOrder } from '@/lib/store';
import { buildProformaPdf } from '@/lib/documents';
import { InfaktError, downloadInvoicePdf, getInvoice, isInfaktConfigured } from '@/lib/infakt';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Dokumenty sprzedaży do pobrania (pkt 1.6, 1.12).
 *
 * Proforma powstaje w sklepie — to wezwanie do zapłaty, nie dokument
 * księgowy. Faktura VAT jest zawsze tą wystawioną w inFakt: sklep jej nie
 * składa sam, tylko podaje PDF z inFakt, żeby do jednej sprzedaży nie
 * istniały dwa różne dokumenty.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ typ: string; numer: string }> }
) {
  const { typ, numer } = await params;
  if (typ !== 'proforma' && typ !== 'faktura') {
    return NextResponse.json({ error: 'Nieznany typ dokumentu.' }, { status: 404 });
  }

  const order = await getOrder(numer);
  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }

  // Proforma jest dostępna z linku w e-mailu (klient może nie być zalogowany).
  if (typ === 'proforma') {
    const pdf = buildProformaPdf(order);
    return pdfResponse(new Uint8Array(pdf), `proforma-${order.number}.pdf`);
  }

  // Fakturę VAT udostępniamy wyłącznie właścicielowi zamówienia lub adminowi.
  const user = await verifyRequest(request);
  const isOwner =
    user &&
    (order.userId === user.uid ||
      (user.email && order.customer.email.toLowerCase() === user.email.toLowerCase()));
  if (user?.role !== 'admin' && !isOwner) {
    return NextResponse.json({ error: 'Brak dostępu do dokumentu.' }, { status: 403 });
  }

  if (!order.invoice) {
    return NextResponse.json(
      { error: 'Faktura do tego zamówienia nie została jeszcze wystawiona.' },
      { status: 404 }
    );
  }
  if (!isInfaktConfigured) {
    return NextResponse.json(
      { error: 'Pobieranie faktur jest chwilowo niedostępne.' },
      { status: 503 }
    );
  }

  try {
    // Pobranie PDF-a zmienia w inFakt status szkicu na „Wydrukowana”, czyli
    // wprowadza fakturę do księgowości — szkicu nie wolno więc ruszyć stąd.
    const invoice = await getInvoice(order.invoice.uuid);
    if (invoice.status === 'draft') {
      return NextResponse.json(
        { error: 'Faktura jest w przygotowaniu — będzie dostępna po zatwierdzeniu.' },
        { status: 409 }
      );
    }
    const pdf = await downloadInvoicePdf(order.invoice.uuid);
    return pdfResponse(pdf, `faktura-${invoice.number.replace(/[^\w-]+/g, '-')}.pdf`);
  } catch (error) {
    if (error instanceof InfaktError && error.status === 404) {
      return NextResponse.json({ error: 'Faktura nie jest już dostępna.' }, { status: 404 });
    }
    console.error(`[Faktura ${order.number}] Nie udało się pobrać PDF-a z inFakt:`, error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać faktury. Spróbuj ponownie za chwilę.' },
      { status: 502 }
    );
  }
}

function pdfResponse(pdf: Uint8Array, filename: string) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
