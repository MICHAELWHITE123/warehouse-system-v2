import { Router } from 'express';
import { auth } from '../middleware/auth';
import { SyncController } from '../controllers/SyncController';
import {
  validateSyncPush,
  validateSyncPull,
  validateSyncStatus,
  validateConflictResolution,
  validatePagination,
  validateSyncFilters
} from '../middleware/validation';

const router = Router();
const syncController = new SyncController();

// Все маршруты требуют авторизации
router.use(auth);

/**
 * @route POST /api/sync/push
 * @desc Отправка изменений с устройства на сервер (PUSH синхронизация)
 * @access Private
 */
router.post('/push', validateSyncPush, syncController.pushChanges);

/**
 * @route POST /api/sync/pull
 * @desc Получение изменений с сервера на устройство (PULL синхронизация)
 * @access Private
 */
router.post('/pull', validateSyncPull, syncController.pullChanges);

/**
 * @route GET /api/sync/status
 * @desc Получение статуса синхронизации пользователя
 * @access Private
 */
router.get('/status', validateSyncStatus, syncController.getSyncStatus);

/**
 * @route GET /api/sync/history
 * @desc Получение истории синхронизации с фильтрацией и пагинацией
 * @access Private
 */
router.get('/history', validatePagination, validateSyncFilters, syncController.getSyncHistory);

/**
 * @route GET /api/sync/conflicts
 * @desc Получение списка конфликтов синхронизации
 * @access Private
 */
router.get('/conflicts', syncController.getConflicts);

/**
 * @route GET /api/sync/conflicts/:id/recommendation
 * @desc Получение рекомендации по разрешению конфликта
 * @access Private
 */
router.get('/conflicts/:id/recommendation', syncController.getConflictRecommendation);

/**
 * @route POST /api/sync/conflicts/:id/resolve
 * @desc Разрешение конфликта синхронизации
 * @access Private
 */
router.post('/conflicts/:id/resolve', validateConflictResolution, syncController.resolveConflict);

/**
 * @route GET /api/sync/validate
 * @desc Проверка целостности данных синхронизации
 * @access Private
 */
router.get('/validate', syncController.validateSyncIntegrity);

/**
 * @route POST /api/sync/cleanup
 * @desc Очистка старых записей синхронизации (только для администраторов)
 * @access Private (Admin only)
 */
router.post('/cleanup', syncController.cleanupOldEntries);

/**
 * @route POST /api/sync/force/:deviceId
 * @desc Принудительная синхронизация конкретного устройства
 * @access Private
 */
router.post('/force/:deviceId', syncController.forceSync);

export default router;