'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSettings } from '@/lib/types';

export function Navbar({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const whatsappContactHref = useMemo(
    () =>
      `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
        'Olá, estou no site Munay Imóveis, e gostaria de falar com o agente imobiliário Ícarõ Munay, *meu nome é:*'
      )}`,
    [settings.whatsappNumber]
  );

  const links = [
    { href: '/', label: 'Início', external: false },
    { href: '/cadastro-proprietario', label: 'Criar Conta', external: false },
    { href: '/vender-seu-imovel', label: 'Vender Seu Imóvel', external: false },
    { href: '/area-do-proprietario', label: 'Área do Proprietário', external: false },
    { href: '/casas', label: 'Casas', external: false },
    { href: '/terrenos', label: 'Terrenos', external: false },
    { href: '/lancamentos', label: 'Lançamentos', external: false },
    { href: '/blog', label: 'Blog', external: false },
    { href: '/sobre', label: 'Sobre', external: false },
    { href: whatsappContactHref, label: 'Contato', external: true },
    { href: '/admin', label: 'Admin', external: false }
  ];

  const transparent = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    ['/imoveis', '/casas', '/terrenos', '/lancamentos', '/blog', '/sobre', '/admin'].forEach((href) => {
      router.prefetch(href);
    });
  }, [router]);

  const frameStyle = transparent
    ? { background: 'transparent', borderColor: 'transparent', boxShadow: 'none' }
    : {
        background: 'var(--theme-header-background)',
        borderColor: 'var(--theme-header-border)',
        boxShadow: 'var(--theme-header-shadow)',
        backdropFilter: 'blur(28px)'
      };

  return (
    <header data-theme-block="header" className="sticky top-0 z-50 border-b transition-all duration-500" style={frameStyle}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" style={{ height: 'var(--theme-header-height)' }}>
        <Link href="/" className="flex items-center gap-3" style={{ color: 'var(--theme-header-text-primary)' }}>
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.32em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--theme-header-accent) 35%, transparent)',
              background: 'color-mix(in srgb, var(--theme-header-accent) 10%, transparent)',
              color: 'var(--theme-header-accent)'
            }}
          >
            IM
          </span>
          <span>
            <span className="block text-[10px] uppercase tracking-[0.35em] sm:text-xs" style={{ color: 'var(--theme-header-text-secondary)' }}>
              Ícarõ Munay • CRECI 33928-F
            </span>
            <span className="block text-sm font-semibold uppercase tracking-[0.28em] sm:text-lg" style={{ color: 'var(--theme-header-text-primary)' }}>
              {settings.brandName}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Navegação principal">
          {links.map((item) => {
            const active = !item.external && pathname === item.href;
            const linkStyle = { color: active ? 'var(--theme-header-accent)' : 'var(--theme-header-text-secondary)' };
            return item.external ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="text-sm transition hover:opacity-80" style={linkStyle}>
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} prefetch className="text-sm transition hover:opacity-80" style={linkStyle}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          className="inline-flex rounded-full border p-3 lg:hidden"
          style={{
            borderColor: 'var(--theme-header-border)',
            background: 'color-mix(in srgb, var(--theme-header-background) 85%, transparent)',
            color: 'var(--theme-header-text-primary)'
          }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t lg:hidden"
          style={{ borderColor: 'var(--theme-header-border)', background: 'color-mix(in srgb, var(--theme-header-background) 92%, black 8%)', backdropFilter: 'blur(24px)' }}
        >
          <nav className="container-base flex flex-col gap-2 py-4" aria-label="Navegação mobile">
            {links.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl px-4 py-3 text-sm transition hover:opacity-85"
                  style={{ color: 'var(--theme-header-text-secondary)' }}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm transition hover:opacity-85"
                  style={{ color: pathname === item.href ? 'var(--theme-header-accent)' : 'var(--theme-header-text-secondary)' }}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
