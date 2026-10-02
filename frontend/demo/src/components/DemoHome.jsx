import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CBadge, CFormInput, CFormSelect } from '@coreui/react';
import { demoQuizzes, videoLibrary } from '../data/demoQuizzes.js';

function QuizTile({ quiz, attempt, onDelete }) {
  const quizPath = quiz.draft ? `/edit/${quiz.id}` : `/quiz/${quiz.id}`;
  const isProgressive = quiz.mode === 'progressive' || quiz.mode === 'qcm';
     const answeredSlots = quiz.mode === 'qcm'
       ? quiz.questionCount ?? quiz.questions?.length ?? 0
       : quiz.questions?.filter(question => question.prompt?.trim() && question.options?.filter(option => option.trim()).length >= 2).length ?? 0;
  return (
    <article className={`quiz-tile${quiz.exam ? ' exam-tile' : ''}`}>
      <Link to={quizPath} className="tile-image-link" aria-label={`${quiz.draft ? 'Reprendre' : 'Ouvrir'} ${quiz.title}`}>
        <img className="tile-image" src={`https://img.youtube.com/vi/${quiz.videoId}/hqdefault.jpg`} alt={`Vidéo : ${quiz.videoLabel}`} loading="lazy" />
        <span className="tile-play" aria-hidden="true">▶</span>
        <span className="tile-count">{isProgressive ? `${quiz.questionCount ?? quiz.questions.length} questions` : `${quiz.questions.length} ${quiz.questions.length === 1 ? 'question' : 'questions'}`}</span>
      </Link>
      <div className="tile-copy">
        <span className="eyebrow">{quiz.topic}</span>
        {quiz.exam && <CBadge className="exam-tile-label" color="warning">EXAMEN BLANC · CORRECTION PAR QUESTION</CBadge>}
        {quiz.draft && <CBadge className="draft-tile-label" color="warning">BROUILLON {quiz.mode === 'qcm' ? 'QCM EXPRESS' : 'PROGRESSIF'} · {answeredSlots}/{quiz.questionCount ?? quiz.questions.length} COMPLÈTES</CBadge>}
        <h3><Link to={`/quiz/${quiz.id}`}>{quiz.title}</Link></h3>
        <p>{quiz.description}</p>
        <div className="tile-footer">
          {attempt ? <span className="last-score">Dernier score <strong>{attempt.score}/{attempt.max}</strong> <small>({attempt.percentage}%)</small></span> : <span className="tile-meta">Vidéo + quiz interactif</span>}
          <div className="tile-actions" aria-label={`Actions pour ${quiz.title}`}>
            {quiz.local && <><Link className="icon-action" to={`/edit/${quiz.id}`} aria-label={`${quiz.draft ? 'Reprendre' : 'Modifier'} ${quiz.title}`} title={quiz.draft ? 'Reprendre' : 'Modifier'}>✎</Link><button className="icon-action tile-delete" onClick={() => window.confirm(`Supprimer « ${quiz.title} » de ce navigateur ?`) && onDelete(quiz.id)} aria-label={`Supprimer ${quiz.title}`} title="Supprimer">×</button></>}
            {attempt && <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Voir la progression de ${quiz.title}`} title="Voir la progression">↗</Link>}
            <Link className="icon-action icon-play" to={quizPath} aria-label={`${quiz.draft ? 'Compléter' : 'Lancer'} ${quiz.title}`} title={quiz.draft ? 'Compléter' : 'Lancer'}>▶</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DemoHome({ quizzes, attempts, onDelete }) {
  const featured = demoQuizzes[0];
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const topics = [...new Set(quizzes.map(quiz => quiz.topic))].sort();
  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return quizzes.filter(quiz => {
      const matchesQuery = !normalizedQuery || [quiz.title, quiz.description, quiz.topic].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
      const matchesMode = modeFilter === 'all' || quiz.mode === modeFilter;
      const matchesTopic = topicFilter === 'all' || quiz.topic === topicFilter;
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
          <span className="eyebrow eyebrow-dark">ESPACE D’ENTRAÎNEMENT</span>
          <h1>Réviser une vidéo,<br /><em>une question à la fois.</em></h1>
          <p>Choisissez un sujet, regardez l’extrait, puis répondez sans quitter le fil de la vidéo. Vos scores restent dans ce navigateur.</p>
          <div className="welcome-actions"><Link className="btn btn-success button button-dark" to={`/quiz/${featured.id}`}>Commencer avec la sélection <span aria-hidden="true">→</span></Link><Link className="btn btn-outline-secondary button button-quiet" to="/dashboard">Voir mon suivi <span aria-hidden="true">↗</span></Link></div>
          <div className="welcome-meta"><span><strong>{quizzes.length}</strong> quiz disponibles</span><span><strong>3</strong> modes de révision</span><span><strong>100%</strong> local</span></div>
        </div>
        <Link className="feature-frame" to={`/quiz/${featured.id}`} aria-label={`Démarrer ${featured.title}`}>
          <img src={`https://img.youtube.com/vi/${featured.videoId}/maxresdefault.jpg`} alt={`Aperçu de la vidéo ${featured.videoLabel}`} onError={event => { event.currentTarget.src = `https://img.youtube.com/vi/${featured.videoId}/hqdefault.jpg`; }} />
          <span className="feature-wash" />
          <span className="feature-play" aria-hidden="true">▶</span>
          <span className="feature-caption"><CBadge color="warning">À L’AFFICHE</CBadge><strong>{featured.title}</strong><small>{featured.questions.length} arrêts sur image · environ 3 min</small></span>
          <span className="feature-index">01 <i>/ {String(demoQuizzes.length).padStart(2, '0')}</i></span>
        </Link>
      </section>

      <Link className="road-video-collection-link" to="/videos">
        <span className="road-video-collection-mark" aria-hidden="true">▶</span>
        <span><span className="eyebrow">COLLECTION VIDÉO</span><strong>Vidéos pour vos QCM</strong><small>{videoLibrary.length} vidéos · {new Set(videoLibrary.map(video => video.theme)).size} thèmes</small></span>
        <span className="icon-action" aria-hidden="true">↗</span>
      </Link>

      <section className="library-section" aria-labelledby="library-title">
        <div className="section-heading">
          <div><span className="eyebrow">À VOUS DE JOUER</span><h2 id="library-title">Choisissez un sujet</h2></div>
          <span className="section-count">{quizzes.length.toString().padStart(2, '0')} QUIZ</span>
        </div>
        <div className="library-tools" aria-label="Filtres de la bibliothèque">
          <label className="library-search"><span aria-hidden="true">⌕</span><CFormInput value={query} onChange={event => updateFilter(setQuery)(event.target.value)} placeholder="Rechercher un quiz…" aria-label="Rechercher un quiz" /></label>
          <CFormSelect value={modeFilter} onChange={event => updateFilter(setModeFilter)(event.target.value)} aria-label="Filtrer par type"><option value="all">Tous les types</option><option value="prepared">Quiz préparés</option><option value="progressive">Progressifs</option><option value="qcm">QCM express</option></CFormSelect>
          <CFormSelect value={topicFilter} onChange={event => updateFilter(setTopicFilter)(event.target.value)} aria-label="Filtrer par thème"><option value="all">Tous les thèmes</option>{topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</CFormSelect>
          <CFormSelect value={sort} onChange={event => updateFilter(setSort)(event.target.value)} aria-label="Trier les quiz"><option value="recent">Activité récente</option><option value="title">Titre A-Z</option><option value="questions">Nombre de questions</option></CFormSelect>
        </div>
        <div className="library-result-line"><span>{filteredQuizzes.length} quiz affiché{filteredQuizzes.length === 1 ? '' : 's'}</span>{(query || modeFilter !== 'all' || topicFilter !== 'all') && <button type="button" className="clear-filters" onClick={() => { setQuery(''); setModeFilter('all'); setTopicFilter('all'); setPage(1); }}>Réinitialiser <span aria-hidden="true">×</span></button>}</div>
        <div className="quiz-grid">
          {visibleQuizzes.map(quiz => <QuizTile key={quiz.id} quiz={quiz} attempt={attempts.find(item => item.quizId === quiz.id)} onDelete={onDelete} />)}
          {!visibleQuizzes.length && <div className="library-empty"><span aria-hidden="true">⌕</span><h3>Aucun quiz trouvé</h3><p>Modifiez les filtres ou votre recherche.</p></div>}
          <Link to="/create" className="create-tile">
            <span className="create-symbol" aria-hidden="true">＋</span>
            <span className="eyebrow">VOTRE TOUR</span>
            <strong>Ajoutez votre propre quiz</strong>
            <span>Il restera dans ce navigateur, rien ne part sur un serveur.</span>
            <span className="text-action">Créer localement <b aria-hidden="true">↗</b></span>
          </Link>
        </div>
        {pageCount > 1 && <nav className="library-pagination" aria-label="Pagination des quiz"><button type="button" className="icon-action" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1} aria-label="Page précédente" title="Page précédente">←</button><span>Page {Math.min(page, pageCount)} / {pageCount}</span><button type="button" className="icon-action" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount} aria-label="Page suivante" title="Page suivante">→</button></nav>}
      </section>
      <footer className="demo-footer"><span>VIDEO QUIZ / DÉMO LOCALE</span><span>Vos quiz restent dans ce navigateur.</span><span>Une petite vitrine du produit complet.</span></footer>
    </main>
  );
}