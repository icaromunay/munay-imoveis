import type { Metadata } from 'next';
import './globals.css';
import { ThemeVariablesStyle, OFFICIAL_THEME_LAYOUT_SLUG } from '@/components/layout/ThemeVariablesStyle';
import { TrafficScripts } from '@/components/layout/TrafficScripts';
import { AppChrome } from '@/components/layout/AppChrome';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { getSettings } from '@/lib/api';
import { safeAuth } from '@/lib/safe-auth';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function extractVerificationContent(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const metaContentMatch = raw.match(/content=["']([^"']+)["']/i);
  if (metaContentMatch?.[1]) {
    return metaContentMatch[1].trim();
  }

  return raw.replace(/<[^>]+>/g, '').trim();
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Munay Imóveis | Compra, venda e investimento imobiliário',
    template: '%s | Munay Imóveis'
  },
  description:
    'Munay Imóveis com foco em compra e venda de imóveis, terrenos, apartamentos, casas, loteamentos e oportunidades imobiliárias para morar ou investir.',
  applicationName: 'Munay Imóveis',
  authors: [{ name: 'Ícarõ Munay' }],
  keywords: ['imobiliária', 'imóveis', 'terrenos', 'apartamentos', 'casas', 'loteamentos', 'investimento imobiliário'],
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: 'Munay Imóveis | Compra, venda e investimento imobiliário',
    description:
      'Imóveis, terrenos, apartamentos, casas e loteamentos com atendimento profissional, foco em leads e oportunidades imobiliárias reais.',
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Munay Imóveis'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Munay Imóveis | Compra, venda e investimento imobiliário',
    description:
      'Imóveis, terrenos, apartamentos, casas e loteamentos com atendimento profissional e foco em geração de leads qualificados.'
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const startedAt = Date.now();
  const settingsPromise = getSettings();
  const sessionPromise = safeAuth().catch((error) => {
    console.error('[auth] root-layout-session-fallback', error);
    return null;
  });
  const [settings, session] = await Promise.all([settingsPromise, sessionPromise]);
  const duration = Date.now() - startedAt;
  console.info(`[theme:render-root] slug=${OFFICIAL_THEME_LAYOUT_SLUG} mode=static duration=${duration}ms`);

  const googleVerification = extractVerificationContent(settings.googleSiteVerification);
  const metaVerification = extractVerificationContent(settings.metaDomainVerification);
  const bingVerification = extractVerificationContent(settings.bingSiteVerification);

  return (
    <html lang="pt-BR">
      <head>
        <ThemeVariablesStyle layout={null} />
        {googleVerification ? <meta name="google-site-verification" content={googleVerification} /> : null}
        {metaVerification ? <meta name="facebook-domain-verification" content={metaVerification} /> : null}
        {bingVerification ? <meta name="msvalidate.01" content={bingVerification} /> : null}
      </head>
      <body suppressHydrationWarning className="min-h-screen antialiased" data-theme-layout={OFFICIAL_THEME_LAYOUT_SLUG} data-theme-mode="static">
        <TrafficScripts settings={settings} />
        <AuthProvider session={session}>
          <AppChrome settings={settings}>{children}</AppChrome>
        </AuthProvider>
      </body>
    </html>
  );
}
