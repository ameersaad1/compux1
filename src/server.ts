import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { registerChatSocket } from './sockets/chat.socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// إعداد CORS للاتصالات الآمنة
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// إعداد خادم Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// تسجيل أحداث الـ WebSockets
registerChatSocket(io);

// Middleware العالمي لمعالجة الأخطاءUncaught Exceptions
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Global Error:', err);
  return res.status(500).json({
    error: 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.',
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Compux Server is running on port ${PORT}`);
});
