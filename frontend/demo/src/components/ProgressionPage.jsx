import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { demoQuizzes } from '../data/demoQuizzes.js';
import { getQuizProgression } from '../services/localStore.js';

export function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function ScoreChart({ points }) {
  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 44, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = points[0]?.max || 1;
  const x = index => padding.left + (points.length === 1 ? chartWidth / 2 : index / (points.length - 1) * chartWidth);
  const y = score => padding.top + chartHeight - score / max * chartHeight;
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.score)}`).join(' ');
  const guides = [0, Math.ceil(max / 2), max];

  return (
    <div className="progression-chart-wrap">
      <svg className="progression-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Évolution du score au fil des tentatives">
        {guides.map(value => <g key={value}><line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} /><text x={padding.left - 12} y={y(value) + 4} textAnchor="end">{value}</text></g>)}
        <line className="chart-axis" x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} />
        <line className="chart-axis" x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} />
        <path className="progression-line" d={line} />
        {points.map((point, index) => <circle key={`${point.date}-${index}`} cx={x(index)} cy={y(point.score)} r="6"><title>{`${point.score}/${point.max} · ${point.percentage}% · ${formatDate(point.date)}`}</title></circle>)}
      </svg>
      <div className="progression-chart-legend"><span><i /> Score brut</span><span>Maximum : {max}</span></div>
    </div>
  );
}

export default function ProgressionPage({ quizzes }) {
  const { quizId } = useParams();
  const quiz = quizzes.find(item => item.id === quizId);
  const points = getQuizProgression(quizId);

  if (!quiz) return <main className="demo-page"><div className="empty-state"><span>404</span><h1>Quiz introuvable</h1><Link className="button button-dark" to="/">Revenir aux quiz</Link></div></main>;

  return (
    <main className="demo-page progression-page">
      <div className="player-topline"><Link to="/" className="back-link">← Tous les quiz</Link><span className="eyebrow">SUIVI LOCAL</span><span className="player-save-note"><span aria-hidden="true">●</span> Historique sur cet appareil</span></div>
      <header className="progression-heading"><span className="eyebrow">VOTRE ÉVOLUTION</span><h1>{quiz.title}</h1><p>{points.length ? `${points.length} tentative${points.length === 1 ? '' : 's'} enregistrée${points.length === 1 ? '' : 's'} pour ce quiz.` : 'Votre progression apparaîtra après votre première tentative.'}</p></header>
      {points.length ? <>
        <section className="progression-panel" aria-labelledby="progression-chart-title">
          <div className="progression-panel-heading"><div><span className="eyebrow">COURBE DES SCORES</span><h2 id="progression-chart-title">Le score au fil des tentatives</h2></div><span className="progression-latest">Dernier score <strong>{points[points.length - 1].score}/{points[points.length - 1].max}</strong></span></div>
          <ScoreChart points={points} />
        </section>
        <section className="progression-history" aria-labelledby="progression-history-title"><div className="progression-panel-heading"><div><span className="eyebrow">HISTORIQUE</span><h2 id="progression-history-title">Toutes les tentatives</h2></div></div><div className="progression-history-list">{points.slice().reverse().map((point, index) => <article key={`${point.date}-${index}`}><span className="progression-attempt-number">#{points.length - index}</span><span>{formatDate(point.date)}</span><strong>{point.score}/{point.max}</strong><b>{point.percentage}%</b></article>)}</div></section>
      </> : <section className="progression-empty"><span className="eyebrow">PAS ENCORE DE SCORE</span><h2>La première tentative lancera la courbe.</h2><p>Répondez au quiz pour commencer à suivre votre évolution sur cet appareil.</p><Link className="button button-dark" to={`/quiz/${quiz.id}`}>Lancer le quiz <span aria-hidden="true">→</span></Link></section>}
    </main>
  );
}
