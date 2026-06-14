import { Prisma, PropertyCategory, PropertyReviewStatus, PropertyStatus } from '@prisma/client';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, OWNER_ROLE, requireRole } from '../middleware/auth.js';
import { makeSlug } from '../utils/slug.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { persistImageValue, persistPropertyImages } from '../utils/property-images.js';
import { notifyOwnerPropertyReview } from '../utils/owner-notifications.js';
import { getRichTextPlainText, sanitizeRichTextHtml } from '../utils/rich-text.js';
import { notifyIndexNowPath } from '../utils/indexnow.js';
import { parseYoutubeVideo } from '../utils/youtube.js';
import { getAnalyticsDay, isValidAnalyticsDate } from '../utils/analytics.js';
import { buildPropertyRevalidationPaths, revalidateSitePaths } from '../utils/revalidate-site.js';

const router = Router();

const imageValueSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (value.startsWith('data:image/')) return true;
    if (value.startsWith('/uploads/')) return true;
    if (value.startsWith('/api/uploads/')) return true;

    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Imagem inválida.');

const emptyToNullImage = imageValueSchema.optional().nullable().or(z.literal(''));
const emptyToNullUrl = z.string().trim().url().optional().nullable().or(z.literal(''));
const emptyToUndefinedString = z.string().trim().optional().nullable().or(z.literal(''));
const optionalPositiveIntSchema = z.preprocess((value) => (value === '' || value === '0' || value === 0 ? null : value), z.coerce.number().int().positive().optional().nullable());
const optionalPositiveNumberSchema = z.preprocess((value) => (value === '' || value === '0' || value === 0 ? null : value), z.coerce.number().positive().optional().nullable());

const propertySchema = z
  .object({
    title: z.string().trim().min(3),
    shortDescription: z.string().trim().min(10),
    fullDescription: z.string().trim().min(20),
    price: z.coerce.number().positive(),
    promotionalPrice: optionalPositiveNumberSchema,
    status: z.nativeEnum(PropertyStatus).default(PropertyStatus.AVAILABLE),
    propertyCode: emptyToUndefinedString,
    area: z.coerce.number().int().positive().optional().default(1),
    landArea: optionalPositiveIntSchema,
    builtArea: optionalPositiveIntSchema,
    bedrooms: z.coerce.number().int().optional().nullable(),
    bathrooms: z.coerce.number().int().optional().nullable(),
    suites: z.coerce.number().int().optional().nullable(),
    garage: z.coerce.number().int().optional().nullable(),
    floor: z.coerce.number().int().optional().nullable(),
    hasElevator: z.boolean().default(false),
    solarPosition: z.string().trim().optional().nullable().or(z.literal('')),
    hasEdicule: z.boolean().default(false),
    ediculeArea: optionalPositiveIntSchema,
    ediculeBedrooms: z.coerce.number().int().optional().nullable(),
    ediculeBathrooms: z.coerce.number().int().optional().nullable(),
    ediculeHasLivingRoom: z.boolean().default(false),
    ediculeHasKitchen: z.boolean().default(false),
    acceptsBankFinancing: z.boolean().default(false),
    acceptsFgts: z.boolean().default(false),
    acceptsCar: z.boolean().default(false),
    acceptsExchange: z.boolean().default(false),
    acceptsProposal: z.boolean().default(false),
    acceptsDirectInstallments: z.boolean().default(false),
    maxDirectInstallments: optionalPositiveIntSchema,
    constructionYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
    landFrontage: optionalPositiveNumberSchema,
    landDepthLeft: optionalPositiveNumberSchema,
    landDepthRight: optionalPositiveNumberSchema,
    hasPaving: z.boolean().default(false),
    hasElectricity: z.boolean().default(false),
    hasWaterNetwork: z.boolean().default(false),
    city: z.string().trim().min(2),
    district: z.string().trim().min(2),
    state: z.string().trim().min(2),
    category: z.nativeEnum(PropertyCategory),
    type: z.string().trim().min(2),
    lotsMinArea: optionalPositiveIntSchema,
    lotsMaxArea: optionalPositiveIntSchema,
    lotsQuantity: optionalPositiveIntSchema,
    developmentInfrastructure: z.string().trim().optional().nullable().or(z.literal('')),
    developmentHasPaving: z.boolean().default(false),
    developmentHasElectricity: z.boolean().default(false),
    developmentHasWaterNetwork: z.boolean().default(false),
    readyToBuild: z.boolean().default(false),
    hasDevelopmentInstallments: z.boolean().default(false),
    developmentMaxInstallments: optionalPositiveIntSchema,
    featured: z.boolean().default(false),
    launch: z.boolean().default(false),
    approved: z.boolean().default(true),
    submittedByOwner: z.boolean().default(false),
    ownerName: emptyToUndefinedString,
    ownerPhone: emptyToUndefinedString,
    ownerEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
    googleMapsLink: emptyToNullUrl,
    latitude: z.coerce.number().optional().nullable(),
    longitude: z.coerce.number().optional().nullable(),
    youtubeLink: emptyToNullUrl,
    coverImage: emptyToNullImage,
    pdfTableUrl: emptyToNullUrl,
    pdfProjectUrl: emptyToNullUrl,
    images: z
      .array(
        z.object({
          url: imageValueSchema,
          alt: z.string().trim().optional()
        })
      )
      .max(20)
      .default([])
  })
  .superRefine((value, ctx) => {
    if (value.youtubeLink && !parseYoutubeVideo(value.youtubeLink)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['youtubeLink'],
        message: 'Informe um link válido do YouTube para o vídeo do imóvel.'
      });
    }

    const visibility = getTypeVisibility(value.type, value.category);

    if (!value.landArea && !value.builtArea && !value.area) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['landArea'],
        message: 'Informe ao menos uma área válida para o imóvel.'
      });
    }

    if (value.acceptsDirectInstallments && !value.maxDirectInstallments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxDirectInstallments'],
        message: 'Informe a quantidade máxima de parcelas do parcelamento direto.'
      });
    }

    if (value.hasDevelopmentInstallments && !value.developmentMaxInstallments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['developmentMaxInstallments'],
        message: 'Informe a quantidade máxima de parcelas da loteadora.'
      });
    }

    if (visibility.isApartment && value.landArea) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['landArea'],
        message: 'Apartamento não utiliza área de terreno.'
      });
    }
  });

