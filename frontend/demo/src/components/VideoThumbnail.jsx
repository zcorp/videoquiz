import React from 'react';
import { getVideoProviderLabel, getVideoReference } from '../services/video.js';
import YouTubeThumbnail from './YouTubeThumbnail.jsx';

export default function VideoThumbnail({ video, alt, className, loading = 'lazy' }) {
  const reference = getVideoReference(video);
  if (!reference) return <div className={`${className ?? ''} video-thumbnail-placeholder`} role="img" aria-label={alt} />;
  if (reference.provider === 'youtube') {
    return <YouTubeThumbnail videoId={reference.id} alt={alt} className={className} loading={loading} />;
  }

  return (
    <div className={`${className ?? ''} video-thumbnail-placeholder`} role="img" aria-label={alt}>
      <span>{getVideoProviderLabel(reference.provider)}</span>
    </div>
  );
}
