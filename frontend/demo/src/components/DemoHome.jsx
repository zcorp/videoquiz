import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CFormInput, CFormSelect } from '@coreui/react';
import { videoLibrary } from '../data/demoQuizzes.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import { getQuizVideo } from '../services/video.js';
import { translateTopic, useLanguage } from '../i18n.jsx';
import VideoThumbnail from './VideoThumbnail.jsx';
import DemoIcon from './DemoIcon.jsx';

const normalizeTopic = value => value.toLocaleUpperCase('fr-FR');

function QuizTile({ quiz, quizzes, attempt, onDelete }) {
  const { t, language } = useLanguage();
  const video = getQuizVideo(quiz);
  const conflictingQuiz = quiz.local ? getQuizUsingVideo(video, quizzes, quiz.id) : undefined;
  const quizPath = quiz.draft || conflictingQuiz ? `/edit/${quiz.id}` : `/quiz/${quiz.id}`;
  const isProgressive = quiz.mode === 'progressive' || quiz.mode === 'qcm';
     const answeredSlots = quiz.mode === 'qcm'
       ? quiz.questionCount ?? quiz.questions?.length ?? 0
       : quiz.questions?.filter(question => question.prompt?.trim() && question.options?.filter(option => option.trim()).length >= 2).length ?? 0;
  return (
    <CCard className={`quiz-tile${quiz.exam ? ' exam-tile' : ''}`}>
      <Link to={quizPath} className="tile-image-link" aria-label={`${t(conflictingQuiz ? 'Corriger l’association vidéo de' : quiz.draft ? 'Reprendre' : 'Ouvrir')} ${quiz.title}`}>
        <VideoThumbnail className="tile-image" video={video} alt={`${t('Vidéo :')} ${quiz.videoLabel}`} />
        <span className="tile-play"><DemoIcon name="mediaPlay" /></span>
        <span className="tile-count">{isProgressive ? `${quiz.questionCount ?? quiz.questions.length} ${t('questions')}` : `${quiz.questions.length} ${t(quiz.questions.length === 1 ? 'question' : 'questions')}`}</span>
      </Link>
      <CCardBody className="tile-copy">
        <span className="eyebrow">{translateTopic(quiz.topic, language)}</span>
        {quiz.exam && <CBadge className="exam-tile-label" color="danger">{t('EXAMEN BLANC · CORRECTION PAR QUESTION')}</CBadge>}
        {quiz.draft && <CBadge className="draft-tile-label" color="warning">{t('BROUILLON')} {t(quiz.mode === 'qcm' ? 'QCM EXPRESS' : 'PROGRESSIF')} · {answeredSlots}/{quiz.questionCount ?? quiz.questions.length} {t('COMPLÈTES')}</CBadge>}
        <h3><Link to={`/quiz/${quiz.id}`}>{quiz.title}</Link></h3>
        <p>{quiz.description}</p>
        <div className="tile-footer">
          {attempt ? <span className="last-score">{t('Dernier score')} <strong>{attempt.score}/{attempt.max}</strong> <small>({attempt.percentage}%)</small></span> : <span className="tile-meta">{t('Vidéo + quiz interactif')}</span>}
          <div className="tile-actions" aria-label={`${t('Actions pour')} ${quiz.title}`}>
            {quiz.local && <><Link className="icon-action" to={`/edit/${quiz.id}`} aria-label={`${t(quiz.draft ? 'Reprendre' : 'Modifier')} ${quiz.title}`} title={t(quiz.draft ? 'Reprendre' : 'Modifier')}><DemoIcon name="pencil" /></Link><button className="icon-action tile-delete" onClick={() => window.confirm(`${t('Supprimer')} « ${quiz.title} » ${t('de ce navigateur ?')}`) && onDelete(quiz.id)} aria-label={`${t('Supprimer')} ${quiz.title}`} title={t('Supprimer')}><DemoIcon name="trash" /></button></>}
            {attempt && <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`${t('Voir la progression de')} ${quiz.title}`} title={t('Voir la progression')}><DemoIcon name="externalLink" /></Link>}
            <Link className="icon-action icon-play" to={quizPath} aria-label={`${t(quiz.draft ? 'Compléter' : 'Lancer')} ${quiz.title}`} title={t(quiz.draft ? 'Compléter' : 'Lancer')}><DemoIcon name="mediaPlay" /></Link>
          </div>
        </div>
      </CCardBody>
    </CCard>
  );
}

