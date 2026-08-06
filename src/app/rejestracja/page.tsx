import type { Metadata } from 'next';

import { RegisterForm } from '@/components/auth/RegisterForm';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Rejestracja',
  ...noindexMetadata,
};

export default function RegisterPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <RegisterForm />
      </div>
    </section>
  );
}
