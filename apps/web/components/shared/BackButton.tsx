'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ fallbackHref = '/' }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
          return;
        }

        router.push(fallbackHref);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3 font-semibold text-white transition hover:border-brand-gold/35 hover:bg-white/5"
    >
      <ArrowLeft size={16} />
      Voltar
    </button>
  );
}
