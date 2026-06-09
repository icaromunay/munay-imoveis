import { categoryLabel } from './format';
import { Property } from './types';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const PROPERTY_TYPE_OPTIONS = [
  { value: 'Casa', category: 'CASA' },
  { value: 'Apartamento', category: 'APARTAMENTO' },
  { value: 'Terreno', category: 'TERRENO' },
  { value: 'Chácara', category: 'RURAL' },
  { value: 'Sítio', category: 'RURAL' },
  { value: 'Fazenda', category: 'RURAL' },
  { value: 'Comercial', category: 'COMERCIAL' },
  { value: 'Loteamento', category: 'LOTEAMENTO' }
] as const;

export const SOLAR_POSITION_OPTIONS = [
  'Norte',
  'Sul',
  'Leste',
  'Oeste',
  'Norte/Leste',
  'Norte/Oeste',
  'Sul/Leste',
  'Sul/Oeste'
] as const;

const CATEGORY_DEFAULT_TYPE: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  TERRENO: 'Terreno',
  LOTEAMENTO: 'Loteamento',
  COMERCIAL: 'Comercial',
  RURAL: 'Chácara'
};

const KNOWN_TYPE_KEYS = new Set(['CASA', 'APARTAMENTO', 'TERRENO', 'CHACARA', 'SITIO', 'FAZENDA', 'COMERCIAL', 'LOTEAMENTO']);

export function defaultPropertyType(category?: string | null) {
  const normalizedCategory = String(category || '').toUpperCase();
  return CATEGORY_DEFAULT_TYPE[normalizedCategory] || categoryLabel[normalizedCategory] || 'Casa';
}

export function categoryHasRooms(category?: string | null) {
  return ['CASA', 'APARTAMENTO', 'COMERCIAL', 'RURAL'].includes(String(category || '').toUpperCase());
}

export function normalizePropertyTypeKey(type?: string | null) {
  const normalized = String(type || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  if (normalized.includes('APART')) return 'APARTAMENTO';
  if (normalized.includes('TERRENO')) return 'TERRENO';
  if (normalized.includes('CHACARA')) return 'CHACARA';
  if (normalized.includes('SITIO')) return 'SITIO';
  if (normalized.includes('FAZENDA')) return 'FAZENDA';
  if (normalized.includes('COMERCIAL')) return 'COMERCIAL';
  if (normalized.includes('LOTEAMENTO')) return 'LOTEAMENTO';
  if (normalized.includes('CASA')) return 'CASA';
  return normalized;
}

function isKnownPropertyType(typeKey?: string | null) {
  return KNOWN_TYPE_KEYS.has(String(typeKey || '').toUpperCase());
}

function getTypeKeyFromCategory(category?: string | null) {
  const normalizedCategory = String(category || '').toUpperCase();

  if (normalizedCategory === 'APARTAMENTO') return 'APARTAMENTO';
  if (normalizedCategory === 'TERRENO') return 'TERRENO';
  if (normalizedCategory === 'COMERCIAL') return 'COMERCIAL';
  if (normalizedCategory === 'LOTEAMENTO') return 'LOTEAMENTO';
  if (normalizedCategory === 'RURAL') return 'CHACARA';
  if (normalizedCategory === 'CASA') return 'CASA';
  return 'CASA';
}

function resolveTypeKey(type?: string | null, fallbackCategory?: string | null) {
  const normalizedType = normalizePropertyTypeKey(type);
  return isKnownPropertyType(normalizedType) ? normalizedType : getTypeKeyFromCategory(fallbackCategory);
}

export function inferCategoryFromType(type?: string | null, fallback?: string | null) {
  const typeKey = resolveTypeKey(type, fallback);

  if (typeKey === 'APARTAMENTO') return 'APARTAMENTO';
  if (typeKey === 'TERRENO') return 'TERRENO';
  if (typeKey === 'COMERCIAL') return 'COMERCIAL';
  if (typeKey === 'LOTEAMENTO') return 'LOTEAMENTO';
  if (['CHACARA', 'SITIO', 'FAZENDA'].includes(typeKey)) return 'RURAL';
  return 'CASA';
}

export function getPropertyFieldVisibility(type?: string | null, category?: string | null) {
  const typeKey = resolveTypeKey(type, category);
  const isApartment = typeKey === 'APARTAMENTO';
  const isTerrain = typeKey === 'TERRENO';
  const isDevelopment = typeKey === 'LOTEAMENTO';
  const isHouseLike = ['CASA', 'CHACARA', 'SITIO', 'FAZENDA'].includes(typeKey);
  const isCommercial = typeKey === 'COMERCIAL';

  return {
    typeKey,
    isApartment,
    isTerrain,
    isDevelopment,
    isHouseLike,
    isCommercial,
    showLandArea: isHouseLike || isTerrain || isCommercial,
    showBuiltArea: !isTerrain && !isDevelopment,
    showRooms: !isTerrain && !isDevelopment,
    showSuites: !isTerrain && !isDevelopment,
    showGarage: !isTerrain && !isDevelopment,
    showFloor: isApartment,
    showElevator: isApartment,
    showSolarPosition: !isTerrain && !isDevelopment,
    showEdicule: isHouseLike,
    showConstructionYear: !isTerrain && !isDevelopment,
    showTerrainDimensions: isTerrain,
    showTerrainInfrastructure: isTerrain,
    showDevelopmentFields: isDevelopment,
    showCommercialConditions: true,
    showLocation: true
  };
}

export function formatAreaValue(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  return `${Number(value).toLocaleString('pt-BR')} m²`;
}

export function formatLinearMeasure(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  return `${Number(value).toLocaleString('pt-BR')} m`;
}

export function getPrimaryAreaLabel(property: Pick<Property, 'builtArea' | 'landArea' | 'area' | 'type' | 'category'>) {
  const visibility = getPropertyFieldVisibility(property.type, property.category);

  if (visibility.showBuiltArea && property.builtArea) {
    return formatAreaValue(property.builtArea);
  }

  if (visibility.showLandArea && property.landArea) {
    return formatAreaValue(property.landArea);
  }

  if (property.area) {
    return formatAreaValue(property.area);
  }

  return 'Sob consulta';
}

export function getPropertyDetailPath(property: Pick<Property, 'slug' | 'category'>) {
  const normalizedCategory = String(property.category || '').toUpperCase();

  if (normalizedCategory === 'TERRENO') {
    return `/terreno/${property.slug}`;
  }

  if (normalizedCategory === 'LOTEAMENTO') {
    return `/loteamento/${property.slug}`;
  }

  return `/imovel/${property.slug}`;
}

export function getLegacyPropertyPath(slug?: string | null) {
  return `/imoveis/${slug || ''}`;
}

export function buildPropertyUrl(propertyOrSlug?: Pick<Property, 'slug' | 'category'> | string | null, category?: Property['category'] | null) {
  const path = typeof propertyOrSlug === 'object' && propertyOrSlug
    ? getPropertyDetailPath(propertyOrSlug)
    : getPropertyDetailPath({ slug: propertyOrSlug || '', category: (category || 'CASA') as Property['category'] });

  return new URL(path, siteUrl).toString();
}

export function buildPropertyWhatsappMessage(
  property: Pick<Property, 'title' | 'propertyCode' | 'slug' | 'city' | 'district'> & { category?: Property['category'] },
  purpose: 'informacoes' | 'agendar-visita' = 'informacoes',
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
  }
) {
  const actionLabel = purpose === 'agendar-visita' ? 'quero agendar visita para este imóvel' : 'quero informações sobre este imóvel';
  const lines = [
    `Olá, ${actionLabel}.`,
    '',
    `Imóvel: ${property.title}`,
    `Código: ${property.propertyCode}`,
    `Localização: ${property.city} - ${property.district}`,
    `Link: ${buildPropertyUrl(property.slug, property.category)}`
  ];

  const customerLines = [
    customer?.name ? `Nome: ${customer.name}` : '',
    customer?.phone ? `WhatsApp: ${customer.phone}` : '',
    customer?.email ? `E-mail: ${customer.email}` : '',
    customer?.message ? `Mensagem: ${customer.message}` : ''
  ].filter(Boolean);

  if (customerLines.length) {
    lines.push('', 'Dados do cliente:', ...customerLines);
  }

  return lines.join('\n');
}

