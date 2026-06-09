import { LeadForm } from '@/components/shared/LeadForm';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contato',
  path: '/contato',
  description: 'Fale com Ícarõ Munay e receba atendimento consultivo para imóveis, terrenos e loteamentos premium.'
});

export default function ContatoPage() {
  return (
    <section data-theme-block="institutional-pages" className="container-base py-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <SectionHeader
            eyebrow="Contato"
            title="Fale com Ícarõ Munay e receba atendimento consultivo"
            subtitle="Atendimento imobiliário com horário marcado, atuação focada na Região Sul do Brasil e relacionamento personalizado para compra, investimento e valorização patrimonial."
          />
          <div className="theme-surface-institutional p-8" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
            <p className="text-lg" style={{ color: 'var(--theme-institutional-text-primary)' }}>Atendimento premium para:</p>
            <ul className="mt-4 space-y-3 text-sm leading-6">
              <li>• compra de terrenos e loteamentos</li>
              <li>• análise de imóveis de alto padrão</li>
              <li>• agendamento de visitas</li>
              <li>• solicitação de tabela</li>
            </ul>

            <div className="mt-8 space-y-2 text-sm">
              <p><strong style={{ color: 'var(--theme-institutional-text-primary)' }}>Ícarõ Munay</strong> — Corretor de Imóveis | CRECI 33928-F</p>
              <p>📞 WhatsApp / Telefone: (48) 99170-2077</p>
              <p>📲 Instagram: @corretor_icaro_munay</p>
              <p>Atendimento com hora marcada.</p>
              <p>Atuação na Região Sul do Brasil — SC e RS.</p>
            </div>
          </div>
        </div>
        <LeadForm pageOrigin="contato" interest="Contato geral" />
      </div>
    </section>
  );
}
