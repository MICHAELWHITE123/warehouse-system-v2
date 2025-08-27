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

// Legacy endpoint БЕЗ авторизации для обратной совместимости
/**
 * @route GET /api/sync/operations
 * @desc Legacy PULL операции (без авторизации для старых клиентов)
 * @access Public (Legacy compatibility)
 */
router.get('/operations', async (req, res) => {
  try {
    const { deviceId, lastSync } = req.query;
    const lastSyncTime = parseInt(lastSync as string) || 0;
    
    console.log(`📥 Legacy PULL: device=${deviceId}, lastSync=${lastSyncTime}`);
    
    // Пока возвращаем пустой массив операций
    const operations: any[] = [];
    
    console.log(`📤 Legacy PULL: Returned ${operations.length} operations to device ${deviceId}`);
    
    return res.status(200).json({
      operations,
      serverTime: Date.now(),
      debug: {
        message: 'Legacy endpoint without auth',
        deviceId,
        lastSyncTime,
        note: 'This endpoint is for backward compatibility'
      }
    });
    
  } catch (error) {
    console.error('❌ Legacy Operations API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch operations',
      legacy: true 
    });
  }
});

// Все остальные маршруты требуют авторизации
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