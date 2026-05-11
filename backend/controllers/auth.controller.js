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
    const {username, email, password, role} = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return fail(res, 'Username, email and password are required.', 400);
    }

    // Check if email is already in use
    const isExistEmail = await User.findOne({email});
    if (isExistEmail) {
      return fail(res, 'Email already in use.', 400);
    }

    // Hash the password before saving
    const hashPassword = await User.hashPassword(password);

    // Create and save the new user
    const newUser = new User({ username, email, passwordHash: hashPassword, role: role || 'player' });
    await newUser.save();

    return ok(res, { message: 'User registered successfully.' });
    // return fail(res, 'TODO: implement user registration.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    // TODO(auth): validate credentials, compare password, return JWT.
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if (!user) {
      return fail(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return fail(res, 'Invalid email or password.', 401);
    }

    const token = signToken(user);

    return ok(res, { 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
      });
    //return fail(res, 'TODO: implement login.', 501);
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  return ok(res, { user: req.user });
}

export { signToken };

