import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CAlert, CBadge, CButton, CCard, CFormInput, CFormSelect, CFormTextarea } from '@coreui/react';
import { formatChoiceLabel } from '../data/demoQuizzes.js';
import { getApprovedPreparedQuiz } from '../data/preparedQuizzes/catalog.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import { getQuizVideo, getVideoPageUrl, getVideoProviderLabel, getVideoReference } from '../services/video.js';
import DemoIcon from './DemoIcon.jsx';
import FirstVisitNotice from './FirstVisitNotice.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import VideoThumbnail from './VideoThumbnail.jsx';
import { useLanguage } from '../i18n.jsx';

function createId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function emptyQuestion(mode = 'prepared') {
  return { id: createId(), prompt: '', at: 0, type: isProgressiveMode(mode) ? 'multi_choice' : 'choice', options: ['', ''], answer: null, explanation: '' };
}

function isProgressiveMode(mode) {
  return mode === 'progressive' || mode === 'qcm';
}

function resizeQuestions(items, count, mode, optionCount) {
  const resized = items.slice(0, count);
  while (resized.length < count) resized.push({ ...emptyQuestion(mode), options: Array(optionCount).fill('') });
  return resized.map(item => isProgressiveMode(mode)
    ? { ...item, type: 'multi_choice', answer: undefined, options: Array.from({ length: optionCount }, (_, index) => item.options?.[index] ?? '') }
    : item);
}

function toSeconds(value) {
  const parts = value.split(':').map(Number);
  if (parts.some(part => !Number.isFinite(part))) return 0;
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] || 0;
}

function toTimestamp(seconds) {
  const safe = Math.round(Math.max(0, Number(seconds) || 0) * 10) / 10;
  const minutes = Math.floor(safe / 60);
  const secondsPart = (safe - minutes * 60).toString().padStart(2, '0');
  return `${minutes}:${secondsPart}`;
}

function hasValidPreparedAnswer(question) {
  if (question.type === 'text') return typeof question.answer === 'string' && Boolean(question.answer.trim());
  if (question.type === 'multi_choice') {
    return Array.isArray(question.answer)
      && question.answer.length > 0
      && new Set(question.answer).size === question.answer.length
      && question.answer.every(index => Number.isInteger(index) && index >= 0 && index < question.options.length && question.options[index].trim());
  }
  return Number.isInteger(question.answer)
    && question.answer >= 0
    && question.answer < question.options.length
    && Boolean(question.options[question.answer]?.trim());
}

