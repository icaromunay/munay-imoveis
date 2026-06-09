'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPinHouse,
  Phone,
  ShieldCheck,
  User2,
  UserRoundPlus
} from 'lucide-react';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { isAdminEmail } from '@/lib/auth-role';

type Mode = 'login' | 'register' | 'reset';

type RegisterForm = {
  name: string;
  whatsapp: string;
  cpf: string;
  email: string;
  password: string;
  address: string;
};

type ResetForm = {
  email: string;
};

const initialRegisterForm: RegisterForm = {
  name: '',
  whatsapp: '',
  cpf: '',
  email: '',
  password: '',
  address: ''
};

const initialResetForm: ResetForm = {
  email: ''
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function fieldClassName() {
  return 'w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 backdrop-blur-2xl transition focus:border-brand-gold/40';
}

export function PortalAccessPanel({
  credentialTarget,
  socialTarget,
  googleEnabled,
  facebookEnabled,
  appleEnabled,
  initialMode = 'login'
}: {
  credentialTarget: string;
  socialTarget: string;
  googleEnabled: boolean;
  facebookEnabled: boolean;
  appleEnabled: boolean;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [resetForm, setResetForm] = useState<ResetForm>(initialResetForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasSocialProvider = googleEnabled || facebookEnabled || appleEnabled;
  const canLogin = useMemo(() => Boolean(loginEmail.trim() && loginPassword.trim()), [loginEmail, loginPassword]);
  const canRegister = useMemo(
    () =>
      Boolean(
        registerForm.name.trim() &&
          registerForm.whatsapp.trim() &&
          registerForm.cpf.trim() &&
          registerForm.email.trim() &&
          registerForm.password.trim() &&
          registerForm.address.trim()
      ),
    [registerForm]
  );
  const canReset = useMemo(() => Boolean(resetForm.email.trim()), [resetForm]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
  }

  async function handleCredentialsSignIn(email: string, password: string) {
    const resolvedTarget = isAdminEmail(email) ? '/admin' : credentialTarget;

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      redirectTo: resolvedTarget
    });

    if (!result) {
      throw new Error('Não foi possível iniciar a sessão agora.');
    }

    if (result.error) {
      if (result.error === 'CredentialsSignin') {
        throw new Error('E-mail ou senha inválidos.');
      }

      throw new Error('Não foi possível iniciar a sessão agora.');
    }

    router.push(result.url || resolvedTarget);
    router.refresh();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await handleCredentialsSignIn(loginEmail, loginPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar agora.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: registerForm.name.trim(),
        whatsapp: registerForm.whatsapp.trim(),
        cpf: onlyDigits(registerForm.cpf),
        email: registerForm.email.trim().toLowerCase(),
        password: registerForm.password,
        address: registerForm.address.trim()
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível criar sua conta.');
      }

      setSuccess('Conta criada com sucesso. Fazendo login automaticamente...');
      setLoginEmail(payload.email);
      await handleCredentialsSignIn(payload.email, payload.password);
      setRegisterForm(initialRegisterForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        email: resetForm.email.trim().toLowerCase()
      };

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível enviar o link de recuperação.');
      }

      setResetForm(initialResetForm);
      setSuccess(data?.message || 'Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o link de recuperação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`rounded-[20px] px-4 py-3 text-sm font-medium transition ${
            mode === 'login' ? 'bg-brand-gold text-[#08110d]' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`rounded-[20px] px-4 py-3 text-sm font-medium transition ${
            mode === 'register' ? 'bg-brand-gold text-[#08110d]' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          Criar conta
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-white">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Senha</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canLogin || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-brand-gold px-5 py-3.5 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Entrar com e-mail e senha
          </button>

          <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
            <button
              type="button"
              onClick={() => {
                setResetForm((current) => ({ ...current, email: loginEmail.trim() || current.email }));
                switchMode('reset');
              }}
              className="font-medium text-brand-gold transition hover:opacity-85"
            >
              Esqueci minha senha
            </button>

            <button type="button" onClick={() => switchMode('register')} className="font-medium text-zinc-300 transition hover:text-white">
              Criar conta agora
            </button>
          </div>
        </form>
      ) : null}

      {mode === 'register' ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Nome</span>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  autoComplete="name"
                  value={registerForm.name}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Nome completo"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">WhatsApp</span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  autoComplete="tel"
                  value={registerForm.whatsapp}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, whatsapp: event.target.value }))}
                  placeholder="(48) 99999-9999"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">CPF</span>
              <div className="relative">
                <UserRoundPlus className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={registerForm.cpf}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, cpf: event.target.value }))}
                  placeholder="000.000.000-00"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  autoComplete="email"
                  value={registerForm.email}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="seuemail@exemplo.com"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-white">Senha</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Crie uma senha segura"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Endereço</span>
              <div className="relative">
                <MapPinHouse className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-zinc-500" />
                <textarea
                  value={registerForm.address}
                  onChange={(event) => setRegisterForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Rua, número, bairro, cidade e complemento"
                  className={`${fieldClassName()} min-h-28 pl-11`}
                  required
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canRegister || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-brand-gold px-5 py-3.5 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Criar conta e entrar
          </button>

          <p className="text-center text-sm text-zinc-400">
            Já tem cadastro?{' '}
            <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand-gold transition hover:opacity-85">
              Fazer login
            </button>
          </p>
        </form>
      ) : null}

      {mode === 'reset' ? (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-zinc-300">
            <p className="text-base font-semibold text-white">Recuperação de senha</p>
            <p>Informe seu e-mail para receber um link de recuperação.</p>
          </div>

          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-white">E-mail</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  autoComplete="email"
                  value={resetForm.email}
                  onChange={(event) => setResetForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="seuemail@exemplo.com"
                  className={`${fieldClassName()} pl-11`}
                  required
                />
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={!canReset || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-brand-gold px-5 py-3.5 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar link de recuperação
          </button>

          <p className="text-center text-sm text-zinc-400">
            Lembrou a senha?{' '}
            <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand-gold transition hover:opacity-85">
              Voltar para login
            </button>
          </p>
        </form>
      ) : null}

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

      {hasSocialProvider && mode !== 'reset' ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.28em] text-zinc-500">opcional</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div>
            <p className="mb-3 text-sm text-zinc-400">Se quiser, você também pode usar um provedor social oficial.</p>
            <SocialLoginButtons
              callbackUrl={socialTarget}
              googleEnabled={googleEnabled}
              appleEnabled={appleEnabled}
              facebookEnabled={facebookEnabled}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
