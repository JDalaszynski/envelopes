import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/LoginForm';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Logowanie',
  ...noindexMetadata,
};

export default function LoginPage() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <LoginForm />
      </div>
    </section>
  );
}
