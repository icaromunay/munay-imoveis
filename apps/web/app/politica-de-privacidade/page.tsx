import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Política de Privacidade',
  path: '/politica-de-privacidade',
  description:
    'Política de Privacidade do portal imobiliário administrado por Ícarõ Munay — Corretor de Imóveis CRECI 33928-F.'
});

const sections = [
  {
    title: '1. Coleta de informações',
    content: [
      'Podemos coletar as seguintes informações fornecidas voluntariamente pelo usuário:',
      'Nome completo, número de telefone, WhatsApp, e-mail, cidade ou região de interesse, informações enviadas em formulários de contato e preferências imobiliárias.',
      'Também podem ser coletadas informações automáticas como endereço IP, tipo de navegador, dispositivo utilizado, páginas acessadas, tempo de navegação, cookies e dados analíticos.'
    ]
  },
  {
    title: '2. Finalidade do uso das informações',
    content: [
      'As informações coletadas são utilizadas para atendimento imobiliário personalizado, retorno de contato solicitado pelo cliente, envio de informações sobre imóveis, apresentação de oportunidades imobiliárias e agendamento de atendimentos.',
      'Os dados também podem ser usados para melhoria da experiência no site, segurança, prevenção contra spam e fraudes, além de ações de marketing e relacionamento.'
    ]
  },
  {
    title: '3. Compartilhamento de dados',
    content: [
      'Os dados pessoais não são vendidos.',
      'As informações poderão ser compartilhadas apenas quando necessário com plataformas de hospedagem, ferramentas de CRM, sistemas de anúncios e analytics e parceiros diretamente envolvidos no atendimento imobiliário, sempre respeitando a legislação vigente.'
    ]
  },
  {
    title: '4. Cookies',
    content: [
      'Este site utiliza cookies para melhorar a navegação, salvar preferências, realizar estatísticas de acesso e personalizar anúncios e conteúdos.',
      'O usuário pode desativar os cookies diretamente em seu navegador.'
    ]
  },
  {
    title: '5. Segurança das informações',
    content: [
      'Adotamos medidas técnicas e organizacionais para proteger os dados pessoais contra acessos não autorizados, perda de dados, alterações indevidas e vazamentos.',
      'Apesar dos esforços de segurança, nenhum sistema é totalmente inviolável.'
    ]
  },
  {
    title: '6. Direitos do usuário',
    content: [
      'Nos termos da LGPD, o usuário pode solicitar acesso aos dados armazenados, correção de informações, exclusão de dados, revogação do consentimento e informações sobre o tratamento de dados.',
      'Solicitações podem ser feitas através dos canais de contato informados nesta página.'
    ]
  },
  {
    title: '7. Links externos',
    content: [
      'O site pode conter links para plataformas externas, incluindo redes sociais e parceiros imobiliários. Não nos responsabilizamos pelas políticas de privacidade de terceiros.'
    ]
  },
  {
    title: '8. Atendimento imobiliário',
    content: [
      'O atendimento é realizado mediante agendamento prévio.',
      'A atuação é focada na Região Sul do Brasil, especialmente nos estados de Santa Catarina (SC) e Rio Grande do Sul (RS).'
    ]
  },
  {
    title: '9. Contato',
    content: [
      'Responsável pelo atendimento imobiliário: Ícarõ Munay — Corretor de Imóveis, CRECI 33928-F.',
      'WhatsApp / Telefone: (48) 99170-2077.',
      'Instagram: @corretor_icaro_munay.',
      'Atendimento com horário marcado.'
    ]
  },
  {
    title: '10. Alterações nesta política',
    content: [
      'Esta Política de Privacidade poderá ser atualizada periodicamente sem aviso prévio para adequação legal, técnica ou comercial.',
      'Recomendamos revisão periódica desta página.'
    ]
  }
];

export default function PoliticaPrivacidadePage() {
  return (
    <section className="container-base py-20">
      <div className="mx-auto max-w-4xl">
        <div className="glass-panel p-8 md:p-12">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Política de privacidade</p>
          <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">Política de Privacidade — Portal Imobiliário</h1>
          <p className="mt-4 text-sm text-zinc-400">Última atualização: Maio de 2026</p>
          <p className="mt-8 text-base leading-8 text-zinc-300 md:text-lg">
            A sua privacidade é importante para nós. Esta Política de Privacidade descreve como os dados pessoais são coletados, utilizados e protegidos no portal imobiliário administrado por <strong className="text-white">Ícarõ Munay — Corretor de Imóveis CRECI 33928-F</strong>. Ao utilizar este site, você concorda com os termos descritos nesta política.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <article key={section.title} className="card-premium p-8">
              <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-zinc-300">
                {section.content.map((paragraph) => (
                  <p key={paragraph} className="leading-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-brand-gold/20 bg-brand-gold/10 p-8">
          <h2 className="text-2xl font-semibold text-white">Rodapé sugerido</h2>
          <div className="mt-4 whitespace-pre-line text-zinc-200">
            {'Ícarõ Munay — Corretor de Imóveis | CRECI 33928-F\n\n📞 (48) 99170-2077\n📲 Instagram: @corretor_icaro_munay\n\nAtendimento com hora marcada.\nAtuação na Região Sul do Brasil — SC e RS.'}
          </div>
        </div>
      </div>
    </section>
  );
}
