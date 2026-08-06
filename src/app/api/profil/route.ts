import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { deleteUserProfile, getUserProfile, listOrders, saveUserProfile } from '@/lib/store';
import type { UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

function emptyProfile(uid: string, email: string): UserProfile {
  return {
    uid,
    email,
    accountType: 'indywidualne',
    role: 'user',
    marketingConsent: false,
    deferredPaymentEligible: false,
    addresses: [],
    configurations: [],
    createdAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const user = await verifyRequest(request);
  if (!user) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });

  const profile = (await getUserProfile(user.uid)) ?? emptyProfile(user.uid, user.email ?? '');

  // Statystyki zamówień. Liczymy również zamówienia złożone wcześniej jako
  // gość na ten sam adres e-mail — tak samo, jak pokazuje je panel
  // „Złożone zamówienia".
  const byUser = await listOrders({ userId: user.uid });
  const byEmail = user.email ? await listOrders({ email: user.email }) : [];
  const unique = new Map(byUser.map((o) => [o.number, o]));
  byEmail.forEach((o) => unique.set(o.number, o));
  const orders = [...unique.values()];
  const completed = orders.filter((o) => o.status === 'zrealizowane').length;

  // Faktura z odroczonym terminem jest dostępna dla wszystkich — to opcja
  // dla instytucji i jednostek budżetowych, których obieg zakupowy nie
  // przewiduje przedpłaty.
  return NextResponse.json({
    profile: { ...profile, role: user.role, deferredPaymentEligible: true },
    stats: { ordersTotal: orders.length, ordersCompleted: completed },
  });
}

export async function PATCH(request: Request) {
  const user = await verifyRequest(request);
  if (!user) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });

  const body = (await request.json()) as Partial<UserProfile>;
  const existing = (await getUserProfile(user.uid)) ?? emptyProfile(user.uid, user.email ?? '');

  const updated = await saveUserProfile({
    ...existing,
    ...body,
    // Pola kontrolowane wyłącznie po stronie serwera
    uid: user.uid,
    email: user.email ?? existing.email,
    role: user.role,
  });

  return NextResponse.json({ profile: updated });
}

/** Usunięcie konta zgodnie z RODO (pkt 6.10). */
export async function DELETE(request: Request) {
  const user = await verifyRequest(request);
  if (!user) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });

  await deleteUserProfile(user.uid);
  return NextResponse.json({
    ok: true,
    note: 'Dane konta zostały usunięte. Dokumenty księgowe pozostają w archiwum przez okres wymagany przepisami podatkowymi.',
  });
}
