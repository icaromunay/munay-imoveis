import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

type OwnerNotificationPayload = {
  action: 'created' | 'updated';
  property: {
    id: string;
    title: string;
    propertyCode: string;
    city: string;
    state: string;
    district: string;
    ownerName?: string | null;
    ownerPhone?: string | null;
    ownerEmail?: string | null;
  };
};

function actionLabel(action: OwnerNotificationPayload['action']) {
  return action === 'created' ? 'novo envio de imóvel' : 'atualização de imóvel pendente';
}

function buildMessage(payload: OwnerNotificationPayload) {
  const { property } = payload;
  return [
    `Munay Imóveis: ${actionLabel(payload.action)}.`,
    `Imóvel: ${property.title} (${property.propertyCode})`,
    `Localização: ${property.city} - ${property.state} / ${property.district}`,
    `Proprietário: ${property.ownerName || 'Não informado'}`,
    `Telefone: ${property.ownerPhone || 'Não informado'}`,
    `E-mail: ${property.ownerEmail || 'Não informado'}`,
    `Painel: ${env.SITE_URL}/admin/properties`
  ].join('\n');
}

async function sendEmailNotification(payload: OwnerNotificationPayload) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM || !env.NOTIFY_EMAIL_TO) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE_BOOL,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  const { property } = payload;
  const subject = `Munay Imóveis • ${actionLabel(payload.action)} • ${property.propertyCode}`;
  const text = buildMessage(payload);
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 16px">Munay Imóveis</h2>
      <p>Recebemos um <strong>${actionLabel(payload.action)}</strong> no portal.</p>
      <ul>
        <li><strong>Imóvel:</strong> ${property.title} (${property.propertyCode})</li>
        <li><strong>Cidade:</strong> ${property.city} - ${property.state}</li>
        <li><strong>Bairro:</strong> ${property.district}</li>
        <li><strong>Proprietário:</strong> ${property.ownerName || 'Não informado'}</li>
        <li><strong>Telefone:</strong> ${property.ownerPhone || 'Não informado'}</li>
        <li><strong>E-mail:</strong> ${property.ownerEmail || 'Não informado'}</li>
      </ul>
      <p><a href="${env.SITE_URL}/admin/properties" target="_blank" rel="noreferrer">Abrir painel administrativo</a></p>
    </div>
  `;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.NOTIFY_EMAIL_TO,
    subject,
    text,
    html
  });
}

async function sendWhatsappNotification(payload: OwnerNotificationPayload) {
  if (!env.WHATSAPP_NOTIFY_WEBHOOK_URL || !env.WHATSAPP_NOTIFY_TO) {
    return;
  }

  const response = await fetch(env.WHATSAPP_NOTIFY_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.WHATSAPP_NOTIFY_TOKEN ? { Authorization: `Bearer ${env.WHATSAPP_NOTIFY_TOKEN}` } : {})
    },
    body: JSON.stringify({
      to: env.WHATSAPP_NOTIFY_TO,
      message: buildMessage(payload),
      channel: 'whatsapp',
      type: 'owner-property-review',
      payload
    })
  });

  if (!response.ok) {
    const reason = await response.text().catch(() => 'Falha ao notificar WhatsApp.');
    throw new Error(reason || 'Falha ao notificar WhatsApp.');
  }
}

export async function notifyOwnerPropertyReview(payload: OwnerNotificationPayload) {
  const tasks = [sendEmailNotification(payload), sendWhatsappNotification(payload)];
  const results = await Promise.allSettled(tasks);

  const failures = results.filter((result) => result.status === 'rejected') as PromiseRejectedResult[];

  if (failures.length === results.length && failures.length > 0) {
    throw new Error(failures.map((item) => item.reason?.message || 'Falha na notificação.').join(' | '));
  }
}
