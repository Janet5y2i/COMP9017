import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { fail } from '../utils/envelope.js';

/**
 * This middleware is used to require authentication for an API route
 * before the route handler actually handle the requests.
 * 
 * Authentication is done via JWT as a Bearer token in the Authorization
 * header of the request.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return fail(res, 'Authentication token is required.', 401);
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      return fail(res, 'User no longer exists.', 401);
    }

    req.user = user;
    return next();
  } catch (_error) {
    return fail(res, 'Invalid or expired authentication token.', 401);
  }
}

