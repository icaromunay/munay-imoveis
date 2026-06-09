import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { makeSlug } from '../utils/slug.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { notifyIndexNowPath } from '../utils/indexnow.js';

const router = Router();

const postSchema = z.object({
  title: z.string().trim().min(3),
  excerpt: z.string().trim().min(10),
  content: z.string().trim().min(20),
  coverImage: z.string().trim().url(),
  category: z.string().trim().min(2),
  author: z.string().trim().min(2).default('Equipe Munay Imóveis'),
  published: z.boolean().default(true)
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  published: z.enum(['true', 'false']).optional()
});

async function resolveUniquePostSlug(title: string, excludeId?: string) {
  const baseSlug = makeSlug(title) || `artigo-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 2;

  while (
    await prisma.post.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      },
      select: { id: true }
    })
  ) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = querySchema.parse(req.query);
    const where = {
      published: query.published ? query.published === 'true' : true
    };

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: [{ published: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit
      }),
      prisma.post.count({ where })
    ]);

    res.setHeader('x-pagination-total', total.toString());
    res.setHeader('x-pagination-page', query.page.toString());
    res.setHeader('x-pagination-limit', query.limit.toString());
    res.json(items);
  })
);

router.get(
  '/admin/all',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const items = await prisma.post.findMany({ orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }] });
    res.json(items);
  })
);

router.post(
  '/:id/duplicate',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const source = await prisma.post.findUnique({ where: { id: String(req.params.id) } });

    if (!source) {
      throw new AppError(404, 'Artigo não encontrado para duplicação.');
    }

    const duplicateTitle = `${source.title} (cópia)`;
    const created = await prisma.post.create({
      data: {
        title: duplicateTitle,
        excerpt: source.excerpt,
        content: source.content,
        coverImage: source.coverImage,
        category: source.category,
        author: source.author,
        published: false,
        slug: await resolveUniquePostSlug(duplicateTitle)
      }
    });

    res.status(201).json(created);
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const item = await prisma.post.findUnique({ where: { slug: String(req.params.slug) } });

    if (!item) {
      throw new AppError(404, 'Post não encontrado.');
    }

    res.json(item);
  })
);

router.post(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = postSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const created = await prisma.post.create({
      data: {
        ...parsed.data,
        slug: await resolveUniquePostSlug(parsed.data.title)
      }
    });

    if (created.published) {
      void notifyIndexNowPath(`/blog/${created.slug}`);
    }

    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = postSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const updated = await prisma.post.update({
      where: { id: String(req.params.id) },
      data: {
        ...parsed.data,
        slug: await resolveUniquePostSlug(parsed.data.title, String(req.params.id))
      }
    });

    if (updated.published) {
      void notifyIndexNowPath(`/blog/${updated.slug}`);
    }

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    await prisma.post.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

export default router;
