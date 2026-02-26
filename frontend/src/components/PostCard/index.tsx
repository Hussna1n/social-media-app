import { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppSelector } from '../../store/hooks';
import { useLikePostMutation, useDeletePostMutation, useAddCommentMutation } from '../../store/api';

interface Post {
  _id: string;
  content: string;
  image?: string;
  author: { _id: string; username: string; avatar?: string };
  likes: string[];
  comments: { _id: string; user: { username: string; avatar?: string }; text: string; createdAt: string }[];
  createdAt: string;
}

export default function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const currentUser = useAppSelector(s => s.auth.user);
  const [likePost] = useLikePostMutation();
  const [deletePost] = useDeletePostMutation();
  const [addComment] = useAddCommentMutation();

  const isLiked = currentUser ? post.likes.includes(currentUser._id) : false;
  const isOwner = currentUser?._id === post.author._id;

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment({ id: post._id, text: comment });
    setComment('');
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}`}
          className="w-10 h-10 rounded-full object-cover" alt={post.author.username} />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">@{post.author.username}</p>
          <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
        </div>
        {isOwner && (
          <button onClick={() => deletePost(post._id)} className="text-gray-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {post.image && <img src={post.image} alt="post" className="w-full max-h-96 object-cover" />}
      <div className="px-4 py-2">
        <p className="text-gray-800 text-sm leading-relaxed">{post.content}</p>
      </div>

      <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-50">
        <button onClick={() => likePost(post._id)}
          className={`flex items-center gap-1.5 text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}>
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          {post.likes.length}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400">
          <MessageCircle size={18} />
          {post.comments.length}
        </button>
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 ml-auto">
          <Share2 size={18} />
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 space-y-3">
          {post.comments.map(c => (
            <div key={c._id} className="flex gap-2">
              <img src={c.user.avatar || `https://ui-avatars.com/api/?name=${c.user.username}`}
                className="w-7 h-7 rounded-full" alt={c.user.username} />
              <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-700">@{c.user.username}</p>
                <p className="text-xs text-gray-600">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Write a comment..." className="flex-1 border rounded-full px-3 py-1.5 text-sm outline-none focus:border-blue-400" />
            <button type="submit" className="bg-blue-500 text-white text-sm px-4 py-1.5 rounded-full hover:bg-blue-600">Post</button>
          </form>
        </div>
      )}
    </article>
  );
}
