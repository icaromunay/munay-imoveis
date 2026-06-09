import { ThemeBlockSettings, ThemeLayout } from './types';

export const THEME_BLOCK_DEFINITIONS = [
  {
    key: 'header',
    name: 'Header / topo',
    fields: [
      ['background', 'Fundo do topo'],
      ['surface', 'Superfície / gradiente'],
      ['textPrimary', 'Texto principal'],
      ['textSecondary', 'Texto secundário'],
      ['buttonPrimary', 'Botão principal'],
      ['borderColor', 'Borda'],
      ['height', 'Altura'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'hero-home',
    name: 'Hero da home',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Gradiente'],
      ['textPrimary', 'Título'],
      ['textSecondary', 'Subtítulo'],
      ['buttonPrimary', 'Botão principal'],
      ['accent', 'Destaque'],
      ['shadow', 'Sombra'],
      ['height', 'Altura']
    ]
  },
  {
    key: 'search-bar',
    name: 'Barra de busca',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Superfície'],
      ['textPrimary', 'Texto'],
      ['borderColor', 'Borda'],
      ['shadow', 'Sombra'],
      ['buttonPrimary', 'Botão'],
      ['radius', 'Raio'],
      ['hoverEffect', 'Hover']
    ]
  },
  {
    key: 'property-cards',
    name: 'Cards de imóveis',
    fields: [
      ['background', 'Fundo do card'],
      ['surface', 'Superfície'],
      ['textPrimary', 'Título'],
      ['textSecondary', 'Texto de apoio'],
      ['accent', 'Preço / selos'],
      ['borderColor', 'Borda'],
      ['shadow', 'Sombra'],
      ['hoverEffect', 'Hover'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'highlights',
    name: 'Seção de destaques',
    fields: [
      ['background', 'Fundo'],
      ['textPrimary', 'Título'],
      ['textSecondary', 'Subtítulo'],
      ['accent', 'Selo'],
      ['buttonSecondary', 'Botão secundário'],
      ['borderColor', 'Linha divisória']
    ]
  },
  {
    key: 'launches',
    name: 'Seção de lançamentos',
    fields: [
      ['background', 'Fundo'],
      ['textPrimary', 'Título'],
      ['textSecondary', 'Subtítulo'],
      ['accent', 'Destaque'],
      ['buttonSecondary', 'Botão secundário'],
      ['borderColor', 'Linha divisória']
    ]
  },
  {
    key: 'property-page',
    name: 'Página interna do imóvel',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Painel principal'],
      ['textPrimary', 'Título'],
      ['textSecondary', 'Descrição'],
      ['accent', 'Selos'],
      ['borderColor', 'Borda'],
      ['shadow', 'Sombra'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'technical-sheet',
    name: 'Ficha técnica',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Painel'],
      ['textPrimary', 'Rótulos'],
      ['textSecondary', 'Valores'],
      ['accent', 'Ícones / destaque'],
      ['borderColor', 'Bordas'],
      ['shadow', 'Sombra'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'cta-buttons',
    name: 'Botões / CTA',
    fields: [
      ['buttonPrimary', 'Botão principal'],
      ['buttonSecondary', 'Botão secundário'],
      ['textPrimary', 'Texto'],
      ['borderColor', 'Borda'],
      ['shadow', 'Sombra'],
      ['hoverEffect', 'Hover'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'footer',
    name: 'Rodapé',
    fields: [
      ['background', 'Fundo'],
      ['textPrimary', 'Títulos'],
      ['textSecondary', 'Textos'],
      ['accent', 'Links / destaques'],
      ['borderColor', 'Bordas'],
      ['surface', 'Superfície']
    ]
  },
  {
    key: 'blog',
    name: 'Blog',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Cards'],
      ['textPrimary', 'Títulos'],
      ['textSecondary', 'Datas / resumo'],
      ['buttonPrimary', 'Botão'],
      ['borderColor', 'Bordas'],
      ['radius', 'Raio']
    ]
  },
  {
    key: 'institutional-pages',
    name: 'Páginas institucionais',
    fields: [
      ['background', 'Fundo'],
      ['surface', 'Painéis'],
      ['textPrimary', 'Títulos'],
      ['textSecondary', 'Texto'],
      ['buttonPrimary', 'Botão principal'],
      ['borderColor', 'Bordas'],
      ['shadow', 'Sombra'],
      ['radius', 'Raio']
    ]
  }
] as const;

export type ThemePresetCategory = 'layout' | 'identity';
export type QuickStyle = 'luxo' | 'moderno' | 'minimalista' | 'praia' | 'corporativo';

export type QuickCustomizationInput = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  style: QuickStyle;
  radius: ThemeBlockSettings['radius'];
  shadow: ThemeBlockSettings['shadow'];
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

export type ThemePresetDefinition = {
  name: string;
  slug: string;
  description: string;
  category: ThemePresetCategory;
  styleHint?: QuickStyle;
  palette: ThemePalette;
};

const FALLBACK_BLOCK: ThemeBlockSettings = {
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

const QUICK_STYLE_META: Record<QuickStyle, { label: string; light: boolean; shadow: ThemeBlockSettings['shadow']; hover: ThemeBlockSettings['hoverEffect'] }> = {
  luxo: { label: 'Luxo', light: false, shadow: 'medium', hover: 'lift' },
  moderno: { label: 'Moderno', light: false, shadow: 'glow', hover: 'glow' },
  minimalista: { label: 'Minimalista', light: true, shadow: 'soft', hover: 'underline' },
  praia: { label: 'Praia', light: false, shadow: 'soft', hover: 'lift' },
  corporativo: { label: 'Corporativo', light: false, shadow: 'medium', hover: 'underline' }
};

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

function toHex(channel: number) {
  return Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0');
}

function hexFromRgb(rgb: { r: number; g: number; b: number }) {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function clampHex(input: string, fallback: string) {
  const parsed = parseHexColor(input);
  if (!parsed) return fallback;
  return hexFromRgb(parsed);
}

function mixHex(colorA: string, colorB: string, weight = 0.5) {
  const first = parseHexColor(colorA);
  const second = parseHexColor(colorB);
  if (!first || !second) return clampHex(colorA, colorB);
  return hexFromRgb({
    r: first.r + (second.r - first.r) * weight,
    g: first.g + (second.g - first.g) * weight,
    b: first.b + (second.b - first.b) * weight
  });
}

function alphaHex(color: string, alpha: number) {
  const parsed = parseHexColor(color);
  if (!parsed) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

function relativeLuminance(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function isLightColor(input: string) {
  const color = parseHexColor(input);
  if (!color) return false;
  const luminance = 0.2126 * relativeLuminance(color.r) + 0.7152 * relativeLuminance(color.g) + 0.0722 * relativeLuminance(color.b);
  return luminance > 0.56;
}

function readableTextFor(background: string, preferLight = true) {
  const light = '#f8fafc';
  const dark = '#16202a';
  if (isLightColor(background)) {
    return preferLight ? dark : '#24303b';
  }
  return preferLight ? light : '#d7dee5';
}

function makeSettings(overrides: Partial<ThemeBlockSettings>): ThemeBlockSettings {
  return {
    ...FALLBACK_BLOCK,
    ...overrides,
    background: clampHex(overrides.background ?? FALLBACK_BLOCK.background, FALLBACK_BLOCK.background),
    textPrimary: clampHex(overrides.textPrimary ?? FALLBACK_BLOCK.textPrimary, FALLBACK_BLOCK.textPrimary),
    textSecondary: clampHex(overrides.textSecondary ?? FALLBACK_BLOCK.textSecondary, FALLBACK_BLOCK.textSecondary),
    accent: clampHex(overrides.accent ?? FALLBACK_BLOCK.accent, FALLBACK_BLOCK.accent),
    buttonPrimary: clampHex(overrides.buttonPrimary ?? FALLBACK_BLOCK.buttonPrimary, FALLBACK_BLOCK.buttonPrimary),
    buttonSecondary: clampHex(overrides.buttonSecondary ?? FALLBACK_BLOCK.buttonSecondary, FALLBACK_BLOCK.buttonSecondary),
    borderColor: String(overrides.borderColor ?? FALLBACK_BLOCK.borderColor),
    surface: String(overrides.surface ?? FALLBACK_BLOCK.surface)
  };
}

function buildBaseBlocksFromPalette(palette: ThemePalette) {
  const blockMap: Record<(typeof THEME_BLOCK_DEFINITIONS)[number]['key'], ThemeBlockSettings> = {
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
      textPrimary: readableTextFor(palette.buttonPrimary),
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

  return THEME_BLOCK_DEFINITIONS.map((block, index) => ({
    blockKey: block.key,
    blockName: block.name,
    sortOrder: index,
    settingsJson: blockMap[block.key]
  }));
}

export function buildBlocksFromPalette(
  palette: ThemePalette,
  options?: Partial<Pick<QuickCustomizationInput, 'radius' | 'shadow' | 'style'>>
) {
  const meta = options?.style ? QUICK_STYLE_META[options.style] : null;

  return buildBaseBlocksFromPalette(palette).map((block) => ({
    ...block,
    settingsJson: {
      ...block.settingsJson,
      radius: options?.radius || block.settingsJson.radius,
      shadow: options?.shadow || block.settingsJson.shadow,
      hoverEffect:
        options?.style === 'minimalista'
          ? block.blockKey === 'cta-buttons'
            ? 'underline'
            : block.settingsJson.hoverEffect
          : meta?.hover || block.settingsJson.hoverEffect
    }
  }));
}

export function buildThemePresetCatalog(primaryColor = '#102a1f', secondaryColor = '#d4af72', accentColor = '#f6f2e8'): ThemePresetDefinition[] {
  return [
    {
      name: 'Layout Escuro',
      slug: 'layout-escuro',
      description: 'Modelo inicial salvo automaticamente a partir do visual atual do portal.',
      category: 'layout',
      styleHint: 'luxo',
      palette: {
        background: '#08110d',
        backgroundAlt: '#0b1712',
        surface: 'rgba(255,255,255,0.05)',
        surfaceStrong: 'rgba(255,255,255,0.09)',
        textPrimary: '#f7f3ea',
        textSecondary: '#c7cfc9',
        border: 'rgba(255,255,255,0.10)',
        accent: clampHex(secondaryColor, '#d4af72'),
        accentSoft: 'rgba(212,175,114,0.16)',
        buttonPrimary: clampHex(secondaryColor, '#d4af72'),
        buttonSecondary: clampHex(accentColor, '#ffffff'),
        footerBackground: '#060d0a',
        heroBackground: '#09130f',
        blogBackground: '#08110d'
      }
    },
    {
      name: 'Layout Claro',
      slug: 'layout-claro',
      description: 'Base clara, sofisticada e mais clean para campanhas e autoridade institucional.',
      category: 'layout',
      styleHint: 'minimalista',
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
      category: 'layout',
      styleHint: 'luxo',
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
      category: 'layout',
      styleHint: 'moderno',
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
      category: 'layout',
      styleHint: 'moderno',
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
      category: 'layout',
      styleHint: 'luxo',
      palette: {
        background: clampHex(primaryColor, '#102a1f'),
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
      category: 'identity',
      styleHint: 'luxo',
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
      category: 'identity',
      styleHint: 'moderno',
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
      category: 'identity',
      styleHint: 'minimalista',
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
      category: 'identity',
      styleHint: 'luxo',
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
      category: 'identity',
      styleHint: 'praia',
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
      category: 'identity',
      styleHint: 'luxo',
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
      category: 'identity',
      styleHint: 'corporativo',
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

export function buildPaletteFromQuickCustomization(input: QuickCustomizationInput): ThemePalette {
  const primary = clampHex(input.primaryColor, '#102a1f');
  const secondary = clampHex(input.secondaryColor, '#d4af72');
  const accent = clampHex(input.accentColor, '#f6f2e8');
  const meta = QUICK_STYLE_META[input.style];

  const baseBackground = meta.light ? mixHex(primary, '#ffffff', 0.76) : mixHex(primary, '#071018', 0.3);
  const altBackground = meta.light ? mixHex(primary, '#ffffff', 0.88) : mixHex(primary, secondary, 0.18);
  const heroBackground = mixHex(altBackground, accent, meta.light ? 0.14 : 0.08);
  const footerBackground = meta.light ? mixHex(baseBackground, '#d9e0e7', 0.18) : mixHex(baseBackground, '#000000', 0.32);
  const blogBackground = mixHex(baseBackground, accent, meta.light ? 0.08 : 0.12);
  const textPrimary = meta.light ? readableTextFor(baseBackground, true) : '#f7fafc';
  const textSecondary = meta.light ? '#5f6b78' : mixHex(textPrimary, '#8594a3', 0.42);
  const buttonPrimary = secondary;
  const buttonSecondary = meta.light ? textPrimary : '#f8fafc';

  return {
    background: baseBackground,
    backgroundAlt: altBackground,
    surface: meta.light ? alphaHex('#ffffff', 0.78) : alphaHex('#ffffff', 0.05),
    surfaceStrong: meta.light ? alphaHex('#ffffff', 0.94) : alphaHex('#ffffff', 0.1),
    textPrimary,
    textSecondary,
    border: meta.light ? alphaHex(textPrimary, 0.12) : alphaHex(accent, 0.18),
    accent,
    accentSoft: alphaHex(accent, meta.light ? 0.16 : 0.18),
    buttonPrimary,
    buttonSecondary,
    footerBackground,
    heroBackground,
    blogBackground
  };
}

export function buildBlocksFromQuickCustomization(input: QuickCustomizationInput) {
  return buildBlocksFromPalette(buildPaletteFromQuickCustomization(input), input);
}

export function deriveQuickCustomizationFromLayout(layout: ThemeLayout | null | undefined): QuickCustomizationInput {
  const property = getBlockSettings(layout, 'property-page');
  const cards = getBlockSettings(layout, 'property-cards');
  const name = `${layout?.name || ''} ${layout?.slug || ''}`.toLowerCase();

  let style: QuickStyle = 'luxo';
  if (name.includes('moderno') || name.includes('azul')) style = 'moderno';
  else if (name.includes('minimalista') || name.includes('claro')) style = 'minimalista';
  else if (name.includes('praia')) style = 'praia';
  else if (name.includes('corpor')) style = 'corporativo';

  return {
    primaryColor: property.background,
    secondaryColor: cards.buttonPrimary,
    accentColor: cards.accent,
    style,
    radius: cards.radius,
    shadow: cards.shadow
  };
}

export function getBlockSettings(layout: ThemeLayout | null | undefined, key: string) {
  const block = layout?.blocks?.find((item) => item.blockKey === key);
  return { ...FALLBACK_BLOCK, ...(block?.settingsJson || {}) };
}

export function shadowToCss(value?: string) {
  switch (value) {
    case 'none':
      return 'none';
    case 'medium':
      return '0 22px 80px rgba(0,0,0,0.28)';
    case 'strong':
      return '0 28px 100px rgba(0,0,0,0.36)';
    case 'glow':
      return '0 24px 90px color-mix(in srgb, var(--theme-accent, #d4af72) 18%, transparent)';
    case 'soft':
    default:
      return '0 18px 70px rgba(0,0,0,0.22)';
  }
}

export function radiusToCss(value?: string) {
  switch (value) {
    case 'md':
      return '1rem';
    case 'lg':
      return '1.5rem';
    case '2xl':
      return '2rem';
    case 'pill':
      return '999px';
    case 'xl':
    default:
      return '1.75rem';
  }
}

export function hoverTransform(value?: string) {
  switch (value) {
    case 'none':
      return 'none';
    case 'scale':
      return 'scale(1.015)';
    case 'glow':
      return 'translateY(-2px)';
    case 'underline':
      return 'none';
    case 'lift':
    default:
      return 'translateY(-8px)';
  }
}

export function getContrastRatio(background: string, foreground: string) {
  const bg = parseHexColor(background);
  const fg = parseHexColor(foreground);
  if (!bg || !fg) return null;
  const l1 = 0.2126 * relativeLuminance(bg.r) + 0.7152 * relativeLuminance(bg.g) + 0.0722 * relativeLuminance(bg.b);
  const l2 = 0.2126 * relativeLuminance(fg.r) + 0.7152 * relativeLuminance(fg.g) + 0.0722 * relativeLuminance(fg.b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
}

export function getLayoutContrastWarnings(layout: ThemeLayout | null | undefined) {
  if (!layout) return [];
  return layout.blocks.flatMap((block) => {
    const settings = getBlockSettings(layout, block.blockKey);
    const primaryContrast = getContrastRatio(settings.background, settings.textPrimary);
    const secondaryContrast = getContrastRatio(settings.background, settings.textSecondary);
    const warnings: string[] = [];

    if (primaryContrast !== null && primaryContrast < 4.5) {
      warnings.push(`${block.blockName}: contraste do texto principal em ${primaryContrast}:1`);
    }

    if (secondaryContrast !== null && secondaryContrast < 3.2) {
      warnings.push(`${block.blockName}: contraste do texto secundário em ${secondaryContrast}:1`);
    }

    return warnings;
  });
}

export function buildThemeCssVariables(layout: ThemeLayout | null | undefined) {
  const header = getBlockSettings(layout, 'header');
  const hero = getBlockSettings(layout, 'hero-home');
  const searchBar = getBlockSettings(layout, 'search-bar');
  const cards = getBlockSettings(layout, 'property-cards');
  const highlights = getBlockSettings(layout, 'highlights');
  const launches = getBlockSettings(layout, 'launches');
  const propertyPage = getBlockSettings(layout, 'property-page');
  const technicalSheet = getBlockSettings(layout, 'technical-sheet');
  const cta = getBlockSettings(layout, 'cta-buttons');
  const footer = getBlockSettings(layout, 'footer');
  const blog = getBlockSettings(layout, 'blog');
  const institutional = getBlockSettings(layout, 'institutional-pages');

  return `
    :root {
      --site-background: ${institutional.background};
      --site-background-gradient: ${institutional.surface};
      --site-foreground: ${institutional.textPrimary};
      --site-muted-text: ${institutional.textSecondary};
      --theme-accent: ${cards.accent};

      --theme-card-background: ${cards.surface};
      --theme-card-border: ${cards.borderColor};
      --theme-card-text-primary: ${cards.textPrimary};
      --theme-card-text-secondary: ${cards.textSecondary};
      --theme-card-shadow: ${shadowToCss(cards.shadow)};
      --theme-card-radius: ${radiusToCss(cards.radius)};
      --theme-card-hover-transform: ${hoverTransform(cards.hoverEffect)};

      --theme-button-primary-bg: ${cta.buttonPrimary};
      --theme-button-primary-text: ${cta.textPrimary};
      --theme-button-secondary-text: ${cta.buttonSecondary};
      --theme-button-border: ${cta.borderColor};
      --theme-button-shadow: ${shadowToCss(cta.shadow)};
      --theme-button-radius: ${radiusToCss(cta.radius)};

      --theme-section-title-color: ${highlights.textPrimary};
      --theme-section-subtitle-color: ${highlights.textSecondary};
      --theme-section-badge-bg: ${highlights.surface};
      --theme-section-badge-border: ${highlights.borderColor};
      --theme-section-badge-text: ${highlights.accent};

      --theme-header-background: ${header.surface};
      --theme-header-border: ${header.borderColor};
      --theme-header-text-primary: ${header.textPrimary};
      --theme-header-text-secondary: ${header.textSecondary};
      --theme-header-accent: ${header.accent};
      --theme-header-button: ${header.buttonPrimary};
      --theme-header-height: ${header.height === 'compact' ? '4.5rem' : header.height === 'tall' ? '6rem' : '5rem'};
      --theme-header-radius: ${radiusToCss(header.radius)};
      --theme-header-shadow: ${shadowToCss(header.shadow)};

      --theme-hero-background: ${hero.background};
      --theme-hero-surface: ${hero.surface};
      --theme-hero-text-primary: ${hero.textPrimary};
      --theme-hero-text-secondary: ${hero.textSecondary};
      --theme-hero-accent: ${hero.accent};
      --theme-hero-button: ${hero.buttonPrimary};
      --theme-hero-shadow: ${shadowToCss(hero.shadow)};

      --theme-search-background: ${searchBar.background};
      --theme-search-surface: ${searchBar.surface};
      --theme-search-text-primary: ${searchBar.textPrimary};
      --theme-search-text-secondary: ${searchBar.textSecondary};
      --theme-search-border: ${searchBar.borderColor};
      --theme-search-accent: ${searchBar.accent};
      --theme-search-button: ${searchBar.buttonPrimary};
      --theme-search-shadow: ${shadowToCss(searchBar.shadow)};
      --theme-search-radius: ${radiusToCss(searchBar.radius)};

      --theme-highlights-background: ${highlights.background};
      --theme-highlights-border: ${highlights.borderColor};
      --theme-launches-background: ${launches.background};
      --theme-launches-border: ${launches.borderColor};

      --theme-property-background: ${propertyPage.background};
      --theme-property-surface: ${propertyPage.surface};
      --theme-property-border: ${propertyPage.borderColor};
      --theme-property-text-primary: ${propertyPage.textPrimary};
      --theme-property-text-secondary: ${propertyPage.textSecondary};
      --theme-property-accent: ${propertyPage.accent};
      --theme-property-shadow: ${shadowToCss(propertyPage.shadow)};
      --theme-property-radius: ${radiusToCss(propertyPage.radius)};

      --theme-technical-background: ${technicalSheet.background};
      --theme-technical-surface: ${technicalSheet.surface};
      --theme-technical-border: ${technicalSheet.borderColor};
      --theme-technical-text-primary: ${technicalSheet.textPrimary};
      --theme-technical-text-secondary: ${technicalSheet.textSecondary};
      --theme-technical-accent: ${technicalSheet.accent};
      --theme-technical-shadow: ${shadowToCss(technicalSheet.shadow)};
      --theme-technical-radius: ${radiusToCss(technicalSheet.radius)};

      --theme-footer-background: ${footer.surface};
      --theme-footer-text-primary: ${footer.textPrimary};
      --theme-footer-text-secondary: ${footer.textSecondary};
      --theme-footer-accent: ${footer.accent};
      --theme-footer-border: ${footer.borderColor};

      --theme-blog-background: ${blog.background};
      --theme-blog-surface: ${blog.surface};
      --theme-blog-text-primary: ${blog.textPrimary};
      --theme-blog-text-secondary: ${blog.textSecondary};
      --theme-blog-border: ${blog.borderColor};
      --theme-blog-button: ${blog.buttonPrimary};
      --theme-blog-radius: ${radiusToCss(blog.radius)};

      --theme-institutional-background: ${institutional.background};
      --theme-institutional-surface: ${institutional.surface};
      --theme-institutional-text-primary: ${institutional.textPrimary};
      --theme-institutional-text-secondary: ${institutional.textSecondary};
      --theme-institutional-border: ${institutional.borderColor};
      --theme-institutional-button: ${institutional.buttonPrimary};
      --theme-institutional-shadow: ${shadowToCss(institutional.shadow)};
      --theme-institutional-radius: ${radiusToCss(institutional.radius)};
    }
  `;
}
