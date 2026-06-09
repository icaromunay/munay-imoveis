const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export type ParsedYoutubeVideo = {
  videoId: string;
  canonicalUrl: string;
};

export type YoutubeEmbedOptions = {
  autoplay?: boolean;
  controls?: boolean;
  rel?: boolean;
  modestBranding?: boolean;
  playsinline?: boolean;
  fullscreen?: boolean;
  annotations?: boolean;
  keyboard?: boolean;
  enableJsApi?: boolean;
  nocookie?: boolean;
  loop?: boolean;
  origin?: string;
  start?: number;
  mute?: boolean;
};

function extractVideoId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    if (host.includes('youtu.be')) {
      const shortId = url.pathname.replace(/^\//, '').split('/')[0];
      return VIDEO_ID_REGEX.test(shortId) ? shortId : null;
    }

    const watchId = url.searchParams.get('v');
    if (watchId && VIDEO_ID_REGEX.test(watchId)) {
      return watchId;
    }

    const pathSegments = url.pathname.split('/').filter(Boolean);
    const knownPrefix = pathSegments[0];
    const candidate =
      knownPrefix === 'embed' || knownPrefix === 'shorts' || knownPrefix === 'live'
        ? pathSegments[1]
        : null;

    return candidate && VIDEO_ID_REGEX.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function parseYoutubeVideo(value: string): ParsedYoutubeVideo | null {
  const videoId = extractVideoId(value);

  if (!videoId) return null;

  return {
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`
  };
}

export function buildYoutubeEmbedUrl(videoId: string, options: boolean | YoutubeEmbedOptions = false) {
  const resolvedOptions = typeof options === 'boolean' ? { autoplay: options } : options;
  const {
    autoplay = false,
    controls = true,
    rel = false,
    modestBranding = true,
    playsinline = true,
    fullscreen = true,
    annotations = false,
    keyboard = true,
    enableJsApi = false,
    nocookie = true,
    loop = false,
    origin,
    start,
    mute = false
  } = resolvedOptions;

  const baseHost = nocookie ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
  const url = new URL(`${baseHost}/embed/${videoId}`);

  url.searchParams.set('autoplay', autoplay ? '1' : '0');
  url.searchParams.set('controls', controls ? '1' : '0');
  url.searchParams.set('rel', rel ? '1' : '0');
  url.searchParams.set('modestbranding', modestBranding ? '1' : '0');
  url.searchParams.set('playsinline', playsinline ? '1' : '0');
  url.searchParams.set('fs', fullscreen ? '1' : '0');
  url.searchParams.set('iv_load_policy', annotations ? '1' : '3');
  url.searchParams.set('cc_load_policy', '0');
  url.searchParams.set('disablekb', keyboard ? '0' : '1');
  url.searchParams.set('mute', mute ? '1' : '0');

  if (enableJsApi) {
    url.searchParams.set('enablejsapi', '1');
  }

  if (loop) {
    url.searchParams.set('loop', '1');
    url.searchParams.set('playlist', videoId);
  }

  if (origin) {
    url.searchParams.set('origin', origin);
  }

  if (typeof start === 'number' && start > 0) {
    url.searchParams.set('start', String(Math.floor(start)));
  }

  return url.toString();
}

export function getYoutubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
