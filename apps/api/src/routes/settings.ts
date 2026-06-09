import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { parseYoutubeVideo } from '../utils/youtube.js';

const router = Router();

const settingsSchema = z.object({
  brandName: z.string().trim().min(2),
  primaryColor: z.string().trim().min(4),
  secondaryColor: z.string().trim().min(4),
  accentColor: z.string().trim().min(4),
  heroTitle: z.string().trim().min(5),
  heroSubtitle: z.string().trim().min(10),
  heroVideoUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => Boolean(parseYoutubeVideo(value)), 'Informe um link válido do YouTube.'),
  whatsappNumber: z.string().trim().min(10),
  creci: z.string().trim().min(3),
  cnpj: z.string().trim().optional().default(''),
  address: z.string().trim().min(5),
  phone: z.string().trim().min(8),
  instagram: z.string().trim().url(),
  privacyUrl: z.string().trim().min(1)
});

const homeVideoSchema = z
  .object({
    homeVideoUrl: z.string().trim().optional().default(''),
    homeVideoStatus: z.enum(['ACTIVE', 'INACTIVE']).default('INACTIVE'),
    homeVideoTitle: z.string().trim().max(160).optional().default(''),
    homeVideoDescription: z.string().trim().max(500).optional().default(''),
    homeVideoThumbnailUrl: z.string().trim().optional().default(''),
    homeVideoOrder: z.coerce.number().int().min(1).max(999).optional().default(1),
    homeVideoAutoplay: z.coerce.boolean().optional().default(true),
    homeVideoMaskEnabled: z.coerce.boolean().optional().default(true)
  })
  .superRefine((value, ctx) => {
    if (value.homeVideoStatus === 'ACTIVE') {
      const parsed = parseYoutubeVideo(value.homeVideoUrl);
      if (!parsed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['homeVideoUrl'],
          message: 'Informe um link válido do YouTube para ativar o Vídeo Home.'
        });
      }
    }

    if (value.homeVideoThumbnailUrl) {
      const thumbnailValidation = z.string().url().safeParse(value.homeVideoThumbnailUrl);
      if (!thumbnailValidation.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['homeVideoThumbnailUrl'],
          message: 'A thumbnail personalizada deve ser uma URL válida.'
        });
      }
    }
  });

const trafficSchema = z.object({
  googleTagManagerId: z.string().trim().regex(/^$|^GTM-[A-Z0-9]+$/i, 'Informe um GTM ID válido.'),
  ga4MeasurementId: z.string().trim().regex(/^$|^G-[A-Z0-9]+$/i, 'Informe um GA4 ID válido.'),
  googleSiteVerification: z.string().trim().max(500).optional().default(''),
  metaPixelId: z.string().trim().regex(/^$|^[0-9]{6,30}$/i, 'Informe um Pixel ID válido.'),
  metaDomainVerification: z.string().trim().max(500).optional().default(''),
  microsoftClarityId: z.string().trim().regex(/^$|^[a-z0-9]+$/i, 'Informe um Clarity Project ID válido.'),
  bingSiteVerification: z.string().trim().max(500).optional().default(''),
  tiktokPixelId: z.string().trim().max(120).optional().default(''),
  linkedInPartnerId: z.string().trim().regex(/^$|^[0-9]+$/i, 'Informe um LinkedIn Partner ID válido.'),
  pinterestTagId: z.string().trim().max(120).optional().default(''),
  customHeadCode: z.string().optional().nullable().default(''),
  customBodyCode: z.string().optional().nullable().default(''),
  customFooterCode: z.string().optional().nullable().default(''),
  indexNowKey: z.string().trim().min(6).max(120).optional().default('munay-indexnow-key')
});

function buildFallbackSettings() {
  return {
    id: 'fallback-site-settings',
    brandName: 'Munay Imóveis',
    primaryColor: '#102a1f',
    secondaryColor: '#d4af72',
    accentColor: '#f6f2e8',
    heroTitle: 'Invista em terrenos com alto potencial de valorização',
    heroSubtitle: 'Empreendimentos premium, imóveis selecionados e atendimento consultivo para quem busca patrimônio com inteligência.',
    heroVideoUrl: 'https://www.youtube.com/embed/mfNsrZJiQkg?autoplay=1&mute=1&controls=0&loop=1&playlist=mfNsrZJiQkg',
    homeVideoStatus: 'INACTIVE',
    homeVideoUrl: null,
    homeVideoTitle: '',
    homeVideoDescription: '',
    homeVideoThumbnailUrl: null,
    homeVideoOrder: 1,
    homeVideoAutoplay: true,
    homeVideoMaskEnabled: true,
    whatsappNumber: '5548991702077',
    creci: 'CRECI 33928-F',
    cnpj: '',
    address: 'Atendimento com hora marcada',
    phone: '(48) 99170-2077',
    instagram: 'https://instagram.com/corretor_icaro_munay',
    privacyUrl: '/politica-de-privacidade',
    smtpSenderName: 'Munay Imóveis',
    smtpSenderEmail: null,
    smtpHost: null,
    smtpPort: 465,
    smtpEncryption: 'SSL' as const,
    smtpUsername: null,
    smtpPasswordEncrypted: null,
    smtpTimeout: 10000,
    smtpPasswordUpdatedAt: null,
    googleTagManagerId: null,
    ga4MeasurementId: null,
    googleSiteVerification: null,
    metaPixelId: null,
    metaDomainVerification: null,
    microsoftClarityId: null,
    bingSiteVerification: null,
    tiktokPixelId: null,
    linkedInPartnerId: null,
    pinterestTagId: null,
    customHeadCode: null,
    customBodyCode: null,
    customFooterCode: null,
    indexNowKey: 'munay-indexnow-key',
    activeThemeLayoutId: null,
    previousThemeLayoutId: null,
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };
}

