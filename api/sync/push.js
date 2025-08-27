// Legacy PUSH API для отправки операций (без авторизации)
import { kv } from '@vercel/kv';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      // Получение операций от клиента
      const { operations, deviceId, userId } = req.body;
      
      console.log(`🔄 Legacy PUSH: Received ${operations?.length || 0} operations from device:`, deviceId);
      
      let savedCount = 0;
      let kvError = null;
      
      try {
        if (operations && operations.length > 0) {
          // Сохраняем каждую операцию
          for (const operation of operations) {
            const key = `operation:${operation.id}`;
            await kv.set(key, {
              ...operation,
              deviceId, // Убеждаемся что deviceId сохранен
              receivedAt: new Date().toISOString()
            }, { ex: 86400 * 7 }); // TTL 7 дней
            
            console.log(`✅ Legacy PUSH: Saved operation ${operation.operation} on ${operation.table} from device ${deviceId}`);
            savedCount++;
          }
          
          console.log(`📦 Legacy PUSH: Successfully saved ${savedCount} operations to KV`);
        } else {
          console.log('⚠️ Legacy PUSH: No operations to save');
        }
        
        // Обновляем время последней синхронизации для устройства
        if (deviceId) {
          await kv.set(`lastSync:${deviceId}`, Date.now(), { ex: 86400 * 30 }); // TTL 30 дней
        }
        
      } catch (error) {
        console.error('❌ KV Error in legacy PUSH API:', error);
        kvError = error.message;
      }
      
      return res.status(200).json({
        success: true,
        syncedOperations: operations || [],
        conflicts: [],
        debug: {
          message: 'Legacy PUSH endpoint without auth',
          deviceId,
          operationsReceived: operations?.length || 0,
          operationsSaved: savedCount,
          kvError
        }
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Legacy PUSH API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to push operations',
      details: error.message,
      legacy: true 
    });
  }
}
