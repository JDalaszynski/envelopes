import { NextResponse } from 'next/server';

import { contactEmail, sendEmail } from '@/lib/brevo';

export const runtime = 'nodejs';

interface ContactBody {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message?: string;
  quantity?: string;
  consent?: boolean;
  /** Pole-pułapka dla botów — powinno pozostać puste */
  website?: string;
}

/** Formularz kontaktowy i zapytanie o wycenę hurtową (pkt 6.3). */
export async function POST(request: Request) {
  const body = (await request.json()) as ContactBody;

  // Zabezpieczenie antyspamowe: honeypot wypełniany wyłącznie przez boty
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json(
      { error: 'Prosimy uzupełnić imię i nazwisko, adres e-mail oraz treść wiadomości.' },
      { status: 400 }
    );
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: 'Do wysłania wiadomości potrzebna jest zgoda na przetwarzanie danych.' },
      { status: 400 }
    );
  }

  const result = await sendEmail(
    contactEmail({
      name: body.name.trim(),
      company: body.company?.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim(),
      topic: body.topic ?? 'Inne',
      message: body.message.trim(),
      quantity: body.quantity?.trim(),
    })
  );

  return NextResponse.json({ ok: true, delivered: result.sent, note: result.reason });
}
