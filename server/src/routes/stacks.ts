import { Router } from 'express';
import { StackController } from '../controllers/StackController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateStack, validateUpdateStack } from '../middleware/validation';

const router = Router();
const stackController = new StackController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/stacks - Получить список стеков
router.get('/', stackController.getAll);

// GET /api/stacks/:id - Получить стек по ID с оборудованием
router.get('/:id', stackController.getById);

// POST /api/stacks - Создать новый стек
router.post('/', validateCreateStack, stackController.create);

// PUT /api/stacks/:id - Обновить стек
router.put('/:id', validateUpdateStack, stackController.update);

// DELETE /api/stacks/:id - Удалить стек
router.delete('/:id', requireRole(['admin', 'manager']), stackController.delete);

// POST /api/stacks/:id/equipment - Добавить оборудование в стек
router.post('/:id/equipment', stackController.addEquipment);

// DELETE /api/stacks/:id/equipment/:equipmentId - Удалить оборудование из стека
router.delete('/:id/equipment/:equipmentId', stackController.removeEquipment);

export default router;
