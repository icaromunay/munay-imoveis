import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getProperties } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Empreendimentos premium',
  path: '/empreendimentos',
  description: 'Explore loteamentos e empreendimentos premium com forte potencial de valorização e apresentação profissional.'
});

export default async function EmpreendimentosPage() {
  const properties = await getProperties('?category=LOTEAMENTO&limit=12');

  return (
    <section className="container-base py-20">
      <SectionHeader
        eyebrow="Empreendimentos"
        title="Loteamentos e projetos planejados para alta valorização"
        subtitle="Explore empreendimentos com infraestrutura, documentação segura e apresentação premium."
      />
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
