const preparedQuizModules = import.meta.glob('./approved/*.json', {
  eager: true,
  import: 'default',
});

function requireText(value, field, fileName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`QCM préparé invalide (${fileName}) : ${field} doit être renseigné.`);
  }
}

function validateApprovedQuiz(quiz, fileName) {
  requireText(quiz.id, 'id', fileName);
  requireText(quiz.videoId, 'videoId', fileName);
  requireText(quiz.title, 'title', fileName);
  requireText(quiz.topic, 'topic', fileName);

  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error(`QCM préparé invalide (${fileName}) : questions doit contenir au moins une question.`);
  }

  requireText(quiz.review?.reviewer, 'review.reviewer', fileName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(quiz.review?.reviewedAt ?? '')) {
    throw new Error(`QCM préparé invalide (${fileName}) : review.reviewedAt doit être une date ISO (AAAA-MM-JJ).`);
  }

  const questionIds = new Set();
  for (const [index, question] of quiz.questions.entries()) {
    const questionLabel = `questions[${index}]`;
    requireText(question.id, `${questionLabel}.id`, fileName);
    requireText(question.prompt, `${questionLabel}.prompt`, fileName);

    if (questionIds.has(question.id)) {
      throw new Error(`QCM préparé invalide (${fileName}) : identifiant de question dupliqué « ${question.id} ».`);
    }
    questionIds.add(question.id);

    if (!Number.isFinite(question.at) || question.at < 0) {
      throw new Error(`QCM préparé invalide (${fileName}) : ${questionLabel}.at doit être un temps positif.`);
    }
    if (!['choice', 'multi_choice'].includes(question.type)) {
      throw new Error(`QCM préparé invalide (${fileName}) : ${questionLabel}.type doit valoir « choice » ou « multi_choice ».`);
    }
    if (!Array.isArray(question.options) ||
      question.options.length < 2 ||
      question.options.length > 4 ||
      question.options.some(option => typeof option !== 'string' || option.trim().length === 0)) {
      throw new Error(`QCM préparé invalide (${fileName}) : ${questionLabel}.options doit contenir de 2 à 4 choix renseignés.`);
    }
    const hasValidAnswer = question.type === 'multi_choice'
      ? Array.isArray(question.answer) &&
        question.answer.length > 0 &&
        new Set(question.answer).size === question.answer.length &&
        question.answer.every(answer => Number.isInteger(answer) && answer >= 0 && answer < question.options.length)
      : Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length;
    if (!hasValidAnswer) {
      throw new Error(`QCM préparé invalide (${fileName}) : ${questionLabel}.answer doit désigner un choix existant.`);
    }
    if (!question.source ||
      question.source.videoId !== quiz.videoId ||
      !Number.isFinite(question.source.startSeconds) ||
      !Number.isFinite(question.source.endSeconds) ||
      question.source.startSeconds < 0 ||
      question.source.endSeconds < question.source.startSeconds ||
      question.at < question.source.startSeconds ||
      question.at > question.source.endSeconds) {
      throw new Error(`QCM préparé invalide (${fileName}) : ${questionLabel}.source doit référencer un extrait de la vidéo.`);
    }
  }
}

const videoIds = new Set();
const quizIds = new Set();

export const approvedPreparedQuizzes = Object.entries(preparedQuizModules)
  .map(([fileName, quiz]) => {
    if (!quiz || quiz.status !== 'approved') {
      throw new Error(`QCM préparé invalide (${fileName}) : status doit valoir « approved ».`);
    }

    validateApprovedQuiz(quiz, fileName);
    if (videoIds.has(quiz.videoId)) {
      throw new Error(`QCM préparé invalide (${fileName}) : un QCM approuvé existe déjà pour ${quiz.videoId}.`);
    }
    if (quizIds.has(quiz.id)) {
      throw new Error(`QCM préparé invalide (${fileName}) : identifiant de QCM dupliqué « ${quiz.id} ».`);
    }
    videoIds.add(quiz.videoId);
    quizIds.add(quiz.id);
    return quiz;
  });

export function getApprovedPreparedQuizForVideo(videoId) {
  return approvedPreparedQuizzes.find(quiz => quiz.videoId === videoId) ?? null;
}

export function getApprovedPreparedQuiz(id, videoId) {
  if (!id || !videoId) return null;
  return approvedPreparedQuizzes.find(quiz => quiz.id === id && quiz.videoId === videoId) ?? null;
}
