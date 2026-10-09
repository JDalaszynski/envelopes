import type { Metadata } from 'next';

import { VisualizationGenerator } from '@/components/admin/VisualizationGenerator';
import { isValidOrderNumber } from '@/lib/orders';

export const metadata: Metadata = { title: 'Generator wizualizacji' };

/**
 * Generator PDF-a z wizualizacją do akceptacji. Parametr `zamowienie`
 * pozwala wejść tu wprost ze szczegółów zamówienia, z wybraną pozycją listy.
 */
export default async function VisualizationGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ zamowienie?: string | string[] }>;
}) {
  const { zamowienie } = await searchParams;
  const initialOrder =
    typeof zamowienie === 'string' && isValidOrderNumber(zamowienie) ? zamowienie : undefined;

  return (
    <section className="section">
      <div className="container">
        <VisualizationGenerator initialOrder={initialOrder} />
      </div>
    </section>
  );
}
