import express from 'express';
import { DeviceController } from '../controllers/DeviceController';
import { auth } from '../middleware/auth';
import { 
  validateDeviceRegistration,
  validateDeviceUpdate,
  validateSyncAcknowledge,
  validatePagination
} from '../middleware/validation';

const router = express.Router();
const deviceController = new DeviceController();

// Все роуты требуют аутентификации
router.use(auth);

/**
 * @route POST /api/devices/register
 * @desc Регистрация нового устройства
 * @access Private
 */
router.post('/register', validateDeviceRegistration, deviceController.register);

/**
 * @route GET /api/devices
 * @desc Получение списка устройств пользователя
 * @access Private
 */
router.get('/', validatePagination, deviceController.getDevices);

/**
 * @route GET /api/devices/stats
 * @desc Получение статистики по устройствам
 * @access Private
 */
router.get('/stats', deviceController.getDeviceStats);

/**
 * @route GET /api/devices/:id
 * @desc Получение информации об устройстве
 * @access Private
 */
router.get('/:id', deviceController.getDevice);

/**
 * @route PUT /api/devices/:id
 * @desc Обновление информации об устройстве
 * @access Private
 */
router.put('/:id', validateDeviceUpdate, deviceController.updateDevice);

/**
 * @route POST /api/devices/:id/deactivate
 * @desc Деактивация устройства
 * @access Private
 */
router.post('/:id/deactivate', deviceController.deactivateDevice);

/**
 * @route DELETE /api/devices/:id
 * @desc Удаление устройства
 * @access Private
 */
router.delete('/:id', deviceController.deleteDevice);

/**
 * @route POST /api/devices/heartbeat
 * @desc Отправка heartbeat от устройства
 * @access Private
 */
router.post('/heartbeat', validateSyncAcknowledge, deviceController.heartbeat);

export default router;
