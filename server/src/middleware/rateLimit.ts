import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const createRateLimiter = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Очищаем старые записи
    if (store[key] && now > store[key].resetTime) {
      delete store[key];
    }
    
    // Инициализируем или обновляем счетчик
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs
      };
    } else {
      store[key].count++;
    }
    
    // Проверяем лимит
    if (store[key].count > config.maxRequests) {
      res.status(429).json({
        success: false,
        message: config.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
      return;
    }
    
    // Добавляем заголовки
    res.set({
      'X-RateLimit-Limit': config.maxRequests,
      'X-RateLimit-Remaining': Math.max(0, config.maxRequests - store[key].count),
      'X-RateLimit-Reset': store[key].resetTime
    });
    
    next();
  };
};

// Глобальный rate limiter для API
export const apiRateLimit = createRateLimiter({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '900000'), // 15 минут
  maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

// Rate limiter для sync endpoints
export const syncRateLimit = createRateLimiter({
  windowMs: 60000, // 1 минута
  maxRequests: 30, // 30 запросов в минуту
  message: 'Too many sync requests, please slow down.'
});

// Rate limiter для auth endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 300000, // 5 минут
  maxRequests: 5, // 5 попыток входа в 5 минут
  message: 'Too many authentication attempts, please try again later.'
});
