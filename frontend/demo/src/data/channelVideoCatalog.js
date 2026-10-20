const themeLabels = {
  code_de_la_route: 'Code de la route',
};

function formatThemeSlug(slug) {
  return themeLabels[slug] ?? slug
    .split('_')
    .map(word => word.charAt(0).toLocaleUpperCase('fr-FR') + word.slice(1))
    .join(' ');
}

const channelFiles = import.meta.glob('./themes/*/*.json', {
  eager: true,
  import: 'default',
});

export const channelVideoCatalog = Object.entries(channelFiles).flatMap(([path, channel]) => {
  const themeSlug = path.match(/^\.\/themes\/([^/]+)\//)?.[1];
  if (!themeSlug) throw new Error(`Impossible de déterminer le thème du fichier ${path}`);
  if (!channel.ChannelId || !Array.isArray(channel.Videos)) {
    throw new Error(`Format de chaîne invalide dans ${path}`);
  }

  return channel.Videos.map(video => {
    if (!video.Id || !video.Title) throw new Error(`Vidéo sans identifiant ou titre dans ${path}`);

    return {
      id: video.Id,
      title: video.Title,
      duration: video.Duration,
      theme: formatThemeSlug(themeSlug),
      author: video.Author,
      channelId: channel.ChannelId,
      channelTitle: channel.Title,
      channelUrl: channel.Url,
    };
  });
});
