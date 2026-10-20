import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CBadge, CFormInput } from '@coreui/react';
import { ScoreChart, formatDate } from './ProgressionPage.jsx';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';
import { useLanguage, translateTopic } from '../i18n.jsx';

const PAGE_SIZE = 6;
const DATE_RANGES = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: 'all', label: 'Tout l’historique' },
  { value: 'custom', label: 'Dates choisies' },
];

export default function TrackingPage({ quizzes, attempts }) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
  const quizzesById = new Map(quizzes.map(quiz => [quiz.id, quiz]));
  const topics = [...new Set(attempts.flatMap(attempt => {
    const quiz = quizzesById.get(attempt.quizId);
    return quiz?.topic ? [quiz.topic] : [];
  }))].sort((left, right) => left.localeCompare(right, 'fr'));
  const now = Date.now();
  const dateFilteredAttempts = attempts.filter(attempt => {
    const completedAt = Date.parse(attempt.completedAt);
    if (!Number.isFinite(completedAt)) return false;
    if (dateRange === '7' || dateRange === '30') {
      return completedAt >= now - Number(dateRange) * 24 * 60 * 60 * 1000 && completedAt <= now;
    }
    if (dateRange === 'custom') {
      if (!customFrom && !customTo) return false;
      const from = customFrom ? new Date(`${customFrom}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
      const to = customTo ? new Date(`${customTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
      return completedAt >= from && completedAt <= to;
    }
    return true;
  });
  const rangeIsInvalid = dateRange === 'custom' && customFrom && customTo && customFrom > customTo;
  const matchingAttempts = rangeIsInvalid ? [] : dateFilteredAttempts.filter(attempt => {
    const quiz = quizzesById.get(attempt.quizId);
    return quiz
      && (topicFilter === 'all' || quiz.topic === topicFilter)
      && `${quiz.title} ${quiz.topic}`.toLocaleLowerCase('fr-FR').includes(normalizedQuery);
  });
  const groupedAttempts = new Map();
  matchingAttempts.forEach(attempt => {
    const group = groupedAttempts.get(attempt.quizId) ?? [];
    group.push(attempt);
    groupedAttempts.set(attempt.quizId, group);
  });
  const filteredPlayed = [...groupedAttempts].flatMap(([quizId, quizAttempts]) => {
    const quiz = quizzesById.get(quizId);
    if (!quiz) return [];
    const points = quizAttempts
      .slice()
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      .map(attempt => ({
        date: attempt.completedAt,
        score: attempt.score,
        max: attempt.max,
        percentage: attempt.percentage,
      }));
    return [{ quiz, points, latest: points.at(-1), bestPercentage: Math.max(...points.map(point => point.percentage)) }];
  }).sort((left, right) => {
    if (sortBy === 'best') return right.bestPercentage - left.bestPercentage || right.latest.date.localeCompare(left.latest.date);
    if (sortBy === 'needs-work') return left.latest.percentage - right.latest.percentage || right.latest.date.localeCompare(left.latest.date);
    return right.latest.date.localeCompare(left.latest.date);
  });
  const pageCount = Math.max(1, Math.ceil(filteredPlayed.length / PAGE_SIZE));
  const visiblePlayed = filteredPlayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const averagePercentage = matchingAttempts.length
    ? Math.round(matchingAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / matchingAttempts.length)
    : 0;
  const hasActiveFilters = dateRange !== 'all' || topicFilter !== 'all' || sortBy !== 'recent' || Boolean(query);
  const resetFilters = () => {
    setQuery('');
    setDateRange('all');
    setTopicFilter('all');
    setSortBy('recent');
    setCustomFrom('');
    setCustomTo('');
    setPage(1);
  };

  return (
    <main className="demo-page tracking-page">
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:tracking:v1" message="Vos graphiques et historiques sont enregistrés dans ce navigateur." />
      <header className="tracking-heading">
        <div>
          <span className="eyebrow">{t('VOTRE PARCOURS')}</span>
          <h1>{t('Votre suivi')}</h1>
          <p>{t('Un aperçu rapide de vos scores, avec le détail de chaque quiz à portée de main.')}</p>
        </div>
        {attempts.length > 0 && <span className="tracking-heading-mark"><DemoIcon name="chart" /> {t('Mis à jour après chaque quiz')}</span>}
      </header>
      {attempts.length ? (
        <>
          <section className="tracking-overview" aria-label={t('Résumé de votre progression')}>
            <article><span className="eyebrow">{t('QUIZ SUIVIS')}</span><strong>{filteredPlayed.length}</strong><small>{t(filteredPlayed.length === 1 ? 'quiz avec un résultat' : 'quiz avec des résultats')}</small></article>
            <article><span className="eyebrow">{t('TENTATIVES')}</span><strong>{matchingAttempts.length}</strong><small>{t(matchingAttempts.length === 1 ? 'entraînement enregistré' : 'entraînements enregistrés')}</small></article>
            <article><span className="eyebrow">{t('SCORE MOYEN')}</span><strong>{averagePercentage}<i>%</i></strong><small>{t('sur les résultats affichés')}</small></article>
          </section>
          <section className="tracking-library" aria-label={t('Vos graphiques de progression par quiz')}>
            <div className="tracking-library-heading">
              <div><span className="eyebrow">{t('VOS QUIZ')}</span><h2>{t('Les scores, en un coup d’œil.')}</h2></div>
              <CFormInput className="tracking-search" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder={t('Rechercher un quiz…')} aria-label={t('Rechercher un quiz suivi')} />
            </div>
            <section className="tracking-filters" aria-label={t('Filtres des résultats')}>
              <div className="tracking-range-filter">
                <span className="tracking-filter-label">{t('PÉRIODE')}</span>
                <div role="group" aria-label={t('Filtrer par période')} className="tracking-range-options">
                  {DATE_RANGES.map(range => <button type="button" key={range.value} className={dateRange === range.value ? 'is-active' : ''} aria-pressed={dateRange === range.value} onClick={() => { setDateRange(range.value); setPage(1); }}>{t(range.label)}</button>)}
                </div>
              </div>
              {dateRange === 'custom' && <div className="tracking-custom-dates">
                <label>{t('Du')} <input type="date" value={customFrom} max={customTo || undefined} onChange={event => { setCustomFrom(event.target.value); setPage(1); }} /></label>
                <label>{t('Au')} <input type="date" value={customTo} min={customFrom || undefined} onChange={event => { setCustomTo(event.target.value); setPage(1); }} /></label>
              </div>}
              <div className="tracking-select-filters">
                <label>{t('Thème')}
                  <select value={topicFilter} onChange={event => { setTopicFilter(event.target.value); setPage(1); }} aria-label={t('Filtrer par thème')}>
                    <option value="all">{t('Tous les thèmes')}</option>
                    {topics.map(topic => <option key={topic} value={topic}>{translateTopic(topic, language)}</option>)}
                  </select>
                </label>
                <label>{t('Trier par')}
                  <select value={sortBy} onChange={event => { setSortBy(event.target.value); setPage(1); }} aria-label={t('Trier les quiz')}>
                    <option value="recent">{t('Activité récente')}</option>
                    <option value="best">{t('Meilleur score')}</option>
                    <option value="needs-work">{t('À retravailler')}</option>
                  </select>
                </label>
              </div>
              {hasActiveFilters && <button className="tracking-reset-filters" type="button" onClick={resetFilters}>{t('Tout réinitialiser')} <DemoIcon name="x" /></button>}
              <p className="tracking-filter-note">{t('Les scores, graphiques et totaux s’adaptent aux filtres choisis. La démo conserve jusqu’à 30 tentatives récentes.')}</p>
            </section>
            {rangeIsInvalid && <p className="tracking-date-error" role="alert">{t('La date de début doit précéder la date de fin.')}</p>}
            {visiblePlayed.length ? <div className="tracking-grid">
          {visiblePlayed.map(({ quiz, points, latest }) => {
            return (
              <article className="tracking-card" key={quiz.id}>
                <div className="tracking-card-heading">
                  <div>
                    <span className="eyebrow">{quiz.topic}</span>
                    <h2>{quiz.title}</h2>
                  </div>
                  <CBadge color="success">{latest.percentage}%</CBadge>
                </div>
                <div className="tracking-card-meta"><span>{points.length} {t(points.length === 1 ? 'tentative' : 'tentatives')}</span><span>{t('Dernière')} · {formatDate(latest.date, language)}</span></div>
                <ScoreChart points={points} mini />
                <div className="tracking-card-score"><span>{t('Dernier score')}</span><strong>{latest.score}<i>/{latest.max}</i></strong></div>
                <Link className="tracking-history-link" to={`/progression/${quiz.id}`}>
                  {t('Historique détaillé')} <DemoIcon name="arrowRight" />
                </Link>
              </article>
            );
          })}
            </div> : <div className="tracking-filter-empty"><h3>{t(rangeIsInvalid ? 'Période invalide' : dateRange === 'custom' && !customFrom && !customTo ? 'Choisissez une date' : 'Aucun résultat pour ces filtres')}</h3><p>{t(rangeIsInvalid ? 'La date de début doit précéder la date de fin.' : dateRange === 'custom' && !customFrom && !customTo ? 'Indiquez une date de début, une date de fin, ou les deux.' : 'Essayez une autre période, un autre thème ou une autre recherche.')}</p></div>}
            {pageCount > 1 && (
              <nav className="tracking-pagination" aria-label={t('Pages des graphiques de progression')}>
                <button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}><DemoIcon name="arrowLeft" /> {t('Précédent')}</button>
                <span>{t('Page')} <strong>{page}</strong> {t('sur')} {pageCount}<i> · {filteredPlayed.length} {t('quiz')}</i></span>
                <button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount}>{t('Suivant')} <DemoIcon name="arrowRight" /></button>
              </nav>
            )}
          </section>
        </>
      ) : (
        <section className="tracking-empty">
          <span className="eyebrow">{t('PREMIER PAS')}</span>
          <h2>{t('Vos graphiques commenceront après un quiz.')}</h2>
          <p>{t('Choisissez un sujet et faites une première tentative. Vos scores apparaîtront ici automatiquement.')}</p>
          <Link className="button button-dark" to="/">{t('Découvrir les quiz')} <DemoIcon name="arrowRight" /></Link>
        </section>
      )}
    </main>
  );
}
