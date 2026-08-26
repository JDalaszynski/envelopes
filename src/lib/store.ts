import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getDb, isAdminConfigured } from './firebase/admin';
import { resolvePricing, type PricingConfig } from './pricing';
import { buildOrderNumber } from './orders';
import type { Order, UserProfile } from './types';
import { seedOrders } from './seed';

/**
 * Warstwa dostępu do danych.
 *
 * Produkcyjnie: Firestore (kolekcje `orders`, `users`, `pricing`, `counters`)
 * przez Admin SDK — pkt 8.1.
 *
 * Gdy zmienne środowiskowe Firebase nie są ustawione, ta sama warstwa
 * zapisuje do pliku `.data/db.json`, żeby prototyp był w pełni klikalny
 * bez konta Firebase. Interfejs jest identyczny — podmiana backendu
 * nie wymaga zmian w API Routes ani w komponentach.
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface LocalDb {
  orders: Record<string, Order>;
  users: Record<string, UserProfile>;
  counters: Record<string, number>;
  /**
   * Nadpisania cennika. Pole zostaje w kształcie danych, ale **żadna wartość
   * nie jest dziś stosowana** — `resolvePricing()` odrzuca rozjazd, bo ceny
   * pokazywane klientowi pochodzą z `DEFAULT_PRICING` wkompilowanego w strony.
   * Rozjeżdżające się pole trafia do logu serwera jako błąd.
   */
  pricing: Partial<PricingConfig>;
}

let localCache: LocalDb | null = null;

async function readLocal(): Promise<LocalDb> {
  if (localCache) return localCache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    localCache = JSON.parse(raw) as LocalDb;
  } catch {
    const orders = seedOrders();
    localCache = {
      orders: orders.reduce<Record<string, Order>>((acc, o) => {
        acc[o.number] = o;
        return acc;
      }, {}),
      users: {},
      // Liczniki dzienne startują od najwyższego numeru użytego w danych
      // demonstracyjnych, żeby pierwsze prawdziwe zamówienie nie dostało
      // numeru już zajętego.
      counters: orders.reduce<Record<string, number>>((acc, o) => {
        const [, day, sequence] = o.number.split('-');
        acc[day] = Math.max(acc[day] ?? 0, Number(sequence));
        return acc;
      }, {}),
      pricing: {},
    };
    await writeLocal(localCache);
  }
  return localCache;
}

