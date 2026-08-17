import { NextResponse } from 'next/server';

import { SITE_URL } from '@/lib/seo';
import { sendEmail, verificationEmail, welcomeEmail } from '@/lib/brevo';
import { getAdminAuth, verifyRequest } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const verifiedUser = await verifyRequest(request);
    
    if (!verifiedUser) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { method, name } = await request.json() as { method: string, name?: string };

    const adminAuth = getAdminAuth();
    
    if (method === 'email' && adminAuth && verifiedUser.email) {
      // Wygeneruj link weryfikacyjny dla kont założonych z e-mailem/hasłem
      const link = await adminAuth.generateEmailVerificationLink(verifiedUser.email, {
        url: `${SITE_URL}/profil`
      });
      
      // Wyślij e-mail z linkiem do weryfikacji
      await sendEmail(verificationEmail(verifiedUser.email, link));
    }

    if (verifiedUser.email) {
      // Wyślij e-mail powitalny do każdego nowego użytkownika (email / google)
      await sendEmail(welcomeEmail(verifiedUser.email, name || null));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /auth/post-register] Błąd:', error);
    return NextResponse.json({ error: 'Wystąpił błąd po stronie serwera' }, { status: 500 });
  }
}
