import React, { useEffect, useRef, useState } from 'react';

let playerApiPromise;

function loadPlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!playerApiPromise) {
    playerApiPromise = new Promise((resolve, reject) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        resolve(window.YT);
        if (typeof previousCallback === 'function') previousCallback();
      };

      let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      script.addEventListener('error', () => reject(new Error('Impossible de charger l’API du lecteur YouTube.')), { once: true });
    }).catch(error => {
      playerApiPromise = undefined;
      throw error;
    });
  }
  return playerApiPromise;
}

export default function YouTubePlayer({ videoId, startAt, title }) {
  const container = useRef(null);
  const player = useRef(null);
  const ready = useRef(false);
  const desiredStart = useRef(startAt);
  const desiredTitle = useRef(title);
  const [error, setError] = useState('');
  desiredStart.current = startAt;
  desiredTitle.current = title;

  useEffect(() => {
    let cancelled = false;
    let instance;

    loadPlayerApi().then(api => {
      if (cancelled || !container.current) return;
      const initialStart = Math.max(0, Number(desiredStart.current) || 0);
      instance = new api.Player(container.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          controls: 1,
          disablekb: 0,
          playsinline: 1,
          rel: 0,
          start: initialStart,
          origin: window.location.origin,
        },
        events: {
          onReady: event => {
            if (cancelled) {
              event.target.destroy();
              return;
            }
            player.current = event.target;
            ready.current = true;
            event.target.getIframe().title = desiredTitle.current;
            setError('');
            if (desiredStart.current !== initialStart) {
              event.target.seekTo(Math.max(0, Number(desiredStart.current) || 0), true);
            }
          },
          onError: event => {
            setError(`Le lecteur YouTube a rencontré une erreur (${event.data}).`);
          },
        },
      });
    }).catch(loadError => {
      if (!cancelled) setError(loadError.message);
    });

    return () => {
      cancelled = true;
      ready.current = false;
      player.current = null;
      instance?.destroy();
    };
  }, [videoId]);

  useEffect(() => {
    if (!ready.current || !player.current) return;
    player.current.seekTo(Math.max(0, Number(startAt) || 0), true);
  }, [startAt]);

  useEffect(() => {
    if (ready.current && player.current) player.current.getIframe().title = title;
  }, [title]);

  return (
    <>
      <div className="youtube-player-mount" ref={container} />
      {error && <p className="youtube-player-error" role="status">{error}</p>}
    </>
  );
}
