// API для получения статуса системы
import { kv } from '@vercel/kv';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
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
      // Подсчитываем операции и устройства
      const operationKeys = await kv.keys('operation:*');
      const deviceKeys = await kv.keys('lastSync:*');
      
      const lastSyncData = {};
      for (const key of deviceKeys) {
        const deviceId = key.replace('lastSync:', '');
        const lastSync = await kv.get(key);
        lastSyncData[deviceId] = lastSync;
      }
      
      return res.status(200).json({
        status: 'running',
        environment: 'vercel',
        operationsCount: operationKeys.length,
        devices: deviceKeys.length,
        lastSync: lastSyncData,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ Status API Error:', error);
    return res.status(500).json({ error: 'Failed to get status' });
  }
}
