const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;
const vimeoIdPattern = /^\d{1,20}$/;
const dailymotionIdPattern = /^x[a-zA-Z0-9]{5,}$/;
const tiktokIdPattern = /^\d{10,30}$/;
const rutubeIdPattern = /^(?:[a-f\d]{32}|[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})$/i;
const accessKeyPattern = /^[a-zA-Z0-9_-]{4,128}$/;
const idPatterns = {
  youtube: youtubeIdPattern,
  vimeo: vimeoIdPattern,
  dailymotion: dailymotionIdPattern,
  rutube: rutubeIdPattern,
  tiktok: tiktokIdPattern,
};

const hosts = {
  youtube: new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']),
  vimeo: new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']),
  dailymotion: new Set(['dailymotion.com', 'www.dailymotion.com', 'm.dailymotion.com', 'dai.ly', 'www.dai.ly']),
  rutube: new Set(['rutube.ru', 'www.rutube.ru', 'm.rutube.ru']),
  tiktok: new Set(['tiktok.com', 'www.tiktok.com', 'm.tiktok.com']),
};
const tiktokShortHosts = new Set(['vm.tiktok.com', 'vt.tiktok.com']);

function validVideo(provider, id, hash) {
  const validId = idPatterns[provider]?.test(id) ?? false;
  if (!validId) return null;
  if (hash && !accessKeyPattern.test(hash)) return null;
  return { provider, id, ...(hash ? { hash } : {}) };
}

function parsePath(host, path, url) {
  const segments = path.split('/').filter(Boolean);
  if (hosts.youtube.has(host)) {
    const id = host === 'youtu.be'
      ? segments[0]
      : segments[0] === 'watch'
        ? url.searchParams.get('v')
        : ['embed', 'shorts', 'live'].includes(segments[0])
          ? segments[1]
          : null;
    return validVideo('youtube', id ?? '', null);
  }

  if (hosts.vimeo.has(host)) {
    const idIndex = host === 'player.vimeo.com'
      ? segments[0] === 'video' ? 1 : -1
      : segments.reduce((lastIndex, segment, index) => vimeoIdPattern.test(segment) ? index : lastIndex, -1);
    const id = idIndex >= 0 ? segments[idIndex] : '';
    const hash = url.searchParams.get('h') ?? segments[idIndex + 1] ?? null;
    return validVideo('vimeo', id, hash);
  }

  if (hosts.dailymotion.has(host)) {
    const id = host.endsWith('dai.ly')
      ? segments[0]
      : segments[0] === 'video' || (segments[0] === 'embed' && segments[1] === 'video')
        ? segments[segments[0] === 'video' ? 1 : 2]
        : null;
    return validVideo('dailymotion', (id ?? '').split('_')[0], null);
  }

  if (hosts.rutube.has(host)) {
    const idIndex = segments[0] === 'video' && segments[1] === 'private' ? 2
      : segments[0] === 'video' || segments[0] === 'shorts' ? 1
        : segments[0] === 'play' && segments[1] === 'embed' ? 2
          : -1;
    const id = idIndex >= 0 ? segments[idIndex] : '';
    const hash = url.searchParams.get('p') ?? segments[idIndex + 1] ?? null;
    return validVideo('rutube', id, hash);
  }

  if (hosts.tiktok.has(host)) {
    const id = segments[0] === 'player' && segments[1] === 'v1'
      ? segments[2]
      : segments[0]?.startsWith('@') && segments[1] === 'video'
        ? segments[2]
        : segments[0] === 'embed' && segments[1] === 'v2'
          ? segments[2]
          : null;
    return validVideo('tiktok', id ?? '', null);
  }

  return null;
}

