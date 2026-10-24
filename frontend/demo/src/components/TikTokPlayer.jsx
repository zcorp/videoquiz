import React, { useEffect, useRef, useState } from 'react';
import { getVideoEmbedUrl } from '../services/video.js';

const PLAYER_ORIGIN = 'https://www.tiktok.com';

export default function TikTokPlayer({ videoId, startAt = 0, title }) {
  const iframeRef = useRef(null);
  const previousStartAt = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const handleMessage = event => {
      if (
        event.origin !== PLAYER_ORIGIN
        || event.source !== iframeRef.current?.contentWindow
        || event.data?.['x-tiktok-player'] !== true
      ) return;
      if (event.data.type === 'onPlayerReady') setPlayerReady(true);
      if (event.data.type === 'onStateChange' && event.data.value === 1) setHasStarted(true);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!playerReady) return undefined;
    const target = Math.max(0, Math.floor(Number(startAt) || 0));
    if (target === 0 && previousStartAt.current === null) {
      previousStartAt.current = target;
      return undefined;
    }
    if (target === 0 && previousStartAt.current === target) return undefined;
    if (target > 0 && !hasStarted) return undefined;
    previousStartAt.current = target;
    const seekToQuestion = () => iframeRef.current?.contentWindow?.postMessage({
      'x-tiktok-player': true,
      type: 'seekTo',
      value: target,
    }, PLAYER_ORIGIN);
    seekToQuestion();
  }, [hasStarted, playerReady, startAt]);

  return (
    <iframe
      ref={iframeRef}
      src={getVideoEmbedUrl({ provider: 'tiktok', id: videoId })}
      title={title || 'TikTok video'}
      allow="fullscreen; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
