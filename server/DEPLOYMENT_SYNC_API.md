# Deployment Guide - Sync API

Полное руководство по развертыванию API синхронизации WeareHouse на Vercel с Supabase.

## Предварительные требования

1. **Аккаунт Vercel**: [vercel.com](https://vercel.com)
2. **Аккаунт Supabase**: [supabase.com](https://supabase.com)
3. **Node.js**: версия 18+ 
4. **TypeScript**: для разработки

## Настройка Supabase

### 1. Создание проекта

```bash
# Создайте новый проект в Supabase Dashboard
# Скопируйте URL и API ключи
```

### 2. Настройка базы данных

```sql
-- Выполните миграции в Supabase SQL Editor
-- 1. Основные таблицы (001_create_tables.sql)
-- 2. Пользователи и аутентификация (003_password_history.sql, 004_add_nickname.sql)
-- 3. Синхронизация (006_sync_improvements.sql)
```

### 3. Конфигурация RLS (Row Level Security)

```sql
-- Включите RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Политики доступа для пользователей
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = uuid::text);

-- Политики для устройств
CREATE POLICY "Users can manage own devices" ON devices
  FOR ALL USING (user_id = (SELECT id FROM users WHERE uuid::text = auth.uid()::text));

-- Политики для синхронизации
CREATE POLICY "Users can manage own sync entries" ON sync_entries
  FOR ALL USING (user_id = (SELECT id FROM users WHERE uuid::text = auth.uid()::text));
```

## Настройка Vercel

### 1. Подготовка проекта

```bash
cd server
npm run build

# Убедитесь, что dist/ папка создана и содержит скомпилированный код
```

### 2. Создание переменных окружения в Vercel

В Vercel Dashboard:

**Settings → Environment Variables**

```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=24h

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_SSL=true

# Sync Settings
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT_MS=30000
CONFLICT_RESOLUTION_STRATEGY=latest_wins

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000

# Features
ENABLE_DEVICE_REGISTRATION=true
ENABLE_SYNC_VALIDATION=true
ENABLE_CONFLICT_AUTO_RESOLUTION=true
```

### 3. Развертывание

```bash
# Подключите репозиторий к Vercel
vercel --prod

# Или через Git (рекомендуется)
git push origin main
```

## API Endpoints

После развертывания доступны следующие эндпоинты:

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/device` - Регистрация устройства

### Синхронизация
- `POST /api/sync/push` - Отправка изменений на сервер
- `POST /api/sync/pull` - Получение изменений с сервера
- `GET /api/sync/status` - Статус синхронизации
- `GET /api/sync/conflicts` - Список конфликтов
- `POST /api/sync/conflicts/:id/resolve` - Разрешение конфликта

### Устройства
- `GET /api/devices` - Список устройств
- `POST /api/devices/register` - Регистрация устройства
- `POST /api/devices/heartbeat` - Heartbeat устройства

## Тестирование API

### 1. Регистрация пользователя

```bash
curl -X POST https://your-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "login": "testuser",
    "nickname": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Аутентификация

```bash
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

### 3. Регистрация устройства

```bash
curl -X POST https://your-api.vercel.app/api/auth/device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_id": "device-001",
    "device_name": "Test Device",
    "device_type": "web",
    "platform": "web"
  }'
```

### 4. PUSH синхронизация

```bash
curl -X POST https://your-api.vercel.app/api/sync/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_id": "device-001",
    "changes": [
      {
        "table": "equipment",
        "operation": "CREATE",
        "record_id": "eq-001",
        "data": {
          "name": "Test Equipment",
          "status": "available"
        },
        "timestamp": 1703001234567
      }
    ]
  }'
```

### 5. PULL синхронизация

```bash
curl -X POST https://your-api.vercel.app/api/sync/pull \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "device_id": "device-001",
    "last_sync": 1703001234567
  }'
```

## Мониторинг и отладка

### Логи Vercel

```bash
vercel logs
# или в Dashboard: Functions → View Function Logs
```

### Supabase мониторинг

- Dashboard → Settings → API
- Real-time logs в Supabase Dashboard
- Query performance в Dashboard → Database

### Проверка состояния API

```bash
curl https://your-api.vercel.app/api/
```

Ответ должен содержать:
```json
{
  "success": true,
  "message": "API is working",
  "version": "2.0.0",
  "features": ["auth", "sync", "devices", "inventory"]
}
```

## Производительность

### Оптимизации Vercel

1. **Function Duration**: до 30 секунд для синхронизации
2. **Memory**: 1024MB для больших операций синхронизации
3. **Regions**: выберите ближайший к пользователям регион

### Оптимизации Supabase

1. **Connection Pooling**: включите в настройках
2. **Indexes**: проверьте индексы для часто используемых запросов
3. **RLS**: оптимизируйте политики безопасности

## Безопасность

### 1. JWT Secret

Используйте криптографически стойкий ключ:

```bash
openssl rand -base64 32
```

### 2. CORS

Настройте только доверенные домены:

```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

### 3. Rate Limiting

API включает ограничения по умолчанию:
- 100 запросов в 15 минут на IP
- Специальные лимиты для синхронизации

### 4. Supabase RLS

Убедитесь, что RLS включен для всех таблиц и настроены правильные политики.

## Troubleshooting

### Проблемы с развертыванием

1. **Build ошибки**: Проверьте TypeScript конфигурацию
2. **Module not found**: Убедитесь, что все зависимости в package.json
3. **Timeout**: Увеличьте maxDuration в vercel.json

### Проблемы с базой данных

1. **Connection refused**: Проверьте DATABASE_URL
2. **SSL errors**: Убедитесь, что DB_SSL=true
3. **RLS errors**: Проверьте политики доступа

### Проблемы с синхронизацией

1. **Conflicts**: Используйте GET /api/sync/conflicts
2. **Performance**: Мониторьте размер батчей синхронизации
3. **Device registration**: Проверьте валидацию device_id

## Масштабирование

### Horizontal Scaling

- Vercel автоматически масштабирует serverless функции
- Supabase поддерживает connection pooling

### Vertical Scaling

- Увеличьте лимиты памяти в vercel.json
- Оптимизируйте SQL запросы в Supabase

### Caching

- Используйте Redis для кеширования (в будущих версиях)
- Кешируйте статус синхронизации на клиенте

## Backup и Recovery

### Supabase Backup

```bash
# Автоматические бэкапы включены по умолчанию
# Ручной бэкап через Dashboard → Settings → Database → Backups
```

### Migration Recovery

```sql
-- В случае проблем с миграциями
-- Rollback через Supabase Dashboard или CLI
```

## Дальнейшее развитие

1. **WebSocket поддержка**: Для real-time синхронизации
2. **File synchronization**: Для синхронизации файлов
3. **Offline support**: Расширенная поддержка офлайн-режима
4. **Metrics & Analytics**: Детальная аналитика синхронизации
