'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { PASSWORD_RESET_CHANGED_MESSAGE } from '@/lib/password-reset';

function fieldClassName() {
  return 'w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 backdrop-blur-2xl transition focus:border-brand-gold/40';
}

export function PasswordResetConfirmForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível alterar a senha agora.');
      }

      setSuccess(data?.message || PASSWORD_RESET_CHANGED_MESSAGE);
      setPassword('');
      setConfirmPassword('');
      router.push('/login?reset=success');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível alterar a senha agora.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Nova senha</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua nova senha"
              className={`${fieldClassName()} pl-11`}
              required
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Confirmar senha</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repita a nova senha"
              className={`${fieldClassName()} pl-11`}
              required
            />
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={!password.trim() || !confirmPassword.trim() || loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-brand-gold px-5 py-3.5 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Alterar senha
      </button>

      {error ? (
        <div className="flex items-start gap-3 rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-[22px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}
    </form>
  );
}
