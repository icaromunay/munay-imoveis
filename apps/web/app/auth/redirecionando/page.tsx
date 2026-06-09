import { redirect } from 'next/navigation';
import { safeAuth } from '@/lib/safe-auth';

export default async function AuthRedirectPage() {
  const session = await safeAuth();

  if (!session?.user) {
    redirect('/login');
  }

  redirect(session.user.role === 'ADMIN' ? '/admin' : '/area-do-proprietario');
}