const ownerMutableSchema = z.object({
  ownerPhone: z.string().trim().min(8),
  title: z.string().trim().min(3),
  shortDescription: z.string().trim().min(10),
  fullDescription: z.string().trim().min(20),
  price: z.coerce.number().positive(),
  area: z.coerce.number().int().positive(),
  bedrooms: z.coerce.number().int().optional().nullable(),
  bathrooms: z.coerce.number().int().optional().nullable(),
  garage: z.coerce.number().int().optional().nullable(),
  city: z.string().trim().min(2),
  district: z.string().trim().min(2),
  state: z.string().trim().min(2),
  category: z.nativeEnum(PropertyCategory),
  type: z.string().trim().min(2),
  images: z.array(imageValueSchema).min(1).max(20),
  website: z.string().trim().optional()
});

const listQuerySchema = z.object({
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  state: z.string().trim().optional(),
  category: z.nativeEnum(PropertyCategory).optional(),
  type: z.string().trim().optional(),
  propertyCode: z.string().trim().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  launch: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  featured: z.enum(['true', 'false']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12)
});

const ACTIVE_LOCATION_STATUSES = [PropertyStatus.AVAILABLE, PropertyStatus.LAUNCH] as const;
let propertyLocationOptionsCache: { expiresAt: number; data: Array<{ city: string; total: number; districts: Array<{ district: string; total: number }> }> } | null = null;

type CachedProperty = Awaited<ReturnType<typeof prisma.property.findMany>>[number];

let publicPropertiesCache: CachedProperty[] = [];
let adminPropertiesCache: CachedProperty[] = [];
const propertyBySlugCache = new Map<string, CachedProperty>();

function sortCachedProperties(items: CachedProperty[]) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

function cachePropertyCollection(items: CachedProperty[], scope: 'public' | 'admin') {
  const normalized = sortCachedProperties(items);

  if (scope === 'admin') {
    adminPropertiesCache = normalized;
    publicPropertiesCache = normalized.filter((item) => item.approved !== false);
  } else {
    publicPropertiesCache = normalized.filter((item) => item.approved !== false);
  }

  normalized.forEach((item) => {
    propertyBySlugCache.set(item.slug, item);
  });
}

function upsertCachedProperty(item: CachedProperty) {
  propertyBySlugCache.set(item.slug, item);
  adminPropertiesCache = sortCachedProperties([item, ...adminPropertiesCache.filter((entry) => entry.id !== item.id && entry.slug !== item.slug)]);
  publicPropertiesCache = sortCachedProperties(adminPropertiesCache.filter((entry) => entry.approved !== false));
}

function removeCachedProperty(id: string, slug: string) {
  adminPropertiesCache = adminPropertiesCache.filter((entry) => entry.id !== id);
  publicPropertiesCache = publicPropertiesCache.filter((entry) => entry.id !== id);
  propertyBySlugCache.delete(slug);
}

const propertyViewSchema = z.object({
  visitorKey: z.string().trim().min(16).max(120)
});

type PropertyInput = z.infer<typeof propertySchema>;

function categorySupportsRoomFields(category: PropertyCategory) {
  return category === PropertyCategory.CASA || category === PropertyCategory.APARTAMENTO || category === PropertyCategory.COMERCIAL || category === PropertyCategory.RURAL;
}

function normalizeTypeKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function normalizeTypeLabel(value: string, fallbackCategory?: PropertyCategory) {
  const typeKey = normalizeTypeKey(value);
  const map: Record<string, string> = {
    CASA: 'Casa',
    APARTAMENTO: 'Apartamento',
    TERRENO: 'Terreno',
    CHACARA: 'Chácara',
    SITIO: 'Sítio',
    FAZENDA: 'Fazenda',
    COMERCIAL: 'Comercial',
    LOTEAMENTO: 'Loteamento'
  };

  if (map[typeKey]) return map[typeKey];
  if (value.trim()) return value.trim();

  const fallbackMap: Record<PropertyCategory, string> = {
    CASA: 'Casa',
    APARTAMENTO: 'Apartamento',
    TERRENO: 'Terreno',
    LOTEAMENTO: 'Loteamento',
    COMERCIAL: 'Comercial',
    RURAL: 'Chácara'
  };

  return fallbackCategory ? fallbackMap[fallbackCategory] : 'Casa';
}

function isKnownTypeKey(typeKey: string) {
  return ['CASA', 'APARTAMENTO', 'TERRENO', 'CHACARA', 'SITIO', 'FAZENDA', 'COMERCIAL', 'LOTEAMENTO'].includes(typeKey);
}

function getTypeKeyFromCategory(category: PropertyCategory) {
  if (category === PropertyCategory.APARTAMENTO) return 'APARTAMENTO';
  if (category === PropertyCategory.TERRENO) return 'TERRENO';
  if (category === PropertyCategory.COMERCIAL) return 'COMERCIAL';
  if (category === PropertyCategory.LOTEAMENTO) return 'LOTEAMENTO';
  if (category === PropertyCategory.RURAL) return 'CHACARA';
  return 'CASA';
}

