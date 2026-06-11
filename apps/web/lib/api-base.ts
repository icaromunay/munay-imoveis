const LOCAL_FALLBACK_API_PORT = '4000';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function normalizeApiBaseUrl(value?: string | null) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return /\/api$/i.test(withoutTrailingSlash) ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
}

function buildBrowserApiBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const { protocol, hostname } = window.location;

  if (LOCAL_HOSTS.has(hostname)) {
    return `${protocol}//${hostname}:${LOCAL_FALLBACK_API_PORT}/api`;
  }

  return '/api';
}

export function getApiBaseUrl() {
  const explicitUrl = normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || process.env.INTERNAL_API_URL || process.env.NEXTAUTH_URL
  );

  if (explicitUrl) {
    return explicitUrl;
  }

  const browserUrl = normalizeApiBaseUrl(buildBrowserApiBaseUrl());
  if (browserUrl) {
    return browserUrl;
  }

  return 'http://127.0.0.1:4000/api';
}
