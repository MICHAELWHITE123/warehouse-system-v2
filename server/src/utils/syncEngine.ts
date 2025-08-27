import { SyncEntryModel, CreateSyncEntry, SyncEntry } from '../models/SyncEntryModel';
import { DeviceModel } from '../models/DeviceModel';

export interface SyncOperation {
  table: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  record_id: string;
  data: any;
  timestamp: number;
}

export interface SyncConflict {
  table_name: string;
  record_id: string;
  local_operation: SyncOperation;
  remote_operation: SyncOperation;
  conflict_type: 'concurrent_update' | 'delete_update' | 'update_delete';
  resolution_strategy: 'local_wins' | 'remote_wins' | 'latest_wins' | 'manual';
}

export interface SyncResult {
  success: boolean;
  processed_count: number;
  failed_count: number;
  conflicts: SyncConflict[];
  errors: string[];
}

export class SyncEngine {
  private syncEntryModel: SyncEntryModel;
  private deviceModel: DeviceModel;

  constructor() {
    this.syncEntryModel = new SyncEntryModel();
    this.deviceModel = new DeviceModel();
  }

  /**
   * Обработка входящих операций синхронизации (PUSH)
   */
  async processPushOperations(
    operations: SyncOperation[],
    deviceId: string,
    userId: number
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed_count: 0,
      failed_count: 0,
      conflicts: [],
      errors: []
    };

    // Проверяем и регистрируем устройство
    await this.ensureDeviceRegistered(deviceId, userId);

    for (const operation of operations) {
      try {
        const processResult = await this.processOperation(operation, deviceId, userId);
        
        if (processResult.success) {
          result.processed_count++;
        } else {
          result.failed_count++;
          if (processResult.conflict) {
            result.conflicts.push(processResult.conflict);
          }
          if (processResult.error) {
            result.errors.push(processResult.error);
          }
        }
      } catch (error) {
        result.failed_count++;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        result.success = false;
      }
    }

    // Обновляем время последней синхронизации
    await this.deviceModel.updateLastSync(deviceId, userId);

