import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import ticketRoutes from './routes/ticketRoutes';
import { setupSocketHandlers } from './sockets/socketManager';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

// Make io available to controllers
app.set('io', io);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Root health check route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/tickets', ticketRoutes);

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } });
});

setupSocketHandlers(io);

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ayushranjan9531_db_user:EB0PnHjNukn0UeA0@cluster0.gk9yvlg.mongodb.net/?appName=Cluster0';

    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB Atlas`);

    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
