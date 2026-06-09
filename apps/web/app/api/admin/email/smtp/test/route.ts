import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminRoute } from '@/lib/admin-route';
import { testSmtpSettings } from '@/lib/email-service';

const testEmailSchema = z.object({
  to: z.string().trim().email('Informe um e-mail válido para o teste.')
});

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminRoute();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return jsonResponse({ message: firstError }, 400);
    }

    await testSmtpSettings(parsed.data.to);

    return jsonResponse({
      message: 'E-mail enviado com sucesso.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao conectar ao servidor SMTP.';
    return jsonResponse(
      {
        message: 'Falha ao conectar ao servidor SMTP.',
        detail: message
      },
      500
    );
  }
}
