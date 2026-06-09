import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

const router = Router();

const urlOrEmpty = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => value === '' || z.string().url().safeParse(value).success, message);

const testimonialSchema = z.object({
  name: z.string().trim().min(2),
  photoUrl: urlOrEmpty('Informe uma URL válida para a foto.'),
  text: z.string().trim().min(10),
  rating: z.coerce.number().int().min(1).max(5),
  youtubeVideo: urlOrEmpty('Informe uma URL válida para o vídeo do YouTube.')
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  })
);

router.post(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const created = await prisma.testimonial.create({
      data: {
        ...parsed.data,
        youtubeVideo: parsed.data.youtubeVideo || null
      }
    });

    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const updated = await prisma.testimonial.update({
      where: { id: String(req.params.id) },
      data: {
        ...parsed.data,
        youtubeVideo: parsed.data.youtubeVideo || null
      }
    });

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    await prisma.testimonial.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

export default router;
