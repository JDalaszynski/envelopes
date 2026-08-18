'use client';

import { useEffect } from 'react';

import { trackPurchase } from '@/lib/analytics';
import type { CartItem } from '@/lib/types';

/**
 * Zdarzenie `purchase` na ekranie potwierdzenia zamówienia.
 *
 * Ekran potwierdzenia jest zwykłym adresem: klient wraca na niego z bramki
 * Przelewy24, odświeża go, wraca do niego z historii przeglądarki i otwiera
 * z linku w mailu. Każde takie wejście renderuje stronę od nowa, więc bez
 * zabezpieczenia jedno zamówienie policzyłoby się wielokrotnie — a przychód
 * w GA4 rozjechałby się z rzeczywistym w sposób trudny do wychwycenia,
 * bo zawyżenie byłoby proporcjonalne do liczby powrotów, nie stałe.
 *
 * Zabezpieczenia są dwa i są celowo różnej natury. `sessionStorage` zamyka
 * sprawę po stronie przeglądarki, natychmiast i bez sieci. `transaction_id`
 * w samym zdarzeniu zamyka ją po stronie GA4 także wtedy, gdy klient wróci
 * z innej karty albo po wyczyszczeniu pamięci sesji.
 *
 * Komponent świadomie nic nie renderuje — ekran potwierdzenia jest w całości
 * serwerowy i ma taki zostać; to jedyny fragment, który musi wykonać się
 * w przeglądarce.
 */
export function PurchaseEvent({
  number,
  items,
  itemsGross,
  deliveryGross,
  gross,
}: {
  number: string;
  items: CartItem[];
  itemsGross: number;
  deliveryGross: number;
  gross: number;
}) {
  useEffect(() => {
    const key = `envelopes.purchaseSent.${number}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, '1');
    } catch {
      /* Pamięć sesji zablokowana w przeglądarce — zostaje odsiew po
         `transaction_id` po stronie GA4, czyli zdarzenie i tak nie policzy
         się dwa razy. Milczenie tutaj jest lepsze niż pominięcie sprzedaży. */
    }

    trackPurchase({ number, items, itemsGross, deliveryGross, gross });
  }, [number, items, itemsGross, deliveryGross, gross]);

  return null;
}
