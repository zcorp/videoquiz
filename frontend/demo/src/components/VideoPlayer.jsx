import React from 'react';
import { getVideoEmbedUrl, getVideoReference, getVideoProviderLabel } from '../services/video.js';
import TikTokPlayer from './TikTokPlayer.jsx';
import YouTubePlayer from './YouTubePlayer.jsx';

export default function VideoPlayer({ video, startAt = 0, title }) {
  const reference = getVideoReference(video);
  if (!reference) return null;
  if (reference.provider === 'youtube') {
    return <YouTubePlayer videoId={reference.id} startAt={startAt} title={title} />;
  }
  if (reference.provider === 'tiktok') {
    return <TikTokPlayer videoId={reference.id} startAt={startAt} title={title} />;
  }

  return (
    <iframe
      key={`${reference.provider}:${reference.id}:${reference.hash ?? ''}:${startAt}`}
      src={getVideoEmbedUrl(reference, startAt)}
      title={title || `${getVideoProviderLabel(reference.provider)} video`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
