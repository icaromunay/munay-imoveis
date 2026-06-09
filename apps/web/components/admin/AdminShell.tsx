'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, Building2, FileText, LayoutPanelTop, LogOut, Palette, Plus, Settings, TrendingUp, Video, Waypoints } from 'lucide-react';
import { ReactNode } from 'react';
import { signOut, useSession } from 'next-auth/react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/properties', label: 'Imóveis', icon: Building2 },
  { href: '/admin/properties/incluir', label: 'INCLUIR IMÓVEIS', icon: Plus },
  { href: '/admin/posts', label: 'Blog', icon: FileText },
  { href: '/admin/blog-automation', label: 'Automação Blog', icon: Bot },
  { href: '/admin/layouts', label: 'Layouts', icon: Palette },
  { href: '/admin/traffic', label: 'Tráfego', icon: Waypoints },
  { href: '/admin/views', label: 'Views', icon: TrendingUp },
  { href: '/admin/leads', label: 'Leads', icon: LayoutPanelTop },
  { href: '/admin/home-video', label: 'PLAYER HOME', icon: Video },
  { href: '/admin/settings', label: 'Configurações', icon: Settings }
];

export function AdminShell({ children, title, sidebarContent }: { children: ReactNode; title: string; sidebarContent?: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const adminUser = session?.user as { name?: string | null; email?: string | null; role?: string } | undefined;

  if (status === 'loading') {
    return <div className="container-base py-20 text-zinc-300">Carregando painel...</div>;
  }

  if (status !== 'authenticated' || adminUser?.role !== 'ADMIN') {
    return <div className="container-base py-20 text-zinc-300">Validando credenciais administrativas...</div>;
  }

  return (
    <div className="container-base py-6 lg:py-8">
      <section className="card-premium p-4 md:p-5">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Painel administrativo</p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
              <p className="text-lg font-semibold text-white">Munay Imóveis</p>
              <span className="hidden text-zinc-600 md:inline">•</span>
              <p className="text-sm text-zinc-400">Gerencie imóveis, blog, automações, tráfego, leads e configurações.</p>
            </div>
            <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-400 md:flex-row md:flex-wrap md:items-center md:gap-3">
              <span className="uppercase tracking-[0.18em] text-zinc-500">Sessão ativa</span>
              <span className="text-white">{adminUser?.name || 'Administrador master'}</span>
              <span className="break-all">{adminUser?.email || 'admin@munay.com.br'}</span>
            </div>
          </div>

          <button
            onClick={() => signOut({ redirectTo: '/login' })}
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
            <span>Sair</span>
          </button>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active =
              link.href === '/admin/properties'
                ? pathname === '/admin/properties'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-brand-gold text-[#08110d]'
                    : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-brand-gold/35 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </section>

      <div className="mt-6 min-w-0">
        <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Área interna</p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{title}</h1>
          </div>
        </div>

        {sidebarContent ? (
          <div className="grid items-start gap-8 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="min-w-0">{sidebarContent}</aside>
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          <div className="min-w-0">{children}</div>
        )}
      </div>
    </div>
  );
}
