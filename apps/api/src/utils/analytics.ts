const SAO_PAULO_OFFSET = '-03:00';

type ViewsRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export type ParsedAnalyticsRange = {
  range: ViewsRange;
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
};

function formatPart(date: Date, part: 'year' | 'month' | 'day') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    [part]: 'numeric',
    ...(part !== 'year' ? { minimumIntegerDigits: 2 } : {})
  } as Intl.DateTimeFormatOptions).format(date);
}

export function getAnalyticsDateKey(date = new Date()) {
  const year = formatPart(date, 'year');
  const month = formatPart(date, 'month');
  const day = formatPart(date, 'day');
  return `${year}-${month}-${day}`;
}

export function analyticsDateFromKey(dateKey: string, endOfDay = false) {
  return new Date(`${dateKey}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${SAO_PAULO_OFFSET}`);
}

export function getAnalyticsDay(date = new Date()) {
  return analyticsDateFromKey(getAnalyticsDateKey(date));
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
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
    const startKey = input.startDate || todayKey;
    const endKey = input.endDate || startKey;
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
