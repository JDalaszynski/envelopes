import type { Metadata } from 'next';

import { ApprovalView } from '@/components/account/ApprovalView';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Akceptacja wizualizacji',
  ...noindexMetadata,
};

/**
 * Widok akceptacji wizualizacji dostępny z linku w e-mailu — działa również
 * dla gości, bez logowania (bezpieczny token w adresie, pkt 1.11).
 */
export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <section className="section">
      <div className="container container-narrow">
        <ApprovalView token={token} />
      </div>
    </section>
  );
}
