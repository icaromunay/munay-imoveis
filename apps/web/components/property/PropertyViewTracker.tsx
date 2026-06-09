'use client';

import { useEffect } from 'react';
import { registerPropertyView } from '@/lib/api';
import { getClientVisitorKey } from '@/lib/visitor-key';

export function PropertyViewTracker({ slug }: { slug: string; initialCount?: number | null }) {
  useEffect(() => {
    const visitorKey = getClientVisitorKey();
    if (!visitorKey) return;

    let cancelled = false;

    registerPropertyView(slug, visitorKey).catch(() => {
      if (!cancelled) return undefined;
      return undefined;
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return null;
}
