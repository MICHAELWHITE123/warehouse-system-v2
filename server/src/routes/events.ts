import { Router, Request, Response } from 'express';
import { EventEmitter } from 'events';

const router = Router();
const eventEmitter = new EventEmitter();

// Хранилище активных SSE соединений
const clients = new Set<Response>();

// SSE endpoint для real-time обновлений
router.get('/stream', (req: Request, res: Response) => {
  // Настройка SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Добавляем клиента в список активных соединений
  clients.add(res);

  // Отправляем начальное сообщение
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Обработка отключения клиента
  req.on('close', () => {
    clients.delete(res);
  });

  req.on('error', () => {
    clients.delete(res);
  });
});

// Функция для отправки обновлений всем клиентам
function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  // Отправляем сообщение всем подключенным клиентам
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (error) {
      // Удаляем неактивного клиента
      clients.delete(client);
    }
  });
}

// Endpoints для уведомления об изменениях
router.post('/notify/equipment', (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  broadcastUpdate({
    type: 'equipment_update',
    action, // 'create', 'update', 'delete'
    data,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Notification sent' });
});

router.post('/notify/shipment', (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  broadcastUpdate({
    type: 'shipment_update',
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Notification sent' });
});

router.post('/notify/category', (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  broadcastUpdate({
    type: 'category_update',
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Notification sent' });
});

router.post('/notify/location', (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  broadcastUpdate({
    type: 'location_update',
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Notification sent' });
});

router.post('/notify/stack', (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  broadcastUpdate({
    type: 'stack_update',
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true, message: 'Notification sent' });
});

// Получение статистики подключений
router.get('/stats', (req: Request, res: Response) => {
  res.json({
    activeConnections: clients.size,
    timestamp: new Date().toISOString()
  });
});

export { broadcastUpdate };
export default router;
