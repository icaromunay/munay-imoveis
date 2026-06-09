import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { revalidateSitePaths } from '../utils/revalidate-site.js';
import {
  THEME_BLOCKS,
  buildPresetsFromSettings,
  generateUniqueThemeLayoutSlug,
  getActiveThemeLayoutWithBlocks,
  getThemeLayoutRevalidationPaths,
  getThemeLayoutsWithBlocks,
  normalizeBlocks,
  serializeThemeLayout,
  validateThemeBlocks
} from '../utils/theme-layouts.js';

const router = Router();

const blockSettingsSchema = z.object({
  background: z.string().trim().min(3),
  surface: z.string().trim().min(3),
  textPrimary: z.string().trim().min(3),
  textSecondary: z.string().trim().min(3),
  borderColor: z.string().trim().min(3),
  accent: z.string().trim().min(3),
  buttonPrimary: z.string().trim().min(3),
  buttonSecondary: z.string().trim().min(3),
  shadow: z.enum(['none', 'soft', 'medium', 'strong', 'glow']),
  radius: z.enum(['md', 'lg', 'xl', '2xl', 'pill']),
  hoverEffect: z.enum(['none', 'lift', 'glow', 'underline', 'scale']),
  height: z.enum(['compact', 'comfortable', 'tall'])
});

const blockInputSchema = z.object({
  blockKey: z.string().trim().min(2),
  blockName: z.string().trim().min(2),
  sortOrder: z.coerce.number().int().min(0).optional(),
  settingsJson: blockSettingsSchema
});

const layoutInputSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(400).optional().nullable().default(''),
  blocks: z.array(blockInputSchema).min(THEME_BLOCKS.length).max(THEME_BLOCKS.length)
});

async function ensureSettingsRecord(tx: Prisma.TransactionClient | typeof prisma) {
  const existing = await tx.siteSetting.findFirst();
  if (existing) return existing;
  return tx.siteSetting.create({ data: {} });
}

async function revalidateLayouts(context: string) {
  const result = await revalidateSitePaths(getThemeLayoutRevalidationPaths());
  console.info(`[theme:revalidate] context=${context} ok=${result.ok} reason=${result.reason || 'none'} attempts=${result.attempts}`);
}

function getThemeIdParam(rawId: string | string[] | undefined) {
  if (Array.isArray(rawId)) return rawId[0] || '';
  return rawId || '';
}

function assertThemeId(rawId: string | string[] | undefined) {
  const themeId = getThemeIdParam(rawId);
  if (!themeId) {
    throw new AppError(400, 'Identificador do layout não informado.');
  }
  return themeId;
}

function assertLayoutIsValidForActivation(
  blocks: Array<{ blockKey: string; blockName: string; settingsJson: Prisma.JsonValue }>
) {
  const audit = validateThemeBlocks(blocks);
  if (audit.issues.length) {
    throw new AppError(400, 'O layout não pode ser ativado porque falhou na validação de contraste.', {
      issues: audit.issues,
      warnings: audit.warnings
    });
  }
}

async function activateThemeLayout(themeId: string, action: 'ACTIVATE' | 'RESTORE_PREVIOUS' | 'RESTORE_HISTORY' = 'ACTIVATE') {
  console.info(`[theme:activate:start] id=${themeId} action=${action}`);
  const existing = await prisma.themeLayout.findUnique({ where: { id: themeId }, include: { blocks: true } });

  if (!existing) {
    throw new AppError(404, 'Layout não encontrado para ativação.');
  }

  assertLayoutIsValidForActivation(existing.blocks);

  const result = await prisma.$transaction(async (tx) => {
    const settings = await ensureSettingsRecord(tx);
    const currentActive = await tx.themeLayout.findFirst({ where: { isActive: true } });
    console.info(`[theme:activate:db] from=${currentActive?.slug || 'none'} to=${existing.slug}`);

    await tx.themeLayout.updateMany({ data: { isActive: false } });
    const activated = await tx.themeLayout.update({
      where: { id: existing.id },
      data: { isActive: true },
      include: { blocks: true }
    });

    await tx.siteSetting.update({
      where: { id: settings.id },
      data: {
        activeThemeLayoutId: activated.id,
        previousThemeLayoutId: currentActive?.id || activated.id
      }
    });

    await tx.themeLayoutActivationHistory.create({
      data: {
        themeLayoutId: activated.id,
        layoutNameSnapshot: activated.name,
        action
      }
    });

    return serializeThemeLayout(activated);
  });

  console.info(`[theme:activate:done] slug=${result.slug} action=${action}`);
  await revalidateLayouts(`activate:${result.slug}`);
  return result;
}

