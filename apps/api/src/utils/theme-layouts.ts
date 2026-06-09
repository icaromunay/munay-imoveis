import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { makeSlug } from './slug.js';

export const THEME_BLOCKS = [
  { key: 'header', name: 'Header / topo' },
  { key: 'hero-home', name: 'Hero da home' },
  { key: 'search-bar', name: 'Barra de busca' },
  { key: 'property-cards', name: 'Cards de imóveis' },
  { key: 'highlights', name: 'Seção de destaques' },
  { key: 'launches', name: 'Seção de lançamentos' },
  { key: 'property-page', name: 'Página interna do imóvel' },
  { key: 'technical-sheet', name: 'Ficha técnica' },
  { key: 'cta-buttons', name: 'Botões / CTA' },
  { key: 'footer', name: 'Rodapé' },
  { key: 'blog', name: 'Blog' },
  { key: 'institutional-pages', name: 'Páginas institucionais' }
] as const;

export type ThemeBlockKey = (typeof THEME_BLOCKS)[number]['key'];

export type ThemeBlockSettings = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  accent: string;
  buttonPrimary: string;
  buttonSecondary: string;
  shadow: 'none' | 'soft' | 'medium' | 'strong' | 'glow';
  radius: 'md' | 'lg' | 'xl' | '2xl' | 'pill';
  hoverEffect: 'none' | 'lift' | 'glow' | 'underline' | 'scale';
  height: 'compact' | 'comfortable' | 'tall';
};

type ThemePalette = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceStrong: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentSoft: string;
  buttonPrimary: string;
  buttonSecondary: string;
  footerBackground: string;
  heroBackground: string;
  blogBackground: string;
};

type ThemePreset = {
  name: string;
  slug: string;
  description: string;
  isDefault?: boolean;
  palette: ThemePalette;
};

const DEFAULT_BLOCK_SETTINGS: ThemeBlockSettings = {
  background: '#08110d',
  surface: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
  textPrimary: '#f7f3ea',
  textSecondary: '#c7cfc9',
  borderColor: 'rgba(255,255,255,0.10)',
  accent: '#d4af72',
  buttonPrimary: '#d4af72',
  buttonSecondary: '#ffffff',
  shadow: 'soft',
  radius: 'xl',
  hoverEffect: 'lift',
  height: 'comfortable'
};

const DEFAULT_REVALIDATION_PATHS = [
  '/',
  '/imoveis',
  '/casas',
  '/terrenos',
  '/lancamentos',
  '/empreendimentos',
  '/blog',
  '/sobre',
  '/contato',
  '/vender-seu-imovel',
  '/cadastro-proprietario',
  '/area-do-proprietario'
];

function sanitizeHex(value: string, fallback: string) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  return normalized;
}

function makeSettings(overrides: Partial<ThemeBlockSettings>): ThemeBlockSettings {
  return {
    ...DEFAULT_BLOCK_SETTINGS,
    ...overrides,
    background: sanitizeHex(overrides.background ?? DEFAULT_BLOCK_SETTINGS.background, DEFAULT_BLOCK_SETTINGS.background),
    surface: String(overrides.surface ?? DEFAULT_BLOCK_SETTINGS.surface),
    textPrimary: sanitizeHex(overrides.textPrimary ?? DEFAULT_BLOCK_SETTINGS.textPrimary, DEFAULT_BLOCK_SETTINGS.textPrimary),
    textSecondary: sanitizeHex(overrides.textSecondary ?? DEFAULT_BLOCK_SETTINGS.textSecondary, DEFAULT_BLOCK_SETTINGS.textSecondary),
    borderColor: String(overrides.borderColor ?? DEFAULT_BLOCK_SETTINGS.borderColor),
    accent: sanitizeHex(overrides.accent ?? DEFAULT_BLOCK_SETTINGS.accent, DEFAULT_BLOCK_SETTINGS.accent),
    buttonPrimary: sanitizeHex(overrides.buttonPrimary ?? DEFAULT_BLOCK_SETTINGS.buttonPrimary, DEFAULT_BLOCK_SETTINGS.buttonPrimary),
    buttonSecondary: sanitizeHex(overrides.buttonSecondary ?? DEFAULT_BLOCK_SETTINGS.buttonSecondary, DEFAULT_BLOCK_SETTINGS.buttonSecondary)
  };
}