function resolveCategoryFromType(value: string, fallback: PropertyCategory) {
  const rawTypeKey = normalizeTypeKey(value);
  const typeKey = isKnownTypeKey(rawTypeKey) ? rawTypeKey : getTypeKeyFromCategory(fallback);

  if (typeKey === 'APARTAMENTO') return PropertyCategory.APARTAMENTO;
  if (typeKey === 'TERRENO') return PropertyCategory.TERRENO;
  if (typeKey === 'COMERCIAL') return PropertyCategory.COMERCIAL;
  if (typeKey === 'LOTEAMENTO') return PropertyCategory.LOTEAMENTO;
  if (['CHACARA', 'SITIO', 'FAZENDA'].includes(typeKey)) return PropertyCategory.RURAL;
  return PropertyCategory.CASA;
}

function getTypeVisibility(value: string, fallbackCategory: PropertyCategory) {
  const resolvedCategory = resolveCategoryFromType(value, fallbackCategory);
  const rawTypeKey = normalizeTypeKey(value);
  const typeKey = isKnownTypeKey(rawTypeKey) ? rawTypeKey : getTypeKeyFromCategory(resolvedCategory);
  const isApartment = typeKey === 'APARTAMENTO';
  const isTerrain = typeKey === 'TERRENO';
  const isDevelopment = typeKey === 'LOTEAMENTO';
  const isHouseLike = ['CASA', 'CHACARA', 'SITIO', 'FAZENDA'].includes(typeKey);
  const showRooms = !isTerrain && !isDevelopment;
  const showBuiltArea = !isTerrain && !isDevelopment;
  const showLandArea = isHouseLike || isTerrain || typeKey === 'COMERCIAL';

  return {
    resolvedCategory,
    normalizedType: normalizeTypeLabel(value, resolvedCategory),
    isApartment,
    isTerrain,
    isDevelopment,
    isHouseLike,
    showRooms,
    showBuiltArea,
    showLandArea,
    showEdicule: isHouseLike,
    showFloor: isApartment,
    showElevator: isApartment,
    showSolarPosition: !isTerrain && !isDevelopment,
    showConstructionYear: !isTerrain && !isDevelopment,
    showTerrainDimensions: isTerrain,
    showTerrainInfrastructure: isTerrain,
    showDevelopmentFields: isDevelopment
  };
}

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false
});

function getCodePrefix(data: Pick<PropertyInput, 'category' | 'type' | 'title'>) {
  const fingerprint = normalizeTypeKey(`${data.type} ${data.category} ${data.title}`);

  if (fingerprint.includes('COBERTURA')) return 'CO';
  if (fingerprint.includes('APART')) return 'AP';
  if (fingerprint.includes('CASA')) return 'CA';
  if (fingerprint.includes('CHACARA')) return 'CH';
  if (fingerprint.includes('SITIO')) return 'SI';
  if (fingerprint.includes('FAZENDA')) return 'FA';
  if (fingerprint.includes('COMERCIAL') || fingerprint.includes('LOJA') || fingerprint.includes('SALA')) return 'CM';
  if (fingerprint.includes('LOTEAMENTO')) return 'LO';
  if (fingerprint.includes('TERRENO') || fingerprint.includes('LOTE')) return 'TE';
  return 'IM';
}

async function generatePropertyCode(data: Pick<PropertyInput, 'category' | 'type' | 'title'>) {
  const prefix = getCodePrefix(data);
  const lastItem = await prisma.property.findFirst({
    where: { propertyCode: { startsWith: prefix } },
    orderBy: { propertyCode: 'desc' },
    select: { propertyCode: true }
  });

  const lastNumber = Number(lastItem?.propertyCode.replace(prefix, '') || '0');
  const nextNumber = String(lastNumber + 1).padStart(3, '0');
  return `${prefix}${nextNumber}`;
}

