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
  private db!: BrowserDatabase;
  private deviceId!: string;
  private userId?: string;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private lastSync: number = 0;
  private syncTimeout: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflicts: SyncConflict[] = [];
  private lastSyncAttempt: number = 0;
  private syncRetryDelay: number = 30000; // 30 секунд между попытками

  constructor() {
    try {
      this.db = getDatabase();
      this.deviceId = this.generateDeviceId();
      this.setupEventListeners();
      this.loadSyncQueue();
      
      console.log('SyncAdapter initialized successfully');
      console.log('Device ID:', this.deviceId);
      console.log('Database:', this.db ? 'OK' : 'FAILED');
      
      // Добавляем alert для критических проверок (временно для отладки)
      if (typeof window !== 'undefined') {
        console.log('DEBUG: SyncAdapter created, deviceId:', this.deviceId);
      }
      
      // Запускаем автоматическую синхронизацию
      this.startAutoSync();
      
      // Проверяем localStorage сразу после инициализации
      setTimeout(() => {
        this.checkForTabOperations();
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize SyncAdapter:', error);
    }
  }

  private generateDeviceId(): string {
    // Генерируем уникальный ID для каждой вкладки
    const deviceId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      // Слушаем изменения операций синхронизации
      if (event.key === 'warehouse-sync-updated') {
        console.log('Storage change detected, checking for new operations...');
        // Запускаем проверку новых операций через небольшую задержку
        setTimeout(() => {
          this.checkForTabOperations();
        }, 100);
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
    // Проверяем, что адаптер инициализирован
    if (!this.db) {
      console.warn('SyncAdapter not initialized yet, retrying in 100ms...');
      setTimeout(() => this.addToSyncQueue(table, operation, data), 100);
      return;
    }

    const syncOp: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      deviceId: this.deviceId,
      userId: this.userId
    };

    console.log(`Adding operation to sync queue: ${operation} on ${table}`, syncOp);
    
    // Добавляем явный лог для отладки
    console.log('DEBUG: addToSyncQueue called with:', { table, operation, data });

    this.syncQueue.push(syncOp);
    this.saveSyncQueue();

    // Сохраняем операцию в localStorage для синхронизации между вкладками
    this.saveOperationToLocalStorage(syncOp);

    // Если онлайн, сразу запускаем синхронизацию
    if (this.isOnline) {
      this.scheduleSync();
    }
    
    // Всегда запускаем проверку localStorage для синхронизации между вкладками
    setTimeout(() => {
      this.checkForTabOperations();
    }, 500);
  }

  // Запланировать синхронизацию
  private scheduleSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Увеличиваем задержку если была критическая ошибка
    let delay = 1000; // базовая задержка 1 секунда
    
    if (this.lastSyncAttempt > 0) {
      const timeSinceLastAttempt = Date.now() - this.lastSyncAttempt;
      if (timeSinceLastAttempt < 60000) { // меньше минуты
        delay = 30000; // увеличиваем до 30 секунд
      } else if (timeSinceLastAttempt < 300000) { // меньше 5 минут
        delay = 60000; // увеличиваем до 1 минуты
      } else {
        delay = 300000; // увеличиваем до 5 минут
      }
    }

    console.log(`Scheduling sync in ${delay}ms`);
    
    this.syncTimeout = setTimeout(() => {
      // Сбрасываем флаг критической ошибки перед новой попыткой
      this.lastSyncAttempt = 0;
      this.performSync();
    }, delay);
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
      
      // Обновляем время последней синхронизации ТОЛЬКО при успешной синхронизации
      this.lastSync = Date.now();
      
      console.log('Sync completed successfully');
      
      // ПОСЛЕ отправки своих операций, получаем операции от других устройств
      await this.pullOperationsFromServer();
      
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Обрабатываем разные типы ошибок
      if (error instanceof Error && error.message.includes('401')) {
        // Ошибка авторизации - не повторяем попытку, очищаем очередь
        console.log('Authentication error (401), clearing sync queue to prevent infinite loop');
        this.syncQueue = [];
        this.saveSyncQueue();
        this.lastSyncAttempt = Date.now();
      } else if (error instanceof Error && error.message.includes('localhost')) {
        // Ошибка подключения к localhost - не повторяем попытку
        console.log('Localhost connection error, skipping retry');
        this.lastSyncAttempt = Date.now();
      } else {
        // Другие ошибки - оставляем операции в очереди для повторной попытки
        console.log('Other error, keeping operations in queue for retry');
      }
    } finally {
      this.isSyncing = false;
      
      // Если есть еще операции и не было критической ошибки, планируем следующую синхронизацию
      if (this.syncQueue.length > 0 && this.lastSyncAttempt === 0) {
        this.scheduleSync();
      }
    }
  }

  // Отправить операции на сервер
  private async sendOperationsToServer(operations: SyncOperation[]): Promise<any[]> {
    const { getApiUrl, getAuthHeaders } = await import('../config/api');
    
    try {
      const apiUrl = getApiUrl('sync');
      
      // Проверяем, не пытаемся ли мы подключиться к localhost на Vercel
      if (apiUrl.includes('localhost') && window.location.hostname.includes('vercel.app')) {
        throw new Error('Cannot connect to localhost from Vercel deployment');
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          operations,
          deviceId: this.deviceId,
          lastSync: this.lastSync
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`HTTP 401: Unauthorized - Authentication failed`);
        } else if (response.status === 404) {
          throw new Error(`HTTP 404: Not Found - Server endpoint not available`);
        } else if (response.status >= 500) {
          throw new Error(`HTTP ${response.status}: Server error`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
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
    console.log('Setting user for sync:', userId);
    this.userId = userId;
    // При смене пользователя сразу синхронизируемся для получения данных
    if (this.isOnline) {
      this.scheduleInitialSync();
    }
    
    // Также проверяем localStorage для синхронизации между вкладками
    setTimeout(() => {
      this.checkForTabOperations();
    }, 500);
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
      // Проверяем, не слишком ли рано для повторной попытки
      const now = Date.now();
      if (now - this.lastSyncAttempt < this.syncRetryDelay) {
        console.log('Skipping server sync - too soon after last attempt');
        return;
      }
      
      this.lastSyncAttempt = now;
      console.log('Pulling operations from server...');
      
      const { getApiUrl, getAuthHeaders } = await import('../config/api');
      
      // Проверяем, доступен ли сервер
      const apiUrl = getApiUrl(`sync/operations?deviceId=${this.deviceId}&lastSync=${this.lastSync}`);
      
      // Если URL указывает на localhost, но мы на Vercel, пропускаем серверную синхронизацию
      if (apiUrl.includes('localhost') && window.location.hostname.includes('vercel.app')) {
        console.log('On Vercel, skipping server sync to localhost');
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      // Получаем операции от других устройств
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Не авторизован - не повторяем попытку
          console.log('Not authenticated, skipping server sync');
          return;
        }
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
      
      // FALLBACK: Если сервер недоступен, используем localStorage синхронизацию
      console.log('Falling back to localStorage sync...');
      await this.pullOperationsFromLocalStorage();
    }
  }

  // НОВАЯ ФУНКЦИЯ: Fallback синхронизация через localStorage
  private async pullOperationsFromLocalStorage(): Promise<void> {
    try {
      // Получаем операции из localStorage всех устройств/вкладок
      const allOperations = this.getAllOperationsFromLocalStorage();
      
      if (allOperations.length > 0) {
        console.log(`Found ${allOperations.length} operations from localStorage`);
        
        // Сортируем по времени
        const sortedOperations = allOperations.sort((a, b) => a.timestamp - b.timestamp);
        
        let appliedOperations = 0;
        
        // Применяем операции
        for (const operation of sortedOperations) {
          await this.applyRemoteOperation(operation);
          appliedOperations++;
        }
        
        // Обновляем время последней синхронизации ТОЛЬКО если применили операции
        if (appliedOperations > 0) {
          this.lastSync = Date.now();
          console.log(`Successfully applied ${appliedOperations} operations from localStorage`);
        } else {
          console.log('No new operations were applied from localStorage');
        }
      }
      
    } catch (error) {
      console.error('LocalStorage sync failed:', error);
    }
  }

  // НОВАЯ ФУНКЦИЯ: Проверка операций из других вкладок
  private async checkForTabOperations(): Promise<void> {
    try {
      console.log('Checking for tab operations...');
      console.log('Current deviceId:', this.deviceId);
      console.log('Current lastSync:', this.lastSync);
      
      // Получаем операции от всех устройств/вкладок
      const allOperations = this.getAllOperationsFromLocalStorage();
      
      console.log('All operations found:', allOperations);
      
      if (allOperations.length > 0) {
        console.log(`Found ${allOperations.length} operations from other tabs/devices`);
        
        // Сортируем по времени
        const sortedOperations = allOperations.sort((a, b) => a.timestamp - b.timestamp);
        
        let appliedOperations = 0;
        
        for (const operation of sortedOperations) {
          // Проверяем, не применяли ли мы уже эту операцию
          if (operation.timestamp > this.lastSync) {
            console.log(`Applying operation: ${operation.operation} on ${operation.table}`, operation);
            await this.applyRemoteOperation(operation);
            console.log(`Applied operation: ${operation.operation} on ${operation.table}`);
            appliedOperations++;
          } else {
            console.log(`Skipping operation ${operation.id} - already applied (timestamp: ${operation.timestamp}, lastSync: ${this.lastSync})`);
          }
        }
        
        // Обновляем время последней синхронизации ТОЛЬКО если применили операции
        if (appliedOperations > 0) {
          this.lastSync = Date.now();
          console.log(`Successfully applied ${appliedOperations} operations from other tabs/devices`);
        } else {
          console.log('No new operations were applied');
        }
      } else {
        console.log('No new operations found');
      }
    } catch (error) {
      console.error('Tab operations check failed:', error);
    }
  }

  // НОВАЯ ФУНКЦИЯ: Сохранение операции в localStorage для синхронизации между вкладками
  private saveOperationToLocalStorage(operation: SyncOperation): void {
    try {
      const storageKey = `warehouse-sync-${this.deviceId}`;
      console.log('Saving operation to localStorage with key:', storageKey);
      console.log('Operation to save:', operation);
      
      const existingOperations = localStorage.getItem(storageKey);
      let operations: SyncOperation[] = [];
      
      if (existingOperations) {
        try {
          operations = JSON.parse(existingOperations);
          console.log('Existing operations:', operations);
        } catch (e) {
          console.warn('Failed to parse existing localStorage operations:', e);
        }
      }
      
      // Добавляем новую операцию
      operations.push(operation);
      console.log('Operations after adding new one:', operations);
      
      // Ограничиваем количество операций (последние 100)
      if (operations.length > 100) {
        operations = operations.slice(-100);
      }
      
      // Сохраняем обратно в localStorage
      localStorage.setItem(storageKey, JSON.stringify(operations));
      console.log('Operations saved to localStorage');
      
      // Уведомляем другие вкладки об изменении
      // Используем общий ключ для всех вкладок
      localStorage.setItem('warehouse-sync-updated', Date.now().toString());
      console.log('Updated warehouse-sync-updated key');
      
      console.log(`Operation saved to localStorage: ${operation.operation} on ${operation.table}`);
    } catch (error) {
      console.error('Failed to save operation to localStorage:', error);
    }
  }

  // НОВАЯ ФУНКЦИЯ: Получение операций от всех устройств/вкладок из localStorage
  private getAllOperationsFromLocalStorage(): SyncOperation[] {
    try {
      const allOperations: SyncOperation[] = [];
      console.log('Scanning localStorage for operations...');
      
      // Получаем все операции из localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('warehouse-sync-')) {
          console.log('Found sync key:', key);
          try {
            const operations = JSON.parse(localStorage.getItem(key) || '[]');
            console.log('Operations in key', key, ':', operations);
            if (Array.isArray(operations)) {
              // Добавляем все операции, которые новее последней синхронизации
              const newOperations = operations.filter((op: SyncOperation) => {
                const isNew = op.timestamp > this.lastSync;
                console.log(`Operation ${op.id}: timestamp ${op.timestamp}, lastSync ${this.lastSync}, isNew: ${isNew}`);
                return isNew;
              });
              allOperations.push(...newOperations);
            }
          } catch (e) {
            console.warn('Failed to parse localStorage operation:', e);
          }
        }
      }
      
      console.log('Total operations found:', allOperations);
      return allOperations;
    } catch (error) {
      console.error('Error getting operations from localStorage:', error);
      return [];
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
        // Проверяем, не слишком ли рано для повторной попытки
        const now = Date.now();
        if (now - this.lastSyncAttempt < this.syncRetryDelay) {
          console.log('Skipping sync - too soon after last attempt');
          return;
        }
        
        // Дополнительная защита от зацикливания
        if (this.lastSyncAttempt > 0 && this.syncQueue.length === 0) {
          console.log('No operations to sync, skipping server sync to prevent loops');
          return;
        }
        
        this.lastSyncAttempt = now;
        
        // Если есть операции для отправки, синхронизируем
        if (this.syncQueue.length > 0) {
          await this.performSync();
        } else {
          // Если нет операций для отправки, только получаем с сервера
          await this.pullOperationsFromServer();
        }
      }
      
      // Всегда проверяем localStorage для синхронизации между вкладками
      // (независимо от онлайн статуса)
      await this.checkForTabOperations();
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
