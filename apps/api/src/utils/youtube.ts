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
