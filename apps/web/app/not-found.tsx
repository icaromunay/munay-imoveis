import Link from 'next/link';
import { MessageCircle, Search } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BackButton } from '@/components/shared/BackButton';
import { getProperties, getSettings } from '@/lib/api';

export default async function NotFound() {
  const [settings, featuredProperties] = await Promise.all([getSettings(), getProperties('?featured=true&limit=3')]);
  const whatsappHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent('Olá, caí em uma página não encontrada e preciso de ajuda para localizar um imóvel.')}`;

  return (
    <section className="container-base py-20">
      <div className="card-premium mx-auto max-w-4xl p-8 md:p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Página não encontrada</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          O endereço pode ter sido movido, renomeado ou removido. Use a busca, volte para a página anterior ou fale no WhatsApp para receber atendimento imediato.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <form action="/imoveis" className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3">
            <Search size={18} className="text-brand-gold" />
            <input name="search" placeholder="Buscar imóvel por cidade, bairro, código ou título" className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500" />
          </form>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gold px-6 py-3 font-semibold text-[#08110d] transition hover:opacity-95">
            Ir para a home
          </Link>
          <BackButton fallbackHref="/imoveis" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/10 px-5 py-3 text-sm font-semibold text-brand-gold transition hover:opacity-90">
            <MessageCircle size={16} />
            Falar no WhatsApp
          </a>
          <Link href="/casas" className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-brand-gold/35 hover:text-white">Ver casas</Link>
          <Link href="/terrenos" className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-brand-gold/35 hover:text-white">Ver terrenos</Link>
          <Link href="/lancamentos" className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-brand-gold/35 hover:text-white">Ver lançamentos</Link>
        </div>
      </div>

      {featuredProperties.length ? (
        <div className="mt-12">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Sugestões</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Imóveis em destaque para continuar navegando</h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
