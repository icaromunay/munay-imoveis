'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, Send, Shield } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminSettingsNav } from '@/components/admin/AdminSettingsNav';

type SmtpFormState = {
  senderName: string;
  senderEmail: string;
  host: string;
  port: string;
  encryption: 'SSL' | 'TLS' | 'NONE';
  username: string;
  password: string;
  timeout: string;
  hasPassword: boolean;
  passwordMasked: string;
  passwordUpdatedAt: string | null;
};

const emptyForm: SmtpFormState = {
  senderName: 'Munay Imóveis',
  senderEmail: '',
  host: '',
  port: '465',
  encryption: 'SSL',
  username: '',
  password: '',
  timeout: '10000',
  hasPassword: false,
  passwordMasked: '',
  passwordUpdatedAt: null
};

function fieldClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-brand-gold/35';
}

export default function AdminSmtpSettingsPage() {
  const [form, setForm] = useState<SmtpFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canSave = useMemo(
    () =>
      Boolean(
        form.senderName.trim() &&
          form.senderEmail.trim() &&
          form.host.trim() &&
          form.port.trim() &&
          form.username.trim() &&
          form.timeout.trim() &&
          (form.hasPassword || form.password.trim())
      ),
    [form]
  );

  useEffect(() => {
    fetch('/api/admin/email/smtp', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.message || 'Não foi possível carregar as configurações SMTP.');
        }

        setForm({
          senderName: data.senderName || emptyForm.senderName,
          senderEmail: data.senderEmail || '',
          host: data.host || '',
          port: String(data.port || 465),
          encryption: data.encryption || 'SSL',
          username: data.username || '',
          password: '',
          timeout: String(data.timeout || 10000),
          hasPassword: Boolean(data.hasPassword),
          passwordMasked: data.passwordMasked || '',
          passwordUpdatedAt: data.passwordUpdatedAt || null
        });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as configurações SMTP.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/admin/email/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: form.senderName.trim(),
          senderEmail: form.senderEmail.trim().toLowerCase(),
          host: form.host.trim(),
          port: Number(form.port),
          encryption: form.encryption,
          username: form.username.trim(),
          password: form.password,
          timeout: Number(form.timeout)
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível salvar as configurações SMTP.');
      }

      setForm((current) => ({
        ...current,
        password: '',
        hasPassword: Boolean(data?.settings?.hasPassword),
        passwordMasked: data?.settings?.passwordMasked || '************',
        passwordUpdatedAt: data?.settings?.passwordUpdatedAt || new Date().toISOString()
      }));
      setMessage(data?.message || 'Configurações SMTP salvas com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar as configurações SMTP.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/email/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim().toLowerCase() })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || 'Falha ao conectar ao servidor SMTP.');
      }

      setTestResult({ type: 'success', message: data?.message || 'E-mail enviado com sucesso.' });
    } catch (testError) {
      setTestResult({
        type: 'error',
        message: testError instanceof Error ? testError.message : 'Falha ao conectar ao servidor SMTP.'
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AdminShell title="Configurações SMTP">
      <div className="space-y-6">
        <AdminSettingsNav />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <form onSubmit={handleSubmit} className="card-premium space-y-5 p-6">
            <div className="flex items-start gap-3 rounded-[24px] border border-brand-gold/20 bg-brand-gold/10 p-4 text-sm leading-7 text-zinc-200">
              <Shield className="mt-1 h-5 w-5 shrink-0 text-brand-gold" />
              <div>
                <p className="font-semibold text-white">SMTP dinâmico salvo no banco</p>
                <p className="mt-1">
                  Alterações aplicam imediatamente para recuperação de senha e futuros envios centralizados no <strong>EmailService</strong>,
                  sem editar arquivos <code>.env</code> nem reiniciar a aplicação.
                </p>
              </div>
            </div>

            {loading ? <p className="text-sm text-zinc-400">Carregando configurações SMTP...</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white">Nome do remetente</span>
                <input className={fieldClassName()} value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="Munay Imóveis" />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white">E-mail remetente</span>
                <input className={fieldClassName()} value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} placeholder="imob@munay.com.br" type="email" />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white">Host SMTP</span>
                <input className={fieldClassName()} value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder="smtp.titan.email" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white">Porta SMTP</span>
                <input className={fieldClassName()} value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value.replace(/[^0-9]/g, '') })} placeholder="465" inputMode="numeric" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white">Criptografia</span>
                <select className={fieldClassName()} value={form.encryption} onChange={(e) => setForm({ ...form, encryption: e.target.value as SmtpFormState['encryption'] })}>
                  <option value="SSL">SSL</option>
                  <option value="TLS">TLS</option>
                  <option value="NONE">Nenhuma</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white">Usuário SMTP</span>
                <input className={fieldClassName()} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="imob@munay.com.br" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-white">Timeout</span>
                <input className={fieldClassName()} value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value.replace(/[^0-9]/g, '') })} placeholder="10000" inputMode="numeric" />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-white">Senha SMTP</span>
                <input className={fieldClassName()} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={form.hasPassword ? form.passwordMasked || '************' : 'Digite a senha SMTP'} type="password" />
                <p className="text-xs leading-6 text-zinc-500">
                  {form.hasPassword
                    ? `Senha protegida no banco. Deixe em branco para manter a atual${form.passwordUpdatedAt ? ` • atualizada em ${new Date(form.passwordUpdatedAt).toLocaleString('pt-BR')}` : ''}.`
                    : 'A senha será criptografada antes de ser salva no banco.'}
                </p>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={!canSave || saving || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Salvar configurações
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setTestModalOpen(true);
                  setTestResult(null);
                  setTestEmail(form.senderEmail || '');
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                Testar envio
              </button>
            </div>

            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </form>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Resumo</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <div>
                  <p className="text-zinc-500">Status da senha</p>
                  <p className="font-medium text-white">{form.hasPassword ? form.passwordMasked || '************' : 'Ainda não configurada'}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Criptografia</p>
                  <p className="font-medium text-white">{form.encryption === 'NONE' ? 'Nenhuma' : form.encryption}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Aplicação</p>
                  <p className="font-medium text-white">Imediata, sem deploy e sem restart</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-zinc-300">
              <div className="flex items-center gap-2 text-white">
                <Mail className="h-4 w-4 text-brand-gold" />
                <p className="font-semibold">Onde esse SMTP já é usado</p>
              </div>
              <ul className="mt-3 space-y-2 text-zinc-400">
                <li>• Recuperação de senha</li>
                <li>• Teste de envio no painel</li>
                <li>• Base pronta para futuros e-mails do portal</li>
              </ul>
            </div>
          </aside>
        </div>

        {testModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#08110d] p-6 shadow-[0_25px_120px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Teste SMTP</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Enviar teste para</h2>
                </div>
                <button type="button" onClick={() => setTestModalOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSendTestEmail} className="mt-6 space-y-4">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-white">E-mail</span>
                  <input className={fieldClassName()} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} type="email" placeholder="destinatario@exemplo.com" />
                </label>

                <button type="submit" disabled={!testEmail.trim() || testing} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:cursor-not-allowed disabled:opacity-70">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar
                </button>

                {testResult?.type === 'success' ? (
                  <div className="flex items-start gap-3 rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{testResult.message}</span>
                  </div>
                ) : null}

                {testResult?.type === 'error' ? (
                  <div className="flex items-start gap-3 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{testResult.message}</span>
                  </div>
                ) : null}
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
