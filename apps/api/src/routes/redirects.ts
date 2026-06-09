import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

const router = Router();

const redirectSchema = z.object({
  sourcePath: z.string().trim().min(1).refine((value) => value.startsWith('/'), 'A origem deve iniciar com /.') ,
  destination: z.string().trim().min(1),
  type: z.union([z.literal(301), z.literal(302)]).default(301),
  active: z.boolean().default(true)
});

router.get(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const items = await prisma.redirect.findMany({ orderBy: [{ active: 'desc' }, { sourcePath: 'asc' }] });
    res.json(items);
  })
);

router.get(
  '/resolve',
  asyncHandler(async (req, res) => {
    const sourcePath = String(req.query.path || '').trim();

    if (!sourcePath || !sourcePath.startsWith('/')) {
      return res.json(null);
    }

    const item = await prisma.redirect.findFirst({
      where: { sourcePath, active: true },
      select: { destination: true, type: true }
    });

    res.json(item || null);
  })
);

router.post(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = redirectSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const created = await prisma.redirect.create({ data: parsed.data });
    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = redirectSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const updated = await prisma.redirect.update({
      where: { id: String(req.params.id) },
      data: parsed.data
    });

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    await prisma.redirect.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

export default router;
