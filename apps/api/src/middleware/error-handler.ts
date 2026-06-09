import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos.',
      details: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Registro duplicado.',
        details: error.meta
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Registro não encontrado.' });
    }
  }

  console.error('❌ Erro não tratado na API', error);

  return res.status(500).json({
    message: 'Erro interno do servidor.'
  });
}
