import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ error: 'Username or email already taken' });
    const user = await User.create({ username, email, password, fullName });
    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: { id: user._id, username, email, fullName, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user._id.toString());
    res.json({ token, user: { id: user._id, username: user.username, email, fullName: user.fullName, avatar: user.avatar } });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};
