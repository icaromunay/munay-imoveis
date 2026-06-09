'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, LayoutTemplate, Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSettingsNav } from '@/components/admin/AdminSettingsNav';

type TemplateFormState = {
  subject: string;
  htmlBody: string;
  variables: string[];
  updatedAt: string | null;
};

const emptyForm: TemplateFormState = {
  subject: '',
  htmlBody: '',
  variables: ['{{NOME}}', '{{EMAIL}}', '{{LINK_RESET}}'],
  updatedAt: null
};

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-gold/35';
}

export default function AdminEmailTemplatesPage() {
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/email-templates/password-reset', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || 'Não foi possível carregar o modelo de e-mail.');
        }

        setForm({
          subject: data.subject || '',
          htmlBody: data.htmlBody || '',
          variables: Array.isArray(data.variables) ? data.variables : emptyForm.variables,
          updatedAt: data.updatedAt || null
        });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o modelo de e-mail.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/email-templates/password-reset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          htmlBody: form.htmlBody
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível salvar o modelo de e-mail.');
      }

      setForm((current) => ({
        ...current,
        updatedAt: data?.template?.updatedAt || new Date().toISOString()
      }));
      setMessage(data?.message || 'Modelo de e-mail salvo com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar o modelo de e-mail.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Modelos de e-mail">
      <div className="space-y-6">
        <AdminSettingsNav />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <form onSubmit={handleSubmit} className="card-premium space-y-5 p-6">
            <div className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-200">
              <LayoutTemplate className="mt-1 h-5 w-5 shrink-0 text-brand-gold" />
              <div>
                <p className="font-semibold text-white">Recuperação de Senha</p>
                <p className="mt-1 text-zinc-400">
                  Edite o assunto e o HTML utilizado pelo EmailService no fluxo de recuperação de senha.
                </p>
              </div>
            </div>

            {loading ? <p className="text-sm text-zinc-400">Carregando modelo...</p> : null}

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Assunto</span>
              <input className={fieldClassName()} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Recuperação de senha - Munay Imóveis" />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">HTML</span>
              <textarea className={`${fieldClassName()} min-h-[420px]`} value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })} spellCheck={false} />
            </label>

            <button type="submit" disabled={saving || loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Salvar modelo
            </button>

            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </form>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-zinc-300">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Variáveis disponíveis</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {form.variables.map((variable) => (
                  <span key={variable} className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-xs font-medium text-brand-gold">
                    {variable}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-zinc-400">
                <strong className="text-white">{'{{NOME}}'}</strong> substitui o nome do usuário,
                <strong className="text-white"> {'{{EMAIL}}'}</strong> substitui o e-mail da conta e
                <strong className="text-white"> {'{{LINK_RESET}}'}</strong> substitui o link seguro de redefinição.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-zinc-300">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Observação</p>
              <p className="mt-3 text-zinc-400">
                O HTML salvo aqui passa a ser utilizado imediatamente no envio real de recuperação de senha, sem deploy e sem restart.
              </p>
              {form.updatedAt ? <p className="mt-3 text-xs text-zinc-500">Última atualização: {new Date(form.updatedAt).toLocaleString('pt-BR')}</p> : null}
            </div>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}
