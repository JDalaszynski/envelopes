import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getDb, isAdminConfigured } from './firebase/admin';
import { resolvePricing, type PricingConfig } from './pricing';
import { buildOrderNumber, generateOrderCode } from './orders';
import type { Order, UserProfile } from './types';
import { seedOrders } from './seed';

/**
 * Warstwa dostępu do danych.
 *
 * Produkcyjnie: Firestore (kolekcje `orders`, `users`, `pricing`, `orderNumbers`)
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

const ORDER_NUMBER_ATTEMPTS = 10;

/** Numery przydzielone w tym procesie, a jeszcze niezapisane (tryb lokalny). */
const reservedLocally = new Set<string>();

/**
 * Zajmuje numer, jeśli jest wolny. W Firestore robi to transakcja na
 * `orderNumbers/{numer}`: numer jest przekazywany do Przelewy24 i zapisywany
 * dopiero po rejestracji transakcji, więc dwa równoległe zamówienia z tym
 * samym losowym kodem musiałyby się wykluczyć już tutaj, a nie na `set()`
 * w `saveOrder`, który nadpisałby cudze zamówienie. Dokument zamówienia
 * sprawdzamy też osobno — stare numery (cztery cyfry) nie mają wpisu
 * w `orderNumbers`.
 */
async function reserveOrderNumber(number: string): Promise<boolean> {
  if (usingFirestore()) {
    const db = getDb()!;
    const lock = db.collection('orderNumbers').doc(number);
    const order = db.collection('orders').doc(number);
    return db.runTransaction(async (tx) => {
      const [lockSnap, orderSnap] = await Promise.all([tx.get(lock), tx.get(order)]);
      if (lockSnap.exists || orderSnap.exists) return false;
      tx.set(lock, { reservedAt: new Date().toISOString() });
      return true;
    });
  }

  const db = await readLocal();
  if (db.orders[number] || reservedLocally.has(number)) return false;
  reservedLocally.add(number);
  return true;
}

/**
 * Nadaje numer ENV-RRRRMMDD-XXXX, gdzie XXXX to losowy kod. Kolizja w obrębie
 * dnia jest mało prawdopodobna, ale możliwa, więc losujemy do skutku.
 */
export async function nextOrderNumber(date = new Date()): Promise<string> {
  for (let attempt = 0; attempt < ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    const number = buildOrderNumber(date, generateOrderCode());
    if (await reserveOrderNumber(number)) return number;
  }
  throw new Error('Nie udało się nadać unikalnego numeru zamówienia.');
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

/**
 * Trwale usuwa zamówienie. Zwraca `false`, gdy zamówienie nie istnieje.
 * Pliki klienta w Storage i wpisy rejestru `uploads` zostają — usuwamy
 * wyłącznie dokument zamówienia.
 */
export async function deleteOrder(number: string): Promise<boolean> {
  if (usingFirestore()) {
    const ref = getDb()!.collection('orders').doc(number);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
  }
  const db = await readLocal();
  if (!db.orders[number]) return false;
  delete db.orders[number];
  await writeLocal(db);
  return true;
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
