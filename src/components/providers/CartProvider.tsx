'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { calculatePrice, DEFAULT_PRICING, round2, applyDiscount } from '@/lib/pricing';
import { buildProductName } from '@/lib/product-name';
import type { CartItem, EnvelopeConfig, ShippingSpeed } from '@/lib/types';

const STORAGE_KEY = 'envelopes.cart';
const DISCOUNT_KEY = 'envelopes.discount';
const SPEED_KEY = 'envelopes.shippingSpeed';
/** Konfiguracja przekazywana z panelu „Złożone zamówienia" do konfiguratora przy edycji */
export const EDIT_KEY = 'envelopes.editConfig';

interface CartContextValue {
  items: CartItem[];
  count: number;
  discountCode: string | null;
  itemsGross: number;
  discountGross: number;
  /**
   * Czas realizacji jest wspólny dla całego koszyka — przesyłka wychodzi
   * jedna, więc nie da się jej wysłać jednocześnie standardowo i ekspresowo.
   * Dopłata ekspresowa nalicza się od łącznej liczby sztuk.
   */
  shippingSpeed: ShippingSpeed;
  setShippingSpeed: (speed: ShippingSpeed) => void;
  /**
   * Czy którakolwiek pozycja wymaga produkcji (nadruk lub personalizacja).
   * Jeśli nie — nie pytamy o czas realizacji, bo koperty czyste pakujemy
   * z magazynu w 2 dni robocze.
   */
  requiresProduction: boolean;
  /**
   * Dopłata ekspresowa za cały koszyk. Jest już wliczona w ceny pozycji
   * (nalicza się per sztuka), więc służy wyłącznie do pokazania klientowi,
   * ile dokładnie kosztuje przyspieszenie — nie dodajemy jej do sumy.
   */
  expressSurcharge: number;
  addItem: (config: EnvelopeConfig) => CartItem;
  updateItem: (id: string, config: EnvelopeConfig) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setDiscountCode: (code: string | null) => void;
  /** Ponowne zamówienie — przelicza konfigurację wg aktualnego cennika (pkt 6.11) */
  reorder: (configs: EnvelopeConfig[]) => void;
  ready: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeItem(config: EnvelopeConfig): CartItem {
  return {
    id: `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    config,
    name: buildProductName(config),
    price: calculatePrice(config, DEFAULT_PRICING),
    addedAt: new Date().toISOString(),
  };
}

/** Przepisuje wspólny czas realizacji na pozycję i przelicza cenę oraz nazwę. */
function withSpeed(item: CartItem, shippingSpeed: ShippingSpeed): CartItem {
  const config = { ...item.config, shippingSpeed };
  return {
    ...item,
    config,
    name: buildProductName(config),
    price: calculatePrice(config, DEFAULT_PRICING),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCodeState] = useState<string | null>(null);
  const [shippingSpeed, setShippingSpeedState] = useState<ShippingSpeed>('standard');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let speed: ShippingSpeed = 'standard';
    try {
      const savedSpeed = window.localStorage.getItem(SPEED_KEY);
      if (savedSpeed === 'ekspres' || savedSpeed === 'standard') speed = savedSpeed;
      setShippingSpeedState(speed);

      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CartItem[];
        // Koszyk bywa odtwarzany po dniach, a w międzyczasie cennik mógł się
        // zmienić. Przeliczamy każdą pozycję wg aktualnych stawek i wspólnego
        // czasu realizacji, żeby kwota w koszyku zgadzała się z tą, którą
        // policzy serwer przy składaniu zamówienia.
        setItems(stored.map((item) => withSpeed(item, speed)));
      }
      const code = window.localStorage.getItem(DISCOUNT_KEY);
      if (code) setDiscountCodeState(code);
    } catch {
      /* uszkodzony wpis w localStorage — startujemy z pustym koszykiem */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const setShippingSpeed = useCallback((speed: ShippingSpeed) => {
    setShippingSpeedState(speed);
    window.localStorage.setItem(SPEED_KEY, speed);
    // Czas realizacji dotyczy całej przesyłki, więc przepisujemy go na
    // wszystkie pozycje — także do nazwy produktu wg standardu z pkt 1.9.
    setItems((prev) => prev.map((item) => withSpeed(item, speed)));
  }, []);

  const addItem = useCallback(
    (config: EnvelopeConfig) => {
      const item = makeItem({ ...config, shippingSpeed });
      setItems((prev) => [...prev, item]);
      return item;
    },
    [shippingSpeed]
  );

  const updateItem = useCallback((id: string, config: EnvelopeConfig) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, config, name: buildProductName(config), price: calculatePrice(config) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setDiscountCodeState(null);
    if (typeof window !== 'undefined') window.localStorage.removeItem(DISCOUNT_KEY);
  }, []);

  const setDiscountCode = useCallback((code: string | null) => {
    setDiscountCodeState(code);
    if (typeof window === 'undefined') return;
    if (code) window.localStorage.setItem(DISCOUNT_KEY, code);
    else window.localStorage.removeItem(DISCOUNT_KEY);
  }, []);

  const reorder = useCallback(
    (configs: EnvelopeConfig[]) => {
      setItems((prev) => [
        ...prev,
        ...configs.map((config) => makeItem({ ...config, shippingSpeed })),
      ]);
    },
    [shippingSpeed]
  );

  const requiresProduction = useMemo(
    () => items.some((item) => item.config.print || item.config.personalization),
    [items]
  );

  /* Gdy z koszyka zniknie ostatnia pozycja z nadrukiem lub personalizacją,
     ekspres przestaje mieć zastosowanie — wracamy do trybu standardowego,
     żeby nie naliczyć dopłaty za przyspieszenie, którego nie ma. */
  useEffect(() => {
    if (!ready) return;
    if (!requiresProduction && shippingSpeed === 'ekspres') setShippingSpeed('standard');
  }, [ready, requiresProduction, shippingSpeed, setShippingSpeed]);

  const itemsGross = useMemo(
    () => round2(items.reduce((sum, item) => sum + item.price.gross, 0)),
    [items]
  );
  const discountGross = useMemo(
    () => applyDiscount(itemsGross, discountCode),
    [itemsGross, discountCode]
  );
  const count = useMemo(
    () => items.reduce((sum, item) => sum + item.price.quantity, 0),
    [items]
  );
  /** Dopłata ekspresowa liczona od łącznej liczby sztuk w koszyku. */
  const expressSurcharge = useMemo(
    () =>
      shippingSpeed === 'ekspres' && requiresProduction
        ? round2(DEFAULT_PRICING.express * count)
        : 0,
    [shippingSpeed, requiresProduction, count]
  );

  const value = useMemo(
    () => ({
      items,
      count,
      discountCode,
      itemsGross,
      discountGross,
      shippingSpeed,
      setShippingSpeed,
      requiresProduction,
      expressSurcharge,
      addItem,
      updateItem,
      removeItem,
      clear,
      setDiscountCode,
      reorder,
      ready,
    }),
    [
      items,
      count,
      discountCode,
      itemsGross,
      discountGross,
      shippingSpeed,
      setShippingSpeed,
      requiresProduction,
      expressSurcharge,
      addItem,
      updateItem,
      removeItem,
      clear,
      setDiscountCode,
      reorder,
      ready,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart musi być użyty wewnątrz CartProvider.');
  return ctx;
}
