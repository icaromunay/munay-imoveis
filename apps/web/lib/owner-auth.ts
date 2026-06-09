'use client';

import { getApiBaseUrl } from './api-base';

type CachedToken = {
  token: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;
let pendingTokenRequest: Promise<string> | null = null;

export function clearOwnerSession() {
  cachedToken = null;
  pendingTokenRequest = null;
}

export function getOwnerSession() {
  return null;
}

export function saveOwnerSession() {
  return null;
}

async function getOwnerAccessToken(forceRefresh = false) {
  const stillValid = cachedToken && cachedToken.expiresAt > Date.now() + 30_000;

  if (!forceRefresh && stillValid && cachedToken) {
    return cachedToken.token;
  }

  if (!forceRefresh && pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest = fetch('/api/owner-token', {
    method: 'GET',
    cache: 'no-store'
  })
    .then(async (response) => {
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.token) {
        throw new Error(data?.message || 'Não foi possível validar sua sessão do proprietário.');
      }

      const nextToken = {
        token: data.token,
        expiresAt: Date.parse(data.expiresAt || '') || Date.now() + 5 * 60 * 60 * 1000
      };

      cachedToken = nextToken;
      return nextToken.token;
    })
    .finally(() => {
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

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: 'no-store'
  });

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
      clearOwnerSession();
      return ownerFetch(path, init, false);
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}
