'use client';

import { Clock3, GitBranchPlus, Info } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSettingsNav } from '@/components/admin/AdminSettingsNav';
import { APP_LAST_UPDATED_AT, APP_RELEASE_NOTES, APP_VERSION } from '@/lib/app-release';

export default function AdminSettingsAboutPage() {
  return (
    <AdminShell title="Configurações • Sobre">
      <div className="space-y-6">
        <AdminSettingsNav />

        <section className="card-premium space-y-6 p-6">
          <div className="flex items-start gap-3">
            <Info className="mt-1 h-5 w-5 shrink-0 text-brand-gold" />
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Portal Munay</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Versão {APP_VERSION}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                Esta aba centraliza a identificação da versão publicada no painel administrativo. A convenção adotada é
                incrementar o decimal a cada atualização até <strong>.9</strong> e, em seguida, avançar para a próxima versão
                principal.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-brand-gold">
                <GitBranchPlus className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.24em]">Versão atual</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{APP_VERSION}</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center gap-2 text-brand-gold">
                <Clock3 className="h-4 w-4" />
                <p className="text-xs uppercase tracking-[0.24em]">Última atualização</p>
              </div>
              <p className="mt-3 text-lg font-medium text-white">{APP_LAST_UPDATED_AT}</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-gold">Resumo desta versão</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              {APP_RELEASE_NOTES.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
