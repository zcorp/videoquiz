import { demoQuizzes } from '../data/demoQuizzes.js';
import { extractYouTubeVideoId } from './youtube.js';

const QUIZ_KEY = 'videoquiz-demo:quizzes:v1';
const ATTEMPT_KEY = 'videoquiz-demo:attempts:v1';
const CORRECTION_KEY = 'videoquiz-demo:corrections:v1';
const PROGRESS_KEY = 'videoquiz-demo:progress:v1';
const BACKUP_FORMAT = 'videoquiz-demo-backup';
const BACKUP_VERSION = 1;

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function readObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function correctionFingerprint(question) {
  return JSON.stringify([question.prompt, question.type, question.options ?? []]);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isQuiz(value) {
  if (!(isRecord(value)
    && typeof value.id === 'string' && value.id.length > 0
    && !['__proto__', 'prototype', 'constructor'].includes(value.id)
    && typeof value.title === 'string' && value.title.trim().length > 0
    && typeof value.videoId === 'string' && Boolean(extractYouTubeVideoId(value.videoId))
    && Array.isArray(value.questions) && value.questions.length > 0)) return false;
  const questionIds = value.questions.map(question => question?.id);
  return new Set(questionIds).size === questionIds.length
    && value.questions.every(question => isRecord(question)
      && typeof question.id === 'string' && question.id.length > 0
      && !['__proto__', 'prototype', 'constructor'].includes(question.id)
      && typeof question.prompt === 'string'
      && Number.isFinite(question.at)
      && ['choice', 'multi_choice', 'text'].includes(question.type)
      && (question.type === 'text' || (Array.isArray(question.options) && question.options.every(option => typeof option === 'string'))));
}

function isAttempt(value) {
  return isRecord(value)
    && typeof value.quizId === 'string'
    && typeof value.title === 'string'
    && Number.isInteger(value.score) && value.score >= 0
    && Number.isInteger(value.max) && value.max > 0 && value.score <= value.max
    && Number.isInteger(value.percentage) && value.percentage >= 0 && value.percentage <= 100
    && typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt));
}

function isAnswerMap(value, quiz) {
  return isRecord(value) && Object.entries(value).every(([questionId, answer]) => {
    const question = quiz.questions.find(item => item.id === questionId);
    if (!question) return false;
    if (question.type === 'text') return typeof answer === 'string';
    if (question.type === 'multi_choice') {
      return Array.isArray(answer) && answer.every(index => Number.isInteger(index) && index >= 0 && index < question.options.length);
    }
    return Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
  });
}

export function getQuizSignature(quiz) {
  return JSON.stringify([
    extractYouTubeVideoId(quiz.videoId),
    quiz.mode ?? 'prepared',
    Boolean(quiz.exam),
    quiz.questions.map(question => [
      question.id,
      question.prompt,
      question.at,
      question.type,
      question.options ?? [],
      question.answer,
    ]),
  ]);
}

function normalizeCorrection(question, value) {
  if (question.type === 'text') return typeof value === 'string' && value.trim() ? value : null;
  if (question.type === 'multi_choice' && Array.isArray(value)) {
    const choices = [...new Set(value.filter(index => Number.isInteger(index) && index >= 0 && index < question.options.length))];
    return choices.length ? choices : null;
  }
  return null;
}

export function getQuizCorrections(quiz) {
  const storedQuizCorrections = readObject(CORRECTION_KEY)[quiz.id];
  if (!storedQuizCorrections || typeof storedQuizCorrections !== 'object' || Array.isArray(storedQuizCorrections)) return {};

  return Object.fromEntries(quiz.questions.flatMap(question => {
    const record = storedQuizCorrections[question.id];
    if (!record || record.fingerprint !== correctionFingerprint(question)) return [];
    const value = normalizeCorrection(question, record.value);
    return value === null ? [] : [[question.id, value]];
  }));
}

