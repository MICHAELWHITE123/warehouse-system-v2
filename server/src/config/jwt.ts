import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  deviceId?: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || 'your_secure_jwt_secret_key_here_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, jwtConfig.secret, { 
    expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn']
  });
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, jwtConfig.secret, { 
    expiresIn: jwtConfig.refreshExpiresIn as jwt.SignOptions['expiresIn']
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, jwtConfig.secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
