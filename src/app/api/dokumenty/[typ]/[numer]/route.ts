import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getOrder } from '@/lib/store';
import { buildInvoicePdf } from '@/lib/documents';

export const runtime = 'nodejs';

/**
 * Dokumenty sprzedaży do pobrania: faktura proforma (przelew tradycyjny)
 * oraz faktura VAT (pkt 1.6, 1.12).
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
  // Fakturę VAT udostępniamy wyłącznie właścicielowi zamówienia lub adminowi.
  if (typ === 'faktura') {
    const user = await verifyRequest(request);
    const isOwner =
      user &&
      (order.userId === user.uid ||
        (user.email && order.customer.email.toLowerCase() === user.email.toLowerCase()));
    if (user?.role !== 'admin' && !isOwner) {
      return NextResponse.json({ error: 'Brak dostępu do dokumentu.' }, { status: 403 });
    }
  }

  const pdf = buildInvoicePdf(order, typ === 'proforma' ? 'proforma' : 'vat');
  const filename = `${typ === 'proforma' ? 'proforma' : 'faktura'}-${order.number}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
}
