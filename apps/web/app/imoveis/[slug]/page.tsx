import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Banknote,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Hash,
  Home,
  Landmark,
  Layers3,
  LucideIcon,
  MapPin,
  Ruler,
  Sparkles,
  SunMedium
} from 'lucide-react';
import { RichTextContent } from '@/components/content/RichTextContent';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyContactActions } from '@/components/property/PropertyContactActions';
import { PropertyViewTracker } from '@/components/property/PropertyViewTracker';
import { LeadForm } from '@/components/shared/LeadForm';
import { getProperty, getSettings } from '@/lib/api';
import { formatCurrency, statusLabel } from '@/lib/format';
import {
  buildPropertyMapEmbedUrl,
  buildPropertyWhatsappMessage,
  formatAreaValue,
  formatLinearMeasure,
  getPropertyFieldVisibility,
  normalizePropertyGalleryImages
} from '@/lib/property-utils';
import { buildPropertyMetadata, buildPropertySchemas, buildMetadata } from '@/lib/seo';
import { buildYoutubeEmbedUrl, parseYoutubeVideo } from '@/lib/youtube';
import { Property } from '@/lib/types';

type DetailItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  emphasize?: boolean;
};

function DetailSection({ title, items }: { title: string; items: DetailItem[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-4 border-t pt-6 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--theme-technical-border)' }}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-technical-text-primary)' }}>{title}</h2>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, var(--theme-technical-border), color-mix(in srgb, var(--theme-technical-accent) 36%, transparent), transparent)' }} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={`${item.label}-${item.value}`}
              className="rounded-[1.5rem] border p-4"
              style={{
                borderColor: item.emphasize ? 'color-mix(in srgb, var(--theme-technical-accent) 30%, transparent)' : 'var(--theme-technical-border)',
                background: item.emphasize
                  ? 'color-mix(in srgb, var(--theme-technical-accent) 10%, transparent)'
                  : 'color-mix(in srgb, var(--theme-technical-surface) 84%, transparent)'
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: item.emphasize ? 'color-mix(in srgb, var(--theme-technical-accent) 34%, transparent)' : 'var(--theme-technical-border)',
                    background: item.emphasize
                      ? 'color-mix(in srgb, var(--theme-technical-accent) 15%, transparent)'
                      : 'color-mix(in srgb, var(--theme-technical-background) 82%, transparent)',
                    color: item.emphasize ? 'var(--theme-technical-accent)' : 'var(--theme-technical-text-primary)'
                  }}
                >
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--theme-technical-text-secondary)' }}>{item.label}</p>
                  <p className="mt-1 text-sm font-medium leading-6" style={{ color: 'var(--theme-technical-text-primary)' }}>{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function buildSealLabels(property: Property) {
  const premiumFingerprint = `${property.type} ${property.title} ${property.shortDescription}`;
  const isHighEnd = /alto padrão|alto padrao|premium|luxo/i.test(premiumFingerprint);
  const isOpportunity = Number(property.promotionalPrice || 0) > 0 && Number(property.promotionalPrice) < Number(property.price || 0);

  return [
    property.featured ? 'Destaque' : null,
    property.status === 'LAUNCH' || property.launch ? 'Lançamento' : null,
    isHighEnd ? 'Alto padrão' : null,
    isOpportunity ? 'Oportunidade' : null,
    property.acceptsBankFinancing ? 'Financiável' : null,
    property.acceptsCar ? 'Aceita carro' : null,
    property.acceptsDirectInstallments || property.hasDevelopmentInstallments ? 'Parcela direto' : null,
    property.acceptsExchange ? 'Aceita permuta' : null
  ].filter(Boolean) as string[];
}

function buildCommercialHighlights(property: Property) {
  return [
    property.acceptsBankFinancing ? 'Aceita financiamento bancário' : null,
    property.acceptsFgts ? 'Aceita FGTS' : null,
    property.acceptsExchange ? 'Aceita permuta' : null,
    property.acceptsProposal ? 'Estuda proposta' : null,
    property.acceptsCar ? 'Aceita carro' : null,
    property.acceptsDirectInstallments ? 'Parcela direto sem banco' : null,
    property.hasDevelopmentInstallments ? 'Parcela direto com a loteadora' : null
  ].filter(Boolean) as string[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return buildMetadata({
      title: 'Imóvel não encontrado',
      path: `/imovel/${slug}`
    });
  }

  return buildPropertyMetadata(property);
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) {
    notFound();
  }

  const settings = await getSettings();
  const parsedVideo = property.youtubeLink ? parseYoutubeVideo(property.youtubeLink) : null;
  const propertyVideoEmbedUrl = parsedVideo
    ? buildYoutubeEmbedUrl(parsedVideo.videoId, {
        controls: true,
        modestBranding: true,
        rel: false
      })
    : null;
  const mapPreviewUrl = buildPropertyMapEmbedUrl(property);
  const galleryImages = normalizePropertyGalleryImages(property);
  const whatsappInfoMessage = buildPropertyWhatsappMessage(property, 'informacoes');
  const whatsappVisitMessage = buildPropertyWhatsappMessage(property, 'agendar-visita');
  const visibility = getPropertyFieldVisibility(property.type, property.category);
  const displayPrice = property.promotionalPrice || property.price;
  const hasDiscount = Number(property.promotionalPrice || 0) > 0 && Number(property.promotionalPrice) < Number(property.price || 0);
  const sealLabels = buildSealLabels(property);
  const commercialHighlights = buildCommercialHighlights(property);
  const hasEqualTerrainDepths =
    visibility.showTerrainDimensions &&
    property.landDepthLeft != null &&
    property.landDepthRight != null &&
    property.landDepthLeft === property.landDepthRight;

  const generalItems: DetailItem[] = [
    { label: 'Valor', value: formatCurrency(displayPrice), icon: Banknote, emphasize: true },
    { label: 'Cidade', value: property.city, icon: MapPin },
    { label: 'Bairro', value: property.district, icon: MapPin },
    { label: 'Estado', value: property.state, icon: MapPin },
    { label: 'Código do imóvel', value: property.propertyCode, icon: Hash },
    { label: 'Tipo do imóvel', value: property.type, icon: Building2 }
  ].filter((item) => Boolean(item.value));

  const areaItems: DetailItem[] = [
    visibility.showLandArea && property.landArea ? { label: 'Área do terreno', value: formatAreaValue(property.landArea), icon: Ruler } : null,
    visibility.showBuiltArea && property.builtArea ? { label: 'Área construída', value: formatAreaValue(property.builtArea), icon: Ruler } : null,
    visibility.isTerrain && !property.landArea && property.area ? { label: 'Área do terreno', value: formatAreaValue(property.area), icon: Ruler } : null,
    visibility.isDevelopment && property.lotsMinArea ? { label: 'Área mínima dos lotes', value: formatAreaValue(property.lotsMinArea), icon: Ruler } : null,
    visibility.isDevelopment && property.lotsMaxArea ? { label: 'Área máxima dos lotes', value: formatAreaValue(property.lotsMaxArea), icon: Ruler } : null
  ].filter(Boolean) as DetailItem[];

  const characteristicItems: DetailItem[] = [
    visibility.showRooms && property.bedrooms != null ? { label: 'Quartos', value: String(property.bedrooms), icon: BedDouble } : null,
    visibility.showRooms && property.bathrooms != null ? { label: 'Banheiros', value: String(property.bathrooms), icon: Bath } : null,
    visibility.showRooms && property.suites != null ? { label: 'Suítes', value: String(property.suites), icon: Sparkles } : null,
    visibility.showRooms && property.garage != null ? { label: 'Vagas de garagem', value: String(property.garage), icon: CarFront } : null,
    visibility.showFloor && property.floor != null ? { label: 'Andar', value: String(property.floor), icon: Layers3 } : null,
    visibility.showElevator ? { label: 'Elevador', value: property.hasElevator ? 'Sim' : 'Não', icon: Building2 } : null,
    visibility.showSolarPosition && property.solarPosition ? { label: 'Posição solar', value: property.solarPosition, icon: SunMedium } : null,
    visibility.showConstructionYear && property.constructionYear ? { label: 'Ano de construção', value: String(property.constructionYear), icon: CalendarDays } : null
  ].filter(Boolean) as DetailItem[];

  const ediculeItems: DetailItem[] = visibility.showEdicule
    ? [
        { label: 'Possui edícula', value: property.hasEdicule ? 'Sim' : 'Não', icon: Home },
        property.hasEdicule && property.ediculeArea ? { label: 'Área da edícula', value: formatAreaValue(property.ediculeArea), icon: Ruler } : null,
        property.hasEdicule && property.ediculeBedrooms != null ? { label: 'Quartos da edícula', value: String(property.ediculeBedrooms), icon: BedDouble } : null,
        property.hasEdicule && property.ediculeBathrooms != null ? { label: 'Banheiros da edícula', value: String(property.ediculeBathrooms), icon: Bath } : null,
        property.hasEdicule && property.ediculeHasLivingRoom ? { label: 'Possui sala', value: 'Sim', icon: Home } : null,
        property.hasEdicule && property.ediculeHasKitchen ? { label: 'Possui cozinha', value: 'Sim', icon: Home } : null
      ].filter(Boolean) as DetailItem[]
    : [];

  const commercialItems: DetailItem[] = [
    property.acceptsBankFinancing ? { label: 'Aceita financiamento bancário', value: 'Sim', icon: Landmark, emphasize: true } : null,
    property.acceptsFgts ? { label: 'Aceita FGTS', value: 'Sim', icon: Landmark, emphasize: true } : null,
    property.acceptsCar ? { label: 'Aceita carro', value: 'Sim', icon: CheckCircle2, emphasize: true } : null,
    property.acceptsExchange ? { label: 'Aceita permuta', value: 'Sim', icon: CheckCircle2, emphasize: true } : null,
    property.acceptsProposal ? { label: 'Estuda proposta', value: 'Sim', icon: CheckCircle2, emphasize: true } : null,
    property.acceptsDirectInstallments
      ? {
          label: 'Parcelamento direto',
          value: property.maxDirectInstallments ? `Sim · até ${property.maxDirectInstallments} vezes` : 'Sim',
          icon: Landmark,
          emphasize: true
        }
      : null,
    property.hasDevelopmentInstallments
      ? {
          label: 'Parcelamento com a loteadora',
          value: property.developmentMaxInstallments ? `Sim · até ${property.developmentMaxInstallments} vezes` : 'Sim',
          icon: Landmark,
          emphasize: true
        }
      : null
  ].filter(Boolean) as DetailItem[];

  const terrainItems: DetailItem[] = visibility.isTerrain
    ? [
        property.landFrontage ? { label: 'Frente', value: formatLinearMeasure(property.landFrontage), icon: Ruler } : null,
        hasEqualTerrainDepths && property.landDepthLeft
          ? { label: 'Profundidade', value: formatLinearMeasure(property.landDepthLeft), icon: Ruler }
          : null,
        !hasEqualTerrainDepths && property.landDepthLeft
          ? { label: 'Profundidade lado esquerdo', value: formatLinearMeasure(property.landDepthLeft), icon: Ruler }
          : null,
        !hasEqualTerrainDepths && property.landDepthRight
          ? { label: 'Profundidade lado direito', value: formatLinearMeasure(property.landDepthRight), icon: Ruler }
          : null,
        property.hasPaving ? { label: 'Pavimentação', value: 'Sim', icon: CheckCircle2 } : null,
        property.hasElectricity ? { label: 'Energia elétrica', value: 'Sim', icon: CheckCircle2 } : null,
        property.hasWaterNetwork ? { label: 'Rede de água', value: 'Sim', icon: CheckCircle2 } : null,
        property.readyToBuild ? { label: 'Liberado para construir', value: 'Sim', icon: CheckCircle2 } : null
      ].filter(Boolean) as DetailItem[]
    : [];

  const developmentItems: DetailItem[] = visibility.isDevelopment
    ? [
        property.lotsQuantity ? { label: 'Quantidade de lotes', value: String(property.lotsQuantity), icon: Layers3 } : null,
        property.developmentInfrastructure ? { label: 'Infraestrutura disponível', value: property.developmentInfrastructure, icon: Building2 } : null,
        property.developmentHasPaving ? { label: 'Pavimentação', value: 'Sim', icon: CheckCircle2 } : null,
        property.developmentHasElectricity ? { label: 'Rede elétrica', value: 'Sim', icon: CheckCircle2 } : null,
        property.developmentHasWaterNetwork ? { label: 'Rede de água', value: 'Sim', icon: CheckCircle2 } : null,
        property.readyToBuild ? { label: 'Liberado para construir', value: 'Sim', icon: CheckCircle2 } : null,
        property.hasDevelopmentInstallments
          ? {
              label: 'Parcela direto com a loteadora',
              value: property.developmentMaxInstallments ? `Sim · até ${property.developmentMaxInstallments} vezes` : 'Sim',
              icon: Landmark,
              emphasize: true
            }
          : null,
        property.acceptsBankFinancing ? { label: 'Aceita financiamento bancário', value: 'Sim', icon: Landmark, emphasize: true } : null
      ].filter(Boolean) as DetailItem[]
    : [];

  const schemas = buildPropertySchemas(property);

  return (
    <div data-theme-block="property-page" className="container-base py-16" style={{ color: 'var(--theme-property-text-primary)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.listing) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.place) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.offer) }} />
      {schemas.residence ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.residence) }} /> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas.breadcrumb) }} />
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.35em]" style={{ color: 'var(--theme-property-accent)' }}>{statusLabel[property.status]}</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold md:text-6xl" style={{ color: 'var(--theme-property-text-primary)' }}>{property.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8" style={{ color: 'var(--theme-property-text-secondary)' }}>{property.shortDescription}</p>

          {sealLabels.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {sealLabels.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border px-4 py-2 text-sm font-medium backdrop-blur"
                  style={{
                    borderColor: 'var(--theme-property-border)',
                    background: 'color-mix(in srgb, var(--theme-property-surface) 76%, transparent)',
                    color: 'var(--theme-property-text-primary)'
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {propertyVideoEmbedUrl ? (
            <div className="mt-8 theme-surface-property overflow-hidden p-2 sm:p-3">
              <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-black/30">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={propertyVideoEmbedUrl}
                  title={`Vídeo do imóvel ${property.title}`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          <PropertyGallery images={galleryImages} title={property.title} />
        </div>

        <div className="space-y-6">
          <div className="theme-surface-property p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--theme-property-border)' }}>
              <div>
                <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--theme-property-text-secondary)' }}>Valor</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <p className="text-4xl font-semibold" style={{ color: 'var(--theme-property-text-primary)' }}>{formatCurrency(displayPrice)}</p>
                  {hasDiscount ? <span className="text-base line-through" style={{ color: 'var(--theme-property-text-secondary)' }}>{formatCurrency(property.price)}</span> : null}
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm" style={{ color: 'var(--theme-property-text-secondary)' }}>
                  <MapPin size={16} style={{ color: 'var(--theme-property-accent)' }} />
                  {property.district} • {property.city} • {property.state}
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <PropertyViewTracker slug={property.slug} initialCount={property.viewCount} />
                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium" style={{ borderColor: 'var(--theme-property-border)', background: 'color-mix(in srgb, var(--theme-property-surface) 78%, transparent)', color: 'var(--theme-property-text-primary)' }}>
                  <Hash size={15} style={{ color: 'var(--theme-property-accent)' }} />
                  {property.propertyCode}
                </span>
              </div>
            </div>

            {commercialHighlights.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {commercialHighlights.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: 'color-mix(in srgb, var(--theme-property-accent) 24%, transparent)', background: 'color-mix(in srgb, var(--theme-property-accent) 10%, transparent)', color: 'var(--theme-property-text-primary)' }}>
                    <CheckCircle2 size={15} style={{ color: 'var(--theme-property-accent)' }} />
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 space-y-6">
              <DetailSection title="Informações gerais" items={generalItems} />
              <DetailSection title="Áreas" items={areaItems} />
              <DetailSection title="Características" items={characteristicItems} />
              <DetailSection title="Possui edícula" items={ediculeItems} />
              <DetailSection title="Condições comerciais" items={commercialItems} />
              {visibility.isTerrain ? <DetailSection title="Estrutura do terreno" items={terrainItems} /> : null}
              {visibility.isDevelopment ? <DetailSection title="Estrutura do empreendimento" items={developmentItems} /> : null}
            </div>

            <PropertyContactActions
              slug={property.slug}
              whatsappUrl={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappInfoMessage)}`}
              scheduleUrl={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappVisitMessage)}`}
            />
          </div>

          <div className="theme-surface-institutional p-8">
            <h2 className="text-2xl font-semibold" style={{ color: 'var(--theme-institutional-text-primary)' }}>Descrição completa</h2>
            <RichTextContent html={property.fullDescription} className="mt-4" />
          </div>

          <div id="lead-form">
            <LeadForm
              propertyId={property.id}
              interest={property.title}
              pageOrigin={`imovel-${property.slug}`}
              whatsappConfig={{
                phone: settings.whatsappNumber,
                propertyTitle: property.title,
                propertyCode: property.propertyCode,
                propertySlug: property.slug,
                propertyCity: property.city,
                propertyDistrict: property.district
              }}
            />
          </div>
        </div>
      </div>

      <section className="mt-20">
        <div className="theme-surface-property p-4 md:p-5">
          {property.googleMapsLink ? (
            <a href={property.googleMapsLink} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[1.75rem] border transition" style={{ borderColor: 'var(--theme-property-border)', background: 'color-mix(in srgb, var(--theme-property-surface) 84%, transparent)' }}>
              <div className="relative h-[320px] md:h-[400px] xl:h-[500px]">
                <iframe
                  src={mapPreviewUrl}
                  className="pointer-events-none h-full w-full"
                  scrolling="no"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Mapa do imóvel ${property.title}`}
                />
                <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-3 rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] backdrop-blur" style={{ background: 'color-mix(in srgb, var(--theme-property-background) 84%, transparent)', color: 'var(--theme-property-text-primary)' }}>
                  <span>Mapa do imóvel</span>
                  <span style={{ color: 'var(--theme-property-accent)' }}>Abrir mapa</span>
                </div>
              </div>
              <div className="p-4 text-sm" style={{ color: 'var(--theme-property-text-secondary)' }}>
                <p className="font-medium" style={{ color: 'var(--theme-property-text-primary)' }}>Abrir localização no mapa</p>
                <p className="mt-1">Visualize o ponto aproximado e abra o Google Maps em uma nova aba.</p>
              </div>
            </a>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center text-center md:min-h-[400px] xl:min-h-[500px]" style={{ color: 'var(--theme-property-text-secondary)' }}>
              <p>Estrutura preparada para mapa interativo com latitude e longitude do imóvel.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-3xl font-semibold" style={{ color: 'var(--theme-section-title-color)' }}>Imóveis relacionados</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {property.related.map((item) => (
            <PropertyCard key={item.id} property={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
