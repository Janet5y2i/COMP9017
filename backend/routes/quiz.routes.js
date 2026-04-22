import { Router } from 'express';
import {
  getLeaderboard,
  getMyAttempts,
  getQuiz,
  submitQuiz
} from '../controllers/quiz.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { quizSubmitLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.get('/questions', requireAuth, getQuiz);
router.post('/submit', requireAuth, quizSubmitLimiter, submitQuiz);
router.get('/attempts/me', requireAuth, getMyAttempts);
router.get('/leaderboard', getLeaderboard);

export default router;

