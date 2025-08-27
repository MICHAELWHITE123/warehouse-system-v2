// Vercel Serverless API для синхронизации данных
import { kv } from '@vercel/kv';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Добавляем CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // HEAD запрос для проверки доступности
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Получение операций от клиента
      const { operations, deviceId, userId } = req.body;
      
      console.log('🔄 Received sync request from device:', deviceId);
      
      if (operations && operations.length > 0) {
        // Сохраняем каждую операцию
        for (const operation of operations) {
          const key = `operation:${operation.id}`;
          await kv.set(key, {
            ...operation,
            receivedAt: new Date().toISOString()
          }, { ex: 86400 * 7 }); // TTL 7 дней
          
          console.log(`✅ Saved operation: ${operation.operation} on ${operation.table}`);
        }
      }
      
      // Обновляем время последней синхронизации для устройства
      if (deviceId) {
        await kv.set(`lastSync:${deviceId}`, Date.now(), { ex: 86400 * 30 }); // TTL 30 дней
      }
      
      return res.status(200).json({
        success: true,
        syncedOperations: operations || [],
        conflicts: []
      });
      
    } else if (req.method === 'GET') {
      // Получение операций для устройства
      const { deviceId, lastSync } = req.query;
      
      console.log(`📥 Pulling operations for device: ${deviceId}`);
      
      const lastSyncTime = parseInt(lastSync) || 0;
      
      // Получаем все операции (в реальном проекте лучше использовать pagination)
      const keys = await kv.keys('operation:*');
      const operations = [];
      
      for (const key of keys) {
        const operation = await kv.get(key);
        if (operation && operation.deviceId !== deviceId && operation.timestamp > lastSyncTime) {
          operations.push(operation);
        }
      }
      
      console.log(`📤 Legacy PULL: Returning ${operations.length} operations to device ${deviceId}`);
      
      return res.status(200).json({
        operations,
        serverTime: Date.now()
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
