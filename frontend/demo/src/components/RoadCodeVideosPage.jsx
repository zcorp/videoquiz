import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CCardText, CCardTitle, CFormInput } from '@coreui/react';
import { videoLibrary } from '../data/demoQuizzes.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import YouTubeThumbnail from './YouTubeThumbnail.jsx';
import DemoIcon from './DemoIcon.jsx';
import { translateTopic, useLanguage } from '../i18n.jsx';

const PAGE_SIZE = 8;
const formatVideoCount = (count, t) => `${count} ${t(count === 1 ? 'vidéo' : 'vidéos')}`;

export default function RoadCodeVideosPage({ quizzes }) {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState(() => location.pathname.endsWith('/code-route') ? 'CODE DE LA ROUTE' : searchParams.get('theme')?.toLocaleUpperCase('fr-FR') ?? 'all');
  const [activeRoadTab, setActiveRoadTab] = useState('videos');
  const [nephSituation, setNephSituation] = useState('new');
  const [page, setPage] = useState(1);
  const themeToolbar = useRef(null);
  const [hasMoreThemes, setHasMoreThemes] = useState(false);
  const isRoadCodeTheme = themeFilter === 'CODE DE LA ROUTE';
  const roadTabs = [
    { id: 'videos', label: 'Vidéos & quiz', number: '01' },
    { id: 'neph', label: 'Mon NEPH', number: '02' },
    { id: 'centre', label: 'Mon centre', number: '03' },
    { id: 'jour', label: 'Le jour J', number: '04' },
  ];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const themeOptions = [
    { value: 'all', label: 'Tous les thèmes', count: videoLibrary.length },
    ...[...new Set(videoLibrary.map(video => video.theme))]
      .map(theme => ({
        value: theme.toLocaleUpperCase('fr-FR'),
        label: theme,
        count: videoLibrary.filter(video => video.theme === theme).length,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'fr')),
  ];
  useEffect(() => {
    const toolbar = themeToolbar.current;
    if (!toolbar) return undefined;
    const updateOverflow = () => setHasMoreThemes(toolbar.scrollLeft + toolbar.clientWidth < toolbar.scrollWidth - 1);
    updateOverflow();
    toolbar.addEventListener('scroll', updateOverflow, { passive: true });
    window.addEventListener('resize', updateOverflow);
    return () => {
      toolbar.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [themeOptions.length]);
  const filteredVideos = videoLibrary.filter(video => {
    const searchableText = `${video.title} ${video.author ?? ''} ${video.channelTitle ?? ''}`.toLocaleLowerCase();
    return searchableText.includes(normalizedQuery)
      && (themeFilter === 'all' || video.theme.toLocaleUpperCase('fr-FR') === themeFilter);
  });
  const pageCount = Math.max(1, Math.ceil(filteredVideos.length / PAGE_SIZE));
  const visibleVideos = filteredVideos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const search = value => { setQuery(value); setPage(1); };
  const filterTheme = value => { setThemeFilter(value); setPage(1); if (value !== 'CODE DE LA ROUTE') setActiveRoadTab('videos'); };
  const showVideoToolbar = !isRoadCodeTheme || activeRoadTab === 'videos';
  const associateVideo = video => `/create?mode=qcm&video=${video.id}&title=${encodeURIComponent(video.title)}&topic=${encodeURIComponent(video.theme.toUpperCase())}`;
  const handleRoadTabKeyDown = (event, index) => {
    const lastIndex = roadTabs.length - 1;
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % roadTabs.length
      : event.key === 'ArrowLeft' ? (index + lastIndex) % roadTabs.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? lastIndex
            : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    setActiveRoadTab(roadTabs[nextIndex].id);
    document.getElementById(`road-tab-${roadTabs[nextIndex].id}`)?.focus();
  };

  const videoCollection = (
    <>
      {isRoadCodeTheme && <div className="road-revisions-heading"><div><span className="eyebrow">{t('APPRENDRE EN REGARDANT')}</span><h2>{t('Tes révisions Code de la route')}</h2><p>{t('Choisis une vidéo, associe-la à un QCM et avance à ton rythme.')}</p></div><Link to="/suivi">{t('Retrouver mon suivi')} <DemoIcon name="arrowRight" /></Link></div>}
      <div className="road-video-grid">
        {visibleVideos.map(video => {
          const existingQuiz = getQuizUsingVideo(video.id, quizzes);
          const existingQuizPath = existingQuiz?.local ? `/edit/${existingQuiz.id}` : existingQuiz ? `/quiz/${existingQuiz.id}` : null;
          return <CCard className="road-video-card" key={video.id}>
          <div className="road-video-card-media"><YouTubeThumbnail className="card-img-top" videoId={video.id} alt={`${t('Miniature vidéo :')} ${video.title}`} /><span className="road-video-play"><DemoIcon name="plus" /></span>{video.duration && <span className="road-video-duration">{video.duration}</span>}</div>
          <CCardBody className="road-video-card-copy"><CBadge className="road-video-series-badge" color="warning">{translateTopic(video.theme, language)}</CBadge><CCardTitle>{video.title}</CCardTitle>{video.channelTitle && <a className="road-video-channel" href={video.channelUrl} target="_blank" rel="noreferrer">{video.channelTitle}</a>}{existingQuiz ? <Link className="btn btn-outline-success road-video-open" to={existingQuizPath}>{t(existingQuiz.local ? 'Modifier le quiz associé' : 'Quiz déjà associé')} <DemoIcon name="arrowRight" /></Link> : <Link className="btn btn-success road-video-open" to={associateVideo(video)}>{t('Créer un QCM avec cette vidéo')} <DemoIcon name="arrowRight" /></Link>}<CCardText><a className="road-video-source" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">{t('Source YouTube')} <DemoIcon name="externalLink" /></a></CCardText></CCardBody>
        </CCard>;
        })}
        {!visibleVideos.length && <div className="library-empty"><DemoIcon name="magnifyingGlass" /><h3>{t('Aucune vidéo trouvée')}</h3><p>{t('Essaie une autre recherche.')}</p></div>}
      </div>
      {pageCount > 1 && <nav className="library-pagination" aria-label={t('Pagination des vidéos')}><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label={t('Page précédente')}><DemoIcon name="arrowLeft" /></button><span>{t('Page')} {page} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label={t('Page suivante')}><DemoIcon name="arrowRight" /></button></nav>}
    </>
  );

  return (
    <main className={`demo-page road-videos-page${isRoadCodeTheme ? ' is-road-code-theme' : ''}`}>
      <div className="player-topline"><span className="eyebrow">{t('VIDÉOS · COLLECTIONS')}</span><span className="player-save-note">{t('Sélection YouTube · contenu externe')}</span></div>
      <header className="road-videos-heading"><div><span className="eyebrow">{t('VIDÉOS POUR VOS QCM')}</span><h1>{themeFilter === 'all' ? t('Tous les thèmes') : translateTopic(themeFilter, language)}</h1><p>{t('Choisis une vidéo comme support, puis configure le nombre de questions et de choix de ton QCM express.')}</p></div><span className="road-video-count">{formatVideoCount(filteredVideos.length, t)}</span></header>
      {showVideoToolbar && <div className="road-video-toolbar">
        <CFormInput value={query} onChange={event => search(event.target.value)} placeholder={t('Rechercher une série…')} aria-label={t('Rechercher une vidéo')} />
        <span>{t('Chaque vidéo ne peut être associée qu’à un seul quiz.')}</span>
      </div>}
      <div ref={themeToolbar} className={`video-theme-toolbar${hasMoreThemes ? ' has-more-themes' : ''}`} role="group" aria-label={t('Filtrer les vidéos par thème')}>
        {themeOptions.map(theme => <button
          type="button"
          key={theme.value}
          className={`video-theme-filter${themeFilter === theme.value ? ' is-active' : ''}`}
          aria-pressed={themeFilter === theme.value}
          aria-label={`${translateTopic(theme.label, language)}, ${formatVideoCount(theme.count, t)}`}
          onClick={() => filterTheme(theme.value)}
        >{translateTopic(theme.label, language)}<span aria-hidden="true">{theme.count}</span></button>)}
      </div>
      {isRoadCodeTheme && (
        <>
          <nav className="road-prep-tabs" role="tablist" aria-label="Préparer l’examen du code de la route">
            {roadTabs.map((tab, index) => <button id={`road-tab-${tab.id}`} type="button" role="tab" aria-selected={activeRoadTab === tab.id} aria-controls="road-tabpanel" tabIndex={activeRoadTab === tab.id ? 0 : -1} className={activeRoadTab === tab.id ? 'is-active' : ''} key={tab.id} onClick={() => setActiveRoadTab(tab.id)} onKeyDown={event => handleRoadTabKeyDown(event, index)}><span>{tab.number}</span>{t(tab.label)}</button>)}
          </nav>
          <section id="road-tabpanel" className="road-tabpanel" role="tabpanel" aria-labelledby={`road-tab-${activeRoadTab}`} tabIndex={0}>
            {activeRoadTab === 'videos' && videoCollection}
            {activeRoadTab === 'neph' && (
              <article className="tutorial-step road-guide-step">
                <div className="tutorial-step-copy">
                  <span className="tutorial-step-number">02<i> / 04</i></span>
                  <span className="eyebrow">AVANT DE RÉSERVER</span>
                  <h2>Ton numéro NEPH, au bon endroit.</h2>
                  <p>Il est indispensable pour t’inscrire à l’épreuve. Sélectionne ta situation pour savoir par où commencer : la démarche se fait auprès des services officiels, jamais dans Video Quiz.</p>
                  <div className="road-neph-switch" role="group" aria-label="Ta situation concernant le NEPH">
                    <button type="button" className={nephSituation === 'new' ? 'is-selected' : ''} aria-pressed={nephSituation === 'new'} onClick={() => setNephSituation('new')}>Je n’ai jamais eu de NEPH</button>
                    <button type="button" className={nephSituation === 'existing' ? 'is-selected' : ''} aria-pressed={nephSituation === 'existing'} onClick={() => setNephSituation('existing')}>J’en ai déjà eu un</button>
                  </div>
                  <p className="road-neph-guidance">{nephSituation === 'new' ? 'Commence par consulter la démarche de demande sur le site officiel de l’ANTS. Les justificatifs demandés dépendent de ta situation.' : 'Vérifie d’abord ton espace ANTS ou contacte l’auto-école qui t’avait inscrit pour retrouver ton numéro et connaître la suite adaptée à ton dossier.'}</p>
                  <a className="tutorial-hero-link road-guide-link" href="https://permisdeconduire.ants.gouv.fr/" target="_blank" rel="noreferrer">{nephSituation === 'new' ? 'Consulter l’ANTS' : 'Vérifier mon espace ANTS'} <DemoIcon name="externalLink" /></a>
                  <small className="road-prep-privacy">Ne saisis aucun numéro ni document personnel dans Video Quiz.</small>
                </div>
                <div className="tutorial-visual road-guide-visual road-neph-visual" aria-hidden="true">
                  <div className="tutorial-window-bar"><span /><span /><span /><div>permisdeconduire.ants.gouv.fr</div></div>
                  <div className="road-neph-mock">
                    <span className="tutorial-mock-label">TON DOSSIER PERMIS</span>
                    <strong>Un espace officiel pour tes démarches</strong>
                    <div><span className="road-mock-number">01</span><span><b>Créer ou retrouver ton espace</b><small>Connecte-toi sur le site de l’ANTS.</small></span></div>
                    <div><span className="road-mock-number">02</span><span><b>Vérifier ta situation</b><small>Les prochaines étapes varient selon ton dossier.</small></span></div>
                    <p><DemoIcon name="check" /> Tes données restent auprès du service officiel.</p>
                  </div>
                </div>
              </article>
            )}
            {activeRoadTab === 'centre' && (
              <article className="tutorial-step tutorial-step-reverse road-guide-step">
                <div className="tutorial-step-copy">
                  <span className="tutorial-step-number">03<i> / 04</i></span>
                  <span className="eyebrow">CHOISIR SON LIEU</span>
                  <h2>Un centre d’examen qui te convient.</h2>
                  <p>Repère les centres La Poste près de chez toi et consulte les sessions disponibles. La recherche officielle accepte une ville, un code postal ou une adresse.</p>
                  <ol className="road-guide-list">
                    <li><span>1</span>Ouvre la recherche officielle des centres.</li>
                    <li><span>2</span>Saisis une ville, un code postal ou une adresse.</li>
                    <li><span>3</span>Vérifie le centre, le créneau et les conditions de réservation.</li>
                  </ol>
                  <a className="tutorial-hero-link road-guide-link" href="https://www.lecode.laposte.fr/" target="_blank" rel="noreferrer">Rechercher un centre La Poste <DemoIcon name="externalLink" /></a>
                  <small className="road-prep-privacy">Les lieux et créneaux proposés sont confirmés sur le site de La Poste.</small>
                </div>
                <div className="tutorial-visual road-guide-visual road-centre-visual" aria-hidden="true">
                  <div className="tutorial-window-bar"><span /><span /><span /><div>lecode.laposte.fr</div></div>
                  <div className="road-map-art">
                    <div className="road-map-lines"><i /><i /><i /><i /><i /></div>
                    <span className="road-map-pin road-map-pin-main" />
                    <span className="road-map-pin road-map-pin-secondary" />
                    <div className="road-map-result"><span>RECHERCHE OFFICIELLE</span><strong>Ville · code postal · adresse</strong><small>Centres et créneaux disponibles</small></div>
                  </div>
                </div>
              </article>
            )}
            {activeRoadTab === 'jour' && (
              <article className="tutorial-step road-guide-step road-day-step">
                <div className="tutorial-step-copy">
                  <span className="tutorial-step-number">04<i> / 04</i></span>
                  <span className="eyebrow">ARRIVER SEREINEMENT</span>
                  <h2>Le jour J, tu sais à quoi t’attendre.</h2>
                  <p>Prépare les éléments indiqués sur ta convocation, puis découvre le déroulement de l’épreuve sur tablette.</p>
                  <span className="road-day-label">PENDANT L’ÉPREUVE</span>
                  <ol className="road-guide-list">
                    <li><span>1</span>Écoute les consignes et installe-toi.</li>
                    <li><span>2</span>Observe la situation, puis lis la question jusqu’au bout.</li>
                    <li><span>3</span>Choisis ta réponse sur la tablette en suivant les indications à l’écran.</li>
                  </ol>
                  <ul className="road-day-checklist">
                    <li><span aria-hidden="true">✓</span><div><strong>Ta convocation</strong><small>Retrouve-la dans le courriel de réservation ou l’espace candidat.</small></div></li>
                    <li><span aria-hidden="true">✓</span><div><strong>Une pièce d’identité acceptée</strong><small>Vérifie le titre admis et sa validité dans les consignes de ta session.</small></div></li>
                    <li><span aria-hidden="true">✓</span><div><strong>Le lieu et l’horaire</strong><small>Contrôle l’adresse et l’heure indiquées sur ta convocation.</small></div></li>
                  </ul>
                  <a className="road-guide-secondary-link" href="https://www.lecode.laposte.fr/" target="_blank" rel="noreferrer">Consulter les consignes de La Poste <DemoIcon name="externalLink" /></a>
                </div>
                <div className="tutorial-visual road-guide-visual road-day-visual">
                  <div className="tutorial-window-bar"><span /><span /><span /><div>Comprendre l’épreuve</div></div>
                  <div className="road-prep-video">
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/9zsDMpymSlg?start=3"
                      title="Passer mon code avec La Poste : l’examen sur tablette"
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="encrypted-media; picture-in-picture; accelerometer; gyroscope; clipboard-write"
                      allowFullScreen
                    />
                  </div>
                  <p className="road-prep-privacy">Vidéo explicative fournie par La Poste. Les modalités de ta convocation et les consignes du centre font foi.</p>
                </div>
              </article>
            )}
          </section>
        </>
      )}
      {!isRoadCodeTheme && <section>{videoCollection}</section>}
    </main>
  );
}
