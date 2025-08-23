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
  hash: string; // Хеш данных для предотвращения дублирования
  status: 'pending' | 'synced' | 'failed' | 'conflict';
  retryCount: number;
  lastRetry?: number;
}

export interface SyncConflict {
  id: string;
  localOperation: SyncOperation;
  remoteOperation: SyncOperation;
  resolution: 'local' | 'remote' | 'manual';
  createdAt: number;
}

export interface SyncStatus {
  lastSync: number;
  pendingOperations: SyncOperation[];
  conflicts: SyncConflict[];
  isOnline: boolean;
  isSyncing: boolean;
  deviceId: string;
  userId?: string;
  syncMode: 'server' | 'local' | 'hybrid';
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
  private isInitialized: boolean = false;
  private initializationTimeout: NodeJS.Timeout | null = null;
  private syncMode: 'server' | 'local' | 'hybrid' = 'hybrid';
  
  // Throttling для предотвращения спама
  private lastOperationAdd: number = 0;
  private operationAddThrottle: number = 100; // 100ms между добавлениями операций
  private lastStatusUpdate: number = 0;
  private statusUpdateThrottle: number = 1000; // 1 секунда между обновлениями статуса

  constructor() {
    try {
      if (this.isInitialized) {
        console.log('SyncAdapter already initialized, skipping...');
        return;
      }
      
      this.db = getDatabase();
      this.deviceId = this.generateDeviceId();
      this.setupEventListeners();
      this.loadSyncQueue();
      
      console.log('SyncAdapter initialized successfully');
      console.log('Device ID:', this.deviceId);
      
      // Запускаем автоматическую синхронизацию
      this.startAutoSync();
      
      // Инициализация через небольшую задержку
      this.initializationTimeout = setTimeout(() => {
        this.isInitialized = true;
        this.performInitialSync();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize SyncAdapter:', error);
    }
  }

  private generateDeviceId(): string {
    // Генерируем уникальный ID для устройства
    const existingId = localStorage.getItem('warehouse-device-id');
    if (existingId) {
      return existingId;
    }
    
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('warehouse-device-id', deviceId);
    return deviceId;
  }

  private setupEventListeners(): void {
    // Слушаем изменения в сети
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncMode = 'hybrid';
      this.scheduleSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncMode = 'local';
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
        // Фильтруем только pending операции
        this.syncQueue = this.syncQueue.filter(op => op.status === 'pending');
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem('warehouse-sync-queue', JSON.stringify(this.syncQueue));
      localStorage.setItem('warehouse-sync-queue-updated', Date.now().toString());
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  // Добавить операцию в очередь синхронизации
  addToSyncQueue(table: string, operation: 'create' | 'update' | 'delete', data: any): void {
    const now = Date.now();
    
    // Throttling для предотвращения спама
    if (now - this.lastOperationAdd < this.operationAddThrottle) {
      console.log('Operation add throttled, skipping...');
      return;
    }
    
    this.lastOperationAdd = now;

    // Проверяем, что адаптер инициализирован
    if (!this.db) {
      console.warn('SyncAdapter not initialized yet, retrying in 100ms...');
      setTimeout(() => this.addToSyncQueue(table, operation, data), 100);
      return;
    }

    // Создаем хеш данных для предотвращения дублирования
    const dataHash = this.createDataHash(data);
    
    // Проверяем, нет ли уже такой операции в очереди
    const existingOperation = this.syncQueue.find(op => 
      op.table === table && 
      op.operation === operation && 
      op.hash === dataHash &&
      op.status === 'pending'
    );
    
    if (existingOperation) {
      console.log('Operation already in queue, skipping...', { table, operation, dataHash });
      return;
    }

    const syncOp: SyncOperation = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      operation,
      data,
      timestamp: now,
      deviceId: this.deviceId,
      userId: this.userId,
      hash: dataHash,
      status: 'pending',
      retryCount: 0
    };

    console.log(`Adding operation to sync queue: ${operation} on ${table}`, syncOp);
    
    this.syncQueue.push(syncOp);
    this.saveSyncQueue();

    // Если онлайн, сразу запускаем синхронизацию
    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  private createDataHash(data: any): string {
    try {
      const dataStr = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < dataStr.length; i++) {
        const char = dataStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(36);
    } catch (error) {
      return Date.now().toString();
    }
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
      this.lastSyncAttempt = 0;
      this.performSync();
    }, delay);
  }

  // Выполнить синхронизацию
  private async performSync(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync...', this.syncQueue.length, 'operations pending');

    // Получаем операции для синхронизации
    const operationsToSync = [...this.syncQueue];

    try {
      if (this.isOnline && this.syncMode !== 'local') {
        // Пытаемся синхронизироваться с сервером
        const results = await this.sendOperationsToServer(operationsToSync);
        
        if (results.length > 0) {
          // Обрабатываем результаты
          await this.processSyncResults(results);
          
          // Удаляем обработанные операции из очереди
          this.syncQueue = this.syncQueue.filter(op => 
            !operationsToSync.some(syncedOp => syncedOp.id === op.id)
          );
          this.saveSyncQueue();
          
          // Обновляем время последней синхронизации
          this.lastSync = Date.now();
          
          console.log('Server sync completed successfully');
          
          // Получаем операции от других устройств
          await this.pullOperationsFromServer();
        } else {
          // Сервер недоступен, переключаемся на локальную синхронизацию
          console.log('Server not available, switching to local sync');
          this.syncMode = 'local';
          await this.performLocalSync(operationsToSync);
        }
      } else {
        // Офлайн режим - только локальная синхронизация
        await this.performLocalSync(operationsToSync);
      }
      
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Обрабатываем ошибки
      if (error instanceof Error && error.message.includes('401')) {
        console.log('Authentication error, clearing sync queue');
        this.syncQueue = [];
        this.saveSyncQueue();
        this.lastSyncAttempt = Date.now();
      } else {
        // Увеличиваем счетчик попыток для неудачных операций
        for (const op of operationsToSync) {
          op.retryCount++;
          op.lastRetry = Date.now();
          if (op.retryCount >= 3) {
            op.status = 'failed';
          }
        }
        this.saveSyncQueue();
      }
    } finally {
      this.isSyncing = false;
      
      // Если есть еще операции и не было критической ошибки, планируем следующую синхронизацию
      if (this.syncQueue.filter(op => op.status === 'pending').length > 0 && this.lastSyncAttempt === 0) {
        this.scheduleSync();
      }
    }
  }

  // Локальная синхронизация между вкладками
  private async performLocalSync(operations: SyncOperation[]): Promise<void> {
    try {
      console.log('Performing local sync...');
      
      // Сохраняем операции в localStorage для других вкладок
      for (const op of operations) {
        this.saveOperationToLocalStorage(op);
      }
      
      // Получаем операции от других вкладок
      await this.pullOperationsFromLocalStorage();
      
      // Помечаем операции как синхронизированные
      for (const op of operations) {
        op.status = 'synced';
      }
      this.saveSyncQueue();
      
      this.lastSync = Date.now();
      console.log('Local sync completed successfully');
      
    } catch (error) {
      console.error('Local sync failed:', error);
    }
  }

  // Отправить операции на сервер
  private async sendOperationsToServer(operations: SyncOperation[]): Promise<any[]> {
    const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
    
    if (!isApiAvailable()) {
      console.log('API not available, skipping server sync');
      return [];
    }
    
    try {
      const apiUrl = getApiUrl('sync');
      
      if (!apiUrl) {
        console.log('API URL is empty, skipping server sync');
        return [];
      }
      
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
        await this.handleConflict(result);
      } else if (result.success) {
        console.log(`Operation ${result.operationId} synced successfully`);
      }
    }
  }

