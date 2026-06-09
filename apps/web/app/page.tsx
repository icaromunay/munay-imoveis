import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import { HomePageVisitTracker } from '@/components/analytics/HomePageVisitTracker';
import { HeroSearchPanel } from '@/components/home/HeroSearchPanel';
import { HomePresentationVideo } from '@/components/home/HomePresentationVideo';
import { PropertyCarousel } from '@/components/home/PropertyCarousel';
import { PropertyCard } from '@/components/property/PropertyCard';
import { getProperties, getSettings, getTestimonials } from '@/lib/api';
import { buildMetadata, realEstateJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Munay Imóveis | Comprar e vender imóveis',
  path: '/',
  description:
    'Busca de imóveis, terrenos, lançamentos, casas e apartamentos com foco em venda de imóveis e captação de leads.'
});

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default async function HomePage() {
  const [settings, allProperties, testimonials] = await Promise.all([getSettings(), getProperties('?limit=18'), getTestimonials()]);

  const featuredProperties = allProperties.filter((property) => property.featured).slice(0, 6);
  const launches = allProperties.filter((property) => property.launch || property.status === 'LAUNCH').slice(0, 3);
  const terrenos = allProperties.filter((property) => property.category === 'TERRENO' || property.category === 'LOTEAMENTO').slice(0, 6);
  const casas = allProperties.filter((property) => property.category === 'CASA').slice(0, 6);
  const resolvedHomeVideoUrl = settings.homeVideoUrl?.trim() || settings.heroVideoUrl?.trim() || '';
  const resolvedHomeVideoTitle = settings.homeVideoTitle?.trim() || settings.heroTitle?.trim() || '';
  const resolvedHomeVideoDescription = settings.homeVideoDescription?.trim() || settings.heroSubtitle?.trim() || '';
  const resolvedHomeVideoThumbnail = settings.homeVideoThumbnailUrl?.trim() || undefined;
  const resolvedHomeVideoAutoplay = settings.homeVideoAutoplay ?? true;
  const resolvedHomeVideoMaskEnabled = settings.homeVideoMaskEnabled ?? true;
  const showHomeVideo = settings.homeVideoStatus === 'ACTIVE' && Boolean(resolvedHomeVideoUrl);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateJsonLd()) }} />
      <HomePageVisitTracker />

      {showHomeVideo ? (
        <HomePresentationVideo
          youtubeUrl={resolvedHomeVideoUrl}
          title={resolvedHomeVideoTitle}
          description={resolvedHomeVideoDescription}
          thumbnailUrl={resolvedHomeVideoThumbnail}
          autoplayEnabled={resolvedHomeVideoAutoplay}
          maskEnabled={resolvedHomeVideoMaskEnabled}
        />
      ) : null}

      <section data-theme-block="hero-home" className="hero-premium-bg relative min-h-[52svh] overflow-hidden">
        <div className="hero-noise absolute inset-0" aria-hidden="true" />
        <div className="container-base relative flex min-h-[52svh] items-center py-20 sm:py-24">
          <div className="mx-auto w-full max-w-6xl">
            <HeroSearchPanel />
          </div>
        </div>
      </section>

      <section data-theme-block="highlights" className="content-auto py-20" style={{ background: 'var(--theme-highlights-background)' }}>
        <div className="container-base">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: 'var(--theme-section-title-color)' }}>Imóveis em destaque</h2>
            <Link href="/imoveis" prefetch className="btn-secondary min-h-12 px-5 py-3 text-xs">
              Ver todos
              <ArrowRight size={16} />
            </Link>
          </div>
          <PropertyCarousel properties={featuredProperties.length ? featuredProperties : allProperties.slice(0, 6)} />
        </div>
      </section>

      <section data-theme-block="launches" className="content-auto border-t py-20" style={{ background: 'var(--theme-launches-background)', borderColor: 'var(--theme-launches-border)' }}>
        <div className="container-base">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: 'var(--theme-section-title-color)' }}>Lançamentos</h2>
            <Link href="/lancamentos" prefetch className="btn-secondary min-h-12 px-5 py-3 text-xs">
              Ver lançamentos
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(launches.length ? launches : allProperties.slice(0, 3)).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section data-theme-block="highlights" className="content-auto border-t py-20" style={{ borderColor: 'var(--theme-highlights-border)', background: 'var(--theme-highlights-background)' }}>
        <div className="container-base">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: 'var(--theme-section-title-color)' }}>Terrenos</h2>
            <Link href="/terrenos" prefetch className="btn-secondary min-h-12 px-5 py-3 text-xs">
              Ver terrenos
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(terrenos.length ? terrenos : allProperties.slice(0, 6)).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section data-theme-block="highlights" className="content-auto border-t py-20" style={{ borderColor: 'var(--theme-highlights-border)', background: 'var(--theme-highlights-background)' }}>
        <div className="container-base">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: 'var(--theme-section-title-color)' }}>Casas</h2>
            <Link href="/casas" prefetch className="btn-secondary min-h-12 px-5 py-3 text-xs">
              Ver casas
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(casas.length ? casas : allProperties.slice(0, 6)).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      <section data-theme-block="highlights" className="content-auto border-t py-20" style={{ borderColor: 'var(--theme-highlights-border)', background: 'var(--theme-highlights-background)' }}>
        <div className="container-base">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold md:text-4xl" style={{ color: 'var(--theme-section-title-color)' }}>Depoimentos</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((testimonial) => (
              <article key={testimonial.id} className="card-premium p-6">
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold" style={{ border: '1px solid var(--theme-card-border)', background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', color: 'var(--theme-accent)' }}>
                    {getInitials(testimonial.name)}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--theme-card-text-primary)' }}>{testimonial.name}</p>
                    <div className="mt-1 flex gap-1" style={{ color: 'var(--theme-accent)' }}>
                      {Array.from({ length: testimonial.rating }).map((_, index) => (
                        <Star key={index} size={15} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7" style={{ color: 'var(--theme-card-text-secondary)' }}>{testimonial.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
