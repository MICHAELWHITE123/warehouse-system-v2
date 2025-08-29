import { Request, Response, NextFunction } from 'express';
import { verifyToken, decodeToken, JWTPayload } from '../config/jwt';

// Расширение типа Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      deviceId?: string;
    }
  }
}

// Middleware для проверки JWT токена
export const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

// Middleware для проверки device authentication (без JWT)
export const deviceAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const deviceId = req.header('X-Device-ID') || req.query.deviceId || req.body.deviceId;
    
    if (!deviceId) {
      res.status(401).json({
        success: false,
        message: 'Device ID is required for device authentication.',
        code: 'NO_DEVICE_ID'
      });
      return;
    }

    // Проверяем формат device ID (должен начинаться с "device_")
    if (typeof deviceId === 'string' && !deviceId.startsWith('device_')) {
      res.status(400).json({
        success: false,
        message: 'Invalid device ID format. Must start with "device_"',
        code: 'INVALID_DEVICE_ID_FORMAT'
      });
      return;
    }

    req.deviceId = deviceId as string;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Device authentication failed.',
      code: 'DEVICE_AUTH_FAILED'
    });
  }
};

// Middleware для гибридной авторизации (JWT или Device ID)
export const hybridAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const deviceId = req.header('X-Device-ID') || req.query.deviceId || req.body.deviceId;

    // Если есть JWT токен, используем его
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
        return;
      } catch (error) {
        // Если JWT невалиден, продолжаем с device auth
      }
    }

    // Если нет JWT или он невалиден, используем device authentication
    if (deviceId) {
      if (typeof deviceId === 'string' && !deviceId.startsWith('device_')) {
        res.status(400).json({
          success: false,
          message: 'Invalid device ID format. Must start with "device_"',
          code: 'INVALID_DEVICE_ID_FORMAT'
        });
        return;
      }
      req.deviceId = deviceId as string;
      next();
      return;
    }

    // Если нет ни JWT, ни device ID
    res.status(401).json({
      success: false,
      message: 'Authentication required. Provide either JWT token or Device ID.',
      code: 'NO_AUTH'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

// Middleware для проверки ролей
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        code: 'NO_USER'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

// Middleware для проверки, что пользователь может редактировать ресурс
export const requireOwnershipOrRole = (roles: string[] = ['admin']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
        code: 'NO_USER'
      });
      return;
    }

    // Проверить роль или владение ресурсом
    const resourceUserId = parseInt(req.params.userId || req.body.userId);
    const isOwner = req.user.userId === resourceUserId;
    const hasRole = roles.includes(req.user.role);

    if (!isOwner && !hasRole) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own resources or need admin privileges.',
        code: 'NO_OWNERSHIP_OR_ROLE'
      });
      return;
    }

    next();
  };
};

// Middleware для логирования запросов
export const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  const authType = req.user ? 'JWT' : req.deviceId ? 'DEVICE' : 'NONE';
  const identifier = req.user ? req.user.username : req.deviceId || 'unknown';
  
  console.log(`🔐 [${authType}] ${req.method} ${req.path} - ${identifier}`);
  next();
};
