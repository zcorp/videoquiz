import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CCard, CFormInput } from '@coreui/react';
import { formatChoiceLabel, formatTime, getVideoUrl } from '../data/demoQuizzes.js';
import { getQuizCorrections, getQuizUsingVideo, saveQuizCorrection } from '../services/localStore.js';

function grade(quiz, answers, selfKeys = {}) {
  const details = quiz.questions.map(question => {
    const value = answers[question.id];
    const expected = isProgressiveMode(quiz) ? selfKeys[question.id] : question.answer;
    const correct = question.type === 'text'
      ? String(value || '').trim().toLocaleLowerCase() === String(expected || '').trim().toLocaleLowerCase()
      : question.type === 'multi_choice'
        ? sameChoices(value, expected)
        : Number(value) === expected;
    return {
      questionId: question.id,
      prompt: question.prompt,
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

function sameChoices(selected = [], correct = []) {
  if (!Array.isArray(selected) || !Array.isArray(correct)) return false;
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  return selectedSet.size === correctSet.size && [...correctSet].every(index => selectedSet.has(index));
}

function isProgressiveMode(quiz) {
  return quiz.mode === 'progressive' || quiz.mode === 'qcm';
}

export default function DemoPlayer({ quizzes, onAttempt }) {
  const { quizId } = useParams();
  const quiz = quizzes.find(item => item.id === quizId);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selfKeys, setSelfKeys] = useState(() => quiz && isProgressiveMode(quiz) ? getQuizCorrections(quiz) : {});
  const [result, setResult] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctionShown, setCorrectionShown] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const videoFrame = useRef(null);
  const questionAt = quiz?.questions[current]?.at ?? 0;
  const conflictingQuiz = quiz?.local ? getQuizUsingVideo(quiz.videoId, quizzes, quiz.id) : undefined;

  useEffect(() => {
    setCurrent(0);
    setAnswers({});
    setSelfKeys(quiz && isProgressiveMode(quiz) ? getQuizCorrections(quiz) : {});
    setResult(null);
    setReviewMode(false);
    setShowVideo(true);
    setVideoReady(false);
    setAnswerSubmitted(false);
    setCorrectionShown(false);
    setStorageWarning(false);
  }, [quizId]);

  useEffect(() => {
    if (!videoReady || !showVideo || !videoFrame.current?.contentWindow) return;
    videoFrame.current.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [questionAt, true],
    }), 'https://www.youtube-nocookie.com');
  }, [current, questionAt, showVideo, videoReady]);

  if (!quiz) return <main className="demo-page"><div className="empty-state"><span>404</span><h1>Quiz introuvable</h1><Link className="button button-dark" to="/">Revenir aux quiz</Link></div></main>;
  if (conflictingQuiz) return <main className="demo-page"><div className="empty-state"><span>VIDÉO DÉJÀ ASSOCIÉE</span><h1>Cette vidéo est déjà utilisée par « {conflictingQuiz.title} ».</h1><p>Pour conserver une seule association vidéo, choisissez une autre vidéo avant de reprendre ce quiz.</p><Link className="button button-dark" to={`/edit/${quiz.id}`}>Corriger l’association <span aria-hidden="true">→</span></Link></div></main>;
  if (quiz.draft) return <main className="demo-page"><div className="empty-state"><span>BROUILLON</span><h1>Ce quiz n’est pas encore complet.</h1><Link className="button button-dark" to={`/edit/${quiz.id}`}>Reprendre la grille</Link></div></main>;

  const question = quiz.questions[current];
  const reviewItem = result?.details[current];
  const reviewingAnswers = Boolean(result && reviewMode);
  const questionPrompt = question.prompt.trim() || `Question ${String(current + 1).padStart(2, '0')}`;
  const value = answers[question.id];
  const isAnswerFilled = question.type === 'text'
    ? Boolean(String(value || '').trim())
    : question.type === 'multi_choice'
      ? Array.isArray(value) && value.length > 0
      : value !== undefined;
  const keyValue = selfKeys[question.id];
  const isKeyFilled = question.type === 'text'
    ? Boolean(String(keyValue || '').trim())
    : question.type === 'multi_choice'
      ? Array.isArray(keyValue) && keyValue.length > 0
      : keyValue !== undefined;
  const progressive = isProgressiveMode(quiz);
  const isAnswered = progressive
    ? answerSubmitted ? isKeyFilled : isAnswerFilled
    : isAnswerFilled;
  const savedCorrectionCount = quiz.questions.filter(item => (
    item.type === 'text'
      ? Boolean(String(selfKeys[item.id] || '').trim())
      : Array.isArray(selfKeys[item.id]) && selfKeys[item.id].length > 0
  )).length;
  const finish = () => {
    const scored = grade(quiz, answers, selfKeys);
    setResult(scored);
    setReviewMode(false);
    setVideoReady(false);
    onAttempt({ quizId: quiz.id, title: quiz.title, ...scored, completedAt: new Date().toISOString() });
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
    if (quiz.exam || progressive) {
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
      <div className="player-topline"><Link to="/" className="back-link">← Tous les quiz</Link><span className="eyebrow">{quiz.topic}</span><span className="player-save-note"><span aria-hidden="true">●</span> Aucun compte · données locales</span></div>
      {!result || reviewingAnswers ? (
        <>
          <header className="player-title-row"><div><h1>{reviewingAnswers ? 'Revoir vos réponses.' : quiz.title}</h1><p>{reviewingAnswers ? 'Mode lecture : vos réponses et auto-corrections ne peuvent plus être modifiées.' : quiz.description}</p></div><span className="question-counter">{String(current + 1).padStart(2, '0')} <i>/ {String(quiz.questions.length).padStart(2, '0')}</i></span></header>
          <div className="player-grid">
            <section className="video-column" aria-label="Vidéo de cours">
              {showVideo ? <div className="video-shell"><iframe ref={videoFrame} onLoad={() => setVideoReady(true)} src={getVideoUrl(quiz.videoId, quiz.questions[0]?.at ?? 0, true)} title={`Vidéo : ${quiz.videoLabel}, à ${formatTime(question.at)}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : <div className="video-disabled"><span>Vidéo masquée</span><button className="text-action" onClick={() => setShowVideo(true)}>Afficher</button></div>}
              <div className="video-caption"><span>{reviewingAnswers ? 'REVOYEZ LES PASSAGES À VOTRE RYTHME' : 'REGARDEZ, PUIS RÉPONDEZ'}</span><button onClick={() => { if (showVideo) setVideoReady(false); setShowVideo(value => !value); }}>{showVideo ? 'Masquer la vidéo' : 'Afficher la vidéo'}</button></div>
              {(!quiz.exam && !progressive || reviewingAnswers) && <div className="chapter-list"><span className="eyebrow">LES ARRÊTS DU QUIZ</span>{quiz.questions.map((item, index) => <button key={item.id} className={`chapter-row${index === current ? ' is-current' : ''}${answers[item.id] !== undefined ? ' is-done' : ''}`} onClick={() => setCurrent(index)}><span className="chapter-time">{formatTime(item.at)}</span><span>{item.prompt}</span><i>{answers[item.id] !== undefined ? '✓' : index + 1}</i></button>)}</div>}
            </section>
            <CCard key={current} className="question-column" role="region" aria-label="Question du quiz" aria-live="polite">
              <div className="question-card-head"><span className="eyebrow">{reviewingAnswers ? `MODE LECTURE · QUESTION ${String(current + 1).padStart(2, '0')}` : `QUESTION ${String(current + 1).padStart(2, '0')}`}</span><span className={`time-chip${reviewingAnswers ? reviewItem.correct ? ' is-review-correct' : ' is-review-wrong' : ''}`}>{reviewingAnswers ? `▶ ${formatTime(question.at)} · ${reviewItem.correct ? 'Concordante' : 'À revoir'}` : `▶ ${formatTime(question.at)}`}</span></div>
              <h2>{questionPrompt}</h2>
              <p className="question-hint">{reviewingAnswers ? 'Comparez votre réponse initiale avec votre auto-correction.' : question.type === 'text' ? 'Répondez en quelques mots.' : question.type === 'multi_choice' ? 'Une ou plusieurs réponses possibles.' : 'Choisissez la réponse qui vous semble juste.'}</p>
              {progressive && question.type === 'multi_choice' ? (
                <div className="progressive-answer-grid">
                  {[{ title: 'Ma réponse', value: reviewingAnswers ? reviewItem.givenAnswer : value, onPick: selectOption, className: 'learner-grid' }, ...(answerSubmitted || reviewingAnswers ? [{ title: 'Auto-correction d’après la vidéo', value: reviewingAnswers ? reviewItem.correctAnswer : keyValue, onPick: selectSelfKey, className: 'key-grid' }] : [])].map(grid => (
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
                        return <button type="button" key={index} className={`answer-option${selected ? ' is-selected' : ''}${correct ? ' is-correct' : ''}${missed ? ' is-missed' : ''}${extra ? ' is-incorrect' : ''}`} role="checkbox" aria-checked={selected} aria-pressed={selected} disabled={reviewingAnswers || correctionShown || (grid.className === 'learner-grid' && answerSubmitted) || (grid.className === 'key-grid' && !answerSubmitted)} onClick={() => grid.onPick(index)}><span>{formatChoiceLabel(index)}</span>{option}<i>{reviewingAnswers ? (extra ? '×' : missed ? '!' : correct ? '✓' : '') : correctionShown ? (correct ? '✓' : missed || extra ? '×' : '') : selected ? '✓' : ''}</i></button>;
                      })}
                      {grid.className === 'key-grid' && !isAnswerFilled && <p className="grid-instruction">Choisissez d’abord votre réponse.</p>}
                    </div>
                  ))}
                </div>
              ) : progressive && question.type === 'text' ? (
                <div className="progressive-answer-grid">
                  <label className={`answer-field${reviewingAnswers ? reviewItem.correct ? ' is-review-correct' : ' is-review-wrong' : ''}`}><span>Ma réponse</span><CFormInput autoComplete="off" value={reviewingAnswers ? reviewItem.givenAnswer || '' : value || ''} onChange={event => setAnswers(state => ({ ...state, [question.id]: event.target.value }))} placeholder="Écrivez ce que vous retenez…" disabled={reviewingAnswers || answerSubmitted || correctionShown} /></label>
                  {(answerSubmitted || reviewingAnswers) && <label className={`answer-field${reviewingAnswers ? ' is-review-correction' : ''}`}><span>Auto-correction d’après la vidéo</span><CFormInput autoComplete="off" value={reviewingAnswers ? reviewItem.correctAnswer || '' : keyValue || ''} onChange={event => updateSelfKeyText(event.target.value)} placeholder="Complétez après avoir regardé…" disabled={reviewingAnswers || correctionShown} /></label>}
                </div>
              ) : reviewingAnswers && question.type === 'text' ? (
                <div className="progressive-answer-grid">
                  <label className={`answer-field${reviewItem.correct ? ' is-review-correct' : ' is-review-wrong'}`}><span>Ma réponse</span><CFormInput autoComplete="off" value={reviewItem.givenAnswer || ''} disabled /></label>
                  <label className="answer-field is-review-correction"><span>Réponse attendue</span><CFormInput autoComplete="off" value={String(reviewItem.correctAnswer ?? '')} disabled /></label>
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
                  return <button type="button" key={index} className={optionClass} role={question.type === 'multi_choice' ? 'checkbox' : 'radio'} aria-checked={selected} disabled><span>{formatChoiceLabel(index)}</span>{option}<i>{expected ? '✓' : selected ? '×' : ''}</i></button>;
                })}</div>
              ) : question.type === 'text' ? (
                <label className="answer-field"><span>Votre réponse</span><CFormInput autoComplete="off" value={value || ''} onChange={event => setAnswers(state => ({ ...state, [question.id]: event.target.value }))} placeholder="Écrivez votre réponse…" /></label>
              ) : (
                <div className="answer-list" role={question.type === 'multi_choice' ? 'group' : 'radiogroup'} aria-label={question.prompt}>{question.options.map((option, index) => {
                  const selected = question.type === 'multi_choice' ? (value ?? []).includes(index) : value === index;
                  const correctOption = question.type === 'multi_choice' && question.answer.includes(index);
                  const optionClass = correctionShown
                    ? `answer-option ${correctOption ? 'is-correct' : selected ? 'is-incorrect' : ''}`
                    : `answer-option${selected ? ' is-selected' : ''}`;
                  return <button type="button" key={option} className={optionClass} role={question.type === 'multi_choice' ? 'checkbox' : 'radio'} aria-checked={selected} disabled={correctionShown} onClick={() => selectOption(index)}><span>{String.fromCharCode(65 + index)}</span>{option}<i>{correctionShown ? correctOption ? '✓' : selected ? '×' : '' : selected ? '✓' : ''}</i></button>;
                })}</div>
              )}
              {reviewingAnswers ? (
                <>
                  {question.explanation && <div className={`instant-feedback${reviewItem.correct ? '' : ' is-wrong'}`}><strong>{reviewItem.correct ? 'Grilles concordantes' : 'Grilles différentes'}</strong><p>{question.explanation}</p></div>}
                  <div className="question-actions review-navigation"><button type="button" className="button button-quiet" onClick={() => setCurrent(index => Math.max(0, index - 1))} disabled={current === 0}>← Précédente</button><button type="button" className="button button-dark" onClick={() => { if (current === quiz.questions.length - 1) { setVideoReady(false); setReviewMode(false); } else setCurrent(index => index + 1); }}>{current === quiz.questions.length - 1 ? 'Retour au résultat' : 'Question suivante'} <span aria-hidden="true">→</span></button></div>
                </>
              ) : (
                <>
                  <div className="question-actions"><button className="button button-quiet" onClick={() => { if (current > 0) { setCurrent(index => index - 1); setAnswerSubmitted(false); setCorrectionShown(false); } }} disabled={quiz.exam || current === 0}>← Précédent</button><button className="button button-dark" onClick={next} disabled={!isAnswered}>{quiz.exam ? correctionShown ? current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante' : 'Voir la correction' : progressive ? !answerSubmitted ? 'Valider ma réponse' : current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante' : current === quiz.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante'} <span aria-hidden="true">→</span></button></div>
                  {progressive && <p className={`correction-save-status${storageWarning ? ' is-warning' : ''}`} aria-live="polite">{storageWarning ? 'Impossible d’enregistrer la correction dans ce navigateur.' : `Corrections mémorisées sur cet appareil : ${savedCorrectionCount}/${quiz.questions.length}.`}</p>}
                  {(quiz.exam || progressive) && <div className="exam-progress"><span>Question {current + 1} sur {quiz.questions.length}</span><span>{Object.keys(answers).filter(id => answers[id]?.length && (!progressive || selfKeys[id]?.length)).length} complétée{Object.keys(answers).filter(id => answers[id]?.length && (!progressive || selfKeys[id]?.length)).length === 1 ? '' : 's'}</span></div>}
                </>
              )}
              <div className="privacy-note"><span aria-hidden="true">⌂</span> Quiz et scores restent sur cet appareil. La vidéo est chargée depuis YouTube.</div>
            </CCard>
          </div>
        </>
      ) : (
        <section className="result-view animate-in">
          <div className="result-score"><span className="eyebrow">{quiz.exam ? 'EXAMEN BLANC' : progressive ? 'CONCORDANCE DES GRILLES' : 'VOTRE RÉSULTAT'}</span><strong>{result.score}<small>/{result.max}</small></strong><span className="result-percentage">{result.percentage}%</span><span>{progressive ? `${result.score} grilles concordantes sur ${result.max}` : `${result.score} bonne${result.score === 1 ? '' : 's'} réponse${result.score === 1 ? '' : 's'} sur ${result.max}`}</span>{quiz.exam && <b className={`pass-status ${result.passed ? 'is-pass' : 'is-fail'}`}>{result.passed ? 'Seuil atteint' : 'Encore un effort'} · {result.score}/40 (35 requis)</b>}</div>
          <div className="result-copy"><span className="eyebrow">{quiz.exam ? 'CORRECTION DES 40 QUESTIONS' : progressive ? 'AUTO-CORRECTION APRÈS VISIONNAGE' : 'ÇA SE RETIENT MIEUX EN PRATIQUANT'}</span><h1>{quiz.exam ? result.passed ? 'Reçu pour l’entraînement.' : 'À reprendre.' : progressive ? result.percentage === 100 ? 'Vos grilles concordent.' : 'Votre révision est notée.' : result.percentage === 100 ? 'Impeccable.' : result.percentage >= 50 ? 'Bien joué.' : 'Une autre passe ?'}</h1><p>{quiz.exam ? 'Le seuil d’entraînement reprend le format de l’épreuve théorique : au moins 35 bonnes réponses sur 40. Ce quiz est une révision non officielle.' : progressive ? 'Le résultat compare vos réponses initiales avec les auto-corrections déclarées d’après la vidéo. Parcourez le mode lecture pour revoir chaque passage sans modifier vos réponses.' : 'Revoir l’idée au moment où elle apparaît aide à l’ancrer. Repassez les questions ou explorez un autre sujet.'}</p><div className="result-actions">{progressive && <button className="button button-dark" onClick={() => { setCurrent(0); setReviewMode(true); }}>Revoir mes réponses <span aria-hidden="true">▶</span></button>}<button className={`button ${progressive ? 'button-quiet' : 'button-dark'}`} onClick={() => { setCurrent(0); setAnswers({}); setSelfKeys(progressive ? getQuizCorrections(quiz) : {}); setResult(null); setReviewMode(false); setAnswerSubmitted(false); setCorrectionShown(false); }}>Recommencer <span aria-hidden="true">↻</span></button><Link className="button button-quiet" to={`/progression/${quiz.id}`} aria-label={`Voir la progression de ${quiz.title}`} title="Voir la progression">↗ <span className="visually-hidden">Voir la progression</span></Link><Link className="button button-quiet" to="/">Choisir un autre quiz</Link></div></div>
          <div className="answer-review">{result.details.map((item, index) => <article key={item.questionId} className="review-row"><span className={`review-mark${item.correct ? ' correct' : ''}`}>{item.correct ? '✓' : '↻'}</span><div><span className="eyebrow">QUESTION {String(index + 1).padStart(2, '0')}</span><h3>{item.prompt}</h3>{Array.isArray(item.correctAnswer) && <p><strong>Bonne{item.correctAnswer.length === 1 ? '' : 's'} réponse{item.correctAnswer.length === 1 ? '' : 's'} :</strong> {item.correctAnswer.map(optionIndex => `${formatChoiceLabel(optionIndex)}. ${item.options[optionIndex]}`).join(' · ')}</p>}<p>{item.explanation}</p></div><strong>{item.correct ? 'Juste' : 'À revoir'}</strong></article>)}</div>
        </section>
      )}
    </main>
  );
}