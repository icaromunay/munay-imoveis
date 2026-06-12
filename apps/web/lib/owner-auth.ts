'use client';

import { getApiBaseUrl } from './api-base';

type CachedToken = {
  token: string;
  expiresAt: number;
};

const TOKEN_REFRESH_GRACE_MS = 30_000;

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<string> | null = null;

function logOwnerAuth(event: string, details: Record<string, string | number | boolean | null | undefined> = {}) {
  const serialized = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');

  console.info(`[owner-auth] ${event}${serialized ? ` ${serialized}` : ''}`);
}

function logOwnerAuthError(event: string, error: unknown, details: Record<string, string | number | boolean | null | undefined> = {}) {
  const serialized = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(' ');

  console.error(`[owner-auth] ${event}${serialized ? ` ${serialized}` : ''}`, error);
}

function parseTokenExpiry(expiresAt: string | undefined, fallbackMs: number) {
  const parsed = Date.parse(expiresAt || '');
  return Number.isFinite(parsed) ? parsed : Date.now() + fallbackMs;
}

export function clearOwnerSession(reason = 'manual-clear') {
  logOwnerAuth('token-cache-cleared', { reason, hadToken: Boolean(cachedToken) });
  cachedToken = null;
  pendingTokenRequest = null;
}

export function getOwnerSession() {
  return cachedToken;
}

export function saveOwnerSession(session: CachedToken | null) {
  cachedToken = session;
  pendingTokenRequest = null;
  logOwnerAuth('token-cache-saved', { hasToken: Boolean(session) });
  return cachedToken;
}

async function requestOwnerAccessToken() {
  const startedAt = Date.now();
  logOwnerAuth('token-request-start');

  let response: Response;

  try {
    response = await fetch('/api/owner-token', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    });
  } catch (error) {
    const duration = Date.now() - startedAt;
    logOwnerAuthError('token-request-network-error', error, { duration });
    throw new Error('Falha ao obter o token do proprietário no NextAuth.');
  }

  const duration = Date.now() - startedAt;
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.token) {
    logOwnerAuth('token-request-http-error', {
      status: response.status,
      duration,
      hasToken: Boolean(data?.token),
      message: data?.message || null
    });

    throw new Error(data?.message || 'Não foi possível validar sua sessão do proprietário.');
  }

  const nextToken = {
    token: data.token,
    expiresAt: parseTokenExpiry(data.expiresAt, 5 * 60 * 60 * 1000)
  };

  saveOwnerSession(nextToken);
  logOwnerAuth('token-request-success', {
    status: response.status,
    duration,
    expiresInMs: nextToken.expiresAt - Date.now()
  });

  return nextToken.token;
}

async function getOwnerAccessToken(forceRefresh = false) {
  const stillValid = cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_GRACE_MS;

  if (!forceRefresh && stillValid && cachedToken) {
    logOwnerAuth('token-cache-hit', { expiresInMs: cachedToken.expiresAt - Date.now() });
    return cachedToken.token;
  }

  if (!forceRefresh && pendingTokenRequest) {
    logOwnerAuth('token-request-reused');
    return pendingTokenRequest;
  }

  if (forceRefresh) {
    clearOwnerSession('force-refresh');
  }

  pendingTokenRequest = requestOwnerAccessToken().finally(() => {
    pendingTokenRequest = null;
  });

  return pendingTokenRequest;
}

export async function ownerFetch(path: string, init?: RequestInit, retry = true) {
  const token = await getOwnerAccessToken(false);
  const headers = new Headers(init?.headers || {});

  if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Authorization', `Bearer ${token}`);

  const baseUrl = getApiBaseUrl();
  const requestUrl = `${baseUrl}${path}`;
  const startedAt = Date.now();

  logOwnerAuth('api-request-start', {
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
    logOwnerAuthError('api-request-network-error', error, { path, duration, retry, baseUrl });

    if (/Failed to fetch/i.test(message)) {
      throw new Error('Falha de conexão com a API do proprietário. Verifique se o backend está ativo e se a URL pública da API está correta.');
    }

    throw error instanceof Error ? error : new Error('Não foi possível se comunicar com a API do proprietário.');
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

    logOwnerAuth('api-request-http-error', {
      path,
      retry,
      status: response.status,
      duration,
      message
    });

    if ((response.status === 401 || response.status === 403) && retry) {
      clearOwnerSession(`http-${response.status}`);
      return ownerFetch(path, init, false);
    }

    throw new Error(message);
  }

  logOwnerAuth('api-request-success', {
    path,
    status: response.status,
    duration
  });

  if (response.status === 204) return null;
  return response.json();
}
