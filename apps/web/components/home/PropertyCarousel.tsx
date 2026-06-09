'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Property } from '@/lib/types';
import { PropertyCard } from '@/components/property/PropertyCard';

export function PropertyCarousel({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const amount = Math.min(containerRef.current.clientWidth * 0.9, 420);
    containerRef.current.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => scrollByAmount('left')}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-brand-gold hover:text-brand-gold"
          aria-label="Voltar imóveis"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount('right')}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-brand-gold hover:text-brand-gold"
          aria-label="Avançar imóveis"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {properties.map((property) => (
          <div key={property.id} className="min-w-[86vw] snap-start sm:min-w-[420px] lg:min-w-[430px] xl:min-w-[440px]">
            <PropertyCard property={property} />
          </div>
        ))}
      </div>
    </div>
  );
}
