import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getOrder, updateOrder } from '@/lib/store';
import { sendEmail, visualizationEmail } from '@/lib/brevo';
import { storeFile } from '@/lib/storage';
import type { VisualizationVersion } from '@/lib/types';

export const runtime = 'nodejs';

/**
 * POST — Admin dołącza wizualizację przygotowaną przez grafika (pkt 1.11).
 * Dzieje się to niezależnie od statusu płatności: e-mail z prośbą o akceptację
 * wychodzi także wtedy, gdy klient jeszcze nie zapłacił (pkt 1.12).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ numer: string }> }
) {
  const { numer } = await params;
  const user = await verifyRequest(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Wymagane uprawnienia administratora.' }, { status: 403 });
  }

  const order = await getOrder(numer);
  if (!order) {
    return NextResponse.json({ error: 'Nie znaleziono zamówienia.' }, { status: 404 });
  }
  if (!order.requiresVisualization) {
    return NextResponse.json(
      { error: 'To zamówienie nie zawiera nadruku ani personalizacji — akceptacja nie jest wymagana.' },
      { status: 400 }
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Brak pliku wizualizacji.' }, { status: 400 });
  }

  const stored = await storeFile(file, 'wizualizacja', order.number);
  const now = new Date().toISOString();
  const version: VisualizationVersion = {
    id: `viz-${Date.now().toString(36)}`,
    version: order.visualizations.length + 1,
    file: stored,
    sentAt: now,
    status: 'oczekuje',
  };

  const updated = await updateOrder(numer, {
    visualizations: [...order.visualizations, version],
    visualizationStatus: 'oczekuje',
    status: 'czeka_na_akceptacje',
    history: [
      ...order.history,
      {
        at: now,
        by: user.email ?? 'admin',
        action: `Dołączono wizualizację (wersja ${version.version})`,
        detail: 'Status: Czeka na akceptację',
      },
    ],
  });

  if (updated) {
    const result = await sendEmail(visualizationEmail(updated));
    return NextResponse.json({ order: updated, emailSent: result.sent, emailNote: result.reason });
  }

  return NextResponse.json({ error: 'Nie udało się zapisać wizualizacji.' }, { status: 500 });
}
