import { BlogArticleQueueStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { makeSlug } from '../utils/slug.js';

const router = Router();

const providerOptions = ['OPENAI', 'GEMINI', 'CLAUDE', 'DEEPSEEK', 'CUSTOM'] as const;
const queueStatusValues = ['PENDING', 'GENERATED', 'PUBLISHED', 'FAILED'] as const;

const settingsSchema = z.object({
  enabled: z.coerce.boolean().default(false),
  provider: z.enum(providerOptions).default('OPENAI'),
  apiKey: z.string().trim().max(500).optional().nullable(),
  publishTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/i, 'Informe um horário válido no formato HH:mm.'),
  articlesPerDay: z.coerce.number().int().min(1).max(20),
  defaultAuthor: z.string().trim().min(2).max(120),
  defaultCategory: z.string().trim().min(2).max(120),
  autoPublish: z.coerce.boolean().default(false)
});

const nullableDateSchema = z.preprocess((value) => {
  if (value === '' || value === undefined) return undefined;
  if (value === null) return null;
  return value;
}, z.coerce.date().nullable().optional());

const tagsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string().trim().min(1).max(60)).max(20));

const queueCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().min(3).max(220).optional(),
  content: z.string().trim().min(1).default('<p>Estrutura do artigo pendente.</p>'),
  excerpt: z.string().trim().min(1).default('Resumo pendente.'),
  seoTitle: z.string().trim().min(1).max(220),
  seoDescription: z.string().trim().min(1).max(320),
  category: z.string().trim().min(2).max(120),
  tags: tagsSchema.default([]),
  status: z.enum(queueStatusValues).default('PENDING'),
  scheduledAt: nullableDateSchema,
  publishedAt: nullableDateSchema
});

const queueUpdateSchema = queueCreateSchema.partial();

const queueQuerySchema = z.object({
  status: z.enum(queueStatusValues).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50)
});

function buildFallbackSettings() {
  return {
    id: 'fallback-blog-automation-settings',
    enabled: false,
    provider: 'OPENAI',
    apiKey: '',
    publishTime: '09:00',
    articlesPerDay: 1,
    defaultAuthor: 'Equipe Munay Imóveis',
    defaultCategory: 'Mercado imobiliário',
    autoPublish: false,
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };
}

async function ensureAutomationSettings() {
  const existing = await prisma.blogAutomationSettings.findFirst({
    orderBy: { createdAt: 'asc' }
  });

  if (existing) return existing;

  return prisma.blogAutomationSettings.create({
    data: {
      enabled: false,
      provider: 'OPENAI',
      publishTime: '09:00',
      articlesPerDay: 1,
      defaultAuthor: 'Equipe Munay Imóveis',
      defaultCategory: 'Mercado imobiliário',
      autoPublish: false
    }
  });
}

async function resolveUniqueQueueSlug(title: string, customSlug?: string, excludeId?: string) {
  const baseSlug = makeSlug(customSlug || title) || `artigo-ia-${Date.now()}`;
  let candidate = baseSlug;
  let counter = 2;

  while (
    await prisma.blogArticleQueue.findFirst({
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
  '/settings',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const settings = await ensureAutomationSettings();
      res.json({ ...settings, apiKey: settings.apiKey || '' });
    } catch (error) {
      console.warn('[blog-automation:settings] fallback payload returned after DB read failure', error);
      res.json(buildFallbackSettings());
    }
  })
);

router.put(
  '/settings',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const existing = await ensureAutomationSettings();
    const updated = await prisma.blogAutomationSettings.update({
      where: { id: existing.id },
      data: {
        enabled: parsed.data.enabled,
        provider: parsed.data.provider,
        apiKey: parsed.data.apiKey?.trim() || null,
        publishTime: parsed.data.publishTime,
        articlesPerDay: parsed.data.articlesPerDay,
        defaultAuthor: parsed.data.defaultAuthor,
        defaultCategory: parsed.data.defaultCategory,
        autoPublish: parsed.data.autoPublish
      }
    });

    res.json({ ...updated, apiKey: updated.apiKey || '' });
  })
);

router.get(
  '/queue',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const query = queueQuerySchema.parse(req.query);
    const items = await prisma.blogArticleQueue.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: query.limit
    });

    res.json(items);
  })
);

router.post(
  '/queue',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = queueCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const created = await prisma.blogArticleQueue.create({
      data: {
        title: parsed.data.title,
        slug: await resolveUniqueQueueSlug(parsed.data.title, parsed.data.slug),
        content: parsed.data.content,
        excerpt: parsed.data.excerpt,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        category: parsed.data.category,
        tags: parsed.data.tags,
        status: parsed.data.status as BlogArticleQueueStatus,
        scheduledAt: parsed.data.scheduledAt ?? null,
        publishedAt: parsed.data.publishedAt ?? null
      }
    });

    res.status(201).json(created);
  })
);

router.put(
  '/queue/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = queueUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const data: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      seoTitle?: string;
      seoDescription?: string;
      category?: string;
      tags?: string[];
      status?: BlogArticleQueueStatus;
      scheduledAt?: Date | null;
      publishedAt?: Date | null;
    } = {};

    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.slug !== undefined || parsed.data.title !== undefined) {
      data.slug = await resolveUniqueQueueSlug(parsed.data.title || 'artigo', parsed.data.slug, String(req.params.id));
    }
    if (parsed.data.content !== undefined) data.content = parsed.data.content;
    if (parsed.data.excerpt !== undefined) data.excerpt = parsed.data.excerpt;
    if (parsed.data.seoTitle !== undefined) data.seoTitle = parsed.data.seoTitle;
    if (parsed.data.seoDescription !== undefined) data.seoDescription = parsed.data.seoDescription;
    if (parsed.data.category !== undefined) data.category = parsed.data.category;
    if (parsed.data.tags !== undefined) data.tags = parsed.data.tags;
    if (parsed.data.status !== undefined) data.status = parsed.data.status as BlogArticleQueueStatus;
    if ('scheduledAt' in parsed.data) data.scheduledAt = parsed.data.scheduledAt ?? null;
    if ('publishedAt' in parsed.data) data.publishedAt = parsed.data.publishedAt ?? null;

    const updated = await prisma.blogArticleQueue.update({
      where: { id: String(req.params.id) },
      data
    });

    res.json(updated);
  })
);

router.delete(
  '/queue/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    await prisma.blogArticleQueue.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

export default router;
