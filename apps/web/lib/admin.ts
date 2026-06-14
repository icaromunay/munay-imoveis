'use client';

import { getApiBaseUrl } from './api-base';

type CachedToken = {
  token: string;
  expiresAt: number;
};

const TOKEN_REFRESH_GRACE_MS = 30_000;

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function logAdminAuth(event: string, details: Record<string, string | number | boolean | null | undefined> = {}) {
  const serialized = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');

  console.info(`[admin-auth] ${event}${serialized ? ` ${serialized}` : ''}`);
}

function logAdminAuthError(event: string, error: unknown, details: Record<string, string | number | boolean | null | undefined> = {}) {
  const serialized = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');

  console.error(`[admin-auth] ${event}${serialized ? ` ${serialized}` : ''}`, error);
}

function parseTokenExpiry(expiresAt: string | undefined, fallbackMs: number) {
  const parsed = Date.parse(expiresAt || '');
  return Number.isFinite(parsed) ? parsed : Date.now() + fallbackMs;
}

function normalizeUploadUrls<T>(payload: T): T {
  if (typeof payload === 'string') {
    if (payload.startsWith('/uploads/')) {
      return `/api${payload}` as T;
    }

    return payload
      .replace(/src=(["'])\/uploads\//g, 'src=$1/api/uploads/')
      .replace(/href=(["'])\/uploads\//g, 'href=$1/api/uploads/') as T;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeUploadUrls(item)) as T;
  }

  if (payload && typeof payload === 'object') {
    return Object.fromEntries(
      Object.entries(payload as Record<string, unknown>).map(([key, value]) => [key, normalizeUploadUrls(value)])
    ) as T;
  }

  return payload;
}

export const getToken = () => cachedToken?.token ?? null;

export function clearToken(reason = 'manual-clear') {
  logAdminAuth('token-cache-cleared', { reason, hadToken: Boolean(cachedToken) });
  cachedToken = null;
  pendingTokenRequest = null;
}

async function requestAdminAccessToken() {
  const startedAt = Date.now();
  logAdminAuth('token-request-start');

  let response: Response;

  try {
    response = await fetch('/api/admin-token', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    logAdminAuthError('token-request-network-error', error, { duration });
    throw new Error('Falha ao obter o token administrativo no NextAuth.');
  }

  const duration = Date.now() - startedAt;
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.token) {
    logAdminAuth('token-request-http-error', {
      status: response.status,
      duration,
      hasToken: Boolean(data?.token),
      message: data?.message || null
    });

    throw new Error(data?.message || 'Não foi possível validar sua sessão administrativa.');
  }

  const nextToken = {
    token: data.token,
    expiresAt: parseTokenExpiry(data.expiresAt, 14 * 60 * 1000)
  };

  cachedToken = nextToken;
  logAdminAuth('token-request-success', {
    status: response.status,
    duration,
    expiresInMs: nextToken.expiresAt - Date.now()
  });

  return nextToken.token;
}

async function getAdminAccessToken(forceRefresh = false) {
  const stillValid = cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_GRACE_MS;

  if (!forceRefresh && stillValid && cachedToken) {
    logAdminAuth('token-cache-hit', { expiresInMs: cachedToken.expiresAt - Date.now() });
    return cachedToken.token;
  }

  if (!forceRefresh && pendingTokenRequest) {
    logAdminAuth('token-request-reused');
    return pendingTokenRequest;
  }

  if (forceRefresh) {
    clearToken('force-refresh');
  }

  pendingTokenRequest = requestAdminAccessToken().finally(() => {
    pendingTokenRequest = null;
  });

  return pendingTokenRequest;
}

export async function adminFetch(path: string, init?: RequestInit, retry = true) {
  const token = await getAdminAccessToken(false);
  const headers = new Headers(init?.headers || {});

  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Authorization', `Bearer ${token}`);

  const baseUrl = getApiBaseUrl();
  const requestUrl = `${baseUrl}${path}`;
  const startedAt = Date.now();

  logAdminAuth('api-request-start', {
    path,
    retry,
    baseUrl
  });

  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers,
      cache: 'no-store',
      credentials: 'same-origin'
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : '';
    logAdminAuthError('api-request-network-error', error, { path, duration, retry, baseUrl });

    if (/Failed to fetch/i.test(message)) {
      throw new Error('Falha de conexão com a API administrativa. Verifique se o backend está ativo e se a URL pública da API está correta.');
    }

    throw error instanceof Error ? error : new Error('Não foi possível se comunicar com a API administrativa.');
  }

  const duration = Date.now() - startedAt;

  if (!response.ok) {
    let message = 'Não foi possível concluir a solicitação.';

    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      try {
        message = await response.text();
      } catch {
        message = 'Não foi possível concluir a solicitação.';
      }
    }

    logAdminAuth('api-request-http-error', {
      path,
      retry,
      status: response.status,
      duration,
      message
    });

    if ((response.status === 401 || response.status === 403) && retry) {
      clearToken(`http-${response.status}`);
      return adminFetch(path, init, false);
    }

    if (typeof window !== 'undefined') {
      if (response.status === 401) {
        window.location.href = '/login';
      } else if (response.status === 403) {
        window.location.href = '/acesso-negado';
      }
    }

    throw new Error(message);
  }

  logAdminAuth('api-request-success', {
    path,
    status: response.status,
    duration
  });

  if (response.status === 204) return null;
  const payload = await response.json();
  return normalizeUploadUrls(payload);
}
