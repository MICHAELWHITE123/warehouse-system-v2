// Тестовый endpoint для записи тестовых данных в KV
import { kv } from '@vercel/kv';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    if (req.method === 'POST') {
      console.log('🧪 Test: Writing sample data to KV...');
      
      const testDeviceId = 'test_device_' + Date.now();
      const testOperation = {
        id: 'test_op_' + Date.now(),
        table: 'equipment',
        operation: 'CREATE',
        data: {
          name: 'Test Equipment',
          description: 'Created by test endpoint'
        },
        deviceId: testDeviceId,
        timestamp: Date.now(),
        userId: 'test_user'
      };
      
      // Сохраняем тестовую операцию
      const key = `operation:${testOperation.id}`;
      await kv.set(key, {
        ...testOperation,
        receivedAt: new Date().toISOString()
      }, { ex: 86400 }); // TTL 1 день
      
      // Обновляем время последней синхронизации
      await kv.set(`lastSync:${testDeviceId}`, Date.now(), { ex: 86400 });
      
      console.log(`✅ Test: Saved operation ${testOperation.id} from device ${testDeviceId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Test operation saved to KV',
        operation: testOperation,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'GET') {
      // Возвращаем статус тестовых данных
      const keys = await kv.keys('operation:test_op_*');
      const testOperations = [];
      
      for (const key of keys) {
        const operation = await kv.get(key);
        testOperations.push(operation);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Test operations status',
        totalTestOperations: testOperations.length,
        operations: testOperations.slice(0, 5), // Показать первые 5
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
