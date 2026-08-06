import type { Metadata } from 'next';

import { ProfileView } from '@/components/account/ProfileView';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Profil użytkownika',
  ...noindexMetadata,
};

export default function ProfilePage() {
  return (
    <section className="section">
      <div className="container">
        <ProfileView />
      </div>
    </section>
  );
}