export default function DemoEditor({ quiz, quizzes = [], onSave }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkedVideoId = !quiz ? searchParams.get('video') ?? '' : '';
  const linkedVideoTitle = !quiz ? searchParams.get('title') ?? '' : '';
  const preparedQuiz = !quiz
    ? getApprovedPreparedQuiz(searchParams.get('prepared'), linkedVideoId)
    : null;
  const linkedTopic = quiz?.topic ?? preparedQuiz?.topic ?? searchParams.get('topic') ?? 'CRÉÉ ICI';
  const isRoadCodeTopic = linkedTopic.toLocaleUpperCase('fr-FR').includes('CODE DE LA ROUTE');
  const isNewRoadCodeQuiz = !quiz && isRoadCodeTopic;
  const initialMode = quiz?.mode ?? (preparedQuiz ? 'prepared' : searchParams.get('mode') === 'qcm' && linkedVideoId ? 'qcm' : 'prepared');
  const initialQuestionCount = quiz?.questionCount ?? (preparedQuiz
    ? preparedQuiz.questions.length
    : isProgressiveMode(initialMode) ? quiz?.questions?.length ?? (isRoadCodeTopic ? 40 : 5) : 40);
  const initialMaxOptions = quiz?.maxOptions ?? 4;
  const [title, setTitle] = useState(() => quiz?.title ?? preparedQuiz?.title ?? linkedVideoTitle.slice(0, 90));
  const [description, setDescription] = useState(() => quiz?.description ?? preparedQuiz?.description ?? '');
  const [showSelectedVideoPreview, setShowSelectedVideoPreview] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => quiz
    ? getVideoPageUrl(getQuizVideo(quiz))
    : preparedQuiz?.videoId || linkedVideoId
      ? getVideoPageUrl({ provider: 'youtube', id: preparedQuiz?.videoId ?? linkedVideoId })
      : '');
  const [mode, setMode] = useState(initialMode);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [maxOptions, setMaxOptions] = useState(initialMaxOptions);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [step, setStep] = useState(() => quiz || preparedQuiz || (linkedVideoId && linkedVideoTitle) ? 2 : 1);
  const initialQuestions = quiz?.questions ?? preparedQuiz?.questions;
  const [questions, setQuestions] = useState(() => initialQuestions?.map(item => ({
    ...item,
    id: quiz ? item.id : createId(),
    options: isProgressiveMode(quiz?.mode)
      ? Array.from({ length: initialMaxOptions }, (_, index) => item.options?.[index] ?? '')
      : item.options ?? ['', ''],
  })) ?? Array.from({ length: isProgressiveMode(initialMode) ? initialQuestionCount : 1 }, () => ({
    ...emptyQuestion(initialMode),
    options: Array(isProgressiveMode(initialMode) ? initialMaxOptions : 2).fill(''),
  })));
  const [error, setError] = useState('');
  const video = getVideoReference(videoUrl);
  const conflictingQuiz = getQuizUsingVideo(video, quizzes, quiz?.id);

  const updateQuestion = (id, patch) => setQuestions(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const updateAnswerOption = (item, optionIndex, value) => {
    const options = [...item.options];
    options[optionIndex] = value;
    const answer = item.type === 'multi_choice'
      ? (Array.isArray(item.answer) ? item.answer : []).filter(index => index !== optionIndex || value.trim())
      : item.answer === optionIndex && !value.trim() ? null : item.answer;
    updateQuestion(item.id, { options, answer });
  };
  const addAnswerOption = item => {
    if (item.options.length >= 4) return;
    updateQuestion(item.id, { options: [...item.options, ''] });
  };
  const removeAnswerOption = (item, optionIndex) => {
    if (item.options.length <= 2) return;
    const options = item.options.filter((_, index) => index !== optionIndex);
    const answer = item.type === 'multi_choice'
      ? (Array.isArray(item.answer) ? item.answer : [])
        .filter(index => index !== optionIndex)
        .map(index => index > optionIndex ? index - 1 : index)
      : !Number.isInteger(item.answer) || item.answer === optionIndex
        ? null
        : item.answer > optionIndex ? item.answer - 1 : item.answer;
    updateQuestion(item.id, { options, answer });
  };
  const scrollToQuestion = index => document.getElementById(`progressive-question-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const progressive = isProgressiveMode(mode);
  const completeQuestion = item => mode === 'qcm' || Boolean(item?.prompt.trim() && item.options.filter(option => option.trim()).length >= 2 && item.options.filter(option => option.trim()).length <= maxOptions);
  const completeCount = progressive ? questions.filter(completeQuestion).length : questions.length;
  const readyToPlay = !progressive || questions.length === questionCount && questions.every(completeQuestion);
  const validateVideoStep = () => {
    if (!title.trim()) {
      setError(t('Donnez un titre à votre quiz.'));
      return false;
    }
    if (!video) {
      setError(t('Collez un lien vidéo valide.'));
      return false;
    }
    if (conflictingQuiz) {
      setError(t('Cette vidéo est déjà associée au quiz « {title} ». Ouvrez-le pour le modifier ou choisissez une autre vidéo.').replace('{title}', conflictingQuiz.title));
      return false;
    }
    return true;
  };
  const continueToQuestions = () => {
    if (!validateVideoStep()) return;
    setError('');
    setStep(2);
  };
  const handleSubmit = event => {
    if (step === 1) {
      event.preventDefault();
      continueToQuestions();
      return;
    }
    save(event);
  };
  const selectProgressiveQuestion = index => {
    setActiveQuestion(index);
    requestAnimationFrame(() => scrollToQuestion(index));
  };
  const selectQuestion = index => {
    const boundedIndex = Math.max(0, Math.min(index, questions.length - 1));
    setActiveQuestion(boundedIndex);
  };
  const removeQuestion = id => {
    const index = questions.findIndex(item => item.id === id);
    setQuestions(items => items.filter(item => item.id !== id));
    if (index <= activeQuestion) setActiveQuestion(current => Math.max(0, current - 1));
  };
  const save = event => {
    event.preventDefault();
    if (!validateVideoStep()) return;
    if (progressive && (!Number.isSafeInteger(questionCount) || questionCount < 1 || !Number.isSafeInteger(maxOptions) || maxOptions < 2 || isNewRoadCodeQuiz && maxOptions > 4)) return setError(t(isNewRoadCodeQuiz ? 'Choisissez un nombre entier valide de questions et de 2 à 4 options.' : 'Choisissez un nombre entier valide de questions et au moins deux options.'));
    if (mode === 'prepared' && questions.length === 0) return setError(t('Ajoutez au moins une question au quiz.'));
    if (mode === 'prepared' && !questions.every(item => item.prompt.trim() && (item.type === 'text' || item.options.filter(option => option.trim()).length >= 2 && item.options.filter(option => option.trim()).length <= 4) && hasValidPreparedAnswer(item))) return setError(t('Complétez les questions avec 2 à 4 choix de réponse.'));
    const nextQuiz = {
      id: quiz?.id ?? `local-${createId()}`,
      title: title.trim(), description: description.trim() || t('Un quiz vidéo créé dans votre navigateur.'),
      topic: linkedTopic,
      videoId: video.id,
      videoProvider: video.provider,
      ...(video.hash ? { videoHash: video.hash } : {}),
      videoLabel: title.trim(),
      local: true,
      mode, questionCount: progressive ? questionCount : questions.length,
      maxOptions: progressive ? maxOptions : undefined,
      draft: progressive && !readyToPlay,
      questions: questions.map(item => {
        const originalIndexes = item.options.map((option, index) => option.trim() ? index : -1).filter(index => index >= 0);
        const options = originalIndexes.map(index => item.options[index]);
        return {
          ...item,
          prompt: item.prompt.trim(),
          type: progressive ? 'multi_choice' : item.type,
          options: item.type === 'text' ? undefined : progressive
            ? mode === 'qcm' ? Array.from({ length: maxOptions }, (_, index) => item.options[index] ?? '') : readyToPlay ? item.options.filter(option => option.trim()) : Array.from({ length: maxOptions }, (_, index) => item.options[index] ?? '')
            : options,
          answer: progressive ? undefined : item.type === 'text'
            ? item.answer.trim()
            : item.type === 'multi_choice'
              ? Array.isArray(item.answer) ? item.answer.map(index => originalIndexes.indexOf(index)).filter(index => index >= 0) : []
              : Number.isInteger(item.answer) ? originalIndexes.indexOf(item.answer) : null,
        };
      }),
    };
    const saveResult = onSave(nextQuiz);
    if (!saveResult?.saved) {
      if (saveResult?.conflict) return setError(t('Cette vidéo est déjà associée au quiz « {title} ». Ouvrez-le pour le modifier ou choisissez une autre vidéo.').replace('{title}', saveResult.conflict.title));
      return setError(t('Le navigateur n’a pas pu enregistrer ce quiz. Vérifiez l’espace de stockage disponible.'));
    }
    navigate(nextQuiz.draft ? '/' : `/quiz/${nextQuiz.id}`);
  };

  const switchMode = nextMode => {
    setMode(nextMode);
    if (isProgressiveMode(nextMode)) {
      const count = isProgressiveMode(quiz?.mode) ? questionCount : isRoadCodeTopic ? 40 : 5;
      setQuestionCount(count);
      setQuestions(items => resizeQuestions(items, count, nextMode, maxOptions));
      setActiveQuestion(0);
    } else {
      const preparedQuestions = questions
        .filter(item => item.prompt.trim() || item.options.some(option => option.trim()))
        .map(item => ({ ...item, type: 'choice', answer: null }));
      const nextQuestions = preparedQuestions.length > 0 ? preparedQuestions : [emptyQuestion(nextMode)];
      setQuestions(nextQuestions);
      setQuestionCount(nextQuestions.length);
      setActiveQuestion(0);
    }
  };
  const changeQuestionCount = count => {
    const parsed = Number(count);
    if (!Number.isSafeInteger(parsed) || parsed < 1) return;
    const nextCount = parsed;
    if (nextCount < questions.length && questions.slice(nextCount).some(item => item.prompt.trim() || item.options.some(option => option.trim()))) {
      if (!window.confirm(t('Réduire la grille à {count} questions supprimera les réponses saisies après la question {count}. Continuer ?').replaceAll('{count}', nextCount))) return;
    }
    setQuestionCount(nextCount);
    setQuestions(items => resizeQuestions(items, nextCount, mode, maxOptions));
    setActiveQuestion(index => Math.min(index, nextCount - 1));
  };
  const changeMaxOptions = value => {
    const nextMax = Number(value);
    if (!Number.isSafeInteger(nextMax) || nextMax < 2 || isNewRoadCodeQuiz && nextMax > 4) return;
    const hasDiscardedChoices = questions.some(item => item.options.slice(nextMax).some(option => option.trim()));
    if (nextMax < maxOptions && hasDiscardedChoices && !window.confirm(t('Réduire à {count} choix supprimera les options déjà saisies après le choix {count}. Continuer ?').replaceAll('{count}', nextMax))) return;
    setMaxOptions(nextMax);
    setQuestions(items => items.map(item => ({ ...item, options: Array.from({ length: nextMax }, (_, index) => item.options[index] ?? '') })));
  };

  return (
    <main className="demo-page editor-page">
      <FirstVisitNotice storageKey="videoquiz-demo:first-visit:editor:v1" message="Vos quiz créés sont enregistrés dans ce navigateur." />
      <div className="editor-heading"><span className="eyebrow">{t('CRÉATEUR DE QUIZ')}</span><h1>{t(quiz ? 'Affinez votre quiz.' : 'Créer un quiz')}</h1><p>{t(step === 1 ? 'Étape 1 sur 2 · Choisissez une vidéo.' : 'Étape 2 sur 2 · Ajoutez vos questions.')}</p></div>
      {preparedQuiz && <CAlert color="info" className="prepared-quiz-note">{t('Quiz préparé et vérifié avant publication. Vous pouvez adapter les questions avant de l’enregistrer.')}</CAlert>}
      <div className="editor-steps" aria-label={t('Étapes de création')}>
        <span className={step === 1 ? 'is-active' : 'is-complete'} aria-current={step === 1 ? 'step' : undefined}><b>1</b>{t('Vidéo')}</span>
        <span className={step === 2 ? 'is-active' : ''} aria-current={step === 2 ? 'step' : undefined}><b>2</b>{t('Questions')}</span>
      </div>
      <form className="editor-form" onSubmit={handleSubmit}>
        {step === 1 ? <CCard className="editor-section" role="group">
          <div className="editor-section-title"><CBadge className="editor-section-number" color="success">01</CBadge><div><h2>{t('Choisissez une vidéo')}</h2><p>{t('Collez son lien et donnez un nom à votre quiz.')}</p></div></div>
          <div className="editor-fields">
            <label className="answer-field"><span>{t('Lien de la vidéo')}</span><CFormInput value={videoUrl} onChange={event => { setVideoUrl(event.target.value); setError(''); }} placeholder="YouTube, Vimeo, Dailymotion, RUTUBE, TikTok…" inputMode="url" />{video && <small className="video-provider-note">{t('Plateforme détectée')} · {getVideoProviderLabel(video.provider)}</small>}{conflictingQuiz && <small className="video-duplicate-note">{t('Cette vidéo est déjà utilisée par « {title} ».').replace('{title}', conflictingQuiz.title)}</small>}</label>
            <label className="answer-field"><span>{t('Titre du quiz')}</span><CFormInput value={title} onChange={event => { setTitle(event.target.value); setError(''); }} maxLength={90} placeholder={t('Ex. Les bases de la photographie')} /></label>
            <details className="editor-optional-field">
              <summary>{t('Ajouter une description (facultatif)')}</summary>
              <label className="answer-field"><span>{t('En une phrase')}</span><CFormTextarea value={description} onChange={event => setDescription(event.target.value)} maxLength={180} placeholder={t('Qu’allez-vous découvrir ?')} rows={2} /></label>
            </details>
          </div>
        </CCard> : <>
          <CCard className="editor-video-summary">
            <div className="editor-video-summary-row">
              {video && <VideoThumbnail className="editor-video-thumbnail" video={video} alt={t('Aperçu vidéo : {title}').replace('{title}', title)} loading="eager" />}
              <div><span className="eyebrow">{t('VIDÉO CHOISIE')}</span><strong>{title}</strong><small>{video ? getVideoProviderLabel(video.provider) : ''}</small></div>
              {video && <button type="button" className="editor-video-preview-toggle" aria-expanded={showSelectedVideoPreview} onClick={() => setShowSelectedVideoPreview(value => !value)}>{t(showSelectedVideoPreview ? 'Masquer l’aperçu' : 'Voir l’aperçu')}</button>}
              <button type="button" className="editor-change-video" onClick={() => { setError(''); setShowSelectedVideoPreview(false); setStep(1); }}>{t('Modifier')}</button>
            </div>
            {showSelectedVideoPreview && video && <div className="editor-video-summary-player"><div className={`video-shell${video.provider === 'tiktok' ? ' is-tiktok' : ''}`}><VideoPlayer video={video} title={t('Aperçu vidéo : {title}').replace('{title}', title)} /></div></div>}
          </CCard>
          <CCard className="editor-section" role="group">
          <div className="editor-section-title"><CBadge className="editor-section-number" color="success">02</CBadge><div><h2>{t('Vos questions')}</h2><p>{t('Choisissez comment réviser, puis ajoutez vos questions.')}</p></div></div>
          <div>
            <div className="editor-mode-picker">
              <span className="editor-mode-label">{t('Comment voulez-vous réviser ?')}</span>
              <label className="editor-mode-option"><input type="radio" name="review-mode" value="prepared" checked={mode === 'prepared'} onChange={() => switchMode('prepared')} /><span><strong>{t('Créer un quiz avec correction')}</strong><small>{t('Choisissez les bonnes réponses à l’avance.')}</small></span></label>
              <label className="editor-mode-option"><input type="radio" name="review-mode" value="progressive" checked={mode === 'progressive'} onChange={() => switchMode('progressive')} /><span><strong>{t('Réviser avec la vidéo')}</strong><small>{t('Répondez, puis corrigez-vous en regardant.')}</small></span></label>
              <details className="editor-advanced-options" open={mode === 'qcm'}>
                <summary>{t('Autres options')}</summary>
                <label className="editor-mode-option"><input type="radio" name="review-mode" value="qcm" checked={mode === 'qcm'} onChange={() => switchMode('qcm')} /><span><strong>{t('Mode QCM express')}</strong><small>{t('Remplissez une grille de questions et de réponses.')}</small></span></label>
              </details>
            </div>
            {progressive && <div className="progressive-grid-settings"><label className="answer-field"><span>{t('Nombre de questions')}</span><input aria-label={t('Nombre de questions')} type="number" min="1" value={questionCount} onChange={event => changeQuestionCount(event.target.value)} /></label><label className="answer-field"><span>{t('Options maximum par question')}</span><input aria-label={t('Options maximum par question')} type="number" min="2" max={isNewRoadCodeQuiz ? 4 : undefined} value={maxOptions} onChange={event => changeMaxOptions(event.target.value)} /></label></div>}
            {mode === 'prepared' && <div className="question-pager"><button type="button" className="icon-action" onClick={() => selectQuestion(activeQuestion - 1)} disabled={activeQuestion === 0} aria-label={t('Question précédente')} title={t('Question précédente')}><DemoIcon name="arrowLeft" /></button><span>{t('QUESTION')} {String(activeQuestion + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span><button type="button" className="icon-action" onClick={() => selectQuestion(activeQuestion + 1)} disabled={activeQuestion >= questions.length - 1} aria-label={t('Question suivante')} title={t('Question suivante')}><DemoIcon name="arrowRight" /></button></div>}
            {mode === 'progressive' && <div className="question-slot-board"><div><span className="eyebrow">{t('GRILLE DES {count} QUESTIONS').replace('{count}', questionCount)}</span><span className="preview-time">{completeCount} {t(completeCount === 1 ? 'renseignée' : 'renseignées')} / {questionCount}</span></div><div className="question-slot-grid">{Array.from({ length: questionCount }, (_, slot) => {
              const item = questions[slot];
              const complete = completeQuestion(item);
              return <button key={slot} type="button" className={`question-slot${slot === activeQuestion ? ' is-active' : ''}${complete ? ' is-complete' : item?.prompt.trim() || item?.options.some(option => option.trim()) ? ' is-started' : ''}`} onClick={() => selectProgressiveQuestion(slot)} aria-label={t(complete ? 'Question {count}, renseignée' : item?.prompt.trim() || item?.options.some(option => option.trim()) ? 'Question {count}, en cours' : 'Question {count}, vide').replace('{count}', slot + 1)}>{String(slot + 1).padStart(2, '0')}</button>;
            })}</div></div>}
            {mode === 'qcm' ? <div className="qcm-empty-grid" style={{ '--option-count': maxOptions }}><div className="qcm-empty-header"><span>#</span><span>{t('Question dans la vidéo')}</span>{Array.from({ length: maxOptions }, (_, index) => <span key={index}>{formatChoiceLabel(index)}</span>)}</div>{questions.map((item, index) => <div className="qcm-empty-row" key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><span>{t('Question')} {String(index + 1).padStart(2, '0')}</span>{Array.from({ length: maxOptions }, (_, optionIndex) => <span key={optionIndex}>{formatChoiceLabel(optionIndex)}</span>)}</div>)}</div> : <div className="editor-question-list">
              {(mode === 'progressive' ? [questions[activeQuestion]] : mode === 'prepared' ? questions.slice(activeQuestion, activeQuestion + 1) : questions).map((item, visibleIndex) => {
                const index = mode === 'progressive' || mode === 'prepared' ? activeQuestion : visibleIndex;
                return <article id={mode === 'progressive' ? `progressive-question-${index}` : undefined} className="editor-question" key={item.id}>
                <div className="editor-question-top"><span className="eyebrow">{t('QUESTION')} {String(index + 1).padStart(2, '0')}</span>{mode === 'prepared' && questions.length > 1 && <button className="remove-question" type="button" onClick={() => removeQuestion(item.id)} aria-label={t('Supprimer la question {count}').replace('{count}', index + 1)}><DemoIcon name="trash" /></button>}</div>
                <label className="answer-field"><span>{t('Question')}</span><CFormInput value={item.prompt} onChange={event => updateQuestion(item.id, { prompt: event.target.value })} placeholder={t('Que voulez-vous faire retenir ?')} /></label>
                <div className="editor-inline-fields">
                  <label className="answer-field"><span>{t('Moment dans la vidéo')}</span><CFormInput type="text" inputMode="numeric" value={toTimestamp(item.at)} onChange={event => { const at = toSeconds(event.target.value); updateQuestion(item.id, { at }); }} aria-label={t('Moment dans la vidéo, minutes et secondes')} /></label>
                  {mode === 'prepared' && <label className="answer-field"><span>{t('Format de réponse')}</span><CFormSelect value={item.type} onChange={event => { const type = event.target.value; updateQuestion(item.id, { type, answer: type === 'choice' ? null : type === 'multi_choice' ? [] : '' }); }}><option value="choice">{t('Une seule bonne réponse')}</option><option value="multi_choice">{t('Plusieurs bonnes réponses')}</option><option value="text">{t('Réponse courte')}</option></CFormSelect></label>}
                </div>
                {item.type !== 'text' ? mode === 'prepared'
                  ? <fieldset className="answer-field prepared-answer-options">
                    <legend>{t('Réponses possibles')} <small>{t(item.type === 'multi_choice' ? 'Cochez toutes les bonnes réponses' : 'Choisissez la bonne réponse')}</small></legend>
                    {item.options.map((option, optionIndex) => {
                      const isCorrect = item.type === 'multi_choice'
                        ? Array.isArray(item.answer) && item.answer.includes(optionIndex)
                        : item.answer === optionIndex;
                      const controlLabel = t(item.type === 'multi_choice' ? 'Marquer le choix {choice} comme correct' : 'Définir le choix {choice} comme bonne réponse').replace('{choice}', formatChoiceLabel(optionIndex));
                      return <div className="prepared-option-row" key={optionIndex}>
                                  <span className="prepared-option-letter">{formatChoiceLabel(optionIndex)}</span>
                                  <CFormInput aria-label={t('Texte du choix {choice}').replace('{choice}', formatChoiceLabel(optionIndex))} value={option} onChange={event => updateAnswerOption(item, optionIndex, event.target.value)} placeholder={t('Votre réponse')} />
                        <label className="prepared-correct-option" title={controlLabel}>
                          <input
                            type={item.type === 'multi_choice' ? 'checkbox' : 'radio'}
                            name={`correct-answer-${item.id}`}
                            aria-label={controlLabel}
                            checked={isCorrect}
                            disabled={!option.trim()}
                            onChange={() => updateQuestion(item.id, {
                              answer: item.type === 'multi_choice'
                                ? isCorrect
                                  ? item.answer.filter(index => index !== optionIndex)
                                  : [...(Array.isArray(item.answer) ? item.answer : []), optionIndex]
                                : optionIndex,
                            })}
                          />
                        </label>
                        {item.options.length > 2 && <button type="button" className="remove-answer-option" aria-label={t('Supprimer le choix {choice}').replace('{choice}', formatChoiceLabel(optionIndex))} onClick={() => removeAnswerOption(item, optionIndex)}>×</button>}
                      </div>;
                    })}
                    {item.options.length < 4 && <button type="button" className="add-answer-option" onClick={() => addAnswerOption(item)}>{t('Ajouter un choix')}</button>}
                  </fieldset>
                  : <label className="answer-field"><span>{t('Réponses possibles')} <small>{t('jusqu’à {count}').replace('{count}', maxOptions)}</small></span><CFormTextarea rows={3} value={item.options.join('\n')} onChange={event => { const options = event.target.value.split('\n').slice(0, maxOptions); updateQuestion(item.id, { options }); }} placeholder={t('Première réponse\nDeuxième réponse')} /></label>
                  : <label className="answer-field"><span>{t('Réponse attendue')}</span><CFormInput value={item.answer} onChange={event => updateQuestion(item.id, { answer: event.target.value })} placeholder={t('Votre réponse')} /></label>}
                {mode === 'prepared' && <label className="answer-field"><span>{t('Pourquoi ?')} <small>{t('facultatif')}</small></span><CFormInput value={item.explanation} onChange={event => updateQuestion(item.id, { explanation: event.target.value })} placeholder={t('Une courte explication après le résultat')} /></label>}
              </article>;
              })}
            </div>}
            {mode === 'prepared' && <div className="question-add-row"><button type="button" className="add-question" onClick={() => { setQuestions(items => [...items, emptyQuestion(mode)]); setActiveQuestion(questions.length); }}><span><DemoIcon name="plus" /></span> {t('Ajouter une question')}</button><span>{questions.length}</span></div>}
          </div>
        </CCard>
        </>}
        {error && <CAlert color="danger" role="alert" className="editor-error">{error}{conflictingQuiz && <div><Link to={conflictingQuiz.local ? `/edit/${conflictingQuiz.id}` : `/quiz/${conflictingQuiz.id}`}>{t(conflictingQuiz.local ? 'Modifier ce quiz' : 'Ouvrir ce quiz')}</Link></div>}</CAlert>}
        <div className="editor-submit">
          <Link className="btn btn-outline-secondary button button-quiet" to="/">{t('Annuler')}</Link>
          {step === 2 && <CButton type="button" className="button button-quiet" color="light" onClick={() => { setError(''); setStep(1); }}>{t('Retour')}</CButton>}
          <CButton type="submit" className="button button-dark" color="success">{t(step === 1 ? 'Continuer' : mode === 'qcm' ? 'Créer et lancer le QCM' : progressive ? readyToPlay ? 'Enregistrer et réviser' : 'Enregistrer le brouillon' : quiz ? 'Enregistrer les changements' : 'Enregistrer et essayer')} <DemoIcon name="arrowRight" /></CButton>
        </div>
      </form>
    </main>
  );
}