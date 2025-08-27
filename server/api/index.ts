import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Базовые маршруты
app.get('/', (req, res) => {
  res.json({
    message: 'Warehouse Management System API',
    version: '2.0.0',
    status: 'running',
    features: ['auth', 'sync', 'devices', 'inventory']
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: 'not_tested',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoints',
    version: '2.0.0',
    endpoints: [
      'GET /',
      'GET /health',
      'GET /api'
    ]
  });
});

// Обработка ошибок 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Глобальная обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export для Vercel
export default app;
