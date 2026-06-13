import { Lead, OwnerSession, Post, Property, PropertyLocationGroup, SiteSettings, Testimonial, ThemeLayout, ViewsDashboardData } from './types';
import { mockPosts, mockProperties, mockSettings, mockTestimonials } from './mock-data';
import { getApiBaseUrl } from './api-base';

export const API_URL = getApiBaseUrl();
const FETCH_TIMEOUT_MS = 3500;

export class ApiRateLimitError extends Error {
  retryAfterSeconds: number | null;

  constructor(message: string, retryAfterSeconds: number | null) {
    super(message);
    this.name = 'ApiRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function parseRetryAfterSeconds(value: string | null) {
  if (!value) return null;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric;
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
  }

  return null;
}

function buildRateLimitError(response: Response, path: string) {
  const retryAfterSeconds =
    parseRetryAfterSeconds(response.headers.get('retry-after')) ?? parseRetryAfterSeconds(response.headers.get('ratelimit-reset'));

  const retryMessage = retryAfterSeconds != null ? ` Tente novamente em cerca de ${retryAfterSeconds} segundo(s).` : '';

  return new ApiRateLimitError(`A API atingiu o limite temporário de requisições ao carregar ${path}.${retryMessage}`, retryAfterSeconds);
}

function logFrontendFetch(path: string, duration: number, status: 'ok' | 'fallback' | 'error', details = '') {
  const shouldLog = duration >= 250 || path.startsWith('/themes') || path.startsWith('/settings') || path.startsWith('/properties');

  if (shouldLog) {
    console.info(`[web:fetch] ${status.toUpperCase()} ${path} ${duration}ms${details ? ` ${details}` : ''}`);
  }
}

async function fetcher<T>(path: string, fallback: T, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      const rateLimitError = buildRateLimitError(response, path);
      const duration = Date.now() - startedAt;
      logFrontendFetch(path, duration, 'fallback', `reason=rate-limit retryAfter=${rateLimitError.retryAfterSeconds ?? 'unknown'}`);
      return fallback;
    }

    if (!response.ok) {
      throw new Error(`Erro ao carregar ${path}`);
    }

    const duration = Date.now() - startedAt;
    logFrontendFetch(path, duration, 'ok');
    return response.json();
  } catch (error) {
    clearTimeout(timeout);
    const duration = Date.now() - startedAt;

    if (error instanceof ApiRateLimitError) {
      logFrontendFetch(path, duration, 'fallback', `reason=rate-limit retryAfter=${error.retryAfterSeconds ?? 'unknown'}`);
      return fallback;
    }

    const reason = error instanceof Error ? error.message : 'fallback';
    logFrontendFetch(path, duration, 'fallback', `reason=${reason}`);
    return fallback;
  }
}

function parseQuery(query = '') {
  const normalized = query.startsWith('?') ? query.slice(1) : query;
  return new URLSearchParams(normalized);
}

