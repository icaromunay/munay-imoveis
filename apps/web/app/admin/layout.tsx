import { redirect } from 'next/navigation';
import { safeAuth } from '@/lib/safe-auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await safeAuth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/acesso-negado');
  }

  return <div className="admin-theme min-h-screen">{children}</div>;
}
