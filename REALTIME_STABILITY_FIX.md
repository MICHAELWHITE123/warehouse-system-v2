# Исправление нестабильности Supabase Realtime

## 🚨 Проблема

Supabase Realtime подключается, но сразу же отключается, создавая цикл подключения/отключения:

```
🔗 Connecting to Supabase Realtime for tables: (5) ['equipment', 'shipments', 'categories', 'locations', 'equipment_stacks']
📡 Channel equipment status: SUBSCRIBED
🔌 Disconnecting from Supabase Realtime
📡 Channel equipment status: CLOSED
📡 Channel shipments status: CLOSED
📡 Channel categories status: CLOSED
📡 Channel locations status: CLOSED
📡 Channel equipment_stacks status: CLOSED
```

**ДОПОЛНИТЕЛЬНО:** Обнаружены проблемы с SyncAdapter:

```
Auto sync stopped
User already set to Qstream, skipping...
Auto sync stopped
User already set to Qstream, skipping...
Skipping server sync - too soon after last attempt
```

## 🔍 Причины

1. **Постоянное перемонтирование компонентов** - React пересоздает компоненты
2. **Нестабильные зависимости** - обработчики событий пересоздаются при каждом рендере
3. **Отсутствие защиты от повторных подключений** - нет проверки состояния подключения
4. **Циклические зависимости** - useEffect вызывает переподключение
5. **Множественные экземпляры useSync** - два компонента инициализируют синхронизацию
6. **Слишком большие задержки синхронизации** - 30 секунд блокируют каждую попытку

## ✅ Решение

### 1. Стабилизация хука useSupabaseRealtime

Добавлены флаги для предотвращения повторных подключений:

```typescript
const isConnectingRef = useRef(false);
const isDisconnectingRef = useRef(false);

const connect = useCallback(() => {
  if (!supabaseRef.current || isConnectingRef.current || isDisconnectingRef.current) {
    return; // Предотвращаем повторные подключения
  }
  
  isConnectingRef.current = true;
  // ... логика подключения
}, [tables, handleRealtimeEvent, autoReconnect]);
```

### 2. Мемоизация обработчиков событий

В хуке `useRealTimeSync` добавлена мемоизация:

```typescript
const memoizedHandlers = useMemo(() => ({
  onEquipmentChange: (event: any) => {
    const realtimeEvent: RealTimeEvent = {
      type: 'equipment_update',
      action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
      data: event.record,
      timestamp: event.timestamp
    };
    onEquipmentUpdate?.(realtimeEvent);
    onAnyUpdate?.(realtimeEvent);
    setLastUpdate(realtimeEvent);
  },
  // ... другие обработчики
}), [onEquipmentUpdate, onShipmentUpdate, onCategoryUpdate, onLocationUpdate, onStackUpdate, onAnyUpdate]);
```

### 3. Улучшенная логика useEffect

```typescript
useEffect(() => {
  if (supabaseRef.current && !isConnected && !isConnectingRef.current) {
    connect();
  }

  return () => {
    if (isConnected) {
      disconnect();
    }
  };
}, [connect, disconnect, isConnected]);
```

### 4. Исправление множественных экземпляров useSync

**Проблема:** Два компонента (`SyncNotifications` и `SyncStatus`) использовали `useSync`, создавая дублирующуюся инициализацию.

**Решение:** Добавлен паттерн Singleton в `useSync`:

```typescript
// Флаг для отслеживания инициализации
let isInitialized = false;

export const useSync = () => {
  const initializationRef = useRef(false);

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (initializationRef.current || isInitialized) {
      return;
    }

    initializationRef.current = true;
    isInitialized = true;
    
    // ... инициализация синхронизации
  }, []);
};
```

### 5. Оптимизация задержек синхронизации

**Было:** `syncRetryDelay = 30000` (30 секунд)
**Стало:** `syncRetryDelay = 5000` (5 секунд)

