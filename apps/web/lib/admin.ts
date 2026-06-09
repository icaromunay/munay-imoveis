'use client';

import { getApiBaseUrl } from './api-base';

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<string> | null = null;

export const getToken = () => cachedToken?.token ?? null;

export function clearToken() {
  cachedToken = null;
  pendingTokenRequest = null;
}

async function getAdminAccessToken(forceRefresh = false) {
  const stillValid = cachedToken && cachedToken.expiresAt > Date.now() + 30_000;

  if (!forceRefresh && stillValid && cachedToken) {
    return cachedToken.token;
  }

  if (!forceRefresh && pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = fetch('/api/admin-token', {
    method: 'GET',
    cache: 'no-store'
  })
    .then(async (response) => {
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.token) {
        throw new Error(data?.message || 'Não foi possível validar sua sessão administrativa.');
      }

      const nextToken = {
        token: data.token,
        expiresAt: Date.parse(data.expiresAt || '') || Date.now() + 14 * 60 * 1000
      };

      cachedToken = nextToken;
      return nextToken.token;
    })
    .finally(() => {
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

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: 'no-store'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/Failed to fetch/i.test(message)) {
      throw new Error('Falha de conexão com a API administrativa. Verifique se o backend está ativo e se a URL pública da API está correta.');
    }

    throw error instanceof Error ? error : new Error('Não foi possível se comunicar com a API administrativa.');
  }

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

    if ((response.status === 401 || response.status === 403) && retry) {
      clearToken();
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

  if (response.status === 204) return null;
  return response.json();
}
