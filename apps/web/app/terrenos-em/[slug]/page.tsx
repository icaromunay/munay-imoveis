import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LeadForm } from '@/components/shared/LeadForm';
import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getProperties } from '@/lib/api';
import { buildMetadata } from '@/lib/seo';
import { citySlugToName, featuredCities } from '@/lib/locations';

export async function generateStaticParams() {
  return featuredCities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = citySlugToName(slug);

  return buildMetadata({
    title: `Terrenos em ${city}`,
    path: `/terrenos-em/${slug}`,
    description: `Página otimizada para SEO local com terrenos em ${city}, foco em valorização patrimonial, investidores e oportunidades premium.`
  });
}

export default async function TerrenosPorCidadePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = citySlugToName(slug);
  const properties = await getProperties(`?category=TERRENO&search=${encodeURIComponent(city)}&limit=12`);

  if (!properties.length) {
    notFound();
  }

  return (
    <section className="container-base py-20">
      <SectionHeader
        eyebrow="SEO local"
        title={`Terrenos em ${city} para quem busca valorização antes do movimento do mercado`}
        subtitle={`Página local preparada para Google, com narrativa premium, foco em busca regional e geração de leads para terrenos em ${city}.`}
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-8 md:grid-cols-2">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        <div className="space-y-6">
          <div className="card-premium p-8 text-zinc-300">
            <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Mercado local</p>
            <h2 className="mt-4 text-3xl font-semibold text-white">Curadoria de terrenos em {city}</h2>
            <p className="mt-4 leading-8">
              Estrutura local pensada para capturar buscas geográficas, reforçar autoridade regional e transformar procura orgânica em contato comercial qualificado.
            </p>
          </div>
          <LeadForm pageOrigin={`seo-${slug}`} interest={`Terrenos em ${city}`} />
        </div>
      </div>
    </section>
  );
}
