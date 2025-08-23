import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { query, queryOne } from '../config/database-sqlite';

interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  deviceId: string;
  userId?: string;
}

interface SyncRequest {
  operations: SyncOperation[];
  deviceId: string;
  lastSync: number;
}

interface SyncResult {
  operationId: string;
  success: boolean;
  conflict?: {
    localOperation: SyncOperation;
    remoteOperation: SyncOperation;
    reason: string;
  };
  error?: string;
}

export class SyncController extends BaseController {
  private db: any;

  constructor() {
    super();
    this.db = { query, queryOne };
  }

  // Основная функция синхронизации
  async syncOperations(req: Request, res: Response): Promise<void> {
    try {
      const { operations, deviceId, lastSync }: SyncRequest = req.body;
      const userId = (req as any).user?.id;

      if (!operations || !Array.isArray(operations)) {
        this.error(res, 'Invalid operations format', 400);
        return;
      }

      console.log(`Sync request from device ${deviceId}, user ${userId}, ${operations.length} operations`);

      const results: SyncResult[] = [];
      const conflicts: any[] = [];

      // Обрабатываем каждую операцию
      for (const operation of operations) {
        try {
          const result = await this.processOperation(operation, deviceId, userId);
          
          if (result.conflict) {
            conflicts.push(result.conflict);
          }
          
          results.push(result);
        } catch (error) {
          console.error(`Error processing operation ${operation.id}:`, error);
          results.push({
            operationId: operation.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Сохраняем операции в базу для других устройств
      await this.saveOperationsForOtherDevices(operations, deviceId, userId);

      // Отправляем результаты
      res.json({
        success: true,
        results,
        conflicts,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Sync error:', error);
      this.error(res, 'Sync failed', 500);
    }
  }

  // Обработка отдельной операции
  private async processOperation(operation: SyncOperation, deviceId: string, userId?: string): Promise<SyncResult> {
    try {
      // Проверяем, не было ли уже применено этой операции
      const existingOp = await this.db.query(
        'SELECT * FROM sync_operations WHERE operation_id = ?',
        [operation.id]
      );

      if (existingOp.length > 0) {
        return {
          operationId: operation.id,
          success: true
        };
      }

      // Проверяем на конфликты
      const conflict = await this.checkForConflicts(operation);
      if (conflict) {
        return {
          operationId: operation.id,
          success: false,
          conflict
        };
      }

      // Применяем операцию
      await this.applyOperation(operation);

      // Сохраняем информацию об операции
      await this.db.query(
        'INSERT INTO sync_operations (operation_id, table_name, operation_type, data, device_id, user_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          operation.id,
          operation.table,
          operation.operation,
          JSON.stringify(operation.data),
          deviceId,
          userId,
          new Date(operation.timestamp)
        ]
      );

      return {
        operationId: operation.id,
        success: true
      };

    } catch (error) {
      console.error(`Error processing operation ${operation.id}:`, error);
      throw error;
    }
  }

  // Проверка на конфликты
  private async checkForConflicts(operation: SyncOperation): Promise<any> {
    try {
      // Проверяем, не было ли изменений в той же записи с других устройств
      const conflictingOps = await this.db.query(
        `SELECT * FROM sync_operations 
         WHERE table_name = ? 
         AND operation_type IN ('update', 'delete')
         AND data LIKE ?
         AND timestamp > ?
         ORDER BY timestamp DESC
         LIMIT 1`,
        [
          operation.table,
          `%"id":${operation.data.id}%`,
          new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
        ]
      );

      if (conflictingOps.length > 0) {
        const conflictingOp = conflictingOps[0];
        return {
          localOperation: operation,
          remoteOperation: {
            id: conflictingOp.operation_id,
            table: conflictingOp.table_name,
            operation: conflictingOp.operation_type,
            data: JSON.parse(conflictingOp.data),
            timestamp: new Date(conflictingOp.timestamp).getTime(),
            deviceId: conflictingOp.device_id,
            userId: conflictingOp.user_id
          },
          reason: 'Concurrent modification detected'
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  }

  // Применение операции к базе данных
  private async applyOperation(operation: SyncOperation): Promise<void> {
    try {
      switch (operation.operation) {
        case 'create':
          const columns = Object.keys(operation.data).join(', ');
          const values = Object.keys(operation.data).map((_, i) => `$${i + 1}`).join(', ');
          await this.db.query(
            `INSERT INTO ${operation.table} (${columns}) VALUES (${values})`,
            Object.values(operation.data)
          );
          break;

        case 'update':
          const { id, ...updateData } = operation.data;
          const setClause = Object.keys(updateData).map((key, i) => `${key} = $${i + 1}`).join(', ');
          await this.db.query(
            `UPDATE ${operation.table} SET ${setClause} WHERE id = $${Object.keys(updateData).length + 1}`,
            [...Object.values(updateData), id]
          );
          break;

        case 'delete':
          await this.db.query(
            `DELETE FROM ${operation.table} WHERE id = $1`,
            [operation.data.id]
          );
          break;

        default:
          throw new Error(`Unknown operation type: ${operation.operation}`);
      }
    } catch (error) {
      console.error(`Error applying operation ${operation.operation} to table ${operation.table}:`, error);
      throw error;
    }
  }

  // Сохранение операций для других устройств
  private async saveOperationsForOtherDevices(operations: SyncOperation[], deviceId: string, userId?: string): Promise<void> {
    try {
      for (const operation of operations) {
        // Для SQLite используем INSERT OR REPLACE
        await this.db.query(
          `INSERT OR REPLACE INTO pending_sync_operations 
           (operation_id, table_name, operation_type, data, source_device_id, user_id, timestamp, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            operation.id,
            operation.table,
            operation.operation,
            JSON.stringify(operation.data),
            deviceId,
            userId,
            new Date(operation.timestamp),
            'pending'
          ]
        );
      }
    } catch (error) {
      console.error('Error saving operations for other devices:', error);
      // Не прерываем синхронизацию из-за этой ошибки
    }
  }

  // Получение статуса синхронизации
  async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const deviceId = req.query.deviceId as string;

      if (!deviceId) {
        this.error(res, 'Device ID required', 400);
        return;
      }

      // Получаем количество операций в очереди
      const pendingCount = await this.db.query(
        'SELECT COUNT(*) as count FROM pending_sync_operations WHERE source_device_id != ? AND status = ?',
        [deviceId, 'pending']
      );

      // Получаем количество конфликтов
      const conflictsCount = await this.db.query(
        'SELECT COUNT(*) as count FROM sync_conflicts WHERE device_id = ? AND resolved = ?',
        [deviceId, 0]
      );

      // Получаем время последней синхронизации
      const lastSync = await this.db.query(
        'SELECT MAX(timestamp) as last_sync FROM sync_operations WHERE device_id = ?',
        [deviceId]
      );

      res.json({
        success: true,
        data: {
          pendingOperations: pendingCount[0]?.count || 0,
          conflicts: conflictsCount[0]?.count || 0,
          lastSync: lastSync[0]?.last_sync || null,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Error getting sync status:', error);
      this.error(res, 'Failed to get sync status', 500);
    }
  }

  // Получение списка конфликтов
  async getConflicts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const deviceId = req.query.deviceId as string;

      if (!deviceId) {
        this.error(res, 'Device ID required', 400);
        return;
      }

      const conflicts = await this.db.query(
        `SELECT * FROM sync_conflicts 
         WHERE device_id = ? AND resolved = ?
         ORDER BY created_at DESC`,
        [deviceId, 0]
      );

      res.json({
        success: true,
        data: conflicts
      });

    } catch (error) {
      console.error('Error getting conflicts:', error);
      this.error(res, 'Failed to get conflicts', 500);
    }
  }

  // Разрешение конфликта
  async resolveConflict(req: Request, res: Response): Promise<void> {
    try {
      const conflictId = req.params.id;
      const { resolution, deviceId } = req.body;
      const userId = (req as any).user?.id;

      if (!resolution || !deviceId) {
        this.error(res, 'Resolution and device ID required', 400);
        return;
      }

      // Обновляем статус конфликта
      await this.db.query(
        'UPDATE sync_conflicts SET resolved = ?, resolution = ?, resolved_by = ?, resolved_at = ? WHERE id = ?',
        [1, resolution, userId, new Date(), conflictId]
      );

      res.json({
        success: true,
        message: 'Conflict resolved successfully'
      });

    } catch (error) {
      console.error('Error resolving conflict:', error);
      this.error(res, 'Failed to resolve conflict', 500);
    }
  }

  // Получение операций для синхронизации
  async getOperations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const deviceId = req.query.deviceId as string;
      const lastSync = req.query.lastSync as string;

      if (!deviceId) {
        this.error(res, 'Device ID required', 400);
        return;
      }

      let query = 'SELECT * FROM pending_sync_operations WHERE source_device_id != ? AND status = ?';
      const params: any[] = [deviceId, 'pending'];

      if (lastSync) {
        query += ' AND timestamp > ?';
        params.push(new Date(parseInt(lastSync)));
      }

      query += ' ORDER BY timestamp ASC LIMIT 100';

      const operations = await this.db.query(query, params);

      res.json({
        success: true,
        data: operations
      });

    } catch (error) {
      console.error('Error getting operations:', error);
      this.error(res, 'Failed to get operations', 500);
    }
  }

  // Подтверждение получения операции
  async acknowledgeOperation(req: Request, res: Response): Promise<void> {
    try {
      const operationId = req.params.id;
      const { deviceId } = req.body;

      if (!deviceId) {
        this.error(res, 'Device ID required', 400);
        return;
      }

      // Помечаем операцию как полученную
      await this.db.query(
        'UPDATE pending_sync_operations SET status = ?, acknowledged_by = ?, acknowledged_at = ? WHERE operation_id = ?',
        ['acknowledged', deviceId, new Date(), operationId]
      );

      res.json({
        success: true,
        message: 'Operation acknowledged'
      });

    } catch (error) {
      console.error('Error acknowledging operation:', error);
      this.error(res, 'Failed to acknowledge operation', 500);
    }
  }
}
