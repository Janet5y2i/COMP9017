import { fail } from '../utils/envelope.js';

export async function getQuiz(req, res, next) {
  try {
    // TODO(quiz): fetch 6-10 active questions, shuffle randomly, hide correctAnswer.
    return fail(res, 'TODO: implement quiz question retrieval.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function submitQuiz(req, res, next) {
  try {
    // TODO(quiz): validate answers, calculate score, save Score with full answer list.
    return fail(res, 'TODO: implement quiz submission.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function getMyAttempts(req, res, next) {
  try {
    // TODO(quiz): return authenticated user's previous attempts.
    return fail(res, 'TODO: implement user attempt history.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    // TODO(quiz): return username + score sorted highest first.
    return fail(res, 'TODO: implement leaderboard.', 501);
  } catch (error) {
    return next(error);
  }
}

