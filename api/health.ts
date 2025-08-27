import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Проверяем переменные окружения
    const envCheck = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };

    // Базовая информация о системе
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 'N/A',
      memory: process.memoryUsage ? process.memoryUsage() : 'N/A',
      nodeVersion: process.version || 'N/A'
    };

    const response = {
      status: 'healthy',
      message: 'WeareHouse API is running',
      environment: envCheck,
      system: systemInfo,
      endpoints: {
        health: '/api/health',
        realtime_notify: '/api/realtime/notify'
      }
    };

    res.status(200).json(response);

  } catch (error) {
    const errorResponse = {
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
}
