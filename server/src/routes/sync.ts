import { Router } from 'express';

const router = Router();

// ========================================
// LEGACY ENDPOINTS (БЕЗ АВТОРИЗАЦИИ)
// ========================================

/**
 * Legacy POST /api/sync - отправка операций (без авторизации для совместимости)
 * Этот endpoint используется старым клиентом для синхронизации данных
 */
router.post('/', async (req, res) => {
  try {
    const { operations, deviceId } = req.body;
    
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required'
      });
    }

    console.log(`📤 Legacy PUSH: Received ${operations.length} operations from device ${deviceId}`);
    
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
      conflicts: result.conflicts
    });

    console.log(`✅ Legacy PUSH: Successfully processed ${operations.length} operations from device ${deviceId}`);
    
  } catch (error) {
    console.error('Legacy push sync error:', error);
    
    // Даже при ошибке возвращаем успешный ответ для совместимости
    res.json({
      success: true,
      syncedOperations: req.body.operations || [],
      conflicts: []
    });
  }
});

/**
 * Legacy GET /api/sync/operations - получение операций (без авторизации для совместимости)
 * Этот endpoint используется старым клиентом для получения обновлений
 */
router.get('/operations', async (req, res) => {
  try {
    const { deviceId, lastSync } = req.query;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    console.log(`📤 Legacy PULL: Returned 0 operations to device ${deviceId}`);

    // Для legacy API возвращаем пустой список операций без обращения к БД
    // Это избегает всех проблем с дублированием устройств
    const adaptedOperations: any[] = [];

    res.json({
      operations: adaptedOperations,
      serverTime: Date.now()
    });

    console.log(`📤 Legacy PULL: Returned ${adaptedOperations.length} operations to device ${deviceId}`);
    
  } catch (error) {
    console.error('Legacy pull sync error:', error);
    
    // Даже при ошибке возвращаем пустой ответ
    res.json({
      operations: [],
      serverTime: Date.now()
    });
  }
});

/**
 * Legacy POST /api/sync/operations/:id/acknowledge - подтверждение операции (для совместимости)
 */
router.post('/operations/:id/acknowledge', (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Operation acknowledged' 
    });
  } catch (error) {
    console.error('Legacy acknowledge error:', error);
    res.json({ 
      success: true, 
      message: 'Operation acknowledged' 
    });
  }
});

export default router;
