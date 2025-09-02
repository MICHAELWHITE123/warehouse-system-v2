import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Базовые маршруты
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Warehouse Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      status: 'healthy',
      database: 'supabase',
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

// Простые API endpoints для тестирования
app.get('/api/test', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Обработка ошибок 404
app.use('*', (req: express.Request, res: express.Response) => {
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
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Запускаем сервер только если это не Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

// Экспортируем для Vercel
export default app;
