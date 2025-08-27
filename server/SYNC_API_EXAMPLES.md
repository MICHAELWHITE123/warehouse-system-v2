# Sync API Usage Examples

Примеры использования API синхронизации WeareHouse для различных сценариев.

## Базовая настройка клиента

```typescript
class SyncClient {
  private apiUrl: string;
  private authToken: string;
  private deviceId: string;

  constructor(apiUrl: string, deviceId: string) {
    this.apiUrl = apiUrl;
    this.deviceId = deviceId;
  }

  async authenticate(username: string, password: string) {
    const response = await fetch(`${this.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
      this.authToken = data.data.token;
      await this.registerDevice();
    }
    return data;
  }

  async registerDevice() {
    return fetch(`${this.apiUrl}/api/auth/device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        device_name: navigator.userAgent || 'Unknown Device',
        device_type: 'web',
        platform: 'web'
      })
    });
  }

  private async apiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    return await response.json();
  }
}
```

## 1. Сценарий: Создание нового оборудования

```typescript
async function createEquipment(client: SyncClient, equipmentData: any) {
  // 1. Создаем локально
  const localEquipment = {
    id: `eq_${Date.now()}`,
    ...equipmentData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 2. Сохраняем в локальной БД
  await saveToLocalDB('equipment', localEquipment);

  // 3. Отправляем на сервер через PUSH
  const pushData = {
    device_id: client.deviceId,
    changes: [{
      table: 'equipment',
      operation: 'CREATE',
      record_id: localEquipment.id,
      data: localEquipment,
      timestamp: Date.now()
    }]
  };

  const result = await client.apiRequest('/sync/push', 'POST', pushData);
  
  if (result.success) {
    console.log('Equipment synced successfully');
    await markAsSynced('equipment', localEquipment.id);
  } else {
    console.log('Sync failed, will retry later');
    await markAsPending('equipment', localEquipment.id);
  }

  return localEquipment;
}
```

## 2. Сценарий: Обновление оборудования

```typescript
async function updateEquipment(client: SyncClient, equipmentId: string, updates: any) {
  // 1. Обновляем локально
  const updatedEquipment = {
    ...updates,
    id: equipmentId,
    updated_at: new Date().toISOString()
  };

  await updateLocalDB('equipment', equipmentId, updatedEquipment);

  // 2. Отправляем изменения
  const pushData = {
    device_id: client.deviceId,
    changes: [{
      table: 'equipment',
      operation: 'UPDATE',
      record_id: equipmentId,
      data: updatedEquipment,
      timestamp: Date.now()
    }]
  };

  const result = await client.apiRequest('/sync/push', 'POST', pushData);
  
  if (!result.success && result.data.conflicts?.length > 0) {
    // Обрабатываем конфликты
    for (const conflict of result.data.conflicts) {
      await handleConflict(client, conflict);
    }
  }

  return updatedEquipment;
}
```

## 3. Сценарий: Периодическая синхронизация

```typescript
class PeriodicSync {
  private client: SyncClient;
  private lastSyncTime: number = 0;
  private syncInterval: number = 30000; // 30 секунд

  constructor(client: SyncClient) {
    this.client = client;
    this.startPeriodicSync();
  }

  private startPeriodicSync() {
    setInterval(async () => {
      await this.performSync();
    }, this.syncInterval);
  }

  async performSync() {
    try {
      // 1. Отправляем локальные изменения
      const pendingChanges = await getPendingChanges();
      if (pendingChanges.length > 0) {
        const pushResult = await this.client.apiRequest('/sync/push', 'POST', {
          device_id: this.client.deviceId,
          changes: pendingChanges
        });

        if (pushResult.success) {
          await markChangesAsSynced(pendingChanges);
        }
      }

      // 2. Получаем удаленные изменения
      const pullResult = await this.client.apiRequest('/sync/pull', 'POST', {
        device_id: this.client.deviceId,
        last_sync: this.lastSyncTime
      });

      if (pullResult.success) {
        await this.applyRemoteChanges(pullResult.data.changes);
        this.lastSyncTime = Date.now();
      }

      // 3. Отправляем heartbeat
      await this.client.apiRequest('/devices/heartbeat', 'POST', {
        device_id: this.client.deviceId
      });

    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  private async applyRemoteChanges(changes: any[]) {
    for (const change of changes) {
      try {
        switch (change.operation) {
          case 'CREATE':
            await saveToLocalDB(change.table, change.data);
            break;
          case 'UPDATE':
            await updateLocalDB(change.table, change.record_id, change.data);
            break;
          case 'DELETE':
            await deleteFromLocalDB(change.table, change.record_id);
            break;
        }
      } catch (error) {
        console.error(`Failed to apply change ${change.id}:`, error);
      }
    }
  }
}
```

## 4. Сценарий: Обработка конфликтов

```typescript
async function handleConflict(client: SyncClient, conflict: any) {
  console.log('Conflict detected:', conflict);

  // 1. Получаем рекомендацию по разрешению
  const recommendation = await client.apiRequest(
    `/sync/conflicts/${conflict.id}/recommendation`
  );

  if (recommendation.data.can_auto_resolve) {
    // 2. Автоматическое разрешение
    const resolution = recommendation.data.recommendation.strategy;
    
    const resolveResult = await client.apiRequest(
      `/sync/conflicts/${conflict.id}/resolve`,
      'POST',
      { resolution }
    );

    if (resolveResult.success) {
      console.log('Conflict resolved automatically:', resolution);
      
      // Применяем разрешенные данные локально
      await updateLocalDB(
        conflict.table_name,
        conflict.record_id,
        resolveResult.data.local_data
      );
    }
  } else {
    // 3. Ручное разрешение
    await showConflictDialog(conflict, async (userChoice: string, mergedData?: any) => {
      const resolveResult = await client.apiRequest(
        `/sync/conflicts/${conflict.id}/resolve`,
        'POST',
        {
          resolution: userChoice,
          resolved_data: mergedData
        }
      );

      if (resolveResult.success) {
        await updateLocalDB(conflict.table_name, conflict.record_id, mergedData);
      }
    });
  }
}

async function showConflictDialog(conflict: any, onResolve: Function) {
  // Показываем пользователю диалог с вариантами разрешения
  const userChoice = await showModal({
    title: 'Conflict Resolution',
    message: `Conflict in ${conflict.table_name}`,
    localData: conflict.local_operation.data,
    remoteData: conflict.remote_operation.data,
    options: ['local_wins', 'remote_wins', 'manual']
  });

  if (userChoice === 'manual') {
    // Показываем интерфейс для ручного слияния
    const mergedData = await showMergeInterface(
      conflict.local_operation.data,
      conflict.remote_operation.data
    );
    onResolve('manual', mergedData);
  } else {
    onResolve(userChoice);
  }
}
```

## 5. Сценарий: Офлайн режим

```typescript
class OfflineManager {
  private client: SyncClient;
  private isOnline: boolean = navigator.onLine;
  private pendingQueue: any[] = [];

  constructor(client: SyncClient) {
    this.client = client;
    this.setupOfflineHandling();
  }

  private setupOfflineHandling() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async performOperation(operation: any) {
    if (this.isOnline) {
      try {
        return await this.client.apiRequest('/sync/push', 'POST', {
          device_id: this.client.deviceId,
          changes: [operation]
        });
      } catch (error) {
        // Если ошибка сети, добавляем в очередь
        this.addToQueue(operation);
        throw error;
      }
    } else {
      // Офлайн режим - добавляем в очередь
      this.addToQueue(operation);
      return { success: true, queued: true };
    }
  }

  private addToQueue(operation: any) {
    this.pendingQueue.push({
      ...operation,
      queued_at: Date.now()
    });
    localStorage.setItem('sync_queue', JSON.stringify(this.pendingQueue));
  }

  private async processQueuedOperations() {
    const savedQueue = localStorage.getItem('sync_queue');
    if (savedQueue) {
      this.pendingQueue = JSON.parse(savedQueue);
    }

    while (this.pendingQueue.length > 0 && this.isOnline) {
      const operation = this.pendingQueue.shift();
      
      try {
        await this.client.apiRequest('/sync/push', 'POST', {
          device_id: this.client.deviceId,
          changes: [operation]
        });
        
        console.log('Queued operation synced:', operation);
      } catch (error) {
        // Возвращаем операцию в очередь при ошибке
        this.pendingQueue.unshift(operation);
        break;
      }
    }

    localStorage.setItem('sync_queue', JSON.stringify(this.pendingQueue));
  }
}
```

## 6. Сценарий: Bulk операции

```typescript
async function performBulkSync(client: SyncClient, operations: any[]) {
  const BATCH_SIZE = 50; // Настройте под ваши нужды
  
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);
    
    try {
      const result = await client.apiRequest('/sync/push', 'POST', {
        device_id: client.deviceId,
        changes: batch
      });

      if (result.success) {
        console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1} synced successfully`);
        
        // Обрабатываем конфликты если есть
        if (result.data.conflicts?.length > 0) {
          for (const conflict of result.data.conflicts) {
            await handleConflict(client, conflict);
          }
        }
      } else {
        console.error(`Batch ${Math.floor(i/BATCH_SIZE) + 1} failed:`, result.errors);
      }
      
      // Небольшая пауза между батчами
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, error);
    }
  }
}
```

## 7. Сценарий: Мониторинг статуса

```typescript
class SyncStatusMonitor {
  private client: SyncClient;
  private statusCallback: (status: any) => void;

