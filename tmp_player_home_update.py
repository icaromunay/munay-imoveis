from pathlib import Path
import re

root = Path('/home/user/workspace_891')

# 1) Prisma schema: add player home flags
schema = root / 'apps/api/prisma/schema.prisma'
text = schema.read_text()
old = '  homeVideoThumbnailUrl String?\n  homeVideoOrder       Int      @default(1)\n'
new = '  homeVideoThumbnailUrl String?\n  homeVideoOrder       Int      @default(1)\n  homeVideoAutoplay    Boolean  @default(true)\n  homeVideoMaskEnabled Boolean  @default(true)\n'
if old not in text:
    raise SystemExit('Prisma schema anchor not found')
text = text.replace(old, new, 1)
schema.write_text(text)

# 2) Migration SQL
migration_dir = root / 'apps/api/prisma/migrations/20260602_add_home_video_player_flags'
migration_dir.mkdir(parents=True, exist_ok=True)
(migration_dir / 'migration.sql').write_text('''ALTER TABLE "SiteSetting"
  ADD COLUMN IF NOT EXISTS "homeVideoAutoplay" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "homeVideoMaskEnabled" BOOLEAN NOT NULL DEFAULT true;
''')

# 3) settings route
settings = root / 'apps/api/src/routes/settings.ts'
text = settings.read_text()
text = text.replace(
"""const homeVideoSchema = z
  .object({
    homeVideoUrl: z.string().trim().optional().default(''),
    homeVideoStatus: z.enum(['ACTIVE', 'INACTIVE']).default('INACTIVE'),
    homeVideoTitle: z.string().trim().max(160).optional().default(''),
    homeVideoDescription: z.string().trim().max(500).optional().default(''),
    homeVideoThumbnailUrl: z.string().trim().optional().default(''),
    homeVideoOrder: z.coerce.number().int().min(1).max(999).optional().default(1)
  })""",
"""const homeVideoSchema = z
  .object({
    homeVideoUrl: z.string().trim().optional().default(''),
    homeVideoStatus: z.enum(['ACTIVE', 'INACTIVE']).default('INACTIVE'),
    homeVideoTitle: z.string().trim().max(160).optional().default(''),
    homeVideoDescription: z.string().trim().max(500).optional().default(''),
    homeVideoThumbnailUrl: z.string().trim().optional().default(''),
    homeVideoOrder: z.coerce.number().int().min(1).max(999).optional().default(1),
    homeVideoAutoplay: z.coerce.boolean().optional().default(true),
    homeVideoMaskEnabled: z.coerce.boolean().optional().default(true)
  })""")
text = text.replace(
"""    homeVideoThumbnailUrl: null,
    homeVideoOrder: 1,
""",
"""    homeVideoThumbnailUrl: null,
    homeVideoOrder: 1,
    homeVideoAutoplay: true,
    homeVideoMaskEnabled: true,
""")
text = text.replace(
"""  return {
    homeVideoUrl: settings.homeVideoUrl || '',
    homeVideoStatus: settings.homeVideoStatus || 'INACTIVE',
    homeVideoTitle: settings.homeVideoTitle || '',
    homeVideoDescription: settings.homeVideoDescription || '',
    homeVideoThumbnailUrl: settings.homeVideoThumbnailUrl || '',
    homeVideoOrder: settings.homeVideoOrder || 1
  };
}""",
"""  return {
    homeVideoUrl: settings.homeVideoUrl || '',
    homeVideoStatus: settings.homeVideoStatus || 'INACTIVE',
    homeVideoTitle: settings.homeVideoTitle || '',
    homeVideoDescription: settings.homeVideoDescription || '',
    homeVideoThumbnailUrl: settings.homeVideoThumbnailUrl || '',
    homeVideoOrder: settings.homeVideoOrder || 1,
    homeVideoAutoplay: settings.homeVideoAutoplay ?? true,
    homeVideoMaskEnabled: settings.homeVideoMaskEnabled ?? true
  };
}""")
# stop syncing settings page into home video config
text = text.replace(
"""    const updated = await prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        heroVideoUrl: heroYoutube?.canonicalUrl || parsed.data.heroVideoUrl,
        homeVideoStatus: heroYoutube ? 'ACTIVE' : existing.homeVideoStatus,
        homeVideoUrl: heroYoutube?.canonicalUrl || existing.homeVideoUrl,
        homeVideoTitle: parsed.data.heroTitle,
        homeVideoDescription: parsed.data.heroSubtitle,
        homeVideoThumbnailUrl: null,
        homeVideoOrder: existing.homeVideoOrder || 1
      }
    });""",
"""    const updated = await prisma.siteSetting.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        heroVideoUrl: heroYoutube?.canonicalUrl || parsed.data.heroVideoUrl
      }
    });""")