export function saveQuizCorrection(quiz, question, value) {
  const corrections = readObject(CORRECTION_KEY);
  const quizCorrections = corrections[quiz.id] && typeof corrections[quiz.id] === 'object' && !Array.isArray(corrections[quiz.id])
    ? { ...corrections[quiz.id] }
    : {};
  const normalized = normalizeCorrection(question, value);

  if (normalized === null) delete quizCorrections[question.id];
  else quizCorrections[question.id] = { fingerprint: correctionFingerprint(question), value: normalized };

  if (Object.keys(quizCorrections).length) corrections[quiz.id] = quizCorrections;
  else delete corrections[quiz.id];

  try {
    localStorage.setItem(CORRECTION_KEY, JSON.stringify(corrections));
    return true;
  } catch {
    return false;
  }
}

export function getQuizProgress(quiz) {
  const progress = readObject(PROGRESS_KEY)[quiz.id];
  if (!isRecord(progress)
    || progress.signature !== getQuizSignature(quiz)
    || !Number.isInteger(progress.current)
    || progress.current < 0
    || progress.current >= quiz.questions.length
    || !isAnswerMap(progress.answers, quiz)
    || !isAnswerMap(progress.selfKeys, quiz)
    || typeof progress.answerSubmitted !== 'boolean'
    || typeof progress.correctionShown !== 'boolean') return null;
  return {
    current: progress.current,
    answers: progress.answers,
    selfKeys: progress.selfKeys,
    answerSubmitted: progress.answerSubmitted,
    correctionShown: progress.correctionShown,
  };
}

export function saveQuizProgress(quiz, progress) {
  const allProgress = readObject(PROGRESS_KEY);
  allProgress[quiz.id] = {
    signature: getQuizSignature(quiz),
    current: progress.current,
    answers: progress.answers,
    selfKeys: progress.selfKeys,
    answerSubmitted: progress.answerSubmitted,
    correctionShown: progress.correctionShown,
  };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
    return true;
  } catch {
    return false;
  }
}

export function clearQuizProgress(quizId) {
  const allProgress = readObject(PROGRESS_KEY);
  delete allProgress[quizId];
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress));
    return true;
  } catch {
    return false;
  }
}

export function exportLocalBackup() {
  const quizzes = getLocalQuizzes();
  const validQuizzes = quizzes.filter(isQuiz);
  const byId = Object.fromEntries([...validQuizzes, ...demoQuizzes].map(quiz => [quiz.id, quiz]));
  const progress = readObject(PROGRESS_KEY);
  const resumableProgress = Object.fromEntries(Object.entries(progress).filter(([quizId, item]) => {
    const quiz = byId[quizId];
    return quiz && isRecord(item)
      && item.signature === getQuizSignature(quiz)
      && Number.isInteger(item.current) && item.current >= 0 && item.current < quiz.questions.length
      && isAnswerMap(item.answers, quiz) && isAnswerMap(item.selfKeys, quiz)
      && typeof item.answerSubmitted === 'boolean' && typeof item.correctionShown === 'boolean';
  }));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    quizzes: validQuizzes,
    attempts: getAttempts().filter(isAttempt),
    corrections: readObject(CORRECTION_KEY),
    progress: resumableProgress,
  };
}

