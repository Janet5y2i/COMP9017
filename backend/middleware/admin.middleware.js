import { fail } from '../utils/envelope.js';

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return fail(res, 'Admin access required.', 403);
  }

  return next();
}