async function normalizePropertyInput(data: PropertyInput, existingCode?: string | null) {
  const visibility = getTypeVisibility(data.type, data.category);
  const generatedCode = existingCode || (await generatePropertyCode({ ...data, category: visibility.resolvedCategory, type: visibility.normalizedType }));
  const normalizedState = String(data.state || '').trim().toUpperCase().slice(0, 2);
  const normalizedCity = String(data.city || '').trim();
  const normalizedDistrict = String(data.district || '').trim();
  const supportsRoomFields = visibility.showRooms && categorySupportsRoomFields(visibility.resolvedCategory);
  const normalizedStatus = data.launch
    ? PropertyStatus.LAUNCH
    : data.status === PropertyStatus.LAUNCH
      ? PropertyStatus.AVAILABLE
      : data.status;
  const resolvedImages = data.images.length ? data.images : data.coverImage ? [{ url: data.coverImage, alt: data.title }] : [];
  const persistedImages = await persistPropertyImages(resolvedImages);
  const coverIndex = resolvedImages.findIndex((image) => image.url === data.coverImage);
  const resolvedCover = coverIndex >= 0
    ? persistedImages[coverIndex]?.url
    : (await persistImageValue(data.coverImage || persistedImages[0]?.url)) || persistedImages[0]?.url;
  const sanitizedFullDescription = sanitizeRichTextHtml(data.fullDescription);

  if (!resolvedCover) {
    throw new AppError(400, 'Informe ao menos uma imagem do imóvel.');
  }

  if (getRichTextPlainText(sanitizedFullDescription).length < 20) {
    throw new AppError(400, 'Descrição completa deve ter pelo menos 20 caracteres úteis.');
  }

  const youtube = data.youtubeLink ? parseYoutubeVideo(data.youtubeLink) : null;
  const resolvedArea = data.builtArea ?? data.landArea ?? data.area;

  return {
    ...data,
    category: visibility.resolvedCategory,
    type: visibility.normalizedType,
    area: resolvedArea,
    city: normalizedCity,
    district: normalizedDistrict,
    state: normalizedState,
    fullDescription: sanitizedFullDescription,
    images: persistedImages,
    coverImage: resolvedCover,
    propertyCode: generatedCode,
    slug: makeSlug(`${data.title}-${generatedCode}`),
    status: normalizedStatus,
    promotionalPrice: data.promotionalPrice ?? null,
    landArea: visibility.showLandArea ? data.landArea ?? null : null,
    builtArea: visibility.showBuiltArea ? data.builtArea ?? null : null,
    bedrooms: supportsRoomFields ? data.bedrooms ?? null : null,
    bathrooms: supportsRoomFields ? data.bathrooms ?? null : null,
    suites: supportsRoomFields ? data.suites ?? null : null,
    garage: visibility.showRooms ? data.garage ?? null : null,
    floor: visibility.showFloor ? data.floor ?? null : null,
    hasElevator: visibility.showElevator ? Boolean(data.hasElevator) : false,
    solarPosition: visibility.showSolarPosition ? (data.solarPosition || null) : null,
    hasEdicule: visibility.showEdicule ? Boolean(data.hasEdicule) : false,
    ediculeArea: visibility.showEdicule && data.hasEdicule ? data.ediculeArea ?? null : null,
    ediculeBedrooms: visibility.showEdicule && data.hasEdicule ? data.ediculeBedrooms ?? null : null,
    ediculeBathrooms: visibility.showEdicule && data.hasEdicule ? data.ediculeBathrooms ?? null : null,
    ediculeHasLivingRoom: visibility.showEdicule && data.hasEdicule ? Boolean(data.ediculeHasLivingRoom) : false,
    ediculeHasKitchen: visibility.showEdicule && data.hasEdicule ? Boolean(data.ediculeHasKitchen) : false,
    acceptsBankFinancing: Boolean(data.acceptsBankFinancing),
    acceptsFgts: Boolean(data.acceptsFgts),
    acceptsCar: Boolean(data.acceptsCar),
    acceptsExchange: Boolean(data.acceptsExchange),
    acceptsProposal: Boolean(data.acceptsProposal),
    acceptsDirectInstallments: Boolean(data.acceptsDirectInstallments),
    maxDirectInstallments: data.acceptsDirectInstallments ? data.maxDirectInstallments ?? null : null,
    constructionYear: visibility.showConstructionYear ? data.constructionYear ?? null : null,
    landFrontage: visibility.showTerrainDimensions ? data.landFrontage ?? null : null,
    landDepthLeft: visibility.showTerrainDimensions ? data.landDepthLeft ?? null : null,
    landDepthRight: visibility.showTerrainDimensions ? data.landDepthRight ?? null : null,
    hasPaving: visibility.showTerrainInfrastructure ? Boolean(data.hasPaving) : false,
    hasElectricity: visibility.showTerrainInfrastructure ? Boolean(data.hasElectricity) : false,
    hasWaterNetwork: visibility.showTerrainInfrastructure ? Boolean(data.hasWaterNetwork) : false,
    lotsMinArea: visibility.showDevelopmentFields ? data.lotsMinArea ?? null : null,
    lotsMaxArea: visibility.showDevelopmentFields ? data.lotsMaxArea ?? null : null,
    lotsQuantity: visibility.showDevelopmentFields ? data.lotsQuantity ?? null : null,
    developmentInfrastructure: visibility.showDevelopmentFields ? (data.developmentInfrastructure || null) : null,
    developmentHasPaving: visibility.showDevelopmentFields ? Boolean(data.developmentHasPaving) : false,
    developmentHasElectricity: visibility.showDevelopmentFields ? Boolean(data.developmentHasElectricity) : false,
    developmentHasWaterNetwork: visibility.showDevelopmentFields ? Boolean(data.developmentHasWaterNetwork) : false,
    readyToBuild: visibility.showDevelopmentFields ? Boolean(data.readyToBuild) : false,
    hasDevelopmentInstallments: visibility.showDevelopmentFields ? Boolean(data.hasDevelopmentInstallments) : false,
    developmentMaxInstallments: visibility.showDevelopmentFields && data.hasDevelopmentInstallments ? data.developmentMaxInstallments ?? null : null,
    approved: data.approved ?? true,
    submittedByOwner: data.submittedByOwner ?? false,
    ownerName: data.ownerName || null,
    ownerPhone: data.ownerPhone || null,
    ownerEmail: data.ownerEmail || null,
    googleMapsLink: data.googleMapsLink || null,
    youtubeLink: youtube?.canonicalUrl || null,
    pdfProjectUrl: data.pdfProjectUrl || null,
    pdfTableUrl: data.pdfTableUrl || null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null
  };
}

async function safeNotify(action: 'created' | 'updated', property: {
  id: string;
  title: string;
  propertyCode: string;
  city: string;
  state: string;
  district: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}) {
  try {
    await notifyOwnerPropertyReview({ action, property });
  } catch (error) {
    console.error('Falha ao enviar notificação de proprietário:', error);
  }
}

