import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';
import { auth } from '../middleware/auth';

const router = Router();
const statisticsController = new StatisticsController();

// Все маршруты требуют авторизации
router.use(auth);

// GET /api/statistics - Получить общую статистику
router.get('/', statisticsController.getOverall);

// GET /api/statistics/equipment - Статистика по оборудованию
router.get('/equipment', statisticsController.getEquipmentStats);

// GET /api/statistics/shipments - Статистика по отгрузкам
router.get('/shipments', statisticsController.getShipmentStats);

// GET /api/statistics/categories - Статистика по категориям
router.get('/categories', statisticsController.getCategoryStats);

// GET /api/statistics/locations - Статистика по местоположениям
router.get('/locations', statisticsController.getLocationStats);

export default router;
