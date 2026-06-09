import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  hashPasswordResetToken,
  PASSWORD_RESET_CHANGED_MESSAGE,
  PASSWORD_RESET_INVALID_MESSAGE
} from '@/lib/password-reset';

const confirmPasswordResetSchema = z
  .object({
    token: z.string().trim().min(32, PASSWORD_RESET_INVALID_MESSAGE),
    password: z.string().min(6, 'A nova senha deve ter ao menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'Confirme a nova senha.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'A confirmação da senha não confere.',
    path: ['confirmPassword']
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmPasswordResetSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      const status = firstError === PASSWORD_RESET_INVALID_MESSAGE ? 400 : 422;
      return NextResponse.json({ message: firstError }, { status });
    }

    const tokenHash = hashPasswordResetToken(parsed.data.token);
    const now = new Date();
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        used: false,
        expiresAt: { gt: now }
      },
      select: {
        id: true,
        userId: true
      }
    });

    if (!tokenRecord?.id) {
      return NextResponse.json({ message: PASSWORD_RESET_INVALID_MESSAGE }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    try {
      await prisma.$transaction(async (tx) => {
        const tokenUpdate = await tx.passwordResetToken.updateMany({
          where: {
            id: tokenRecord.id,
            used: false,
            expiresAt: { gt: new Date() }
          },
          data: {
            used: true
          }
        });

        if (tokenUpdate.count !== 1) {
          throw new Error('INVALID_OR_USED_TOKEN');
        }

        await tx.user.update({
          where: { id: tokenRecord.userId },
          data: {
            passwordHash,
            emailVerified: new Date()
          }
        });

        await tx.passwordResetToken.updateMany({
          where: {
            userId: tokenRecord.userId,
            used: false
          },
          data: {
            used: true
          }
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_OR_USED_TOKEN') {
        return NextResponse.json({ message: PASSWORD_RESET_INVALID_MESSAGE }, { status: 400 });
      }

      throw error;
    }

    return NextResponse.json({ message: PASSWORD_RESET_CHANGED_MESSAGE });
  } catch (error) {
    console.error('Falha ao concluir recuperação de senha:', error);
    return NextResponse.json({ message: 'Não foi possível alterar a senha agora.' }, { status: 500 });
  }
}
