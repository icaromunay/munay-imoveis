import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decryptSecret, encryptSecret, SMTP_PASSWORD_MASK } from '@/lib/smtp-crypto';

export type EmailTemplateSlug = 'PASSWORD_RESET';
export type SmtpEncryptionMode = 'SSL' | 'TLS' | 'NONE';

export type AdminSmtpSettingsPayload = {
  senderName: string;
  senderEmail: string;
  host: string;
  port: number;
  encryption: SmtpEncryptionMode;
  username: string;
  password?: string;
  timeout: number;
};

export type AdminSmtpSettingsResponse = {
  senderName: string;
  senderEmail: string;
  host: string;
  port: number;
  encryption: SmtpEncryptionMode;
  username: string;
  timeout: number;
  hasPassword: boolean;
  passwordMasked: string;
  passwordUpdatedAt: string | null;
  updatedAt: string | null;
};

export type EmailTemplateAdminResponse = {
  slug: EmailTemplateSlug;
  name: string;
  subject: string;
  htmlBody: string;
  variables: string[];
  updatedAt: string | null;
};

type RuntimeSmtpSettings = {
  senderName: string;
  senderEmail: string;
  host: string;
  port: number;
  encryption: SmtpEncryptionMode;
  username: string;
  password: string;
  timeout: number;
};

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type TemplateVariables = Record<string, string>;

const DEFAULT_SMTP_SETTINGS: AdminSmtpSettingsResponse = {
  senderName: 'Munay Imóveis',
  senderEmail: '',
  host: '',
  port: 465,
  encryption: 'SSL',
  username: '',
  timeout: 10000,
  hasPassword: false,
  passwordMasked: '',
  passwordUpdatedAt: null,
  updatedAt: null
};

const TEMPLATE_VARIABLES = ['{{NOME}}', '{{EMAIL}}', '{{LINK_RESET}}'];

const DEFAULT_PASSWORD_RESET_TEMPLATE = {
  slug: 'PASSWORD_RESET' as EmailTemplateSlug,
  name: 'Recuperação de Senha',
  subject: 'Recuperação de senha - Munay Imóveis',
  htmlBody: `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#b48846;margin:0 0 16px;">Munay Imóveis</p>
      <h2 style="margin:0 0 16px;">Recuperação de senha</h2>
      <p>Olá, {{NOME}}.</p>
      <p>Recebemos uma solicitação para redefinir a senha da conta <strong>{{EMAIL}}</strong>.</p>
      <p>Use o link abaixo para criar uma nova senha. Este link expira em <strong>30 minutos</strong> e só pode ser utilizado uma única vez.</p>
      <p style="margin:24px 0;">
        <a href="{{LINK_RESET}}" style="display:inline-block;padding:14px 22px;background:#c9a55c;color:#08110d;text-decoration:none;border-radius:999px;font-weight:700;">
          Redefinir minha senha
        </a>
      </p>
      <p>Se preferir, copie e cole este endereço no navegador:</p>
      <p style="word-break:break-all;">{{LINK_RESET}}</p>
      <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
    </div>
  `.trim()
};

