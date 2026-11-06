import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import historicalRoutes from './routes/historicalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import excelRoutes from './routes/excelRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io for real-time dashboard updates
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Provide Socket.io to request objects
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/historical', historicalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', excelRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'PEACHWAVE Workforce Management System',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('⚡ Client connected to PEACHWAVE Real-time Gateway:', socket.id);

  socket.on('attendance:update', (data) => {
    io.emit('dashboard:refresh', data);
  });

  socket.on('disconnect', () => {
    // client disconnected
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🌊 PEACHWAVE Backend listening on port ${PORT}`);
    console.log(`📍 API Base: http://localhost:${PORT}/api`);
  });
}

startServer();

export { app, server, io };

