import { Router } from 'express';
import { auth } from '../middleware/auth';
import { SyncController } from '../controllers/SyncController';

const router = Router();
const syncController = new SyncController();

// Все маршруты требуют авторизации
router.use(auth);

// POST /api/sync - Синхронизация операций
router.post('/', syncController.syncOperations);

// GET /api/sync/status - Получить статус синхронизации
router.get('/status', syncController.getSyncStatus);

// GET /api/sync/conflicts - Получить список конфликтов
router.get('/conflicts', syncController.getConflicts);

// POST /api/sync/conflicts/:id/resolve - Разрешить конфликт
router.post('/conflicts/:id/resolve', syncController.resolveConflict);

// GET /api/sync/operations - Получить операции для синхронизации
router.get('/operations', syncController.getOperations);

// POST /api/sync/operations/:id/ack - Подтвердить получение операции
router.post('/operations/:id/ack', syncController.acknowledgeOperation);

export default router;
