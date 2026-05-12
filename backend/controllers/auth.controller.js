import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ok, fail } from '../utils/envelope.js';
import { z } from 'zod';  

// register validation spec

const registerSchema = z.object({
  username : z.string().min(3, "Username must be at least 3 characters"),
  email : z.string().email("Invalid email address"),
  password : z.string().min(6, "Password must be at least 6 characters"),
  role : z.enum(['player', 'admin']).optional().default('player')
})

const loginSchema = z.object({
  email : z.string().email("Invalid email address"),
  password : z.string().min(6, "Password must be at least 6 characters"),
})

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
    // Basic validation
    const validData = registerSchema.parse(req.body);
    
    const {username, email, password, role} = validData;
    

    // Check if email is already in use
    const isExistEmail = await User.findOne({email});
    if (isExistEmail) {
      return fail(res, 'Email already in use.', 400);
    }

    // Hash the password before saving
    const hashPassword = await User.hashPassword(password);

    // Create and save the new user
    const newUser = new User({ username, email, passwordHash: hashPassword, role: role});
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

    const validData = loginSchema.parse(req.body);
    const {email, password} = validData;

    const user = await User.findOne({email});
    if (!user||!(await user.comparePassword(password))) {
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

