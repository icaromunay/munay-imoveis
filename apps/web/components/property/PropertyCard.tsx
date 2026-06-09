'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, Banknote, Bath, BedDouble, CarFront, CheckCircle2, Hash, Home, ImageOff, Layers3, MapPin, Ruler, Sparkles } from 'lucide-react';
import { Property } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { getPropertyThumbnailUrl } from '@/lib/image';
import { formatAreaValue, formatLinearMeasure, getPropertyDetailPath, getPropertyFieldVisibility } from '@/lib/property-utils';

type CardMetric = {
  icon: ComponentType<{ className?: string; size?: string | number }>;
  label: string;
  value: string;
};

function hasMeaningfulNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function buildSealLabels(property: Property) {
  const premiumFingerprint = `${property.type} ${property.title} ${property.shortDescription}`;
  const isHighEnd = /alto padrão|alto padrao|premium|luxo/i.test(premiumFingerprint);
  const isOpportunity = Number(property.promotionalPrice || 0) > 0 && Number(property.promotionalPrice) < Number(property.price || 0);

  return [
    property.featured ? 'DESTAQUE' : null,
    property.status === 'LAUNCH' || property.launch ? 'LANÇAMENTO' : null,
    isHighEnd ? 'ALTO PADRÃO' : null,
    isOpportunity ? 'OPORTUNIDADE' : null
  ].filter(Boolean) as string[];
}

function buildCardMetrics(property: Property): CardMetric[] {
  const visibility = getPropertyFieldVisibility(property.type, property.category);
  const metrics: CardMetric[] = [];

  if (visibility.isDevelopment) {
    if (hasMeaningfulNumber(property.lotsMinArea)) {
      metrics.push({ icon: Ruler, label: 'Lotes a partir de', value: formatAreaValue(property.lotsMinArea) });
    }
    if (hasMeaningfulNumber(property.lotsMaxArea)) {
      metrics.push({ icon: Ruler, label: 'Lote máximo', value: formatAreaValue(property.lotsMaxArea) });
    }
    if (hasMeaningfulNumber(property.lotsQuantity)) {
      metrics.push({ icon: Layers3, label: 'Quantidade de lotes', value: `${property.lotsQuantity} lotes` });
    }
    if (property.readyToBuild) {
      metrics.push({ icon: CheckCircle2, label: 'Aceita construção', value: 'Sim' });
    }
    if (property.developmentHasPaving) {
      metrics.push({ icon: CheckCircle2, label: 'Pavimentação', value: 'Sim' });
    }
    if (property.developmentHasWaterNetwork) {
      metrics.push({ icon: CheckCircle2, label: 'Rede de água', value: 'Sim' });
    }

    return metrics.slice(0, 6);
  }

  if (visibility.isTerrain) {
    if (hasMeaningfulNumber(property.landArea || property.area)) {
      metrics.push({ icon: Ruler, label: 'Área do terreno', value: formatAreaValue(property.landArea || property.area) });
    }
    if (hasMeaningfulNumber(property.landFrontage)) {
      metrics.push({ icon: Ruler, label: 'Frente', value: formatLinearMeasure(property.landFrontage) });
    }
    if (hasMeaningfulNumber(property.landDepthLeft) && hasMeaningfulNumber(property.landDepthRight)) {
      metrics.push({
        icon: Ruler,
        label: 'Profundidade',
        value:
          property.landDepthLeft === property.landDepthRight
            ? formatLinearMeasure(property.landDepthLeft)
            : `${formatLinearMeasure(property.landDepthLeft)} • ${formatLinearMeasure(property.landDepthRight)}`
      });
    } else if (hasMeaningfulNumber(property.landDepthLeft || property.landDepthRight)) {
      metrics.push({ icon: Ruler, label: 'Profundidade', value: formatLinearMeasure(property.landDepthLeft || property.landDepthRight) });
    }
    if (property.readyToBuild) {
      metrics.push({ icon: CheckCircle2, label: 'Aceita construção', value: 'Sim' });
    }

    return metrics.slice(0, 6);
  }

  if (visibility.isApartment) {
    if (hasMeaningfulNumber(property.builtArea || property.area)) {
      metrics.push({ icon: Ruler, label: 'Área privativa', value: formatAreaValue(property.builtArea || property.area) });
    }
    if (hasMeaningfulNumber(property.bedrooms)) {
      metrics.push({ icon: BedDouble, label: 'Quartos', value: `${property.bedrooms}` });
    }
    if (hasMeaningfulNumber(property.bathrooms)) {
      metrics.push({ icon: Bath, label: 'Banheiros', value: `${property.bathrooms}` });
    }
    if (hasMeaningfulNumber(property.suites)) {
      metrics.push({ icon: Sparkles, label: 'Suítes', value: `${property.suites}` });
    }
    if (hasMeaningfulNumber(property.garage)) {
      metrics.push({ icon: CarFront, label: 'Vagas', value: `${property.garage}` });
    }
    if (hasMeaningfulNumber(property.floor)) {
      metrics.push({ icon: Layers3, label: 'Andar', value: `${property.floor}` });
    }

    return metrics.slice(0, 6);
  }

  if (hasMeaningfulNumber(property.builtArea || property.area)) {
    metrics.push({ icon: Ruler, label: 'Área construída', value: formatAreaValue(property.builtArea || property.area) });
  }
  if (hasMeaningfulNumber(property.bedrooms)) {
    metrics.push({ icon: BedDouble, label: 'Quartos', value: `${property.bedrooms}` });
  }
  if (hasMeaningfulNumber(property.bathrooms)) {
    metrics.push({ icon: Bath, label: 'Banheiros', value: `${property.bathrooms}` });
  }
  if (hasMeaningfulNumber(property.suites)) {
    metrics.push({ icon: Sparkles, label: 'Suítes', value: `${property.suites}` });
  }
  if (hasMeaningfulNumber(property.garage)) {
    metrics.push({ icon: CarFront, label: 'Garagem', value: `${property.garage}` });
  }
  if (property.hasEdicule) {
    metrics.push({ icon: Home, label: 'Possui Edícula', value: 'Sim' });
  }

  return metrics.slice(0, 6);
}