export function buildBlocksFromPalette(palette: ThemePalette) {
  const blockMap: Record<ThemeBlockKey, ThemeBlockSettings> = {
    header: makeSettings({
      background: palette.background,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'medium',
      radius: 'pill',
      hoverEffect: 'underline',
      height: 'comfortable'
    }),
    'hero-home': makeSettings({
      background: palette.heroBackground,
      surface: `radial-gradient(circle at top, ${palette.accentSoft}, transparent 32%), linear-gradient(180deg, ${palette.backgroundAlt} 0%, ${palette.background} 100%)`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'glow',
      radius: '2xl',
      hoverEffect: 'lift',
      height: 'tall'
    }),
    'search-bar': makeSettings({
      background: palette.backgroundAlt,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: '2xl',
      hoverEffect: 'glow',
      height: 'comfortable'
    }),
    'property-cards': makeSettings({
      background: palette.backgroundAlt,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: '2xl',
      hoverEffect: 'lift',
      height: 'comfortable'
    }),
    highlights: makeSettings({
      background: palette.background,
      surface: palette.surface,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'none',
      radius: 'xl',
      hoverEffect: 'underline',
      height: 'comfortable'
    }),
    launches: makeSettings({
      background: palette.backgroundAlt,
      surface: palette.surface,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'none',
      radius: 'xl',
      hoverEffect: 'underline',
      height: 'comfortable'
    }),
    'property-page': makeSettings({
      background: palette.background,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'medium',
      radius: '2xl',
      hoverEffect: 'none',
      height: 'comfortable'
    }),
    'technical-sheet': makeSettings({
      background: palette.backgroundAlt,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: 'xl',
      hoverEffect: 'glow',
      height: 'comfortable'
    }),
    'cta-buttons': makeSettings({
      background: palette.background,
      surface: palette.surface,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: 'pill',
      hoverEffect: 'scale',
      height: 'comfortable'
    }),
    footer: makeSettings({
      background: palette.footerBackground,
      surface: `linear-gradient(180deg, ${palette.footerBackground}, ${palette.background})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'none',
      radius: 'xl',
      hoverEffect: 'underline',
      height: 'comfortable'
    }),
    blog: makeSettings({
      background: palette.blogBackground,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: '2xl',
      hoverEffect: 'lift',
      height: 'comfortable'
    }),
    'institutional-pages': makeSettings({
      background: palette.background,
      surface: `linear-gradient(180deg, ${palette.surfaceStrong}, ${palette.surface})`,
      textPrimary: palette.textPrimary,
      textSecondary: palette.textSecondary,
      borderColor: palette.border,
      accent: palette.accent,
      buttonPrimary: palette.buttonPrimary,
      buttonSecondary: palette.buttonSecondary,
      shadow: 'soft',
      radius: '2xl',
      hoverEffect: 'lift',
      height: 'comfortable'
    })
  };

  return THEME_BLOCKS.map((block, index) => ({
    blockKey: block.key,
    blockName: block.name,
    sortOrder: index,
    settingsJson: blockMap[block.key]
  }));
}

export function buildPresetsFromSettings(primaryColor: string, secondaryColor: string, accentColor: string): ThemePreset[] {
  return [
    {
      name: 'Layout Escuro',
      slug: 'layout-escuro',
      description: 'Modelo inicial salvo automaticamente a partir do visual atual do portal.',
      isDefault: true,
      palette: {
        background: '#08110d',
        backgroundAlt: '#0b1712',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.09)',
        textPrimary: '#f7f3ea',
        textSecondary: '#c7cfc9',
        border: 'rgba(255,255,255,0.10)',
        accent: sanitizeHex(secondaryColor, '#d4af72'),
        accentSoft: 'rgba(212,175,114,0.16)',
        buttonPrimary: sanitizeHex(secondaryColor, '#d4af72'),
        buttonSecondary: sanitizeHex(accentColor, '#ffffff'),
        footerBackground: '#060d0a',
        heroBackground: '#09130f',
        blogBackground: '#08110d'
      }
    },
    {
      name: 'Layout Claro',
      slug: 'layout-claro',
      description: 'Base clara, sofisticada e mais clean para campanhas e autoridade institucional.',
      palette: {
        background: '#f6f1e8',
        backgroundAlt: '#ffffff',
        surface: 'rgba(255,255,255,0.78)',
        surfaceStrong: 'rgba(255,255,255,0.94)',
        textPrimary: '#17212b',
        textSecondary: '#5b6572',
        border: 'rgba(23,33,43,0.12)',
        accent: '#b8892c',
        accentSoft: 'rgba(184,137,44,0.18)',
        buttonPrimary: '#c5973f',
        buttonSecondary: '#17212b',
        footerBackground: '#ece3d5',
        heroBackground: '#fbf8f2',
        blogBackground: '#f4ede2'
      }
    },
    {
      name: 'Layout Luxo',
      slug: 'layout-luxo',
      description: 'Paleta sofisticada com contraste escuro e acentos quentes para imóveis premium.',
      palette: {
        background: '#120d0b',
        backgroundAlt: '#1b1310',
        surface: 'rgba(255,240,224,0.06)',
        surfaceStrong: 'rgba(255,240,224,0.12)',
        textPrimary: '#f8efe7',
        textSecondary: '#ccb7a5',
        border: 'rgba(240,210,180,0.15)',
        accent: '#d7a76a',
        accentSoft: 'rgba(215,167,106,0.20)',
        buttonPrimary: '#d7a76a',
        buttonSecondary: '#f8efe7',
        footerBackground: '#0e0907',
        heroBackground: '#1a120e',
        blogBackground: '#140f0d'
      }
    },
    {
      name: 'Layout Moderno',
      slug: 'layout-moderno',
      description: 'Interface contemporânea com tons grafite, luz azulada e aparência tecnológica.',
      palette: {
        background: '#07131f',
        backgroundAlt: '#0d1c2a',
        surface: 'rgba(255,255,255,0.04)',
        surfaceStrong: 'rgba(255,255,255,0.09)',
        textPrimary: '#eef6ff',
        textSecondary: '#a7c0d7',
        border: 'rgba(148,190,255,0.16)',
        accent: '#57b6ff',
        accentSoft: 'rgba(87,182,255,0.20)',
        buttonPrimary: '#57b6ff',
        buttonSecondary: '#eef6ff',
        footerBackground: '#06101a',
        heroBackground: '#081725',
        blogBackground: '#07131f'
      }
    },
    {
      name: 'Layout Premium Azul',
      slug: 'layout-premium-azul',
      description: 'Visual premium com azul profundo para reforçar confiança, tráfego e tecnologia.',
      palette: {
        background: '#0a1630',
        backgroundAlt: '#102046',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.10)',
        textPrimary: '#f1f6ff',
        textSecondary: '#c5d2ea',
        border: 'rgba(122,166,255,0.18)',
        accent: '#78a9ff',
        accentSoft: 'rgba(120,169,255,0.18)',
        buttonPrimary: '#78a9ff',
        buttonSecondary: '#f1f6ff',
        footerBackground: '#081125',
        heroBackground: '#102046',
        blogBackground: '#0b1733'
      }
    },
    {
      name: 'Layout Premium Dourado',
      slug: 'layout-premium-dourado',
      description: 'Tema de alto valor percebido com base escura e dourado intenso em ações-chave.',
      palette: {
        background: sanitizeHex(primaryColor, '#102a1f'),
        backgroundAlt: '#163528',
        surface: 'rgba(255,255,255,0.045)',
        surfaceStrong: 'rgba(255,255,255,0.10)',
        textPrimary: '#fff9ed',
        textSecondary: '#d7c9a3',
        border: 'rgba(212,175,114,0.18)',
        accent: '#d4af37',
        accentSoft: 'rgba(212,175,55,0.18)',
        buttonPrimary: '#d4af37',
        buttonSecondary: '#fff9ed',
        footerBackground: '#0b1712',
        heroBackground: '#11251c',
        blogBackground: '#102a1f'
      }
    },
    {
      name: 'Imobiliária Luxo',
      slug: 'imobiliaria-luxo',
      description: 'Preset rápido com assinatura sofisticada, contraste escuro e dourado suave.',
      palette: {
        background: '#140f0e',
        backgroundAlt: '#1c1412',
        surface: 'rgba(255,248,235,0.05)',
        surfaceStrong: 'rgba(255,248,235,0.11)',
        textPrimary: '#fff6ea',
        textSecondary: '#d8c0a6',
        border: 'rgba(229,191,140,0.16)',
        accent: '#ddb06b',
        accentSoft: 'rgba(221,176,107,0.18)',
        buttonPrimary: '#ddb06b',
        buttonSecondary: '#fff6ea',
        footerBackground: '#0f0a09',
        heroBackground: '#1b1311',
        blogBackground: '#171110'
      }
    },
    {
      name: 'Imobiliária Moderna',
      slug: 'imobiliaria-moderna',
      description: 'Preset rápido tecnológico com azul elétrico e grafite.',
      palette: {
        background: '#09131c',
        backgroundAlt: '#0f1f2d',
        surface: 'rgba(255,255,255,0.04)',
        surfaceStrong: 'rgba(255,255,255,0.09)',
        textPrimary: '#f2f8ff',
        textSecondary: '#b4c6d7',
        border: 'rgba(92,173,255,0.18)',
        accent: '#4fb3ff',
        accentSoft: 'rgba(79,179,255,0.18)',
        buttonPrimary: '#4fb3ff',
        buttonSecondary: '#f2f8ff',
        footerBackground: '#071019',
        heroBackground: '#0b1823',
        blogBackground: '#0a131d'
      }
    },
    {
      name: 'Imobiliária Minimalista',
      slug: 'imobiliaria-minimalista',
      description: 'Preset claro, limpo e elegante para marca que busca simplicidade premium.',
      palette: {
        background: '#f7f5f0',
        backgroundAlt: '#ffffff',
        surface: 'rgba(255,255,255,0.82)',
        surfaceStrong: 'rgba(255,255,255,0.96)',
        textPrimary: '#1b2430',
        textSecondary: '#67707a',
        border: 'rgba(27,36,48,0.10)',
        accent: '#7a8b9a',
        accentSoft: 'rgba(122,139,154,0.14)',
        buttonPrimary: '#1b2430',
        buttonSecondary: '#1b2430',
        footerBackground: '#ece8df',
        heroBackground: '#faf9f6',
        blogBackground: '#f4f1eb'
      }
    },
    {
      name: 'Imobiliária Premium',
      slug: 'imobiliaria-premium',
      description: 'Preset com percepção de alto valor, equilíbrio entre confiança e sofisticação.',
      palette: {
        background: '#102a1f',
        backgroundAlt: '#173729',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.10)',
        textPrimary: '#fcfbf6',
        textSecondary: '#d2d6c7',
        border: 'rgba(212,175,114,0.16)',
        accent: '#d4af72',
        accentSoft: 'rgba(212,175,114,0.18)',
        buttonPrimary: '#d4af72',
        buttonSecondary: '#fcfbf6',
        footerBackground: '#0b1712',
        heroBackground: '#11251c',
        blogBackground: '#102a1f'
      }
    },
    {
      name: 'Imobiliária Praia',
      slug: 'imobiliaria-praia',
      description: 'Preset com atmosfera litorânea, azul marinho, areia clara e frescor visual.',
      palette: {
        background: '#0d2a38',
        backgroundAlt: '#154356',
        surface: 'rgba(255,255,255,0.06)',
        surfaceStrong: 'rgba(255,255,255,0.12)',
        textPrimary: '#f7fbff',
        textSecondary: '#c8dde7',
        border: 'rgba(137,205,222,0.18)',
        accent: '#63d1d7',
        accentSoft: 'rgba(99,209,215,0.20)',
        buttonPrimary: '#63d1d7',
        buttonSecondary: '#f7fbff',
        footerBackground: '#0a1d27',
        heroBackground: '#114055',
        blogBackground: '#0f3243'
      }
    },
    {
      name: 'Imobiliária Rural',
      slug: 'imobiliaria-rural',
      description: 'Preset com identidade de campo, verde profundo e tons terrosos.',
      palette: {
        background: '#162216',
        backgroundAlt: '#203125',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.10)',
        textPrimary: '#f5f6ed',
        textSecondary: '#c8d0bb',
        border: 'rgba(162,188,120,0.18)',
        accent: '#a7c46a',
        accentSoft: 'rgba(167,196,106,0.20)',
        buttonPrimary: '#a7c46a',
        buttonSecondary: '#f5f6ed',
        footerBackground: '#101710',
        heroBackground: '#1f2d20',
        blogBackground: '#182518'
      }
    },
    {
      name: 'Imobiliária Corporativa',
      slug: 'imobiliaria-corporativa',
      description: 'Preset institucional sóbrio, orientado a confiança e performance comercial.',
      palette: {
        background: '#131c28',
        backgroundAlt: '#1d2936',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.10)',
        textPrimary: '#f5f7fb',
        textSecondary: '#c2ccd7',
        border: 'rgba(126,149,179,0.18)',
        accent: '#6fa7d8',
        accentSoft: 'rgba(111,167,216,0.18)',
        buttonPrimary: '#6fa7d8',
        buttonSecondary: '#f5f7fb',
        footerBackground: '#0d141d',
        heroBackground: '#1a2430',
        blogBackground: '#141d28'
      }
    }
  ];
}

function parseHexColor(input: string) {
  const raw = String(input || '').trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(raw)) return null;
  const value = raw.toLowerCase();
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function relativeLuminance(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function contrastRatio(background: string, foreground: string) {
  const bg = parseHexColor(background);
  const fg = parseHexColor(foreground);
  if (!bg || !fg) return null;
  const l1 = 0.2126 * relativeLuminance(bg.r) + 0.7152 * relativeLuminance(bg.g) + 0.0722 * relativeLuminance(bg.b);
  const l2 = 0.2126 * relativeLuminance(fg.r) + 0.7152 * relativeLuminance(fg.g) + 0.0722 * relativeLuminance(fg.b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

export function validateThemeBlocks(blocks: Array<{ blockKey: string; blockName: string; settingsJson: Prisma.JsonValue }>) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const requiredKeys = new Set(THEME_BLOCKS.map((block) => block.key));
  const presentKeys = new Set<string>();

  blocks.forEach((block) => {
    presentKeys.add(block.blockKey);
    const settings = (block.settingsJson || {}) as Partial<ThemeBlockSettings>;
    const bg = String(settings.background || '');
    const primary = String(settings.textPrimary || '');
    const secondary = String(settings.textSecondary || '');

    if (!bg || !primary || !secondary) {
      issues.push(`O bloco ${block.blockName} está incompleto.`);
      return;
    }

    const primaryContrast = contrastRatio(bg, primary);
    const secondaryContrast = contrastRatio(bg, secondary);

    if (primaryContrast !== null && primaryContrast < 4.5) {
      issues.push(`Contraste insuficiente no bloco ${block.blockName} para texto principal (${primaryContrast}:1).`);
    }

    if (secondaryContrast !== null && secondaryContrast < 3.2) {
      warnings.push(`Contraste baixo no bloco ${block.blockName} para texto secundário (${secondaryContrast}:1).`);
    }
  });

  requiredKeys.forEach((key) => {
    if (!presentKeys.has(key)) {
      issues.push(`O bloco obrigatório ${key} não foi informado.`);
    }
  });

  return { issues, warnings };
}

export function normalizeBlocks(
  blocks: Array<{ blockKey: string; blockName: string; sortOrder?: number; settingsJson: ThemeBlockSettings }>
) {
  const providedMap = new Map(blocks.map((block) => [block.blockKey, block]));

  return THEME_BLOCKS.map((block, index) => {
    const existing = providedMap.get(block.key);
    return {
      blockKey: block.key,
      blockName: block.name,
      sortOrder: existing?.sortOrder ?? index,
      settingsJson: makeSettings(existing?.settingsJson || {})
    };
  });
}

export function serializeThemeLayout(layout: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  blocks: Array<{ id: string; blockKey: string; blockName: string; settingsJson: Prisma.JsonValue; sortOrder: number; createdAt: Date; updatedAt: Date }>;
}) {
  const orderedBlocks = [...layout.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
  const audit = validateThemeBlocks(orderedBlocks);

  return {
    ...layout,
    blocks: orderedBlocks,
    blockMap: Object.fromEntries(orderedBlocks.map((block) => [block.blockKey, block.settingsJson])),
    warnings: audit.warnings,
    contrastOk: audit.issues.length === 0
  };
}

async function ensureSettingsRecord(tx: Prisma.TransactionClient | typeof prisma) {
  const existing = await tx.siteSetting.findFirst();
  if (existing) return existing;
  return tx.siteSetting.create({ data: {} });
}

export async function generateUniqueThemeLayoutSlug(baseName: string, excludeId?: string) {
  const baseSlug = makeSlug(baseName) || 'layout-visual';
  let attempt = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.themeLayout.findFirst({
      where: {
        slug: attempt,
        ...(excludeId ? { NOT: { id: excludeId } } : {})
      }
    });

    if (!existing) return attempt;
    attempt = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function ensureThemeLayoutsSeeded() {
  const settings = await ensureSettingsRecord(prisma);
  const presets = buildPresetsFromSettings(settings.primaryColor, settings.secondaryColor, settings.accentColor);
  const existingLayouts = await prisma.themeLayout.findMany({
    select: { id: true, slug: true, name: true, isActive: true, isDefault: true, createdAt: true }
  });

  const existingBySlug = new Map(existingLayouts.map((layout) => [layout.slug, layout]));
  let activeId = existingLayouts.find((layout) => layout.isActive)?.id || null;

  for (const preset of presets) {
    const existing = existingBySlug.get(preset.slug);

    if (!existing) {
      const created = await prisma.themeLayout.create({
        data: {
          name: preset.name,
          slug: preset.slug,
          description: preset.description,
          isActive: !activeId && Boolean(preset.isDefault),
          isDefault: Boolean(preset.isDefault),
          blocks: {
            create: buildBlocksFromPalette(preset.palette)
          }
        }
      });

      existingBySlug.set(created.slug, created);
      if (created.isActive) {
        activeId = created.id;
      }
      continue;
    }

    if (preset.isDefault && !existing.isDefault) {
      await prisma.themeLayout.update({
        where: { id: existing.id },
        data: { isDefault: true }
      });
    }
  }

  let fallbackLayout =
    (await prisma.themeLayout.findFirst({ where: { slug: 'layout-escuro' } })) ||
    (await prisma.themeLayout.findFirst({ where: { isDefault: true } })) ||
    (await prisma.themeLayout.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!fallbackLayout) {
    const defaultPreset = presets.find((preset) => preset.slug === 'layout-escuro') || presets[0];
    fallbackLayout = await prisma.themeLayout.create({
      data: {
        name: defaultPreset.name,
        slug: defaultPreset.slug,
        description: defaultPreset.description,
        isDefault: true,
        isActive: !activeId,
        blocks: {
          create: buildBlocksFromPalette(defaultPreset.palette)
        }
      }
    });

    if (fallbackLayout.isActive) {
      activeId = fallbackLayout.id;
    }
  }

  if (!fallbackLayout.isDefault) {
    fallbackLayout = await prisma.themeLayout.update({
      where: { id: fallbackLayout.id },
      data: { isDefault: true }
    });
  }

  if (!activeId) {
    await prisma.themeLayout.updateMany({ data: { isActive: false } });
    const activatedFallback = await prisma.themeLayout.update({
      where: { id: fallbackLayout.id },
      data: { isActive: true }
    });
    activeId = activatedFallback.id;
  }

  await prisma.siteSetting.update({
    where: { id: settings.id },
    data: {
      activeThemeLayoutId: activeId,
      previousThemeLayoutId: settings.previousThemeLayoutId || activeId || fallbackLayout.id
    }
  });

  const historyCount = await prisma.themeLayoutActivationHistory.count();
  if (historyCount === 0 && activeId) {
    const activeLayout = await prisma.themeLayout.findUnique({ where: { id: activeId } });
    if (activeLayout) {
      await prisma.themeLayoutActivationHistory.create({
        data: {
          themeLayoutId: activeId,
          layoutNameSnapshot: activeLayout.name,
          action: 'INITIAL_SEED'
        }
      });
    }
  }
}

export async function getThemeLayoutsWithBlocks() {
  await ensureThemeLayoutsSeeded();
  const layouts = await prisma.themeLayout.findMany({
    include: { blocks: true },
    orderBy: [{ isActive: 'desc' }, { isDefault: 'desc' }, { createdAt: 'asc' }]
  });

  return layouts.map(serializeThemeLayout);
}

export async function getActiveThemeLayoutWithBlocks() {
  await ensureThemeLayoutsSeeded();
  const active =
    (await prisma.themeLayout.findFirst({ where: { isActive: true }, include: { blocks: true } })) ||
    (await prisma.themeLayout.findFirst({ where: { isDefault: true }, include: { blocks: true } })) ||
    (await prisma.themeLayout.findFirst({ include: { blocks: true } }));

  return active ? serializeThemeLayout(active) : null;
}

export function getThemeLayoutRevalidationPaths() {
  return DEFAULT_REVALIDATION_PATHS;
}
