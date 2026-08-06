import { NextResponse } from 'next/server';

import { subscribeToNewsletter } from '@/lib/brevo';

export const runtime = 'nodejs';

/** Zapis do newslettera — lista kontaktów w Brevo (pkt 6.1, 8.1). */
export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; consent?: boolean };
  const email = body.email?.trim().toLowerCase() ?? '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: 'Prosimy podać poprawny adres e-mail.' }, { status: 400 });
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: 'Do zapisu potrzebna jest zgoda na przetwarzanie danych.' },
      { status: 400 }
    );
  }

  const result = await subscribeToNewsletter(email, { ZRODLO: 'newsletter-form' });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason ?? 'Nie udało się zapisać adresu.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, note: result.reason });
}
