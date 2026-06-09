import { createHash, randomBytes } from 'crypto';

const DEFAULT_RESET_TTL_MINUTES = 30;
const DEFAULT_RESET_COOLDOWN_MINUTES = 2;

export const PASSWORD_RESET_SUCCESS_MESSAGE = 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.';
export const PASSWORD_RESET_INVALID_MESSAGE = 'Link inválido ou expirado.';
export const PASSWORD_RESET_CHANGED_MESSAGE = 'Senha alterada com sucesso. Faça login com sua nova senha.';

function clampPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeHttpUrl(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function getRequestOrigin(headers?: Headers) {
  if (!headers) return '';

  const origin = normalizeHttpUrl(headers.get('origin'));
  if (origin) return origin;

  const forwardedHost = String(headers.get('x-forwarded-host') || headers.get('host') || '').trim();
  if (!forwardedHost) return '';

  const forwardedProto = String(headers.get('x-forwarded-proto') || '').trim() || 'https';
  return normalizeHttpUrl(`${forwardedProto}://${forwardedHost}`);
}

export function normalizePasswordResetEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

export function generatePasswordResetToken() {
  const rawToken = randomBytes(32).toString('hex');

  return {
    rawToken,
    tokenHash: hashPasswordResetToken(rawToken)
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash('sha256').update(String(token || '').trim()).digest('hex');
}

export function getPasswordResetExpirationDate() {
  const ttlMinutes = clampPositiveInteger(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES, DEFAULT_RESET_TTL_MINUTES);
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
}

export function getPasswordResetCooldownDate() {
  const cooldownMinutes = clampPositiveInteger(process.env.PASSWORD_RESET_REQUEST_COOLDOWN_MINUTES, DEFAULT_RESET_COOLDOWN_MINUTES);
  return new Date(Date.now() - cooldownMinutes * 60 * 1000);
}

export function getPasswordResetBaseUrl(headers?: Headers) {
  return (
    getRequestOrigin(headers) ||
    normalizeHttpUrl(process.env.NEXTAUTH_URL) ||
    normalizeHttpUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    'http://localhost:3000'
  );
}

export function buildPasswordResetLink(rawToken: string, headers?: Headers) {
  const baseUrl = getPasswordResetBaseUrl(headers);
  return `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
}
