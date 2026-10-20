import React, { useId } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CBadge } from '@coreui/react';
import { area, curveMonotoneX, line, scaleLinear } from 'd3';
import { demoQuizzes } from '../data/demoQuizzes.js';
import { getQuizProgression } from '../services/localStore.js';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';
import { useLanguage } from '../i18n.jsx';

export function formatDate(value, language = 'fr') {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function ScoreChart({ points, compact = false, mini = false, attemptOffset = 0, preview = false }) {
  const { language, t } = useLanguage();
  const width = mini ? 360 : 720;
  const height = mini ? 100 : 280;
  const padding = mini ? { top: 10, right: 10, bottom: 10, left: 10 } : { top: 24, right: 28, bottom: 42, left: 48 };
  const max = points[0]?.max || 1;
  const xScale = scaleLinear().domain([0, Math.max(points.length - 1, 1)]).range([padding.left, width - padding.right]);
  const x = index => points.length === 1 ? width / 2 : xScale(index);
  const y = scaleLinear().domain([0, max]).range([height - padding.bottom, padding.top]);
  const data = points.map((point, index) => ({ ...point, index, attemptNumber: index + attemptOffset + 1 }));
  const scoreLine = line().x(point => x(point.index)).y(point => y(point.score)).curve(curveMonotoneX);
  const scoreArea = area().x(point => x(point.index)).y0(y(0)).y1(point => y(point.score)).curve(curveMonotoneX);
  const yTickStep = Math.max(1, Math.ceil(max / 4));
  const yTicks = mini ? [] : [...Array.from({ length: Math.ceil(max / yTickStep) }, (_, index) => index * yTickStep), max];
  const xTickStep = Math.max(1, Math.ceil((points.length - 1) / 5));
  const xTicks = mini ? [] : [...new Set([0, ...points.map((_, index) => index).filter(index => index % xTickStep === 0), points.length - 1])];
  const gradientId = `score-area-${useId().replace(/:/g, '')}`;
  const chartBottom = height - padding.bottom;
  const chartLabel = preview
    ? t('Exemple illustratif de progression sur {count} tentatives fictives.').replace('{count}', points.length)
    : t('Évolution du score sur {count} tentative(s).').replace('{count}', points.length);

  return (
    <div className="progression-chart-wrap">
      <svg className={`progression-chart${compact ? ' is-compact' : ''}${mini ? ' is-mini' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chartLabel}>
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
        {!mini && <path className="progression-area" d={scoreArea(data)} fill={`url(#${gradientId})`} />}
        {data.length > 1 && <path className="progression-line" d={scoreLine(data)} />}
        {data.map(point => {
          const pointLabel = preview
            ? t('Tentative fictive {number} : {score} sur {max}.').replace('{number}', point.attemptNumber).replace('{score}', point.score).replace('{max}', point.max)
            : t('Tentative {number}: {score} out of {max}, {percentage}%, {date}.').replace('{number}', point.attemptNumber).replace('{score}', point.score).replace('{max}', point.max).replace('{percentage}', point.percentage).replace('{date}', formatDate(point.date, language));
          return <g className="progression-point" key={`${point.date}-${point.index}`} tabIndex={preview ? undefined : '0'} role="img" aria-label={pointLabel}>
          <circle className="progression-point-hit" cx={x(point.index)} cy={y(point.score)} r="13" />
          <circle className="progression-point-marker" cx={x(point.index)} cy={y(point.score)} r="5.5" />
          <title>{pointLabel}</title>
        </g>;
        })}
        {xTicks.map(index => <g className="chart-x-tick" key={index}>
          <line x1={x(index)} x2={x(index)} y1={chartBottom} y2={chartBottom + 5} />
          <text x={x(index)} y={height - 14} textAnchor="middle">#{index + attemptOffset + 1}</text>
        </g>)}
        <line className="chart-axis" x1={padding.left} x2={width - padding.right} y1={chartBottom} y2={chartBottom} />
      </svg>
      {!mini && <div className="progression-chart-legend"><span><i /> {t('Score brut')}</span><span>{points.length} {t(points.length === 1 ? 'tentative' : 'tentatives')} · {t('maximum')} {max}</span></div>}
    </div>
  );
}

export default function ProgressionPage({ quizzes }) {
  const { language, t } = useLanguage();
  const { quizId } = useParams();
  const quiz = quizzes.find(item => item.id === quizId);
  const points = getQuizProgression(quizId);

  if (!quiz) return <main className="demo-page"><div className="empty-state"><span>404</span><h1>{t('Quiz introuvable')}</h1><Link className="button button-dark" to="/">{t('Revenir aux quiz')}</Link></div></main>;

  return (
    <main className="demo-page progression-page">
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:progression:v1" message={t('L’historique de ce quiz est conservé dans ce navigateur.')} />
      <header className="progression-heading"><span className="eyebrow">{t('VOTRE ÉVOLUTION')}</span><h1>{quiz.title}</h1><p>{points.length ? `${points.length} ${t('tentative')}${points.length === 1 ? '' : `s ${t('enregistrée')}`} ${t('pour ce quiz.')}` : t('Votre progression apparaîtra après votre première tentative.')}</p></header>
      {points.length ? <>
        <section className="progression-panel" aria-labelledby="progression-chart-title">
          <div className="progression-panel-heading"><div><span className="eyebrow">{t('COURBE DES SCORES')}</span><h2 id="progression-chart-title">{t('Le score au fil des tentatives')}</h2></div><span className="progression-latest">{t('Dernier score')} <strong>{points[points.length - 1].score}/{points[points.length - 1].max}</strong></span></div>
          <ScoreChart points={points} />
        </section>
        <section className="progression-history" aria-labelledby="progression-history-title"><div className="progression-panel-heading"><div><span className="eyebrow">{t('HISTORIQUE')}</span><h2 id="progression-history-title">{t('Toutes les tentatives')}</h2></div></div><div className="progression-history-list">{points.slice().reverse().map((point, index) => <article key={`${point.date}-${index}`}><CBadge className="progression-attempt-number" color="light">#{points.length - index}</CBadge><span>{formatDate(point.date, language)}</span><strong>{point.score}/{point.max}</strong><b>{point.percentage}%</b></article>)}</div></section>
      </> : <section className="progression-empty"><span className="eyebrow">{t('PAS ENCORE DE SCORE')}</span><h2>{t('La première tentative lancera la courbe.')}</h2><p>{t('Répondez au quiz pour commencer à suivre votre évolution sur cet appareil.')}</p><Link className="button button-dark" to={`/quiz/${quiz.id}`}>{t('Lancer le quiz')} <DemoIcon name="arrowRight" /></Link></section>}
    </main>
  );
}
