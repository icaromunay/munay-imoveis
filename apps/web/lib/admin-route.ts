import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safe-auth';

type AdminRouteResult =
  | {
      session: NonNullable<Awaited<ReturnType<typeof safeAuth>>>;
      error: null;
    }
  | {
      session: null;
      error: NextResponse;
    };

export async function requireAdminRoute(): Promise<AdminRouteResult> {
  const session = await safeAuth();

  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { message: 'Sessão não encontrada.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { message: 'Acesso restrito aos administradores.' },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    };
  }

  return { session, error: null };
}
