export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'imob@munay.com.br').trim().toLowerCase();
export const LEGACY_ADMIN_EMAIL = 'imub@munay.com.br';
export const ADMIN_EMAIL_ALIASES = [ADMIN_EMAIL, LEGACY_ADMIN_EMAIL];

export type AppRole = 'ADMIN' | 'USER';

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? '';
}

export function isAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return ADMIN_EMAIL_ALIASES.includes(normalized);
}

export function canonicalizeAdminEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  return isAdminEmail(normalized) ? ADMIN_EMAIL : normalized;
}

export function resolveRole(email?: string | null): AppRole {
  return isAdminEmail(email) ? 'ADMIN' : 'USER';
}