text = text.replace(
"""      data: {
        homeVideoStatus: parsed.data.homeVideoStatus,
        homeVideoUrl: youtube?.canonicalUrl || null,
        homeVideoTitle: parsed.data.homeVideoTitle,
        homeVideoDescription: parsed.data.homeVideoDescription,
        homeVideoThumbnailUrl: parsed.data.homeVideoThumbnailUrl || null,
        homeVideoOrder: parsed.data.homeVideoOrder
      }""",
"""      data: {
        homeVideoStatus: parsed.data.homeVideoStatus,
        homeVideoUrl: youtube?.canonicalUrl || null,
        homeVideoTitle: parsed.data.homeVideoTitle,
        homeVideoDescription: parsed.data.homeVideoDescription,
        homeVideoThumbnailUrl: parsed.data.homeVideoThumbnailUrl || null,
        homeVideoOrder: parsed.data.homeVideoOrder,
        homeVideoAutoplay: parsed.data.homeVideoAutoplay,
        homeVideoMaskEnabled: parsed.data.homeVideoMaskEnabled
      }""")
settings.write_text(text)

# 4) dashboard route fallback
route = root / 'apps/api/src/routes/dashboard.ts'
text = route.read_text()
if 'function buildDashboardFallback' not in text:
    text = text.replace("const router = Router();\n", "const router = Router();\n\nfunction buildDashboardFallback() {\n  return {\n    properties: 0,\n    developments: 0,\n    owners: 0,\n    posts: 0,\n    testimonials: 0,\n    leads: 0,\n    featured: 0,\n    launches: 0,\n    pendingApproval: 0,\n    totalViews: 0,\n    mostViewedProperty: null,\n    topViewedProperties: [],\n    last7dViews: 0,\n    last30dViews: 0,\n    recentProperties: [],\n    recentLeads: [],\n    recentAccesses: []\n  };\n}\n")
text = text.replace(
"""  asyncHandler(async (_req, res) => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      properties,
      developments,
      posts,
      testimonials,
      leads,
      featured,
      launches,
      pendingApproval,
      totalViews,
      ownerRows,
      recentProperties,
      recentLeads,
      recentAccesses,
      topViewedProperties,
      last7dViews,
      last30dViews
    ] = await Promise.all([""",
"""  asyncHandler(async (_req, res) => {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const [
        properties,
        developments,
        posts,
        testimonials,
        leads,
        featured,
        launches,
        pendingApproval,
        totalViews,
        ownerRows,
        recentProperties,
        recentLeads,
        recentAccesses,
        topViewedProperties,
        last7dViews,
        last30dViews
      ] = await Promise.all([""")
text = text.replace(
"""    res.json({
      properties,
      developments,
      owners: ownerRows.length,
      posts,
      testimonials,
      leads,
      featured,
      launches,
      pendingApproval,
      totalViews: totalViews._sum.viewCount || 0,
      mostViewedProperty: normalizedTopViewedProperties[0] || null,
      topViewedProperties: normalizedTopViewedProperties,
      last7dViews,
      last30dViews,
      recentProperties,
      recentLeads,
      recentAccesses
    });
  })""",
"""      res.json({
        properties,
        developments,
        owners: ownerRows.length,
        posts,
        testimonials,
        leads,
        featured,
        launches,
        pendingApproval,
        totalViews: totalViews._sum.viewCount || 0,
        mostViewedProperty: normalizedTopViewedProperties[0] || null,
        topViewedProperties: normalizedTopViewedProperties,
        last7dViews,
        last30dViews,
        recentProperties,
        recentLeads,
        recentAccesses
      });
    } catch (error) {
      console.warn('[dashboard] fallback payload returned after query failure', error);
      res.json(buildDashboardFallback());
    }
  })""")
route.write_text(text)

