import { demoQuizzes } from '../data/demoQuizzes.js';
import { extractYouTubeVideoId } from './youtube.js';

const QUIZ_KEY = 'videoquiz-demo:quizzes:v1';
const ATTEMPT_KEY = 'videoquiz-demo:attempts:v1';
const CORRECTION_KEY = 'videoquiz-demo:corrections:v1';

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