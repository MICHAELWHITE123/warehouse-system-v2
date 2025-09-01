import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './config/database-postgresql';
import { migrator } from './database/migrator';
import apiRoutes from './routes';
import { apiRateLimit } from './middleware/rateLimit';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:4174',
    'http://localhost:4175',
    'http://localhost:4176',
    'https://warehouse-system-v2.vercel.app',
    'https://warehouse-system-v2.vercel.app/',
    'https://warehouse-frontend-two.vercel.app',
    'https://warehouse-frontend-two.vercel.app/',
    ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Device-ID']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting для всех API запросов
if (process.env.RATE_LIMIT_ENABLED === 'true') {
  app.use('/api', apiRateLimit);
  console.log('🛡️ Rate limiting enabled for API endpoints');
}

// API маршруты
app.use('/api', apiRoutes);

// Базовые маршруты
app.get('/', (req, res) => {
  res.json({
    message: 'Warehouse Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Обработка ошибок 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
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

// Функция запуска сервера
async function startServer() {
  try {
    console.log('🚀 Starting Warehouse Management System server...');
    
    // Проверяем подключение к базе данных
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    // Выполняем миграции
    console.log('📊 Running database migrations...');
    await migrator.runMigrations();
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Запускаем сервер
startServer();
