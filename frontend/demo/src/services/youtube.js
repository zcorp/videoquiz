const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(value) {
  const input = String(value ?? '').trim();
  if (VIDEO_ID_PATTERN.test(input)) return input;

  let url;
  try {
    url = new URL(/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLocaleLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return VIDEO_ID_PATTERN.test(id ?? '') ? id : null;
  }
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const id = segments[0] === 'watch'
    ? url.searchParams.get('v')
    : ['embed', 'shorts', 'live'].includes(segments[0])
      ? segments[1]
      : null;
  return VIDEO_ID_PATTERN.test(id ?? '') ? id : null;
}
