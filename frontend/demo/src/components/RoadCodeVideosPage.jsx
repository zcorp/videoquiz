import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CCardText, CCardTitle, CFormInput, CFormSelect } from '@coreui/react';
import { videoLibrary } from '../data/demoQuizzes.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import YouTubeThumbnail from './YouTubeThumbnail.jsx';

const PAGE_SIZE = 8;

export default function RoadCodeVideosPage({ quizzes }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState(() => location.pathname.endsWith('/code-route') ? 'CODE DE LA ROUTE' : searchParams.get('theme')?.toLocaleUpperCase('fr-FR') ?? 'all');
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const themes = [...new Set(videoLibrary.map(video => video.theme.toLocaleUpperCase('fr-FR')))].sort((left, right) => left.localeCompare(right, 'fr'));
  const filteredVideos = videoLibrary.filter(video => video.title.toLocaleLowerCase().includes(normalizedQuery) && (themeFilter === 'all' || video.theme.toLocaleUpperCase('fr-FR') === themeFilter));
  const pageCount = Math.max(1, Math.ceil(filteredVideos.length / PAGE_SIZE));
  const visibleVideos = filteredVideos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const search = value => { setQuery(value); setPage(1); };
  const filterTheme = value => { setThemeFilter(value); setPage(1); };
  const associateVideo = video => `/create?mode=qcm&video=${video.id}&title=${encodeURIComponent(video.title)}&topic=${encodeURIComponent(video.theme.toUpperCase())}`;

  return (
    <main className="demo-page road-videos-page">
      <div className="player-topline"><Link to="/" className="back-link">← Bibliothèque</Link><span className="eyebrow">VIDÉOS · COLLECTIONS</span><span className="player-save-note">Sélection YouTube · contenu externe</span></div>
      <header className="road-videos-heading"><div><span className="eyebrow">VIDÉOS POUR VOS QCM</span><h1>{themeFilter === 'all' ? 'Tous les thèmes' : themeFilter}</h1><p>Choisis une vidéo comme support, puis configure le nombre de questions et de choix de ton QCM express.</p></div><span className="road-video-count">{filteredVideos.length} vidéo{filteredVideos.length === 1 ? '' : 's'}</span></header>
      <div className="road-video-toolbar"><CFormInput value={query} onChange={event => search(event.target.value)} placeholder="Rechercher une série…" aria-label="Rechercher une vidéo" /><CFormSelect value={themeFilter} onChange={event => filterTheme(event.target.value)} aria-label="Filtrer par thème"><option value="all">Tous les thèmes</option>{themes.map(theme => <option key={theme} value={theme}>{theme}</option>)}</CFormSelect><span>Chaque vidéo ne peut être associée qu’à un seul quiz.</span></div>
      <div className="road-video-grid">
        {visibleVideos.map(video => {
          const existingQuiz = getQuizUsingVideo(video.id, quizzes);
          const existingQuizPath = existingQuiz?.local ? `/edit/${existingQuiz.id}` : existingQuiz ? `/quiz/${existingQuiz.id}` : null;
          return <CCard className="road-video-card" key={video.id}>
          <div className="road-video-card-media"><YouTubeThumbnail className="card-img-top" videoId={video.id} alt={`Miniature vidéo : ${video.title}`} /><span className="road-video-play" aria-hidden="true">＋</span>{video.duration && <span className="road-video-duration">{video.duration}</span>}</div>
          <CCardBody className="road-video-card-copy"><CBadge className="road-video-series-badge" color="warning">{video.theme}</CBadge><CCardTitle>{video.title}</CCardTitle>{existingQuiz ? <Link className="btn btn-outline-success road-video-open" to={existingQuizPath}>{existingQuiz.local ? 'Modifier le quiz associé' : 'Quiz déjà associé'} <span aria-hidden="true">→</span></Link> : <Link className="btn btn-success road-video-open" to={associateVideo(video)}>Associer à un QCM <span aria-hidden="true">→</span></Link>}<CCardText><a className="road-video-source" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">Source YouTube ↗</a></CCardText></CCardBody>
        </CCard>;
        })}
        {!visibleVideos.length && <div className="library-empty"><span aria-hidden="true">⌕</span><h3>Aucune vidéo trouvée</h3><p>Essaie une autre recherche.</p></div>}
      </div>
      {pageCount > 1 && <nav className="library-pagination" aria-label="Pagination des vidéos"><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Page précédente">←</button><span>Page {page} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label="Page suivante">→</button></nav>}
    </main>
  );
}
