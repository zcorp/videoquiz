import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CFormInput, CFormSelect } from '@coreui/react';
import { videoLibrary } from '../data/demoQuizzes.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import YouTubeThumbnail from './YouTubeThumbnail.jsx';
import DemoIcon from './DemoIcon.jsx';

const normalizeTopic = value => value.toLocaleUpperCase('fr-FR');

function QuizTile({ quiz, quizzes, attempt, onDelete }) {
  const conflictingQuiz = quiz.local ? getQuizUsingVideo(quiz.videoId, quizzes, quiz.id) : undefined;
  const quizPath = quiz.draft || conflictingQuiz ? `/edit/${quiz.id}` : `/quiz/${quiz.id}`;
  const isProgressive = quiz.mode === 'progressive' || quiz.mode === 'qcm';
     const answeredSlots = quiz.mode === 'qcm'
       ? quiz.questionCount ?? quiz.questions?.length ?? 0
       : quiz.questions?.filter(question => question.prompt?.trim() && question.options?.filter(option => option.trim()).length >= 2).length ?? 0;
  return (
    <CCard className={`quiz-tile${quiz.exam ? ' exam-tile' : ''}`}>
      <Link to={quizPath} className="tile-image-link" aria-label={`${conflictingQuiz ? 'Corriger l’association vidéo de' : quiz.draft ? 'Reprendre' : 'Ouvrir'} ${quiz.title}`}>
        <YouTubeThumbnail className="tile-image" videoId={quiz.videoId} alt={`Vidéo : ${quiz.videoLabel}`} />
        <span className="tile-play"><DemoIcon name="mediaPlay" /></span>
        <span className="tile-count">{isProgressive ? `${quiz.questionCount ?? quiz.questions.length} questions` : `${quiz.questions.length} ${quiz.questions.length === 1 ? 'question' : 'questions'}`}</span>
      </Link>
      <CCardBody className="tile-copy">
        <span className="eyebrow">{quiz.topic}</span>
        {quiz.exam && <CBadge className="exam-tile-label" color="danger">EXAMEN BLANC · CORRECTION PAR QUESTION</CBadge>}
        {quiz.draft && <CBadge className="draft-tile-label" color="warning">BROUILLON {quiz.mode === 'qcm' ? 'QCM EXPRESS' : 'PROGRESSIF'} · {answeredSlots}/{quiz.questionCount ?? quiz.questions.length} COMPLÈTES</CBadge>}
        <h3><Link to={`/quiz/${quiz.id}`}>{quiz.title}</Link></h3>
        <p>{quiz.description}</p>
        <div className="tile-footer">
          {attempt ? <span className="last-score">Dernier score <strong>{attempt.score}/{attempt.max}</strong> <small>({attempt.percentage}%)</small></span> : <span className="tile-meta">Vidéo + quiz interactif</span>}
          <div className="tile-actions" aria-label={`Actions pour ${quiz.title}`}>
            {quiz.local && <><Link className="icon-action" to={`/edit/${quiz.id}`} aria-label={`${quiz.draft ? 'Reprendre' : 'Modifier'} ${quiz.title}`} title={quiz.draft ? 'Reprendre' : 'Modifier'}><DemoIcon name="pencil" /></Link><button className="icon-action tile-delete" onClick={() => window.confirm(`Supprimer « ${quiz.title} » de ce navigateur ?`) && onDelete(quiz.id)} aria-label={`Supprimer ${quiz.title}`} title="Supprimer"><DemoIcon name="trash" /></button></>}
            {attempt && <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Voir la progression de ${quiz.title}`} title="Voir la progression"><DemoIcon name="externalLink" /></Link>}
            <Link className="icon-action icon-play" to={quizPath} aria-label={`${quiz.draft ? 'Compléter' : 'Lancer'} ${quiz.title}`} title={quiz.draft ? 'Compléter' : 'Lancer'}><DemoIcon name="mediaPlay" /></Link>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
}

export default function DemoHome({ quizzes, attempts, onDelete }) {
  const featuredVideo = videoLibrary.find(video => video.theme === 'Code de la route') ?? videoLibrary[0];
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [activeFeatureSlide, setActiveFeatureSlide] = useState(0);
  const pageSize = 9;
  const activeFilterCount = Number(modeFilter !== 'all') + Number(topicFilter !== 'all');
  const topicCounts = [...new Set(videoLibrary.map(video => normalizeTopic(video.theme)))]
    .map(topic => ({ topic, count: videoLibrary.filter(video => normalizeTopic(video.theme) === topic).length }))
    .sort((left, right) => right.count - left.count || left.topic.localeCompare(right.topic, 'fr'));
  const topics = [...new Set(quizzes.map(quiz => quiz.topic))].sort();
  const quickTopics = topicCounts.slice(0, 5);
  const featuredQuiz = getQuizUsingVideo(featuredVideo.id, quizzes);
  const featuredDestination = featuredQuiz
    ? featuredQuiz.local ? `/edit/${featuredQuiz.id}` : `/quiz/${featuredQuiz.id}`
    : `/create?mode=qcm&video=${featuredVideo.id}&title=${encodeURIComponent(featuredVideo.title)}&topic=${encodeURIComponent(featuredVideo.theme.toLocaleUpperCase('fr-FR'))}`;
  const cultureVideo = videoLibrary.find(video => normalizeTopic(video.theme) === 'CULTURE GÉNÉRALE') ?? videoLibrary.find(video => video.theme !== featuredVideo.theme);
  const cultureQuiz = cultureVideo ? getQuizUsingVideo(cultureVideo.id, quizzes) : undefined;
  const cultureDestination = cultureVideo && (cultureQuiz
    ? cultureQuiz.local ? `/edit/${cultureQuiz.id}` : `/quiz/${cultureQuiz.id}`
    : `/create?mode=qcm&video=${cultureVideo.id}&title=${encodeURIComponent(cultureVideo.title)}&topic=${encodeURIComponent(cultureVideo.theme.toLocaleUpperCase('fr-FR'))}`);
  const featureSlideCount = cultureVideo ? 3 : 2;
  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return quizzes.filter(quiz => {
      const matchesQuery = !normalizedQuery || [quiz.title, quiz.description, quiz.topic].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
      const matchesMode = modeFilter === 'all' || quiz.mode === modeFilter;
      const matchesTopic = topicFilter === 'all' || normalizeTopic(quiz.topic) === topicFilter;
      return matchesQuery && matchesMode && matchesTopic;
    }).sort((left, right) => {
      if (sort === 'title') return left.title.localeCompare(right.title, 'fr');
      if (sort === 'questions') return (right.questionCount ?? right.questions.length) - (left.questionCount ?? left.questions.length);
      const leftDate = attempts.find(attempt => attempt.quizId === left.id)?.completedAt ?? '';
      const rightDate = attempts.find(attempt => attempt.quizId === right.id)?.completedAt ?? '';
      return rightDate.localeCompare(leftDate);
    });
  }, [attempts, modeFilter, query, sort, topicFilter, quizzes]);
  const pageCount = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize));
  const visibleQuizzes = filteredQuizzes.slice((Math.min(page, pageCount) - 1) * pageSize, Math.min(page, pageCount) * pageSize);
  const updateFilter = setter => value => { setter(value); setPage(1); };

  return (
    <main className="demo-page">
      <section className="welcome-band">
        <div className="welcome-copy">
          <div className="welcome-kicker"><span className="eyebrow eyebrow-dark">APPRENDRE EN REGARDANT</span><span>VIDÉO <i /> QUIZ <i /> PROGRESSION</span></div>
          <h1><span>Choisis une série.</span><span>Crée ton QCM.</span><span>Entraîne-toi à ton rythme.</span></h1>
          <p className="welcome-description">Associe une vidéo de ton choix à une grille de réponses, teste tes connaissances et suis ta progression. Tes quiz et tes résultats restent enregistrés sur ton appareil.</p>
          <div className="welcome-actions"><Link className="btn btn-success button button-dark" to="/videos">Choisir une vidéo <DemoIcon name="arrowRight" /></Link><Link className="btn btn-outline-secondary button button-quiet" to="/create">Créer un quiz <DemoIcon name="plus" /></Link></div>
          <p className="welcome-data-note">Vos quiz et résultats restent dans ce navigateur. <Link to="/dashboard?section=backup">Télécharger une sauvegarde</Link></p>
          <Link className="welcome-tutorial-link" to="/tutoriel">Découvrir le principe <DemoIcon name="arrowRight" /></Link>
        </div>
        <CCard className="feature-card">
          <div className="feature-carousel" role="region" aria-label="Exemples de quiz vidéo" aria-roledescription="carrousel">
            <div className="feature-carousel-content" aria-live="polite">
              {activeFeatureSlide === 0 && <Link className="feature-frame" to={featuredDestination} aria-label={featuredQuiz ? `Ouvrir le quiz associé à ${featuredVideo.title}` : `Associer ${featuredVideo.title} à un QCM`}>
                <YouTubeThumbnail videoId={featuredVideo.id} alt={`Aperçu vidéo : ${featuredVideo.title}`} loading="eager" />
                <span className="feature-wash" />
                <span className="feature-play"><DemoIcon name="plus" /></span>
                <span className="feature-caption"><CBadge color="warning">{featuredQuiz ? 'QUIZ ASSOCIÉ' : 'VIDÉO À UTILISER'}</CBadge><strong>{featuredVideo.title}</strong><small>{featuredVideo.theme} · {featuredQuiz ? 'Ouvrir le quiz' : 'Créer un QCM express'}</small></span>
                <span className="feature-index">EXEMPLE 01</span>
              </Link>}
              {activeFeatureSlide === 1 && <div className="feature-cycle-slide">
                <div className="feature-cycle-heading">
                  <span className="eyebrow">LE PARCOURS EN 4 TEMPS</span>
                  <h2>Du visionnage à la progression.</h2>
                  <p>Choisis une vidéo, prépare ta grille, entraîne-toi et retrouve tes résultats.</p>
                </div>
                <div className="feature-cycle" role="img" aria-label="Choisir une vidéo, préparer un quiz, s’entraîner, puis suivre sa progression">
                  <div className="feature-cycle-node"><span className="feature-cycle-step">01</span><span className="feature-cycle-icon"><DemoIcon name="mediaPlay" /></span><strong>VIDÉO</strong><small>À choisir</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">02</span><span className="feature-cycle-icon"><DemoIcon name="pencil" /></span><strong>QUIZ</strong><small>À préparer</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">03</span><span className="feature-cycle-icon"><DemoIcon name="check" /></span><strong>RÉPONSES</strong><small>À ton rythme</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">04</span><span className="feature-cycle-icon"><DemoIcon name="chart" /></span><strong>SUIVI</strong><small>Tes progrès</small></div>
                </div>
                <Link className="feature-cycle-link" to="/tutoriel">Découvrir comment ça marche <DemoIcon name="arrowRight" /></Link>
              </div>}
              {activeFeatureSlide === 2 && cultureVideo && cultureDestination && <Link className="feature-frame" to={cultureDestination} aria-label={cultureQuiz ? `Ouvrir le quiz associé à ${cultureVideo.title}` : `Associer ${cultureVideo.title} à un QCM`}>
                <YouTubeThumbnail videoId={cultureVideo.id} alt={`Aperçu vidéo : ${cultureVideo.title}`} loading="lazy" />
                <span className="feature-wash" />
                <span className="feature-play"><DemoIcon name="plus" /></span>
                <span className="feature-caption"><CBadge color="warning">{cultureQuiz ? 'QUIZ ASSOCIÉ' : 'AUTRE THÈME'}</CBadge><strong>{cultureVideo.title}</strong><small>{cultureVideo.theme} · {cultureQuiz ? 'Ouvrir le quiz' : 'Créer un QCM express'}</small></span>
                <span className="feature-index">AUTRE EXEMPLE</span>
              </Link>}
            </div>
            <div className="feature-carousel-controls">
              <button type="button" className="feature-carousel-arrow" onClick={() => setActiveFeatureSlide(slide => (slide - 1 + featureSlideCount) % featureSlideCount)} aria-label="Exemple précédent"><DemoIcon name="arrowLeft" /></button>
              <div className="feature-carousel-pagination" aria-label="Choisir un exemple">
                {Array.from({ length: featureSlideCount }, (_, slide) => <button key={slide} type="button" className={`feature-carousel-dot${slide === activeFeatureSlide ? ' is-active' : ''}`} onClick={() => setActiveFeatureSlide(slide)} aria-label={`Afficher ${slide === 0 ? 'le quiz du code de la route' : slide === 1 ? 'le principe du parcours' : cultureVideo?.theme}`} aria-pressed={slide === activeFeatureSlide} />)}
              </div>
              <span className="feature-carousel-count" aria-hidden="true">{String(activeFeatureSlide + 1).padStart(2, '0')} / {String(featureSlideCount).padStart(2, '0')}</span>
              <button type="button" className="feature-carousel-arrow" onClick={() => setActiveFeatureSlide(slide => (slide + 1) % featureSlideCount)} aria-label="Exemple suivant"><DemoIcon name="arrowRight" /></button>
            </div>
          </div>
        </CCard>
      </section>
      <nav className="welcome-topics" aria-label="Accès rapide aux thèmes vidéo"><span className="eyebrow">Ou explore par thème</span><div>{quickTopics.map(item => <Link key={item.topic} className="btn btn-outline-success topic-quick-chip" to={`/videos?theme=${encodeURIComponent(item.topic)}`}>{item.topic}<small>{item.count}</small></Link>)}</div></nav>

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div><span className="eyebrow">À TOI DE JOUER</span><h2 id="library-title">Choisis un sujet</h2></div>
          <span className="section-count">{quizzes.length.toString().padStart(2, '0')} QUIZ</span>
        </div>
        <div className="library-tools" aria-label="Recherche et filtres de la bibliothèque">
          <label className="library-search"><DemoIcon name="magnifyingGlass" /><CFormInput value={query} onChange={event => updateFilter(setQuery)(event.target.value)} placeholder="Rechercher un quiz…" aria-label="Rechercher un quiz" /></label>
          <button
            type="button"
            className="btn btn-outline-secondary library-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="library-filters"
            onClick={() => setFiltersOpen(open => !open)}
          >
            {filtersOpen ? 'Masquer les filtres' : 'Filtres'}
            {activeFilterCount > 0 && <span className="library-filter-count">{activeFilterCount}</span>}
          </button>
          <div id="library-filters" className={`library-filter-panel${filtersOpen ? ' is-open' : ''}`}>
            <CFormSelect value={modeFilter} onChange={event => updateFilter(setModeFilter)(event.target.value)} aria-label="Filtrer par type"><option value="all">Tous les types</option><option value="prepared">Quiz préparés</option><option value="progressive">Progressifs</option><option value="qcm">QCM express</option></CFormSelect>
            <CFormSelect value={topicFilter} onChange={event => updateFilter(setTopicFilter)(event.target.value)} aria-label="Filtrer par thème"><option value="all">Tous les thèmes</option>{topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</CFormSelect>
          </div>
        </div>
        <div className="library-results-toolbar">
          <span className="library-result-line">{filteredQuizzes.length} quiz affiché{filteredQuizzes.length === 1 ? '' : 's'}</span>
          <div className="library-results-actions">
            <label className="library-sort"><span>Trier</span><CFormSelect value={sort} onChange={event => updateFilter(setSort)(event.target.value)} aria-label="Trier les quiz"><option value="recent">Activité récente</option><option value="title">Titre A-Z</option><option value="questions">Nombre de questions</option></CFormSelect></label>
            {(query || activeFilterCount > 0) && <button type="button" className="clear-filters" onClick={() => { setQuery(''); setModeFilter('all'); setTopicFilter('all'); setPage(1); }}>Réinitialiser <DemoIcon name="x" /></button>}
          </div>
        </div>
        {activeFilterCount > 0 && <div className="library-active-filters" aria-label="Filtres actifs">
          {modeFilter !== 'all' && <button type="button" className="library-filter-chip" aria-label="Retirer le filtre de type" onClick={() => updateFilter(setModeFilter)('all')}>Type : {modeFilter === 'prepared' ? 'Quiz préparés' : modeFilter === 'progressive' ? 'Progressifs' : 'QCM express'} <DemoIcon name="x" /></button>}
          {topicFilter !== 'all' && <button type="button" className="library-filter-chip" aria-label={`Retirer le filtre de thème ${topicFilter}`} onClick={() => updateFilter(setTopicFilter)('all')}>Thème : {topicFilter} <DemoIcon name="x" /></button>}
        </div>}
        <div className="quiz-grid">
          {visibleQuizzes.map(quiz => <QuizTile key={quiz.id} quiz={quiz} quizzes={quizzes} attempt={attempts.find(item => item.quizId === quiz.id)} onDelete={onDelete} />)}
          {!visibleQuizzes.length && <div className="library-empty"><DemoIcon name="magnifyingGlass" /><h3>Aucun quiz trouvé</h3><p>Modifie les filtres ou ta recherche.</p></div>}
          <Link to="/create" className="create-tile">
            <span className="create-symbol"><DemoIcon name="plus" /></span>
            <span className="eyebrow">À TON TOUR</span>
            <strong>Ajoute ton propre quiz</strong>
            <span>Il restera dans ce navigateur, rien ne part sur un serveur.</span>
            <span className="text-action">Créer localement <b><DemoIcon name="externalLink" /></b></span>
          </Link>
        </div>
        {pageCount > 1 && <nav className="library-pagination" aria-label="Pagination des quiz"><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Page précédente" title="Page précédente"><DemoIcon name="arrowLeft" /></button><span>Page {Math.min(page, pageCount)} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label="Page suivante" title="Page suivante"><DemoIcon name="arrowRight" /></button></nav>}
      </section>
    </main>
  );
}