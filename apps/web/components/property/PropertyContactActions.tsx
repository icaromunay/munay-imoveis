'use client';

import { registerPropertyContactClick } from '@/lib/api';
import { getClientVisitorKey } from '@/lib/visitor-key';

type PropertyContactActionsProps = {
  slug: string;
  whatsappUrl: string;
  scheduleUrl: string;
};

async function trackAndOpen(slug: string, action: 'WHATSAPP' | 'SCHEDULE_VISIT', url: string) {
  const visitorKey = getClientVisitorKey();

  if (visitorKey) {
    await registerPropertyContactClick(slug, visitorKey, action);
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function PropertyContactActions({ slug, whatsappUrl, scheduleUrl }: PropertyContactActionsProps) {
  return (
    <div data-theme-block="cta-buttons" className="mt-8 flex flex-col gap-3 border-t pt-6" style={{ borderColor: 'var(--theme-property-border)' }}>
      <button type="button" onClick={() => trackAndOpen(slug, 'WHATSAPP', whatsappUrl)} className="btn-primary w-full justify-center">
        WhatsApp
      </button>
      <button type="button" onClick={() => trackAndOpen(slug, 'SCHEDULE_VISIT', scheduleUrl)} className="btn-secondary w-full justify-center">
        Agendar visita
      </button>
    </div>
  );
}
