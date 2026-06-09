import { z } from 'zod';
import { ensureApiEnvLoaded } from './load-env.js';

ensureApiEnvLoaded();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter no mínimo 16 caracteres.'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email().default('imob@munay.com.br'),
  ADMIN_PASSWORD: z.string().min(8).default('12345678'),
  GOOGLE_CLIENT_ID: z.string().trim().optional().default(''),
  SITE_URL: z.string().trim().optional().default(''),
  FRONTEND_URL: z.string().trim().optional().default(''),
  NEXT_PUBLIC_SITE_URL: z.string().trim().optional().default(''),
  SMTP_HOST: z.string().trim().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).optional().default('false'),
  SMTP_USER: z.string().trim().optional().default(''),
  SMTP_PASS: z.string().trim().optional().default(''),
  SMTP_FROM: z.string().trim().optional().default(''),
  NOTIFY_EMAIL_TO: z.string().trim().optional().default(''),
  WHATSAPP_NOTIFY_WEBHOOK_URL: z.string().trim().optional().default(''),
  WHATSAPP_NOTIFY_TOKEN: z.string().trim().optional().default(''),
  WHATSAPP_NOTIFY_TO: z.string().trim().optional().default('')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Variáveis de ambiente inválidas', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Falha na validação das variáveis de ambiente.');
}

function toOriginCandidates(value: string) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeHttpUrl(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

const corsOrigins = toOriginCandidates(parsedEnv.data.CORS_ORIGIN);
const resolvedSiteUrl = [
  parsedEnv.data.SITE_URL,
  parsedEnv.data.FRONTEND_URL,
  parsedEnv.data.NEXT_PUBLIC_SITE_URL,
  corsOrigins[0],
  'http://localhost:3000'
]
  .map((candidate) => normalizeHttpUrl(candidate))
  .find(Boolean) || 'http://localhost:3000';

export const env = {
  ...parsedEnv.data,
  SITE_URL: resolvedSiteUrl,
  FRONTEND_URL: normalizeHttpUrl(parsedEnv.data.FRONTEND_URL) || resolvedSiteUrl,
  NEXT_PUBLIC_SITE_URL: normalizeHttpUrl(parsedEnv.data.NEXT_PUBLIC_SITE_URL) || resolvedSiteUrl,
  CORS_ORIGINS: corsOrigins,
  SMTP_SECURE_BOOL: parsedEnv.data.SMTP_SECURE === 'true'
};
