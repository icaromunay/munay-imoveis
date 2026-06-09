import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL, canonicalizeAdminEmail, isAdminEmail, normalizeEmail, resolveRole } from '@/lib/auth-role';

function getUniqueConstraintMessage(error: Prisma.PrismaClientKnownRequestError) {
  const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];

  if (targets.includes('email')) {
    return 'Já existe uma conta com este e-mail.';
  }

  if (targets.includes('cpf')) {
    return 'Já existe uma conta com este CPF.';
  }

  return 'Já existe uma conta com estes dados.';
}

const registerSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.'),
  whatsapp: z.string().trim().min(8, 'Informe um WhatsApp válido.'),
  cpf: z.string().trim().min(11, 'Informe um CPF válido.'),
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  address: z.string().trim().min(8, 'Informe seu endereço.')
});

function normalizeCpf(value: string) {
  return value.replace(/\D/g, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return NextResponse.json({ message: firstError }, { status: 400 });
    }

    const email = canonicalizeAdminEmail(parsed.data.email);
    const cpf = normalizeCpf(parsed.data.cpf);
    const sanitizedName = parsed.data.name.trim();
    const sanitizedWhatsapp = parsed.data.whatsapp.trim();
    const sanitizedAddress = parsed.data.address.trim();

    if (cpf.length !== 11) {
      return NextResponse.json({ message: 'O CPF precisa conter 11 dígitos.' }, { status: 400 });
    }

    const [existingEmailUser, existingCpfUser] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, cpf: true }
      }),
      prisma.user.findUnique({
        where: { cpf },
        select: { id: true, email: true, cpf: true }
      })
    ]);

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    if (isAdminEmail(email)) {
      if (existingCpfUser && normalizeEmail(existingCpfUser.email) !== ADMIN_EMAIL) {
        return NextResponse.json({ message: 'Já existe uma conta com este CPF.' }, { status: 409 });
      }

      const user = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
          name: sanitizedName,
          passwordHash,
          whatsapp: sanitizedWhatsapp,
          cpf,
          address: sanitizedAddress,
          role: 'ADMIN',
          emailVerified: new Date()
        },
        create: {
          name: sanitizedName,
          email: ADMIN_EMAIL,
          passwordHash,
          whatsapp: sanitizedWhatsapp,
          cpf,
          address: sanitizedAddress,
          role: 'ADMIN',
          emailVerified: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      return NextResponse.json({
        message: 'Conta administrativa atualizada com sucesso.',
        user
      });
    }

    if (existingEmailUser) {
      return NextResponse.json({ message: 'Já existe uma conta com este e-mail.' }, { status: 409 });
    }

    if (existingCpfUser) {
      return NextResponse.json({ message: 'Já existe uma conta com este CPF.' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: sanitizedName,
        email,
        passwordHash,
        whatsapp: sanitizedWhatsapp,
        cpf,
        address: sanitizedAddress,
        role: resolveRole(email),
        emailVerified: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      message: 'Conta criada com sucesso.',
      user
    });
  } catch (error) {
    console.error('Falha ao criar conta do proprietário:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: getUniqueConstraintMessage(error) }, { status: 409 });
    }

    return NextResponse.json({ message: 'Não foi possível criar a conta agora.' }, { status: 500 });
  }
}
