import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute } from '@/lib/admin-route';
import { getAdminSmtpSettings, saveAdminSmtpSettings } from '@/lib/email-service';

const smtpSettingsSchema = z.object({
  senderName: z.string().trim().min(2, 'Informe o nome do remetente.'),
  senderEmail: z.string().trim().email('Informe um e-mail remetente válido.'),
  host: z.string().trim().min(3, 'Informe o host SMTP.'),
  port: z.coerce.number().int().min(1, 'Informe uma porta válida.'),
  encryption: z.enum(['SSL', 'TLS', 'NONE']),
  username: z.string().trim().min(2, 'Informe o usuário SMTP.'),
  password: z.string().optional().default(''),
  timeout: z.coerce.number().int().min(1000, 'Informe um timeout mínimo de 1000 ms.').max(120000, 'Timeout máximo de 120000 ms.')
});

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function GET() {
  const auth = await requireAdminRoute();
  if (auth.error) return auth.error;

  const settings = await getAdminSmtpSettings();
  return jsonResponse(settings);
}

export async function PUT(request: Request) {
  const auth = await requireAdminRoute();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = smtpSettingsSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return jsonResponse({ message: firstError }, 400);
    }

    const settings = await saveAdminSmtpSettings(parsed.data);
    return jsonResponse({
      message: 'Configurações SMTP salvas com sucesso.',
      settings
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar as configurações SMTP.';
    return jsonResponse({ message }, 400);
  }
}
