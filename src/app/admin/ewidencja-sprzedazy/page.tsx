import type { Metadata } from 'next';

import { SalesRegister } from '@/components/admin/SalesRegister';

export const metadata: Metadata = { title: 'Ewidencja sprzedaży' };

/**
 * Miesięczna ewidencja sprzedaży: zamówienie w sklepie, faktura w inFakt
 * i transakcja w Przelewy24 w jednym wierszu, z podglądem i eksportem do PDF.
 */
export default function SalesRegisterPage() {
  return (
    <section className="section">
      {/* Szerzej niż reszta panelu: wiersz niesie zamówienie, fakturę i wpłatę obok siebie */}
      <div className="container" style={{ maxWidth: 1480 }}>
        <SalesRegister />
      </div>
    </section>
  );
}