    return result;
  }

  /**
   * Получение операций для синхронизации (PULL)
   */
  async getPullOperations(
    deviceId: string,
    userId: number,
    lastSync?: number
  ): Promise<SyncEntry[]> {
    // Проверяем и регистрируем устройство
    await this.ensureDeviceRegistered(deviceId, userId);

    const lastSyncDate = lastSync ? new Date(lastSync) : undefined;
    
    // Получаем операции, которые были выполнены на других устройствах
    const operations = await this.syncEntryModel.findPendingForDevice(
      deviceId,
      userId,
      lastSyncDate
    );

    return operations;
  }

  /**
   * Обработка отдельной операции синхронизации
   */
  private async processOperation(
    operation: SyncOperation,
    deviceId: string,
    userId: number
  ): Promise<{
    success: boolean;
    conflict?: SyncConflict;
    error?: string;
  }> {
    try {
      // Проверяем на конфликты
      const conflictingEntry = await this.syncEntryModel.findConflictingEntry(
        operation.table,
        operation.record_id,
        userId,
        deviceId,
        new Date(operation.timestamp - 60000) // Проверяем конфликты за последнюю минуту
      );

      if (conflictingEntry) {
        const conflict = await this.handleConflict(operation, conflictingEntry, deviceId);
        return {
          success: false,
          conflict
        };
      }

      // Создаем запись синхронизации
      const syncEntry: CreateSyncEntry = {
        user_id: userId,
        device_id: deviceId,
        table_name: operation.table,
        record_id: operation.record_id,
        operation: operation.operation,
        data: operation.data,
        timestamp: new Date(operation.timestamp),
        sync_status: 'processed'
      };

      await this.syncEntryModel.create(syncEntry);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Обработка конфликтов синхронизации
   */
  private async handleConflict(
    localOperation: SyncOperation,
    remoteEntry: SyncEntry,
    deviceId: string
  ): Promise<SyncConflict> {
    const remoteOperation: SyncOperation = {
      table: remoteEntry.table_name,
      operation: remoteEntry.operation,
      record_id: remoteEntry.record_id,
      data: remoteEntry.data,
      timestamp: remoteEntry.timestamp.getTime()
    };

    // Определяем тип конфликта
    const conflictType = this.determineConflictType(localOperation, remoteOperation);

    // Определяем стратегию разрешения
    const resolutionStrategy = this.determineResolutionStrategy(
      localOperation,
      remoteOperation,
      conflictType
    );

    const conflict: SyncConflict = {
      table_name: localOperation.table,
      record_id: localOperation.record_id,
      local_operation: localOperation,
      remote_operation: remoteOperation,
      conflict_type: conflictType,
      resolution_strategy: resolutionStrategy
    };

    // Создаем запись о конфликте в базе
    await this.syncEntryModel.createConflict({
      sync_entry_id: remoteEntry.id,
      table_name: localOperation.table,
      record_id: localOperation.record_id,
      local_data: localOperation.data,
      remote_data: remoteOperation.data,
      local_timestamp: new Date(localOperation.timestamp),
      remote_timestamp: new Date(remoteOperation.timestamp),
      conflict_type: conflictType
    });

    return conflict;
  }

  /**
   * Определение типа конфликта
   */
  private determineConflictType(
    localOp: SyncOperation,
    remoteOp: SyncOperation
  ): 'concurrent_update' | 'delete_update' | 'update_delete' {
    if (localOp.operation === 'UPDATE' && remoteOp.operation === 'UPDATE') {
      return 'concurrent_update';
    } else if (localOp.operation === 'DELETE' && remoteOp.operation === 'UPDATE') {
      return 'delete_update';
    } else if (localOp.operation === 'UPDATE' && remoteOp.operation === 'DELETE') {
      return 'update_delete';
    }
    return 'concurrent_update'; // Fallback
  }

  /**
   * Определение стратегии разрешения конфликта
   */
  private determineResolutionStrategy(
    localOp: SyncOperation,
    remoteOp: SyncOperation,
    conflictType: string
  ): 'local_wins' | 'remote_wins' | 'latest_wins' | 'manual' {
    // Стратегия "последнее изменение выигрывает"
    if (localOp.timestamp > remoteOp.timestamp) {
      return 'local_wins';
    } else if (remoteOp.timestamp > localOp.timestamp) {
      return 'remote_wins';
    } else {
      // При одинаковом времени - требуется ручное разрешение
      return 'manual';
    }
  }

  /**
   * Автоматическое разрешение конфликта
   */
  async resolveConflictAutomatically(
    conflictId: number,
    strategy: 'local_wins' | 'remote_wins' | 'latest_wins',
    userId: number
  ): Promise<boolean> {
    try {
      const conflicts = await this.syncEntryModel.getConflicts(userId, false);
      const conflict = conflicts.find(c => c.id === conflictId);
      
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      let finalData: any;
      let resolution: 'local_wins' | 'remote_wins' | 'merged' | 'manual';

      switch (strategy) {
        case 'local_wins':
          finalData = JSON.parse(conflict.local_data);
          resolution = 'local_wins';
          break;
        case 'remote_wins':
          finalData = JSON.parse(conflict.remote_data);
          resolution = 'remote_wins';
          break;
        case 'latest_wins':
          if (conflict.local_timestamp > conflict.remote_timestamp) {
            finalData = JSON.parse(conflict.local_data);
            resolution = 'local_wins';
          } else {
            finalData = JSON.parse(conflict.remote_data);
            resolution = 'remote_wins';
          }
          break;
        default:
          throw new Error('Invalid resolution strategy');
      }

      await this.syncEntryModel.resolveConflict(
        conflictId,
        resolution,
        userId,
        finalData
      );

      return true;
    } catch (error) {
      console.error('Error resolving conflict automatically:', error);
      return false;
    }
  }

  /**
   * Проверка и регистрация устройства
   */
  private async ensureDeviceRegistered(deviceId: string, userId: number): Promise<void> {
    const existingDevice = await this.deviceModel.findByDeviceId(deviceId, userId);
    
    if (!existingDevice) {
      // Если устройство не найдено, создаем его
      await this.deviceModel.create({
        user_id: userId,
        device_id: deviceId,
        device_name: `Device ${deviceId.slice(-8)}`,
        device_type: 'unknown'
      });
    }
  }

  /**
   * Получение статистики синхронизации
   */
  async getSyncStats(userId: number): Promise<{
    total_entries: number;
    pending: number;
    processed: number;
    failed: number;
    conflicts: number;
    active_devices: number;
  }> {
    const [entryStats, devices] = await Promise.all([
      this.syncEntryModel.getStats(userId),
      this.deviceModel.getUserDevices(userId, true)
    ]);

    return {
      total_entries: entryStats.total,
      pending: entryStats.pending,
      processed: entryStats.processed,
      failed: entryStats.failed,
      conflicts: entryStats.conflicts,
      active_devices: devices.length
    };
  }

  /**
   * Очистка старых записей синхронизации
   */
  async cleanupOldEntries(olderThanDays: number = 30): Promise<number> {
    return await this.syncEntryModel.cleanupOldEntries(olderThanDays);
  }

  /**
   * Проверка целостности данных синхронизации
   */
  async validateSyncIntegrity(userId: number): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Проверяем наличие устройств без активности
      const devices = await this.deviceModel.getUserDevices(userId, false);
      const inactiveDevices = devices.filter(d => !d.last_sync || 
        (new Date().getTime() - new Date(d.last_sync).getTime()) > 7 * 24 * 60 * 60 * 1000
      );

      if (inactiveDevices.length > 0) {
        issues.push(`Found ${inactiveDevices.length} devices without recent sync activity`);
      }

      // Проверяем наличие неразрешенных конфликтов
      const conflicts = await this.syncEntryModel.getConflicts(userId, false);
      if (conflicts.length > 0) {
        issues.push(`Found ${conflicts.length} unresolved conflicts`);
      }

      // Проверяем старые pending записи
      const { pending } = await this.syncEntryModel.getStats(userId);
      if (pending > 100) {
        issues.push(`Found ${pending} pending sync entries (consider cleanup)`);
      }

      return {
        isValid: issues.length === 0,
        issues
      };

    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}
