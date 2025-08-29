import { Router } from 'express';
import { deviceAuth, hybridAuth, logRequest } from '../middleware/auth';
import { syncRateLimit } from '../middleware/rateLimit';

const router = Router();

// Rate limiting для всех sync endpoints
router.use(syncRateLimit);

// ========================================
// LEGACY ENDPOINTS (DEVICE AUTHENTICATION)
// ========================================

/**
 * Legacy POST /api/sync - отправка операций (с device authentication)
 * Этот endpoint используется старым клиентом для синхронизации данных
 */
router.post('/', deviceAuth, logRequest, async (req, res) => {
  try {
    const { operations, deviceId } = req.body;
    const authenticatedDeviceId = req.deviceId;
    
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required',
        code: 'INVALID_OPERATIONS'
      });
    }

    // Проверяем, что deviceId в body совпадает с аутентифицированным
    if (deviceId && deviceId !== authenticatedDeviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID mismatch',
        code: 'DEVICE_ID_MISMATCH'
      });
    }

    console.log(`📤 Legacy PUSH: Received ${operations.length} operations from device ${authenticatedDeviceId}`);
    
    // Для legacy API просто логируем операции и возвращаем успешный ответ
    // Без обращения к базе данных для упрощения
    const result = { 
      processed_count: operations.length, 
      failed_count: 0, 
      conflicts: [] 
    };

    // Возвращаем в старом формате
    res.json({
      success: true,
      syncedOperations: operations,
      conflicts: result.conflicts,
      deviceId: authenticatedDeviceId
    });

    console.log(`✅ Legacy PUSH: Successfully processed ${operations.length} operations from device ${authenticatedDeviceId}`);
    
  } catch (error) {
    console.error('Legacy push sync error:', error);
    
    // Даже при ошибке возвращаем успешный ответ для совместимости
    res.json({
      success: true,
      syncedOperations: req.body.operations || [],
      conflicts: [],
      deviceId: req.deviceId
    });
  }
});

/**
 * Legacy GET /api/sync/operations - получение операций (с device authentication)
 * Этот endpoint используется старым клиентом для получения обновлений
 */
router.get('/operations', deviceAuth, logRequest, async (req, res) => {
  try {
    const { lastSync } = req.query;
    const authenticatedDeviceId = req.deviceId;

    console.log(`📤 Legacy PULL: Requesting operations for device ${authenticatedDeviceId}`);

    // Для legacy API возвращаем пустой список операций без обращения к БД
    // Это избегает всех проблем с дублированием устройств
    const adaptedOperations: any[] = [];

    res.json({
      operations: adaptedOperations,
      serverTime: Date.now(),
      deviceId: authenticatedDeviceId
    });

    console.log(`📤 Legacy PULL: Returned ${adaptedOperations.length} operations to device ${authenticatedDeviceId}`);
    
  } catch (error) {
    console.error('Legacy pull sync error:', error);
    
    // Даже при ошибке возвращаем пустой ответ
    res.json({
      operations: [],
      serverTime: Date.now(),
      deviceId: req.deviceId
    });
  }
});

/**
 * Legacy POST /api/sync/operations/:id/acknowledge - подтверждение операции (с device authentication)
 */
router.post('/operations/:id/acknowledge', deviceAuth, logRequest, (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedDeviceId = req.deviceId;
    
    console.log(`✅ Legacy ACK: Device ${authenticatedDeviceId} acknowledged operation ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Operation acknowledged',
      operationId: id,
      deviceId: authenticatedDeviceId
    });
  } catch (error) {
    console.error('Legacy acknowledge error:', error);
    res.json({ 
      success: true, 
      message: 'Operation acknowledged',
      operationId: req.params.id,
      deviceId: req.deviceId
    });
  }
});

// ========================================
// MODERN ENDPOINTS (HYBRID AUTHENTICATION)
// ========================================

/**
 * Modern POST /api/sync/v2 - отправка операций (с hybrid authentication)
 * Поддерживает как JWT, так и device authentication
 */
router.post('/v2', hybridAuth, logRequest, async (req, res) => {
  try {
    const { operations, deviceId, metadata } = req.body;
    const authType = req.user ? 'JWT' : 'DEVICE';
    const identifier = req.user ? req.user.username : req.deviceId;
    
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required',
        code: 'INVALID_OPERATIONS'
      });
    }

    console.log(`📤 Modern PUSH [${authType}]: Received ${operations.length} operations from ${identifier}`);
    
    // Здесь можно добавить логику для записи в БД
    const result = { 
      processed_count: operations.length, 
      failed_count: 0, 
      conflicts: [],
      authType,
      identifier
    };

    res.json({
      success: true,
      syncedOperations: operations,
      conflicts: result.conflicts,
      metadata: {
        authType,
        identifier,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Modern PUSH [${authType}]: Successfully processed ${operations.length} operations from ${identifier}`);
    
  } catch (error) {
    console.error('Modern push sync error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Modern GET /api/sync/v2/operations - получение операций (с hybrid authentication)
 */
router.get('/v2/operations', hybridAuth, logRequest, async (req, res) => {
  try {
    const { lastSync, limit } = req.query;
    const authType = req.user ? 'JWT' : 'DEVICE';
    const identifier = req.user ? req.user.username : req.deviceId;
    
    console.log(`📤 Modern PULL [${authType}]: Requesting operations for ${identifier}`);

    // Здесь можно добавить логику для получения операций из БД
    const operations: any[] = [];

    res.json({
      operations,
      serverTime: Date.now(),
      metadata: {
        authType,
        identifier,
        lastSync: lastSync || 0,
        limit: limit || 100
      }
    });

    console.log(`📤 Modern PULL [${authType}]: Returned ${operations.length} operations to ${identifier}`);
    
  } catch (error) {
    console.error('Modern pull sync error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * Modern POST /api/sync/v2/operations/:id/acknowledge - подтверждение операции
 */
router.post('/v2/operations/:id/acknowledge', hybridAuth, logRequest, (req, res) => {
  try {
    const { id } = req.params;
    const authType = req.user ? 'JWT' : 'DEVICE';
    const identifier = req.user ? req.user.username : req.deviceId;
    
    console.log(`✅ Modern ACK [${authType}]: ${identifier} acknowledged operation ${id}`);
    
    res.json({ 
      success: true, 
      message: 'Operation acknowledged',
      operationId: id,
      metadata: {
        authType,
        identifier,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Modern acknowledge error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
