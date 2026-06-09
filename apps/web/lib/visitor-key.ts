const VISITOR_STORAGE_KEY = 'portal-imobiliario-premium:visitor-id';

function generateVisitorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getClientVisitorKey() {
  if (typeof window === 'undefined') return null;

  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const created = generateVisitorId();
  window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
  return created;
}
