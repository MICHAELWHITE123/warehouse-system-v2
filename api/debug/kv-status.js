// Debug API для проверки состояния Vercel KV
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
      console.log('🔍 Checking KV status...');
      
      // Проверяем доступность KV
      let kvStatus = 'unknown';
      let operationKeys = [];
      let lastSyncKeys = [];
      let totalOperations = 0;
      let sampleOperations = [];
      
      try {
        // Тестируем базовую функциональность KV
        await kv.set('test:health', 'ok', { ex: 10 });
        const testValue = await kv.get('test:health');
        kvStatus = testValue === 'ok' ? 'connected' : 'error';
        
        // Получаем ключи операций
        operationKeys = await kv.keys('operation:*');
        lastSyncKeys = await kv.keys('lastSync:*');
        totalOperations = operationKeys.length;
        
        // Получаем несколько примеров операций
        const sampleKeys = operationKeys.slice(0, 3);
        for (const key of sampleKeys) {
          const operation = await kv.get(key);
          sampleOperations.push({
            key,
            operation: {
              id: operation?.id,
              table: operation?.table,
              operation: operation?.operation,
              deviceId: operation?.deviceId,
              timestamp: operation?.timestamp,
              receivedAt: operation?.receivedAt
            }
          });
        }
        
        // Удаляем тестовый ключ
        await kv.del('test:health');
        
      } catch (error) {
        kvStatus = 'error';
        console.error('KV Error:', error);
      }
      
      const status = {
        timestamp: new Date().toISOString(),
        kv: {
          status: kvStatus,
          totalOperations,
          totalDevices: lastSyncKeys.length,
          operationKeys: operationKeys.slice(0, 10), // Первые 10 ключей
          lastSyncKeys,
        },
        sampleOperations,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          KV_URL: process.env.KV_URL ? '***SET***' : 'NOT SET',
          KV_REST_API_URL: process.env.KV_REST_API_URL ? '***SET***' : 'NOT SET',
          KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '***SET***' : 'NOT SET',
        }
      };
      
      console.log('📊 KV Status:', JSON.stringify(status, null, 2));
      
      return res.status(200).json(status);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Debug API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to check KV status',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
