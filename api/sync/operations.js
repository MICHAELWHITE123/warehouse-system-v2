// API для получения операций синхронизации
import { kv } from '@vercel/kv';

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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { deviceId, lastSync } = req.query;
      const lastSyncTime = parseInt(lastSync) || 0;
      
      console.log(`📥 Legacy PULL: device=${deviceId}, lastSync=${lastSyncTime}`);
      
      // Проверяем доступность KV
      let operations = [];
      let kvError = null;
      
      try {
        // Получаем операции от других устройств
        const keys = await kv.keys('operation:*');
        console.log(`🔍 Found ${keys.length} operation keys in KV`);
        
        let processedCount = 0;
        let filteredCount = 0;
        
        for (const key of keys) {
          const operation = await kv.get(key);
          processedCount++;
          
          if (operation && 
              operation.deviceId !== deviceId && 
              operation.timestamp > lastSyncTime) {
            operations.push(operation);
            filteredCount++;
          }
        }
        
        console.log(`📊 Processed ${processedCount} operations, filtered ${filteredCount}, returning ${operations.length}`);
        
      } catch (error) {
        console.error('❌ KV Error in legacy API:', error);
        kvError = error.message;
        // Возвращаем пустой массив если KV недоступен
        operations = [];
      }
      
      console.log(`📤 Legacy PULL: Returned ${operations.length} operations to device ${deviceId}`);
      
      return res.status(200).json({
        operations,
        serverTime: Date.now(),
        debug: {
          deviceId,
          lastSyncTime,
          kvError,
          message: 'Legacy API endpoint without auth',
          operationsCount: operations.length
        }
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Operations API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch operations' });
  }
}
