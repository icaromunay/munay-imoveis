import Link from 'next/link';
import { LockKeyhole, ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <section className="container-base py-20 sm:py-24">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.05] p-[1px] shadow-[0_25px_100px_rgba(0,0,0,0.38)]">
        <div className="rounded-[33px] bg-[#08110d]/92 p-8 text-center backdrop-blur-3xl sm:p-10">
          <div className="mx-auto inline-flex rounded-3xl bg-rose-500/10 p-4 text-rose-300">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">Acesso restrito ao administrador</h1>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Seu login foi autenticado com sucesso, mas esta área exige a role <strong className="text-white">ADMIN</strong>.
            Apenas a conta master do portal possui acesso total ao painel interno.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-secondary inline-flex items-center gap-2 px-5 py-3">
              <LockKeyhole className="h-4 w-4" />
              Voltar ao site
            </Link>
            <Link href="/area-do-proprietario" className="btn-primary px-5 py-3">
              Ir para área do proprietário
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
