import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, BadgeCheck, Building2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { PortalAccessPanel } from '@/components/auth/PortalAccessPanel';
import { safeAuth } from '@/lib/safe-auth';
import { PASSWORD_RESET_CHANGED_MESSAGE } from '@/lib/password-reset';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolvePostLoginUrl(role?: string) {
  return role === 'ADMIN' ? '/admin' : '/area-do-proprietario';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const [session, params] = await Promise.all([safeAuth(), searchParams ?? Promise.resolve(emptySearchParams)]);

  if (session?.user) {
    redirect(resolvePostLoginUrl(session.user.role));
  }

  const nextParam = typeof params?.next === 'string' ? params.next : undefined;
  const resetSuccess = params?.reset === 'success';
  const credentialTarget = nextParam || '/area-do-proprietario';
  const socialTarget = nextParam || '/auth/redirecionando';
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebookEnabled = Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET);
  const appleEnabled = Boolean(process.env.APPLE_ID && process.env.APPLE_SECRET);

  return (
    <section className="relative isolate overflow-hidden bg-[#07110d] py-12 sm:py-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,114,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="container-base relative z-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.28em] text-brand-gold backdrop-blur-2xl">
            <Sparkles className="h-4 w-4" />
            acesso simples • login e cadastro do proprietário
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Cadastro fácil para anunciar seu imóvel.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
            O proprietário pode criar conta com nome, WhatsApp, CPF, e-mail, senha e endereço. Depois, o login é sempre simples:
            apenas e-mail e senha.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: 'Acesso seguro',
                text: 'Sessão persistente, logout confiável e proteção administrativa por role ADMIN.'
              },
              {
                icon: Building2,
                title: 'Fluxo para proprietário',
                text: 'Cria a conta uma vez e depois usa somente e-mail e senha para anunciar e acompanhar imóveis.'
              },
              {
                icon: Zap,
                title: 'Admin liberado',
                text: 'Acesso administrativo disponível apenas para usuários autorizados.'
              },
              {
                icon: BadgeCheck,
                title: 'Dados salvos no banco',
                text: 'Nome, WhatsApp, CPF, e-mail, senha protegida e endereço ficam registrados para o proprietário anunciar com facilidade.'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                  <div className="inline-flex rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-10 top-8 hidden h-40 w-40 rounded-full bg-brand-gold/10 blur-3xl lg:block" />
          <div className="absolute -right-10 bottom-0 hidden h-40 w-40 rounded-full bg-sky-400/10 blur-3xl lg:block" />

          <div className="relative overflow-hidden rounded-[36px] border border-white/12 bg-white/[0.06] p-[1px] shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
            <div className="rounded-[35px] bg-[#08110d]/92 p-6 backdrop-blur-3xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-brand-gold">Portal do proprietário</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Entrar ou criar conta</h2>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-200">
                  online
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Para anunciar, primeiro crie sua conta. Se você já tem cadastro, basta usar e-mail e senha. O acesso administrativo
                também entra por credenciais.
              </p>

              {resetSuccess ? (
                <div className="mt-6 flex items-start gap-3 rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{PASSWORD_RESET_CHANGED_MESSAGE}</span>
                </div>
              ) : null}

              <div className="mt-8">
                <PortalAccessPanel
                  credentialTarget={credentialTarget}
                  socialTarget={socialTarget}
                  googleEnabled={googleEnabled}
                  facebookEnabled={facebookEnabled}
                  appleEnabled={appleEnabled}
                  initialMode="login"
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-zinc-500">
                <span>Compatível com desktop, tablet e mobile.</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/cadastro-proprietario" className="font-medium text-zinc-200 transition hover:text-white">
                    Abrir cadastro do proprietário
                  </Link>
                  <Link href="/" className="inline-flex items-center gap-2 font-medium text-brand-gold transition hover:opacity-85">
                    Voltar ao site
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
