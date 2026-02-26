import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  image?: string;
  likes: mongoose.Types.ObjectId[];
  comments: {
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}

const PostSchema = new Schema<IPost>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 2200 },
  image: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ content: 'text' });

export default mongoose.model<IPost>('Post', PostSchema);
