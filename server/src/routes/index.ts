import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import categoryRoutes from './categories';
import locationRoutes from './locations';
import equipmentRoutes from './equipment';
import stackRoutes from './stacks';
import shipmentRoutes from './shipments';
import statisticsRoutes from './statistics';

const router = Router();

// Тестовый маршрут
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    routes: ['/auth', '/users', '/categories', '/locations', '/equipment', '/stacks', '/shipments', '/statistics']
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

export default router;