function buildImageCandidates(property: Property) {
  const rawCandidates = [
    property.coverImage,
    property.images?.[0]?.url,
    property.images?.[1]?.url
  ].filter(Boolean) as string[];

  const candidates = rawCandidates.flatMap((url) => {
    const optimized = getPropertyThumbnailUrl(url);
    return optimized && optimized !== url ? [optimized, url] : [url];
  });

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function PropertyCard({ property }: { property: Property }) {
  const sealLabels = buildSealLabels(property);
  const metrics = buildCardMetrics(property);
  const displayPrice = property.promotionalPrice || property.price;
  const hasDiscount = Number(property.promotionalPrice || 0) > 0 && Number(property.promotionalPrice) < Number(property.price || 0);
  const locationLabel = [property.city, property.district].filter(Boolean).join(' • ');
  const imageCandidates = useMemo(() => buildImageCandidates(property), [property]);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [property.id, property.coverImage, property.images]);

  const currentImageSrc = imageCandidates[imageIndex] || '';

  return (
    <article data-theme-block="property-cards" className="theme-property-card group">
      <Link href={getPropertyDetailPath(property)} className="absolute inset-0 z-10" aria-label={`Abrir imóvel ${property.title}`}>
        <span className="sr-only">Abrir imóvel {property.title}</span>
      </Link>

      <div className="relative h-[320px] overflow-hidden" style={{ background: 'radial-gradient(circle at top, color-mix(in srgb, var(--theme-accent) 18%, transparent), transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--theme-card-background) 80%, #13241b), var(--theme-property-background))' }}>
        {currentImageSrc ? (
          <img
            src={currentImageSrc}
            alt={property.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-[1100ms] group-hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={() => setImageIndex((current) => current + 1)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center" style={{ color: 'var(--theme-card-text-secondary)' }}>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border" style={{ borderColor: 'var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-card-background) 82%, transparent)' }}>
              <ImageOff size={24} style={{ color: 'var(--theme-accent)' }} />
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-card-text-primary)' }}>Imagem em atualização</p>
              <p className="mt-1 text-xs">A miniatura deste imóvel será exibida assim que houver foto válida cadastrada.</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top, color-mix(in srgb, var(--theme-accent) 14%, transparent), transparent 24%), linear-gradient(180deg, rgba(8,17,13,0.04), rgba(8,17,13,0.7))' }} />
        {sealLabels.length ? (
          <div className="absolute left-5 top-5 z-20 flex max-w-[84%] flex-wrap gap-2">
            {sealLabels.map((badge) => (
              <span
                key={badge}
                className="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.26em] backdrop-blur-xl"
                style={{ border: '1px solid var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-property-background) 78%, transparent)', color: 'var(--theme-card-text-primary)' }}
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-semibold md:text-[1.8rem]" style={{ color: 'var(--theme-card-text-primary)' }}>{property.title}</h3>
          {locationLabel ? (
            <p className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--theme-card-text-secondary)' }}>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ border: '1px solid var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-card-background) 74%, transparent)' }}>
                <MapPin size={15} style={{ color: 'var(--theme-accent)' }} />
                {locationLabel}
              </span>
            </p>
          ) : null}
          {property.propertyCode ? (
            <p className="flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--theme-card-text-secondary)' }}>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5" style={{ border: '1px solid var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-card-background) 74%, transparent)' }}>
                <Hash size={15} style={{ color: 'var(--theme-accent)' }} />
                {property.propertyCode}
              </span>
            </p>
          ) : null}
        </div>

        <p className="text-sm leading-6" style={{ color: 'var(--theme-card-text-secondary)' }}>{property.shortDescription}</p>

        {metrics.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div key={`${metric.label}-${metric.value}`} className="flex items-start gap-3 rounded-[1.35rem] p-3 text-sm" style={{ border: '1px solid var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-card-background) 78%, transparent)', color: 'var(--theme-card-text-secondary)' }}>
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)', background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', color: 'var(--theme-accent)' }}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--theme-card-text-secondary)' }}>{metric.label}</p>
                    <p className="mt-1 font-medium" style={{ color: 'var(--theme-card-text-primary)' }}>{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-4 border-t pt-5" style={{ borderColor: 'var(--theme-card-border)' }}>
          <div>
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--theme-card-text-secondary)' }}>Valor do imóvel</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="inline-flex items-center gap-2 text-2xl font-semibold" style={{ color: 'var(--theme-card-text-primary)' }}>
                <Banknote size={22} style={{ color: 'var(--theme-accent)' }} />
                {property.category === 'LOTEAMENTO' ? `A partir de ${formatCurrency(displayPrice)}` : formatCurrency(displayPrice)}
              </p>
              {hasDiscount ? <span className="text-sm line-through" style={{ color: 'var(--theme-card-text-secondary)' }}>{formatCurrency(property.price)}</span> : null}
            </div>
          </div>

          <div className="pointer-events-none inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 25%, transparent)', background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', color: 'var(--theme-accent)' }}>
            Abrir imóvel
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </article>
  );
}
