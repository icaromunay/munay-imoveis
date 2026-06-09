import Image from 'next/image';

const blocks = [
  {
    title: 'Invista em regiões antes do pico de valorização',
    description:
      'Seleção orientada por localização, liquidez e timing de mercado para investidores que buscam patrimônio consistente e visão de longo prazo.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80'
  },
  {
    title: 'Arquitetura, natureza e liberdade financeira na mesma narrativa',
    description:
      'Uma apresentação imobiliária que vende estilo de vida, segurança patrimonial e oportunidades com comunicação premium e apelo comercial real.',
    image:
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=80'
  }
];

export function LifestyleSection() {
  return (
    <section className="py-24">
      <div className="container-base space-y-8">
        {blocks.map((block, index) => (
          <div key={block.title} className={`grid gap-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 ${index % 2 === 0 ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'}`}>
            <div className={`relative min-h-[340px] ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
              <Image src={block.image} alt={block.title} fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08110d] via-transparent to-transparent" />
            </div>
            <div className={`flex items-center p-8 lg:p-12 ${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Lifestyle & investimento</p>
                <h3 className="mt-4 text-3xl font-semibold text-white md:text-4xl">{block.title}</h3>
                <p className="mt-5 text-lg leading-8 text-zinc-300">{block.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
