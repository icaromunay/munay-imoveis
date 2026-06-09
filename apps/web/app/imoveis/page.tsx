import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { HeroSearchPanel } from '@/components/home/HeroSearchPanel';
import { getProperties } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Todos os imóveis',
  path: '/imoveis',
  description: 'Busca inteligente para imóveis, casas, apartamentos, áreas comerciais e oportunidades premium.'
});

function parsePriceRange(priceRange?: string) {
  if (!priceRange) return { minPrice: '', maxPrice: '' };
  const [min, max] = priceRange.split('-');
  return { minPrice: min || '', maxPrice: max || '' };
}

function buildQuery(searchParams: Record<string, string | string[] | undefined>) {
  const category = typeof searchParams.category === 'string' ? searchParams.category : '';
  const city = typeof searchParams.city === 'string' ? searchParams.city : '';
  const district = typeof searchParams.district === 'string' ? searchParams.district : '';
  const legacyLocation = typeof searchParams.location === 'string' ? searchParams.location : '';
  const propertyCode = typeof searchParams.propertyCode === 'string' ? searchParams.propertyCode : '';
  const objective = typeof searchParams.objective === 'string' ? searchParams.objective : '';
  const priceRange = typeof searchParams.priceRange === 'string' ? searchParams.priceRange : '';
  const { minPrice, maxPrice } = parsePriceRange(priceRange);
  const params = new URLSearchParams();

  if (category && category !== 'CONDOMINIO') params.set('category', category);
  if (category === 'CONDOMINIO') params.set('type', 'Condomínio');
  if (city) params.set('city', city);
  if (district) params.set('district', district);
  if (!city && !district && legacyLocation) params.set('search', legacyLocation);
  if (propertyCode) params.set('propertyCode', propertyCode);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  params.set('limit', '12');

  return {
    apiQuery: `?${params.toString()}`,
    objective,
    locationLabel: district ? `${city} • ${district}` : city || legacyLocation,
    category,
    priceRange,
    propertyCode
  };
}

export default async function ImoveisPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const { apiQuery, objective, locationLabel, category, priceRange, propertyCode } = buildQuery(resolvedSearchParams);
  const properties = await getProperties(apiQuery);
  const hasFilters = Boolean(locationLabel || category || priceRange || objective || propertyCode);

  return (
    <section data-theme-block="institutional-pages" className="container-base py-20">
      <SectionHeader
        eyebrow="Imóveis"
        title="Busca inteligente para imóveis, casas, apartamentos e áreas comerciais"
        subtitle="Experiência de portal com busca premium, leitura imediata de oportunidades e estrutura pronta para filtros avançados por cidade, bairro, valor, status e perfil de compra."
      />

      <HeroSearchPanel compact />

      {hasFilters ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {locationLabel ? <span className="theme-chip-soft px-4 py-2 text-sm" style={{ color: 'var(--theme-card-text-primary)' }}>Local: {locationLabel}</span> : null}
          {propertyCode ? <span className="theme-chip-soft px-4 py-2 text-sm" style={{ color: 'var(--theme-card-text-primary)' }}>Código: {propertyCode}</span> : null}
          {category ? <span className="theme-chip-soft px-4 py-2 text-sm" style={{ color: 'var(--theme-card-text-primary)' }}>Tipo: {category}</span> : null}
          {priceRange ? <span className="theme-chip-soft px-4 py-2 text-sm" style={{ color: 'var(--theme-card-text-primary)' }}>Faixa: {priceRange}</span> : null}
          {objective ? <span className="theme-chip-soft px-4 py-2 text-sm" style={{ color: 'var(--theme-card-text-primary)' }}>Objetivo: {objective}</span> : null}
        </div>
      ) : null}

      {properties.length ? (
        <div className="mt-10 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="theme-surface-institutional mt-10 p-10 text-center" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
          Nenhuma oportunidade encontrada com os filtros atuais. Ajuste a busca e tente novamente.
        </div>
      )}
    </section>
  );
}
