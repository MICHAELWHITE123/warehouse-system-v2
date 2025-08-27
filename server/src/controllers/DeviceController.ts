import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { DeviceModel, CreateDevice, UpdateDevice } from '../models/DeviceModel';

export class DeviceController extends BaseController {
  private deviceModel = new DeviceModel();

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const { device_id, device_name, device_type, platform } = req.body;

      // Проверить, не зарегистрировано ли уже это устройство
      const existingDevice = await this.deviceModel.findByDeviceId(device_id);
      
      if (existingDevice) {
        if (existingDevice.user_id !== userId) {
          this.error(res, 'Device is already registered to another user', 409);
          return;
        }
        
        // Если устройство уже принадлежит пользователю, активируем его
        const updatedDevice = await this.deviceModel.update(existingDevice.id, {
          device_name,
          device_type,
          platform,
          is_active: true,
          last_sync: new Date()
        });
        
        this.success(res, updatedDevice, 'Device reactivated successfully');
        return;
      }

      // Создать новое устройство
      const deviceData: CreateDevice = {
        user_id: userId,
        device_id,
        device_name,
        device_type,
        platform
      };

      const newDevice = await this.deviceModel.create(deviceData);

      this.success(res, newDevice, 'Device registered successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const activeOnly = req.query.active_only === 'true';
      const devices = await this.deviceModel.getUserDevices(userId, activeOnly);

      this.success(res, devices);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.params.id;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const device = await this.deviceModel.findById(parseInt(deviceId));
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Проверить, принадлежит ли устройство пользователю
      if (device.user_id !== userId) {
        this.forbidden(res, 'Access denied to this device');
        return;
      }

      this.success(res, device);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public updateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.params.id;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const device = await this.deviceModel.findById(parseInt(deviceId));
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Проверить, принадлежит ли устройство пользователю
      if (device.user_id !== userId) {
        this.forbidden(res, 'Access denied to this device');
        return;
      }

      const updateData: UpdateDevice = req.body;
      const updatedDevice = await this.deviceModel.update(parseInt(deviceId), updateData);

      this.success(res, updatedDevice, 'Device updated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public deactivateDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.params.id;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const device = await this.deviceModel.findById(parseInt(deviceId));
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Проверить, принадлежит ли устройство пользователю
      if (device.user_id !== userId) {
        this.forbidden(res, 'Access denied to this device');
        return;
      }

      const deactivatedDevice = await this.deviceModel.deactivate(parseInt(deviceId));

      this.success(res, deactivatedDevice, 'Device deactivated successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public deleteDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.params.id;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const device = await this.deviceModel.findById(parseInt(deviceId));
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Проверить, принадлежит ли устройство пользователю или пользователь админ
      const userRole = (req as any).user?.role;
      if (device.user_id !== userId && userRole !== 'admin') {
        this.forbidden(res, 'Access denied to this device');
        return;
      }

      await this.deviceModel.delete(parseInt(deviceId));

      this.success(res, null, 'Device deleted successfully');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public heartbeat = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { device_id } = req.body;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      if (!device_id) {
        this.error(res, 'Device ID is required');
        return;
      }

      const device = await this.deviceModel.findByDeviceId(device_id, userId);
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Обновляем время последней активности
      await this.deviceModel.update(device.id, {
        last_sync: new Date(),
        is_active: true
      });

      this.success(res, {
        device_id: device.device_id,
        last_sync: new Date(),
        status: 'active'
      }, 'Heartbeat registered');

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };

  public getDeviceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const [allDevices, activeDevices] = await Promise.all([
        this.deviceModel.getUserDevices(userId, false),
        this.deviceModel.getUserDevices(userId, true)
      ]);

      const now = new Date();
      const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 минут

      const onlineDevices = activeDevices.filter(device => 
        device.last_sync && new Date(device.last_sync) > onlineThreshold
      );

      const offlineDevices = activeDevices.filter(device => 
        !device.last_sync || new Date(device.last_sync) <= onlineThreshold
      );

      const deviceTypes = allDevices.reduce((acc, device) => {
        const type = device.device_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        total: allDevices.length,
        active: activeDevices.length,
        inactive: allDevices.length - activeDevices.length,
        online: onlineDevices.length,
        offline: offlineDevices.length,
        by_type: deviceTypes,
        last_updated: now
      };

      this.success(res, stats);

    } catch (error) {
      this.serverError(res, error as Error);
    }
  };
}
