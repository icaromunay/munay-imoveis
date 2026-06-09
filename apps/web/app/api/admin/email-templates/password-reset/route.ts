import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute } from '@/lib/admin-route';
import { getPasswordResetTemplate, savePasswordResetTemplate } from '@/lib/email-service';

const passwordResetTemplateSchema = z.object({
  subject: z.string().trim().min(5, 'Informe o assunto do e-mail.'),
  htmlBody: z
    .string()
    .trim()
    .min(20, 'Informe o HTML do modelo de e-mail.')
    .refine((value) => value.includes('{{LINK_RESET}}'), 'O HTML precisa conter a variável {{LINK_RESET}}.')
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

  const template = await getPasswordResetTemplate();
  return jsonResponse(template);
}

export async function PUT(request: Request) {
  const auth = await requireAdminRoute();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = passwordResetTemplateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return jsonResponse({ message: firstError }, 400);
    }

    const template = await savePasswordResetTemplate(parsed.data.subject, parsed.data.htmlBody);
    return jsonResponse({
      message: 'Modelo de e-mail salvo com sucesso.',
      template
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível salvar o modelo de e-mail.';
    return jsonResponse({ message }, 500);
  }
}
