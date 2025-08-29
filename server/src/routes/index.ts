import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import categoryRoutes from './categories';
import locationRoutes from './locations';
import equipmentRoutes from './equipment';
import stackRoutes from './stacks';
import shipmentRoutes from './shipments';
import statisticsRoutes from './statistics';
import eventsRoutes from './events';
import syncRoutes from './sync';
import deviceRoutes from './devices';

const router = Router();

// Тестовый маршрут
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    version: '2.0.0',
    features: ['auth', 'sync', 'devices', 'inventory'],
    routes: ['/auth', '/users', '/categories', '/locations', '/equipment', '/stacks', '/shipments', '/statistics', '/events', '/sync', '/devices']
  });
});

// Debug endpoint
router.get('/debug/status', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    endpoints: {
      legacy_sync: '/api/sync/operations (no auth)',
      modern_sync: '/api/sync/* (with auth)'
    }
  });
});

// Подключаем все маршруты
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/locations', locationRoutes);
router.use('/equipment', equipmentRoutes);
router.use('/stacks', stackRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/events', eventsRoutes);
router.use('/sync', syncRoutes);
router.use('/devices', deviceRoutes);

export default router;
