'use client';

import { usePathname } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { SiteSettings } from '@/lib/types';

export function AppChrome({ children, settings }: { children: React.ReactNode; settings: SiteSettings }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <>
        <a href="#conteudo-principal" className="sr-only focus-visible-skip-link">
          Pular para o conteúdo
        </a>
        <Navbar settings={settings} />
        <main id="conteudo-principal">{children}</main>
      </>
    );
  }

  return (
    <>
      <a href="#conteudo-principal" className="sr-only focus-visible-skip-link">
        Pular para o conteúdo
      </a>
      <Navbar settings={settings} />
      <main id="conteudo-principal">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.whatsappNumber} message="Olá, quero informações sobre imóveis disponíveis." />
    </>
  );
}
