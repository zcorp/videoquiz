const QUIZ_KEY = 'videoquiz-demo:quizzes:v1';
const ATTEMPT_KEY = 'videoquiz-demo:attempts:v1';

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

export const getLocalQuizzes = () => {
  const quizzes = readList(QUIZ_KEY);
  const normalized = quizzes.map(quiz => quiz.mode === 'qcm' && quiz.draft ? { ...quiz, draft: false } : quiz);
  if (normalized.some((quiz, index) => quiz !== quizzes[index])) writeList(QUIZ_KEY, normalized);
  return normalized;
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
  const index = quizzes.findIndex(item => item.id === quiz.id);
  if (index < 0) quizzes.unshift(quiz);
  else quizzes[index] = quiz;
  return writeList(QUIZ_KEY, quizzes);
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