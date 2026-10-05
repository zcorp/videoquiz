import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CFormInput, CFormSelect, CProgress } from '@coreui/react';
import { formatDate, ScoreChart } from './ProgressionPage.jsx';
import { exportLocalBackup, getQuizProgression, importLocalBackup } from '../services/localStore.js';

function QuizSummary({ quiz, attempts, selected, onSelect }) {
  const progression = getQuizProgression(quiz.id);
  const latest = progression.at(-1);
  const best = progression.reduce((current, point) => !current || point.percentage > current.percentage ? point : current, null);

  return (
    <article className={`dashboard-quiz-row${selected ? ' is-selected' : ''}`}>
      <div className="dashboard-quiz-title">
        <span className="eyebrow">{quiz.topic}</span>
        <h3>{quiz.title}</h3>
        <span>{quiz.questionCount ?? quiz.questions.length} questions · {attempts} tentative{attempts === 1 ? '' : 's'}</span>
      </div>
      <div className="dashboard-metric"><span>Dernier</span><strong>{latest ? `${latest.score}/${latest.max}` : '—'}</strong><small>{latest ? `${latest.percentage}%` : 'Pas encore joué'}</small></div>
      <div className="dashboard-metric"><span>Meilleur</span><strong>{best ? `${best.score}/${best.max}` : '—'}</strong><small>{best ? `${best.percentage}%` : 'Commencer'}</small></div>
      <div className="dashboard-row-actions" aria-label={`Actions pour ${quiz.title}`}>
        <Link className="icon-action icon-play" to={`/quiz/${quiz.id}`} aria-label={`Lancer ${quiz.title}`} title="Lancer">▶</Link>
        {latest && <button type="button" className="icon-action" onClick={() => onSelect(quiz.id)} aria-label={`Afficher l’évolution de ${quiz.title}`} aria-pressed={selected} title="Afficher l’évolution">↗</button>}
      </div>
    </article>
  );
}