async function writeLocal(db: LocalDb): Promise<void> {
  localCache = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export const usingFirestore = (): boolean => isAdminConfigured && Boolean(getDb());

/* ── Cennik ─────────────────────────────────────────────────── */

/**
 * Cennik dla serwera. Nadpisanie z bazy jest **czytane i sprawdzane, ale nie
 * stosowane** — decyzję i jej powód opisuje `resolvePricing()` w `pricing.ts`.
 * Odczyt zostaje, bo to on wykrywa rozjazd i wpisuje go do logu; bez niego
 * dokument w bazie leżałby niezauważony.
 */
export async function getPricing(): Promise<PricingConfig> {
  if (usingFirestore()) {
    const snap = await getDb()!.collection('pricing').doc('current').get();
    return resolvePricing(snap.exists ? (snap.data() as Partial<PricingConfig>) : null);
  }
  const db = await readLocal();
  return resolvePricing(db.pricing);
}

/* ── Numeracja zamówień (pkt 1.8) ───────────────────────────── */

/**
 * Transakcyjnie zwiększa dzienny licznik i zwraca kolejny numer.
 * W Firestore licznik żyje w `counters/{RRRRMMDD}` i jest inkrementowany
 * w transakcji, więc dwa równoległe zamówienia nie dostaną tego samego numeru.
 */
export async function nextOrderNumber(date = new Date()): Promise<string> {
  const key = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}`;

  if (usingFirestore()) {
    const db = getDb()!;
    const ref = db.collection('counters').doc(key);
    const sequence = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists ? ((snap.data()?.value as number) ?? 0) : 0;
      const next = current + 1;
      tx.set(ref, { value: next }, { merge: true });
      return next;
    });
    return buildOrderNumber(date, sequence);
  }

  const db = await readLocal();
  const next = (db.counters[key] ?? 0) + 1;
  db.counters[key] = next;
  await writeLocal(db);
  return buildOrderNumber(date, next);
}

/* ── Zamówienia ─────────────────────────────────────────────── */

export async function saveOrder(order: Order): Promise<Order> {
  if (usingFirestore()) {
    await getDb()!.collection('orders').doc(order.number).set(order);
    return order;
  }
  const db = await readLocal();
  db.orders[order.number] = order;
  await writeLocal(db);
  return order;
}

export async function getOrder(number: string): Promise<Order | null> {
  if (usingFirestore()) {
    const snap = await getDb()!.collection('orders').doc(number).get();
    return snap.exists ? (snap.data() as Order) : null;
  }
  const db = await readLocal();
  return db.orders[number] ?? null;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  if (usingFirestore()) {
    const snap = await getDb()!
      .collection('orders')
      .where('approvalToken', '==', token)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as Order);
  }
  const db = await readLocal();
  return Object.values(db.orders).find((o) => o.approvalToken === token) ?? null;
}

export interface OrderQuery {
  userId?: string;
  email?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  search?: string;
}

export async function listOrders(query: OrderQuery = {}): Promise<Order[]> {
  let orders: Order[];

  if (usingFirestore()) {
    let ref = getDb()!.collection('orders') as FirebaseFirestore.Query;
    if (query.userId) ref = ref.where('userId', '==', query.userId);
    const snap = await ref.get();
    orders = snap.docs.map((d) => d.data() as Order);
  } else {
    const db = await readLocal();
    orders = Object.values(db.orders);
    if (query.userId) orders = orders.filter((o) => o.userId === query.userId);
  }

  // Klient bez konta (gość) — dopasowanie po adresie e-mail zamówienia
  if (query.email) {
    orders = orders.filter(
      (o) => o.customer.email.toLowerCase() === query.email!.toLowerCase()
    );
  }
  if (query.paymentStatus && query.paymentStatus !== 'all') {
    orders = orders.filter((o) => o.paymentStatus === query.paymentStatus);
  }
  if (query.from) {
    orders = orders.filter((o) => o.createdAt >= query.from!);
  }
  if (query.to) {
    const end = `${query.to}T23:59:59.999Z`;
    orders = orders.filter((o) => o.createdAt <= end);
  }
  if (query.search) {
    const q = query.search.trim().toLowerCase();
    orders = orders.filter((o) => {
      const customer = o.customer.isCompany
        ? (o.customer.firma ?? '')
        : `${o.customer.imie} ${o.customer.nazwisko}`;
      return (
        o.number.toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q)
      );
    });
  }

  return orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function updateOrder(
  number: string,
  patch: Partial<Order>
): Promise<Order | null> {
  const existing = await getOrder(number);
  if (!existing) return null;
  const updated: Order = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await saveOrder(updated);
  return updated;
}

/* ── Użytkownicy ────────────────────────────────────────────── */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (usingFirestore()) {
    const snap = await getDb()!.collection('users').doc(uid).get();
    return snap.exists ? (snap.data() as UserProfile) : null;
  }
  const db = await readLocal();
  return db.users[uid] ?? null;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  if (usingFirestore()) {
    await getDb()!.collection('users').doc(profile.uid).set(profile, { merge: true });
    return profile;
  }
  const db = await readLocal();
  db.users[profile.uid] = { ...db.users[profile.uid], ...profile };
  await writeLocal(db);
  return db.users[profile.uid];
}

export async function deleteUserProfile(uid: string): Promise<void> {
  if (usingFirestore()) {
    await getDb()!.collection('users').doc(uid).delete();
    return;
  }
  const db = await readLocal();
  delete db.users[uid];
  await writeLocal(db);
}
