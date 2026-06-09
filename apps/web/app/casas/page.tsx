import { PropertyCard } from '@/components/property/PropertyCard';
import { getProperties } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Casas',
  path: '/casas',
  description: 'Seleção de casas disponíveis com foto, descrição técnica resumida e acesso rápido aos detalhes.'
});

export default async function CasasPage() {
  const properties = await getProperties('?category=CASA&limit=24');

  return (
    <section className="container-base py-20">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">Casas</h1>
      </div>

      {properties.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-zinc-300">
          Nenhuma casa disponível no momento.
        </div>
      )}
    </section>
  );
}