# 5) types
lib_types = root / 'apps/web/lib/types.ts'
text = lib_types.read_text()
text = text.replace(
"""  homeVideoThumbnailUrl?: string | null;
  homeVideoOrder?: number;
""",
"""  homeVideoThumbnailUrl?: string | null;
  homeVideoOrder?: number;
  homeVideoAutoplay?: boolean;
  homeVideoMaskEnabled?: boolean;
""")
lib_types.write_text(text)

# 6) AdminShell add PLAYER HOME
admin_shell = root / 'apps/web/components/admin/AdminShell.tsx'
text = admin_shell.read_text()
text = text.replace(
"""import { BarChart3, Building2, FileText, LayoutPanelTop, LogOut, Palette, Plus, Settings, TrendingUp, Waypoints } from 'lucide-react';""",
"""import { BarChart3, Building2, FileText, LayoutPanelTop, LogOut, Palette, Plus, Settings, TrendingUp, Video, Waypoints } from 'lucide-react';""")
text = text.replace(
"""  { href: '/admin/views', label: 'Views', icon: TrendingUp },
  { href: '/admin/leads', label: 'Leads', icon: LayoutPanelTop },
  { href: '/admin/settings', label: 'Configurações', icon: Settings }""",
"""  { href: '/admin/views', label: 'Views', icon: TrendingUp },
  { href: '/admin/leads', label: 'Leads', icon: LayoutPanelTop },
  { href: '/admin/home-video', label: 'PLAYER HOME', icon: Video },
  { href: '/admin/settings', label: 'Configurações', icon: Settings }""")
admin_shell.write_text(text)

# 7) settings page remove direct video control emphasis
settings_page = root / 'apps/web/app/admin/settings/page.tsx'
text = settings_page.read_text()
text = text.replace(
"""        <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-sm leading-6 text-zinc-200">
          Salvar nesta tela atualiza imediatamente o vídeo, o título e o subtítulo exibidos acima do vídeo na home.
        </div>""",
"""        <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 px-4 py-4 text-sm leading-6 text-zinc-200">
          As configurações do vídeo da home agora ficam na sessão <strong>PLAYER HOME</strong>. Aqui você mantém apenas identidade visual, textos gerais e contatos do portal.
        </div>""")
text = text.replace(
"""          ['brandName', 'Nome da marca'], ['heroTitle', 'Título acima do vídeo da home'], ['heroSubtitle', 'Subtítulo acima do vídeo da home'], ['heroVideoUrl', 'URL do vídeo da home (YouTube)'], ['whatsappNumber', 'WhatsApp'], ['creci', 'CRECI'], ['cnpj', 'CNPJ'], ['address', 'Endereço'], ['phone', 'Telefone'], ['instagram', 'Instagram'], ['privacyUrl', 'Política de privacidade']""",
"""          ['brandName', 'Nome da marca'], ['heroTitle', 'Título principal da home'], ['heroSubtitle', 'Subtítulo principal da home'], ['whatsappNumber', 'WhatsApp'], ['creci', 'CRECI'], ['cnpj', 'CNPJ'], ['address', 'Endereço'], ['phone', 'Telefone'], ['instagram', 'Instagram'], ['privacyUrl', 'Política de privacidade']""")
settings_page.write_text(text)

# 8) home-video page rename and add toggles
home_video = root / 'apps/web/app/admin/home-video/page.tsx'
text = home_video.read_text()
text = text.replace(
"""const emptyForm = {
  homeVideoUrl: '',
  homeVideoStatus: 'INACTIVE',
  homeVideoTitle: '',
  homeVideoDescription: '',
  homeVideoThumbnailUrl: '',
  homeVideoOrder: 1
};""",
"""const emptyForm = {
  homeVideoUrl: '',
  homeVideoStatus: 'INACTIVE',
  homeVideoTitle: '',
  homeVideoDescription: '',
  homeVideoThumbnailUrl: '',
  homeVideoOrder: 1,
  homeVideoAutoplay: true,
  homeVideoMaskEnabled: true
};""")
text = text.replace('title="Vídeo Home"', 'title="PLAYER HOME"')
text = text.replace('Apresentação em vídeo na Home', 'Configuração completa do PLAYER HOME')
text = text.replace('Vídeo Home salvo com sucesso. A Home já refletirá a alteração automaticamente.', 'PLAYER HOME salvo com sucesso. A Home já refletirá a alteração automaticamente.')
text = text.replace('Salvar Vídeo Home', 'Salvar PLAYER HOME')
text = text.replace('Carregando configurações do Vídeo Home...', 'Carregando configurações do PLAYER HOME...')
text = text.replace('Não foi possível carregar as configurações do Vídeo Home.', 'Não foi possível carregar as configurações do PLAYER HOME.')
text = text.replace('Não foi possível salvar o Vídeo Home.', 'Não foi possível salvar o PLAYER HOME.')
text = text.replace(
"""          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Nova funcionalidade</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Apresentação em vídeo na Home</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Cole um link do YouTube, defina o status e personalize título, texto de apoio, thumbnail e ordem futura. Quando ativo, o vídeo aparecerá apenas na Home, entre o menu principal e a pesquisa inteligente.
            </p>
          </div>""",
"""          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Player da Home</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Configuração completa do PLAYER HOME</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Nesta tela você controla toda a operação do vídeo da home: link do YouTube, ativação, autoplay em mudo, máscara elegante sobre o vídeo e os textos exibidos acima do player.
            </p>
          </div>""")
