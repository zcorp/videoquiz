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
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const topicCounts = [...new Set(videoLibrary.map(video => normalizeTopic(video.theme)))]
    .map(topic => ({ topic, count: videoLibrary.filter(video => normalizeTopic(video.theme) === topic).length }))
    .sort((left, right) => right.count - left.count || left.topic.localeCompare(right.topic, 'fr'));
  const topics = [...new Set(quizzes.map(quiz => quiz.topic))].sort();
  const quickTopics = topicCounts.slice(0, 5);
  const featuredQuiz = getQuizUsingVideo(featuredVideo.id, quizzes);
  const featuredDestination = featuredQuiz
    ? featuredQuiz.local ? `/edit/${featuredQuiz.id}` : `/quiz/${featuredQuiz.id}`
    : `/create?mode=qcm&video=${featuredVideo.id}&title=${encodeURIComponent(featuredVideo.title)}&topic=${encodeURIComponent(featuredVideo.theme.toLocaleUpperCase('fr-FR'))}`;
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
          <span className="eyebrow eyebrow-dark">BIBLIOTHÈQUE VIDÉO</span>
          <h1>Choisir une série.<br /><em>Créer son QCM.</em></h1>
          <p>Parcours les thèmes, associe une vidéo à une grille de réponses, puis entraîne-toi à ton rythme. Quiz et résultats restent sur cet appareil.</p>
          <div className="welcome-actions"><Link className="btn btn-success button button-dark" to="/videos">Parcourir les vidéos <DemoIcon name="arrowRight" /></Link><Link className="btn btn-outline-secondary button button-quiet" to="/dashboard">Voir mon suivi <DemoIcon name="externalLink" /></Link></div>
          <div className="welcome-topics" aria-label="Accès rapide aux thèmes vidéo"><span className="eyebrow">THÈMES</span><div>{quickTopics.map(item => <Link key={item.topic} className="btn btn-outline-success topic-quick-chip" to={`/videos?theme=${encodeURIComponent(item.topic)}`}>{item.topic}<small>{item.count}</small></Link>)}</div></div>
        </div>
        <CCard className="feature-card">
          <Link className="feature-frame" to={featuredDestination} aria-label={featuredQuiz ? `Ouvrir le quiz associé à ${featuredVideo.title}` : `Associer ${featuredVideo.title} à un QCM`}>
            <YouTubeThumbnail videoId={featuredVideo.id} alt={`Aperçu vidéo : ${featuredVideo.title}`} loading="eager" />
            <span className="feature-wash" />
            <span className="feature-play"><DemoIcon name="plus" /></span>
            <span className="feature-caption"><CBadge color="warning">{featuredQuiz ? 'QUIZ ASSOCIÉ' : 'VIDÉO À UTILISER'}</CBadge><strong>{featuredVideo.title}</strong><small>{featuredVideo.theme} · {featuredQuiz ? 'Ouvrir le quiz' : 'Créer un QCM express'}</small></span>
            <span className="feature-index">01 <i>/ {String(videoLibrary.length).padStart(2, '0')}</i></span>
          </Link>
        </CCard>
      </section>

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div><span className="eyebrow">À VOUS DE JOUER</span><h2 id="library-title">Choisissez un sujet</h2></div>
          <span className="section-count">{quizzes.length.toString().padStart(2, '0')} QUIZ</span>
        </div>
        <div className="library-tools" aria-label="Filtres de la bibliothèque">
          <label className="library-search"><DemoIcon name="magnifyingGlass" /><CFormInput value={query} onChange={event => updateFilter(setQuery)(event.target.value)} placeholder="Rechercher un quiz…" aria-label="Rechercher un quiz" /></label>
          <CFormSelect value={modeFilter} onChange={event => updateFilter(setModeFilter)(event.target.value)} aria-label="Filtrer par type"><option value="all">Tous les types</option><option value="prepared">Quiz préparés</option><option value="progressive">Progressifs</option><option value="qcm">QCM express</option></CFormSelect>
          <CFormSelect value={topicFilter} onChange={event => updateFilter(setTopicFilter)(event.target.value)} aria-label="Filtrer par thème"><option value="all">Tous les thèmes</option>{topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</CFormSelect>
          <CFormSelect value={sort} onChange={event => updateFilter(setSort)(event.target.value)} aria-label="Trier les quiz"><option value="recent">Activité récente</option><option value="title">Titre A-Z</option><option value="questions">Nombre de questions</option></CFormSelect>
        </div>
        <div className="library-result-line"><span>{filteredQuizzes.length} quiz affiché{filteredQuizzes.length === 1 ? '' : 's'}</span>{(query || modeFilter !== 'all' || topicFilter !== 'all') && <button type="button" className="clear-filters" onClick={() => { setQuery(''); setModeFilter('all'); setTopicFilter('all'); setPage(1); }}>Réinitialiser <DemoIcon name="x" /></button>}</div>
        <div className="quiz-grid">
          {visibleQuizzes.map(quiz => <QuizTile key={quiz.id} quiz={quiz} quizzes={quizzes} attempt={attempts.find(item => item.quizId === quiz.id)} onDelete={onDelete} />)}
          {!visibleQuizzes.length && <div className="library-empty"><DemoIcon name="magnifyingGlass" /><h3>Aucun quiz trouvé</h3><p>Modifiez les filtres ou votre recherche.</p></div>}
          <Link to="/create" className="create-tile">
            <span className="create-symbol"><DemoIcon name="plus" /></span>
            <span className="eyebrow">VOTRE TOUR</span>
            <strong>Ajoutez votre propre quiz</strong>
            <span>Il restera dans ce navigateur, rien ne part sur un serveur.</span>
            <span className="text-action">Créer localement <b><DemoIcon name="externalLink" /></b></span>
          </Link>
        </div>
        {pageCount > 1 && <nav className="library-pagination" aria-label="Pagination des quiz"><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Page précédente" title="Page précédente"><DemoIcon name="arrowLeft" /></button><span>Page {Math.min(page, pageCount)} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label="Page suivante" title="Page suivante"><DemoIcon name="arrowRight" /></button></nav>}
      </section>
    </main>
  );
}