import { getDatabase } from './index';
import type { BrowserDatabase } from './browserDatabase';

export interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  deviceId: string;
  userId?: string;
}

export interface SyncConflict {
  localOperation: SyncOperation;
  remoteOperation: SyncOperation;
  resolution: 'local' | 'remote' | 'manual';
}

export interface SyncStatus {
  lastSync: number;
  pendingOperations: SyncOperation[];
  conflicts: SyncConflict[];
  isOnline: boolean;
  isSyncing: boolean;
}

class SyncAdapter {
  private db: BrowserDatabase;
  private deviceId: string;
  private userId?: string;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private lastSync: number = 0;
  private syncTimeout: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflicts: SyncConflict[] = [];

  constructor() {
    this.db = getDatabase();
    this.deviceId = this.generateDeviceId();
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('device-id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('device-id', deviceId);
    }
    return deviceId;
  }

  private setupEventListeners(): void {
    // Слушаем изменения в сети
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.scheduleSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Слушаем изменения в localStorage для других вкладок
    window.addEventListener('storage', (event) => {
      if (event.key === 'warehouse-sync-queue') {
        this.loadSyncQueue();
      }
    });
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('warehouse-sync-queue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem('warehouse-sync-queue', JSON.stringify(this.syncQueue));
      // Уведомляем другие вкладки об изменении
      localStorage.setItem('warehouse-sync-queue-updated', Date.now().toString());
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  // Добавить операцию в очередь синхронизации
  addToSyncQueue(table: string, operation: 'create' | 'update' | 'delete', data: any): void {
    const syncOp: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId: this.userId
    };

    this.syncQueue.push(syncOp);
    this.saveSyncQueue();

    // Если онлайн, сразу запускаем синхронизацию
    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  // Запланировать синхронизацию
  private scheduleSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, 1000); // Задержка 1 секунда
  }

  // Выполнить синхронизацию
  private async performSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync...', this.syncQueue.length, 'operations pending');

