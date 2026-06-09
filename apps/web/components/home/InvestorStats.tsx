const stats = [
  {
    value: '+2.500',
    label: 'terrenos cadastrados',
    description: 'Curadoria ativa em regiões com leitura de valorização.'
  },
  {
    value: '+R$ 180 mi',
    label: 'volume vendido',
    description: 'Histórico comercial que reforça confiança e liquidez.'
  },
  {
    value: '+1.200',
    label: 'investidores ativos',
    description: 'Base qualificada em busca de patrimônio sólido.'
  },
  {
    value: '12 anos',
    label: 'de mercado',
    description: 'Experiência para orientar compra, timing e revenda.'
  }
];

export function InvestorStats() {
  return (
    <section className="relative z-10 -mt-14 pb-10 sm:-mt-16">
      <div className="container-base">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card-premium border-white/15 bg-[linear-gradient(180deg,rgba(13,23,18,0.96),rgba(13,23,18,0.8))] p-6 backdrop-blur-2xl"
            >
              <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">Prova social</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.24em] text-brand-gold">{stat.label}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
