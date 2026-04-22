import rateLimit from 'express-rate-limit';
import { fail } from '../utils/envelope.js';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => fail(res, 'Too many login attempts. Try again later.', 429)
});

export const quizSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => fail(res, 'Too many quiz submissions. Try again later.', 429)
});

