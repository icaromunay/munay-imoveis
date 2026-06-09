'use client';

import { SiteSettings } from '@/lib/types';

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer data-theme-block="footer" className="border-t py-14" style={{ borderColor: 'var(--theme-footer-border)', background: 'var(--theme-footer-background)' }}>
      <div className="container-base grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-semibold" style={{ color: 'var(--theme-footer-text-primary)' }}>Ícarõ Munay</p>
          <p className="mt-4 text-sm leading-6" style={{ color: 'var(--theme-footer-text-secondary)' }}>
            Corretor de Imóveis | CRECI 33928-F. Atendimento com hora marcada, atuação em Santa Catarina e Rio Grande do Sul e foco em compra, venda e valorização patrimonial.
          </p>
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--theme-footer-text-primary)' }}>Atendimento</p>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--theme-footer-text-secondary)' }}>
            <li>Consultoria para compra e venda</li>
            <li>Imóveis, terrenos e loteamentos</li>
            <li>Atendimento com horário marcado</li>
          </ul>
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--theme-footer-text-primary)' }}>Contato</p>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--theme-footer-text-secondary)' }}>
            <li>{settings.phone}</li>
            <li>
              <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" style={{ color: 'var(--theme-footer-accent)' }}>
                WhatsApp comercial
              </a>
            </li>
            <li>
              <a href={settings.instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--theme-footer-accent)' }}>
                @corretor_icaro_munay
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--theme-footer-text-primary)' }}>Institucional</p>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--theme-footer-text-secondary)' }}>
            <li>Munay Imóveis</li>
            <li>Região Sul — SC e RS</li>
            <li>
              <a href={settings.privacyUrl} style={{ color: 'var(--theme-footer-accent)' }}>Política de privacidade</a>
            </li>
            <li>© {new Date().getFullYear()} Ícarõ Munay</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
