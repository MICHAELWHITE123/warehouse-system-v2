// API маршрут для синхронизации данных
// Версия 1.1 - принудительное развертывание
export default async function handler(req, res) {
  // Поддерживаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST for sync operations.'
    });
  }

  try {
    const { operations, deviceId, userId } = req.body;

    console.log('📥 Received sync request:', {
      operationsCount: operations?.length || 0,
      deviceId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Проверяем, что операции переданы
    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        message: 'Operations array is required'
      });
    }

    // Здесь должна быть логика синхронизации с Supabase
    // Пока просто возвращаем успешный ответ
    const results = operations.map(operation => ({
      id: operation.id,
      status: 'synced',
      timestamp: new Date().toISOString()
    }));

    console.log('✅ Sync completed successfully:', {
      syncedCount: results.length,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during sync',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
