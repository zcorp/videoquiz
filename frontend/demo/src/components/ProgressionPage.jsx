import React, { useId } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CBadge } from '@coreui/react';
import { area, curveMonotoneX, line, scaleLinear } from 'd3';
import { demoQuizzes } from '../data/demoQuizzes.js';
import { getQuizProgression } from '../services/localStore.js';
import DemoIcon from './DemoIcon.jsx';

export function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function ScoreChart({ points, compact = false }) {
  const width = 720;
  const height = 280;
  const padding = { top: 24, right: 28, bottom: 42, left: 48 };
  const max = points[0]?.max || 1;
  const xScale = scaleLinear().domain([0, Math.max(points.length - 1, 1)]).range([padding.left, width - padding.right]);
  const x = index => points.length === 1 ? width / 2 : xScale(index);
  const y = scaleLinear().domain([0, max]).range([height - padding.bottom, padding.top]);
  const data = points.map((point, index) => ({ ...point, index }));
  const scoreLine = line().x(point => x(point.index)).y(point => y(point.score)).curve(curveMonotoneX);
  const scoreArea = area().x(point => x(point.index)).y0(y(0)).y1(point => y(point.score)).curve(curveMonotoneX);
  const yTickStep = Math.max(1, Math.ceil(max / 4));
  const yTicks = [...Array.from({ length: Math.ceil(max / yTickStep) }, (_, index) => index * yTickStep), max];
  const xTickStep = Math.max(1, Math.ceil((points.length - 1) / 5));
  const xTicks = [...new Set([0, ...points.map((_, index) => index).filter(index => index % xTickStep === 0), points.length - 1])];
  const gradientId = `score-area-${useId().replace(/:/g, '')}`;
  const chartBottom = height - padding.bottom;

  return (
    <div className="progression-chart-wrap">
      <svg className={`progression-chart${compact ? ' is-compact' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Évolution du score sur ${points.length} tentative${points.length === 1 ? '' : 's'}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity=".22" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map(value => <g className="chart-gridline" key={value}>
          <line x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} />
          <text x={padding.left - 12} y={y(value) + 4} textAnchor="end">{value}</text>
        </g>)}
        <path className="progression-area" d={scoreArea(data)} fill={`url(#${gradientId})`} />
        {data.length > 1 && <path className="progression-line" d={scoreLine(data)} />}
        {data.map(point => <g className="progression-point" key={`${point.date}-${point.index}`} tabIndex="0" role="img" aria-label={`Tentative ${point.index + 1} : ${point.score} sur ${point.max}, ${point.percentage} %, ${formatDate(point.date)}`}>
          <circle className="progression-point-hit" cx={x(point.index)} cy={y(point.score)} r="13" />
          <circle className="progression-point-marker" cx={x(point.index)} cy={y(point.score)} r="5.5" />
          <title>{`Tentative ${point.index + 1} · ${point.score}/${point.max} · ${point.percentage}% · ${formatDate(point.date)}`}</title>
        </g>)}
        {xTicks.map(index => <g className="chart-x-tick" key={index}>
          <line x1={x(index)} x2={x(index)} y1={chartBottom} y2={chartBottom + 5} />
          <text x={x(index)} y={height - 14} textAnchor="middle">#{index + 1}</text>
        </g>)}
        <line className="chart-axis" x1={padding.left} x2={width - padding.right} y1={chartBottom} y2={chartBottom} />
      </svg>
      <div className="progression-chart-legend"><span><i /> Score brut</span><span>{points.length} tentative{points.length === 1 ? '' : 's'} · maximum {max}</span></div>
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
      <div className="player-topline"><Link to="/" className="back-link"><DemoIcon name="arrowLeft" /> Tous les quiz</Link><span className="eyebrow">SUIVI LOCAL</span><span className="player-save-note"><DemoIcon name="circle" /> Historique sur cet appareil</span></div>
      <header className="progression-heading"><span className="eyebrow">VOTRE ÉVOLUTION</span><h1>{quiz.title}</h1><p>{points.length ? `${points.length} tentative${points.length === 1 ? '' : 's'} enregistrée${points.length === 1 ? '' : 's'} pour ce quiz.` : 'Votre progression apparaîtra après votre première tentative.'}</p></header>
      {points.length ? <>
        <section className="progression-panel" aria-labelledby="progression-chart-title">
          <div className="progression-panel-heading"><div><span className="eyebrow">COURBE DES SCORES</span><h2 id="progression-chart-title">Le score au fil des tentatives</h2></div><span className="progression-latest">Dernier score <strong>{points[points.length - 1].score}/{points[points.length - 1].max}</strong></span></div>
          <ScoreChart points={points} />
        </section>
        <section className="progression-history" aria-labelledby="progression-history-title"><div className="progression-panel-heading"><div><span className="eyebrow">HISTORIQUE</span><h2 id="progression-history-title">Toutes les tentatives</h2></div></div><div className="progression-history-list">{points.slice().reverse().map((point, index) => <article key={`${point.date}-${index}`}><CBadge className="progression-attempt-number" color="light">#{points.length - index}</CBadge><span>{formatDate(point.date)}</span><strong>{point.score}/{point.max}</strong><b>{point.percentage}%</b></article>)}</div></section>
      </> : <section className="progression-empty"><span className="eyebrow">PAS ENCORE DE SCORE</span><h2>La première tentative lancera la courbe.</h2><p>Répondez au quiz pour commencer à suivre votre évolution sur cet appareil.</p><Link className="button button-dark" to={`/quiz/${quiz.id}`}>Lancer le quiz <DemoIcon name="arrowRight" /></Link></section>}
    </main>
  );
}
