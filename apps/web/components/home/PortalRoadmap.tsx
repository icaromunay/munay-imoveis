const roadmapItems = [
  'mapa interativo por empreendimento',
  'simulador de valorização',
  'busca inteligente com recomendação',
  'filtros avançados por bairro e perfil',
  'área do investidor com favoritos e comparativos',
  'motor de oportunidades com score patrimonial'
];

export function PortalRoadmap() {
  return (
    <section className="border-y border-white/10 bg-[#0e1d16] py-24">
      <div className="container-base">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Experiência de portal</p>
          <h2 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Base pronta para evoluir para um ecossistema imobiliário orientado por dados</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-300">
            A arquitetura já permite expandir a experiência para um portal completo, com inteligência comercial, filtros avançados e jornadas específicas para investidores.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roadmapItems.map((item) => (
            <div key={item} className="card-premium p-6 text-white transition duration-300 hover:border-brand-gold/40">
              <p className="text-sm uppercase tracking-[0.25em] text-brand-gold">Roadmap</p>
              <p className="mt-3 text-xl font-medium capitalize">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
