import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BaseController } from './BaseController';
import { UserModel } from '../models/UserModel';
import { DeviceModel, CreateDevice } from '../models/DeviceModel';
import { CreateUser } from '../types/database';

export class AuthController extends BaseController {
  private userModel = new UserModel();
  private deviceModel = new DeviceModel();

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Найти пользователя по username или email
      const user = await this.userModel.findByUsernameOrEmail(username);
      
      if (!user) {
        this.unauthorized(res, 'Invalid credentials');
        return;
      }

      if (!user.is_active) {
        this.forbidden(res, 'Account is disabled');
        return;
      }

      // Проверить пароль
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        this.unauthorized(res, 'Invalid credentials');
        return;
      }

      // Создать JWT токен
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = user;

      this.success(res, {
        user: userWithoutPassword,
        token
      }, 'Login successful');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUser = req.body;

      // Проверить, что пользователь с таким username/email не существует
      const existingUser = await this.userModel.findByUsernameOrEmail(userData.username);
      if (existingUser) {
        this.error(res, 'User with this username or email already exists', 409);
        return;
      }

      const existingEmail = await this.userModel.findByUsernameOrEmail(userData.email);
      if (existingEmail) {
        this.error(res, 'User with this email already exists', 409);
        return;
      }

      // Хешировать пароль
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Создать пользователя
      const newUser = await this.userModel.create({
        ...userData,
        password: passwordHash
      });

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = newUser;

      this.success(res, userWithoutPassword, 'User registered successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    // В базовой реализации просто возвращаем успех
    // В реальном приложении здесь можно добавить blacklist токенов
    this.success(res, null, 'Logged out successfully');
  };

  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const user = await this.userModel.findById(userId);
      
      if (!user) {
        this.notFound(res, 'User');
        return;
      }

      // Убрать пароль из ответа
      const { password_hash, ...userWithoutPassword } = user;
      
      this.success(res, userWithoutPassword);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        this.error(res, 'Token is required');
        return;
      }

      // Верифицировать токен
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Создать новый токен
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          username: decoded.username, 
          role: decoded.role 
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      this.success(res, { token: newToken }, 'Token refreshed successfully');

    } catch (error) {
      this.unauthorized(res, 'Invalid or expired token');
    }
  };

  public registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const { device_id, device_name, device_type, platform } = req.body;

      // Проверить, не зарегистрировано ли уже это устройство
      const existingDevice = await this.deviceModel.findByDeviceId(device_id);
      
      if (existingDevice) {
        if (existingDevice.user_id !== userId) {
          this.error(res, 'Device is already registered to another user', 409);
          return;
        }
        
        // Если устройство уже принадлежит пользователю, активируем его
        const updatedDevice = await this.deviceModel.update(existingDevice.id, {
          device_name,
          device_type,
          platform,
          is_active: true,
          last_sync: new Date()
        });
        
        this.success(res, updatedDevice, 'Device reactivated successfully');
        return;
      }

      // Создать новое устройство
      const deviceData: CreateDevice = {
        user_id: userId,
        device_id,
        device_name,
        device_type,
        platform
      };

      const newDevice = await this.deviceModel.create(deviceData);

      this.success(res, newDevice, 'Device registered successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