    try {
      // Получаем операции для синхронизации
      const operationsToSync = [...this.syncQueue];
      
      // Отправляем операции на сервер
      const results = await this.sendOperationsToServer(operationsToSync);
      
      // Обрабатываем результаты
      await this.processSyncResults(results);
      
      // Удаляем обработанные операции из очереди
      this.syncQueue = this.syncQueue.filter(op => 
        !operationsToSync.some(syncedOp => syncedOp.id === op.id)
      );
      this.saveSyncQueue();
      
      // Обновляем время последней синхронизации
      this.lastSync = Date.now();
      
      console.log('Sync completed successfully');
      
      // ПОСЛЕ отправки своих операций, получаем операции от других устройств
      await this.pullOperationsFromServer();
      
    } catch (error) {
      console.error('Sync failed:', error);
      // При ошибке оставляем операции в очереди для повторной попытки
    } finally {
      this.isSyncing = false;
      
      // Если есть еще операции, планируем следующую синхронизацию
      if (this.syncQueue.length > 0) {
        this.scheduleSync();
      }
    }
  }

  // Отправить операции на сервер
  private async sendOperationsToServer(operations: SyncOperation[]): Promise<any[]> {
    const { getApiUrl, getAuthHeaders } = await import('../config/api');
    
    try {
      const response = await fetch(getApiUrl('sync'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operations,
          deviceId: this.deviceId,
          lastSync: this.lastSync
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send operations to server:', error);
      throw error;
    }
  }

  // Обработать результаты синхронизации
  private async processSyncResults(results: any[]): Promise<void> {
    for (const result of results) {
      if (result.conflict) {
        // Обрабатываем конфликт
        await this.handleConflict(result);
      } else if (result.success) {
        // Операция успешно синхронизирована
        console.log(`Operation ${result.operationId} synced successfully`);
      }
    }
  }

  // Обработать конфликт синхронизации
  private async handleConflict(conflictResult: any): Promise<void> {
    const conflict: SyncConflict = {
      localOperation: conflictResult.localOperation,
      remoteOperation: conflictResult.remoteOperation,
      resolution: 'manual' // По умолчанию требует ручного разрешения
    };

    this.conflicts.push(conflict);
    
    // Уведомляем пользователя о конфликте
    this.notifyConflict(conflict);
  }

  // Уведомить о конфликте
  private notifyConflict(conflict: SyncConflict): void {
    // Создаем событие для уведомления UI
    const event = new CustomEvent('sync-conflict', {
      detail: { conflict }
    });
    window.dispatchEvent(event);
  }

  // Разрешить конфликт
  resolveConflict(conflictId: string, resolution: 'local' | 'remote'): void {
    const conflictIndex = this.conflicts.findIndex(c => 
      c.localOperation.id === conflictId || c.remoteOperation.id === conflictId
    );

    if (conflictIndex === -1) return;

    const conflict = this.conflicts[conflictIndex];
    conflict.resolution = resolution;

    // Применяем разрешение
    if (resolution === 'local') {
      // Локальная версия остается, удаляем удаленную
      this.syncQueue = this.syncQueue.filter(op => 
        op.id !== conflict.remoteOperation.id
      );
    } else {
      // Удаленная версия побеждает, обновляем локальные данные
      this.applyRemoteOperation(conflict.remoteOperation);
      this.syncQueue = this.syncQueue.filter(op => 
        op.id !== conflict.localOperation.id
      );
    }

    // Удаляем конфликт из списка
    this.conflicts.splice(conflictIndex, 1);
    this.saveSyncQueue();
  }

  // Применить удаленную операцию
  private async applyRemoteOperation(operation: SyncOperation): Promise<void> {
    try {
      switch (operation.operation) {
        case 'create':
          await this.db.insert(operation.table, operation.data);
          break;
        case 'update':
          await this.db.update(operation.table, operation.data.id, operation.data);
          break;
        case 'delete':
          await this.db.delete(operation.table, operation.data.id);
          break;
      }
      console.log(`Applied remote operation: ${operation.operation} on ${operation.table}`);
    } catch (error) {
      console.error(`Failed to apply remote operation ${operation.operation} on ${operation.table}:`, error);
      throw error;
    }
  }

  // Получить статус синхронизации
  getSyncStatus(): SyncStatus {
    return {
      lastSync: this.lastSync,
      pendingOperations: [...this.syncQueue],
      conflicts: [...this.conflicts],
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    };
  }

  // Принудительная синхронизация
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      // Сначала отправляем свои операции
      if (this.syncQueue.length > 0) {
        await this.performSync();
      } else {
        // Если нет операций для отправки, только получаем с сервера
        await this.pullOperationsFromServer();
      }
    }
  }

  // Очистить очередь синхронизации
  clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  // Установить пользователя
  setUser(userId: string): void {
    this.userId = userId;
    // При смене пользователя сразу синхронизируемся для получения данных
    if (this.isOnline) {
      this.scheduleInitialSync();
    }
  }

  // Запланировать начальную синхронизацию для нового пользователя
  private scheduleInitialSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(async () => {
      try {
        console.log('Performing initial sync for new user...');
        await this.pullOperationsFromServer();
      } catch (error) {
        console.error('Initial sync failed:', error);
      }
    }, 2000); // Задержка 2 секунды для стабилизации
  }

  // Получить количество операций в очереди
  getPendingOperationsCount(): number {
    return this.syncQueue.length;
  }

  // Получить количество конфликтов
  getConflictsCount(): number {
    return this.conflicts.length;
  }

  // НОВАЯ ФУНКЦИЯ: Получение операций от других устройств с сервера
  private async pullOperationsFromServer(): Promise<void> {
    try {
      console.log('Pulling operations from server...');
      
      const { getApiUrl, getAuthHeaders } = await import('../config/api');
      
      // Получаем операции от других устройств
      const response = await fetch(getApiUrl(`sync/operations?deviceId=${this.deviceId}&lastSync=${this.lastSync}`), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log(`Received ${result.data.length} operations from other devices`);
        
        // Применяем полученные операции к локальной базе
        for (const operation of result.data) {
          await this.applyRemoteOperation({
            id: operation.operation_id,
            table: operation.table_name,
            operation: operation.operation_type,
            data: JSON.parse(operation.data),
            timestamp: new Date(operation.timestamp).getTime(),
            deviceId: operation.source_device_id,
            userId: operation.user_id
          });
          
          // Подтверждаем получение операции
          await this.acknowledgeOperation(operation.operation_id);
        }
        
        // Обновляем время последней синхронизации
        this.lastSync = Date.now();
        
        console.log('Successfully applied operations from other devices');
      }
      
    } catch (error) {
      console.error('Failed to pull operations from server:', error);
      // Не прерываем основную синхронизацию из-за этой ошибки
    }
  }

  // НОВАЯ ФУНКЦИЯ: Подтверждение получения операции
  private async acknowledgeOperation(operationId: string): Promise<void> {
    try {
      const { getApiUrl, getAuthHeaders } = await import('../config/api');
      
      await fetch(getApiUrl(`sync/operations/${operationId}/acknowledge`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          deviceId: this.deviceId
        })
      });
    } catch (error) {
      console.error('Failed to acknowledge operation:', error);
    }
  }

  // Запустить автоматическую синхронизацию
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline) {
        // Если есть операции для отправки, синхронизируем
        if (this.syncQueue.length > 0) {
          await this.performSync();
        } else {
          // Если нет операций для отправки, только получаем с сервера
          await this.pullOperationsFromServer();
        }
      }
    }, intervalMs);
  }

  // Остановить автоматическую синхронизацию
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  // Получить информацию об устройстве
  getDeviceInfo(): { deviceId: string; userId?: string; lastSync: number } {
    return {
      deviceId: this.deviceId,
      userId: this.userId,
      lastSync: this.lastSync
    };
  }
}

// Создаем единственный экземпляр адаптера синхронизации
export const syncAdapter = new SyncAdapter();

export default SyncAdapter;
