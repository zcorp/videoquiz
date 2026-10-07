import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CAlert, CBadge, CButton, CCard, CFormInput, CFormSelect, CFormTextarea } from '@coreui/react';
import { formatChoiceLabel, formatTime, getVideoUrl } from '../data/demoQuizzes.js';
import { getQuizUsingVideo } from '../services/localStore.js';
import { extractYouTubeVideoId } from '../services/youtube.js';
import DemoIcon from './DemoIcon.jsx';

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
  return { id: createId(), prompt: '', at: 0, type: isProgressiveMode(mode) ? 'multi_choice' : 'choice', options: ['', ''], answer: 0, explanation: '' };
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
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export default function DemoEditor({ quiz, quizzes = [], onSave }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const linkedVideoId = !quiz ? searchParams.get('video') ?? '' : '';
  const linkedVideoTitle = !quiz ? searchParams.get('title') ?? '' : '';
  const linkedTopic = quiz?.topic ?? searchParams.get('topic') ?? 'CRÉÉ ICI';
  const initialMode = quiz?.mode ?? (searchParams.get('mode') === 'qcm' && linkedVideoId ? 'qcm' : 'prepared');
  const initialQuestionCount = quiz?.questionCount ?? (isProgressiveMode(initialMode) ? quiz?.questions?.length ?? 40 : 40);
  const initialMaxOptions = quiz?.maxOptions ?? 4;
  const [title, setTitle] = useState(() => quiz?.title ?? linkedVideoTitle.slice(0, 90));
  const [description, setDescription] = useState(() => quiz?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(() => quiz?.videoId ? `https://www.youtube.com/watch?v=${quiz.videoId}` : linkedVideoId ? `https://www.youtube.com/watch?v=${linkedVideoId}` : '');
  const [mode, setMode] = useState(initialMode);
  const [questionCount, setQuestionCount] = useState(initialQuestionCount);
  const [maxOptions, setMaxOptions] = useState(initialMaxOptions);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [questions, setQuestions] = useState(() => quiz?.questions?.map(item => ({
    ...item,
    options: isProgressiveMode(quiz.mode)
      ? Array.from({ length: initialMaxOptions }, (_, index) => item.options?.[index] ?? '')
      : item.options ?? ['', ''],
  })) ?? Array.from({ length: isProgressiveMode(initialMode) ? initialQuestionCount : 1 }, () => ({
    ...emptyQuestion(initialMode),
    options: Array(isProgressiveMode(initialMode) ? initialMaxOptions : 2).fill(''),
  })));
  const [previewAt, setPreviewAt] = useState(() => quiz?.questions?.[0]?.at ?? 0);
  const [error, setError] = useState('');
  const videoId = extractYouTubeVideoId(videoUrl);
  const conflictingQuiz = getQuizUsingVideo(videoId, quizzes, quiz?.id);

  const updateQuestion = (id, patch) => setQuestions(items => items.map(item => item.id === id ? { ...item, ...patch } : item));
  const scrollToQuestion = index => document.getElementById(`progressive-question-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const progressive = isProgressiveMode(mode);
  const completeQuestion = item => mode === 'qcm' || Boolean(item?.prompt.trim() && item.options.filter(option => option.trim()).length >= 2 && item.options.filter(option => option.trim()).length <= maxOptions);
  const completeCount = progressive ? questions.filter(completeQuestion).length : questions.length;
  const readyToPlay = !progressive || questions.length === questionCount && questions.every(completeQuestion);
  const selectProgressiveQuestion = index => {
    setActiveQuestion(index);
    setPreviewAt(questions[index]?.at ?? 0);
    requestAnimationFrame(() => scrollToQuestion(index));
  };
  const selectQuestion = index => {
    const boundedIndex = Math.max(0, Math.min(index, questions.length - 1));
    setActiveQuestion(boundedIndex);
    setPreviewAt(questions[boundedIndex]?.at ?? 0);
  };
  const removeQuestion = id => {
    const index = questions.findIndex(item => item.id === id);
    setQuestions(items => items.filter(item => item.id !== id));
    if (index <= activeQuestion) setActiveQuestion(current => Math.max(0, current - 1));
  };
  const save = event => {
    event.preventDefault();
    if (!title.trim()) return setError('Donnez un titre à votre quiz.');
    if (!videoId) return setError('Ajoutez une URL YouTube valide.');
    if (conflictingQuiz) return setError(`Cette vidéo est déjà associée au quiz « ${conflictingQuiz.title} ». Ouvrez-le pour le modifier ou choisissez une autre vidéo.`);
    if (progressive && (!Number.isSafeInteger(questionCount) || questionCount < 1 || !Number.isSafeInteger(maxOptions) || maxOptions < 2)) return setError('Choisissez un nombre entier valide de questions et au moins deux options.');
    if (mode === 'prepared' && questions.length === 0) return setError('Ajoutez au moins une question au quiz.');
    if (mode === 'prepared' && !questions.every(item => item.prompt.trim() && (item.type === 'text' ? item.answer.trim() : item.options.filter(option => option.trim()).length >= 2 && item.options.filter(option => option.trim()).length <= 4) && (item.type === 'text' || Number.isInteger(item.answer)))) return setError('Complétez les questions avec 2 à 4 choix de réponse.');
    const nextQuiz = {
      id: quiz?.id ?? `local-${createId()}`,
      title: title.trim(), description: description.trim() || 'Un quiz vidéo créé dans votre navigateur.',
      topic: linkedTopic, videoId, videoLabel: title.trim(), local: true,
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
            : originalIndexes.indexOf(item.answer),
        };
      }),
    };
    const saveResult = onSave(nextQuiz);
    if (!saveResult?.saved) {
      if (saveResult?.conflict) return setError(`Cette vidéo est déjà associée au quiz « ${saveResult.conflict.title} ». Ouvrez-le pour le modifier ou choisissez une autre vidéo.`);
      return setError('Le navigateur n’a pas pu enregistrer ce quiz. Vérifiez l’espace de stockage disponible.');
    }
    navigate(nextQuiz.draft ? '/' : `/quiz/${nextQuiz.id}`);
  };

  const switchMode = nextMode => {
    setMode(nextMode);
    if (isProgressiveMode(nextMode)) {
      const count = isProgressiveMode(quiz?.mode) ? questionCount : 40;
      setQuestionCount(count);
      setQuestions(items => resizeQuestions(items, count, nextMode, maxOptions));
      setActiveQuestion(0);
    } else {
      setQuestions(items => items.filter(item => item.prompt.trim()).map(item => ({ ...item, type: 'choice', answer: 0 })));
      setQuestionCount(Math.max(1, questions.length));
      setActiveQuestion(0);
    }
  };
  const changeQuestionCount = count => {
    const parsed = Number(count);
    if (!Number.isSafeInteger(parsed) || parsed < 1) return;
    const nextCount = parsed;
    if (nextCount < questions.length && questions.slice(nextCount).some(item => item.prompt.trim() || item.options.some(option => option.trim()))) {
      if (!window.confirm(`Réduire la grille à ${nextCount} questions supprimera les réponses saisies après la question ${nextCount}. Continuer ?`)) return;
    }
    setQuestionCount(nextCount);
    setQuestions(items => resizeQuestions(items, nextCount, mode, maxOptions));
    setActiveQuestion(index => Math.min(index, nextCount - 1));
  };
  const changeMaxOptions = value => {
    const nextMax = Number(value);
    if (!Number.isSafeInteger(nextMax) || nextMax < 2) return;
    const hasDiscardedChoices = questions.some(item => item.options.slice(nextMax).some(option => option.trim()));
    if (nextMax < maxOptions && hasDiscardedChoices && !window.confirm(`Réduire à ${nextMax} choix supprimera les options déjà saisies après le choix ${nextMax}. Continuer ?`)) return;
    setMaxOptions(nextMax);
    setQuestions(items => items.map(item => ({ ...item, options: Array.from({ length: nextMax }, (_, index) => item.options[index] ?? '') })));
  };

  return (
    <main className="demo-page editor-page">
      <div className="player-topline"><Link to="/" className="back-link"><DemoIcon name="arrowLeft" /> Bibliothèque</Link><span className="eyebrow">VOTRE ESPACE LOCAL</span><span className="player-save-note"><DemoIcon name="circle" /> Enregistrement dans ce navigateur</span></div>
      <div className="editor-heading"><span className="eyebrow">CRÉATEUR DE QUIZ</span><h1>{quiz ? 'Affinez votre quiz.' : 'Une vidéo, vos questions.'}</h1><p>Votre quiz reste dans ce navigateur. La vidéo se charge depuis YouTube.</p></div>
      <form className="editor-form" onSubmit={save}>
        <CCard className="editor-section" role="group">
          <div className="editor-section-title"><CBadge className="editor-section-number" color="success">01</CBadge><div><h2>La vidéo</h2><p>Collez le lien YouTube que vous souhaitez accompagner.</p></div></div>
          <div className="editor-fields">
            <label className="answer-field"><span>Titre du quiz</span><CFormInput value={title} onChange={event => setTitle(event.target.value)} maxLength={90} placeholder="Ex. Les bases de la photographie" /></label>
            <label className="answer-field"><span>Lien YouTube</span><CFormInput value={videoUrl} onChange={event => { setVideoUrl(event.target.value); setError(''); }} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" />{conflictingQuiz && <small className="video-duplicate-note">Cette vidéo est déjà utilisée par « {conflictingQuiz.title} ».</small>}</label>
            <label className="answer-field"><span>En une phrase <small>facultatif</small></span><CFormTextarea value={description} onChange={event => setDescription(event.target.value)} maxLength={180} placeholder="Qu’allez-vous découvrir ?" rows={2} /></label>
            <label className="answer-field"><span>Mode de révision</span><CFormSelect value={mode} onChange={event => switchMode(event.target.value)}><option value="prepared">Quiz préparé · réponses définies à l’avance</option><option value="progressive">Révision progressive · questions au fil de la vidéo</option><option value="qcm">QCM express · grille sans formulaire par question</option></CFormSelect></label>
            {progressive && <div className="mode-note"><strong>Sans clé de réponse préalable</strong><span>Suggestion de départ : 40 questions et 4 choix maximum. Vous pouvez modifier ces deux nombres selon votre vidéo. {mode === 'qcm' ? 'La grille QCM crée toutes les lignes d’un coup. Saisissez questions et choix directement dans le tableau.' : 'La grille réserve les questions; laissez des cases vides et complétez-les une à une pendant le visionnage.'} Le réviseur donnera ensuite sa réponse puis sa propre correction d’après la vidéo.</span></div>}
          </div>
        </CCard>
        <CCard className="editor-section" role="group">
          <div className="editor-section-title"><CBadge className="editor-section-number" color="success">02</CBadge><div><h2>{progressive ? mode === 'qcm' ? 'Grille QCM' : 'Questions au fil de la vidéo' : 'Les questions'}</h2><p>{progressive ? mode === 'qcm' ? 'Une ligne par question, une colonne par choix. Remplissez la grille en une vue.' : 'Définissez une grille vide, puis remplissez chaque case pendant le visionnage.' : 'Choisissez un passage et une façon simple de répondre.'}</p></div></div>
          <div>
            {progressive && <div className="progressive-grid-settings"><label className="answer-field"><span>Nombre de questions</span><input aria-label="Nombre de questions" type="number" min="1" value={questionCount} onChange={event => changeQuestionCount(event.target.value)} /></label><label className="answer-field"><span>Options maximum par question</span><input aria-label="Options maximum par question" type="number" min="2" value={maxOptions} onChange={event => changeMaxOptions(event.target.value)} /></label></div>}
            {mode === 'prepared' && <div className="question-pager"><button type="button" className="icon-action" onClick={() => selectQuestion(activeQuestion - 1)} disabled={activeQuestion === 0} aria-label="Question précédente" title="Question précédente"><DemoIcon name="arrowLeft" /></button><span>QUESTION {String(activeQuestion + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}</span><button type="button" className="icon-action" onClick={() => selectQuestion(activeQuestion + 1)} disabled={activeQuestion >= questions.length - 1} aria-label="Question suivante" title="Question suivante"><DemoIcon name="arrowRight" /></button></div>}
            {mode === 'progressive' && <div className="question-slot-board"><div><span className="eyebrow">GRILLE DES {questionCount} QUESTIONS</span><span className="preview-time">{completeCount} renseignée{completeCount === 1 ? '' : 's'} / {questionCount}</span></div><div className="question-slot-grid">{Array.from({ length: questionCount }, (_, slot) => {
              const item = questions[slot];
              const complete = completeQuestion(item);
              return <button key={slot} type="button" className={`question-slot${slot === activeQuestion ? ' is-active' : ''}${complete ? ' is-complete' : item?.prompt.trim() || item?.options.some(option => option.trim()) ? ' is-started' : ''}`} onClick={() => selectProgressiveQuestion(slot)} aria-label={`Question ${slot + 1}${complete ? ', renseignée' : item?.prompt.trim() || item?.options.some(option => option.trim()) ? ', en cours' : ', vide'}`}>{String(slot + 1).padStart(2, '0')}</button>;
            })}</div></div>}
            {mode === 'qcm' ? <div className="qcm-empty-grid" style={{ '--option-count': maxOptions }}><div className="qcm-empty-header"><span>#</span><span>Question dans la vidéo</span>{Array.from({ length: maxOptions }, (_, index) => <span key={index}>{formatChoiceLabel(index)}</span>)}</div>{questions.map((item, index) => <div className="qcm-empty-row" key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><span>Question {String(index + 1).padStart(2, '0')}</span>{Array.from({ length: maxOptions }, (_, optionIndex) => <span key={optionIndex}>{formatChoiceLabel(optionIndex)}</span>)}</div>)}</div> : <div className="editor-question-list">
              {(mode === 'progressive' ? [questions[activeQuestion]] : mode === 'prepared' ? questions.slice(activeQuestion, activeQuestion + 1) : questions).map((item, visibleIndex) => {
                const index = mode === 'progressive' || mode === 'prepared' ? activeQuestion : visibleIndex;
                return <article id={mode === 'progressive' ? `progressive-question-${index}` : undefined} className="editor-question" key={item.id}>
                <div className="editor-question-top"><span className="eyebrow">QUESTION {String(index + 1).padStart(2, '0')}</span>{mode === 'prepared' && questions.length > 1 && <button className="remove-question" type="button" onClick={() => removeQuestion(item.id)} aria-label={`Supprimer la question ${index + 1}`}><DemoIcon name="trash" /></button>}</div>
                <label className="answer-field"><span>Question</span><CFormInput value={item.prompt} onChange={event => updateQuestion(item.id, { prompt: event.target.value })} placeholder="Que voulez-vous faire retenir ?" /></label>
                <div className="editor-inline-fields">
                  <label className="answer-field"><span>Moment dans la vidéo</span><CFormInput type="text" inputMode="numeric" value={toTimestamp(item.at)} onChange={event => { const at = toSeconds(event.target.value); updateQuestion(item.id, { at }); setPreviewAt(at); }} aria-label="Moment dans la vidéo, minutes et secondes" /></label>
                  {mode === 'prepared' && <label className="answer-field"><span>Format de réponse</span><CFormSelect value={item.type} onChange={event => updateQuestion(item.id, { type: event.target.value, answer: event.target.value === 'choice' ? 0 : '' })}><option value="choice">Choix multiple</option><option value="text">Réponse courte</option></CFormSelect></label>}
                </div>
                {item.type !== 'text' ? <>
                  <label className="answer-field"><span>Choix de réponse <small>{mode === 'progressive' ? `jusqu’à ${maxOptions}, aucun marqué correct` : '2 à 4 choix'}</small></span><CFormTextarea rows={3} value={item.options.join('\n')} onChange={event => { const options = event.target.value.split('\n').slice(0, mode === 'progressive' ? maxOptions : 4); updateQuestion(item.id, { options, answer: Math.min(item.answer ?? 0, Math.max(0, options.length - 1)) }); }} placeholder={'Première réponse\nDeuxième réponse'} /></label>
                  {mode === 'prepared' && <label className="answer-field"><span>Bonne réponse</span><CFormSelect value={item.answer} onChange={event => updateQuestion(item.id, { answer: Number(event.target.value) })}>{item.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex} disabled={!option.trim()}>{option.trim() || `Réponse ${optionIndex + 1}`}</option>)}</CFormSelect></label>}
                </> : <label className="answer-field"><span>Réponse attendue</span><CFormInput value={item.answer} onChange={event => updateQuestion(item.id, { answer: event.target.value })} placeholder="Votre réponse" /></label>}
                {mode === 'prepared' && <label className="answer-field"><span>Pourquoi ? <small>facultatif</small></span><CFormInput value={item.explanation} onChange={event => updateQuestion(item.id, { explanation: event.target.value })} placeholder="Une courte explication après le résultat" /></label>}
              </article>;
              })}
            </div>}
            {mode === 'prepared' && <div className="question-add-row"><button type="button" className="add-question" onClick={() => { setQuestions(items => [...items, emptyQuestion(mode)]); setActiveQuestion(questions.length); }}><span><DemoIcon name="plus" /></span> Ajouter une question</button><span>{questions.length}</span></div>}
            {progressive && videoId && <div className="editor-video-preview"><div><span className="eyebrow">APERÇU DE LA VIDÉO</span><span className="preview-time">Départ à {formatTime(previewAt)}</span></div><div className="video-shell"><iframe key={`${videoId}-${previewAt}`} src={getVideoUrl(videoId, previewAt)} title={`Aperçu vidéo à ${formatTime(previewAt)}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div></div>}
          </div>
        </CCard>
        {error && <CAlert color="danger" role="alert" className="editor-error">{error}{conflictingQuiz && <div><Link to={conflictingQuiz.local ? `/edit/${conflictingQuiz.id}` : `/quiz/${conflictingQuiz.id}`}>{conflictingQuiz.local ? 'Modifier ce quiz' : 'Ouvrir ce quiz'}</Link></div>}</CAlert>}
        <div className="editor-submit"><Link className="btn btn-outline-secondary button button-quiet" to="/">Annuler</Link><CButton type="submit" className="button button-dark" color="success">{mode === 'qcm' ? 'Créer et lancer le QCM' : progressive ? readyToPlay ? 'Enregistrer et réviser' : 'Enregistrer le brouillon' : quiz ? 'Enregistrer les changements' : 'Enregistrer et essayer'} <DemoIcon name="arrowRight" /></CButton></div>
      </form>
    </main>
  );
}