  constructor(client: SyncClient, statusCallback: (status: any) => void) {
    this.client = client;
    this.statusCallback = statusCallback;
    this.startMonitoring();
  }

  private startMonitoring() {
    setInterval(async () => {
      const status = await this.getSyncStatus();
      this.statusCallback(status);
    }, 10000); // Каждые 10 секунд
  }

  async getSyncStatus() {
    try {
      const result = await this.client.apiRequest(
        `/sync/status?device_id=${this.client.deviceId}`
      );

      if (result.success) {
        return {
          isOnline: true,
          totalEntries: result.data.total_entries,
          pending: result.data.pending,
          conflicts: result.data.conflicts,
          lastSync: result.data.device_specific?.last_sync,
          devices: result.data.devices
        };
      }
    } catch (error) {
      return {
        isOnline: false,
        error: error.message
      };
    }
  }

  async validateIntegrity() {
    const result = await this.client.apiRequest('/sync/validate');
    return result.data;
  }
}
```

## 8. Полный пример приложения

```typescript
class SyncApp {
  private syncClient: SyncClient;
  private periodicSync: PeriodicSync;
  private offlineManager: OfflineManager;
  private statusMonitor: SyncStatusMonitor;

  async initialize(apiUrl: string, deviceId: string) {
    this.syncClient = new SyncClient(apiUrl, deviceId);
    
    // Аутентификация
    const credentials = this.getStoredCredentials();
    if (credentials) {
      await this.syncClient.authenticate(credentials.username, credentials.password);
    }

    // Настройка компонентов синхронизации
    this.periodicSync = new PeriodicSync(this.syncClient);
    this.offlineManager = new OfflineManager(this.syncClient);
    this.statusMonitor = new SyncStatusMonitor(this.syncClient, (status) => {
      this.updateUI(status);
    });
  }