export function buildPropertyMapEmbedUrl(property: Pick<Property, 'title' | 'district' | 'city' | 'state' | 'latitude' | 'longitude'>) {
  if (typeof property.latitude === 'number' && typeof property.longitude === 'number') {
    return `https://www.google.com/maps?q=${property.latitude},${property.longitude}&z=16&output=embed`;
  }

  const query = [property.title, property.district, property.city, property.state].filter(Boolean).join(', ');
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

type GalleryImageEntry = {
  url: string;
  alt?: string | null;
  sortOrder?: number;
};

export function normalizeImageUrlKey(value?: string | null) {
  return String(value || '').trim().replace(/[?#].*$/, '');
}

function readLegacyImageEntry(entry: unknown, fallbackAlt: string): GalleryImageEntry | null {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const url = entry.trim();
    return url ? { url, alt: fallbackAlt, sortOrder: Number.MAX_SAFE_INTEGER } : null;
  }

  if (typeof entry === 'object' && entry !== null) {
    const rawUrl = 'url' in entry ? String((entry as { url?: string }).url || '').trim() : '';
    if (!rawUrl) return null;

    return {
      url: rawUrl,
      alt: 'alt' in entry ? String((entry as { alt?: string | null }).alt || fallbackAlt) : fallbackAlt,
      sortOrder: 'sortOrder' in entry && Number.isFinite(Number((entry as { sortOrder?: number }).sortOrder))
        ? Number((entry as { sortOrder?: number }).sortOrder)
        : Number.MAX_SAFE_INTEGER
    };
  }

  return null;
}

export function normalizePropertyGalleryImages(property: Pick<Property, 'title' | 'coverImage' | 'images'>) {
  const fallbackAlt = property.title ? `${property.title} - foto` : 'Imagem do imóvel';
  const uniqueKeys = new Set<string>();
  const gallery: Array<{ url: string; alt: string }> = [];

  const pushImage = (entry?: GalleryImageEntry | null) => {
    if (!entry?.url) return;
    const normalizedKey = normalizeImageUrlKey(entry.url);
    if (!normalizedKey || uniqueKeys.has(normalizedKey)) return;
    uniqueKeys.add(normalizedKey);
    gallery.push({
      url: entry.url,
      alt: entry.alt || fallbackAlt
    });
  };

  pushImage(readLegacyImageEntry(property.coverImage, fallbackAlt));

  const orderedImages = Array.isArray(property.images)
    ? property.images
        .map((image) => readLegacyImageEntry(image, fallbackAlt))
        .filter(Boolean)
        .sort((left, right) => Number(left?.sortOrder ?? Number.MAX_SAFE_INTEGER) - Number(right?.sortOrder ?? Number.MAX_SAFE_INTEGER))
    : [];

  orderedImages.forEach((image) => pushImage(image));

  if (!gallery.length) {
    pushImage(readLegacyImageEntry(property.coverImage, fallbackAlt));
  }

  return gallery;
}
