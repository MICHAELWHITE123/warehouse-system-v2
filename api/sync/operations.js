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
      
      console.log(`📥 Pulling operations for device: ${deviceId}, since: ${lastSyncTime}`);
      
      // Получаем операции от других устройств
      const keys = await kv.keys('operation:*');
      const operations = [];
      
      for (const key of keys) {
        const operation = await kv.get(key);
        if (operation && 
            operation.deviceId !== deviceId && 
            operation.timestamp > lastSyncTime) {
          operations.push(operation);
        }
      }
      
      console.log(`📤 Returning ${operations.length} operations`);
      
      return res.status(200).json({
        operations,
        serverTime: Date.now()
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Operations API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch operations' });
  }
}
