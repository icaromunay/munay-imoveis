import { LeadStatus } from '@prisma/client';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

const router = Router();

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { message: 'Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.' },
  standardHeaders: true,
  legacyHeaders: false
});

const publicSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal('')),
  message: z.string().trim().max(1200).optional(),
  source: z.string().trim().optional(),
  pageOrigin: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  propertyCode: z.string().trim().optional(),
  propertyTitle: z.string().trim().optional(),
  propertyCity: z.string().trim().optional(),
  interest: z.string().trim().optional(),
  consent: z.boolean().default(true),
  website: z.string().trim().optional()
});

const nullableDateSchema = z.preprocess((value) => {
  if (value === '' || value === undefined) return undefined;
  if (value === null) return null;
  return value;
}, z.coerce.date().nullable().optional());

const adminSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  assignedTo: z.string().trim().optional().nullable(),
  internalNote: z.string().trim().max(5000).optional().nullable(),
  nextContactAt: nullableDateSchema
});

router.post(
  '/',
  leadLimiter,
  asyncHandler(async (req, res) => {
    const parsed = publicSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    if (parsed.data.website) {
      throw new AppError(400, 'Lead rejeitado por validação anti-spam.');
    }

    const property = parsed.data.propertyId
      ? await prisma.property.findUnique({ where: { id: parsed.data.propertyId } })
      : null;

    const created = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message || null,
        source: parsed.data.source || 'site',
        pageOrigin: parsed.data.pageOrigin || null,
        propertyId: property?.id || parsed.data.propertyId || null,
        propertyCode: parsed.data.propertyCode || property?.propertyCode || null,
        propertyTitle: parsed.data.propertyTitle || property?.title || null,
        propertyCity: parsed.data.propertyCity || (property ? `${property.city} - ${property.state}` : null),
        interest: parsed.data.interest || property?.title || null,
        consent: parsed.data.consent
      },
      include: { property: true }
    });

    res.status(201).json(created);
  })
);

router.get(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const items = await prisma.lead.findMany({
      include: { property: true },
      orderBy: [{ nextContactAt: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(items);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = adminSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos.', parsed.error.flatten());
    }

    const data: {
      status?: LeadStatus;
      assignedTo?: string | null;
      internalNote?: string | null;
      nextContactAt?: Date | null;
    } = {};

    if ('status' in parsed.data) data.status = parsed.data.status;
    if ('assignedTo' in parsed.data) data.assignedTo = parsed.data.assignedTo ?? null;
    if ('internalNote' in parsed.data) data.internalNote = parsed.data.internalNote ?? null;
    if ('nextContactAt' in parsed.data) data.nextContactAt = parsed.data.nextContactAt ?? null;

    const updated = await prisma.lead.update({
      where: { id: String(req.params.id) },
      data,
      include: { property: true }
    });

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

export default router;
