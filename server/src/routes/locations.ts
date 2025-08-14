import { Router } from 'express';
import { LocationController } from '../controllers/LocationController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateLocation, validateUpdateLocation } from '../middleware/validation';

const router = Router();
const locationController = new LocationController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/locations - Получить список местоположений
router.get('/', locationController.getAll);

// GET /api/locations/:id - Получить местоположение по ID
router.get('/:id', locationController.getById);

// POST /api/locations - Создать новое местоположение
router.post('/', requireRole(['admin', 'manager']), validateCreateLocation, locationController.create);

// PUT /api/locations/:id - Обновить местоположение
router.put('/:id', requireRole(['admin', 'manager']), validateUpdateLocation, locationController.update);

// DELETE /api/locations/:id - Удалить местоположение
router.delete('/:id', requireRole(['admin', 'manager']), locationController.delete);

export default router;
