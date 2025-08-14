import { Router } from 'express';
import { ShipmentController } from '../controllers/ShipmentController';
import { auth, requireRole } from '../middleware/auth';
import { validateCreateShipment, validateUpdateShipment } from '../middleware/validation';

const router = Router();
const shipmentController = new ShipmentController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/shipments - Получить список отгрузок
router.get('/', shipmentController.getAll);

// GET /api/shipments/:id - Получить отгрузку по ID
router.get('/:id', shipmentController.getById);

// POST /api/shipments - Создать новую отгрузку
router.post('/', validateCreateShipment, shipmentController.create);

// PUT /api/shipments/:id - Обновить отгрузку
router.put('/:id', validateUpdateShipment, shipmentController.update);

// DELETE /api/shipments/:id - Удалить отгрузку
router.delete('/:id', requireRole(['admin', 'manager']), shipmentController.delete);

// PATCH /api/shipments/:id/status - Изменить статус отгрузки
router.patch('/:id/status', shipmentController.updateStatus);

// POST /api/shipments/:id/checklist - Добавить пункт в чек-лист
router.post('/:id/checklist', shipmentController.addChecklistItem);

// PUT /api/shipments/:id/checklist/:itemId - Обновить пункт чек-листа
router.put('/:id/checklist/:itemId', shipmentController.updateChecklistItem);

// DELETE /api/shipments/:id/checklist/:itemId - Удалить пункт чек-листа
router.delete('/:id/checklist/:itemId', shipmentController.deleteChecklistItem);

// POST /api/shipments/:id/rental - Добавить аренду в отгрузку
router.post('/:id/rental', shipmentController.addRental);

// PUT /api/shipments/:id/rental/:rentalId - Обновить аренду
router.put('/:id/rental/:rentalId', shipmentController.updateRental);

// DELETE /api/shipments/:id/rental/:rentalId - Удалить аренду
router.delete('/:id/rental/:rentalId', shipmentController.deleteRental);

export default router;