  // Обработать конфликт синхронизации
  private async handleConflict(conflictResult: any): Promise<void> {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      localOperation: conflictResult.localOperation,
      remoteOperation: conflictResult.remoteOperation,
      resolution: 'manual',
      createdAt: Date.now()
    };

    this.conflicts.push(conflict);
    
    // Уведомляем пользователя о конфликте
    this.notifyConflict(conflict);
  }

  // Уведомить о конфликте
  private notifyConflict(conflict: SyncConflict): void {
    const event = new CustomEvent('sync-conflict', {
      detail: { conflict }
    });
    window.dispatchEvent(event);
  }

  // Разрешить конфликт
  resolveConflict(conflictId: string, resolution: 'local' | 'remote'): void {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);

    if (conflictIndex === -1) return;

    const conflict = this.conflicts[conflictIndex];
    conflict.resolution = resolution;

    // Применяем разрешение
    if (resolution === 'local') {
      this.syncQueue = this.syncQueue.filter(op => 
        op.id !== conflict.remoteOperation.id
      );
    } else {
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
    const now = Date.now();
    
    // Throttling для обновления статуса
    if (now - this.lastStatusUpdate < this.statusUpdateThrottle) {
      return {
        lastSync: this.lastSync,
        pendingOperations: this.syncQueue.filter(op => op.status === 'pending'),
        conflicts: [...this.conflicts],
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        deviceId: this.deviceId,
        userId: this.userId,
        syncMode: this.syncMode
      };
    }
    
    this.lastStatusUpdate = now;
    
    return {
      lastSync: this.lastSync,
      pendingOperations: this.syncQueue.filter(op => op.status === 'pending'),
      conflicts: [...this.conflicts],
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      deviceId: this.deviceId,
      userId: this.userId,
      syncMode: this.syncMode
    };
  }

  // Принудительная синхронизация
  async forceSync(): Promise<void> {
    const now = Date.now();
    
    // Проверяем, не слишком ли рано для повторной попытки
    if (this.lastSyncAttempt > 0) {
      const timeSinceLastAttempt = now - this.lastSyncAttempt;
      if (timeSinceLastAttempt < 30000) { // меньше 30 секунд
        console.log('Skipping forceSync - too soon after critical error');
        return;
      }
    }
    
    // Проверяем доступность API
    const { isApiAvailable } = await import('../config/api');
    if (!isApiAvailable()) {
      console.log('API not available, using local sync only for forceSync');
      const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
      if (pendingOperations.length > 0) {
        await this.performLocalSync(pendingOperations);
      }
      return;
    }
    
    if (this.isOnline) {
      if (this.syncQueue.filter(op => op.status === 'pending').length > 0) {
        await this.performSync();
      } else {
        await this.pullOperationsFromServer();
      }
    }
  }

  // Очистить очередь синхронизации
  clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  // Сбросить флаг критических ошибок
  resetCriticalErrorFlag(): void {
    this.lastSyncAttempt = 0;
    console.log('Critical error flag reset');
  }

  // Установить пользователя
  setUser(userId: string): void {
    if (this.userId === userId) {
      console.log(`User already set to ${userId}, skipping...`);
      return;
    }
    
    console.log('Setting user for sync:', userId);
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
        
        if (this.isOnline && this.syncMode !== 'local') {
          await this.pullOperationsFromServer();
        } else {
          await this.pullOperationsFromLocalStorage();
        }
      } catch (error) {
        console.error('Initial sync failed:', error);
      }
    }, 2000);
  }

  // Выполнить начальную синхронизацию
  private async performInitialSync(): Promise<void> {
    try {
      console.log('Performing initial sync...');
      
      if (this.isOnline && this.syncMode !== 'local') {
        await this.pullOperationsFromServer();
      } else {
        await this.pullOperationsFromLocalStorage();
      }
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  }

  // Получить количество операций в очереди
  getPendingOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'pending').length;
  }

  // Получить количество конфликтов
  getConflictsCount(): number {
    return this.conflicts.length;
  }

  // Получение операций от других устройств с сервера
  private async pullOperationsFromServer(): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastSyncAttempt < this.syncRetryDelay) {
        console.log('Skipping server sync - too soon after last attempt');
        return;
      }
      
      this.lastSyncAttempt = now;
      console.log('Pulling operations from server...');
      
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (!isApiAvailable()) {
        console.log('API not available, using local sync only');
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      const apiUrl = getApiUrl(`sync/operations?deviceId=${this.deviceId}&lastSync=${this.lastSync}`);
      
      if (!apiUrl) {
        console.log('API URL is empty, using local sync only');
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      if (apiUrl.includes('localhost') && window.location.hostname.includes('vercel.app')) {
        console.log('On Vercel, skipping server sync to localhost');
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Not authenticated, skipping server sync');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        console.log(`Received ${result.data.length} operations from other devices`);
        
        for (const operation of result.data) {
          await this.applyRemoteOperation({
            id: operation.operation_id,
            table: operation.table_name,
            operation: operation.operation_type,
            data: JSON.parse(operation.data),
            timestamp: new Date(operation.timestamp).getTime(),
            deviceId: operation.source_device_id,
            userId: operation.user_id,
            hash: this.createDataHash(operation.data),
            status: 'synced',
            retryCount: 0
          });
          
          await this.acknowledgeOperation(operation.operation_id);
        }
        
        this.lastSync = Date.now();
        console.log('Successfully applied operations from other devices');
      }
      
    } catch (error) {
      console.error('Failed to pull operations from server:', error);
      console.log('Falling back to local sync...');
      await this.pullOperationsFromLocalStorage();
    }
  }

  // Fallback синхронизация через localStorage
  private async pullOperationsFromLocalStorage(): Promise<void> {
    try {
      const allOperations = this.getAllOperationsFromLocalStorage();
      
      if (allOperations.length > 0) {
        console.log(`Found ${allOperations.length} operations from localStorage`);
        
        const sortedOperations = allOperations.sort((a, b) => a.timestamp - b.timestamp);
        
        let appliedOperations = 0;
        
        for (const operation of sortedOperations) {
          await this.applyRemoteOperation(operation);
          appliedOperations++;
        }
        
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

  // Сохранение операции в localStorage для синхронизации между вкладками
  private saveOperationToLocalStorage(operation: SyncOperation): void {
    try {
      const storageKey = `warehouse-sync-${this.deviceId}`;
      console.log('Saving operation to localStorage with key:', storageKey);
      
      const existingOperations = localStorage.getItem(storageKey);
      let operations: SyncOperation[] = [];
      
      if (existingOperations) {
        try {
          operations = JSON.parse(existingOperations);
        } catch (e) {
          console.warn('Failed to parse existing localStorage operations:', e);
        }
      }
      
      // Добавляем новую операцию
      operations.push(operation);
      
      // Ограничиваем количество операций (последние 100)
      if (operations.length > 100) {
        operations = operations.slice(-100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(operations));
      localStorage.setItem('warehouse-sync-updated', Date.now().toString());
      
      console.log(`Operation saved to localStorage: ${operation.operation} on ${operation.table}`);
    } catch (error) {
      console.error('Failed to save operation to localStorage:', error);
    }
  }

  // Получение операций от всех устройств/вкладок из localStorage
  private getAllOperationsFromLocalStorage(): SyncOperation[] {
    try {
      const allOperations: SyncOperation[] = [];
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      console.log('Scanning localStorage for operations...');
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('warehouse-sync-')) {
          try {
            const operations = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(operations)) {
              const validOperations = operations.filter((op: SyncOperation) => {
                const isNew = op.timestamp > this.lastSync;
                const isNotTooOld = (now - op.timestamp) < maxAge;
                return isNew && isNotTooOld;
              });
              
              if (validOperations.length < operations.length) {
                const oldOperationsCount = operations.length - validOperations.length;
                console.log(`Cleaning up ${oldOperationsCount} old operations from ${key}`);
                localStorage.setItem(key, JSON.stringify(validOperations));
              }
              
              allOperations.push(...validOperations);
            }
          } catch (e) {
            console.warn('Failed to parse localStorage operation:', e);
            localStorage.removeItem(key);
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

  // Подтверждение получения операции
  private async acknowledgeOperation(operationId: string): Promise<void> {
    try {
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (!isApiAvailable()) {
        return;
      }
      
      const apiUrl = getApiUrl(`sync/operations/${operationId}/acknowledge`);
      
      if (!apiUrl) {
        return;
      }
      
      await fetch(apiUrl, {
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
      if (this.isOnline && this.syncQueue.filter(op => op.status === 'pending').length > 0) {
        const now = Date.now();
        if (now - this.lastSyncAttempt < this.syncRetryDelay) {
          return;
        }
        
        this.lastSyncAttempt = now;
        
        const { isApiAvailable } = await import('../config/api');
        if (!isApiAvailable()) {
          this.syncMode = 'local';
          await this.performLocalSync([...this.syncQueue]);
          return;
        }
        
        await this.performSync();
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
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
  }

  // Очистить все ресурсы и остановить работу
  cleanup(): void {
    console.log('Cleaning up SyncAdapter...');
    this.stopAutoSync();
    this.isInitialized = false;
    this.lastSyncAttempt = 0;
    console.log('SyncAdapter cleanup completed');
  }

  // Получить информацию об устройстве
  getDeviceInfo(): { deviceId: string; userId?: string; lastSync: number; syncMode: string } {
    return {
      deviceId: this.deviceId,
      userId: this.userId,
      lastSync: this.lastSync,
      syncMode: this.syncMode
    };
  }
}

// Создаем единственный экземпляр адаптера синхронизации
export const syncAdapter = new SyncAdapter();

export default SyncAdapter;
