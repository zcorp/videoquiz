import React from 'react';
import { Link } from 'react-router-dom';
import { getQuizProgression } from '../services/localStore.js';

function QuizSummary({ quiz, attempts }) {
  const progression = getQuizProgression(quiz.id);
  const latest = progression.at(-1);
  const best = progression.reduce((current, point) => !current || point.percentage > current.percentage ? point : current, null);
  return (
    <article className="dashboard-quiz-row">
      <div className="dashboard-quiz-title"><span className="eyebrow">{quiz.topic}</span><h3>{quiz.title}</h3><span>{quiz.questionCount ?? quiz.questions.length} questions · {attempts} tentative{attempts === 1 ? '' : 's'}</span></div>
      <div className="dashboard-metric"><span>Dernier</span><strong>{latest ? `${latest.score}/${latest.max}` : '—'}</strong><small>{latest ? `${latest.percentage}%` : 'Pas encore joué'}</small></div>
      <div className="dashboard-metric"><span>Meilleur</span><strong>{best ? `${best.score}/${best.max}` : '—'}</strong><small>{best ? `${best.percentage}%` : 'Commencer'}</small></div>
      <div className="dashboard-row-actions" aria-label={`Actions pour ${quiz.title}`}><Link className="icon-action icon-play" to={`/quiz/${quiz.id}`} aria-label={`Lancer ${quiz.title}`} title="Lancer">▶</Link>{latest && <Link className="icon-action" to={`/progression/${quiz.id}`} aria-label={`Voir l’évolution de ${quiz.title}`} title="Voir l’évolution">↗</Link>}</div>
    </article>
  );
}

export default function DashboardPage({ quizzes, attempts }) {
  const played = quizzes.filter(quiz => attempts.some(attempt => attempt.quizId === quiz.id));
  const totalAttempts = attempts.length;
  const bestAttempt = attempts.reduce((current, attempt) => !current || attempt.percentage > current.percentage ? attempt : current, null);
  const average = attempts.length ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length) : 0;

  return (
    <main className="demo-page dashboard-page">
      <div className="player-topline"><Link to="/" className="back-link">← Bibliothèque</Link><span className="eyebrow">VOTRE ESPACE LOCAL</span><span className="player-save-note"><span aria-hidden="true">●</span> Données conservées sur cet appareil</span></div>
      <header className="dashboard-heading"><div><span className="eyebrow">TABLEAU DE BORD</span><h1>Votre progression, en un coup d’œil.</h1><p>Retrouvez vos quiz, vos résultats et les prochaines révisions à poursuivre.</p></div><Link className="button button-dark" to="/create">Créer un quiz <span aria-hidden="true">＋</span></Link></header>
      <section className="dashboard-stats" aria-label="Résumé de votre activité"><article><span className="eyebrow">QUIZ JOUÉS</span><strong>{played.length}</strong><small>sur {quizzes.length} disponibles</small></article><article><span className="eyebrow">TENTATIVES</span><strong>{totalAttempts}</strong><small>conservées localement</small></article><article><span className="eyebrow">MOYENNE</span><strong>{average}<small>%</small></strong><small>sur les tentatives terminées</small></article><article><span className="eyebrow">MEILLEUR SCORE</span><strong>{bestAttempt ? `${bestAttempt.score}/${bestAttempt.max}` : '—'}</strong><small>{bestAttempt ? `${bestAttempt.percentage}%` : 'À établir'}</small></article></section>
      <section className="dashboard-section" aria-labelledby="dashboard-quiz-title"><div className="dashboard-section-heading"><div><span className="eyebrow">SUIVI PAR QUIZ</span><h2 id="dashboard-quiz-title">Vos entraînements</h2></div><Link className="icon-action" to="/" aria-label="Voir tous les quiz" title="Voir tous les quiz">↗</Link></div>{played.length ? <div className="dashboard-quiz-list">{played.map(quiz => <QuizSummary key={quiz.id} quiz={quiz} attempts={attempts.filter(attempt => attempt.quizId === quiz.id).length} />)}</div> : <div className="dashboard-empty"><h3>Votre première tentative apparaîtra ici.</h3><p>Lancez un quiz depuis la bibliothèque pour commencer à suivre votre progression.</p><Link className="button button-dark" to="/">Découvrir les quiz <span aria-hidden="true">→</span></Link></div>}</section>
      <section className="dashboard-section dashboard-all-quizzes" aria-labelledby="dashboard-all-title"><div className="dashboard-section-heading"><div><span className="eyebrow">À EXPLORER</span><h2 id="dashboard-all-title">Continuer à apprendre</h2></div></div><div className="dashboard-quick-grid">{quizzes.slice(0, 4).map(quiz => <Link key={quiz.id} to={`/quiz/${quiz.id}`}><span>{quiz.topic}</span><strong>{quiz.title}</strong><small>{quiz.questionCount ?? quiz.questions.length} questions <b aria-hidden="true">↗</b></small></Link>)}</div></section>
    </main>
  );
}