async function ensureSettings() {
  const existing = await prisma.siteSetting.findFirst();
  if (existing) return existing;
  return prisma.siteSetting.create({ data: {} });
}

function buildHomeVideoPayload(settings: Awaited<ReturnType<typeof ensureSettings>>) {
  return {
    homeVideoUrl: settings.homeVideoUrl || '',
    homeVideoStatus: settings.homeVideoStatus || 'INACTIVE',
    homeVideoTitle: settings.homeVideoTitle || '',
    homeVideoDescription: settings.homeVideoDescription || '',
    homeVideoThumbnailUrl: settings.homeVideoThumbnailUrl || '',
    homeVideoOrder: settings.homeVideoOrder || 1,
    homeVideoAutoplay: settings.homeVideoAutoplay ?? true,
    homeVideoMaskEnabled: settings.homeVideoMaskEnabled ?? true
  };
}

function buildTrafficPayload(settings: Awaited<ReturnType<typeof ensureSettings>>) {
  return {
    googleTagManagerId: settings.googleTagManagerId || '',
    ga4MeasurementId: settings.ga4MeasurementId || '',
    googleSiteVerification: settings.googleSiteVerification || '',
    metaPixelId: settings.metaPixelId || '',
    metaDomainVerification: settings.metaDomainVerification || '',
    microsoftClarityId: settings.microsoftClarityId || '',
    bingSiteVerification: settings.bingSiteVerification || '',
    tiktokPixelId: settings.tiktokPixelId || '',
    linkedInPartnerId: settings.linkedInPartnerId || '',
    pinterestTagId: settings.pinterestTagId || '',
    customHeadCode: settings.customHeadCode || '',
    customBodyCode: settings.customBodyCode || '',
    customFooterCode: settings.customFooterCode || '',
    indexNowKey: settings.indexNowKey || 'munay-indexnow-key'
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    try {
      const settings = await ensureSettings();
      return res.json(settings);
    } catch (error) {
      console.warn('[settings] fallback payload returned after DB read failure', error);
      return res.json(buildFallbackSettings());
    }
  })
);

router.put(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const existing = await ensureSettings();
    const heroYoutube = parseYoutubeVideo(parsed.data.heroVideoUrl);

    const updated = await prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        heroVideoUrl: heroYoutube?.canonicalUrl || parsed.data.heroVideoUrl
      }
    });
    res.json(updated);
  })
);

router.get(
  '/home-video',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const settings = await ensureSettings();
      return res.json(buildHomeVideoPayload(settings));
    } catch (error) {
      console.warn('[settings:home-video] fallback payload returned after DB read failure', error);
      return res.json(buildHomeVideoPayload(buildFallbackSettings()));
    }
  })
);

router.put(
  '/home-video',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = homeVideoSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const youtube = parsed.data.homeVideoUrl ? parseYoutubeVideo(parsed.data.homeVideoUrl) : null;
    const existing = await ensureSettings();

    const updated = await prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        homeVideoStatus: parsed.data.homeVideoStatus,
        homeVideoUrl: youtube?.canonicalUrl || null,
        homeVideoTitle: parsed.data.homeVideoTitle,
        homeVideoDescription: parsed.data.homeVideoDescription,
        homeVideoThumbnailUrl: parsed.data.homeVideoThumbnailUrl || null,
        homeVideoOrder: parsed.data.homeVideoOrder,
        homeVideoAutoplay: parsed.data.homeVideoAutoplay,
        homeVideoMaskEnabled: parsed.data.homeVideoMaskEnabled
      }
    });

    res.json(buildHomeVideoPayload(updated));
  })
);

router.get(
  '/traffic',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const settings = await ensureSettings();
      res.json(buildTrafficPayload(settings));
    } catch (error) {
      console.warn('[settings:traffic] fallback payload returned after DB read failure', error);
      res.json(buildTrafficPayload(buildFallbackSettings()));
    }
  })
);

router.put(
  '/traffic',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = trafficSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const existing = await ensureSettings();
    const updated = await prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        customHeadCode: parsed.data.customHeadCode || null,
        customBodyCode: parsed.data.customBodyCode || null,
        customFooterCode: parsed.data.customFooterCode || null
      }
    });

    res.json(buildTrafficPayload(updated));
  })
);

export default router;
