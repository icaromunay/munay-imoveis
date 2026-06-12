const LOCAL_FALLBACK_API_PORT = '4000';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

let browserResolutionLogged = false;
let serverResolutionLogged = false;

function normalizeApiBaseUrl(value?: string | null) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return /\/api$/i.test(withoutTrailingSlash) ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
}

function logApiBaseResolution(scope: 'browser' | 'server', resolvedBaseUrl: string, reason: string) {
  if (scope === 'browser') {
    if (browserResolutionLogged) return;
    browserResolutionLogged = true;
  }

  if (scope === 'server') {
    if (serverResolutionLogged) return;
    serverResolutionLogged = true;
  }

  console.info(`[api-base] scope=${scope} base=${resolvedBaseUrl} reason=${reason}`);
}

function getBrowserApiBaseUrl() {
  const { protocol, hostname } = window.location;

  if (LOCAL_HOSTS.has(hostname)) {
    const resolved = `${protocol}//${hostname}:${LOCAL_FALLBACK_API_PORT}/api`;
    logApiBaseResolution('browser', resolved, 'local-browser-fallback-port-4000');
    return resolved;
  }

  const resolved = '/api';
  logApiBaseResolution('browser', resolved, 'same-origin-production-proxy');
  return resolved;
}

function getServerApiBaseUrl() {
  const candidates = [
    ['INTERNAL_API_URL', process.env.INTERNAL_API_URL],
    ['API_URL', process.env.API_URL],
    ['NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL],
    ['NEXTAUTH_URL', process.env.NEXTAUTH_URL]
  ] as const;

  for (const [name, value] of candidates) {
    const normalized = normalizeApiBaseUrl(value);
    if (!normalized) continue;

    logApiBaseResolution('server', normalized, `env:${name}`);
    return normalized;
  }

  const fallback = 'http://127.0.0.1:4000/api';
  logApiBaseResolution('server', fallback, 'server-fallback-127.0.0.1:4000');
  return fallback;
}

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return getBrowserApiBaseUrl();
  }

  return getServerApiBaseUrl();
}
