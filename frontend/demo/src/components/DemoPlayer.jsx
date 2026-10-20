import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CBadge, CCard, CFormInput } from '@coreui/react';
import { formatChoiceLabel, formatTime } from '../data/demoQuizzes.js';
import { clearQuizProgress, getQuizCorrections, getQuizProgress, getQuizUsingVideo, saveQuizCorrection, saveQuizProgress } from '../services/localStore.js';
import YouTubePlayer from './YouTubePlayer.jsx';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

function grade(quiz, answers, selfKeys = {}) {
  const details = quiz.questions.map(question => {
    const value = answers[question.id];
    const expected = isProgressiveMode(quiz) ? selfKeys[question.id] : question.answer;
    const correct = hasAnswer(question, value) && hasAnswer(question, expected) && (question.type === 'text'
      ? String(value || '').trim().toLocaleLowerCase() === expected.trim().toLocaleLowerCase()
      : question.type === 'multi_choice'
        ? sameChoices(value, expected)
        : Number(value) === expected);
    return {
      questionId: question.id,
      prompt: question.prompt,
      type: question.type,
      correct,
      givenAnswer: value ?? [],
      correctAnswer: expected,
      options: question.options ?? [],
      explanation: question.explanation,
    };
  });
  const score = details.filter(item => item.correct).length;
  return {
    score,
    max: details.length,
    percentage: Math.round(score / Math.max(1, details.length) * 100),
    passed: quiz.passMark ? score >= quiz.passMark : undefined,
    passMark: quiz.passMark,
    details,
  };
}

function hasAnswer(question, value) {
  if (question.type === 'text') return typeof value === 'string' && Boolean(value.trim());
  if (question.type === 'multi_choice') {
    return Array.isArray(value)
      && value.length > 0
      && new Set(value).size === value.length
      && value.every(index => Number.isInteger(index) && index >= 0 && index < question.options.length);
  }
  return question.type === 'choice'
    && Number.isInteger(value)
    && value >= 0
    && value < question.options.length;
}

function formatReviewAnswer(value, type, options) {
  if (type === 'text') return typeof value === 'string' && value.trim() ? value : null;
  const indexes = type === 'multi_choice' ? value : Number.isInteger(value) ? [value] : [];
  if (!Array.isArray(indexes)) return null;
  return indexes
    .filter(index => Number.isInteger(index) && index >= 0 && index < options.length)
    .map(index => `${formatChoiceLabel(index)}. ${options[index]}`)
    .join(' · ') || null;
}

function sameChoices(selected = [], correct = []) {
  if (!Array.isArray(selected) || !Array.isArray(correct)) return false;
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  return selectedSet.size === selected.length
    && correctSet.size === correct.length
    && selectedSet.size === correctSet.size
    && [...correctSet].every(index => selectedSet.has(index));
}

function isProgressiveMode(quiz) {
  return quiz.mode === 'progressive' || quiz.mode === 'qcm';
}