function normalizeString(value: unknown) {
  return String(value || '').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeHeaderValue(value: string) {
  return normalizeString(value).replace(/[\r\n]+/g, ' ');
}

async function ensureSiteSettings() {
  const existing = await prisma.siteSetting.findFirst();
  if (existing) return existing;
  return prisma.siteSetting.create({ data: {} });
}

async function ensurePasswordResetTemplate() {
  return prisma.emailTemplate.upsert({
    where: { slug: DEFAULT_PASSWORD_RESET_TEMPLATE.slug },
    update: {},
    create: DEFAULT_PASSWORD_RESET_TEMPLATE
  });
}

function formatFromAddress(settings: RuntimeSmtpSettings) {
  const name = settings.senderName.replace(/"/g, '\\"');
  return `${name} <${settings.senderEmail}>`;
}

function buildTransportOptions(settings: RuntimeSmtpSettings) {
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.encryption === 'SSL',
    requireTLS: settings.encryption === 'TLS',
    ignoreTLS: settings.encryption === 'NONE',
    auth: {
      user: settings.username,
      pass: settings.password
    },
    connectionTimeout: settings.timeout,
    greetingTimeout: settings.timeout,
    socketTimeout: settings.timeout,
    tls: {
      servername: settings.host
    }
  } as any;
}

async function loadRuntimeSmtpSettings(): Promise<RuntimeSmtpSettings> {
  const settings = await ensureSiteSettings();
  const senderName = sanitizeHeaderValue(settings.smtpSenderName || DEFAULT_SMTP_SETTINGS.senderName);
  const senderEmail = normalizeString(settings.smtpSenderEmail);
  const host = normalizeString(settings.smtpHost);
  const username = normalizeString(settings.smtpUsername);
  const encryptedPassword = normalizeString(settings.smtpPasswordEncrypted);

  if (!senderEmail || !host || !username || !encryptedPassword) {
    throw new Error('As configurações SMTP ainda não foram concluídas no painel administrativo.');
  }

  return {
    senderName,
    senderEmail,
    host,
    port: Number(settings.smtpPort || DEFAULT_SMTP_SETTINGS.port),
    encryption: (settings.smtpEncryption as SmtpEncryptionMode | null) || DEFAULT_SMTP_SETTINGS.encryption,
    username,
    password: decryptSecret(encryptedPassword),
    timeout: Number(settings.smtpTimeout || DEFAULT_SMTP_SETTINGS.timeout)
  };
}

function renderTemplate(htmlBody: string, variables: TemplateVariables) {
  return Object.entries(variables).reduce((content, [key, value]) => {
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    return content.replace(token, escapeHtml(value));
  }, htmlBody);
}

function toAdminSettingsResponse(settings: Awaited<ReturnType<typeof ensureSiteSettings>>): AdminSmtpSettingsResponse {
  return {
    senderName: settings.smtpSenderName || DEFAULT_SMTP_SETTINGS.senderName,
    senderEmail: settings.smtpSenderEmail || DEFAULT_SMTP_SETTINGS.senderEmail,
    host: settings.smtpHost || DEFAULT_SMTP_SETTINGS.host,
    port: settings.smtpPort || DEFAULT_SMTP_SETTINGS.port,
    encryption: (settings.smtpEncryption as SmtpEncryptionMode | null) || DEFAULT_SMTP_SETTINGS.encryption,
    username: settings.smtpUsername || DEFAULT_SMTP_SETTINGS.username,
    timeout: settings.smtpTimeout || DEFAULT_SMTP_SETTINGS.timeout,
    hasPassword: Boolean(settings.smtpPasswordEncrypted),
    passwordMasked: settings.smtpPasswordEncrypted ? SMTP_PASSWORD_MASK : '',
    passwordUpdatedAt: settings.smtpPasswordUpdatedAt ? settings.smtpPasswordUpdatedAt.toISOString() : null,
    updatedAt: settings.updatedAt ? settings.updatedAt.toISOString() : null
  };
}

export async function getAdminSmtpSettings() {
  const settings = await ensureSiteSettings();
  return toAdminSettingsResponse(settings);
}

export async function saveAdminSmtpSettings(payload: AdminSmtpSettingsPayload) {
  const current = await ensureSiteSettings();
  const nextPassword = normalizeString(payload.password);

  if (!current.smtpPasswordEncrypted && !nextPassword) {
    throw new Error('Informe a senha SMTP para concluir a configuração inicial.');
  }

  const updated = await prisma.siteSetting.update({
    where: { id: current.id },
    data: {
      smtpSenderName: sanitizeHeaderValue(payload.senderName),
      smtpSenderEmail: normalizeString(payload.senderEmail).toLowerCase(),
      smtpHost: normalizeString(payload.host),
      smtpPort: Number(payload.port),
      smtpEncryption: payload.encryption,
      smtpUsername: normalizeString(payload.username),
      smtpTimeout: Number(payload.timeout),
      ...(nextPassword
        ? {
            smtpPasswordEncrypted: encryptSecret(nextPassword),
            smtpPasswordUpdatedAt: new Date()
          }
        : {})
    }
  });

  return toAdminSettingsResponse(updated);
}

export async function getPasswordResetTemplate() {
  const template = await ensurePasswordResetTemplate();
  return {
    slug: 'PASSWORD_RESET' as EmailTemplateSlug,
    name: template.name,
    subject: template.subject,
    htmlBody: template.htmlBody,
    variables: TEMPLATE_VARIABLES,
    updatedAt: template.updatedAt?.toISOString() || null
  } satisfies EmailTemplateAdminResponse;
}

export async function savePasswordResetTemplate(subject: string, htmlBody: string) {
  const template = await prisma.emailTemplate.upsert({
    where: { slug: DEFAULT_PASSWORD_RESET_TEMPLATE.slug },
    update: {
      name: DEFAULT_PASSWORD_RESET_TEMPLATE.name,
      subject,
      htmlBody
    },
    create: {
      ...DEFAULT_PASSWORD_RESET_TEMPLATE,
      subject,
      htmlBody
    }
  });

  return {
    slug: 'PASSWORD_RESET' as EmailTemplateSlug,
    name: template.name,
    subject: template.subject,
    htmlBody: template.htmlBody,
    variables: TEMPLATE_VARIABLES,
    updatedAt: template.updatedAt?.toISOString() || null
  } satisfies EmailTemplateAdminResponse;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const settings = await loadRuntimeSmtpSettings();
  const transporter = nodemailer.createTransport(buildTransportOptions(settings));

  await transporter.sendMail({
    from: formatFromAddress(settings),
    to: sanitizeHeaderValue(to),
    subject: sanitizeHeaderValue(subject),
    html,
    text: text || stripHtml(html)
  });
}

export async function testSmtpSettings(to: string) {
  const settings = await loadRuntimeSmtpSettings();
  const transporter = nodemailer.createTransport(buildTransportOptions(settings));

  await transporter.verify();
  await transporter.sendMail({
    from: formatFromAddress(settings),
    to: sanitizeHeaderValue(to),
    subject: 'Teste de SMTP - Munay Imóveis',
    text: 'Este é um e-mail de teste enviado a partir das configurações SMTP cadastradas no painel administrativo.',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;">Teste de SMTP</h2>
        <p>Este é um e-mail de teste enviado a partir das configurações SMTP cadastradas no painel administrativo da Munay Imóveis.</p>
        <p>Se você recebeu esta mensagem, a conexão SMTP está funcionando corretamente.</p>
      </div>
    `.trim()
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetLink
}: {
  to: string;
  name?: string | null;
  resetLink: string;
}) {
  const template = await ensurePasswordResetTemplate();
  const html = renderTemplate(template.htmlBody, {
    NOME: name?.trim() || 'Cliente',
    EMAIL: normalizeString(to).toLowerCase(),
    LINK_RESET: resetLink
  });

  await sendEmail({
    to,
    subject: template.subject,
    html,
    text: [
      'Recuperação de senha - Munay Imóveis',
      '',
      `Olá, ${name?.trim() || 'Cliente'}.`,
      `Recebemos uma solicitação para redefinir a senha da conta ${normalizeString(to).toLowerCase()}.`,
      'Use o link abaixo para criar uma nova senha. Este link expira em 30 minutos e só pode ser utilizado uma única vez.',
      resetLink,
      '',
      'Se você não solicitou esta alteração, ignore este e-mail.'
    ].join('\n')
  });
}