export default function DemoHome({ quizzes, attempts, onDelete }) {
  const { t, language } = useLanguage();
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
    .map(topic => ({ topic, sourceTopic: topic, count: videoLibrary.filter(video => normalizeTopic(video.theme) === topic).length }))
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
          <div className="welcome-kicker"><span className="eyebrow eyebrow-dark">{t('APPRENDRE EN REGARDANT')}</span><span>{t('VIDÉO')} <i /> {t('QUIZ')} <i /> {t('PROGRESSION')}</span></div>
          <h1>{t('Apprends avec une vidéo.')}</h1>
          <p className="welcome-description">{t('Choisis un quiz prêt à jouer ou crée le tien avec une vidéo.')}</p>
          <div className="welcome-actions"><Link className="btn btn-success button button-dark" to="/videos">{t('Choisir une vidéo')} <DemoIcon name="arrowRight" /></Link><Link className="btn btn-outline-secondary button button-quiet" to="/create">{t('Créer un quiz')} <DemoIcon name="plus" /></Link></div>
        </div>
        <CCard className="feature-card">
          <div className="feature-carousel" role="region" aria-label={t('Exemples de quiz vidéo')} aria-roledescription={t('carrousel')}>
            <div className="feature-carousel-content" aria-live="polite">
              {activeFeatureSlide === 0 && <Link className="feature-frame" to={featuredDestination} aria-label={t(featuredQuiz ? 'Ouvrir le quiz associé à {title}' : 'Associer {title} à un QCM').replace('{title}', featuredVideo.title)}>
                <VideoThumbnail video={featuredVideo} alt={t('Aperçu vidéo : {title}').replace('{title}', featuredVideo.title)} loading="eager" />
                <span className="feature-wash" />
                <span className="feature-play"><DemoIcon name="plus" /></span>
                <span className="feature-caption"><CBadge color="warning">{t(featuredQuiz ? 'QUIZ ASSOCIÉ' : 'VIDÉO À UTILISER')}</CBadge><strong>{featuredVideo.title}</strong><small>{translateTopic(featuredVideo.theme, language)} · {t(featuredQuiz ? 'Ouvrir le quiz' : 'Créer un QCM express')}</small></span>
                <span className="feature-index">{t('EXEMPLE 01')}</span>
              </Link>}
              {activeFeatureSlide === 1 && <div className="feature-cycle-slide">
                <div className="feature-cycle-heading">
                  <span className="eyebrow">{t('LE PARCOURS EN 4 TEMPS')}</span>
                  <h2>{t('Du visionnage à la progression.')}</h2>
                  <p>{t('Choisis une vidéo, prépare ta grille, entraîne-toi et retrouve tes résultats.')}</p>
                </div>
                <div className="feature-cycle" role="img" aria-label={t('Choisir une vidéo, préparer un quiz, s’entraîner, puis suivre sa progression')}>
                  <div className="feature-cycle-node"><span className="feature-cycle-step">01</span><span className="feature-cycle-icon"><DemoIcon name="mediaPlay" /></span><strong>{t('VIDÉO')}</strong><small>{t('À choisir')}</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">02</span><span className="feature-cycle-icon"><DemoIcon name="pencil" /></span><strong>{t('QUIZ')}</strong><small>{t('À préparer')}</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">03</span><span className="feature-cycle-icon"><DemoIcon name="check" /></span><strong>{t('RÉPONSES')}</strong><small>{t('À ton rythme')}</small></div>
                  <DemoIcon className="feature-cycle-arrow" name="arrowRight" />
                  <div className="feature-cycle-node"><span className="feature-cycle-step">04</span><span className="feature-cycle-icon"><DemoIcon name="chart" /></span><strong>{t('SUIVI')}</strong><small>{t('Tes progrès')}</small></div>
                </div>
                <Link className="feature-cycle-link" to="/tutoriel">{t('Découvrir comment ça marche')} <DemoIcon name="arrowRight" /></Link>
              </div>}
              {activeFeatureSlide === 2 && cultureVideo && cultureDestination && <Link className="feature-frame" to={cultureDestination} aria-label={t(cultureQuiz ? 'Ouvrir le quiz associé à {title}' : 'Associer {title} à un QCM').replace('{title}', cultureVideo.title)}>
                <VideoThumbnail video={cultureVideo} alt={t('Aperçu vidéo : {title}').replace('{title}', cultureVideo.title)} loading="lazy" />
                <span className="feature-wash" />
                <span className="feature-play"><DemoIcon name="plus" /></span>
                <span className="feature-caption"><CBadge color="warning">{t(cultureQuiz ? 'QUIZ ASSOCIÉ' : 'AUTRE THÈME')}</CBadge><strong>{cultureVideo.title}</strong><small>{translateTopic(cultureVideo.theme, language)} · {t(cultureQuiz ? 'Ouvrir le quiz' : 'Créer un QCM express')}</small></span>
                <span className="feature-index">{t('AUTRE EXEMPLE')}</span>
              </Link>}
            </div>
            <div className="feature-carousel-controls">
              <button type="button" className="feature-carousel-arrow" onClick={() => setActiveFeatureSlide(slide => (slide - 1 + featureSlideCount) % featureSlideCount)} aria-label={t('Exemple précédent')}><DemoIcon name="arrowLeft" /></button>
              <div className="feature-carousel-pagination" aria-label={t('Choisir un exemple')}>
                {Array.from({ length: featureSlideCount }, (_, slide) => <button key={slide} type="button" className={`feature-carousel-dot${slide === activeFeatureSlide ? ' is-active' : ''}`} onClick={() => setActiveFeatureSlide(slide)} aria-label={t(slide === 0 ? 'Afficher le quiz du code de la route' : slide === 1 ? 'Afficher le parcours en quatre étapes' : 'Afficher un autre thème')} aria-pressed={slide === activeFeatureSlide} />)}
              </div>
              <span className="feature-carousel-count" aria-hidden="true">{String(activeFeatureSlide + 1).padStart(2, '0')} / {String(featureSlideCount).padStart(2, '0')}</span>
              <button type="button" className="feature-carousel-arrow" onClick={() => setActiveFeatureSlide(slide => (slide + 1) % featureSlideCount)} aria-label={t('Exemple suivant')}><DemoIcon name="arrowRight" /></button>
            </div>
          </div>
        </CCard>
      </section>
      <nav className="welcome-topics" aria-label="Accès rapide aux thèmes vidéo">      <span className="eyebrow">{t('Ou explore par thème')}</span><div>{quickTopics.map(item => <Link key={item.sourceTopic} className="btn btn-outline-success topic-quick-chip" to={`/videos?theme=${encodeURIComponent(item.sourceTopic)}`}>{translateTopic(item.topic, language)}<small>{item.count}</small></Link>)}</div></nav>

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div><span className="eyebrow">{t('À TOI DE JOUER')}</span><h2 id="library-title">{t('Choisis un sujet')}</h2></div>
          <span className="section-count">{quizzes.length.toString().padStart(2, '0')} QUIZ</span>
        </div>
        <div className="library-tools" aria-label={t('Recherche et filtres de la bibliothèque')}>
          <label className="library-search"><DemoIcon name="magnifyingGlass" /><CFormInput value={query} onChange={event => updateFilter(setQuery)(event.target.value)} placeholder={t('Rechercher un quiz…')} aria-label={t('Rechercher un quiz')} /></label>
          <button
            type="button"
            className="btn btn-outline-secondary library-filter-toggle"
            aria-expanded={filtersOpen}
            aria-controls="library-filters"
            onClick={() => setFiltersOpen(open => !open)}
          >
            {t(filtersOpen ? 'Masquer les filtres' : 'Filtres')}
            {activeFilterCount > 0 && <span className="library-filter-count">{activeFilterCount}</span>}
          </button>
          <div id="library-filters" className={`library-filter-panel${filtersOpen ? ' is-open' : ''}`}>
            <CFormSelect value={modeFilter} onChange={event => updateFilter(setModeFilter)(event.target.value)} aria-label={t('Filtrer par type')}><option value="all">{t('Tous les types')}</option><option value="prepared">{t('Quiz préparés')}</option><option value="progressive">{t('Progressifs')}</option><option value="qcm">{t('QCM express')}</option></CFormSelect>
            <CFormSelect value={topicFilter} onChange={event => updateFilter(setTopicFilter)(event.target.value)} aria-label={t('Filtrer par thème')}><option value="all">{t('Tous les thèmes')}</option>{topics.map(topic => <option key={topic} value={topic}>{translateTopic(topic, language)}</option>)}</CFormSelect>
          </div>
        </div>
        <div className="library-results-toolbar">
          <span className="library-result-line">{filteredQuizzes.length} {t(filteredQuizzes.length === 1 ? 'quiz affiché' : 'quiz affichés')}</span>
          <div className="library-results-actions">
            <label className="library-sort"><span>{t('Trier')}</span><CFormSelect value={sort} onChange={event => updateFilter(setSort)(event.target.value)} aria-label={t('Trier les quiz')}><option value="recent">{t('Activité récente')}</option><option value="title">{t('Titre A-Z')}</option><option value="questions">{t('Nombre de questions')}</option></CFormSelect></label>
            {(query || activeFilterCount > 0) && <button type="button" className="clear-filters" onClick={() => { setQuery(''); setModeFilter('all'); setTopicFilter('all'); setPage(1); }}>{t('Réinitialiser')} <DemoIcon name="x" /></button>}
          </div>
        </div>
        {activeFilterCount > 0 && <div className="library-active-filters" aria-label={t('Filtres actifs')}>
          {modeFilter !== 'all' && <button type="button" className="library-filter-chip" aria-label={t('Retirer le filtre de type')} onClick={() => updateFilter(setModeFilter)('all')}>{t('Type')} : {t(modeFilter === 'prepared' ? 'Quiz préparés' : modeFilter === 'progressive' ? 'Progressifs' : 'QCM express')} <DemoIcon name="x" /></button>}
          {topicFilter !== 'all' && <button type="button" className="library-filter-chip" aria-label={`${t('Retirer le filtre de thème')} ${translateTopic(topicFilter, language)}`} onClick={() => updateFilter(setTopicFilter)('all')}>{t('Thème')} : {translateTopic(topicFilter, language)} <DemoIcon name="x" /></button>}
        </div>}
        <div className="quiz-grid">
          {visibleQuizzes.map(quiz => <QuizTile key={quiz.id} quiz={quiz} quizzes={quizzes} attempt={attempts.find(item => item.quizId === quiz.id)} onDelete={onDelete} />)}
          {!visibleQuizzes.length && <div className="library-empty"><DemoIcon name="magnifyingGlass" /><h3>{t('Aucun quiz trouvé')}</h3><p>{t('Modifie les filtres ou ta recherche.')}</p></div>}
          <Link to="/create" className="create-tile">
            <span className="create-symbol"><DemoIcon name="plus" /></span>
            <span className="eyebrow">{t('À TON TOUR')}</span>
            <strong>{t('Ajoute ton propre quiz')}</strong>
            <span>{t('Il restera dans ce navigateur, rien ne part sur un serveur.')}</span>
            <span className="text-action">{t('Créer localement')} <b><DemoIcon name="externalLink" /></b></span>
          </Link>
        </div>
        {pageCount > 1 && <nav className="library-pagination" aria-label={t('Pagination des quiz')}><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label={t('Page précédente')} title={t('Page précédente')}><DemoIcon name="arrowLeft" /></button><span>{t('Page')} {Math.min(page, pageCount)} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label={t('Page suivante')} title={t('Page suivante')}><DemoIcon name="arrowRight" /></button></nav>}
      </section>
    </main>
  );
}