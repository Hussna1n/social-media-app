import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Post from '../models/Post';
import User from '../models/User';

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const feedIds = [...user.following, user._id];
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ author: { $in: feedIds }, visibility: { $ne: 'private' } })
      .populate('author', 'username fullName avatar isVerified')
      .populate('comments.author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    res.json(posts);
  } catch { res.status(500).json({ error: 'Failed to fetch feed' }); }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, visibility } = req.body;
    const images = (req.files as Express.Multer.File[])?.map(f => f.path) || [];
    const post = await Post.create({ author: req.userId, content, images, visibility });
    await post.populate('author', 'username fullName avatar');
    res.status(201).json(post);
  } catch { res.status(500).json({ error: 'Failed to create post' }); }
};

export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userId = req.userId!;
    const likeIndex = post.likes.findIndex(id => id.toString() === userId);
    if (likeIndex > -1) post.likes.splice(likeIndex, 1);
    else post.likes.push(userId as any);
    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch { res.status(500).json({ error: 'Failed to like post' }); }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ author: req.userId as any, content: req.body.content, likes: [], createdAt: new Date() });
    await post.save();
    await post.populate('comments.author', 'username avatar');
    res.json(post.comments[post.comments.length - 1]);
  } catch { res.status(500).json({ error: 'Failed to add comment' }); }
};

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.userId), User.findById(req.params.id)
    ]);
    if (!currentUser || !targetUser) return res.status(404).json({ error: 'User not found' });
    const isFollowing = currentUser.following.includes(targetUser._id as any);
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id) as any;
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.userId) as any;
    } else {
      currentUser.following.push(targetUser._id as any);
      targetUser.followers.push(currentUser._id as any);
    }
    await Promise.all([currentUser.save(), targetUser.save()]);
    res.json({ following: !isFollowing, followerCount: targetUser.followers.length });
  } catch { res.status(500).json({ error: 'Failed to follow user' }); }
};
