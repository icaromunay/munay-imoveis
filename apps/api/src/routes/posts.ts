import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { makeSlug } from '../utils/slug.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { notifyIndexNowPath } from '../utils/indexnow.js';
import { getRichTextPlainText, sanitizeRichTextHtml } from '../utils/rich-text.js';

const router = Router();

const coverImageSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (value.startsWith('/uploads/')) return true;

    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Imagem de capa inválida.');

const postSchema = z.object({
  title: z.string().trim().min(3),
  excerpt: z.string().trim().min(10),
  content: z.string().trim().min(20),
  coverImage: coverImageSchema,
  category: z.string().trim().min(2),
  author: z.string().trim().min(2).default('Equipe Munay Imóveis'),
  published: z.boolean().default(true)
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  published: z.enum(['true', 'false']).optional()
});

type CachedPost = Awaited<ReturnType<typeof prisma.post.findMany>>[number];

let publicPostsCache: CachedPost[] = [];
let adminPostsCache: CachedPost[] = [];
const postsBySlugCache = new Map<string, CachedPost>();

function sortPosts(items: CachedPost[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

function cachePosts(items: CachedPost[], scope: 'public' | 'admin') {
  const normalized = sortPosts(items);

  if (scope === 'admin') {
    adminPostsCache = normalized;
    publicPostsCache = normalized.filter((item) => item.published);
  } else {
    publicPostsCache = normalized;
  }

  normalized.forEach((item) => {
    postsBySlugCache.set(item.slug, item);
  });
}

function upsertCachedPost(item: CachedPost) {
  postsBySlugCache.set(item.slug, item);
  adminPostsCache = sortPosts([item, ...adminPostsCache.filter((entry) => entry.id !== item.id && entry.slug !== item.slug)]);
  publicPostsCache = sortPosts(adminPostsCache.filter((entry) => entry.published));
}

function removeCachedPost(id: string) {
  const removed = adminPostsCache.find((entry) => entry.id === id);
  adminPostsCache = adminPostsCache.filter((entry) => entry.id !== id);
  publicPostsCache = sortPosts(adminPostsCache.filter((entry) => entry.published));

  if (removed) {
    postsBySlugCache.delete(removed.slug);
  }
}

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

    try {
      const [items, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: [{ published: 'desc' }, { createdAt: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }),
        prisma.post.count({ where })
      ]);

      if (query.page === 1) {
        cachePosts(items, 'public');
      }

      res.setHeader('x-pagination-total', total.toString());
      res.setHeader('x-pagination-page', query.page.toString());
      res.setHeader('x-pagination-limit', query.limit.toString());
      res.json(items);
      return;
    } catch (error) {
      console.warn('[posts] fallback payload returned after query failure', error);
      const fallbackSource = query.published === 'false' ? adminPostsCache.filter((item) => !item.published) : publicPostsCache;
      const start = (query.page - 1) * query.limit;
      const fallbackItems = fallbackSource.slice(start, start + query.limit);
      res.setHeader('x-pagination-total', fallbackSource.length.toString());
      res.setHeader('x-pagination-page', query.page.toString());
      res.setHeader('x-pagination-limit', query.limit.toString());
      res.json(fallbackItems);
    }
  })
);

router.get(
  '/admin/all',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const items = await prisma.post.findMany({ orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }] });
      cachePosts(items, 'admin');
      res.json(items);
    } catch (error) {
      console.warn('[posts:admin] fallback payload returned after query failure', error);
      res.json(adminPostsCache);
    }
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

    upsertCachedPost(created);
    res.status(201).json(created);
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);

    try {
      const item = await prisma.post.findUnique({ where: { slug } });

      if (!item) {
        throw new AppError(404, 'Post não encontrado.');
      }

      postsBySlugCache.set(item.slug, item);
      res.json(item);
      return;
    } catch (error) {
      const cached = postsBySlugCache.get(slug) || publicPostsCache.find((item) => item.slug === slug) || null;
      if (cached) {
        console.warn('[posts:slug] cached payload returned after query failure', error);
        res.json(cached);
        return;
      }

      throw error;
    }
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

    const sanitizedContent = sanitizeRichTextHtml(parsed.data.content);

    if (getRichTextPlainText(sanitizedContent).length < 20) {
      throw new AppError(400, 'Conteúdo do artigo muito curto ou inválido.');
    }

    const created = await prisma.post.create({
      data: {
        ...parsed.data,
        content: sanitizedContent,
        coverImage: parsed.data.coverImage.trim(),
        slug: await resolveUniquePostSlug(parsed.data.title)
      }
    });

    upsertCachedPost(created);

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

    const sanitizedContent = sanitizeRichTextHtml(parsed.data.content);

    if (getRichTextPlainText(sanitizedContent).length < 20) {
      throw new AppError(400, 'Conteúdo do artigo muito curto ou inválido.');
    }

    const updated = await prisma.post.update({
      where: { id: String(req.params.id) },
      data: {
        ...parsed.data,
        content: sanitizedContent,
        coverImage: parsed.data.coverImage.trim(),
        slug: await resolveUniquePostSlug(parsed.data.title, String(req.params.id))
      }
    });

    upsertCachedPost(updated);

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
    const id = String(req.params.id);
    await prisma.post.delete({ where: { id } });
    removeCachedPost(id);
    res.status(204).send();
  })
);

export default router;