Это предотвращает блокировку каждой попытки синхронизации.

### 6. Глобальная очистка ресурсов

Добавлен глобальный метод очистки:

```typescript
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
```

## 🔧 Технические детали

### Флаги состояния
- `isConnectingRef` - предотвращает повторные подключения
- `isDisconnectingRef` - предотвращает повторные отключения
- `isConnected` - текущее состояние подключения
- `isInitialized` - глобальный флаг инициализации useSync

### Мемоизация
- Обработчики событий мемоизированы для стабильности
- Зависимости useEffect оптимизированы
- Предотвращены лишние пересоздания функций

### Защита от циклов
- Проверка состояния перед подключением/отключением
- Условное выполнение useEffect
- Стабильные ссылки на функции
- Singleton паттерн для useSync

### Оптимизация синхронизации
- Уменьшены задержки между попытками
- Улучшена логика auto sync
- Предотвращены повторные запуски

## 🚀 Результат

После применения исправлений:

✅ **Стабильное подключение** - нет циклов подключения/отключения
✅ **Оптимизированная производительность** - меньше лишних рендеров
✅ **Надежная работа** - защита от повторных операций
✅ **Правильная синхронизация** - события обрабатываются корректно
✅ **Единая инициализация** - нет дублирующихся экземпляров
✅ **Оптимальные задержки** - синхронизация работает плавно

## 📱 Использование

Теперь хук работает стабильно:

```typescript
const { isConnected, connectionError, lastUpdate } = useRealTimeSync({
  onEquipmentUpdate: (event) => {
    console.log('Оборудование обновлено:', event);
  },
  onShipmentUpdate: (event) => {
    console.log('Поставка обновлена:', event);
  }
});
```

## 🔍 Отладка

### Проверка стабильности
```typescript
// В консоли должно быть:
🔗 Connecting to Supabase Realtime for tables: equipment,shipments,categories,locations,equipment_stacks
📡 Channel equipment status: SUBSCRIBED
📡 Channel shipments status: SUBSCRIBED
📡 Channel categories status: SUBSCRIBED
📡 Channel locations status: SUBSCRIBED
📡 Channel equipment_stacks status: SUBSCRIBED
// НЕ должно быть постоянных переподключений!
```

### Проверка событий
```typescript
// При изменении данных:
📨 Supabase Realtime event: { type: 'UPDATE', table: 'equipment', ... }
```

### Проверка синхронизации
```typescript
// В консоли НЕ должно быть:
Auto sync stopped
User already set to Qstream, skipping...
Skipping server sync - too soon after last attempt
```

## 🛠️ Дополнительные улучшения

### 1. Автоматическое переподключение
```typescript
if (autoReconnect) {
  setTimeout(() => connect(), 5000);
}
```

### 2. Обработка ошибок
```typescript
} catch (error) {
  console.error('❌ Failed to connect to Supabase Realtime:', error);
  setConnectionError(error instanceof Error ? error.message : 'Connection failed');
  isConnectingRef.current = false;
}
```

### 3. Очистка ресурсов
```typescript
return () => {
  if (isConnected) {
    disconnect();
  }
};
```

## 📚 Рекомендации

1. **Используйте мемоизацию** для обработчиков событий
2. **Стабилизируйте зависимости** в useEffect
3. **Добавляйте флаги состояния** для предотвращения повторных операций
4. **Правильно очищайте ресурсы** при размонтировании
5. **Тестируйте стабильность** подключения
6. **Используйте Singleton паттерн** для глобальных сервисов
7. **Оптимизируйте задержки** синхронизации

## 🔧 Исправленные файлы

- `src/hooks/useSync.ts` - добавлен Singleton паттерн
- `src/database/syncAdapter.ts` - оптимизированы задержки и добавлена глобальная очистка

Теперь ваше приложение должно работать стабильно с Supabase Realtime! 🎉
