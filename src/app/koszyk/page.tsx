import type { Metadata } from 'next';

import { CartView } from '@/components/cart/CartView';
import { noindexMetadata } from '@/lib/seo';

/* Koszyk jest stroną prywatną/przejściową — poza indeksem i sitemapą (pkt 8.3). */
export const metadata: Metadata = {
  title: 'Koszyk',
  description: 'Podsumowanie wybranych kopert przed złożeniem zamówienia.',
  ...noindexMetadata,
};

export default function CartPage() {
  return (
    <section className="section">
      <div className="container">
        <CartView />
      </div>
    </section>
  );
}
