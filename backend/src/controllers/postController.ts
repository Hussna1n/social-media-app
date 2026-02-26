import { Request, Response } from 'express';
import Post from '../models/Post';

export const getFeed = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit)
    .populate('author', 'username avatar')
    .populate('comments.user', 'username avatar');
  const total = await Post.countDocuments();
  res.json({ posts, total, pages: Math.ceil(total / +limit) });
};

export const createPost = async (req: Request, res: Response) => {
  const { content, image } = req.body;
  const post = await Post.create({ author: (req as any).userId, content, image });
  await post.populate('author', 'username avatar');
  res.status(201).json(post);
};

export const likePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).userId;
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter(l => l.toString() !== userId);
  } else {
    post.likes.push(userId);
  }
  await post.save();
  res.json({ likes: post.likes.length, isLiked: !isLiked });
};

export const addComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;
  const post = await Post.findByIdAndUpdate(
    id,
    { $push: { comments: { user: (req as any).userId, text } } },
    { new: true }
  ).populate('comments.user', 'username avatar');
  res.json(post?.comments);
};

export const deletePost = async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Not found' });
  if (post.author.toString() !== (req as any).userId)
    return res.status(403).json({ message: 'Unauthorized' });
  await post.deleteOne();
  res.json({ message: 'Deleted' });
};

export const searchPosts = async (req: Request, res: Response) => {
  const { q } = req.query;
  const posts = await Post.find({ $text: { $search: String(q) } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'username avatar');
  res.json(posts);
};
