import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { canonicalizeAdminEmail } from '@/lib/auth-role';
import { sendPasswordResetEmail } from '@/lib/mailer';
import {
  buildPasswordResetLink,
  generatePasswordResetToken,
  getPasswordResetCooldownDate,
  getPasswordResetExpirationDate,
  normalizePasswordResetEmail,
  PASSWORD_RESET_SUCCESS_MESSAGE
} from '@/lib/password-reset';

const resetPasswordRequestSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordRequestSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const email = canonicalizeAdminEmail(normalizePasswordResetEmail(parsed.data.email));
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user?.id || !user.email) {
      return NextResponse.json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
    }

    const recentRequest = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
        createdAt: { gte: getPasswordResetCooldownDate() }
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });

    if (recentRequest?.id) {
      return NextResponse.json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
    }

    const { rawToken, tokenHash } = generatePasswordResetToken();
    const expiresAt = getPasswordResetExpirationDate();

    const createdToken = await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false
        },
        data: {
          used: true
        }
      });

      return tx.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt
        },
        select: {
          id: true
        }
      });
    });

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetLink: buildPasswordResetLink(rawToken, request.headers)
      });
    } catch (error) {
      console.error('Falha ao enviar e-mail de recuperação de senha:', error);
      await prisma.passwordResetToken.update({
        where: { id: createdToken.id },
        data: { used: true }
      });
    }

    return NextResponse.json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  } catch (error) {
    console.error('Falha ao iniciar recuperação de senha:', error);
    return NextResponse.json({ message: PASSWORD_RESET_SUCCESS_MESSAGE });
  }
}
