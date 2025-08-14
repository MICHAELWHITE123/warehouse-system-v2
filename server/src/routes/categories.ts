import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateCategory, validateUpdateCategory } from '../middleware/validation';

const router = Router();
const categoryController = new CategoryController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/categories - Получить список категорий
router.get('/', categoryController.getAll);

// GET /api/categories/:id - Получить категорию по ID
router.get('/:id', categoryController.getById);

// POST /api/categories - Создать новую категорию
router.post('/', requireRole(['admin', 'manager']), validateCreateCategory, categoryController.create);

// PUT /api/categories/:id - Обновить категорию
router.put('/:id', requireRole(['admin', 'manager']), validateUpdateCategory, categoryController.update);

// DELETE /api/categories/:id - Удалить категорию
router.delete('/:id', requireRole(['admin', 'manager']), categoryController.delete);

export default router;
