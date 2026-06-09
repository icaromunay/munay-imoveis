import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safe-auth';

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 6;

export async function GET() {
  const session = await safeAuth();

  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 });
  }

  if (!process.env.JWT_SECRET) {
    return NextResponse.json({ message: 'JWT_SECRET não configurado.' }, { status: 500 });
  }

  const token = jwt.sign(
    {
      sub: session.user.id,
      email: session.user.email,
      role: 'OWNER',
      name: session.user.name,
      picture: session.user.image
    },
    process.env.JWT_SECRET,
    {
      expiresIn: TOKEN_MAX_AGE_SECONDS,
      issuer: 'portal-imobiliario-premium',
      audience: 'admin-panel'
    }
  );

  return NextResponse.json(
    {
      token,
      expiresAt: new Date(Date.now() + TOKEN_MAX_AGE_SECONDS * 1000).toISOString()
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}
