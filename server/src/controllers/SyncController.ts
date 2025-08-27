import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { SyncEntryModel, SyncPushRequest, SyncPullRequest } from '../models/SyncEntryModel';
import { DeviceModel } from '../models/DeviceModel';
import { SyncEngine, SyncOperation } from '../utils/syncEngine';
import { ConflictResolver } from '../utils/conflictResolver';

export class SyncController extends BaseController {
  private syncEntryModel = new SyncEntryModel();
  private deviceModel = new DeviceModel();
  private syncEngine = new SyncEngine();

  constructor() {
    super();
  }

  /**
   * PUSH синхронизация - прием данных от устройства
   * POST /api/sync/push
   */
  public pushChanges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const { device_id, changes }: SyncPushRequest = req.body;

      // Преобразуем входящие данные в формат SyncOperation
      const operations: SyncOperation[] = changes.map(change => ({
        table: change.table,
        operation: change.operation,
        record_id: change.record_id,
        data: change.data,
        timestamp: change.timestamp
      }));

      console.log(`PUSH: Received ${operations.length} operations from device ${device_id} for user ${userId}`);

      // Обрабатываем операции через движок синхронизации
      const result = await this.syncEngine.processPushOperations(operations, device_id, userId);

      this.success(res, {
        processed: result.processed_count,
        failed: result.failed_count,
        conflicts: result.conflicts,
        errors: result.errors,
        timestamp: Date.now()
      }, 'Push synchronization completed');

    } catch (error) {
      console.error('Push sync error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * PULL синхронизация - получение изменений для устройства
   * POST /api/sync/pull
   */
  public pullChanges = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const { device_id, last_sync }: SyncPullRequest = req.body;

      console.log(`PULL: Getting changes for device ${device_id} from user ${userId}, last sync: ${last_sync}`);

      // Получаем операции для синхронизации
      const operations = await this.syncEngine.getPullOperations(device_id, userId, last_sync);

      // Преобразуем в формат для клиента
      const changes = operations.map(op => ({
        id: op.uuid,
        table: op.table_name,
        operation: op.operation,
        record_id: op.record_id,
        data: op.data,
        timestamp: op.timestamp.getTime()
      }));

      this.success(res, {
        changes,
        count: changes.length,
        timestamp: Date.now()
      }, 'Pull synchronization completed');

    } catch (error) {
      console.error('Pull sync error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Получение статуса синхронизации
   * GET /api/sync/status
   */
  public getSyncStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const deviceId = req.query.device_id as string;

      // Получаем статистику синхронизации
      const stats = await this.syncEngine.getSyncStats(userId);

      // Получаем информацию об устройствах
      const devices = await this.deviceModel.getUserDevices(userId, true);

      // Если указан конкретный device_id, получаем детальную информацию
      let deviceSpecificStats = null;
      if (deviceId) {
        const device = await this.deviceModel.findByDeviceId(deviceId, userId);
        if (device) {
          const { data: deviceEntries } = await this.syncEntryModel.findAll(userId, {
            deviceId: deviceId,
            limit: 10
          });
          
          deviceSpecificStats = {
            device_info: device,
            recent_entries: deviceEntries,
            last_sync: device.last_sync
          };
        }
      }

      this.success(res, {
        ...stats,
        devices: devices.map(d => ({
          device_id: d.device_id,
          device_name: d.device_name,
          device_type: d.device_type,
          last_sync: d.last_sync,
          is_active: d.is_active
        })),
        device_specific: deviceSpecificStats,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Sync status error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Получение списка конфликтов
   * GET /api/sync/conflicts
   */
  public getConflicts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const resolved = req.query.resolved === 'true';
      const conflicts = await this.syncEntryModel.getConflicts(userId, resolved);

      this.success(res, {
        conflicts,
        count: conflicts.length,
        resolved
      });

    } catch (error) {
      console.error('Get conflicts error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Разрешение конфликта
   * POST /api/sync/conflicts/:id/resolve
   */
  public resolveConflict = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const conflictId = parseInt(req.params.id);
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const { resolution, resolved_data } = req.body;

      let finalData = resolved_data;

      // Если данные не предоставлены, пытаемся разрешить автоматически
      if (!finalData) {
        const conflicts = await this.syncEntryModel.getConflicts(userId, false);
        const conflict = conflicts.find(c => c.id === conflictId);
        
        if (!conflict) {
          this.notFound(res, 'Conflict');
          return;
        }

        const context = {
          tableName: conflict.table_name,
          recordId: conflict.record_id,
          localData: JSON.parse(conflict.local_data),
          remoteData: JSON.parse(conflict.remote_data),
          localTimestamp: conflict.local_timestamp,
          remoteTimestamp: conflict.remote_timestamp,
          conflictType: conflict.conflict_type as 'concurrent_update' | 'delete_update' | 'update_delete'
        };

        let resolutionResult;
        switch (resolution) {
          case 'local_wins':
            resolutionResult = ConflictResolver.resolveByLocalWins(context);
            break;
          case 'remote_wins':
            resolutionResult = ConflictResolver.resolveByRemoteWins(context);
            break;
          case 'merged':
            resolutionResult = ConflictResolver.resolveByMerge(context);
            break;
          default:
            resolutionResult = ConflictResolver.resolveByTableLogic(context);
        }

        if (!resolutionResult.success) {
          this.error(res, resolutionResult.error || 'Failed to resolve conflict automatically');
          return;
        }

        finalData = resolutionResult.resolvedData;
      }

      const resolvedConflict = await this.syncEntryModel.resolveConflict(
        conflictId,
        resolution,
        userId,
        finalData
      );

      this.success(res, resolvedConflict, 'Conflict resolved successfully');

    } catch (error) {
      console.error('Resolve conflict error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Получение рекомендации по разрешению конфликта
   * GET /api/sync/conflicts/:id/recommendation
   */
  public getConflictRecommendation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const conflictId = parseInt(req.params.id);
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const conflicts = await this.syncEntryModel.getConflicts(userId, false);
      const conflict = conflicts.find(c => c.id === conflictId);
      
      if (!conflict) {
        this.notFound(res, 'Conflict');
        return;
      }

      const context = {
        tableName: conflict.table_name,
        recordId: conflict.record_id,
        localData: JSON.parse(conflict.local_data),
        remoteData: JSON.parse(conflict.remote_data),
        localTimestamp: conflict.local_timestamp,
        remoteTimestamp: conflict.remote_timestamp,
        conflictType: conflict.conflict_type as 'concurrent_update' | 'delete_update' | 'update_delete'
      };

      const recommendation = ConflictResolver.getResolutionRecommendation(context);
      const canAutoResolve = ConflictResolver.canAutoResolve(context);

      this.success(res, {
        conflict_id: conflictId,
        recommendation,
        can_auto_resolve: canAutoResolve,
        context: {
          table_name: context.tableName,
          record_id: context.recordId,
          conflict_type: context.conflictType,
          time_difference_ms: Math.abs(context.localTimestamp.getTime() - context.remoteTimestamp.getTime())
        }
      });

    } catch (error) {
      console.error('Get conflict recommendation error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Получение истории синхронизации
   * GET /api/sync/history
   */
  public getSyncHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const status = req.query.status as string;
      const deviceId = req.query.device_id as string;
      const tableName = req.query.table_name as string;

      const { data: entries, total } = await this.syncEntryModel.findAll(userId, {
        page,
        limit,
        status,
        deviceId,
        tableName
      });

      const totalPages = Math.ceil(total / limit);

      this.success(res, {
        entries,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      });

    } catch (error) {
      console.error('Get sync history error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Проверка целостности данных синхронизации
   * GET /api/sync/validate
   */
  public validateSyncIntegrity = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const validation = await this.syncEngine.validateSyncIntegrity(userId);

      this.success(res, validation);

    } catch (error) {
      console.error('Validate sync integrity error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Очистка старых записей синхронизации
   * POST /api/sync/cleanup
   */
  public cleanupOldEntries = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      // Только администраторы могут выполнять очистку
      if (userRole !== 'admin') {
        this.forbidden(res, 'Only administrators can perform cleanup');
        return;
      }

      const daysToKeep = parseInt(req.body.days_to_keep) || 30;
      const deletedCount = await this.syncEngine.cleanupOldEntries(daysToKeep);

      this.success(res, {
        deleted_count: deletedCount,
        days_kept: daysToKeep
      }, `Cleaned up ${deletedCount} old sync entries`);

    } catch (error) {
      console.error('Cleanup error:', error);
      this.serverError(res, error as Error);
    }
  };

  /**
   * Принудительная синхронизация устройства
   * POST /api/sync/force/:deviceId
   */
  public forceSync = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const deviceId = req.params.deviceId;
      
      if (!userId) {
        this.unauthorized(res);
        return;
      }

      const device = await this.deviceModel.findByDeviceId(deviceId, userId);
      
      if (!device) {
        this.notFound(res, 'Device');
        return;
      }

      // Получаем все неотправленные изменения для устройства
      const operations = await this.syncEngine.getPullOperations(deviceId, userId);

      // Обновляем время последней синхронизации
      await this.deviceModel.updateLastSync(deviceId, userId);

      this.success(res, {
        device_id: deviceId,
        pending_operations: operations.length,
        force_sync_requested: new Date(),
        message: 'Force sync initiated. Client should pull changes.'
      }, 'Force synchronization requested');

    } catch (error) {
      console.error('Force sync error:', error);
      this.serverError(res, error as Error);
    }
  };
}