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
  private syncRetryDelay: number = 5000; // 5 секунд между попытками (было 30 секунд)
  private isInitialized: boolean = false;
  private initializationTimeout: NodeJS.Timeout | null = null;
  private syncMode: 'server' | 'local' | 'hybrid' = 'hybrid';
  private isForcedLocalMode: boolean = false;
  
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
      
              try {
          this.db = getDatabase();
        } catch (error) {
          try {
            console.error('Failed to get database:', error);
          } catch (consoleError) {
            // Игнорируем ошибки console.error
          }
          throw new Error('Database initialization failed');
        }
      
                      try {
          this.deviceId = this.generateDeviceId();
        } catch (error) {
          try {
            console.error('Failed to generate device ID:', error);
          } catch (consoleError) {
            // Игнорируем ошибки console.error
          }
          this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      
        try {
          this.loadSyncQueue();
        } catch (error) {
          try {
            console.error('Failed to load sync queue:', error);
          } catch (consoleError) {
            // Игнорируем ошибки console.error
          }
          this.syncQueue = [];
        }
      
              try {
          console.log('SyncAdapter initialized successfully');
          console.log('Device ID:', this.deviceId);
        } catch (error) {
          // Игнорируем ошибки console.log
        }
      
      // Проверяем доступность API и устанавливаем режим синхронизации
      try {
        this.checkApiAccessibilityOnInit();
      } catch (error) {
        try {
          console.error('Failed to check API accessibility:', error);
        } catch (consoleError) {
          // Игнорируем ошибки console.error
        }
        this.syncMode = 'local';
      }
      
      // Запускаем автоматическую синхронизацию
      try {
        this.startAutoSync();
      } catch (error) {
        try {
          console.error('Failed to start auto sync:', error);
        } catch (consoleError) {
          // Игнорируем ошибки console.error
        }
        this.syncMode = 'local';
      }
      
      // Инициализация через небольшую задержку
      this.initializationTimeout = setTimeout(async () => {
        try {
          // Проверяем, не была ли уже выполнена инициализация
          if (this.isInitialized) {
            console.log('🔄 Sync already initialized, skipping...');
            return;
          }
          
          this.isInitialized = true;
          console.log('🔄 Performing initial sync...');
          
          // Выполняем начальную синхронизацию только один раз
          await this.performInitialSync();
          
        } catch (error) {
          console.error('❌ Initial sync failed:', error);
          // При ошибке переключаемся на локальный режим
          this.syncMode = 'local';
        }
      }, 2000); // Увеличиваем задержку до 2 секунд
      
      // Запускаем автоматическую очистку каждые 6 часов
      setInterval(() => {
        try {
          this.cleanupOldOperations();
          this.cleanupLocalStorage();
        } catch (error) {
          console.error('Auto cleanup failed:', error);
        }
      }, 6 * 60 * 60 * 1000);
      
    } catch (error) {
      try {
        console.error('Failed to initialize SyncAdapter:', error);
      } catch (consoleError) {
        // Игнорируем ошибки console.error
      }
      
      // При ошибке инициализации переключаемся на локальный режим
      this.syncMode = 'local';
    }
  }
  
  // Проверка доступности API при инициализации
  private async checkApiAccessibilityOnInit(): Promise<void> {
    try {
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (isApiAvailable()) {
        const testUrl = getApiUrl('sync');
        
        if (testUrl && testUrl.includes('supabase.co')) {
          try {
            // Проверяем доступность Supabase Edge Functions через sync endpoint
            const testResponse = await fetch(testUrl, {
              method: 'HEAD',
              headers: getAuthHeaders()
            });
            
            if (!testResponse.ok && testResponse.status !== 404) {
              console.log('Supabase not accessible on init, switching to local mode');
              this.syncMode = 'local';
              return;
            }
          } catch (testError) {
            console.log('Supabase accessibility test failed on init, switching to local mode:', testError);
            this.syncMode = 'local';
            return;
          }
        }
        
        // API доступен, устанавливаем гибридный режим
        this.syncMode = 'hybrid';
        try {
          console.log('API accessible, using hybrid sync mode');
        } catch (error) {
          // Игнорируем ошибки console.log
        }
      } else {
        // API недоступен, устанавливаем локальный режим
        this.syncMode = 'local';
        try {
          console.log('API not available, using local sync mode');
        } catch (error) {
          // Игнорируем ошибки console.log
        }
      }
    } catch (error) {
      try {
        console.log('API accessibility check failed on init, using local mode:', error);
      } catch (consoleError) {
        // Игнорируем ошибки console.log
      }
      this.syncMode = 'local';
    }
  }

  private generateDeviceId(): string {
    // Генерируем уникальный ID для устройства
    const existingId = localStorage.getItem('warehouse-device-id');
    if (existingId && existingId.length > 10) {
      return existingId;
    }
    
    // Создаем более стабильный ID на основе характеристик устройства
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Создаем хеш из характеристик устройства
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
      const char = deviceInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const deviceId = `device_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
    
    try {
      localStorage.setItem('warehouse-device-id', deviceId);
    } catch (error) {
      console.warn('Failed to save device ID to localStorage:', error);
    }
    
    return deviceId;
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('warehouse-sync-queue');
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        
        // Валидируем загруженные данные
        if (Array.isArray(parsedQueue)) {
          this.syncQueue = parsedQueue.filter(op => {
            // Проверяем, что операция имеет все необходимые поля
            if (!op || typeof op !== 'object') return false;
            if (!op.id || !op.table || !op.operation || !op.timestamp) return false;
            if (!['create', 'update', 'delete'].includes(op.operation)) return false;
            if (typeof op.timestamp !== 'number') return false;
            
            return true;
          });
          
          // Фильтруем только pending операции
          this.syncQueue = this.syncQueue.filter(op => op.status === 'pending');
          
          console.log(`Loaded ${this.syncQueue.length} pending operations from localStorage`);
        } else {
          console.warn('Invalid sync queue format in localStorage');
          this.syncQueue = [];
        }
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
      
      // Очищаем поврежденные данные
      try {
        localStorage.removeItem('warehouse-sync-queue');
        console.log('Cleared corrupted sync queue data');
      } catch (cleanupError) {
        console.error('Failed to clear corrupted sync queue data:', cleanupError);
      }
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem('warehouse-sync-queue', JSON.stringify(this.syncQueue));
      localStorage.setItem('warehouse-sync-queue-updated', Date.now().toString());
      
      // Уведомляем об обновлении статуса
      this.notifyStatusUpdate();
      
    } catch (error) {
      console.error('Error saving sync queue:', error);
      
      // Если localStorage переполнен, очищаем старые данные
      if (error instanceof Error && error.message.includes('QuotaExceededError')) {
        console.log('localStorage quota exceeded, cleaning up old data...');
        this.cleanupLocalStorage(12 * 60 * 60 * 1000); // Очищаем данные старше 12 часов
        
        // Повторяем попытку сохранения
        try {
          localStorage.setItem('warehouse-sync-queue', JSON.stringify(this.syncQueue));
          localStorage.setItem('warehouse-sync-queue-updated', Date.now().toString());
          console.log('Sync queue saved after cleanup');
        } catch (retryError) {
          console.error('Failed to save sync queue after cleanup:', retryError);
        }
      }
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

    // Валидация данных
    if (!data || typeof data !== 'object') {
      console.warn('Invalid data for sync operation, skipping...', { table, operation, data });
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

    // Проверяем, нет ли такой операции в localStorage (для предотвращения дублирования между вкладками)
    const localStorageKey = `warehouse-sync-${this.deviceId}`;
    try {
      const existingLocalOperations = localStorage.getItem(localStorageKey);
      if (existingLocalOperations) {
        const localOps = JSON.parse(existingLocalOperations);
        const localDuplicate = localOps.find((op: SyncOperation) => 
          op.table === table && 
          op.operation === operation && 
          op.hash === dataHash
        );
        
        if (localDuplicate) {
          console.log('Operation already exists in localStorage, skipping...', { table, operation, dataHash });
          return;
        }
      }
    } catch (error) {
      console.warn('Failed to check localStorage for duplicates:', error);
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
      // Создаем стабильный хеш, исключая временные поля
      const stableData = { ...data };
      
      // Убираем временные поля, которые могут изменяться
      delete stableData.createdAt;
      delete stableData.updatedAt;
      delete stableData.timestamp;
      delete stableData.id; // ID может быть разным в разных базах
      delete stableData.uuid; // UUID может быть разным в разных базах
      delete stableData.created_by; // Пользователь может быть разным
      delete stableData.updated_by; // Пользователь может быть разным
      
      // Сортируем ключи для стабильного хеша
      const sortedKeys = Object.keys(stableData).sort();
      const sortedData: any = {};
      
      for (const key of sortedKeys) {
        if (stableData[key] !== undefined && stableData[key] !== null) {
          sortedData[key] = stableData[key];
        }
      }
      
      const dataStr = JSON.stringify(sortedData);
      let hash = 0;
      
      for (let i = 0; i < dataStr.length; i++) {
        const char = dataStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return hash.toString(36);
    } catch (error) {
      console.warn('Failed to create data hash, using timestamp:', error);
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

    // Дополнительная задержка для локального режима
    if (this.syncMode === 'local') {
      delay = Math.max(delay, 5000); // минимум 5 секунд для локальной синхронизации
    }

    console.log(`Scheduling sync in ${delay}ms (mode: ${this.syncMode})`);
    
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
        
        // Обрабатываем результаты (даже если пустые)
        if (results !== null && results !== undefined) {
          await this.processSyncResults(results);
        } else {
          console.log('No results to process from server sync');
        }
        
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
        // Офлайн режим или локальный режим - только локальная синхронизация
        console.log(`Using local sync mode (${this.syncMode})`);
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
        // При ошибке сервера переключаемся на локальную синхронизацию
        console.log('Server sync failed, falling back to local sync');
        await this.performLocalSync(operationsToSync);
        
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
      
      // Если мы в локальном режиме, но есть интернет, проверяем возможность переключения на гибридный
      if (this.isOnline && this.syncMode === 'local') {
        this.checkApiAccessibilityForModeSwitch();
      }
      
    } catch (error) {
      console.error('Local sync failed:', error);
    }
  }
  
  // Проверка возможности переключения на гибридный режим
  private async checkApiAccessibilityForModeSwitch(): Promise<void> {
    // Не пытаемся переключиться обратно, если режим был принудительно установлен
    if (this.isForcedLocalMode) {
      console.log('Local mode was forced, skipping API accessibility check');
      return;
    }
    
    try {
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (isApiAvailable()) {
        const testUrl = getApiUrl('sync');
        
        if (testUrl && testUrl.includes('supabase.co')) {
          try {
            // Проверяем доступность Supabase Edge Functions через sync endpoint
            const testResponse = await fetch(testUrl, {
              method: 'HEAD',
              headers: getAuthHeaders()
            });
            
            if (testResponse.ok || testResponse.status === 404) {
              console.log('API became accessible, switching to hybrid mode');
              this.syncMode = 'hybrid';
            }
          } catch (testError) {
            // API все еще недоступен, остаемся в локальном режиме
            console.log('API still not accessible, staying in local mode');
          }
        }
      }
    } catch (error) {
      console.log('API accessibility check for mode switch failed:', error);
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
      
      // Дополнительная проверка доступности URL
      if (apiUrl.includes('supabase.co')) {
        try {
                      // Проверяем доступность Supabase Edge Functions через sync endpoint
            const testResponse = await fetch(apiUrl, {
              method: 'HEAD',
              headers: getAuthHeaders()
            });
          
          if (!testResponse.ok && testResponse.status !== 404) {
            console.log('Supabase URL not accessible, switching to local sync');
            return [];
          }
        } catch (testError) {
          console.log('Supabase URL test failed, switching to local sync:', testError);
          return [];
        }
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

      const result = await response.json();
      
      // Edge Function возвращает объект, а не массив
      if (result.success) {
        // Возвращаем массив результатов для совместимости
        return result.conflicts || [];
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Failed to send operations to server:', error);
      
      // Если ошибка связана с недоступностью URL, возвращаем пустой массив
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      )) {
        console.log('Network error detected, switching to local sync');
        return [];
      }
      
      // Для других ошибок возвращаем пустой массив, чтобы продолжить синхронизацию
      console.log('Server error, but continuing with sync');
      return [];
    }
  }

  // Обработать результаты синхронизации
  private async processSyncResults(results: any[]): Promise<void> {
    // Убеждаемся, что results - это массив
    if (!Array.isArray(results)) {
      console.log('processSyncResults: results is not an array, skipping processing');
      return;
    }
    
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

    console.log('New conflict detected:', conflict);

    // Проверяем, нет ли уже такого конфликта
    const existingConflict = this.conflicts.find(c => 
      c.localOperation.hash === conflict.localOperation.hash &&
      c.remoteOperation.hash === conflict.remoteOperation.hash
    );

    if (existingConflict) {
      console.log('Conflict already exists, skipping...');
      return;
    }

    this.conflicts.push(conflict);
    
    // Уведомляем пользователя о конфликте
    this.notifyConflict(conflict);
    
    // Автоматически разрешаем простые конфликты
    this.autoResolveSimpleConflicts();
  }
  
  // Автоматическое разрешение простых конфликтов
  private autoResolveSimpleConflicts(): void {
    const simpleConflicts = this.conflicts.filter(conflict => 
      conflict.resolution === 'manual' &&
      conflict.localOperation.operation === conflict.remoteOperation.operation &&
      conflict.localOperation.table === conflict.remoteOperation.table
    );
    
    for (const conflict of simpleConflicts) {
      try {
        // Если операции одинаковые, выбираем более новую версию
        const resolution = conflict.localOperation.timestamp > conflict.remoteOperation.timestamp 
          ? 'local' 
          : 'remote';
        
        this.resolveConflict(conflict.id, resolution);
      } catch (error) {
        console.error(`Failed to auto-resolve simple conflict ${conflict.id}:`, error);
      }
    }
  }

  // Уведомить о конфликте
  private notifyConflict(conflict: SyncConflict): void {
    console.log('Notifying about conflict:', conflict.id);
    
    const event = new CustomEvent('sync-conflict', {
      detail: { conflict }
    });
    window.dispatchEvent(event);
    
    // Также отправляем событие о статусе синхронизации
    const statusEvent = new CustomEvent('sync-status-updated', {
      detail: { 
        status: this.getSyncStatus(),
        conflictCount: this.conflicts.length
      }
    });
    window.dispatchEvent(statusEvent);
  }
  
  // Уведомить об обновлении статуса
  private notifyStatusUpdate(): void {
    const event = new CustomEvent('sync-status-updated', {
      detail: { 
        status: this.getSyncStatus(),
        conflictCount: this.conflicts.length
      }
    });
    window.dispatchEvent(event);
  }

  // Разрешить конфликт
  resolveConflict(conflictId: string, resolution: 'local' | 'remote'): void {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);

    if (conflictIndex === -1) {
      console.warn(`Conflict ${conflictId} not found`);
      return;
    }

    const conflict = this.conflicts[conflictIndex];
    conflict.resolution = resolution;

    console.log(`Resolving conflict ${conflictId} with resolution: ${resolution}`);

    try {
      // Применяем разрешение
      if (resolution === 'local') {
        // Локальная версия остается, удаляем удаленную
        this.syncQueue = this.syncQueue.filter(op => 
          op.id !== conflict.remoteOperation.id
        );
        console.log('Kept local operation, removed remote operation');
      } else {
        // Удаленная версия побеждает, обновляем локальные данные
        this.applyRemoteOperation(conflict.remoteOperation);
        this.syncQueue = this.syncQueue.filter(op => 
          op.id !== conflict.localOperation.id
        );
        console.log('Applied remote operation, removed local operation');
      }

      // Удаляем конфликт из списка
      this.conflicts.splice(conflictIndex, 1);
      this.saveSyncQueue();
      
      console.log(`Conflict ${conflictId} resolved successfully`);
      
    } catch (error) {
      console.error(`Failed to resolve conflict ${conflictId}:`, error);
      // Возвращаем конфликт в список при ошибке
      if (conflictIndex === -1) {
        this.conflicts.push(conflict);
      }
    }
  }
  
  // Автоматическое разрешение конфликтов
  autoResolveConflicts(): void {
    console.log('Auto-resolving conflicts...');
    
    const conflictsToResolve = [...this.conflicts];
    
    for (const conflict of conflictsToResolve) {
      try {
        // Автоматически выбираем более новую версию
        const resolution = conflict.localOperation.timestamp > conflict.remoteOperation.timestamp 
          ? 'local' 
          : 'remote';
        
        this.resolveConflict(conflict.id, resolution);
      } catch (error) {
        console.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
      }
    }
    
    console.log(`Auto-resolved ${conflictsToResolve.length} conflicts`);
  }

  // Применить удаленную операцию
  private async applyRemoteOperation(operation: SyncOperation): Promise<void> {
    try {
      // Проверяем, не применяли ли мы уже эту операцию
      if (operation.timestamp <= this.lastSync) {
        console.log(`Skipping already applied operation: ${operation.operation} on ${operation.table}`);
        return;
      }
      
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
        default:
          console.warn(`Unknown operation type: ${operation.operation}`);
          return;
      }
      
      console.log(`Applied remote operation: ${operation.operation} on ${operation.table}`);
      
      // Обновляем время последней синхронизации
      this.lastSync = Math.max(this.lastSync, operation.timestamp);
      
    } catch (error) {
      console.error(`Failed to apply remote operation ${operation.operation} on ${operation.table}:`, error);
      
      // Если это ошибка дублирования, игнорируем её
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        console.log(`Operation already exists, skipping: ${operation.operation} on ${operation.table}`);
        return;
      }
      
      throw error;
    }
  }

  // Получить статус синхронизации
  getSyncStatus(): SyncStatus {
    const now = Date.now();
    
    // Throttling для обновления статуса
    if (now - this.lastStatusUpdate < this.statusUpdateThrottle) {
      return this.createSyncStatus();
    }
    
    this.lastStatusUpdate = now;
    return this.createSyncStatus();
  }
  
  // Создать объект статуса синхронизации
  private createSyncStatus(): SyncStatus {
    const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
    
    return {
      lastSync: this.lastSync,
      pendingOperations,
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
    
    // Если уже в локальном режиме, не пытаемся подключиться к серверу
    if (this.syncMode === 'local') {
      console.log('In local mode, performing local sync only');
      const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
      if (pendingOperations.length > 0) {
        await this.performLocalSync(pendingOperations);
      }
      return;
    }
    
    // Проверяем, не слишком ли рано для повторной попытки
    if (this.lastSyncAttempt > 0) {
      const timeSinceLastAttempt = now - this.lastSyncAttempt;
      if (timeSinceLastAttempt < 60000) { // увеличиваем до 1 минуты
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
    
    // Дополнительная проверка доступности Supabase
    if (this.isOnline) {
      try {
        const { getApiUrl, getAuthHeaders } = await import('../config/api');
        const testUrl = getApiUrl('sync');
        
        if (testUrl && testUrl.includes('supabase.co')) {
          // Проверяем доступность Supabase Edge Functions через sync endpoint
          const testResponse = await fetch(testUrl, {
            method: 'HEAD',
            headers: getAuthHeaders()
          });
          
          if (!testResponse.ok && testResponse.status !== 404) {
            console.log('Supabase not accessible, switching to local sync mode');
            this.syncMode = 'local';
            const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
            if (pendingOperations.length > 0) {
              await this.performLocalSync(pendingOperations);
            }
            return;
          }
        }
             } catch (testError) {
         console.log('Supabase accessibility test failed, but continuing with hybrid mode:', testError);
         // Не переключаемся в локальный режим принудительно, продолжаем работать в гибридном
         const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
         if (pendingOperations.length > 0) {
           await this.performLocalSync(pendingOperations);
         }
         return;
       }
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
    const queueSize = this.syncQueue.length;
    this.syncQueue = [];
    this.saveSyncQueue();
    console.log(`Cleared ${queueSize} operations from sync queue`);
  }
  
  // Очистить только неудачные операции
  clearFailedOperations(): void {
    const failedCount = this.syncQueue.filter(op => op.status === 'failed').length;
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'failed');
    this.saveSyncQueue();
    console.log(`Cleared ${failedCount} failed operations from sync queue`);
  }
  
  // Очистить только успешно синхронизированные операции
  clearSyncedOperations(): void {
    const syncedCount = this.syncQueue.filter(op => op.status === 'synced').length;
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'synced');
    this.saveSyncQueue();
    console.log(`Cleared ${syncedCount} synced operations from sync queue`);
  }

  // Сбросить флаг критических ошибок
  resetCriticalErrorFlag(): void {
    this.lastSyncAttempt = 0;
    this.lastOperationAdd = 0;
    this.lastStatusUpdate = 0;
    console.log('Critical error flags reset');
  }
  
  // Сбросить все флаги и таймауты
  resetAllFlags(): void {
    this.lastSyncAttempt = 0;
    this.lastOperationAdd = 0;
    this.lastStatusUpdate = 0;
    // Разрешаем возврат в гибридный режим, если не было принудительного переключения
    if (!this.isForcedLocalMode) {
      this.syncMode = 'hybrid';
    }
    console.log('All flags and timeouts reset, mode:', this.syncMode, 'forced:', this.isForcedLocalMode);
  }
  
  // Перезапустить синхронизацию
  restartSync(): void {
    console.log('🔄 Restarting sync...');
    
    // Останавливаем текущую синхронизацию
    this.stopAutoSync();
    
    // Сбрасываем флаги с задержкой
    setTimeout(() => {
      this.lastSyncAttempt = 0;
      this.syncRetryDelay = 5000;
      this.lastOperationAdd = 0;
      this.lastStatusUpdate = 0;
      
      console.log(`✅ Sync restarted in ${this.syncMode} mode`);
      
      // Запускаем синхронизацию с задержкой
      this.startAutoSync();
    }, 1000);
  }
  
  // Принудительно переключиться в локальный режим
  forceLocalMode(): void {
    console.log('Forcing local mode permanently...');
    this.syncMode = 'local';
    this.isForcedLocalMode = true;
    this.lastSyncAttempt = Date.now();
            this.syncRetryDelay = 60000; // 1 минута (было 5 минут)
    this.stopAutoSync();
    this.startAutoSync();
  }
  
  // Попытаться вернуться в гибридный режим
  tryHybridMode(): void {
    console.log('Attempting to switch back to hybrid mode...');
    this.syncMode = 'hybrid';
    this.isForcedLocalMode = false;
    this.lastSyncAttempt = 0;
            this.syncRetryDelay = 5000; // Возвращаем к 5 секундам (было 30 секунд)
    this.restartSync();
  }
  
  // Принудительно сбросить все блокировки и попробовать подключиться к серверу
  forceServerMode(): void {
    console.log('Forcing server connection attempt...');
    this.syncMode = 'hybrid';
    this.isForcedLocalMode = false;
    this.lastSyncAttempt = 0;
    this.syncRetryDelay = 5000; // Возвращаем к 5 секундам (было 30 секунд)
    this.lastOperationAdd = 0;
    this.lastStatusUpdate = 0;
    
    // Принудительно сбрасываем все флаги критических ошибок
    this.resetCriticalErrorFlag();
    
    // Перезапускаем систему
    this.restartSync();
    
    // Сразу пытаемся подключиться
    setTimeout(() => {
      this.forceSync();
    }, 1000);
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
      // Проверяем доступность API перед планированием синхронизации
      this.checkApiAccessibilityAndScheduleSync();
    }
  }
  
  // Проверка доступности API и планирование синхронизации
  private async checkApiAccessibilityAndScheduleSync(): Promise<void> {
    try {
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (isApiAvailable()) {
        const testUrl = getApiUrl('sync');
        
            if (testUrl && testUrl.includes('supabase.co')) {
              try {
                // Проверяем доступность Supabase Edge Functions через sync endpoint
                const testResponse = await fetch(testUrl, {
                  method: 'HEAD',
                  headers: getAuthHeaders()
                });
                
                if (!testResponse.ok && testResponse.status !== 404) {
                  console.log('Supabase not accessible, switching to local sync mode');
                  this.syncMode = 'local';
                  // Выполняем локальную синхронизацию сразу
                  await this.pullOperationsFromLocalStorage();
                  return;
                }
              } catch (testError) {
                console.log('Supabase accessibility test failed, switching to local sync mode:', testError);
                this.syncMode = 'local';
                // Выполняем локальную синхронизацию сразу
                await this.pullOperationsFromLocalStorage();
                return;
              }
            }
        
        // API доступен, планируем обычную синхронизацию
        this.scheduleInitialSync();
      } else {
        // API недоступен, переключаемся на локальный режим
        this.syncMode = 'local';
        await this.pullOperationsFromLocalStorage();
      }
    } catch (error) {
      console.log('API accessibility check failed, switching to local sync mode:', error);
      this.syncMode = 'local';
      await this.pullOperationsFromLocalStorage();
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
        
        // Проверяем доступность API перед попыткой серверной синхронизации
        if (this.isOnline && this.syncMode !== 'local') {
          try {
            const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
            
            if (isApiAvailable()) {
              const testUrl = getApiUrl('sync');
              
              if (testUrl && testUrl.includes('supabase.co')) {
                // Проверяем доступность Supabase Edge Functions через sync endpoint
                const testResponse = await fetch(testUrl, {
                  method: 'HEAD',
                  headers: getAuthHeaders()
                });
                
                if (!testResponse.ok && testResponse.status !== 404) {
                  console.log('Supabase not accessible in initial sync, switching to local mode');
                  this.syncMode = 'local';
                  await this.pullOperationsFromLocalStorage();
                  return;
                }
              }
              
              await this.pullOperationsFromServer();
            } else {
              await this.pullOperationsFromLocalStorage();
            }
          } catch (testError) {
            console.log('API accessibility test failed in initial sync, switching to local mode:', testError);
            this.syncMode = 'local';
            await this.pullOperationsFromLocalStorage();
          }
        } else {
          await this.pullOperationsFromLocalStorage();
        }
      } catch (error) {
        console.error('Initial sync failed:', error);
        // При ошибке переключаемся на локальную синхронизацию
        this.syncMode = 'local';
        await this.pullOperationsFromLocalStorage();
      }
    }, 2000);
  }

  // Выполнить начальную синхронизацию
  private async performInitialSync(): Promise<void> {
    try {
      // Убираем дублирующий лог, так как он уже есть в инициализации
      
      // Проверяем доступность API перед попыткой серверной синхронизации
        if (this.isOnline && this.syncMode !== 'local') {
          try {
            const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
            
            if (isApiAvailable()) {
              const testUrl = getApiUrl('sync');
              
              if (testUrl && testUrl.includes('supabase.co')) {
                // Проверяем доступность Supabase Edge Functions через sync endpoint
                const testResponse = await fetch(testUrl, {
                  method: 'HEAD',
                  headers: getAuthHeaders()
                });
                
                if (!testResponse.ok && testResponse.status !== 404) {
                  console.log('Supabase not accessible in performInitialSync, switching to local mode');
                  this.syncMode = 'local';
                  await this.pullOperationsFromLocalStorage();
                  return;
                }
              }
              
              await this.pullOperationsFromServer();
            } else {
              await this.pullOperationsFromLocalStorage();
            }
          } catch (testError) {
            console.log('API accessibility test failed in performInitialSync, switching to local mode:', testError);
            this.syncMode = 'local';
            await this.pullOperationsFromLocalStorage();
          }
        } else {
          await this.pullOperationsFromLocalStorage();
        }
    } catch (error) {
      console.error('Initial sync failed:', error);
      // При ошибке переключаемся на локальную синхронизацию
      this.syncMode = 'local';
      await this.pullOperationsFromLocalStorage();
    }
  }

  // Получить количество операций в очереди
  getPendingOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'pending').length;
  }
  
  // Получить количество неудачных операций
  getFailedOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'failed').length;
  }
  
  // Получить количество успешно синхронизированных операций
  getSyncedOperationsCount(): number {
    return this.syncQueue.filter(op => op.status === 'synced').length;
  }
  
  // Получить общую статистику операций
  getOperationsStats(): {
    pending: number;
    failed: number;
    synced: number;
    total: number;
  } {
    const pending = this.getPendingOperationsCount();
    const failed = this.getFailedOperationsCount();
    const synced = this.getSyncedOperationsCount();
    
    return {
      pending,
      failed,
      synced,
      total: this.syncQueue.length
    };
  }

  // Получить количество конфликтов
  getConflictsCount(): number {
    return this.conflicts.length;
  }

  // Получение операций от других устройств с сервера
  private async pullOperationsFromServer(): Promise<void> {
    try {
      // Если уже в локальном режиме, не пытаемся подключиться к серверу
      if (this.syncMode === 'local') {
        console.log('In local mode, using localStorage only');
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      const now = Date.now();
      if (now - this.lastSyncAttempt < this.syncRetryDelay) {
        if (import.meta.env.DEV) {
          console.log('⏭️ Skipping server sync - too soon after last attempt');
        }
        return;
      }
      
      this.lastSyncAttempt = now;
      
      if (import.meta.env.DEV) {
        console.log('🔄 Pulling operations from server...');
      }
      
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (!isApiAvailable()) {
        if (import.meta.env.DEV) {
          console.log('⚠️ API not available, using local sync only');
        }
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      const apiUrl = getApiUrl(`sync?deviceId=${this.deviceId}&lastSync=${this.lastSync}`);
      
      if (!apiUrl) {
        if (import.meta.env.DEV) {
          console.log('⚠️ API URL is empty, using local sync only');
        }
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      if (apiUrl.includes('localhost') && window.location.hostname.includes('vercel.app')) {
        if (import.meta.env.DEV) {
          console.log('🌐 On Vercel, skipping server sync to localhost');
        }
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
      // Дополнительная проверка доступности URL
      if (apiUrl.includes('supabase.co')) {
        try {
          // Проверяем доступность Supabase Edge Functions через sync endpoint
          const testResponse = await fetch(apiUrl, {
            method: 'HEAD',
            headers: getAuthHeaders()
          });
          
          if (!testResponse.ok && testResponse.status !== 404) {
            if (import.meta.env.DEV) {
              console.log('⚠️ Supabase URL not accessible, using local sync only');
            }
            await this.pullOperationsFromLocalStorage();
            return;
          }
        } catch (testError) {
          if (import.meta.env.DEV) {
            console.log('⚠️ Supabase URL test failed, using local sync only:', testError);
          }
          await this.pullOperationsFromLocalStorage();
          return;
        }
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
        if (import.meta.env.DEV) {
          console.log(`📥 Received ${result.data.length} operations from other devices`);
        }
        
        for (const operation of result.data) {
          await this.applyRemoteOperation({
            id: operation.operation_id,
            table: operation.table_name,
            operation: operation.operation_type,
            data: operation.data_after,
            timestamp: new Date(operation.created_at).getTime(),
            deviceId: operation.source_device_id,
            userId: operation.user_id,
            hash: this.createDataHash(operation.data_after),
            status: 'synced',
            retryCount: 0
          });
          
          // Временно отключаем подтверждение операций из-за проблем с триггером
          // await this.acknowledgeOperation(operation.operation_id);
        }
        
        this.lastSync = Date.now();
        if (import.meta.env.DEV) {
          console.log('✅ Successfully applied operations from other devices');
        }
      }
      
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Failed to pull operations from server:', error);
      }
      
      // Если ошибка связана с недоступностью URL, переключаемся на локальную синхронизацию
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      )) {
        if (import.meta.env.DEV) {
          console.log('🌐 Network error detected, switching to local sync');
        }
        this.syncMode = 'local';
        await this.pullOperationsFromLocalStorage();
        return;
      }
      
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
        let skippedOperations = 0;
        
        for (const operation of sortedOperations) {
          try {
            // Проверяем, не применяли ли мы уже эту операцию
            if (operation.timestamp <= this.lastSync) {
              skippedOperations++;
              continue;
            }
            
            await this.applyRemoteOperation(operation);
            appliedOperations++;
            
            // Обновляем время последней синхронизации после каждой успешной операции
            this.lastSync = Math.max(this.lastSync, operation.timestamp);
            
          } catch (opError) {
            console.error(`Failed to apply operation ${operation.id}:`, opError);
            // Продолжаем с другими операциями
          }
        }
        
        if (appliedOperations > 0) {
          console.log(`Successfully applied ${appliedOperations} operations from localStorage`);
          console.log(`Skipped ${skippedOperations} already applied operations`);
        } else {
          console.log('No new operations were applied from localStorage');
        }
      } else {
        console.log('No operations found in localStorage');
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
      
      // Проверяем, нет ли уже такой операции
      const existingOperation = operations.find(op => 
        op.id === operation.id || 
        (op.table === operation.table && 
         op.operation === operation.operation && 
         op.hash === operation.hash)
      );
      
      if (existingOperation) {
        console.log('Operation already exists in localStorage, skipping...');
        return;
      }
      
      // Добавляем новую операцию
      operations.push(operation);
      
      // Ограничиваем количество операций (последние 100)
      if (operations.length > 100) {
        operations = operations.slice(-100);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(operations));
      localStorage.setItem('warehouse-sync-updated', Date.now().toString());
      
      if (import.meta.env.DEV) {
        console.log(`💾 Operation saved to localStorage: ${operation.operation} on ${operation.table}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Failed to save operation to localStorage:', error);
      }
    }
  }

  // Получение операций от всех устройств/вкладок из localStorage
  private getAllOperationsFromLocalStorage(): SyncOperation[] {
    try {
      const allOperations: SyncOperation[] = [];
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 часа
      
      if (import.meta.env.DEV) {
        console.log('🔍 Scanning localStorage for operations...');
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('warehouse-sync-')) {
          try {
            const operations = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(operations)) {
              const validOperations = operations.filter((op: SyncOperation) => {
                const isNew = op.timestamp > this.lastSync;
                const isNotTooOld = (now - op.timestamp) < maxAge;
                const isNotFromCurrentDevice = op.deviceId !== this.deviceId;
                return isNew && isNotTooOld && isNotFromCurrentDevice;
              });
              
              if (validOperations.length < operations.length) {
                const oldOperationsCount = operations.length - validOperations.length;
                if (import.meta.env.DEV) {
                  console.log(`🧹 Cleaning up ${oldOperationsCount} old operations from ${key}`);
                }
                localStorage.setItem(key, JSON.stringify(validOperations));
              }
              
              allOperations.push(...validOperations);
            }
          } catch (e) {
            if (import.meta.env.DEV) {
              console.warn('⚠️ Failed to parse localStorage operation:', e);
            }
            localStorage.removeItem(key);
          }
        }
      }
      
      // Убираем дубликаты по хешу
      const uniqueOperations = allOperations.filter((op, index, self) => 
        index === self.findIndex(o => o.hash === op.hash)
      );
      
      if (import.meta.env.DEV) {
        console.log('📊 Total operations found:', uniqueOperations.length);
      }
      return uniqueOperations;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error getting operations from localStorage:', error);
      }
      return [];
    }
  }

  // Подтверждение получения операции (временно отключено)
  /*
  private async acknowledgeOperation(operationId: string): Promise<void> {
    try {
      const { getApiUrl, getAuthHeaders, isApiAvailable } = await import('../config/api');
      
      if (!isApiAvailable()) {
        return;
      }
      
      const apiUrl = getApiUrl(`sync/${operationId}/acknowledge`);
      
      if (!apiUrl) {
        return;
      }
      
      // Дополнительная проверка доступности URL
      if (apiUrl.includes('supabase.co')) {
        try {
          // Проверяем доступность Supabase Edge Functions через sync endpoint
          const testResponse = await fetch(apiUrl, {
            method: 'HEAD',
            headers: getAuthHeaders()
          });
          
          if (!testResponse.ok && testResponse.status !== 404) {
            console.log('Supabase URL not accessible, skipping acknowledgment');
            return;
          }
        } catch (testError) {
          console.log('Supabase URL test failed, skipping acknowledgment:', testError);
          return;
        }
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
      
      // Если ошибка связана с недоступностью URL, не повторяем попытку
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_NAME_NOT_RESOLVED') ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      )) {
        console.log('Network error detected, skipping acknowledgment');
        return;
      }
    }
  }
  */

  // Запустить автоматическую синхронизацию
  startAutoSync(intervalMs: number = 30000): void {
    // Проверяем, не запущена ли уже синхронизация
    if (this.syncInterval) {
      console.log('⚠️ Auto sync already running, skipping...');
      return;
    }

    console.log(`🚀 Starting auto sync with interval: ${intervalMs}ms`);

    this.syncInterval = setInterval(async () => {
      try {
        // Периодическая очистка (каждые 10 циклов синхронизации)
        const syncCount = Math.floor(Date.now() / intervalMs);
        if (syncCount % 10 === 0) {
          this.cleanupOldOperations();
          this.cleanupLocalStorage();
        }
        
        // Если в локальном режиме, работаем только с localStorage
        if (this.syncMode === 'local') {
          const pendingOps = this.syncQueue.filter(op => op.status === 'pending');
          if (pendingOps.length > 0) {
            console.log(`🔄 Local sync: processing ${pendingOps.length} pending operations`);
            await this.performLocalSync([...pendingOps]);
          }
          return;
        }
        
        // Проверяем, есть ли операции для синхронизации
        const pendingOps = this.syncQueue.filter(op => op.status === 'pending');
        if (pendingOps.length === 0) {
          return; // Нет операций для синхронизации
        }
        
        // Проверяем время последней попытки
        const now = Date.now();
        if (now - this.lastSyncAttempt < this.syncRetryDelay) {
          return; // Слишком рано для повторной попытки
        }
        
        this.lastSyncAttempt = now;
        
        // Проверяем доступность API
        const { isApiAvailable } = await import('../config/api');
        if (!isApiAvailable()) {
          console.log('⚠️ API not available, switching to local mode');
          this.syncMode = 'local';
          await this.performLocalSync([...pendingOps]);
          return;
        }
        
        // Дополнительная проверка доступности Supabase
        if (this.syncMode === 'hybrid' || this.syncMode === 'server') {
          try {
            const { getApiUrl, getAuthHeaders } = await import('../config/api');
            const testUrl = getApiUrl('sync');
            
            if (testUrl && testUrl.includes('supabase.co')) {
              const testResponse = await fetch(testUrl, {
                method: 'HEAD',
                headers: getAuthHeaders()
              });
              
              if (!testResponse.ok && testResponse.status !== 404) {
                console.log('⚠️ Supabase not accessible, switching to local mode');
                this.syncMode = 'local';
                await this.performLocalSync([...pendingOps]);
                return;
              }
            }
          } catch (testError) {
            console.log('⚠️ Supabase accessibility test failed, switching to local mode:', testError);
            this.syncMode = 'local';
            await this.performLocalSync([...pendingOps]);
            return;
          }
        }
        
        // Выполняем синхронизацию
        console.log(`🔄 Auto sync: processing ${pendingOps.length} operations`);
        await this.performSync();
        
      } catch (error) {
        console.error('❌ Auto sync error:', error);
        // При ошибке не перезапускаем, просто логируем
      }
    }, intervalMs);
    
    console.log('✅ Auto sync started successfully');
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
    
    // Очищаем все таймауты
    this.lastSyncAttempt = 0;
    this.lastOperationAdd = 0;
    this.lastStatusUpdate = 0;
    
    console.log('Auto sync stopped');
  }

  // Очистить все ресурсы и остановить работу
  cleanup(): void {
    console.log('Cleaning up SyncAdapter...');
    this.stopAutoSync();
    this.isInitialized = false;
    this.lastSyncAttempt = 0;
    this.lastOperationAdd = 0;
    this.lastStatusUpdate = 0;
    this.syncMode = 'local';
    console.log('SyncAdapter cleanup completed');
  }
  
  // Очистить старые операции из очереди
  cleanupOldOperations(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const oldOperations = this.syncQueue.filter(op => 
      (now - op.timestamp) > maxAge && op.status !== 'pending'
    );
    
    if (oldOperations.length > 0) {
      console.log(`Cleaning up ${oldOperations.length} old operations`);
      this.syncQueue = this.syncQueue.filter(op => !oldOperations.includes(op));
      this.saveSyncQueue();
    }
  }
  
  // Очистить localStorage от старых операций
  cleanupLocalStorage(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('warehouse-sync-')) {
        try {
          const operations = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(operations)) {
            const validOperations = operations.filter((op: SyncOperation) => 
              (now - op.timestamp) < maxAge
            );
            
            if (validOperations.length < operations.length) {
              const removedCount = operations.length - validOperations.length;
              console.log(`Cleaned up ${removedCount} old operations from ${key}`);
              localStorage.setItem(key, JSON.stringify(validOperations));
            }
          }
        } catch (error) {
          console.warn(`Failed to cleanup localStorage key ${key}:`, error);
          // Удаляем поврежденные данные
          localStorage.removeItem(key);
        }
      }
    }
  }

  // Получить информацию об устройстве
  getDeviceInfo(): { 
    deviceId: string; 
    userId?: string; 
    lastSync: number; 
    syncMode: string;
    isOnline: boolean;
    isSyncing: boolean;
    isForcedLocalMode: boolean;
    operationsStats: {
      pending: number;
      failed: number;
      synced: number;
      total: number;
    };
  } {
    return {
      deviceId: this.deviceId,
      userId: this.userId,
      lastSync: this.lastSync,
      syncMode: this.syncMode,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      isForcedLocalMode: this.isForcedLocalMode,
      operationsStats: this.getOperationsStats()
    };
  }
}

// Создаем единственный экземпляр адаптера синхронизации
export const syncAdapter = new SyncAdapter();

// Глобальный метод для очистки при закрытии приложения
export const cleanupSyncAdapter = () => {
  console.log('Global cleanup of SyncAdapter...');
  syncAdapter.cleanup();
};

// Добавляем обработчик для очистки при закрытии страницы
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupSyncAdapter);
  window.addEventListener('pagehide', cleanupSyncAdapter);
}

export default SyncAdapter;
