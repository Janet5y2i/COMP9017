import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ok, fail } from '../utils/envelope.js';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function register(req, res, next) {
  try {
    // TODO(auth): validate body with Zod, hash password, create player user.
    return fail(res, 'TODO: implement user registration.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    // TODO(auth): validate credentials, compare password, return JWT.
    return fail(res, 'TODO: implement login.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  return ok(res, { user: req.user });
}

export { signToken };

