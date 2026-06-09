import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const FALLBACK_DEV_SECRET = 'munay-email-settings-dev-secret-2026';

function getEncryptionSecret() {
  const configured = [
    process.env.EMAIL_SETTINGS_SECRET,
    process.env.NEXTAUTH_SECRET,
    process.env.AUTH_SECRET,
    process.env.JWT_SECRET
  ]
    .map((value) => String(value || '').trim())
    .find(Boolean);

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return FALLBACK_DEV_SECRET;
  }

  throw new Error('Defina EMAIL_SETTINGS_SECRET (ou um secret equivalente do sistema) para criptografar a senha SMTP.');
}

function buildKey() {
  return createHash('sha256').update(getEncryptionSecret()).digest();
}

export function encryptSecret(value: string) {
  const normalized = String(value || '');
  if (!normalized) {
    throw new Error('Informe uma senha SMTP válida para criptografia.');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, buildKey(), iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptSecret(payload: string) {
  const normalized = String(payload || '').trim();
  if (!normalized) {
    throw new Error('Nenhuma senha SMTP criptografada foi encontrada.');
  }

  const [ivEncoded, authTagEncoded, encryptedEncoded] = normalized.split('.');
  if (!ivEncoded || !authTagEncoded || !encryptedEncoded) {
    throw new Error('O formato da senha SMTP criptografada é inválido.');
  }

  const decipher = createDecipheriv(ALGORITHM, buildKey(), Buffer.from(ivEncoded, 'base64url'), {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(Buffer.from(authTagEncoded, 'base64url'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

export const SMTP_PASSWORD_MASK = '************';
