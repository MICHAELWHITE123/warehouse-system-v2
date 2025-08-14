import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateLogin, validateRegister } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

// POST /api/auth/login - Авторизация пользователя
router.post('/login', validateLogin, authController.login);

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', validateRegister, authController.register);

// POST /api/auth/logout - Выход из системы
router.post('/logout', authController.logout);

// GET /api/auth/me - Получение информации о текущем пользователе
router.get('/me', authController.getCurrentUser);

// POST /api/auth/refresh - Обновление токена
router.post('/refresh', authController.refreshToken);

export default router;
