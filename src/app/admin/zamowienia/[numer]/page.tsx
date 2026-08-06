import { AdminOrderDetail } from '@/components/admin/AdminOrderDetail';

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ numer: string }>;
}) {
  const { numer } = await params;
  return (
    <section className="section">
      <div className="container">
        <AdminOrderDetail number={numer} />
      </div>
    </section>
  );
}
