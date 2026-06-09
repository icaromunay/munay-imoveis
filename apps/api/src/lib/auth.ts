import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: string;
  name?: string;
  picture?: string | null;
};

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'portal-imobiliario-premium',
    audience: 'admin-panel'
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer: 'portal-imobiliario-premium',
    audience: 'admin-panel'
  }) as AuthTokenPayload;

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);
export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);