function getPropertyPublicPath(property: { slug: string; category: PropertyCategory }) {
  if (property.category === PropertyCategory.TERRENO) {
    return `/terreno/${property.slug}`;
  }

  if (property.category === PropertyCategory.LOTEAMENTO) {
    return `/loteamento/${property.slug}`;
  }

  return `/imovel/${property.slug}`;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const where: Prisma.PropertyWhereInput = {
      approved: true,
      AND: [
        query.city ? { city: query.city } : {},
        query.district ? { district: query.district } : {},
        query.state ? { state: query.state } : {},
        query.category ? { category: query.category } : {},
        query.type ? { type: { contains: query.type, mode: 'insensitive' } } : {},
        query.propertyCode ? { propertyCode: { contains: query.propertyCode, mode: 'insensitive' } } : {},
        query.status ? { status: query.status } : {},
        query.launch === 'true' ? { OR: [{ launch: true }, { status: PropertyStatus.LAUNCH }] } : {},
        query.featured === 'true' ? { featured: true } : {},
        typeof query.minPrice === 'number' ? { price: { gte: query.minPrice } } : {},
        typeof query.maxPrice === 'number' ? { price: { lte: query.maxPrice } } : {},
        query.search
          ? {
              OR: [
                { title: { contains: query.search, mode: 'insensitive' } },
                { city: { contains: query.search, mode: 'insensitive' } },
                { district: { contains: query.search, mode: 'insensitive' } },
                { propertyCode: { contains: query.search, mode: 'insensitive' } },
                { type: { contains: query.search, mode: 'insensitive' } }
              ]
            }
          : {}
      ]
    };

    try {
      const [items, total] = await Promise.all([
        prisma.property.findMany({
          where,
          include: { images: { orderBy: { sortOrder: 'asc' } } },
          orderBy: [{ launch: 'desc' }, { featured: 'desc' }, { createdAt: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit
        }),
        prisma.property.count({ where })
      ]);

      if (
        query.page === 1 &&
        !query.city &&
        !query.district &&
        !query.state &&
        !query.category &&
        !query.type &&
        !query.propertyCode &&
        !query.status &&
        !query.launch &&
        !query.featured &&
        !query.search &&
        typeof query.minPrice !== 'number' &&
        typeof query.maxPrice !== 'number'
      ) {
        cachePropertyCollection(items, 'public');
      }

      res.setHeader('x-pagination-total', total.toString());
      res.setHeader('x-pagination-page', query.page.toString());
      res.setHeader('x-pagination-limit', query.limit.toString());

      res.json(items);
      return;
    } catch (error) {
      console.warn('[properties] fallback payload returned after query failure', error);
      const fallbackItems = publicPropertiesCache.slice((query.page - 1) * query.limit, query.page * query.limit);
      res.setHeader('x-pagination-total', publicPropertiesCache.length.toString());
      res.setHeader('x-pagination-page', query.page.toString());
      res.setHeader('x-pagination-limit', query.limit.toString());
      res.json(fallbackItems);
    }
  })
);

router.get(
  '/location-options',
  asyncHandler(async (_req, res) => {
    if (propertyLocationOptionsCache && propertyLocationOptionsCache.expiresAt > Date.now()) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json(propertyLocationOptionsCache.data);
      return;
    }

    const where: Prisma.PropertyWhereInput = {
      approved: true,
      status: { in: [...ACTIVE_LOCATION_STATUSES] }
    };

    const [cityRows, districtRows] = await Promise.all([
      prisma.property.groupBy({
        by: ['city'],
        where,
        _count: { _all: true }
      }),
      prisma.property.groupBy({
        by: ['city', 'district'],
        where,
        _count: { _all: true }
      })
    ]);

    const districtsByCity = new Map<string, Array<{ district: string; total: number }>>();

    districtRows.forEach((row) => {
      const city = String(row.city || '').trim();
      const district = String(row.district || '').trim();
      const total = row._count._all;

      if (!city || !district || total < 1) return;

      const bucket = districtsByCity.get(city) || [];
      bucket.push({ district, total });
      districtsByCity.set(city, bucket);
    });

    const data = cityRows
      .map((row) => {
        const city = String(row.city || '').trim();
        const total = row._count._all;
        if (!city || total < 1) return null;

        return {
          city,
          total,
          districts: (districtsByCity.get(city) || []).sort((a, b) => b.total - a.total || a.district.localeCompare(b.district, 'pt-BR'))
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.total - a!.total || a!.city.localeCompare(b!.city, 'pt-BR')) as Array<{ city: string; total: number; districts: Array<{ district: string; total: number }> }>;

    propertyLocationOptionsCache = {
      expiresAt: Date.now() + 60 * 1000,
      data
    };

    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(data);
  })
);

router.get(
  '/admin/all',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const items = await prisma.property.findMany({
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: [{ approved: 'asc' }, { createdAt: 'desc' }]
      });

      cachePropertyCollection(items, 'admin');
      res.json(items);
    } catch (error) {
      console.warn('[properties:admin] fallback payload returned after query failure', error);
      res.json(adminPropertiesCache);
    }
  })
);

