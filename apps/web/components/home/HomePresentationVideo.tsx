'use client';

import { useMemo, useState } from 'react';
import { registerHomeVideoEvent } from '@/lib/api';
import { buildYoutubeEmbedUrl, getYoutubeThumbnailUrl, parseYoutubeVideo } from '@/lib/youtube';
import { getClientVisitorKey } from '@/lib/visitor-key';

type HomePresentationVideoProps = {
  title?: string | null;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
  autoplayEnabled?: boolean;
  maskEnabled?: boolean;
};

export function HomePresentationVideo({
  title,
  description,
  youtubeUrl,
  thumbnailUrl,
  autoplayEnabled = true,
  maskEnabled = true
}: HomePresentationVideoProps) {
  const parsedVideo = useMemo(() => parseYoutubeVideo(youtubeUrl), [youtubeUrl]);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playTracked, setPlayTracked] = useState(false);

  const effectiveTitle = title?.trim() || 'Vídeo de apresentação';
  const effectiveDescription = description?.trim() || 'Conheça melhor nossa proposta e nossos diferenciais.';
  const previewImage = thumbnailUrl?.trim() || (parsedVideo ? getYoutubeThumbnailUrl(parsedVideo.videoId) : '');

  if (!parsedVideo) return null;

  const embedUrl = buildYoutubeEmbedUrl(parsedVideo.videoId, {
    autoplay: playerActivated && autoplayEnabled,
    controls: true,
    rel: false,
    modestBranding: true,
    playsinline: true,
    fullscreen: true,
    annotations: false,
    keyboard: true,
    enableJsApi: false,
    nocookie: true,
    loop: false,
    mute: false,
    origin: typeof window !== 'undefined' ? window.location.origin : undefined
  });

  const handleActivateVideo = () => {
    if (!playerActivated) {
      setPlayerActivated(true);
    }

    if (!playTracked) {
      const visitorKey = getClientVisitorKey();
      if (visitorKey) {
        void registerHomeVideoEvent(visitorKey, 'PLAY');
      }
      setPlayTracked(true);
    }
  };

  const showVisualMask = maskEnabled && !playerActivated;

  return (
    <section className="content-auto pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14" aria-label="Vídeo institucional da home">
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
                  {playerActivated ? (
                    <iframe
                      src={embedUrl}
                      title={effectiveTitle}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      onLoad={() => setPlayerReady(true)}
                    />
                  ) : previewImage ? (
                    <img src={previewImage} alt={effectiveTitle} className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-40" />
                  ) : null}

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(212,175,114,0.14),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.45))]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/72 via-black/14 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute inset-[18px] rounded-[1.6rem] border border-white/10" />
                  <div className="pointer-events-none absolute inset-[28px] rounded-[1.25rem] border border-brand-gold/10" />

                  {showVisualMask ? (
                    <button
                      type="button"
                      onClick={handleActivateVideo}
                      className="absolute inset-0 z-20 h-full w-full cursor-pointer"
                      aria-label="Clique para carregar o vídeo"
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(2,4,3,0.12),rgba(2,4,3,0.32))]">
                        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-brand-gold/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(212,175,114,0.14),rgba(8,17,13,0.25))] shadow-[0_0_0_10px_rgba(255,255,255,0.03),0_0_0_24px_rgba(212,175,114,0.05),0_24px_60px_rgba(0,0,0,0.36)]">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-brand-gold/12 pl-1 text-[1.9rem] text-brand-gold">
                            ▶
                          </span>
                        </span>

                        <div className="rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(8,17,15,0.48),rgba(8,17,15,0.82))] px-6 py-3 text-center shadow-[0_24px_60px_rgba(0,0,0,0.36)] backdrop-blur-xl">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-zinc-100 sm:text-xs">Clique para carregar o vídeo</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-400">Nenhum app externo é acionado automaticamente</p>
                        </div>
                      </div>
                    </button>
                  ) : null}

                  {playerActivated && !playerReady ? (
                    <div className="pointer-events-none absolute inset-x-6 bottom-6 z-30 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white backdrop-blur">
                      Carregando vídeo…
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
