import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, CheckCircle2, Home, MapPinHouse, ShieldCheck } from 'lucide-react';
import { PortalAccessPanel } from '@/components/auth/PortalAccessPanel';
import { safeAuth } from '@/lib/safe-auth';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cadastro do proprietário',
  path: '/cadastro-proprietario',
  description: 'Cadastro fácil do proprietário com nome, WhatsApp, CPF, e-mail, senha e endereço para anunciar imóveis.'
});

type CadastroPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolvePostLoginUrl(role?: string) {
  return role === 'ADMIN' ? '/admin' : '/area-do-proprietario';
}

export default async function CadastroProprietarioPage({ searchParams }: CadastroPageProps) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [session, params] = await Promise.all([safeAuth(), searchParams ?? Promise.resolve(emptySearchParams)]);

  if (session?.user) {
    redirect(resolvePostLoginUrl(session.user.role));
  }

  const nextParam = typeof params?.next === 'string' ? params.next : undefined;
  const credentialTarget = nextParam || '/area-do-proprietario';
  const socialTarget = nextParam || '/auth/redirecionando';
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebookEnabled = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
  const appleEnabled = Boolean(process.env.APPLE_ID && process.env.APPLE_SECRET);

  return (
    <section data-theme-block="institutional-pages" className="relative isolate overflow-hidden py-12 sm:py-16 lg:py-24" style={{ background: 'var(--theme-institutional-background)' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at top left, color-mix(in srgb, var(--theme-accent) 16%, transparent), transparent 28%), radial-gradient(circle at top right, color-mix(in srgb, var(--theme-institutional-button) 14%, transparent), transparent 24%), radial-gradient(circle at bottom, color-mix(in srgb, var(--theme-institutional-text-secondary) 10%, transparent), transparent 26%)' }} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="container-base relative z-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em] backdrop-blur-2xl" style={{ border: '1px solid var(--theme-institutional-border)', background: 'color-mix(in srgb, var(--theme-institutional-surface) 82%, transparent)', color: 'var(--theme-accent)' }}>
            <CheckCircle2 className="h-4 w-4" />
            cadastro simples do proprietário
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--theme-institutional-text-primary)' }}>
            Crie sua conta e anuncie seu imóvel sem complicação.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
            Preencha nome, WhatsApp, CPF, e-mail, senha e endereço. Depois disso, o acesso fica simples: apenas e-mail e senha.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Cadastro seguro', text: 'A senha é protegida e os dados do proprietário ficam guardados no banco.' },
              { icon: Home, title: 'Pronto para anunciar', text: 'Assim que criar a conta, você já entra na área do proprietário para cadastrar o imóvel.' },
              { icon: MapPinHouse, title: 'Dados completos', text: 'Nome, contato, CPF e endereço ficam vinculados ao seu acesso para facilitar o atendimento.' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="theme-surface-institutional p-5">
                  <div className="inline-flex rounded-2xl p-3" style={{ background: 'color-mix(in srgb, var(--theme-accent) 10%, transparent)', color: 'var(--theme-accent)' }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold" style={{ color: 'var(--theme-institutional-text-primary)' }}>{item.title}</h2>
                  <p className="mt-2 text-sm leading-7" style={{ color: 'var(--theme-institutional-text-secondary)' }}>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[36px] border p-[1px] shadow-[0_25px_120px_rgba(0,0,0,0.45)]" style={{ borderColor: 'var(--theme-institutional-border)', background: 'var(--theme-institutional-surface)' }}>
            <div className="rounded-[35px] p-6 backdrop-blur-3xl sm:p-8" style={{ background: 'color-mix(in srgb, var(--theme-institutional-background) 92%, transparent)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em]" style={{ color: 'var(--theme-accent)' }}>Cadastro do proprietário</p>
                  <h2 className="mt-3 text-3xl font-semibold" style={{ color: 'var(--theme-institutional-text-primary)' }}>Abra sua conta agora</h2>
                </div>
                <span className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.1)', color: '#d1fae5' }}>
                  rápido
                </span>
              </div>

              <p className="mt-4 text-sm leading-7" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
                Depois do cadastro, você entra automaticamente e já pode anunciar seu imóvel na área do proprietário.
              </p>

              <div className="mt-8">
                <PortalAccessPanel credentialTarget={credentialTarget} socialTarget={socialTarget} googleEnabled={googleEnabled} facebookEnabled={facebookEnabled} appleEnabled={appleEnabled} initialMode="register" />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-sm" style={{ borderColor: 'var(--theme-institutional-border)', color: 'var(--theme-institutional-text-secondary)' }}>
                <Link href="/login" className="font-medium transition hover:opacity-80" style={{ color: 'var(--theme-institutional-text-primary)' }}>
                  Já tenho conta
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 font-medium transition hover:opacity-85" style={{ color: 'var(--theme-accent)' }}>
                  Voltar ao site
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
