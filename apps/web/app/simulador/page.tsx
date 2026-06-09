import { LeadForm } from '@/components/shared/LeadForm';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Simulador de investimento',
  path: '/simulador',
  description: 'Página preparada para evolução para simulador financeiro avançado com foco em análise consultiva.'
});

export default function SimuladorPage() {
  return (
    <section className="container-base py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <SectionHeader
            eyebrow="Simulador"
            title="Estrutura preparada para evolução para simulador financeiro avançado"
            subtitle="Nesta base inicial, a página funciona como ponto de entrada para análise consultiva. Em uma próxima fase, pode evoluir para cálculo detalhado com parcelas, CET e cenários de investimento."
          />
          <div className="card-premium p-8 text-zinc-300">
            <p>Campos futuros sugeridos:</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <li>• valor de entrada</li>
              <li>• prazo</li>
              <li>• simulação por empreendimento</li>
              <li>• amortização</li>
              <li>• comparação entre opções</li>
            </ul>
          </div>
        </div>
        <LeadForm pageOrigin="simulador" interest="Simulação de investimento" />
      </div>
    </section>
  );
}
