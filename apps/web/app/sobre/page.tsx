import Image from 'next/image';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Sobre Ícarõ Munay',
  path: '/sobre',
  description: 'Conheça Ícarõ Munay, corretor imobiliário especializado em imóveis, terrenos e investimentos patrimoniais no Sul do Brasil.'
});

export default function SobrePage() {
  return (
    <section data-theme-block="institutional-pages" className="container-base py-20">
      <div className="grid gap-10 lg:grid-cols-[420px_1fr] lg:items-start">
        <div className="theme-surface-institutional overflow-hidden p-4">
          <div className="relative aspect-square overflow-hidden rounded-[1.6rem]">
            <Image src="/images/selfie.webp" alt="Ícarõ Munay" fill priority sizes="(max-width: 1024px) 100vw, 420px" className="object-cover" />
          </div>
        </div>

        <div className="theme-surface-institutional p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.34em]" style={{ color: 'var(--theme-accent)' }}>Quem sou</p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl" style={{ color: 'var(--theme-institutional-text-primary)' }}>Ícarõ Munay</h1>
          <div className="mt-6 space-y-5 text-base leading-8 md:text-lg" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
            <p>
              Ícarõ Munay é corretor imobiliário especializado em imóveis, terrenos e investimentos patrimoniais no Sul do Brasil. Premiado como Corretor do Ano no Congresso Nacional Imobiliário em Curitiba — 2015, atua com foco em segurança, valorização e atendimento personalizado.
            </p>
            <p>
              Antes de cada negociação, realiza uma análise completa da documentação do imóvel para garantir mais tranquilidade e segurança aos clientes.
            </p>
            <p>
              CRECI 33928-F.<br />
              Atendimento com hora marcada.
            </p>
            <div className="pt-4 text-sm">
              <p>WhatsApp: (48) 99170-2077</p>
              <p>Instagram: @corretor_icaro_munay</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