anchor = """            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Ordem de exibição futura</span>
              <input
                type="number"
                min="1"
                max="999"
                value={form.homeVideoOrder ?? 1}
                onChange={(e) => setForm({ ...form, homeVideoOrder: e.target.value })}
                className={inputClassName()}
              />
            </label>
"""
insert = anchor + """
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Autoplay ao abrir a home</span>
              <select value={String(form.homeVideoAutoplay ?? true)} onChange={(e) => setForm({ ...form, homeVideoAutoplay: e.target.value === 'true' })} className={inputClassName()}>
                <option value="true" className="bg-[#08110d] text-white">Sim, iniciar em mudo por baixo da máscara</option>
                <option value="false" className="bg-[#08110d] text-white">Não, deixar parado aguardando clique</option>
              </select>
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Máscara sobre o vídeo</span>
              <select value={String(form.homeVideoMaskEnabled ?? true)} onChange={(e) => setForm({ ...form, homeVideoMaskEnabled: e.target.value === 'true' })} className={inputClassName()}>
                <option value="true" className="bg-[#08110d] text-white">Ativar máscara com botão play e texto</option>
                <option value="false" className="bg-[#08110d] text-white">Desativar máscara visível</option>
              </select>
              <span className="block text-xs text-zinc-500">Quando a máscara estiver ativa, o vídeo pode rodar em mudo por baixo dela até o visitante clicar para reiniciar do zero com som.</span>
            </label>
"""
if anchor in text:
    text = text.replace(anchor, insert, 1)
text = text.replace(
"""                <span>Status atual</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-300'}`}>
                  {form.homeVideoStatus === 'ACTIVE' ? <Eye size={13} /> : <EyeOff size={13} />}
                  {form.homeVideoStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Link válido</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${parsedVideo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  <CheckCircle2 size={13} />
                  {parsedVideo ? 'Válido' : 'Pendente'}
                </span>
              </div>""",
"""                <span>Status atual</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-300'}`}>
                  {form.homeVideoStatus === 'ACTIVE' ? <Eye size={13} /> : <EyeOff size={13} />}
                  {form.homeVideoStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Link válido</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${parsedVideo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  <CheckCircle2 size={13} />
                  {parsedVideo ? 'Válido' : 'Pendente'}
                </span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Autoplay</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoAutoplay ? 'bg-brand-gold/10 text-brand-gold' : 'bg-zinc-500/10 text-zinc-300'}`}>{form.homeVideoAutoplay ? 'Ligado' : 'Desligado'}</span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Máscara</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoMaskEnabled ? 'bg-brand-gold/10 text-brand-gold' : 'bg-zinc-500/10 text-zinc-300'}`}>{form.homeVideoMaskEnabled ? 'Ativa' : 'Oculta'}</span>
              </div>""")
text = text.replace('Resumo da configuração', 'Resumo do PLAYER HOME')
text = text.replace('Prévia da capa', 'Prévia visual do player')
text = text.replace('Vídeo detectado:', 'Vídeo detectado:')
home_video.write_text(text)