  async createEquipment(data: any) {
    const operation = {
      table: 'equipment',
      operation: 'CREATE',
      record_id: `eq_${Date.now()}`,
      data: { ...data, created_at: new Date().toISOString() },
      timestamp: Date.now()
    };

    // Сохраняем локально
    await this.saveLocally(operation);

    // Синхронизируем
    return await this.offlineManager.performOperation(operation);
  }

  async updateEquipment(id: string, updates: any) {
    const operation = {
      table: 'equipment',
      operation: 'UPDATE',
      record_id: id,
      data: { ...updates, updated_at: new Date().toISOString() },
      timestamp: Date.now()
    };

    await this.saveLocally(operation);
    return await this.offlineManager.performOperation(operation);
  }

  private async saveLocally(operation: any) {
    // Ваша логика сохранения в локальную БД
    console.log('Saving locally:', operation);
  }

  private updateUI(status: any) {
    // Обновление интерфейса на основе статуса синхронизации
    console.log('Sync status:', status);
  }

  private getStoredCredentials() {
    // Получение сохраненных учетных данных
    return JSON.parse(localStorage.getItem('credentials') || 'null');
  }
}

// Использование
const app = new SyncApp();
app.initialize('https://your-api.vercel.app', 'device-123');
```

## Рекомендации по производительности

1. **Батчинг**: Группируйте операции в батчи по 50-100 элементов
2. **Throttling**: Ограничивайте частоту синхронизации
3. **Кеширование**: Кешируйте статус синхронизации локально
4. **Compression**: Используйте сжатие для больших объемов данных
5. **Incremental sync**: Синхронизируйте только изменения

## Обработка ошибок

1. **Network errors**: Автоматический retry с экспоненциальной задержкой
2. **Validation errors**: Показ пользователю с возможностью исправления
3. **Conflicts**: Автоматическое разрешение когда возможно
4. **Server errors**: Логирование и уведомление пользователя
