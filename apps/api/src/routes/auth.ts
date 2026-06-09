import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { comparePassword, signToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';
import { OWNER_ROLE } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const googleOwnerLoginSchema = z.object({
  credential: z.string().trim().min(20)
});

type GoogleTokenInfo = {
  sub: string;
  email: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  aud?: string;
  azp?: string;
};

async function verifyGoogleCredential(credential: string) {
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);

  if (!response.ok) {
    throw new AppError(401, 'Não foi possível validar a conta Google.');
  }

  const data = (await response.json()) as GoogleTokenInfo;

  if (!data.email || data.email_verified !== 'true') {
    throw new AppError(401, 'A conta Google precisa ter e-mail verificado.');
  }

  if (env.GOOGLE_CLIENT_ID && data.aud !== env.GOOGLE_CLIENT_ID && data.azp !== env.GOOGLE_CLIENT_ID) {
    throw new AppError(401, 'Esta conta Google não foi autorizada para o portal.');
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture || null
  };
}

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    if (!user) {
      throw new AppError(401, 'Credenciais inválidas.');
    }

    if (!user.passwordHash || !user.email) {
      throw new AppError(401, 'Esta conta não possui login por senha habilitado.');
    }

    const validPassword = await comparePassword(parsed.data.password, user.passwordHash);

    if (!validPassword) {
      throw new AppError(401, 'Credenciais inválidas.');
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? undefined
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })
);

router.post(
  '/google-owner',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = googleOwnerLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const owner = await verifyGoogleCredential(parsed.data.credential);
    const token = signToken({
      sub: owner.sub,
      email: owner.email,
      role: OWNER_ROLE,
      name: owner.name,
      picture: owner.picture
    });

    res.json({
      token,
      user: {
        id: owner.sub,
        name: owner.name,
        email: owner.email,
        picture: owner.picture,
        role: OWNER_ROLE
      }
    });
  })
);

export default router;