export function parseVideoUrl(value) {
  const input = String(value ?? '').trim();
  if (youtubeIdPattern.test(input)) return { provider: 'youtube', id: input };
  let url;
  try {
    url = new URL(/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  return parsePath(url.hostname.toLocaleLowerCase(), url.pathname, url);
}

function getTikTokShortLink(value) {
  const input = String(value ?? '').trim();
  let url;
  try {
    url = new URL(/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  if (
    !['http:', 'https:'].includes(url.protocol)
    || url.username
    || url.password
    || url.port
    || !tiktokShortHosts.has(url.hostname.toLocaleLowerCase())
  ) return null;
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 1 || !/^[a-zA-Z0-9_-]{5,64}$/.test(segments[0])) return null;
  return new URL(`${url.origin}/${segments[0]}`);
}

export function isTikTokShortUrl(value) {
  return Boolean(getTikTokShortLink(value));
}

export async function resolveTikTokShortUrl(value) {
  const shortLink = getTikTokShortLink(value);
  if (!shortLink) return null;

  const endpoint = new URL('https://www.tiktok.com/oembed');
  endpoint.searchParams.set('url', shortLink.href);
  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`TikTok link verification failed: ${response.status}`);

  const data = await response.json();
  const embedUrl = typeof data.html === 'string'
    ? data.html.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]
    : null;
  const video = embedUrl ? parseVideoUrl(embedUrl) : null;
  if (video?.provider !== 'tiktok') throw new Error('TikTok returned an invalid video embed.');
  return video;
}

export function getVideoReference(value) {
  if (typeof value === 'string') return parseVideoUrl(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const rawId = value.id ?? value.videoId;
  if (typeof rawId !== 'string') return null;
  const provider = value.provider ?? value.videoProvider;
  if (!provider) return parseVideoUrl(rawId);
  if (!Object.hasOwn(hosts, provider)) return null;

  const normalizedId = rawId.trim();
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(normalizedId) || /[/?#]/.test(normalizedId) || /^[\w.-]+\.[a-z]{2,}$/i.test(normalizedId)) {
    const parsedUrl = parseVideoUrl(normalizedId);
    return parsedUrl?.provider === provider ? parsedUrl : null;
  }
  const hash = value.hash ?? value.videoHash ?? null;
  if (hash !== null && typeof hash !== 'string') return null;
  return validVideo(provider, normalizedId, hash?.trim() || null);
}

export function getQuizVideo(quiz) {
  return quiz ? getVideoReference({
    provider: quiz.videoProvider,
    id: quiz.videoId,
    hash: quiz.videoHash,
  }) : null;
}

export function getVideoIdentity(value) {
  const video = getVideoReference(value);
  return video ? `${video.provider}:${video.id}` : null;
}

export function getVideoProviderLabel(provider) {
  return ({
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    dailymotion: 'Dailymotion',
    rutube: 'RUTUBE',
    tiktok: 'TikTok',
  })[provider] ?? '';
}

export function getVideoPageUrl(value) {
  const video = getVideoReference(value);
  if (!video) return '';
  if (video.provider === 'youtube') return `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
  if (video.provider === 'vimeo') return `https://vimeo.com/${encodeURIComponent(video.id)}${video.hash ? `/${encodeURIComponent(video.hash)}` : ''}`;
  if (video.provider === 'dailymotion') return `https://www.dailymotion.com/video/${encodeURIComponent(video.id)}`;
  if (video.provider === 'tiktok') return `https://www.tiktok.com/player/v1/${encodeURIComponent(video.id)}`;
  return `https://rutube.ru/video/${video.hash ? 'private/' : ''}${encodeURIComponent(video.id)}/${video.hash ? `?p=${encodeURIComponent(video.hash)}` : ''}`;
}

export function getVideoEmbedUrl(value, seconds = 0) {
  const video = getVideoReference(value);
  if (!video) return '';
  const start = Math.max(0, Math.floor(Number(seconds) || 0));
  if (video.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0&controls=1&disablekb=0&playsinline=1&start=${start}`;
  }
  if (video.provider === 'vimeo') {
    const privacyHash = video.hash ? `?h=${encodeURIComponent(video.hash)}&dnt=1` : '?dnt=1';
    return `https://player.vimeo.com/video/${encodeURIComponent(video.id)}${privacyHash}#t=${start}s`;
  }
  if (video.provider === 'dailymotion') {
    return `https://geo.dailymotion.com/player/x8lr5.html?video=${encodeURIComponent(video.id)}&startTime=${start}`;
  }
  if (video.provider === 'tiktok') {
    return `https://www.tiktok.com/player/v1/${encodeURIComponent(video.id)}?controls=1&description=1&music_info=1`;
  }
  const accessQuery = video.hash ? `?p=${encodeURIComponent(video.hash)}&t=${start}` : `?t=${start}`;
  return `https://rutube.ru/play/embed/${encodeURIComponent(video.id)}/${accessQuery}`;
}
