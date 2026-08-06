import type { Metadata } from 'next';

import { AdminBar } from '@/components/admin/AdminBar';
import { noindexMetadata } from '@/lib/seo';

/**
 * Panel administracyjny — osobna, chroniona część serwisu (pkt 6.12).
 * Niewidoczna w publicznym menu, wyłączona z indeksowania i sitemapy,
 * zablokowana w robots.txt. Rola `admin` jest weryfikowana po stronie
 * serwera przy każdym wywołaniu API, nie tylko ukrywana w interfejsie.
 */
export const metadata: Metadata = {
  title: { default: 'Panel administracyjny', template: '%s | Panel Envelopes' },
  ...noindexMetadata,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminBar />
      {children}
    </>
  );
}
