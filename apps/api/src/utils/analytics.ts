const SAO_PAULO_UTC_OFFSET_HOURS = 3;
const ANALYTICS_DATE_KEY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

type ViewsRange = 'today' | '7d' | '30d' | '90d' | 'custom';

type SaoPauloDateParts = {
  year: string;
  month: string;
  day: string;
};

export type ParsedAnalyticsRange = {
  range: ViewsRange;
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
};

export function isValidAnalyticsDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function getSafeInputDate(date: Date, context: string) {
  if (isValidAnalyticsDate(date)) {
    return date;
  }

  const fallback = new Date();
  console.warn(`[analytics] invalid input date in ${context}; fallback to current time`, {
    received: String(date),
    fallback: fallback.toISOString()
  });
  return fallback;
}

function getSaoPauloDateParts(date: Date): SaoPauloDateParts {
  const safeDate = getSafeInputDate(date, 'getSaoPauloDateParts');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(safeDate);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    const fallback = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const [fallbackYear, fallbackMonth, fallbackDay] = fallback.split('-');
    console.warn('[analytics] could not extract Sao Paulo date parts; fallback applied', {
      year,
      month,
      day,
      fallback
    });
    return {
      year: fallbackYear,
      month: fallbackMonth,
      day: fallbackDay
    };
  }

  return { year, month, day };
}

function normalizeAnalyticsDateKey(dateKey: string) {
  const trimmed = String(dateKey || '').trim();
  const exactMatch = trimmed.match(ANALYTICS_DATE_KEY_REGEX);

  if (exactMatch) {
    return `${exactMatch[1]}-${exactMatch[2]}-${exactMatch[3]}`;
  }

  const flexibleMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (flexibleMatch) {
    const normalized = `${flexibleMatch[1]}-${flexibleMatch[2].padStart(2, '0')}-${flexibleMatch[3].padStart(2, '0')}`;
    console.warn('[analytics] normalized non-padded date key', { received: trimmed, normalized });
    return normalized;
  }

  const fallback = getAnalyticsDateKey(new Date());
  console.warn('[analytics] invalid analytics date key; fallback applied', { received: trimmed, fallback });
  return fallback;
}

function buildAnalyticsDateFromNormalizedKey(dateKey: string, endOfDay = false) {
  const match = dateKey.match(ANALYTICS_DATE_KEY_REGEX);
  if (!match) {
    return new Date(Number.NaN);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (endOfDay) {
    return new Date(Date.UTC(year, month - 1, day + 1, SAO_PAULO_UTC_OFFSET_HOURS - 1, 59, 59, 999));
  }

  return new Date(Date.UTC(year, month - 1, day, SAO_PAULO_UTC_OFFSET_HOURS, 0, 0, 0));
}

export function getAnalyticsDateKey(date = new Date()) {
  const { year, month, day } = getSaoPauloDateParts(date);
  return `${year}-${month}-${day}`;
}

export function analyticsDateFromKey(dateKey: string, endOfDay = false) {
  const normalizedDateKey = normalizeAnalyticsDateKey(dateKey);
  const resolvedDate = buildAnalyticsDateFromNormalizedKey(normalizedDateKey, endOfDay);

  if (isValidAnalyticsDate(resolvedDate)) {
    return resolvedDate;
  }

  const fallbackKey = getAnalyticsDateKey(new Date());
  const fallbackDate = buildAnalyticsDateFromNormalizedKey(fallbackKey, endOfDay);
  console.error('[analytics] invalid date generated from analytics key; fallback applied', {
    received: dateKey,
    normalizedDateKey,
    endOfDay,
    fallbackKey
  });
  return fallbackDate;
}

export function getAnalyticsDay(date = new Date()) {
  const safeDate = getSafeInputDate(date, 'getAnalyticsDay');
  return analyticsDateFromKey(getAnalyticsDateKey(safeDate));
}

export function addDays(date: Date, amount: number) {
  const safeDate = getSafeInputDate(date, 'addDays');
  const next = new Date(safeDate);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

export function listAnalyticsDateKeys(start: Date, end: Date) {
  const values: string[] = [];
  let cursor = analyticsDateFromKey(getAnalyticsDateKey(start));
  const limit = analyticsDateFromKey(getAnalyticsDateKey(end));

  while (cursor <= limit) {
    values.push(getAnalyticsDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return values;
}

export function parseAnalyticsRange(input: {
  range?: string;
  startDate?: string;
  endDate?: string;
}): ParsedAnalyticsRange {
  const todayKey = getAnalyticsDateKey();
  const today = analyticsDateFromKey(todayKey);
  const range = (input.range || '30d') as ViewsRange;

  if (range === 'custom') {
    const startKey = normalizeAnalyticsDateKey(input.startDate || todayKey);
    const endKey = normalizeAnalyticsDateKey(input.endDate || startKey);
    const start = analyticsDateFromKey(startKey);
    const end = analyticsDateFromKey(endKey, true);

    return {
      range,
      start,
      end,
      startKey,
      endKey
    };
  }

  const days =
    range === 'today'
      ? 1
      : range === '7d'
        ? 7
        : range === '90d'
          ? 90
          : 30;

  const start = addDays(today, -(days - 1));
  const startKey = getAnalyticsDateKey(start);

  return {
    range,
    start,
    end: analyticsDateFromKey(todayKey, true),
    startKey,
    endKey: todayKey
  };
}
