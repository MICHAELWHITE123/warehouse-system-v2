import { Router } from 'express';
import { EquipmentController } from '../controllers/EquipmentController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateEquipment, validateUpdateEquipment } from '../middleware/validation';

const router = Router();
const equipmentController = new EquipmentController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/equipment - Получить список оборудования с фильтрацией и пагинацией
router.get('/', equipmentController.getAll);

// GET /api/equipment/search - Поиск оборудования
router.get('/search', equipmentController.search);

// GET /api/equipment/:id - Получить оборудование по ID
router.get('/:id', equipmentController.getById);

// POST /api/equipment - Создать новое оборудование
router.post('/', validateCreateEquipment, equipmentController.create);

// PUT /api/equipment/:id - Обновить оборудование
router.put('/:id', validateUpdateEquipment, equipmentController.update);

// DELETE /api/equipment/:id - Удалить оборудование
router.delete('/:id', requireRole(['admin', 'manager']), equipmentController.delete);

// PATCH /api/equipment/:id/status - Изменить статус оборудования
router.patch('/:id/status', equipmentController.updateStatus);

export default router;
