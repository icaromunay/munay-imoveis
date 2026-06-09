'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { registerHomeVideoEvent } from '@/lib/api';
import { getYoutubeThumbnailUrl, parseYoutubeVideo } from '@/lib/youtube';
import { getClientVisitorKey } from '@/lib/visitor-key';

type HomePresentationVideoProps = {
  title?: string | null;
  description?: string | null;
  youtubeUrl: string;
  thumbnailUrl?: string | null;
  autoplayEnabled?: boolean;
  maskEnabled?: boolean;
};

type InteractionState = 'loading' | 'idle' | 'starting' | 'playing' | 'paused';

type YoutubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YoutubePlayerInstance = {
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => YoutubePlayerState;
};

type YoutubeNamespace = {
  Player: new (
    elementId: string,
    config: {
      width?: string | number;
      height?: string | number;
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YoutubePlayerInstance }) => void;
        onStateChange?: (event: { data: YoutubePlayerState; target: YoutubePlayerInstance }) => void;
        onError?: () => void;
      };
    }
  ) => YoutubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YoutubeNamespace;
    onYouTubeIframeAPIReady?: (() => void) | null;
  }
}

let youtubeApiPromise: Promise<YoutubeNamespace> | null = null;

function warmYoutubeConnections() {
  if (typeof document === 'undefined') return;

  [
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://i.ytimg.com'
  ].forEach((href) => {
    if (document.head.querySelector(`link[data-home-video-preconnect="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.setAttribute('data-home-video-preconnect', href);
    document.head.appendChild(link);
  });
}

function ensureYoutubeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API indisponível fora do navegador.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YoutubeNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-youtube-iframe-api="true"]');
    const timeout = window.setTimeout(() => {
      reject(new Error('A API do YouTube demorou demais para carregar.'));
    }, 12000);

    const cleanupReadyHandler = () => {
      if (window.onYouTubeIframeAPIReady === handleReady) {
        window.onYouTubeIframeAPIReady = null;
      }
    };

    const handleReady = () => {
      if (!window.YT?.Player) return;
      window.clearTimeout(timeout);
      cleanupReadyHandler();
      resolve(window.YT);
    };

    window.onYouTubeIframeAPIReady = handleReady;

    if (existingScript) {
      existingScript.addEventListener('error', () => {
        window.clearTimeout(timeout);
        cleanupReadyHandler();
        reject(new Error('Não foi possível carregar o player do YouTube.'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-youtube-iframe-api', 'true');
    script.onerror = () => {
      window.clearTimeout(timeout);
      cleanupReadyHandler();
      reject(new Error('Falha ao carregar o script do player do YouTube.'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

export function HomePresentationVideo({
  title,
  description,
  youtubeUrl,
  thumbnailUrl,
  autoplayEnabled = true,
  maskEnabled = true
}: HomePresentationVideoProps) {
  const parsedVideo = useMemo(() => parseYoutubeVideo(youtubeUrl), [youtubeUrl]);
  const playerRef = useRef<YoutubePlayerInstance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const playbackTimersRef = useRef<number[]>([]);
  const milestoneRef = useRef<Set<string>>(new Set());
  const soundActivatedRef = useRef(false);
  const playTrackedRef = useRef(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState('');
  const [interactionState, setInteractionState] = useState<InteractionState>(autoplayEnabled ? 'loading' : 'idle');
  const hostId = useId().replace(/[:]/g, '-');

  const effectiveTitle = title?.trim() || 'Vídeo de apresentação';
  const effectiveDescription = description?.trim() || 'Conheça melhor nossa proposta e nossos diferenciais.';
  const previewImage = thumbnailUrl?.trim() || (parsedVideo ? getYoutubeThumbnailUrl(parsedVideo.videoId) : '');

  useEffect(() => {
    warmYoutubeConnections();
  }, []);

  useEffect(() => {
    setPlayerReady(false);
    setError('');
    setInteractionState(autoplayEnabled ? 'loading' : 'idle');
    soundActivatedRef.current = false;
    playTrackedRef.current = false;
    milestoneRef.current.clear();
  }, [autoplayEnabled, youtubeUrl]);

  useEffect(() => {
    if (!parsedVideo) return undefined;

    let cancelled = false;

    const clearPlaybackTimers = () => {
      playbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      playbackTimersRef.current = [];
    };

    const clearProgressInterval = () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };

    const ensureMutedAutoplay = () => {
      const player = playerRef.current;
      if (!player) return;

      const run = () => {
        player.mute();
        player.setVolume(0);
        player.seekTo(0, true);
        player.playVideo();
      };

      run();
      [120, 300, 700].forEach((delay) => {
        const timer = window.setTimeout(run, delay);
        playbackTimersRef.current.push(timer);
      });
    };

    const startProgressTracking = () => {
      clearProgressInterval();
      progressIntervalRef.current = window.setInterval(() => {
        const player = playerRef.current;
        if (!player || !soundActivatedRef.current) return;
        if (player.getPlayerState() !== 1) return;

        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        if (!duration || !currentTime) return;

        const visitorKey = getClientVisitorKey();
        if (!visitorKey) return;

        const progress = (currentTime / duration) * 100;
        const checkpoints: Array<{ threshold: number; event: 'PROGRESS_25' | 'PROGRESS_50' | 'PROGRESS_75' | 'COMPLETE' }> = [
          { threshold: 25, event: 'PROGRESS_25' },
          { threshold: 50, event: 'PROGRESS_50' },
          { threshold: 75, event: 'PROGRESS_75' },
          { threshold: 98, event: 'COMPLETE' }
        ];

        checkpoints.forEach(({ threshold, event }) => {
          if (progress >= threshold && !milestoneRef.current.has(event)) {
            milestoneRef.current.add(event);
            void registerHomeVideoEvent(visitorKey, event);
          }
        });
      }, 1000);
    };

    ensureYoutubeApi()
      .then((YT) => {
        if (cancelled) return;

        playerRef.current?.destroy();

        playerRef.current = new YT.Player(hostId, {
          width: '100%',
          height: '100%',
          videoId: parsedVideo.videoId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            autoplay: autoplayEnabled ? 1 : 0,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            cc_load_policy: 0,
            loop: 1,
            playlist: parsedVideo.videoId,
            origin: window.location.origin
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              setPlayerReady(true);
              setError('');
              target.mute();
              target.setVolume(0);

              if (autoplayEnabled) {
                ensureMutedAutoplay();
                setInteractionState('idle');
              } else {
                target.pauseVideo();
                target.seekTo(0, true);
                setInteractionState('idle');
              }

              startProgressTracking();
            },
            onStateChange: ({ data, target }) => {
              if (cancelled) return;

              if (data === 1) {
                if (soundActivatedRef.current) {
                  setInteractionState('playing');
                } else if (autoplayEnabled) {
                  target.mute();
                  target.setVolume(0);
                  setInteractionState('idle');
                }
                return;
              }

              if (data === 2) {
                setInteractionState(soundActivatedRef.current ? 'paused' : 'idle');
                return;
              }

              if (data === 0) {
                if (soundActivatedRef.current) {
                  target.seekTo(0, true);
                  target.playVideo();
                } else if (autoplayEnabled) {
                  ensureMutedAutoplay();
                }
              }
            },
            onError: () => {
              if (cancelled) return;
              setError('Não foi possível carregar o vídeo da home.');
              setInteractionState('idle');
            }
          }
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Não foi possível iniciar o player do vídeo.');
        setInteractionState('idle');
      });

    return () => {
      cancelled = true;
      clearPlaybackTimers();
      clearProgressInterval();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [autoplayEnabled, hostId, parsedVideo]);

  if (!parsedVideo) return null;

  const clearPlaybackTimers = () => {
    playbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    playbackTimersRef.current = [];
  };

  const registerPlay = () => {
    if (playTrackedRef.current) return;
    const visitorKey = getClientVisitorKey();
    if (!visitorKey) return;
    playTrackedRef.current = true;
    void registerHomeVideoEvent(visitorKey, 'PLAY');
  };

  const queueRepeatedCommand = (callback: () => void, delays: number[]) => {
    clearPlaybackTimers();
    callback();
    delays.forEach((delay) => {
      const timer = window.setTimeout(callback, delay);
      playbackTimersRef.current.push(timer);
    });
  };

  const startFromZeroWithSound = () => {
    const player = playerRef.current;
    if (!playerReady || !player) return;

    soundActivatedRef.current = true;
    registerPlay();
    setInteractionState('starting');

    queueRepeatedCommand(() => {
      player.seekTo(0, true);
      player.unMute();
      player.setVolume(100);
      player.playVideo();
    }, [80, 220, 520, 920, 1600]);
  };

  const resumePlayback = () => {
    const player = playerRef.current;
    if (!playerReady || !player) return;

    soundActivatedRef.current = true;
    setInteractionState('starting');

    queueRepeatedCommand(() => {
      player.unMute();
      player.setVolume(100);
      player.playVideo();
    }, [80, 220, 520, 920]);
  };

  const pausePlayback = () => {
    const player = playerRef.current;
    if (!playerReady || !player) return;
    clearPlaybackTimers();
    player.pauseVideo();
    setInteractionState('paused');
  };

  const handleToggle = () => {
    if (!playerReady) return;

    if (interactionState === 'playing') {
      pausePlayback();
      return;
    }

    if (interactionState === 'paused') {
      resumePlayback();
      return;
    }

    startFromZeroWithSound();
  };

  const showVisualMask = maskEnabled && interactionState !== 'playing';
  const isLoading = interactionState === 'loading' || !playerReady;
  const isStarting = interactionState === 'starting';
  const isPaused = interactionState === 'paused';

  return (
    <section className="content-auto pb-10 pt-8 sm:pb-12 sm:pt-10 lg:pb-14" aria-label="Vídeo institucional da home">
      <style jsx global>{`
        .home-player-host,
        .home-player-host > div,
        .home-player-host iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .home-player-host iframe {
          pointer-events: none;
          transform: scale(1.32);
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
                  {previewImage ? (
                    <img src={previewImage} alt={effectiveTitle} className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-24" />
                  ) : null}

                  <div id={hostId} className="home-player-host absolute inset-0 overflow-hidden" />

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(212,175,114,0.14),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.14),rgba(0,0,0,0.45))]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/72 via-black/14 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                  <div className="pointer-events-none absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black/24 to-transparent" />
                  <div className="pointer-events-none absolute inset-[18px] rounded-[1.6rem] border border-white/10" />
                  <div className="pointer-events-none absolute inset-[28px] rounded-[1.25rem] border border-brand-gold/10" />

                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={!playerReady}
                    className="absolute inset-0 z-20 h-full w-full cursor-pointer disabled:cursor-wait"
                    aria-label={interactionState === 'playing' ? 'Pausar vídeo' : interactionState === 'paused' ? 'Continuar vídeo' : 'Clique para ativar o som'}
                  >
                    {showVisualMask ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,rgba(2,4,3,0.12),rgba(2,4,3,0.32))]">
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

                  {error ? (
                    <div className="pointer-events-none absolute inset-x-6 bottom-6 z-30 rounded-2xl border border-rose-500/20 bg-rose-500/12 px-4 py-3 text-sm text-rose-100 backdrop-blur">
                      {error}
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
