import { auth } from '@/auth';

export class SafeAuthError extends Error {
  originalCause: unknown;

  constructor(message: string, originalCause: unknown) {
    super(message);
    this.name = 'SafeAuthError';
    this.originalCause = originalCause;
  }
}

export async function safeAuth() {
  const startedAt = Date.now();

  try {
    const session = await auth();
    const duration = Date.now() - startedAt;
    const status = session?.user ? 'authenticated' : 'anonymous';

    if (session?.user || duration >= 250) {
      console.info(`[auth] safeAuth resolved status=${status} duration=${duration}ms`);
    }

    return session;
  } catch (error) {
    const duration = Date.now() - startedAt;
    console.error(`[auth] safeAuth failed duration=${duration}ms`, error);
    throw new SafeAuthError('Falha ao obter a sessão do NextAuth.', error);
  }
}
