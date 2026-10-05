import React, { useState } from 'react';

const thumbnailQualities = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault'];

export default function YouTubeThumbnail({ videoId, alt, className, loading = 'lazy' }) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const thumbnailUrl = `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/${thumbnailQualities[qualityIndex]}.jpg`;
  const tryNextQuality = () => setQualityIndex(index => Math.min(index + 1, thumbnailQualities.length - 1));

  return (
    <img
      className={className}
      src={thumbnailUrl}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={event => {
        if (event.currentTarget.naturalWidth < 320) tryNextQuality();
      }}
      onError={tryNextQuality}
    />
  );
}
