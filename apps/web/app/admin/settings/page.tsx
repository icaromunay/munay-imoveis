'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Info, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSettingsNav } from '@/components/admin/AdminSettingsNav';
import { adminFetch } from '@/lib/admin';

const emptyForm = {
  brandName: '',
  primaryColor: '#102a1f',
  secondaryColor: '#d4af72',
  accentColor: '#f6f2e8',
  heroTitle: '',
  heroSubtitle: '',
  heroVideoUrl: '',
  whatsappNumber: '',
  creci: '',
  cnpj: '',
  address: '',
  phone: '',
  instagram: '',
  privacyUrl: '/politica-de-privacidade'
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<any>(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminFetch('/settings')
      .then((data) => setForm(data || emptyForm))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as configurações gerais.'));
  }, []);

  async function submit() {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await adminFetch('/settings', { method: 'PUT', body: JSON.stringify(form) });
      setMessage('Configurações gerais salvas com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar as configurações gerais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell title="Configurações do portal">
      <div className="space-y-6">
        <AdminSettingsNav />

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[28px] border border-brand-gold/20 bg-brand-gold/10 p-5 text-sm leading-7 text-zinc-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-gold" />
              <div>
                <p className="text-base font-semibold text-white">Novo módulo de e-mail</p>
                <p className="mt-2">
                  As configurações SMTP e os modelos de e-mail agora ficam em páginas próprias do painel, com persistência em banco,
                  senha criptografada e aplicação imediata sem editar <code>.env</code> nem reiniciar o servidor.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/settings/smtp"
            className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-zinc-200 transition hover:border-brand-gold/35 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Configurações → SMTP</p>
                <h2 className="mt-3 text-xl font-semibold text-white">Gerenciar envio de e-mail</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Ajuste remetente, host, porta, criptografia, usuário, senha criptografada e faça testes de envio em tempo real.
                </p>
              </div>
              <Mail className="h-6 w-6 shrink-0 text-brand-gold" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-gold">
              Abrir SMTP
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/admin/settings/about"
            className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-zinc-200 transition hover:border-brand-gold/35 hover:bg-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Configurações → SOBRE</p>
                <h2 className="mt-3 text-xl font-semibold text-white">Versão e histórico desta entrega</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  Consulte a versão atual do portal, a data/hora da última atualização e o resumo técnico desta release.
                </p>
              </div>
              <Info className="h-6 w-6 shrink-0 text-brand-gold" />
            </div>
            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-gold">
              Abrir SOBRE
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <div className="card-premium max-w-4xl space-y-4 p-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-zinc-300">
            As configurações do vídeo da home ficam na sessão <strong>PLAYER HOME</strong>. Aqui você mantém identidade visual,
            textos gerais e contatos do portal.
          </div>

          {[
            ['brandName', 'Nome da marca'],
            ['heroTitle', 'Título principal da home'],
            ['heroSubtitle', 'Subtítulo principal da home'],
            ['whatsappNumber', 'WhatsApp'],
            ['creci', 'CRECI'],
            ['cnpj', 'CNPJ'],
            ['address', 'Endereço'],
            ['phone', 'Telefone'],
            ['instagram', 'Instagram'],
            ['privacyUrl', 'Política de privacidade']
          ].map(([key, label]) =>
            key === 'heroSubtitle' ? (
              <textarea
                key={key}
                placeholder={label}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            ) : (
              <input
                key={key}
                placeholder={label}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            )
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
            />
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
            />
            <input
              type="color"
              value={form.accentColor}
              onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 p-2"
            />
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Salvando...' : 'Salvar configurações gerais'}
          </button>

          {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </div>
      </div>
    </AdminShell>
  );
}