router.get(
  '/active',
  asyncHandler(async (_req, res) => {
    const active = await getActiveThemeLayoutWithBlocks();
    console.info(`[theme:load] active=${active?.slug || 'none'} blocks=${active?.blocks?.length || 0}`);
    res.json(active);
  })
);

router.get(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const layouts = await getThemeLayoutsWithBlocks();
    res.json(layouts);
  })
);

router.get(
  '/catalog',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const settings = await ensureSettingsRecord(prisma);
    const presets = buildPresetsFromSettings(settings.primaryColor, settings.secondaryColor, settings.accentColor).map((preset) => ({
      name: preset.name,
      slug: preset.slug,
      description: preset.description,
      category: preset.slug.startsWith('layout-') ? 'layout' : 'identity'
    }));

    res.json({
      layouts: presets.filter((preset) => preset.category === 'layout'),
      identities: presets.filter((preset) => preset.category === 'identity')
    });
  })
);

router.get(
  '/history',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const history = await prisma.themeLayoutActivationHistory.findMany({
      include: {
        themeLayout: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            isDefault: true
          }
        }
      },
      orderBy: { activatedAt: 'desc' }
    });

    res.json(
      history.map((entry) => ({
        id: entry.id,
        themeLayoutId: entry.themeLayoutId,
        layoutNameSnapshot: entry.layoutNameSnapshot,
        action: entry.action,
        activatedAt: entry.activatedAt,
        createdAt: entry.createdAt,
        themeLayout: entry.themeLayout
      }))
    );
  })
);

router.post(
  '/restore-previous',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    const settings = await ensureSettingsRecord(prisma);
    const targetId = settings.previousThemeLayoutId || settings.activeThemeLayoutId;

    if (!targetId) {
      throw new AppError(404, 'Nenhum layout anterior foi encontrado para restauração.');
    }

    const restored = await activateThemeLayout(targetId, 'RESTORE_PREVIOUS');
    res.json(restored);
  })
);

router.post(
  '/history/:id/restore',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const historyId = assertThemeId(req.params.id);
    const historyEntry = await prisma.themeLayoutActivationHistory.findUnique({ where: { id: historyId } });

    if (!historyEntry) {
      throw new AppError(404, 'Registro de histórico não encontrado.');
    }

    const restored = await activateThemeLayout(historyEntry.themeLayoutId, 'RESTORE_HISTORY');
    res.json(restored);
  })
);

router.post(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = layoutInputSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos para criar layout.', parsed.error.flatten());
    }

    const blocks = normalizeBlocks(parsed.data.blocks);
    const audit = validateThemeBlocks(blocks as Array<{ blockKey: string; blockName: string; settingsJson: Prisma.JsonValue }>);

    if (audit.issues.length) {
      throw new AppError(400, 'O layout possui problemas de contraste ou blocos incompletos.', {
        issues: audit.issues,
        warnings: audit.warnings
      });
    }

    const slug = await generateUniqueThemeLayoutSlug(parsed.data.name);
    const created = await prisma.themeLayout.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description || '',
        isActive: false,
        isDefault: false,
        blocks: {
          create: blocks.map((block) => ({
            blockKey: block.blockKey,
            blockName: block.blockName,
            sortOrder: block.sortOrder,
            settingsJson: block.settingsJson as Prisma.InputJsonValue
          }))
        }
      },
      include: { blocks: true }
    });

    res.status(201).json(serializeThemeLayout(created));
  })
);