export function importLocalBackup(backup) {
  if (!isRecord(backup) || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION
    || !Array.isArray(backup.quizzes) || !Array.isArray(backup.attempts)
    || !isRecord(backup.corrections) || !isRecord(backup.progress)) {
    return { ok: false, error: 'Ce fichier n’est pas une sauvegarde Video Quiz reconnue.' };
  }
  if (!backup.quizzes.every(isQuiz) || !backup.attempts.every(isAttempt)) {
    return { ok: false, error: 'La sauvegarde contient des données invalides; aucune donnée n’a été importée.' };
  }
  const backupQuizIds = backup.quizzes.map(quiz => quiz.id);
  const backupVideoIds = backup.quizzes.map(quiz => extractYouTubeVideoId(quiz.videoId));
  if (new Set(backupQuizIds).size !== backupQuizIds.length || new Set(backupVideoIds).size !== backupVideoIds.length) {
    return { ok: false, error: 'La sauvegarde contient des quiz en double; aucune donnée n’a été importée.' };
  }

  const localQuizzes = getLocalQuizzes();
  const existingQuizzes = [...localQuizzes, ...demoQuizzes];
  const existingQuizIds = new Set(existingQuizzes.map(quiz => quiz.id));
  const existingVideoIds = new Set(existingQuizzes.map(quiz => extractYouTubeVideoId(quiz.videoId)));
  const incomingIds = new Set();
  const incomingVideos = new Set();
  const safeBackupQuizIds = new Set();
  const acceptedQuizzes = [];
  let skippedQuizzes = 0;

  for (const quiz of backup.quizzes) {
    const videoId = extractYouTubeVideoId(quiz.videoId);
    if (existingQuizIds.has(quiz.id) || existingVideoIds.has(videoId)
      || incomingIds.has(quiz.id) || incomingVideos.has(videoId)) {
      skippedQuizzes += 1;
      const existingWithId = existingQuizzes.find(existing => existing.id === quiz.id);
      if (existingWithId && getQuizSignature(existingWithId) === getQuizSignature(quiz)) safeBackupQuizIds.add(quiz.id);
      continue;
    }
    incomingIds.add(quiz.id);
    incomingVideos.add(videoId);
    safeBackupQuizIds.add(quiz.id);
    acceptedQuizzes.push(quiz);
  }

  const availableQuizzes = new Map([...localQuizzes, ...demoQuizzes, ...acceptedQuizzes].map(quiz => [quiz.id, quiz]));
  const canMergeQuizData = quizId => safeBackupQuizIds.has(quizId) || demoQuizzes.some(quiz => quiz.id === quizId);
  const attempts = getAttempts();
  const existingAttempts = new Set(attempts.map(attempt => JSON.stringify(attempt)));
  const importedAttempts = backup.attempts.flatMap(attempt => {
    if (!availableQuizzes.has(attempt.quizId) || !canMergeQuizData(attempt.quizId)) return [];
    const summary = {
      quizId: attempt.quizId,
      title: attempt.title,
      score: attempt.score,
      max: attempt.max,
      percentage: attempt.percentage,
      completedAt: attempt.completedAt,
    };
    const key = JSON.stringify(summary);
    if (existingAttempts.has(key)) return [];
    existingAttempts.add(key);
    return [summary];
  });
  const corrections = readObject(CORRECTION_KEY);
  let importedCorrections = 0;
  for (const [quizId, questionRecords] of Object.entries(backup.corrections)) {
    const quiz = availableQuizzes.get(quizId);
    if (!quiz || !canMergeQuizData(quizId) || !isRecord(questionRecords)) continue;
    const current = isRecord(corrections[quizId]) ? corrections[quizId] : {};
    const next = { ...current };
    for (const question of quiz.questions) {
      const record = questionRecords[question.id];
      if (next[question.id] || !isRecord(record) || record.fingerprint !== correctionFingerprint(question)) continue;
      const value = normalizeCorrection(question, record.value);
      if (value === null) continue;
      next[question.id] = { fingerprint: record.fingerprint, value };
      importedCorrections += 1;
    }
    if (Object.keys(next).length) corrections[quizId] = next;
  }

  const progress = readObject(PROGRESS_KEY);
  let importedProgress = 0;
  for (const [quizId, item] of Object.entries(backup.progress)) {
    const quiz = availableQuizzes.get(quizId);
    if (progress[quizId] || !quiz || !canMergeQuizData(quizId) || !isRecord(item)
      || item.signature !== getQuizSignature(quiz)
      || !Number.isInteger(item.current) || item.current < 0 || item.current >= quiz.questions.length
      || !isAnswerMap(item.answers, quiz) || !isAnswerMap(item.selfKeys, quiz)
      || typeof item.answerSubmitted !== 'boolean' || typeof item.correctionShown !== 'boolean') continue;
    progress[quizId] = item;
    importedProgress += 1;
  }

  const nextQuizzes = [...acceptedQuizzes, ...localQuizzes];
  const nextAttempts = [...importedAttempts, ...attempts].slice(0, 30);
  let originalValues;
  try {
    originalValues = [QUIZ_KEY, ATTEMPT_KEY, CORRECTION_KEY, PROGRESS_KEY].map(key => localStorage.getItem(key));
    localStorage.setItem(QUIZ_KEY, JSON.stringify(nextQuizzes));
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(nextAttempts));
    localStorage.setItem(CORRECTION_KEY, JSON.stringify(corrections));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    let rollbackFailed = false;
    if (originalValues) {
      [QUIZ_KEY, ATTEMPT_KEY, CORRECTION_KEY, PROGRESS_KEY].forEach((key, index) => {
        try {
          const original = originalValues[index];
          if (original === null) localStorage.removeItem(key);
          else localStorage.setItem(key, original);
        } catch {
          rollbackFailed = true;
        }
      });
    }
    return {
      ok: false,
      error: rollbackFailed
        ? 'Le navigateur a interrompu l’import et n’a pas pu restaurer toutes les données. Vérifiez votre espace de stockage avant de continuer.'
        : 'Le navigateur n’a pas pu enregistrer la sauvegarde. Vérifiez l’espace disponible.',
    };
  }
  return {
    ok: true,
    importedQuizzes: acceptedQuizzes.length,
    skippedQuizzes,
    importedAttempts: importedAttempts.length,
    importedCorrections,
    importedProgress,
  };
}

