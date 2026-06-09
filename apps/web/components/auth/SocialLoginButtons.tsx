'use client';

import { useMemo, useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, Loader2, LockKeyhole } from 'lucide-react';

type ProviderKey = 'google' | 'apple' | 'facebook';

type ProviderConfig = {
  id: ProviderKey;
  title: string;
  subtitle: string;
  accent: string;
  enabled: boolean;
};

const brandMap: Record<ProviderKey, { badge: string; icon: string }> = {
  google: {
    badge: 'from-[#4285F4] via-[#34A853] to-[#FBBC05]',
    icon: 'G'
  },
  apple: {
    badge: 'from-white to-zinc-300',
    icon: ''
  },
  facebook: {
    badge: 'from-[#1877F2] to-[#4F8CFF]',
    icon: 'f'
  }
};

function ProviderButton({
  provider,
  loading,
  onSignIn
}: {
  provider: ProviderConfig;
  loading: boolean;
  onSignIn: (provider: ProviderKey) => Promise<void>;
}) {
  const brand = brandMap[provider.id];

  return (
    <button
      type="button"
      onClick={() => onSignIn(provider.id)}
      disabled={!provider.enabled || loading}
      className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-white/8 p-[1px] text-left transition duration-300 hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,114,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_40%)]" />
      <div className="relative flex items-center gap-4 rounded-[27px] bg-[#08110d]/85 px-5 py-4 backdrop-blur-2xl">
        <span
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${brand.badge} text-lg font-semibold text-[#08110d] shadow-[0_12px_30px_rgba(0,0,0,0.22)]`}
        >
          {brand.icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-white">{provider.title}</span>
          <span className="mt-1 block text-sm text-zinc-400">{provider.enabled ? provider.subtitle : 'Configuração pendente no ambiente.'}</span>
        </span>

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
        ) : provider.enabled ? (
          <ArrowRight className="h-5 w-5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
        ) : (
          <LockKeyhole className="h-5 w-5 text-zinc-500" />
        )}
      </div>
    </button>
  );
}

export function SocialLoginButtons({
  callbackUrl,
  googleEnabled,
  appleEnabled,
  facebookEnabled
}: {
  callbackUrl: string;
  googleEnabled: boolean;
  appleEnabled: boolean;
  facebookEnabled: boolean;
}) {
  const [loadingProvider, setLoadingProvider] = useState<ProviderKey | null>(null);

  const providers = useMemo<ProviderConfig[]>(
    () => [
      {
        id: 'google',
        title: 'Continuar com Google',
        subtitle: 'Fluxo oficial OAuth, gratuito e pronto para produção.',
        accent: 'google',
        enabled: googleEnabled
      },
      {
        id: 'apple',
        title: 'Continuar com Apple',
        subtitle: 'Preparado para ativação opcional quando a conta Apple estiver configurada.',
        accent: 'apple',
        enabled: appleEnabled
      },
      {
        id: 'facebook',
        title: 'Continuar com Facebook',
        subtitle: 'Integração oficial da Meta, sem SaaS pago obrigatório.',
        accent: 'facebook',
        enabled: facebookEnabled
      }
    ],
    [appleEnabled, facebookEnabled, googleEnabled]
  );

  async function handleSignIn(provider: ProviderKey) {
    const target = providers.find((item) => item.id === provider);
    if (!target?.enabled) return;

    try {
      setLoadingProvider(provider);
      await signIn(provider, { redirectTo: callbackUrl });
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <ProviderButton key={provider.id} provider={provider} loading={loadingProvider === provider.id} onSignIn={handleSignIn} />
      ))}
    </div>
  );
}
