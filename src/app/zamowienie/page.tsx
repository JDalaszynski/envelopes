import type { Metadata } from 'next';

import { CheckoutView } from '@/components/checkout/CheckoutView';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Zamówienie',
  description: 'Dane do wysyłki, metoda dostawy i płatności.',
  ...noindexMetadata,
};

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="container">
        <CheckoutView />
      </div>
    </section>
  );
}
