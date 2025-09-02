# Настройка синхронизации только через базу данных

## Обзор изменений

Внесены изменения для принудительного использования только базы данных (БД) вместо локальной синхронизации. Локальное хранилище (localStorage) полностью отключено.

## Основные изменения

### 1. Гибридный адаптер (`src/database/hybridAdapter.ts`)

- **Отключен fallback к локальному хранилищу**: `fallbackToLocal = false`
- **Запрещено использование localStorage**: все методы set/get/delete не используют локальное хранилище
- **Принудительная проверка БД**: инициализация требует наличия хотя бы одного адаптера БД (Redis или Postgres)

### 2. Адаптер синхронизации (`src/database/syncAdapter.ts`)

- **Режим синхронизации**: принудительно установлен в `'server'`
- **Отключена локальная синхронизация**: все fallback к localStorage удалены
- **Принудительное использование сервера**: при ошибках БД приложение не переключается на локальный режим

### 3. Конфигурация (`src/config/databaseConfig.ts`)

- **Новый файл конфигурации**: централизованные настройки для отключения локальной синхронизации
- **Функции проверки**: утилиты для проверки разрешений на использование локального хранилища

### 4. Инициализация БД (`src/database/index.ts`)

- **Проверка конфигурации**: перед инициализацией проверяется разрешение на использование localStorage
- **Принудительная БД**: инициализация требует наличия подключения к БД

## Требования

### Обязательные компоненты

1. **Supabase Edge Functions**: для серверной синхронизации
2. **Redis/Vercel KV**: для кэширования и временных данных
3. **Postgres**: для постоянного хранения данных (опционально)

### Конфигурация окружения

```bash
# Обязательные переменные
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VERCEL_KV_URL=your_vercel_kv_url
VITE_VERCEL_KV_REST_API_URL=your_vercel_kv_rest_api_url
VITE_VERCEL_KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
VITE_VERCEL_KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token

# Опциональные переменные для Postgres
VITE_POSTGRES_URL=your_postgres_url
VITE_POSTGRES_HOST=your_postgres_host
VITE_POSTGRES_DATABASE=your_postgres_database
VITE_POSTGRES_USERNAME=your_postgres_username
VITE_POSTGRES_PASSWORD=your_postgres_password
```

## Поведение приложения

### Онлайн режим
- Все операции синхронизируются через Supabase Edge Functions
- Данные сохраняются в Redis/Vercel KV для кэширования
- При ошибках БД приложение показывает ошибку вместо fallback к localStorage

### Офлайн режим
- **Приложение не работает**: локальная синхронизация отключена
- Показывается сообщение об ошибке подключения к БД
- Пользователь должен восстановить подключение для продолжения работы

### Обработка ошибок
- **Ошибки БД**: приложение показывает ошибку и не переключается на локальный режим
- **Ошибки сети**: приложение показывает ошибку подключения
- **Ошибки аутентификации**: очищается очередь синхронизации

## Восстановление локальной синхронизации

Если нужно восстановить локальную синхронизацию:

1. **Изменить конфигурацию** в `src/config/databaseConfig.ts`:
```typescript
export const DATABASE_CONFIG = {
  fallbackToLocal: true,
  syncMode: 'hybrid',
  forceLocalMode: false,
  hybrid: {
    fallbackToLocal: true,
    allowLocalStorage: true
  },
  sync: {
    mode: 'hybrid',
    allowLocalSync: true,
    allowLocalStorageFallback: true,
    forceServerOnly: false
  }
};
```

2. **Восстановить fallback логику** в `src/database/hybridAdapter.ts` и `src/database/syncAdapter.ts`

## Мониторинг

### Логи синхронизации
- Все операции логируются с префиксом `🔄`
- Ошибки БД логируются с префиксом `❌`
- Успешные операции логируются с префиксом `✅`

### Статус синхронизации
- `syncMode`: всегда `'server'`
- `isForcedLocalMode`: всегда `true`
- `allowLocalStorage`: всегда `false`

## Тестирование

### Проверка конфигурации
```typescript
import { isLocalSyncAllowed, isLocalStorageAllowed, getSyncMode } from '../config/databaseConfig';

console.log('Local sync allowed:', isLocalSyncAllowed()); // false
console.log('Local storage allowed:', isLocalStorageAllowed()); // false
console.log('Sync mode:', getSyncMode()); // 'server'
```

### Проверка доступности БД
```typescript
import { isRedisAvailable, isPostgresAvailable } from '../config/api';

console.log('Redis available:', isRedisAvailable());
console.log('Postgres available:', isPostgresAvailable());
```

## Безопасность

- **Нет локальных данных**: все данные хранятся только в БД
- **Принудительная аутентификация**: все операции требуют валидной аутентификации
- **Нет fallback**: приложение не работает без подключения к БД

## Производительность

- **Быстрая синхронизация**: данные сразу сохраняются в БД
- **Кэширование**: Redis используется для быстрого доступа к данным
- **Нет дублирования**: исключена возможность конфликтов между локальными и серверными данными
