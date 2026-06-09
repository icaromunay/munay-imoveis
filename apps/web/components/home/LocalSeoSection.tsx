import Link from 'next/link';
import { featuredCities } from '@/lib/locations';

export function LocalSeoSection() {
  return (
    <section className="py-24">
      <div className="container-base">
        <div className="mb-12 max-w-3xl">
          <p className="inline-flex rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-2 text-[11px] uppercase tracking-[0.34em] text-brand-gold">
            Regiões atendidas
          </p>
          <h2 className="mt-5 text-balance text-4xl font-semibold text-white md:text-5xl">Descubra oportunidades por cidade com foco em valorização e liquidez</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Explore páginas dedicadas a cidades estratégicas para identificar terrenos, loteamentos e imóveis com leitura comercial mais objetiva.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredCities.map((city) => (
            <Link key={city.slug} href={`/terrenos-em/${city.slug}`} className="card-premium group p-6 transition duration-300 hover:border-brand-gold/40">
              <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Oportunidade regional</p>
              <h3 className="mt-3 text-2xl font-semibold text-white transition group-hover:text-brand-gold">Terrenos em {city.name}</h3>
              <p className="mt-3 text-zinc-300">Veja a vitrine da região, avalie potencial de valorização e fale com atendimento comercial.</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