router.get(
  '/owner/my',
  authMiddleware,
  requireRole([OWNER_ROLE]),
  asyncHandler(async (req, res) => {
    const email = req.user?.email;

    if (!email) {
      throw new AppError(401, 'Sessão do proprietário inválida.');
    }

    const items = await prisma.property.findMany({
      where: { ownerEmail: email },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(items);
  })
);

router.post(
  '/submit',
  submitLimiter,
  authMiddleware,
  requireRole([OWNER_ROLE]),
  asyncHandler(async (req, res) => {
    const parsed = ownerMutableSchema.safeParse(req.body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      throw new AppError(400, String(firstError), parsed.error.flatten());
    }

    if (parsed.data.website) {
      throw new AppError(400, 'Cadastro rejeitado por validação anti-spam.');
    }

    const ownerEmail = req.user?.email;
    const ownerName = req.user?.name || 'Proprietário';

    if (!ownerEmail) {
      throw new AppError(401, 'Sessão do proprietário inválida.');
    }

    const normalized = await normalizePropertyInput({
      title: parsed.data.title,
      shortDescription: parsed.data.shortDescription,
      fullDescription: parsed.data.fullDescription,
      price: parsed.data.price,
      promotionalPrice: null,
      status: PropertyStatus.AVAILABLE,
      propertyCode: '',
      area: parsed.data.area,
      landArea: null,
      builtArea: null,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      suites: null,
      garage: parsed.data.garage ?? null,
      floor: null,
      hasElevator: false,
      solarPosition: '',
      hasEdicule: false,
      ediculeArea: null,
      ediculeBedrooms: null,
      ediculeBathrooms: null,
      ediculeHasLivingRoom: false,
      ediculeHasKitchen: false,
      acceptsBankFinancing: false,
      acceptsFgts: false,
      acceptsCar: false,
      acceptsExchange: false,
      acceptsProposal: false,
      acceptsDirectInstallments: false,
      maxDirectInstallments: null,
      constructionYear: null,
      landFrontage: null,
      landDepthLeft: null,
      landDepthRight: null,
      hasPaving: false,
      hasElectricity: false,
      hasWaterNetwork: false,
      city: parsed.data.city,
      district: parsed.data.district,
      state: parsed.data.state,
      category: parsed.data.category,
      type: parsed.data.type,
      lotsMinArea: null,
      lotsMaxArea: null,
      lotsQuantity: null,
      developmentInfrastructure: '',
      developmentHasPaving: false,
      developmentHasElectricity: false,
      developmentHasWaterNetwork: false,
      readyToBuild: false,
      hasDevelopmentInstallments: false,
      developmentMaxInstallments: null,
      featured: false,
      launch: false,
      approved: false,
      submittedByOwner: true,
      ownerName,
      ownerPhone: parsed.data.ownerPhone,
      ownerEmail,
      googleMapsLink: '',
      latitude: null,
      longitude: null,
      youtubeLink: '',
      coverImage: parsed.data.images[0],
      pdfTableUrl: '',
      pdfProjectUrl: '',
      images: parsed.data.images.map((url) => ({ url, alt: parsed.data.title }))
    });

    const created = await prisma.property.create({
      data: {
        ...normalized,
        reviewStatus: PropertyReviewStatus.PENDING,
        images: {
          create: normalized.images.map((image, index) => ({ ...image, sortOrder: index }))
        }
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    void safeNotify('created', {
      id: created.id,
      title: created.title,
      propertyCode: created.propertyCode,
      city: created.city,
      state: created.state,
      district: created.district,
      ownerName: created.ownerName,
      ownerPhone: created.ownerPhone,
      ownerEmail: created.ownerEmail
    });

    res.status(201).json(created);
  })
);

router.put(
  '/owner/:id',
  authMiddleware,
  requireRole([OWNER_ROLE]),
  asyncHandler(async (req, res) => {
    const parsed = ownerMutableSchema.safeParse(req.body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      throw new AppError(400, String(firstError), parsed.error.flatten());
    }

    if (parsed.data.website) {
      throw new AppError(400, 'Cadastro rejeitado por validação anti-spam.');
    }

    const ownerEmail = req.user?.email;
    const ownerName = req.user?.name || 'Proprietário';

    if (!ownerEmail) {
      throw new AppError(401, 'Sessão do proprietário inválida.');
    }

    const existing = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    if (!existing) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    if (existing.ownerEmail !== ownerEmail || !existing.submittedByOwner || existing.approved !== false) {
      throw new AppError(403, 'Você só pode editar imóveis pendentes enviados pela sua conta.');
    }

    const normalized = await normalizePropertyInput(
      {
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription,
        fullDescription: parsed.data.fullDescription,
        price: parsed.data.price,
        promotionalPrice: null,
        status: PropertyStatus.AVAILABLE,
        propertyCode: existing.propertyCode,
        area: parsed.data.area,
        landArea: existing.landArea ?? null,
        builtArea: existing.builtArea ?? null,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        suites: existing.suites ?? null,
        garage: parsed.data.garage ?? null,
        floor: existing.floor ?? null,
        hasElevator: existing.hasElevator,
        solarPosition: existing.solarPosition || '',
        hasEdicule: existing.hasEdicule,
        ediculeArea: existing.ediculeArea ?? null,
        ediculeBedrooms: existing.ediculeBedrooms ?? null,
        ediculeBathrooms: existing.ediculeBathrooms ?? null,
        ediculeHasLivingRoom: existing.ediculeHasLivingRoom,
        ediculeHasKitchen: existing.ediculeHasKitchen,
        acceptsBankFinancing: existing.acceptsBankFinancing,
        acceptsFgts: existing.acceptsFgts,
        acceptsCar: existing.acceptsCar,
        acceptsExchange: existing.acceptsExchange,
        acceptsProposal: existing.acceptsProposal,
        acceptsDirectInstallments: existing.acceptsDirectInstallments,
        maxDirectInstallments: existing.maxDirectInstallments ?? null,
        constructionYear: existing.constructionYear ?? null,
        landFrontage: existing.landFrontage ?? null,
        landDepthLeft: existing.landDepthLeft ?? null,
        landDepthRight: existing.landDepthRight ?? null,
        hasPaving: existing.hasPaving,
        hasElectricity: existing.hasElectricity,
        hasWaterNetwork: existing.hasWaterNetwork,
        city: parsed.data.city,
        district: parsed.data.district,
        state: parsed.data.state,
        category: parsed.data.category,
        type: parsed.data.type,
        lotsMinArea: existing.lotsMinArea ?? null,
        lotsMaxArea: existing.lotsMaxArea ?? null,
        lotsQuantity: existing.lotsQuantity ?? null,
        developmentInfrastructure: existing.developmentInfrastructure || '',
        developmentHasPaving: existing.developmentHasPaving,
        developmentHasElectricity: existing.developmentHasElectricity,
        developmentHasWaterNetwork: existing.developmentHasWaterNetwork,
        readyToBuild: existing.readyToBuild,
        hasDevelopmentInstallments: existing.hasDevelopmentInstallments,
        developmentMaxInstallments: existing.developmentMaxInstallments ?? null,
        featured: false,
        launch: false,
        approved: false,
        submittedByOwner: true,
        ownerName,
        ownerPhone: parsed.data.ownerPhone,
        ownerEmail,
        googleMapsLink: existing.googleMapsLink || '',
        latitude: existing.latitude,
        longitude: existing.longitude,
        youtubeLink: existing.youtubeLink || '',
        coverImage: parsed.data.images[0],
        pdfTableUrl: existing.pdfTableUrl || '',
        pdfProjectUrl: existing.pdfProjectUrl || '',
        images: parsed.data.images.map((url) => ({ url, alt: parsed.data.title }))
      },
      existing.propertyCode
    );

    const updated = await prisma.property.update({
      where: { id: existing.id },
      data: {
        ...normalized,
        approved: false,
        reviewStatus: PropertyReviewStatus.PENDING,
        images: {
          deleteMany: {},
          create: normalized.images.map((image, index) => ({ ...image, sortOrder: index }))
        }
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    void safeNotify('updated', {
      id: updated.id,
      title: updated.title,
      propertyCode: updated.propertyCode,
      city: updated.city,
      state: updated.state,
      district: updated.district,
      ownerName: updated.ownerName,
      ownerPhone: updated.ownerPhone,
      ownerEmail: updated.ownerEmail
    });

    res.json(updated);
  })
);

router.post(
  '/:id/duplicate',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.property.findUnique({
      where: { id: String(req.params.id) },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    if (!existing) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    const duplicatedData = await normalizePropertyInput({
      title: existing.title,
      shortDescription: existing.shortDescription,
      fullDescription: existing.fullDescription,
      price: Number(existing.price),
      promotionalPrice: existing.promotionalPrice ? Number(existing.promotionalPrice) : null,
      status: existing.status,
      propertyCode: '',
      area: existing.area,
      builtArea: existing.builtArea ?? null,
      landArea: existing.landArea ?? null,
      bedrooms: existing.bedrooms ?? null,
      bathrooms: existing.bathrooms ?? null,
      suites: existing.suites ?? null,
      garage: existing.garage ?? null,
      floor: existing.floor ?? null,
      hasElevator: existing.hasElevator,
      solarPosition: existing.solarPosition || '',
      hasEdicule: existing.hasEdicule,
      ediculeArea: existing.ediculeArea ?? null,
      ediculeBedrooms: existing.ediculeBedrooms ?? null,
      ediculeBathrooms: existing.ediculeBathrooms ?? null,
      ediculeHasLivingRoom: existing.ediculeHasLivingRoom,
      ediculeHasKitchen: existing.ediculeHasKitchen,
      acceptsBankFinancing: existing.acceptsBankFinancing,
      acceptsFgts: existing.acceptsFgts,
      acceptsCar: existing.acceptsCar,
      acceptsExchange: existing.acceptsExchange,
      acceptsProposal: existing.acceptsProposal,
      acceptsDirectInstallments: existing.acceptsDirectInstallments,
      maxDirectInstallments: existing.maxDirectInstallments ?? null,
      constructionYear: existing.constructionYear ?? null,
      landFrontage: existing.landFrontage ?? null,
      landDepthLeft: existing.landDepthLeft ?? null,
      landDepthRight: existing.landDepthRight ?? null,
      hasPaving: existing.hasPaving,
      hasElectricity: existing.hasElectricity,
      hasWaterNetwork: existing.hasWaterNetwork,
      city: existing.city,
      district: existing.district,
      state: existing.state,
      category: existing.category,
      type: existing.type,
      lotsMinArea: existing.lotsMinArea ?? null,
      lotsMaxArea: existing.lotsMaxArea ?? null,
      lotsQuantity: existing.lotsQuantity ?? null,
      developmentInfrastructure: existing.developmentInfrastructure || '',
      developmentHasPaving: existing.developmentHasPaving,
      developmentHasElectricity: existing.developmentHasElectricity,
      developmentHasWaterNetwork: existing.developmentHasWaterNetwork,
      readyToBuild: existing.readyToBuild,
      hasDevelopmentInstallments: existing.hasDevelopmentInstallments,
      developmentMaxInstallments: existing.developmentMaxInstallments ?? null,
      featured: existing.featured,
      launch: existing.launch,
      approved: existing.approved,
      submittedByOwner: existing.submittedByOwner,
      ownerName: existing.ownerName || '',
      ownerPhone: existing.ownerPhone || '',
      ownerEmail: existing.ownerEmail || '',
      googleMapsLink: existing.googleMapsLink || '',
      latitude: existing.latitude,
      longitude: existing.longitude,
      youtubeLink: existing.youtubeLink || '',
      coverImage: existing.coverImage,
      pdfTableUrl: existing.pdfTableUrl || '',
      pdfProjectUrl: existing.pdfProjectUrl || '',
      images: existing.images.map((image) => ({
        url: image.url,
        alt: image.alt || existing.title
      }))
    });

    const duplicated = await prisma.property.create({
      data: {
        ...duplicatedData,
        reviewStatus: duplicatedData.approved ? PropertyReviewStatus.APPROVED : PropertyReviewStatus.PENDING,
        images: {
          create: duplicatedData.images.map((image, index) => ({ ...image, sortOrder: index }))
        }
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    if (duplicated.approved) {
      void notifyIndexNowPath(getPropertyPublicPath(duplicated));
    }

    void revalidateSitePaths(buildPropertyRevalidationPaths(existing, duplicated));

    res.status(201).json(duplicated);
  })
);

router.patch(
  '/:id/approve',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.property.findUnique({ where: { id: String(req.params.id) } });

    if (!existing) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    const updated = await prisma.property.update({
      where: { id: existing.id },
      data: {
        approved: true,
        reviewStatus: PropertyReviewStatus.APPROVED
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });

    void notifyIndexNowPath(getPropertyPublicPath(updated));
    void revalidateSitePaths(buildPropertyRevalidationPaths(existing, updated));

    res.json(updated);
  })
);

router.post(
  '/:slug/view',
  asyncHandler(async (req, res) => {
    const parsed = propertyViewSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Visitante inválido.');
    }

    const property = await prisma.property.findFirst({
      where: { slug: String(req.params.slug), approved: true },
      select: { id: true, viewCount: true }
    });

    if (!property) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.propertyView.create({
          data: {
            propertyId: property.id,
            visitorKey: parsed.data.visitorKey
          }
        });

        const updated = await tx.property.update({
          where: { id: property.id },
          data: { viewCount: { increment: 1 } },
          select: { viewCount: true }
        });

        return { unique: true, viewCount: updated.viewCount };
      });

      try {
        const analyticsDate = getAnalyticsDay();

        if (!isValidAnalyticsDate(analyticsDate)) {
          console.error('[analytics:property-view] invalid analytics date; analytics skipped', {
            propertyId: property.id,
            slug: String(req.params.slug),
            visitorKey: parsed.data.visitorKey,
            analyticsDate: String(analyticsDate)
          });
        } else {
          await prisma.$transaction(async (tx) => {
            const analyticsVisitor = await tx.propertyAnalyticsVisitorDay.findUnique({
              where: {
                propertyId_visitorKey_date: {
                  propertyId: property.id,
                  visitorKey: parsed.data.visitorKey,
                  date: analyticsDate
                }
              }
            });

            if (!analyticsVisitor) {
              await tx.propertyAnalyticsVisitorDay.create({
                data: {
                  propertyId: property.id,
                  visitorKey: parsed.data.visitorKey,
                  date: analyticsDate
                }
              });

              await tx.propertyAnalyticsDaily.upsert({
                where: { propertyId_date: { propertyId: property.id, date: analyticsDate } },
                create: {
                  propertyId: property.id,
                  date: analyticsDate,
                  propertyViews: 1,
                  lastViewedAt: new Date()
                },
                update: {
                  propertyViews: { increment: 1 },
                  lastViewedAt: new Date()
                }
              });
            }
          });
        }
      } catch (analyticsError) {
        console.error('[analytics:property-view] analytics failed but main operation will continue', {
          propertyId: property.id,
          slug: String(req.params.slug),
          visitorKey: parsed.data.visitorKey,
          error: analyticsError
        });
      }

      res.status(201).json(result);
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const current = await prisma.property.findUnique({
          where: { id: property.id },
          select: { viewCount: true }
        });

        res.json({ unique: false, viewCount: current?.viewCount ?? property.viewCount });
        return;
      }

      throw error;
    }
  })
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const slug = String(req.params.slug);

    try {
      const item = await prisma.property.findFirst({
        where: { slug, approved: true },
        include: { images: { orderBy: { sortOrder: 'asc' } } }
      });

      if (!item) {
        throw new AppError(404, 'Imóvel não encontrado.');
      }

      const sameCity = await prisma.property.findMany({
        where: {
          id: { not: item.id },
          city: item.city,
          approved: true
        },
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        take: 18,
        orderBy: [{ featured: 'desc' }, { launch: 'desc' }, { createdAt: 'desc' }]
      });

      const related = sameCity
        .sort((a, b) => {
          const score = (entry: typeof a) => {
            let total = 0;
            if (entry.district === item.district) total += 6;
            if (entry.type === item.type) total += 4;
            if (entry.category === item.category) total += 3;
            if (entry.featured) total += 2;
            if (entry.launch || entry.status === PropertyStatus.LAUNCH) total += 1;
            return total;
          };

          return score(b) - score(a);
        })
        .slice(0, 3);

      if (related.length < 3) {
        const existingIds = new Set([item.id, ...related.map((entry) => entry.id)]);
        const launches = await prisma.property.findMany({
          where: {
            id: { notIn: Array.from(existingIds) },
            approved: true,
            OR: [{ launch: true }, { status: PropertyStatus.LAUNCH }]
          },
          include: { images: { orderBy: { sortOrder: 'asc' } } },
          take: 3 - related.length,
          orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }]
        });

        related.push(...launches);
      }

      const payload = { ...item, related: related.slice(0, 3) };
      propertyBySlugCache.set(item.slug, payload);
      res.json(payload);
      return;
    } catch (error) {
      const cached = propertyBySlugCache.get(slug) || null;
      if (cached) {
        console.warn('[properties:slug] cached payload returned after query failure', error);
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
    const parsed = propertySchema.safeParse(req.body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      throw new AppError(400, String(firstError), parsed.error.flatten());
    }

    const data = await normalizePropertyInput(parsed.data, parsed.data.propertyCode || undefined);
    const created = await prisma.property.create({
      data: {
        ...data,
        reviewStatus: data.approved ? PropertyReviewStatus.APPROVED : PropertyReviewStatus.PENDING,
        images: {
          create: data.images.map((image, index) => ({ ...image, sortOrder: index }))
        }
      },
      include: { images: true }
    });

    upsertCachedProperty(created);

    if (created.approved) {
      void notifyIndexNowPath(getPropertyPublicPath(created));
    }

    void revalidateSitePaths(buildPropertyRevalidationPaths(created));

    res.status(201).json(created);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = propertySchema.safeParse(req.body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      throw new AppError(400, String(firstError), parsed.error.flatten());
    }

    const existing = await prisma.property.findUnique({ where: { id: String(req.params.id) } });

    if (!existing) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    const codeToUse = parsed.data.propertyCode || existing.propertyCode;
    const data = await normalizePropertyInput(parsed.data, codeToUse);
    const updated = await prisma.property.update({
      where: { id: String(req.params.id) },
      data: {
        ...data,
        reviewStatus: data.approved ? PropertyReviewStatus.APPROVED : PropertyReviewStatus.PENDING,
        images: {
          deleteMany: {},
          create: data.images.map((image, index) => ({ ...image, sortOrder: index }))
        }
      },
      include: { images: true }
    });

    upsertCachedProperty(updated);

    if (updated.approved) {
      void notifyIndexNowPath(getPropertyPublicPath(updated));
    }

    void revalidateSitePaths(buildPropertyRevalidationPaths(existing, updated));

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const existing = await prisma.property.findUnique({ where: { id: String(req.params.id) } });

    if (!existing) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    await prisma.property.delete({ where: { id: existing.id } });
    removeCachedProperty(existing.id, existing.slug);
    void revalidateSitePaths(buildPropertyRevalidationPaths(existing));
    res.status(204).send();
  })
);

export default router;
