// Тестовый PUSH endpoint через GET запрос (для обхода авторизации)
import { kv } from '@vercel/kv';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Добавляем CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { deviceId, action } = req.query;
      
      if (action === 'push') {
        // Создаем тестовую операцию для проверки записи в KV
        const testOperation = {
          id: 'test_push_' + Date.now(),
          table: 'equipment',
          operation: 'CREATE',
          data: {
            name: 'Test Equipment from PUSH',
            description: 'Created via test-push endpoint'
          },
          deviceId: deviceId || 'test_device_push',
          timestamp: Date.now(),
          userId: 'test_user'
        };
        
        console.log(`🧪 Test PUSH: Creating test operation from device ${testOperation.deviceId}`);
        
        try {
          // Сохраняем тестовую операцию в KV
          const key = `operation:${testOperation.id}`;
          await kv.set(key, {
            ...testOperation,
            receivedAt: new Date().toISOString()
          }, { ex: 86400 }); // TTL 1 день
          
          // Обновляем время последней синхронизации
          await kv.set(`lastSync:${testOperation.deviceId}`, Date.now(), { ex: 86400 });
          
          console.log(`✅ Test PUSH: Saved operation ${testOperation.id} to KV`);
          
          return res.status(200).json({
            success: true,
            message: 'Test operation created and saved to KV',
            operation: testOperation,
            kvStatus: 'connected',
            timestamp: new Date().toISOString()
          });
          
        } catch (kvError) {
          console.error('❌ KV Error in test-push:', kvError);
          return res.status(500).json({
            success: false,
            message: 'Failed to save to KV',
            kvError: kvError.message,
            operation: testOperation
          });
        }
        
      } else {
        // Возвращаем инструкции по использованию
        return res.status(200).json({
          success: true,
          message: 'Test PUSH endpoint',
          usage: 'Add ?action=push&deviceId=your_device to create test operation',
          example: '/api/sync/test-push?action=push&deviceId=test123'
        });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Test-push endpoint error:', error);
    return res.status(500).json({ 
      error: 'Test endpoint failed',
      details: error.message
    });
  }
}
