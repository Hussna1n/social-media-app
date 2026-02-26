import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ $or: [{ email }, { username }] }))
      return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed });
    const token = signToken(user.id);
    res.status(201).json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user.id);
    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).userId)
    .populate('followers', 'username avatar')
    .populate('following', 'username avatar');
  res.json(user);
};

export const followUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const myId = (req as any).userId;
  await User.findByIdAndUpdate(id, { $addToSet: { followers: myId } });
  await User.findByIdAndUpdate(myId, { $addToSet: { following: id } });
  res.json({ message: 'Followed' });
};

export const unfollowUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const myId = (req as any).userId;
  await User.findByIdAndUpdate(id, { $pull: { followers: myId } });
  await User.findByIdAndUpdate(myId, { $pull: { following: id } });
  res.json({ message: 'Unfollowed' });
};
