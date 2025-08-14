import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateUser, validateUpdateUser } from '../middleware/validation';

const router = Router();
const userController = new UserController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/users - Получить список пользователей (только админы и менеджеры)
router.get('/', requireRole(['admin', 'manager']), userController.getAll);

// GET /api/users/:id - Получить пользователя по ID
router.get('/:id', userController.getById);

// POST /api/users - Создать нового пользователя (только админы)
router.post('/', requireRole(['admin']), validateCreateUser, userController.create);

// PUT /api/users/:id - Обновить пользователя
router.put('/:id', validateUpdateUser, userController.update);

// DELETE /api/users/:id - Удалить пользователя (только админы)
router.delete('/:id', requireRole(['admin']), userController.delete);

export default router;
