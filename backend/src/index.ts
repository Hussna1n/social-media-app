import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import routes from './routes';

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });

app.use(cors()); app.use(express.json());
app.use('/api', routes);

io.on('connection', socket => {
  const userId = socket.handshake.auth.userId;
  socket.join(userId);
  socket.on('send_message', async ({ receiverId, content }) => {
    io.to(receiverId).emit('new_message', { senderId: userId, content, createdAt: new Date() });
  });
  socket.on('typing', ({ receiverId }) => {
    io.to(receiverId).emit('user_typing', { userId });
  });
  socket.on('disconnect', () => {
    io.emit('user_offline', { userId });
  });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media')
  .then(() => server.listen(5000, () => console.log('Server running on port 5000')));