router.post(
  '/:id/duplicate',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const themeId = assertThemeId(req.params.id);
    const existing = await prisma.themeLayout.findUnique({ where: { id: themeId }, include: { blocks: true } });

    if (!existing) {
      throw new AppError(404, 'Layout não encontrado para duplicação.');
    }

    const duplicateName = `${existing.name} Cópia`;
    const slug = await generateUniqueThemeLayoutSlug(duplicateName);
    const created = await prisma.themeLayout.create({
      data: {
        name: duplicateName,
        slug,
        description: existing.description,
        isActive: false,
        isDefault: false,
        blocks: {
          create: existing.blocks.map((block) => ({
            blockKey: block.blockKey,
            blockName: block.blockName,
            sortOrder: block.sortOrder,
            settingsJson: block.settingsJson as Prisma.InputJsonValue
          }))
        }
      },
      include: { blocks: true }
    });

    res.status(201).json(serializeThemeLayout(created));
  })
);

router.post(
  '/:id/activate',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const themeId = assertThemeId(req.params.id);
    const activated = await activateThemeLayout(themeId, 'ACTIVATE');
    console.info(`[theme:activate:response] slug=${activated.slug} active=${activated.isActive}`);
    res.json(activated);
  })
);

router.put(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const themeId = assertThemeId(req.params.id);
    const existing = await prisma.themeLayout.findUnique({ where: { id: themeId }, include: { blocks: true } });

    if (!existing) {
      throw new AppError(404, 'Layout não encontrado para edição.');
    }

    const parsed = layoutInputSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'Dados inválidos para salvar layout.', parsed.error.flatten());
    }

    const blocks = normalizeBlocks(parsed.data.blocks);
    const audit = validateThemeBlocks(blocks as Array<{ blockKey: string; blockName: string; settingsJson: Prisma.JsonValue }>);
    if (audit.issues.length) {
      throw new AppError(400, 'O layout possui problemas de contraste ou blocos incompletos.', {
        issues: audit.issues,
        warnings: audit.warnings
      });
    }

    const slug = await generateUniqueThemeLayoutSlug(parsed.data.name, themeId);
    const existingBlocksByKey = new Map(existing.blocks.map((block) => [block.blockKey, block]));

    console.info(`[theme:save:start] id=${themeId} name=${parsed.data.name} active=${existing.isActive}`);

    const updated = await prisma.$transaction(async (tx) => {
      const layout = await tx.themeLayout.update({
        where: { id: themeId },
        data: {
          name: parsed.data.name,
          slug,
          description: parsed.data.description || ''
        }
      });

      for (const block of blocks) {
        const currentBlock = existingBlocksByKey.get(block.blockKey);

        if (currentBlock) {
          await tx.themeLayoutBlock.update({
            where: { id: currentBlock.id },
            data: {
              blockName: block.blockName,
              sortOrder: block.sortOrder,
              settingsJson: block.settingsJson as Prisma.InputJsonValue
            }
          });
        } else {
          await tx.themeLayoutBlock.create({
            data: {
              themeLayoutId: themeId,
              blockKey: block.blockKey,
              blockName: block.blockName,
              sortOrder: block.sortOrder,
              settingsJson: block.settingsJson as Prisma.InputJsonValue
            }
          });
        }
      }

      const refreshed = await tx.themeLayout.findUnique({ where: { id: layout.id }, include: { blocks: true } });
      if (!refreshed) {
        throw new AppError(404, 'Layout salvo, mas não foi possível recarregá-lo.');
      }

      return serializeThemeLayout(refreshed);
    });

    console.info(`[theme:save:done] slug=${updated.slug} active=${updated.isActive}`);

    if (updated.isActive) {
      await revalidateLayouts(`save:${updated.slug}`);
    }

    res.json(updated);
  })
);

router.delete(
  '/:id',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const themeId = assertThemeId(req.params.id);
    const existing = await prisma.themeLayout.findUnique({ where: { id: themeId } });

    if (!existing) {
      throw new AppError(404, 'Layout não encontrado para exclusão.');
    }

    if (existing.isDefault || existing.slug === 'layout-escuro') {
      throw new AppError(400, 'O Layout Escuro padrão não pode ser excluído.');
    }

    if (existing.isActive) {
      throw new AppError(400, 'Desative o layout antes de excluí-lo.');
    }

    await prisma.themeLayout.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