function applyMockPropertyFilter(query = '') {
  const params = parseQuery(query);
  const search = (params.get('search') || '').toLowerCase();
  const category = params.get('category') || '';
  const city = (params.get('city') || '').toLowerCase();
  const district = (params.get('district') || '').toLowerCase();
  const propertyCode = (params.get('propertyCode') || '').toLowerCase();
  const type = (params.get('type') || '').toLowerCase();
  const featured = params.get('featured');
  const launch = params.get('launch');
  const minPrice = Number(params.get('minPrice') || 0);
  const maxPrice = Number(params.get('maxPrice') || 0);
  const limit = Number(params.get('limit') || 0);

  const filtered = mockProperties.filter((item) => {
    if (item.approved === false) return false;
    if (category && item.category !== category) return false;
    if (city && item.city.toLowerCase() !== city) return false;
    if (district && item.district.toLowerCase() !== district) return false;
    if (propertyCode && !item.propertyCode.toLowerCase().includes(propertyCode)) return false;
    if (type && !item.type.toLowerCase().includes(type)) return false;
    if (featured === 'true' && !item.featured) return false;
    if (launch === 'true' && !item.launch && item.status !== 'LAUNCH') return false;
    const numericPrice = Number(item.promotionalPrice || item.price || 0);
    if (minPrice && numericPrice < minPrice) return false;
    if (maxPrice && numericPrice > maxPrice) return false;
    if (search) {
      const haystack = `${item.title} ${item.city} ${item.district} ${item.propertyCode} ${item.type}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return limit > 0 ? filtered.slice(0, limit) : filtered;
}

function buildMockLocationOptions() {
  const grouped = new Map<string, { city: string; total: number; districts: Map<string, number> }>();

  mockProperties
    .filter((item) => item.approved !== false && ['AVAILABLE', 'LAUNCH'].includes(item.status))
    .forEach((item) => {
      const city = item.city.trim();
      const district = item.district.trim();
      if (!city) return;

      const existing = grouped.get(city) || { city, total: 0, districts: new Map<string, number>() };
      existing.total += 1;
      if (district) {
        existing.districts.set(district, (existing.districts.get(district) || 0) + 1);
      }
      grouped.set(city, existing);
    });

  return Array.from(grouped.values())
    .map((entry) => ({
      city: entry.city,
      total: entry.total,
      districts: Array.from(entry.districts.entries())
        .map(([district, total]) => ({ district, total }))
        .sort((a, b) => b.total - a.total || a.district.localeCompare(b.district, 'pt-BR'))
    }))
    .sort((a, b) => b.total - a.total || a.city.localeCompare(b.city, 'pt-BR'));
}

export const getSettings = async () => {
  const settings = await fetcher<SiteSettings | null>('/settings', mockSettings);
  return settings ?? mockSettings;
};

export const getActiveThemeLayout = async () => {
  const layout = await fetcher<ThemeLayout | null>('/themes/active', null);

  if (layout) {
    console.info(`[theme:load] slug=${layout.slug} active=${layout.isActive} blocks=${layout.blocks?.length || 0}`);
  } else {
    console.warn('[theme:load] nenhum layout ativo retornado; usando fallback visual.');
  }

  return layout;
};

export const getProperties = async (query = '') => {
  const fallback = applyMockPropertyFilter(query);
  const items = await fetcher<Property[]>(`/properties${query}`, fallback);
  return Array.isArray(items) ? items : fallback;
};

export const getProperty = async (slug: string) => {
  const item = await fetcher<(Property & { related: Property[] }) | null>(`/properties/${slug}`, null);
  return item || null;
};

let propertyLocationOptionsCache: { data: PropertyLocationGroup[]; expiresAt: number } | null = null;
let pendingPropertyLocationOptionsRequest: Promise<PropertyLocationGroup[]> | null = null;

export async function getPropertyLocationOptions() {
  const now = Date.now();
  if (propertyLocationOptionsCache && propertyLocationOptionsCache.expiresAt > now) {
    return propertyLocationOptionsCache.data;
  }

  if (pendingPropertyLocationOptionsRequest) {
    return pendingPropertyLocationOptionsRequest;
  }

  const fallback = buildMockLocationOptions();

  pendingPropertyLocationOptionsRequest = fetcher<PropertyLocationGroup[]>('/properties/location-options', fallback)
    .then((items) => {
      const normalized = Array.isArray(items) ? items : fallback;
      propertyLocationOptionsCache = {
        data: normalized,
        expiresAt: Date.now() + 5 * 60 * 1000
      };
      return normalized;
    })
    .finally(() => {
      pendingPropertyLocationOptionsRequest = null;
    });

  return pendingPropertyLocationOptionsRequest;
}

export async function registerPropertyView(slug: string, visitorKey: string) {
  const response = await fetch(`${API_URL}/properties/${slug}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorKey }),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Não foi possível registrar a visualização do imóvel.');
  }

  return response.json() as Promise<{ viewCount: number; unique: boolean }>;
}

export async function registerHomeVisit(visitorKey: string) {
  await fetch(`${API_URL}/analytics/home/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorKey }),
    cache: 'no-store'
  }).catch(() => null);
}

export async function registerHomeVideoEvent(visitorKey: string, eventType: 'PLAY' | 'PROGRESS_25' | 'PROGRESS_50' | 'PROGRESS_75' | 'COMPLETE') {
  await fetch(`${API_URL}/analytics/home-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorKey, eventType }),
    cache: 'no-store'
  }).catch(() => null);
}

export async function registerPropertyContactClick(slug: string, visitorKey: string, action: 'WHATSAPP' | 'SCHEDULE_VISIT') {
  await fetch(`${API_URL}/analytics/properties/${slug}/contact-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorKey, action }),
    cache: 'no-store'
  }).catch(() => null);
}

export async function getViewsDashboard(query = '') {
  const response = await fetch(`${API_URL}/analytics/views${query}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Não foi possível carregar o painel de views.');
  }
  return response.json() as Promise<ViewsDashboardData>;
}

export const getPosts = async () => {
  const items = await fetcher<Post[]>('/posts', mockPosts);
  return Array.isArray(items) ? items : mockPosts;
};

export const getPost = async (slug: string) =>
  fetcher<Post | null>(`/posts/${slug}`, mockPosts.find((item) => item.slug === slug) || null);

export const getTestimonials = async () => {
  const items = await fetcher<Testimonial[]>('/testimonials', mockTestimonials);
  return Array.isArray(items) ? items : mockTestimonials;
};

export async function createLead(payload: Record<string, unknown>) {
  const response = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Não foi possível enviar o lead.');
  }

  return response.json() as Promise<Lead>;
}

export async function submitPropertyForApproval(payload: Record<string, unknown>, token?: string) {
  const response = await fetch(`${API_URL}/properties/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('Não foi possível enviar o imóvel para aprovação.');
  }

  return response.json() as Promise<Property>;
}

export async function googleOwnerLogin(credential: string) {
  const response = await fetch(`${API_URL}/auth/google-owner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Não foi possível entrar com o Google.');
  }

  return data as OwnerSession;
}
