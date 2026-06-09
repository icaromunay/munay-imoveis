import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth.js';

export const BACKOFFICE_ROLES = ['ADMIN'] as const;
export const OWNER_ROLE = 'OWNER' as const;

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: string;
  name?: string;
  picture?: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

export function requireRole(roles: readonly string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Você não tem permissão para esta ação.' });
    }

    return next();
  };
}
