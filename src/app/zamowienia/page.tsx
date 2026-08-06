import type { Metadata } from 'next';

import { OrdersList } from '@/components/account/OrdersList';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Złożone zamówienia',
  ...noindexMetadata,
};

export default function OrdersPage() {
  return (
    <section className="section">
      <div className="container">
        <OrdersList />
      </div>
    </section>
  );
}