function DashboardProgressDetail({ quiz, points }) {
  if (!quiz) return <div className="dashboard-empty"><h3>Aucun entraînement sélectionné.</h3><p>Modifiez les filtres ou lancez un quiz pour commencer.</p></div>;
  const latest = points.at(-1);

  return (
    <CCard className="dashboard-progress-detail" aria-live="polite">
     <CCardBody>
      <div className="dashboard-detail-heading">
        <div><span className="eyebrow">ÉVOLUTION</span><h3>{quiz.title}</h3><span>{points.length} tentative{points.length === 1 ? '' : 's'}</span></div>
        <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Ouvrir la progression complète de ${quiz.title}`} title="Ouvrir la progression complète">↗</Link>
      </div>
      {latest ? <>
        <div className="dashboard-detail-score"><span>Dernier score</span><strong>{latest.score}/{latest.max}</strong><CBadge color="success">{latest.percentage}%</CBadge></div>
        <CProgress className="dashboard-score-progress" value={latest.percentage} max={100} color="success" aria-label={`Dernier score : ${latest.percentage}%`} />
        <ScoreChart points={points} compact />
        <div className="dashboard-detail-history">{points.slice().reverse().slice(0, 5).map((point, index) => <span key={`${point.date}-${index}`}><small>{formatDate(point.date)}</small><strong>{point.score}/{point.max}</strong></span>)}</div>
      </> : <p className="dashboard-filter-empty">Aucune tentative enregistrée pour ce quiz.</p>}
       </CCardBody>
      </CCard>
  );
}

export default function DashboardPage({ quizzes, attempts, onDataChanged, onTrack }) {
  const played = quizzes.filter(quiz => attempts.some(attempt => attempt.quizId === quiz.id));
  const [selectedId, setSelectedId] = useState(() => played[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const backupInput = useRef(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupError, setBackupError] = useState(false);
  const totalAttempts = attempts.length;
  const bestAttempt = attempts.reduce((current, attempt) => !current || attempt.percentage > current.percentage ? attempt : current, null);
  const average = attempts.length ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length) : 0;
  const topics = [...new Set(played.map(quiz => quiz.topic))].sort();
  const filteredPlayed = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return played.filter(quiz => {
      const matchesQuery = !normalizedQuery || [quiz.title, quiz.topic, quiz.description].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
      return matchesQuery && (modeFilter === 'all' || quiz.mode === modeFilter) && (topicFilter === 'all' || quiz.topic === topicFilter);
    }).sort((left, right) => {
      if (sort === 'title') return left.title.localeCompare(right.title, 'fr');
      if (sort === 'score') return (attempts.find(attempt => attempt.quizId === right.id)?.percentage ?? 0) - (attempts.find(attempt => attempt.quizId === left.id)?.percentage ?? 0);
      const leftDate = attempts.find(attempt => attempt.quizId === left.id)?.completedAt ?? '';
      const rightDate = attempts.find(attempt => attempt.quizId === right.id)?.completedAt ?? '';
      return rightDate.localeCompare(leftDate);
    });
  }, [attempts, modeFilter, played, query, sort, topicFilter]);
  const selectedQuiz = filteredPlayed.find(quiz => quiz.id === selectedId) ?? filteredPlayed[0];
  const selectedPoints = selectedQuiz ? getQuizProgression(selectedQuiz.id) : [];
  const downloadBackup = () => {
    try {
      const backup = exportLocalBackup();
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `video-quiz-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupError(false);
      setBackupStatus('Sauvegarde téléchargée. Conservez ce fichier dans un emplacement sûr.');
      onTrack?.('backup_exported');
    } catch {
      setBackupError(true);
      setBackupStatus('Impossible de créer la sauvegarde dans ce navigateur.');
    }
  };
  const importBackupFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setBackupStatus(null);
    setBackupError(false);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setBackupError(true);
      setBackupStatus('Le fichier dépasse la limite de 5 Mo.');
      return;
    }
    try {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        setBackupError(true);
        setBackupStatus('Impossible de lire ce fichier. Vérifiez qu’il s’agit d’un JSON valide.');
        return;
      }
      const imported = importLocalBackup(parsed);
      if (!imported.ok) {
        setBackupError(true);
        setBackupStatus(imported.error);
        return;
      }
      onDataChanged?.();
      setBackupStatus(`Import terminé : ${imported.importedQuizzes} quiz, ${imported.importedAttempts} tentatives, ${imported.importedCorrections} auto-corrections et ${imported.importedProgress} reprises ajoutés. ${imported.skippedQuizzes} quiz déjà présents ignorés.`);
      onTrack?.('backup_imported');
    } catch {
      setBackupError(true);
      setBackupStatus('Le navigateur n’a pas pu traiter cette sauvegarde.');
    }
  };

  return (
    <main className="demo-page dashboard-page">
      <div className="player-topline"><Link to="/" className="back-link">← Bibliothèque</Link><span className="eyebrow">VOTRE ESPACE LOCAL</span><span className="player-save-note"><span aria-hidden="true">●</span> Données conservées sur cet appareil</span></div>
      <header className="dashboard-heading"><div><span className="eyebrow">TABLEAU DE BORD</span><h1>Votre progression, en un coup d’œil.</h1><p>Retrouvez vos quiz, vos résultats et les prochaines révisions à poursuivre.</p></div><Link className="btn btn-success button button-dark" to="/create">Créer un quiz <span aria-hidden="true">＋</span></Link></header>
      <section className="dashboard-stats" aria-label="Résumé de votre activité">{[
        ['QUIZ JOUÉS', played.length, `sur ${quizzes.length} disponibles`],
        ['TENTATIVES', totalAttempts, 'conservées localement'],
        ['MOYENNE', <>{average}<small>%</small></>, 'sur les tentatives terminées'],
        ['MEILLEUR SCORE', bestAttempt ? `${bestAttempt.score}/${bestAttempt.max}` : '—', bestAttempt ? `${bestAttempt.percentage}%` : 'À établir'],
      ].map(([label, value, caption]) => <CCard className="dashboard-stat-card" key={label}><CCardBody><span className="eyebrow">{label}</span><strong>{value}</strong><small>{caption}</small></CCardBody></CCard>)}</section>
      <section className="dashboard-section" aria-labelledby="dashboard-quiz-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">SUIVI PAR QUIZ</span><h2 id="dashboard-quiz-title">Vos entraînements</h2></div><Link className="icon-action" to="/" aria-label="Voir tous les quiz" title="Voir tous les quiz">↗</Link></div>
        {played.length ? <>
          <div className="dashboard-filters"><CFormInput value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans vos entraînements" /><CFormSelect value={modeFilter} onChange={event => setModeFilter(event.target.value)} aria-label="Filtrer les entraînements par type"><option value="all">Tous les types</option><option value="prepared">Préparés</option><option value="progressive">Progressifs</option><option value="qcm">QCM</option></CFormSelect><CFormSelect value={topicFilter} onChange={event => setTopicFilter(event.target.value)} aria-label="Filtrer les entraînements par thème"><option value="all">Tous les thèmes</option>{topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</CFormSelect><CFormSelect value={sort} onChange={event => setSort(event.target.value)} aria-label="Trier les entraînements"><option value="recent">Plus récents</option><option value="score">Meilleur score</option><option value="title">Titre A-Z</option></CFormSelect></div>
          <div className="dashboard-master-detail">
            <div className="dashboard-quiz-list">{filteredPlayed.map(quiz => <QuizSummary key={quiz.id} quiz={quiz} attempts={attempts.filter(attempt => attempt.quizId === quiz.id).length} selected={selectedQuiz?.id === quiz.id} onSelect={setSelectedId} />)}{!filteredPlayed.length && <div className="dashboard-filter-empty">Aucun entraînement ne correspond aux filtres.</div>}</div>
            <DashboardProgressDetail quiz={selectedQuiz} points={selectedPoints} />
          </div>
        </> : <div className="dashboard-empty"><h3>Votre première tentative apparaîtra ici.</h3><p>Lancez un quiz depuis la bibliothèque pour commencer à suivre votre progression.</p><Link className="btn btn-success button button-dark" to="/">Découvrir les quiz <span aria-hidden="true">→</span></Link></div>}
      </section>
      <section className="dashboard-section dashboard-all-quizzes" aria-labelledby="dashboard-all-title"><div className="dashboard-section-heading"><div><span className="eyebrow">À EXPLORER</span><h2 id="dashboard-all-title">Continuer à apprendre</h2></div></div><div className="dashboard-quick-grid">{quizzes.slice(0, 4).map(quiz => <Link key={quiz.id} to={`/quiz/${quiz.id}`}><span>{quiz.topic}</span><strong>{quiz.title}</strong><small>{quiz.questionCount ?? quiz.questions.length} questions <b aria-hidden="true">↗</b></small></Link>)}</div></section>
      <section className="dashboard-section backup-section" aria-labelledby="backup-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">VOS DONNÉES</span><h2 id="backup-title">Sauvegarder ou restaurer</h2></div></div>
        <p>Exportez vos quiz, résultats, auto-corrections et quiz en cours pour les conserver ou les déplacer vers un autre navigateur. Les fichiers JSON importés sont limités à 5 Mo.</p>
        <div className="backup-actions">
          <button type="button" className="button button-dark" onClick={downloadBackup}>Télécharger une sauvegarde</button>
          <button type="button" className="button button-quiet" onClick={() => backupInput.current?.click()}>Importer une sauvegarde</button>
          <input ref={backupInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Choisir un fichier de sauvegarde Video Quiz" onChange={importBackupFile} />
        </div>
        {backupStatus && <p className={`backup-status${backupError ? ' is-error' : ''}`} role={backupError ? 'alert' : 'status'} aria-live="polite">{backupStatus}</p>}
      </section>
    </main>
  );
}