export const getLocalQuizzes = () => {
  const quizzes = readList(QUIZ_KEY);
  const normalized = quizzes.map(quiz => quiz.mode === 'qcm' && quiz.draft ? { ...quiz, draft: false } : quiz);
  if (normalized.some((quiz, index) => quiz !== quizzes[index])) writeList(QUIZ_KEY, normalized);
  return normalized;
};
export const getQuizUsingVideo = (videoId, quizzes, excludedQuizId) => {
  const normalizedVideoId = extractYouTubeVideoId(videoId);
  if (!normalizedVideoId) return undefined;
  return quizzes.find(quiz => (
    quiz.id !== excludedQuizId && extractYouTubeVideoId(quiz.videoId) === normalizedVideoId
  ));
};
export const getAttempts = () => {
  const attempts = readList(ATTEMPT_KEY);
  const compact = attempts.map(({ quizId, title, score, max, percentage, completedAt }) => ({ quizId, title, score, max, percentage, completedAt }));
  if (compact.some((attempt, index) => JSON.stringify(attempt) !== JSON.stringify(attempts[index]))) writeList(ATTEMPT_KEY, compact);
  return compact;
};
export const getAttemptsForQuiz = quizId => getAttempts().filter(attempt => attempt.quizId === quizId);
export const getQuizProgression = quizId => getAttemptsForQuiz(quizId)
  .slice()
  .reverse()
  .map(attempt => ({
    date: attempt.completedAt,
    score: attempt.score,
    max: attempt.max,
    percentage: attempt.percentage,
  }));

export function saveLocalQuiz(quiz) {
  const quizzes = getLocalQuizzes();
  const videoId = extractYouTubeVideoId(quiz.videoId);
  const conflict = videoId && getQuizUsingVideo(videoId, [...quizzes, ...demoQuizzes], quiz.id);
  if (!videoId || conflict) return { saved: false, conflict };
  const index = quizzes.findIndex(item => item.id === quiz.id);
  if (index < 0) quizzes.unshift(quiz);
  else quizzes[index] = quiz;
  return { saved: writeList(QUIZ_KEY, quizzes), conflict: null };
}

export function deleteLocalQuiz(quizId) {
  return writeList(QUIZ_KEY, getLocalQuizzes().filter(quiz => quiz.id !== quizId));
}

export function saveAttempt(attempt) {
  const summary = {
    quizId: attempt.quizId,
    title: attempt.title,
    score: attempt.score,
    max: attempt.max,
    percentage: attempt.percentage,
    completedAt: attempt.completedAt,
  };
  return writeList(ATTEMPT_KEY, [summary, ...getAttempts()].slice(0, 30));
}