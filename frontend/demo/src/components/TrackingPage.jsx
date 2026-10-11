import React from 'react';
import { Link } from 'react-router-dom';
import { CBadge } from '@coreui/react';
import { ScoreChart, formatDate } from './ProgressionPage.jsx';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';

export default function TrackingPage({ quizzes, attempts }) {
  const latestAttemptForQuiz = quizId => attempts
    .filter(attempt => attempt.quizId === quizId)
    .reduce((latest, attempt) => !latest || attempt.completedAt.localeCompare(latest.completedAt) > 0 ? attempt : latest, null);
  const played = quizzes
    .filter(quiz => attempts.some(attempt => attempt.quizId === quiz.id))
    .sort((left, right) => (
      (latestAttemptForQuiz(right.id)?.completedAt ?? '')
      .localeCompare(latestAttemptForQuiz(left.id)?.completedAt ?? '')
    ));

  return (
    <main className="demo-page tracking-page">
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:tracking:v1" message="Vos graphiques et historiques sont enregistrés dans ce navigateur." />
      <header className="tracking-heading">
        <span className="eyebrow">VOTRE PARCOURS</span>
        <h1>Votre suivi</h1>
        <p>Retrouvez vos résultats et l’évolution de chaque quiz au même endroit.</p>
      </header>
      {played.length ? (
        <section className="tracking-grid" aria-label="Graphiques de progression par quiz">
          {played.map(quiz => {
            const points = attempts
              .filter(attempt => attempt.quizId === quiz.id)
              .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
              .map(attempt => ({
                date: attempt.completedAt,
                score: attempt.score,
                max: attempt.max,
                percentage: attempt.percentage,
              }));
            const latest = points.at(-1);

            return (
              <article className="tracking-card" key={quiz.id}>
                <div className="tracking-card-heading">
                  <div>
                    <span className="eyebrow">{quiz.topic}</span>
                    <h2>{quiz.title}</h2>
                    <p>{points.length} tentative{points.length === 1 ? '' : 's'} · dernière le {formatDate(latest.date)}</p>
                  </div>
                  <CBadge color="success">{latest.percentage}%</CBadge>
                </div>
                <div className="tracking-card-score"><span>Dernier score</span><strong>{latest.score}/{latest.max}</strong></div>
                <ScoreChart points={points} compact />
                <Link className="tracking-history-link" to={`/progression/${quiz.id}`}>
                  Voir l’historique complet <DemoIcon name="arrowRight" />
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="tracking-empty">
          <span className="eyebrow">PREMIER PAS</span>
          <h2>Vos graphiques commenceront après un quiz.</h2>
          <p>Choisissez un sujet et faites une première tentative. Vos scores apparaîtront ici automatiquement.</p>
          <Link className="button button-dark" to="/">Découvrir les quiz <DemoIcon name="arrowRight" /></Link>
        </section>
      )}
    </main>
  );
}