# 9) Home page use player home settings first and flags
home_page = root / 'apps/web/app/page.tsx'
text = home_page.read_text()
text = text.replace(
"""  const resolvedHomeVideoUrl = settings.homeVideoUrl?.trim() || settings.heroVideoUrl?.trim() || '';
  const resolvedHomeVideoTitle = settings.heroTitle?.trim() || settings.homeVideoTitle?.trim() || '';
  const resolvedHomeVideoDescription = settings.heroSubtitle?.trim() || settings.homeVideoDescription?.trim() || '';
  const resolvedHomeVideoThumbnail = settings.homeVideoThumbnailUrl?.trim() || undefined;
  const showHomeVideo = Boolean(resolvedHomeVideoUrl) && (settings.homeVideoStatus === 'ACTIVE' || Boolean(settings.heroVideoUrl?.trim()));""",
"""  const resolvedHomeVideoUrl = settings.homeVideoUrl?.trim() || settings.heroVideoUrl?.trim() || '';
  const resolvedHomeVideoTitle = settings.homeVideoTitle?.trim() || settings.heroTitle?.trim() || '';
  const resolvedHomeVideoDescription = settings.homeVideoDescription?.trim() || settings.heroSubtitle?.trim() || '';
  const resolvedHomeVideoThumbnail = settings.homeVideoThumbnailUrl?.trim() || undefined;
  const resolvedHomeVideoAutoplay = settings.homeVideoAutoplay ?? true;
  const resolvedHomeVideoMaskEnabled = settings.homeVideoMaskEnabled ?? true;
  const showHomeVideo = settings.homeVideoStatus === 'ACTIVE' && Boolean(resolvedHomeVideoUrl);""")
text = text.replace(
"""        <HomePresentationVideo
          youtubeUrl={resolvedHomeVideoUrl}
          title={resolvedHomeVideoTitle}
          description={resolvedHomeVideoDescription}
          thumbnailUrl={resolvedHomeVideoThumbnail}
        />""",
"""        <HomePresentationVideo
          youtubeUrl={resolvedHomeVideoUrl}
          title={resolvedHomeVideoTitle}
          description={resolvedHomeVideoDescription}
          thumbnailUrl={resolvedHomeVideoThumbnail}
          autoplayEnabled={resolvedHomeVideoAutoplay}
          maskEnabled={resolvedHomeVideoMaskEnabled}
        />""")
home_page.write_text(text)

