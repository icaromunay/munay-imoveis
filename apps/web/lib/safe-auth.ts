import { auth } from '@/auth';

const AUTH_TIMEOUT_MS = 2500;

export async function safeAuth() {
  try {
    return await Promise.race([
      auth(),
      new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn(`[auth] timeout after ${AUTH_TIMEOUT_MS}ms; fallback=null`);
          resolve(null);
        }, AUTH_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    console.warn('[auth] failed; fallback=null', error);
    return null;
  }
}
