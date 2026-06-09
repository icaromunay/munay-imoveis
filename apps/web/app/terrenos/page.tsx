import { PropertyCard } from '@/components/property/PropertyCard';
import { getProperties } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terrenos',
  path: '/terrenos',
  description: 'Seleção de terrenos e loteamentos disponíveis.'
});

export default async function TerrenosPage() {
  const properties = await getProperties('?category=TERRENO&limit=24');

  return (
    <section className="container-base py-20">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Terrenos</h1>
      </div>
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
