import z from 'zod';
import { fail } from '../utils/envelope.js';

export function notFound(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(error, _req, res, _next) {
  // Check for Zod validation error
  if (error instanceof z.ZodError) {
    return fail(res, "Invalid request body", 400);
  }

  const status = error.statusCode || 500;
  const message = status === 500 ? 'Internal server error.' : error.message;
  return fail(res, message, status);
}