export default function DemoPlayer({ quizzes, onAttempt, onTrack }) {
  const { t } = useLanguage();
  const { quizId } = useParams();
  const quiz = quizzes.find(item => item.id === quizId);
  const [progressLoadedQuizId, setProgressLoadedQuizId] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selfKeys, setSelfKeys] = useState(() => quiz && isProgressiveMode(quiz) ? getQuizCorrections(quiz) : {});
  const [result, setResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctionShown, setCorrectionShown] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [progressStorageWarning, setProgressStorageWarning] = useState(false);
  const [resumeActive, setResumeActive] = useState(false);
  const didComplete = useRef(false);
  const activeSession = useRef(false);
  const trackedQuizId = useRef(null);
  const questionHeading = useRef(null);
  const previousQuestion = useRef(current);
  const questionAt = quiz?.questions[current]?.at ?? 0;
  const conflictingQuiz = quiz?.local ? getQuizUsingVideo(quiz.videoId, quizzes, quiz.id) : undefined;

  useEffect(() => {
    const saved = quiz ? getQuizProgress(quiz) : null;
    setCurrent(0);
    setAnswers({});
    setSelfKeys(quiz && isProgressiveMode(quiz) ? { ...getQuizCorrections(quiz), ...(saved?.selfKeys ?? {}) } : {});
    setResult(null);
    setReviewMode(false);
    setShowVideo(true);
    setAnswerSubmitted(false);
    setCorrectionShown(false);
    setStorageWarning(false);
    setProgressStorageWarning(false);
    setCurrent(saved?.current ?? 0);
    setAnswers(saved?.answers ?? {});
    setAnswerSubmitted(saved?.answerSubmitted ?? false);
    setCorrectionShown(saved?.correctionShown ?? false);
    setResumeActive(Boolean(saved));
    didComplete.current = false;
    setProgressLoadedQuizId(quizId);
  }, [quiz, quizId]);

  useEffect(() => {
    if (progressLoadedQuizId !== quizId || !quiz || trackedQuizId.current === quizId) return;
    trackedQuizId.current = quizId;
    activeSession.current = true;
    onTrack?.(resumeActive ? 'quiz_resumed' : 'quiz_started');
  }, [onTrack, progressLoadedQuizId, quiz, quizId, resumeActive]);

  useEffect(() => () => {
    if (activeSession.current && !didComplete.current) onTrack?.('quiz_abandoned');
  }, [onTrack, quizId]);

  useEffect(() => {
    if (!quiz || progressLoadedQuizId !== quizId) return;
    if (result) {
      if (!clearQuizProgress(quiz.id)) setProgressStorageWarning(true);
      return;
    }
    if (!saveQuizProgress(quiz, { current, answers, selfKeys, answerSubmitted, correctionShown })) {
      setProgressStorageWarning(true);
    }
  }, [answerSubmitted, answers, correctionShown, current, progressLoadedQuizId, quiz, quizId, result, selfKeys]);

  useEffect(() => {
    if (previousQuestion.current !== current) questionHeading.current?.focus({ preventScroll: true });
    previousQuestion.current = current;
  }, [current]);

  if (!quiz) return <main className="demo-page"><div className="empty-state"><span>404</span><h1>{t('Quiz introuvable')}</h1><Link className="button button-dark" to="/">{t('Revenir aux quiz')}</Link></div></main>;
  if (progressLoadedQuizId !== quizId) return <main className="demo-page player-page" role="status">{t('Chargement de votre quiz…')}</main>;
  if (conflictingQuiz) return <main className="demo-page"><div className="empty-state"><span>{t('VIDÉO DÉJÀ ASSOCIÉE')}</span><h1>{t('Cette vidéo est déjà utilisée par « {title} ».').replace('{title}', conflictingQuiz.title)}</h1><p>{t('Pour conserver une seule association vidéo, choisissez une autre vidéo avant de reprendre ce quiz.')}</p><Link className="button button-dark" to={`/edit/${quiz.id}`}>{t('Corriger l’association')} <DemoIcon name="arrowRight" /></Link></div></main>;
  if (quiz.draft) return <main className="demo-page"><div className="empty-state"><span>{t('BROUILLON')}</span><h1>{t('Ce quiz n’est pas encore complet.')}</h1><Link className="button button-dark" to={`/edit/${quiz.id}`}>{t('Reprendre la grille')}</Link></div></main>;

  const question = quiz.questions[current];
  const reviewItem = result?.details[current];
  const reviewingAnswers = Boolean(result && reviewMode);
  const questionPrompt = question.prompt.trim() || `Question ${String(current + 1).padStart(2, '0')}`;
  const value = answers[question.id];
  const keyValue = selfKeys[question.id];
  const isAnswerFilled = hasAnswer(question, value);
  const isKeyFilled = hasAnswer(question, keyValue);
  const progressive = isProgressiveMode(quiz);
  const isAnswered = progressive
    ? isAnswerFilled && (!answerSubmitted || isKeyFilled)
    : isAnswerFilled;
  const savedCorrectionCount = quiz.questions.filter(item => (
    hasAnswer(item, selfKeys[item.id])
  )).length;
  const completedQuestionCount = quiz.questions.filter((item, index) => {
    if (!hasAnswer(item, answers[item.id])) return false;
    if (quiz.exam) return index < current || (index === current && correctionShown);
    if (!progressive) return true;
    return hasAnswer(item, selfKeys[item.id]) && (index !== current || answerSubmitted);
  }).length;
  const finish = () => {
    const scored = grade(quiz, answers, selfKeys);
    didComplete.current = true;
    if (!clearQuizProgress(quiz.id)) setProgressStorageWarning(true);
    setResult(scored);
    setReviewMode(false);
    onAttempt({ quizId: quiz.id, title: quiz.title, ...scored, completedAt: new Date().toISOString() });
    onTrack?.('quiz_completed');
  };
  const next = () => {
    if (progressive && !answerSubmitted) {
      setAnswerSubmitted(true);
      return;
    }
    if (quiz.exam && !correctionShown) {
      setCorrectionShown(true);
      return;
    }
    if (current === quiz.questions.length - 1) {
      finish();
      return;
    }
    setCurrent(index => index + 1);
    setAnswerSubmitted(false);
    setCorrectionShown(false);
  };
  const selectOption = index => {
    if (question.type === 'multi_choice') {
      setAnswers(state => {
        const selected = state[question.id] ?? [];
        return {
          ...state,
          [question.id]: selected.includes(index)
            ? selected.filter(item => item !== index)
            : [...selected, index].sort((left, right) => left - right),
        };
      });
      return;
    }
    setAnswers(state => ({ ...state, [question.id]: index }));
  };
  const selectSelfKey = index => {
    const selected = selfKeys[question.id] ?? [];
    const next = selected.includes(index)
      ? selected.filter(item => item !== index)
      : [...selected, index].sort((left, right) => left - right);
    const nextKeys = { ...selfKeys, [question.id]: next };
    setSelfKeys(nextKeys);
    setStorageWarning(!saveQuizCorrection(quiz, question, next));
  };
  const updateSelfKeyText = value => {
    setSelfKeys(state => ({ ...state, [question.id]: value }));
    setStorageWarning(!saveQuizCorrection(quiz, question, value));
  };
  return (
    <main className={`demo-page player-page${result ? ' has-result' : ''}`}>
      <div className="player-topline"><span className="eyebrow">{quiz.topic}</span><span className="player-save-note"><DemoIcon name="circle" /> {t('Aucun compte · données locales')}</span></div>
      {resumeActive && !result && <div className="quiz-resume-notice" role="status"><span>{t('Reprise de votre quiz à la question {current} sur {total}.').replace('{current}', current + 1).replace('{total}', quiz.questions.length)}</span><button type="button" className="text-action" onClick={() => {
        if (!clearQuizProgress(quiz.id)) setProgressStorageWarning(true);
        setCurrent(0);
        setAnswers({});
        setSelfKeys(progressive ? getQuizCorrections(quiz) : {});
        setAnswerSubmitted(false);
        setCorrectionShown(false);
        setResumeActive(false);
        onTrack?.('quiz_restarted');
      }}>{t('Recommencer')}</button></div>}
      {!result || reviewingAnswers ? (
        <>
          <header className="player-title-row"><div><h1>{reviewingAnswers ? t('Revoir vos réponses.') : quiz.title}</h1><p>{reviewingAnswers ? t('Mode lecture : vos réponses et auto-corrections ne peuvent plus être modifiées.') : quiz.description}</p></div><CBadge className="question-counter" color="success">{String(current + 1).padStart(2, '0')} <span>/ {String(quiz.questions.length).padStart(2, '0')}</span></CBadge></header>
          <div className="player-grid">
            <section className="video-column" aria-label={t('Vidéo de cours')}>
              {showVideo ? <div className="video-shell"><YouTubePlayer key={quiz.videoId} videoId={quiz.videoId} startAt={questionAt} title={`${t('Vidéo :')} ${quiz.videoLabel}, ${t('à')} ${formatTime(question.at)}`} /></div> : <div className="video-disabled"><span>{t('Vidéo masquée')}</span><button className="text-action" onClick={() => setShowVideo(true)}>{t('Afficher')}</button></div>}
              <div className="video-caption"><span>{reviewingAnswers ? t('REVOYEZ LES PASSAGES À VOTRE RYTHME') : t('REGARDEZ, PUIS RÉPONDEZ')}</span><button onClick={() => setShowVideo(value => !value)}>{t(showVideo ? 'Masquer la vidéo' : 'Afficher la vidéo')}</button></div>
              {(!quiz.exam && !progressive || reviewingAnswers) && <div className="chapter-list"><span className="eyebrow">LES ARRÊTS DU QUIZ</span>{quiz.questions.map((item, index) => {
                const answered = hasAnswer(item, answers[item.id]);
                return <button key={item.id} className={`chapter-row${index === current ? ' is-current' : ''}${answered ? ' is-done' : ''}`} onClick={() => setCurrent(index)}><span className="chapter-time">{formatTime(item.at)}</span><span>{item.prompt}</span><i>{answered ? <DemoIcon name="check" /> : index + 1}</i></button>;
              })}</div>}
            </section>
            <CCard key={current} className="question-column" role="region" aria-labelledby="quiz-question-title" aria-live="polite">
              <div className="question-card-head"><span className="eyebrow">{reviewingAnswers ? `${t('MODE LECTURE · QUESTION')} ${String(current + 1).padStart(2, '0')}` : `${t('QUESTION')} ${String(current + 1).padStart(2, '0')}`}</span><span className={`time-chip${reviewingAnswers ? reviewItem.correct ? ' is-review-correct' : ' is-review-wrong' : ''}`}><DemoIcon name="mediaPlay" /> {formatTime(question.at)}{reviewingAnswers && <> · {t(reviewItem.correct ? 'Concordante' : 'À revoir')}</>}</span></div>
              <h2 ref={questionHeading} id="quiz-question-title" tabIndex={-1}>{questionPrompt}</h2>
              <p className="question-hint">{reviewingAnswers ? t('Comparez votre réponse initiale avec votre auto-correction.') : question.type === 'text' ? t('Répondez en quelques mots.') : question.type === 'multi_choice' ? t('Une ou plusieurs réponses possibles.') : t('Choisissez la réponse qui vous semble juste.')}</p>
              {progressive && question.type === 'multi_choice' ? (
                <div className="progressive-answer-grid">
                  {[{ title: t('Ma réponse'), value: reviewingAnswers ? reviewItem.givenAnswer : value, onPick: selectOption, className: 'learner-grid' }, ...(answerSubmitted || reviewingAnswers ? [{ title: t('Auto-correction d’après la vidéo'), value: reviewingAnswers ? reviewItem.correctAnswer : keyValue, onPick: selectSelfKey, className: 'key-grid' }] : [])].map(grid => (
                    <div className={`progressive-grid ${grid.className}`} key={grid.className} role="group" aria-label={grid.title}>
                      <h3>{grid.title}</h3>
                      {question.options.map((option, index) => {
                        const selected = (grid.value ?? []).includes(index);
                        const expected = reviewingAnswers ? reviewItem.correctAnswer ?? [] : keyValue ?? [];
                        const correct = reviewingAnswers
                          ? grid.className === 'key-grid' ? selected : selected && expected.includes(index)
                          : grid.className === 'key-grid' && correctionShown && selected;
                        const missed = reviewingAnswers && grid.className === 'key-grid' && selected && !(reviewItem.givenAnswer ?? []).includes(index);
                        const extra = reviewingAnswers
                          ? grid.className === 'learner-grid' && selected && !expected.includes(index)
                          : grid.className === 'learner-grid' && correctionShown && selected && !expected.includes(index);
                        const mark = reviewingAnswers ? extra ? 'wrong' : missed || correct ? 'correct' : '' : correctionShown ? correct ? 'correct' : missed || extra ? 'wrong' : '' : selected ? 'correct' : '';
                        return <button type="button" key={index} className={`answer-option${selected ? ' is-selected' : ''}${correct ? ' is-correct' : ''}${missed ? ' is-missed' : ''}${extra ? ' is-incorrect' : ''}`} role="checkbox" aria-checked={selected} aria-pressed={selected} disabled={reviewingAnswers || correctionShown || (grid.className === 'learner-grid' && answerSubmitted) || (grid.className === 'key-grid' && !answerSubmitted)} onClick={() => grid.onPick(index)}><span>{formatChoiceLabel(index)}</span>{option}<i>{mark && <DemoIcon name={mark === 'correct' ? 'check' : 'x'} />}</i></button>;
                      })}
                      {grid.className === 'key-grid' && !isAnswerFilled && <p className="grid-instruction">{t('Choisissez d’abord votre réponse.')}</p>}
                    </div>
                  ))}
                </div>
              ) : progressive && question.type === 'text' ? (
                <div className="progressive-answer-grid">
                  <label className={`answer-field${reviewingAnswers ? reviewItem.correct ? ' is-review-correct' : ' is-review-wrong' : ''}`}><span>{t('Ma réponse')}</span><CFormInput autoComplete="off" value={reviewingAnswers ? reviewItem.givenAnswer || '' : value || ''} onChange={event => setAnswers(state => ({ ...state, [question.id]: event.target.value }))} placeholder={t('Écrivez ce que vous retenez…')} disabled={reviewingAnswers || answerSubmitted || correctionShown} /></label>
                  {(answerSubmitted || reviewingAnswers) && <label className={`answer-field${reviewingAnswers ? ' is-review-correction' : ''}`}><span>{t('Auto-correction d’après la vidéo')}</span><CFormInput autoComplete="off" value={reviewingAnswers ? reviewItem.correctAnswer || '' : keyValue || ''} onChange={event => updateSelfKeyText(event.target.value)} placeholder={t('Complétez après avoir regardé…')} disabled={reviewingAnswers || correctionShown} /></label>}
                </div>
              ) : reviewingAnswers && question.type === 'text' ? (
                <div className="progressive-answer-grid">
                  <label className={`answer-field${reviewItem.correct ? ' is-review-correct' : ' is-review-wrong'}`}><span>{t('Ma réponse')}</span><CFormInput autoComplete="off" value={reviewItem.givenAnswer || ''} disabled /></label>
                  <label className="answer-field is-review-correction"><span>{t('Réponse attendue')}</span><CFormInput autoComplete="off" value={String(reviewItem.correctAnswer ?? '')} disabled /></label>
                </div>
              ) : reviewingAnswers ? (
                <div className="answer-list" role={question.type === 'multi_choice' ? 'group' : 'radiogroup'} aria-label={question.prompt}>{question.options.map((option, index) => {
                  const selected = question.type === 'multi_choice'
                    ? (reviewItem.givenAnswer ?? []).includes(index)
                    : reviewItem.givenAnswer === index;
                  const expected = question.type === 'multi_choice'
                    ? (reviewItem.correctAnswer ?? []).includes(index)
                    : reviewItem.correctAnswer === index;
                  const optionClass = expected
                    ? `answer-option is-correct${selected ? ' is-selected' : ''}`
                    : selected ? 'answer-option is-incorrect is-selected' : 'answer-option';
                  return <button type="button" key={index} className={optionClass} role={question.type === 'multi_choice' ? 'checkbox' : 'radio'} aria-checked={selected} disabled><span>{formatChoiceLabel(index)}</span>{option}<i>{expected ? <DemoIcon name="check" /> : selected ? <DemoIcon name="x" /> : null}</i></button>;
                })}</div>
              ) : question.type === 'text' ? (
                <label className="answer-field"><span>{t('Votre réponse')}</span><CFormInput autoComplete="off" value={value || ''} onChange={event => setAnswers(state => ({ ...state, [question.id]: event.target.value }))} placeholder={t('Écrivez votre réponse…')} /></label>
              ) : (
                <div className="answer-list" role={question.type === 'multi_choice' ? 'group' : 'radiogroup'} aria-label={question.prompt}>{question.options.map((option, index) => {
                  const selected = question.type === 'multi_choice' ? (value ?? []).includes(index) : value === index;
                  const correctOption = question.type === 'multi_choice' && question.answer.includes(index);
                  const optionClass = correctionShown
                    ? `answer-option ${correctOption ? 'is-correct' : selected ? 'is-incorrect' : ''}`
                    : `answer-option${selected ? ' is-selected' : ''}`;
                  const mark = correctionShown ? correctOption ? 'correct' : selected ? 'wrong' : '' : selected ? 'correct' : '';
                  return <button type="button" key={option} className={optionClass} role={question.type === 'multi_choice' ? 'checkbox' : 'radio'} aria-checked={selected} disabled={correctionShown} onClick={() => selectOption(index)}><span>{String.fromCharCode(65 + index)}</span>{option}<i>{mark && <DemoIcon name={mark === 'correct' ? 'check' : 'x'} />}</i></button>;
                })}</div>
              )}
              {reviewingAnswers ? (
                <>
                  {question.explanation && <div className={`instant-feedback${reviewItem.correct ? '' : ' is-wrong'}`}><strong>{t(reviewItem.correct ? 'Grilles concordantes' : 'Grilles différentes')}</strong><p>{question.explanation}</p></div>}
                  <div className="question-actions review-navigation"><button type="button" className="button button-quiet" onClick={() => setCurrent(index => Math.max(0, index - 1))} disabled={current === 0}><DemoIcon name="arrowLeft" /> {t('Précédente')}</button><button type="button" className="button button-dark" onClick={() => { if (current === quiz.questions.length - 1) setReviewMode(false); else setCurrent(index => index + 1); }}>{t(current === quiz.questions.length - 1 ? 'Retour au résultat' : 'Question suivante')} <DemoIcon name="arrowRight" /></button></div>
                </>
              ) : (
                <>
                  <div className="question-actions"><button className="button button-quiet" onClick={() => { if (current > 0) { setCurrent(index => index - 1); setAnswerSubmitted(false); setCorrectionShown(false); } }} disabled={quiz.exam || current === 0}><DemoIcon name="arrowLeft" /> {t('Précédent')}</button><button className="button button-dark" onClick={next} disabled={!isAnswered}>{t(quiz.exam ? correctionShown ? current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante' : 'Voir la correction' : progressive ? !answerSubmitted ? 'Valider ma réponse' : current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante' : current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante')} <DemoIcon name="arrowRight" /></button></div>
                  {progressive && <p className={`correction-save-status${storageWarning ? ' is-warning' : ''}`} aria-live="polite">{storageWarning ? t('Impossible d’enregistrer la correction dans ce navigateur.') : t('Corrections mémorisées sur cet appareil : {saved}/{total}.').replace('{saved}', savedCorrectionCount).replace('{total}', quiz.questions.length)}</p>}
                  {(quiz.exam || progressive) && <div className="exam-progress"><span>{t('Question')} <strong>{current + 1} / {quiz.questions.length}</strong></span><span><strong>{completedQuestionCount}</strong> {t(completedQuestionCount === 1 ? 'complétée' : 'complétées')}</span></div>}
                </>
              )}
              <div className="privacy-note"><DemoIcon name="home" /> {t('Quiz et scores restent sur cet appareil. La vidéo est chargée depuis YouTube.')}</div>
              {progressStorageWarning && <p className="backup-status is-error" role="alert">{t('Impossible d’enregistrer la reprise de votre quiz dans ce navigateur.')}</p>}
            </CCard>
          </div>
        </>
      ) : (
        <section className="result-view animate-in">
          <div className="result-score"><span className="eyebrow">{t(quiz.exam ? 'EXAMEN BLANC' : progressive ? 'CONCORDANCE DES GRILLES' : 'VOTRE RÉSULTAT')}</span><strong>{result.score}<small>/{result.max}</small></strong><span className="result-percentage">{result.percentage}%</span><span>{progressive ? t('{score} concordant grids out of {max}.').replace('{score}', result.score).replace('{max}', result.max) : t('{score} correct answers out of {max}.').replace('{score}', result.score).replace('{max}', result.max)}</span>{quiz.exam && <b className={`pass-status ${result.passed ? 'is-pass' : 'is-fail'}`}>{t(result.passed ? 'Seuil atteint' : 'Encore un effort')} · {result.score}/40 {t('(35 requis)')}</b>}</div>
          <div className="result-copy"><span className="eyebrow">{t(quiz.exam ? 'CORRECTION DES 40 QUESTIONS' : progressive ? 'AUTO-CORRECTION APRÈS VISIONNAGE' : 'ÇA SE RETIENT MIEUX EN PRATIQUANT')}</span><h1>{t(quiz.exam ? result.passed ? 'Reçu pour l’entraînement.' : 'À reprendre.' : progressive ? result.percentage === 100 ? 'Vos grilles concordent.' : 'Votre révision est notée.' : result.percentage === 100 ? 'Impeccable.' : result.percentage >= 50 ? 'Bien joué.' : 'Une autre passe ?')}</h1><p>{t(quiz.exam ? 'Le seuil d’entraînement reprend le format de l’épreuve théorique : au moins 35 bonnes réponses sur 40. Ce quiz est une révision non officielle.' : progressive ? 'Le résultat compare vos réponses initiales avec les auto-corrections déclarées d’après la vidéo. Parcourez le mode lecture pour revoir chaque passage sans modifier vos réponses.' : 'Revoir l’idée au moment où elle apparaît aide à l’ancrer. Repassez les questions ou explorez un autre sujet.')}</p><div className="result-actions">{progressive && <button className="button button-dark" onClick={() => { setCurrent(0); setReviewMode(true); onTrack?.('quiz_review_opened'); }}>{t('Revoir mes réponses')} <DemoIcon name="mediaPlay" /></button>}<button className={`button ${progressive ? 'button-quiet' : 'button-dark'}`} onClick={() => { if (!clearQuizProgress(quiz.id)) setProgressStorageWarning(true); didComplete.current = false; setCurrent(0); setAnswers({}); setSelfKeys(progressive ? getQuizCorrections(quiz) : {}); setResult(null); setReviewMode(false); setAnswerSubmitted(false); setCorrectionShown(false); setResumeActive(false); onTrack?.('quiz_restarted'); }}>{t('Recommencer')} <DemoIcon name="reload" /></button><Link className="button button-quiet" to={`/progression/${quiz.id}`} aria-label={`${t('Voir la progression de')} ${quiz.title}`} title={t('Voir la progression')}><DemoIcon name="externalLink" /> <span className="visually-hidden">{t('Voir la progression')}</span></Link><Link className="button button-quiet" to="/">{t('Choisir un autre quiz')}</Link></div></div>
          <div className="answer-review">{result.details.map((item, index) => {
            const givenAnswer = formatReviewAnswer(item.givenAnswer, item.type, item.options);
            const expectedAnswer = formatReviewAnswer(item.correctAnswer, item.type, item.options);
            return <article key={item.questionId} className="review-row">
              <span className={`review-mark${item.correct ? ' correct' : ''}`}><DemoIcon name={item.correct ? 'check' : 'reload'} /></span>
              <div>
                <span className="eyebrow">{t('QUESTION')} {String(index + 1).padStart(2, '0')}</span>
                <h3>{item.prompt}</h3>
                <div className="review-answers">
                  <div className="review-answer"><strong>{t('Votre réponse')}</strong><span>{givenAnswer ?? t('Aucune réponse saisie')}</span></div>
                  <div className="review-answer"><strong>{t(progressive ? 'Auto-correction d’après la vidéo' : 'Réponse attendue')}</strong><span>{expectedAnswer ?? t('Non disponible')}</span></div>
                </div>
                {item.explanation && <p>{item.explanation}</p>}
              </div>
              <strong>{t(item.correct ? 'Juste' : 'À revoir')}</strong>
            </article>;
          })}</div>
        </section>
      )}
    </main>
  );
}