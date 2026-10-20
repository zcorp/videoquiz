import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CBadge, CCard, CCardBody, CFormInput, CFormSelect, CProgress } from '@coreui/react';
import { formatDate, ScoreChart } from './ProgressionPage.jsx';
import { exportLocalBackup, getQuizProgression, importLocalBackup } from '../services/localStore.js';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';

function DashboardQuizRow({ quiz, attempts, selected, onSelect }) {
  const progression = getQuizProgression(quiz.id);
  const latest = progression.at(-1);
  const best = progression.reduce((current, point) => !current || point.percentage > current.percentage ? point : current, null);

  return (
    <article className={`dashboard-quiz-row${selected ? ' is-selected' : ''}`}>
      <button
        type="button"
        className="dashboard-row-select"
        onClick={() => onSelect(quiz.id)}
        aria-label={`Afficher les détails de ${quiz.title}`}
        aria-pressed={selected}
      />
      <div className="dashboard-quiz-title">
        <span className="eyebrow">{quiz.topic}</span>
        <h3>{quiz.title}</h3>
        <span>{quiz.questionCount ?? quiz.questions.length} questions · {attempts} tentative{attempts === 1 ? '' : 's'}</span>
      </div>
      <div className="dashboard-metric"><span>Dernier</span><strong>{latest ? `${latest.score}/${latest.max}` : '—'}</strong><small>{latest ? `${latest.percentage}%` : 'Pas encore joué'}</small></div>
      <div className="dashboard-metric"><span>Meilleur</span><strong>{best ? `${best.score}/${best.max}` : '—'}</strong><small>{best ? `${best.percentage}%` : 'Commencer'}</small></div>
      <div className="dashboard-row-actions" aria-label={`Actions pour ${quiz.title}`}>
        <Link className="icon-action icon-play" to={`/quiz/${quiz.id}`} aria-label={`Lancer ${quiz.title}`} title="Lancer"><DemoIcon name="mediaPlay" /></Link>
        {latest && <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Afficher l’évolution de ${quiz.title}`} title="Afficher l’évolution"><DemoIcon name="externalLink" /></Link>}
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
          <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Ouvrir la progression complète de ${quiz.title}`} title="Ouvrir la progression complète"><DemoIcon name="externalLink" /></Link>
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
  const latestAttemptForQuiz = quizId => attempts
    .filter(attempt => attempt.quizId === quizId)
    .reduce((latest, attempt) => !latest || attempt.completedAt.localeCompare(latest.completedAt) > 0 ? attempt : latest, null);
  const played = quizzes
    .filter(quiz => attempts.some(attempt => attempt.quizId === quiz.id))
    .sort((left, right) => (
      (latestAttemptForQuiz(right.id)?.completedAt ?? '')
      .localeCompare(latestAttemptForQuiz(left.id)?.completedAt ?? '')
    ));
  const backupInput = useRef(null);
  const backupSection = useRef(null);
  const [searchParams] = useSearchParams();
  const shouldFocusBackup = searchParams.get('section') === 'backup';
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupError, setBackupError] = useState(false);
  const recentQuiz = played[0];
  const recentAttempt = recentQuiz ? latestAttemptForQuiz(recentQuiz.id) : null;
  const [selectedId, setSelectedId] = useState(() => recentQuiz?.id ?? null);
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const topics = [...new Set(played.map(quiz => quiz.topic))].sort((left, right) => left.localeCompare(right, 'fr'));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredPlayed = played.filter(quiz => {
    const matchesQuery = !normalizedQuery || [quiz.title, quiz.topic, quiz.description].some(value => value?.toLocaleLowerCase().includes(normalizedQuery));
    return matchesQuery && (modeFilter === 'all' || quiz.mode === modeFilter) && (topicFilter === 'all' || quiz.topic === topicFilter);
  }).sort((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title, 'fr');
    if (sort === 'score') return (latestAttemptForQuiz(right.id)?.percentage ?? 0) - (latestAttemptForQuiz(left.id)?.percentage ?? 0);
    return (latestAttemptForQuiz(right.id)?.completedAt ?? '').localeCompare(latestAttemptForQuiz(left.id)?.completedAt ?? '');
  });
  const selectedQuiz = filteredPlayed.find(quiz => quiz.id === selectedId) ?? filteredPlayed[0] ?? null;
  const selectedPoints = selectedQuiz ? getQuizProgression(selectedQuiz.id) : [];
  const suggestedQuizzes = quizzes.filter(quiz => !quiz.draft && !attempts.some(attempt => attempt.quizId === quiz.id)).slice(0, 2);
  const totalAttempts = attempts.length;
  const average = totalAttempts
    ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / totalAttempts)
    : 0;
  const bestAttempt = attempts.reduce((best, attempt) => !best || attempt.percentage > best.percentage ? attempt : best, null);
  useEffect(() => {
    if (!shouldFocusBackup || !backupSection.current) return;
    backupSection.current.open = true;
    backupSection.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [shouldFocusBackup]);

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
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:dashboard:v1" message="Vos quiz et résultats restent dans ce navigateur." />
      <header className="dashboard-heading"><div><span className="eyebrow">{recentQuiz ? 'VOTRE ESPACE D’APPRENTISSAGE' : 'BIENVENUE DANS VOTRE ESPACE'}</span><h1>{recentQuiz ? 'Reprenez à votre rythme.' : 'Prêt à apprendre quelque chose ?'}</h1><p>{recentQuiz ? 'Votre dernier quiz est prêt à reprendre. Retrouvez votre évolution dans « Suivi ».' : 'Choisissez un quiz pour commencer. Vos résultats apparaîtront dans votre suivi.'}</p></div><Link className="btn btn-success button button-dark" to={recentQuiz ? `/quiz/${recentQuiz.id}` : '/'}>{recentQuiz ? 'Reprendre le dernier quiz' : 'Découvrir les quiz'} <DemoIcon name="arrowRight" /></Link></header>
      {played.length > 0 && <section className="dashboard-stats" aria-label="Résumé de votre activité">{[
        ['QUIZ JOUÉS', played.length, `sur ${quizzes.length} disponibles`],
        ['TENTATIVES', totalAttempts, 'enregistrées au total'],
        ['MOYENNE', <>{average}<small>%</small></>, 'sur les tentatives terminées'],
        ['MEILLEUR SCORE', bestAttempt ? `${bestAttempt.score}/${bestAttempt.max}` : '—', bestAttempt ? `${bestAttempt.percentage}%` : 'À établir'],
      ].map(([label, value, caption]) => <CCard className="dashboard-stat-card" key={label}><CCardBody><span className="eyebrow">{label}</span><strong>{value}</strong><small>{caption}</small></CCardBody></CCard>)}</section>}
      {played.length > 0 && <section className="dashboard-section dashboard-desktop-tracking" aria-labelledby="dashboard-quiz-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">SUIVI PAR QUIZ</span><h2 id="dashboard-quiz-title">Vos entraînements</h2></div><Link className="dashboard-text-link" to="/suivi">Voir tout le suivi <DemoIcon name="arrowRight" /></Link></div>
        <div className="dashboard-filters">
          <CFormInput value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans vos entraînements" />
          <CFormSelect value={modeFilter} onChange={event => setModeFilter(event.target.value)} aria-label="Filtrer les entraînements par type"><option value="all">Tous les types</option><option value="prepared">Préparés</option><option value="progressive">Progressifs</option><option value="qcm">QCM</option></CFormSelect>
          <CFormSelect value={topicFilter} onChange={event => setTopicFilter(event.target.value)} aria-label="Filtrer les entraînements par thème"><option value="all">Tous les thèmes</option>{topics.map(topic => <option key={topic} value={topic}>{topic}</option>)}</CFormSelect>
          <CFormSelect value={sort} onChange={event => setSort(event.target.value)} aria-label="Trier les entraînements"><option value="recent">Plus récents</option><option value="score">Meilleur score</option><option value="title">Titre A-Z</option></CFormSelect>
        </div>
        <div className="dashboard-master-detail">
          <div className="dashboard-quiz-list">{filteredPlayed.map(quiz => <DashboardQuizRow key={quiz.id} quiz={quiz} attempts={attempts.filter(attempt => attempt.quizId === quiz.id).length} selected={selectedQuiz?.id === quiz.id} onSelect={setSelectedId} />)}{!filteredPlayed.length && <div className="dashboard-filter-empty">Aucun entraînement ne correspond aux filtres.</div>}</div>
          <DashboardProgressDetail quiz={selectedQuiz} points={selectedPoints} />
        </div>
      </section>}
      {recentQuiz && recentAttempt && <section className="dashboard-resume-section" aria-labelledby="dashboard-resume-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">REPRENDRE</span><h2 id="dashboard-resume-title">Là où vous en étiez</h2></div><Link className="dashboard-text-link" to="/suivi">Voir mon suivi <DemoIcon name="arrowRight" /></Link></div>
        <Link className="dashboard-resume-card" to={`/quiz/${recentQuiz.id}`}>
          <span><span className="eyebrow">{recentQuiz.topic}</span><strong>{recentQuiz.title}</strong><small>{recentQuiz.questionCount ?? recentQuiz.questions.length} questions · dernier score {recentAttempt.score}/{recentAttempt.max} ({recentAttempt.percentage}%)</small></span>
          <span className="dashboard-resume-action">Reprendre <DemoIcon name="arrowRight" /></span>
        </Link>
      </section>}
      {!recentQuiz && <section className="dashboard-empty dashboard-first-step" aria-label="Commencer un quiz"><p>Faites une première tentative pour retrouver vos résultats et votre évolution dans « Suivi ».</p><Link className="dashboard-text-link" to="/suivi">Découvrir votre suivi <DemoIcon name="arrowRight" /></Link></section>}
      {suggestedQuizzes.length > 0 && <section className="dashboard-section dashboard-all-quizzes" aria-labelledby="dashboard-all-title"><div className="dashboard-section-heading"><div><span className="eyebrow">{recentQuiz ? 'À DÉCOUVRIR ENSUITE' : 'POUR COMMENCER'}</span><h2 id="dashboard-all-title">{recentQuiz ? 'Envie d’un autre sujet ?' : 'Un sujet pour commencer'}</h2></div><Link className="dashboard-text-link" to="/">Tous les quiz <DemoIcon name="arrowRight" /></Link></div><div className="dashboard-quick-grid">{suggestedQuizzes.map(quiz => <Link key={quiz.id} to={`/quiz/${quiz.id}`}><span>{quiz.topic}</span><strong>{quiz.title}</strong><small>{quiz.questionCount ?? quiz.questions.length} questions <b><DemoIcon name="externalLink" /></b></small></Link>)}</div></section>}
      <section className="dashboard-section backup-section" aria-labelledby="backup-title">
        <details ref={backupSection} className="dashboard-backup-details">
          <summary><span><span className="eyebrow">VOS DONNÉES</span><strong id="backup-title">Sauvegarder ou restaurer</strong></span><DemoIcon name="arrowRight" /></summary>
          <div className="dashboard-backup-content">
            <p>Gardez une copie de vos quiz et résultats, ou transférez-les vers un autre navigateur. Fichier JSON de 5 Mo maximum.</p>
            <div className="backup-actions">
              <button type="button" className="button button-dark" onClick={downloadBackup}>Télécharger une sauvegarde</button>
              <button type="button" className="button button-quiet" onClick={() => backupInput.current?.click()}>Importer une sauvegarde</button>
              <input ref={backupInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Choisir un fichier de sauvegarde Video Quiz" onChange={importBackupFile} />
            </div>
            {backupStatus && <p className={`backup-status${backupError ? ' is-error' : ''}`} role={backupError ? 'alert' : 'status'} aria-live="polite">{backupStatus}</p>}
          </div>
        </details>
      </section>
    </main>
  );
}
