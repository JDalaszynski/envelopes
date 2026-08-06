import { NextResponse } from 'next/server';

import { verifyRequest } from '@/lib/firebase/admin';
import { getUserProfile, saveUserProfile } from '@/lib/store';
import { buildProductName } from '@/lib/product-name';
import type { EnvelopeConfig, SavedConfiguration, UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

/** Zapisane konfiguracje kopert — szablony do zamówień cyklicznych (pkt 6.10). */
export async function POST(request: Request) {
  const user = await verifyRequest(request);
  if (!user) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });

  const body = (await request.json()) as { config: EnvelopeConfig; label?: string };
  if (!body.config) {
    return NextResponse.json({ error: 'Brak konfiguracji do zapisania.' }, { status: 400 });
  }

  const profile: UserProfile = (await getUserProfile(user.uid)) ?? {
    uid: user.uid,
    email: user.email ?? '',
    accountType: 'indywidualne',
    role: user.role,
    marketingConsent: false,
    deferredPaymentEligible: false,
    addresses: [],
    configurations: [],
    createdAt: new Date().toISOString(),
  };

  const entry: SavedConfiguration = {
    id: `cfg-${Date.now().toString(36)}`,
    label: body.label?.trim() || buildProductName(body.config),
    config: body.config,
    savedAt: new Date().toISOString(),
  };

  const updated = await saveUserProfile({
    ...profile,
    configurations: [entry, ...(profile.configurations ?? [])].slice(0, 40),
  });

  return NextResponse.json({ configuration: entry, configurations: updated.configurations });
}

export async function DELETE(request: Request) {
  const user = await verifyRequest(request);
  if (!user) return NextResponse.json({ error: 'Wymagane logowanie.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const profile = await getUserProfile(user.uid);
  if (!profile || !id) {
    return NextResponse.json({ error: 'Nie znaleziono konfiguracji.' }, { status: 404 });
  }

  const updated = await saveUserProfile({
    ...profile,
    configurations: profile.configurations.filter((c) => c.id !== id),
  });

  return NextResponse.json({ configurations: updated.configurations });
}
