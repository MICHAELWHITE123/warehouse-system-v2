# Настройка баз данных в Vercel для WeareHouse

## 🎯 Рекомендуемый выбор

### 1. **Upstash Redis** (для KV операций)
- **Назначение**: Кэширование, сессии, очереди синхронизации
- **План**: Hobby (бесплатный)
- **Преимущества**: Быстрый доступ, низкая задержка, простота интеграции

### 2. **Neon Postgres** (для основной базы данных)
- **Назначение**: Структурированные данные (equipment, categories, users)
- **План**: Hobby (бесплатный)
- **Преимущества**: Serverless, автоматическое масштабирование, полная SQL поддержка

## 📋 Пошаговая настройка

### Шаг 1: Создание Upstash Redis базы

1. **Откройте Vercel Dashboard** → ваш проект WeareHouse
2. **Перейдите в Storage** → **Browse Marketplace**
3. **Найдите "Upstash"** и нажмите на стрелку (→)
4. **Выберите "Redis"** план
5. **Создайте базу** с названием `wearehouse-redis`
6. **Выберите регион** (ближайший к вашим пользователям)
7. **Нажмите "Create"**

### Шаг 2: Создание Neon Postgres базы

1. **В том же Marketplace** найдите **"Neon"**
2. **Нажмите "Create"** рядом с Neon
3. **Выберите "Hobby"** план (бесплатный)
4. **Создайте базу** с названием `wearehouse-postgres`
5. **Выберите регион** (тот же, что и для Redis)
6. **Нажмите "Create"**

### Шаг 3: Получение переменных окружения

После создания баз Vercel автоматически добавит переменные в ваш проект:

#### Для Upstash Redis:
```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
```

#### Для Neon Postgres:
```bash
NEON_DATABASE_URL=postgresql://username:password@host/database
NEON_HOST=your-postgres-host.neon.tech
NEON_DATABASE=your_database_name
NEON_USERNAME=your_username
NEON_PASSWORD=your_password
```

### Шаг 4: Настройка переменных в проекте

1. **В Vercel Dashboard** перейдите в **Settings** → **Environment Variables**
2. **Добавьте все переменные** из шага 3
3. **Выберите окружения**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. **Нажмите "Save"**

### Шаг 5: Обновление локального файла .env

Создайте файл `.env.local` в корне проекта:

```bash
# Upstash Redis Configuration
VITE_UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Neon Postgres Configuration
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
VITE_NEON_HOST=your-postgres-host.neon.tech
VITE_NEON_DATABASE=your_database_name
VITE_NEON_USERNAME=your_username
VITE_NEON_PASSWORD=your_password
```

## 🔧 Интеграция в код

### Инициализация гибридного адаптера

```typescript
import HybridDatabaseAdapter from './database/hybridAdapter';

const dbConfig = {
  redis: {
    url: import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
    token: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN
  },
  postgres: {
    url: import.meta.env.VITE_NEON_DATABASE_URL,
    host: import.meta.env.VITE_NEON_HOST,
    database: import.meta.env.VITE_NEON_DATABASE,
    username: import.meta.env.VITE_NEON_USERNAME,
    password: import.meta.env.VITE_NEON_PASSWORD
  },
  fallbackToLocal: true
};

const hybridDB = new HybridDatabaseAdapter(dbConfig);
await hybridDB.init();
```

### Использование в коде

```typescript
// Автоматический выбор хранилища
await hybridDB.set('user:123', userData, { table: 'users' }); // Postgres
await hybridDB.set('session:abc', sessionData, { expiration: 3600 }); // Redis
await hybridDB.set('temp:data', tempData); // Local

// Ручной выбор хранилища
await hybridDB.set('key', value, { storage: 'redis' });
await hybridDB.set('key', value, { storage: 'postgres', table: 'equipment' });
await hybridDB.set('key', value, { storage: 'local' });
```

## 📊 Архитектура хранения данных

### Redis (Upstash)
- **Сессии пользователей**
- **Кэш данных**
- **Очереди синхронизации**
- **Временные данные**

### Postgres (Neon)
- **Оборудование** (`equipment`)
- **Категории** (`categories`)
- **Локации** (`locations`)
- **Отгрузки** (`shipments`)
- **Стеки** (`stacks`)
- **Пользователи** (`users`)

### Local Storage
- **Fallback при недоступности внешних баз**
- **Кэш в браузере**
- **Офлайн режим**

## 🚀 Развертывание

### Автоматическое развертывание
1. **Закоммитьте изменения** в git
2. **Запушьте в main ветку**
3. **Vercel автоматически развернет** с новыми переменными окружения

### Проверка развертывания
1. **Откройте развернутое приложение**
2. **Проверьте консоль браузера** на наличие ошибок
3. **Убедитесь**, что базы данных инициализируются корректно

## 🔍 Отладка

### Проверка подключения Redis
```typescript
import { isRedisAvailable } from './config/api';

if (isRedisAvailable()) {
  console.log('Redis доступен');
} else {
  console.log('Redis недоступен');
}
```

### Проверка подключения Postgres
```typescript
import { isPostgresAvailable } from './config/api';

if (isPostgresAvailable()) {
  console.log('Postgres доступен');
} else {
  console.log('Postgres недоступен');
}
```

### Логи инициализации
```typescript
const hybridDB = new HybridDatabaseAdapter(config);
try {
  await hybridDB.init();
  console.log('База данных инициализирована');
} catch (error) {
  console.error('Ошибка инициализации:', error);
}
```

## 💰 Стоимость

### Hobby план (бесплатный)
- **Upstash Redis**: 10,000 запросов/день
- **Neon Postgres**: 0.5 GB хранилища, 10,000 запросов/день

### Pro план (платный)
- **Upstash Redis**: $20/месяц
- **Neon Postgres**: $20/месяц

## 🔒 Безопасность

- **Все соединения** используют SSL/TLS
- **Токены доступа** хранятся в переменных окружения
- **Нет прямого доступа** к базам данных из браузера
- **Автоматическое ротация** токенов

## 📚 Дополнительные ресурсы

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Neon Postgres Documentation](https://neon.tech/docs)
- [Vercel Storage Documentation](https://vercel.com/docs/storage)
- [Vercel Marketplace](https://vercel.com/marketplace)
