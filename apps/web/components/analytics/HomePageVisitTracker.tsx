'use client';

import { useEffect } from 'react';
import { registerHomeVisit } from '@/lib/api';
import { getClientVisitorKey } from '@/lib/visitor-key';

export function HomePageVisitTracker() {
  useEffect(() => {
    const visitorKey = getClientVisitorKey();
    if (!visitorKey) return;

    void registerHomeVisit(visitorKey);
  }, []);

  return null;
}
