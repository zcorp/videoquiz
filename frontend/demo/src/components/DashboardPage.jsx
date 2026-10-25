import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CCard, CCardBody } from '@coreui/react';
import { ScoreChart } from './ProgressionPage.jsx';
import { exportLocalBackup, importLocalBackup, MAX_BACKUP_SIZE_BYTES } from '../services/localStore.js';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';
import { useLanguage } from '../i18n.jsx';

const previewProgression = [3, 5, 6, 8].map((score, index) => ({
  score,
  max: 10,
  percentage: score * 10,
  date: `preview-${index + 1}`,
}));

export default function DashboardPage({ quizzes, attempts, onDataChanged, onTrack }) {
  const { t } = useLanguage();
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
  const [importSummary, setImportSummary] = useState(null);
  const [pendingBackupImport, setPendingBackupImport] = useState(null);
  const recentQuiz = played[0];
  const recentAttempt = recentQuiz ? latestAttemptForQuiz(recentQuiz.id) : null;
  const suggestedQuizzes = quizzes.filter(quiz => !quiz.draft && !attempts.some(attempt => attempt.quizId === quiz.id)).slice(0, 2);
  const totalAttempts = attempts.length;
  const average = totalAttempts
    ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / totalAttempts)
    : 0;
  const bestAttempt = attempts.reduce((best, attempt) => !best || attempt.percentage > best.percentage ? attempt : best, null);
  const importHasChanges = Boolean(importSummary && (
    importSummary.importedQuizzes
    || importSummary.importedAttempts
    || importSummary.importedCorrections
    || importSummary.importedProgress
    || importSummary.replacedProgress
  ));
  useEffect(() => {
    if (!shouldFocusBackup || !backupSection.current) return;
    backupSection.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [shouldFocusBackup]);

  const finishBackupImport = (backup, progressResolution = null) => {
    const imported = importLocalBackup(backup, progressResolution);
    if (!imported.ok) {
      if (imported.needsProgressResolution) {
        setPendingBackupImport({ backup, conflicts: imported.progressConflicts });
        setBackupStatus(null);
        return;
      }
      setPendingBackupImport(null);
      setBackupError(true);
      setBackupStatus(imported.error);
      return;
    }
    setPendingBackupImport(null);
    setBackupError(false);
    setBackupStatus(null);
    setImportSummary(imported);
    onDataChanged?.();
    onTrack?.('backup_imported');
  };

  const downloadBackup = () => {
    try {
      const backup = exportLocalBackup();
      const serialized = JSON.stringify(backup, null, 2);
      const blob = new Blob([serialized], { type: 'application/json' });
      if (blob.size > MAX_BACKUP_SIZE_BYTES) {
        setBackupError(true);
        setBackupStatus(t('La sauvegarde dépasse 5 Mo. Supprimez des quiz ou des résultats inutiles avant de réessayer.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `video-quiz-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupError(false);
      setImportSummary(null);
      setPendingBackupImport(null);
      setBackupStatus(t('Sauvegarde téléchargée. Conservez ce fichier dans un emplacement sûr.'));
      onTrack?.('backup_exported');
    } catch {
      setBackupError(true);
      setBackupStatus(t('Impossible de créer la sauvegarde dans ce navigateur.'));
    }
  };
  const importBackupFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setBackupStatus(null);
    setBackupError(false);
    setPendingBackupImport(null);
    setImportSummary(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      setBackupError(true);
      setBackupStatus(t('Le fichier dépasse la limite de 5 Mo.'));
      return;
    }
    try {
      let parsed;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        setBackupError(true);
        setBackupStatus(t('Impossible de lire ce fichier. Vérifiez qu’il s’agit d’un JSON valide.'));
        return;
      }
      finishBackupImport(parsed);
    } catch {
      setPendingBackupImport(null);
      setBackupError(true);
      setBackupStatus(t('Le navigateur n’a pas pu traiter cette sauvegarde.'));
    }
  };

  return (
    <main className="demo-page dashboard-page">
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:dashboard:v1" message="Vos quiz et résultats restent dans ce navigateur." />
      <header className="dashboard-heading"><div><span className="eyebrow">{t(recentQuiz ? 'VOTRE ESPACE D’APPRENTISSAGE' : 'BIENVENUE DANS VOTRE ESPACE')}</span><h1>{t(recentQuiz ? 'Reprenez à votre rythme.' : 'Prêt à apprendre quelque chose ?')}</h1>{recentQuiz && <p>{t('Votre dernier quiz est prêt à reprendre. Retrouvez votre évolution dans « Suivi ».')}</p>}</div>{!recentQuiz && <Link className="btn btn-success button button-dark" to="/">{t('Découvrir les quiz')} <DemoIcon name="arrowRight" /></Link>}</header>
      {recentQuiz && recentAttempt && <section className="dashboard-resume-section" aria-labelledby="dashboard-resume-title">
        <div className="dashboard-section-heading"><div><span className="eyebrow">{t('REPRENDRE')}</span><h2 id="dashboard-resume-title">{t('Là où vous en étiez')}</h2></div><Link className="dashboard-text-link" to="/suivi">{t('Voir mon suivi')} <DemoIcon name="arrowRight" /></Link></div>
        <Link className="dashboard-resume-card" to={`/quiz/${recentQuiz.id}`}>
          <span><span className="eyebrow">{recentQuiz.topic}</span><strong>{recentQuiz.title}</strong><small>{recentQuiz.questionCount ?? recentQuiz.questions.length} {t('questions')} · {t('Dernier score')} {recentAttempt.score}/{recentAttempt.max} ({recentAttempt.percentage}%)</small></span>
          <span className="dashboard-resume-action">{t('Reprendre')} <DemoIcon name="arrowRight" /></span>
        </Link>
      </section>}
      {played.length > 0 && <section className="dashboard-stats" aria-label={t('Résumé de votre activité')}>{[
        [t('QUIZ JOUÉS'), played.length, `${t('sur')} ${quizzes.length} ${t('disponibles')}`],
        [t('TENTATIVES'), totalAttempts, t('enregistrées au total')],
        [t('MOYENNE'), <>{average}<small>%</small></>, t('sur les tentatives terminées')],
        [t('MEILLEUR SCORE'), bestAttempt ? `${bestAttempt.score}/${bestAttempt.max}` : '—', bestAttempt ? `${bestAttempt.percentage}%` : t('À établir')],
      ].map(([label, value, caption]) => <CCard className="dashboard-stat-card" key={label}><CCardBody><span className="eyebrow">{label}</span><strong>{value}</strong><small>{caption}</small></CCardBody></CCard>)}</section>}
      {!recentQuiz && <section className="dashboard-empty dashboard-first-step" aria-label={t('Commencer un quiz')}><p>{t('Faites une première tentative pour retrouver vos résultats et votre évolution dans « Suivi ».')}</p><Link className="dashboard-text-link" to="/suivi">{t('Découvrir votre suivi')} <DemoIcon name="arrowRight" /></Link></section>}
      {!recentQuiz && <section className="dashboard-preview" aria-labelledby="dashboard-preview-title">
        <div className="dashboard-preview-heading">
          <div><span className="eyebrow">{t('APERÇU')}</span><h2 id="dashboard-preview-title">{t('À quoi ressemblera votre suivi ?')}</h2></div>
          <span className="dashboard-preview-badge">{t('EXEMPLE FICTIF')}</span>
        </div>
        <p>{t('Ce graphique est un exemple fictif. Après vos quiz, il sera remplacé par vos résultats réels.')}</p>
        <ScoreChart points={previewProgression} preview />
      </section>}
      {suggestedQuizzes.length > 0 && <section className="dashboard-section dashboard-all-quizzes" aria-labelledby="dashboard-all-title"><div className="dashboard-section-heading"><div><span className="eyebrow">{t(recentQuiz ? 'À DÉCOUVRIR ENSUITE' : 'POUR COMMENCER')}</span><h2 id="dashboard-all-title">{t(recentQuiz ? 'Envie d’un autre sujet ?' : 'Un sujet pour commencer')}</h2></div><Link className="dashboard-text-link" to="/">{t('Tous les quiz')} <DemoIcon name="arrowRight" /></Link></div><div className="dashboard-quick-grid">{suggestedQuizzes.map(quiz => <Link key={quiz.id} to={`/quiz/${quiz.id}`}><span>{quiz.topic}</span><strong>{quiz.title}</strong><small>{quiz.questionCount ?? quiz.questions.length} {t('questions')} <b><DemoIcon name="externalLink" /></b></small></Link>)}</div></section>}
      <section ref={backupSection} id="backup-section" className="dashboard-section backup-section" aria-labelledby="backup-title">
        <div className="dashboard-backup-card">
          <div className="dashboard-backup-heading"><span className="eyebrow">{t('VOS DONNÉES')}</span><h2 id="backup-title">{t('Retrouvez vos quiz sur un autre appareil.')}</h2><p>{t('Téléchargez ici, transférez le fichier, puis importez-le sur l’autre appareil. Votre progression en cours est incluse.')}</p></div>
          <div className="backup-actions">
            <button type="button" className="button button-dark" onClick={downloadBackup}>{t('Télécharger mes données')}</button>
            <button type="button" className="button button-quiet" onClick={() => backupInput.current?.click()}>{t('Importer des données')}</button>
            <input ref={backupInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label={t('Choisir un fichier de sauvegarde Video Quiz')} onChange={importBackupFile} />
          </div>
          <p className="dashboard-backup-footnote">{t('Ce transfert manuel ne synchronise pas vos appareils. Le fichier peut contenir vos quiz, réponses et résultats : gardez-le dans un endroit sûr.')}</p>
          {backupStatus && <p className={`backup-status${backupError ? ' is-error' : ''}`} role={backupError ? 'alert' : 'status'} aria-live="polite">{backupStatus}</p>}
          {pendingBackupImport && <div className="dashboard-progress-conflict" role="alert">
            <h3>{t('Une progression existe déjà sur cet appareil.')}</h3>
            <p>{pendingBackupImport.conflicts.length === 1
              ? t('Pour « {title} », choisissez la progression à reprendre.').replace('{title}', pendingBackupImport.conflicts[0].title)
              : t('Pour {count} quiz, choisissez si vous gardez la progression de cet appareil ou celle du fichier.').replace('{count}', pendingBackupImport.conflicts.length)}</p>
            <div className="backup-actions">
              <button type="button" className="button button-quiet" onClick={() => finishBackupImport(pendingBackupImport.backup, 'keep-local')}>{t('Garder cette progression')}</button>
              <button type="button" className="button button-dark" onClick={() => finishBackupImport(pendingBackupImport.backup, 'use-backup')}>{t('Reprendre depuis le fichier')}</button>
            </div>
          </div>}
        </div>
      </section>
      {importSummary && <section className="dashboard-import-summary" role="status" aria-live="polite">
        <div className="dashboard-import-summary-heading"><span className="dashboard-import-check"><DemoIcon name="check" /></span><div><span className="eyebrow">{t('TRANSFERT TERMINÉ')}</span><h2>{t(importHasChanges ? 'Vos données sont prêtes sur cet appareil.' : importSummary.skippedQuizzes ? 'Ces quiz sont déjà sur cet appareil.' : 'Aucune nouvelle donnée à importer.')}</h2></div></div>
        {importHasChanges && <p>{t('Ajoutés à ce navigateur : {quizzes} quiz, {attempts} résultats, {corrections} corrections et {progress} reprises.')
          .replace('{quizzes}', importSummary.importedQuizzes)
          .replace('{attempts}', importSummary.importedAttempts)
          .replace('{corrections}', importSummary.importedCorrections)
          .replace('{progress}', importSummary.importedProgress + importSummary.replacedProgress)}</p>}
        {!importHasChanges && importSummary.skippedQuizzes === 0 && <p>{t('Le fichier ne contenait aucune donnée nouvelle.')}</p>}
        {importSummary.skippedQuizzes > 0 && <p className="dashboard-import-note">{t('{count} quiz déjà présents ont été conservés sans remplacement.').replace('{count}', importSummary.skippedQuizzes)}</p>}
        {importSummary.keptProgress > 0 && <p className="dashboard-import-note">{t('Vous avez conservé la progression déjà présente sur cet appareil pour {count} quiz.').replace('{count}', importSummary.keptProgress)}</p>}
        {importSummary.resumableQuizIds.length === 1 && quizzes.some(quiz => quiz.id === importSummary.resumableQuizIds[0]) && <Link className="button button-dark" to={`/quiz/${importSummary.resumableQuizIds[0]}`}>{t('Reprendre mon quiz')} <DemoIcon name="arrowRight" /></Link>}
        {importSummary.resumableQuizIds.length > 1 && <div className="dashboard-import-resumes"><strong>{t('Reprendre un quiz')}</strong>{importSummary.resumableQuizIds.map(id => {
          const quiz = quizzes.find(item => item.id === id);
          return quiz ? <Link key={id} to={`/quiz/${id}`}>{quiz.title} <DemoIcon name="arrowRight" /></Link> : null;
        })}</div>}
        {!importSummary.resumableQuizIds.some(id => quizzes.some(quiz => quiz.id === id)) && <Link className="button button-dark" to="/">{t('Voir mes quiz')} <DemoIcon name="arrowRight" /></Link>}
      </section>}
    </main>
  );
}
