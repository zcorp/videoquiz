import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportLocalBackup, importLocalBackup } from '../services/localStore.js';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';

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
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupError, setBackupError] = useState(false);
  const recentQuiz = played[0];
  const recentAttempt = recentQuiz ? latestAttemptForQuiz(recentQuiz.id) : null;
  const suggestedQuizzes = quizzes.filter(quiz => !quiz.draft && !attempts.some(attempt => attempt.quizId === quiz.id)).slice(0, 2);
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
      <header className="dashboard-heading"><div><span className="eyebrow">{recentQuiz ? 'VOTRE ESPACE D’APPRENTISSAGE' : 'BIENVENUE DANS VOTRE ESPACE'}</span><h1>{recentQuiz ? 'Reprenez à votre rythme.' : 'Prêt à apprendre quelque chose ?'}</h1><p>{recentQuiz ? 'Votre dernier quiz est prêt à reprendre. Vos graphiques sont dans votre suivi.' : 'Choisissez un quiz pour commencer. Vos résultats apparaîtront dans votre suivi.'}</p></div><Link className="btn btn-success button button-dark" to={recentQuiz ? `/quiz/${recentQuiz.id}` : '/'}>{recentQuiz ? 'Reprendre le dernier quiz' : 'Découvrir les quiz'} <DemoIcon name="arrowRight" /></Link></header>
      {recentQuiz && recentAttempt && <section className="dashboard-resume-section" aria-labelledby="dashboard-resume-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">REPRENDRE</span><h2 id="dashboard-resume-title">Là où vous en étiez</h2></div><Link className="dashboard-text-link" to="/suivi">Voir mon suivi <DemoIcon name="arrowRight" /></Link></div>
        <Link className="dashboard-resume-card" to={`/quiz/${recentQuiz.id}`}>
          <span><span className="eyebrow">{recentQuiz.topic}</span><strong>{recentQuiz.title}</strong><small>{recentQuiz.questionCount ?? recentQuiz.questions.length} questions · dernier score {recentAttempt.score}/{recentAttempt.max} ({recentAttempt.percentage}%)</small></span>
          <span className="dashboard-resume-action">Reprendre <DemoIcon name="arrowRight" /></span>
        </Link>
      </section>}
      {!recentQuiz && <section className="dashboard-empty dashboard-first-step" aria-label="Commencer un quiz"><p>Faites une première tentative : vos résultats et graphiques apparaîtront automatiquement dans « Suivi ».</p><Link className="dashboard-text-link" to="/suivi">Découvrir votre suivi <DemoIcon name="arrowRight" /></Link></section>}
      {suggestedQuizzes.length > 0 && <section className="dashboard-section dashboard-all-quizzes" aria-labelledby="dashboard-all-title"><div className="dashboard-section-heading"><div><span className="eyebrow">{recentQuiz ? 'À DÉCOUVRIR ENSUITE' : 'POUR COMMENCER'}</span><h2 id="dashboard-all-title">{recentQuiz ? 'Envie d’un autre sujet ?' : 'Un sujet pour commencer'}</h2></div><Link className="dashboard-text-link" to="/">Tous les quiz <DemoIcon name="arrowRight" /></Link></div><div className="dashboard-quick-grid">{suggestedQuizzes.map(quiz => <Link key={quiz.id} to={`/quiz/${quiz.id}`}><span>{quiz.topic}</span><strong>{quiz.title}</strong><small>{quiz.questionCount ?? quiz.questions.length} questions <b><DemoIcon name="externalLink" /></b></small></Link>)}</div></section>}
      <section className="dashboard-section backup-section" aria-labelledby="backup-title">
        <details className="dashboard-backup-details">
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