# 10) HomePresentationVideo rewrite with iframe + postMessage controls
video_component = root / 'apps/web/components/home/HomePresentationVideo.tsx'
video_component.write_text('''\
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getYoutubeThumbnailUrl, parseYoutubeVideo } from '@/lib/youtube';

type HomePresentationVideoProps = {
  title?: string | null;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
  autoplayEnabled?: boolean;
  maskEnabled?: boolean;
};

type InteractionState = 'loading' | 'idle' | 'playing' | 'paused' | 'starting';

function buildEmbedUrl(videoId: string, autoplayEnabled: boolean) {
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: autoplayEnabled ? '1' : '0',
    mute: autoplayEnabled ? '1' : '0',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    fs: '0',
    disablekb: '1',
    iv_load_policy: '3',
    cc_load_policy: '0'
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function HomePresentationVideo({
  title,
  description,
  youtubeUrl,
  thumbnailUrl,
  autoplayEnabled = true,
  maskEnabled = true
}: HomePresentationVideoProps) {
  const video = useMemo(() => parseYoutubeVideo(youtubeUrl), [youtubeUrl]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [interactionState, setInteractionState] = useState<InteractionState>(autoplayEnabled ? 'loading' : 'idle');

  const effectiveTitle = title?.trim() || 'Quem sou';
  const effectiveDescription = description?.trim() || 'Conheça minha trajetória e minha forma de trabalhar.';
  const previewImage = thumbnailUrl?.trim() || (video ? getYoutubeThumbnailUrl(video.videoId) : '');
  const embedUrl = video ? buildEmbedUrl(video.videoId, autoplayEnabled) : '';

  useEffect(() => {
    setIframeLoaded(false);
    setInteractionState(autoplayEnabled ? 'loading' : 'idle');
  }, [autoplayEnabled, youtubeUrl]);

  if (!video) return null;

  function postPlayerCommand(func: string, args: unknown[] = []) {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*'
    );
  }

  function startFromZeroWithSound() {
    setInteractionState('starting');
    const run = () => {
      postPlayerCommand('seekTo', [0, true]);
      postPlayerCommand('unMute');
      postPlayerCommand('setVolume', [100]);
      postPlayerCommand('playVideo');
    };
    run();
    window.setTimeout(run, 80);
    window.setTimeout(run, 220);
    window.setTimeout(run, 500);
    window.setTimeout(() => setInteractionState('playing'), 650);
  }

  function resumePlayback() {
    setInteractionState('starting');
    const run = () => {
      postPlayerCommand('unMute');
      postPlayerCommand('setVolume', [100]);
      postPlayerCommand('playVideo');
    };
    run();
    window.setTimeout(run, 80);
    window.setTimeout(run, 220);
    window.setTimeout(() => setInteractionState('playing'), 450);
  }

  function pausePlayback() {
    postPlayerCommand('pauseVideo');
    setInteractionState('paused');
  }

  function handleClick() {
    if (interactionState === 'playing') {
      pausePlayback();
      return;
    }
    if (interactionState === 'paused') {
      resumePlayback();
      return;
    }
    startFromZeroWithSound();
  }

  const showMask = maskEnabled && interactionState !== 'playing';
  const isStarting = interactionState === 'starting';
  const isPaused = interactionState === 'paused';
  const isLoading = interactionState === 'loading' || (!iframeLoaded && autoplayEnabled);

  return (
    <section className="content-auto pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14" aria-label="Vídeo institucional da home">
      <style jsx global>{`
        .home-player-embed iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          pointer-events: none;
          transform: scale(1.28);
          transform-origin: center center;
        }
      `}</style>

      <div className="container-base">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-7 text-center sm:mb-9">
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl xl:text-[3.1rem]">{effectiveTitle}</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base md:leading-8">{effectiveDescription}</p>
            <div className="mx-auto mt-5 h-px w-28 bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent" aria-hidden="true" />
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-10 top-10 h-28 w-28 rounded-full bg-brand-gold/14 blur-3xl sm:h-40 sm:w-40" />
            <div className="pointer-events-none absolute -bottom-8 right-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl sm:h-44 sm:w-44" />

            <div className="overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-[10px] shadow-[0_28px_120px_rgba(0,0,0,0.36)] sm:p-3">
              <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#07100c_0%,#040806_100%)]">
                <div className="relative aspect-video overflow-hidden bg-black">
                  {previewImage ? <img src={previewImage} alt={effectiveTitle} className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-24" /> : null}

                  <div className="home-player-embed absolute inset-0 overflow-hidden">
                    <iframe
                      ref={iframeRef}
                      src={embedUrl}
                      title={effectiveTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      onLoad={() => {
                        setIframeLoaded(true);
                        if (autoplayEnabled) {
                          window.setTimeout(() => setInteractionState('idle'), 450);
                        }
                      }}
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(212,175,114,0.14),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.48))]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/72 via-black/16 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute inset-[18px] rounded-[1.6rem] border border-white/10" />
                  <div className="pointer-events-none absolute inset-[28px] rounded-[1.25rem] border border-brand-gold/10" />

                  <button
                    type="button"
                    onClick={handleClick}
                    className="absolute inset-0 z-20 h-full w-full cursor-pointer"
                    aria-label={interactionState === 'playing' ? 'Pausar vídeo' : 'Clique para ativar o som'}
                  >
                    {showMask ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(2,4,3,0.12),rgba(2,4,3,0.28))]">
                        {isStarting ? (
                          <span className="inline-flex h-16 w-16 items-center justify-center">
                            <svg className="animate-spin text-brand-gold" viewBox="0 0 24 24" fill="none" width={40} height={40}>
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-brand-gold/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(212,175,114,0.14),rgba(8,17,13,0.25))] shadow-[0_0_0_10px_rgba(255,255,255,0.03),0_0_0_24px_rgba(212,175,114,0.05),0_24px_60px_rgba(0,0,0,0.36)]">
                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-brand-gold/12 pl-1 text-[1.9rem] text-brand-gold">
                              {isPaused ? '⏸' : '▶'}
                            </span>
                          </span>
                        )}

                        <div className="rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(8,17,15,0.48),rgba(8,17,15,0.82))] px-6 py-3 text-center shadow-[0_24px_60px_rgba(0,0,0,0.36)] backdrop-blur-xl">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-100 sm:text-xs">
                            {isStarting ? 'Abrindo vídeo…' : isPaused ? 'Clique para continuar' : 'Clique para Ativar o Som'}
                          </p>
                          {isLoading ? <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">Carregando…</p> : null}
                        </div>
                      </div>
                    ) : null}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
''')

print('done')
