import Link from 'next/link';
import { AlertCircle, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PasswordResetConfirmForm } from '@/components/auth/PasswordResetConfirmForm';
import { prisma } from '@/lib/prisma';
import { hashPasswordResetToken, PASSWORD_RESET_INVALID_MESSAGE } from '@/lib/password-reset';

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata = {
  title: 'Recuperação de senha | Munay Imóveis'
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const emptySearchParams: Record<string, string | string[] | undefined> = {};
  const params = await (searchParams ?? Promise.resolve(emptySearchParams));
  const rawToken = typeof params?.token === 'string' ? params.token.trim() : '';

  const tokenRecord = rawToken
    ? await prisma.passwordResetToken.findFirst({
        where: {
          token: hashPasswordResetToken(rawToken),
          used: false,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          expiresAt: true
        }
      })
    : null;

  const invalidToken = !tokenRecord?.id;

  return (
    <section className="relative isolate overflow-hidden bg-[#07110d] py-12 sm:py-16 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,114,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(16,185,129,0.10),transparent_26%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="container-base relative z-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.28em] text-brand-gold backdrop-blur-2xl">
            <ShieldCheck className="h-4 w-4" />
            recuperação segura por e-mail
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Recuperação de senha
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
            Use o link enviado ao seu e-mail para criar uma nova senha com segurança e voltar ao portal normalmente.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: 'Link temporário',
                text: 'Cada link expira automaticamente e só pode ser usado uma única vez.'
              },
              {
                icon: CheckCircle2,
                title: 'Senha protegida',
                text: 'A nova senha é salva com o mesmo algoritmo seguro já utilizado no portal.'
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
          <div className="relative overflow-hidden rounded-[36px] border border-white/12 bg-white/[0.06] p-[1px] shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
            <div className="rounded-[35px] bg-[#08110d]/92 p-6 backdrop-blur-3xl sm:p-8">
              {invalidToken ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{PASSWORD_RESET_INVALID_MESSAGE}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400">
                    <Link href="/login" className="font-medium text-brand-gold transition hover:opacity-85">
                      Voltar para login
                    </Link>
                    <Link href="/" className="inline-flex items-center gap-2 font-medium text-zinc-200 transition hover:text-white">
                      Voltar ao site
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.32em] text-brand-gold">Nova senha</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Defina sua nova senha</h2>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">
                      Escolha uma senha forte e confirme para concluir a recuperação do acesso.
                    </p>
                  </div>

                  <PasswordResetConfirmForm token={rawToken} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
