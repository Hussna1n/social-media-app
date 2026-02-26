import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

mongoose.connect(process.env.MONGODB_URI!).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 3000, () =>
    console.log(`Server running on port ${process.env.PORT || 3000}`)
  );
}).catch(err => { console.error(err); process.exit(1); });
