import type { Metadata } from 'next';

import { OrderDetail } from '@/components/account/OrderDetail';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Szczegóły zamówienia',
  ...noindexMetadata,
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ numer: string }>;
}) {
  const { numer } = await params;
  return (
    <section className="section">
      <div className="container">
        <OrderDetail number={numer} />
      </div>
    </section>
  );
}
