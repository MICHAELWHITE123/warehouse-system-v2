# 🔧 Настройка переменных окружения для Vercel

## 📋 Список всех переменных

### Frontend проект (основное приложение)

```env
# API Configuration
VITE_API_URL=https://your-api-project.vercel.app/api

# Supabase Configuration (если используете полный API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel KV Configuration (для простой синхронизации)
VITE_KV_REST_API_URL=https://your-kv.upstash.io
VITE_KV_REST_API_TOKEN=AYQgASQgNzA4...

# Optional: Custom settings
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEV_TOOLS=false
```

### Backend API проект (server папка)

```env
# Application Settings
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=ваш-супер-секретный-ключ-минимум-32-символа-сгенерированный-openssl
JWT_EXPIRES_IN=24h

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration (PostgreSQL через Supabase)
DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_SSL=true

# Security Settings
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sync Configuration
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT_MS=30000
CONFLICT_RESOLUTION_STRATEGY=latest_wins

# Feature Flags
ENABLE_DEVICE_REGISTRATION=true
ENABLE_SYNC_VALIDATION=true
ENABLE_CONFLICT_AUTO_RESOLUTION=true
ENABLE_CLEANUP_CRON=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## 🚀 Пошаговая настройка

### 1. Создание JWT Secret

```bash
# Сгенерируйте криптографически стойкий ключ
openssl rand -base64 32

# Пример результата:
# Kx2FvQ8pZmN4wR7sE3tY9uI5oP1qA6zC8xV7nB4mJ2k=
```

Используйте этот ключ для `JWT_SECRET`.

### 2. Получение данных Supabase

1. Войдите в [supabase.com](https://supabase.com)
2. Создайте новый проект или выберите существующий
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **URL**: `https://your-project.supabase.co`
   - **anon public**: для `SUPABASE_ANON_KEY`
   - **service_role**: для `SUPABASE_SERVICE_ROLE_KEY`

5. Перейдите в **Settings** → **Database**
6. Скопируйте **Connection string** → **URI** для `DATABASE_URL`

### 3. Настройка Vercel KV (альтернатива Supabase)

1. В Vercel Dashboard → **Storage**
2. **Create Database** → **KV**
3. Назовите `warehouse-sync`
4. Скопируйте:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 4. Добавление переменных в Vercel

#### Для Frontend проекта:

1. Vercel Dashboard → ваш frontend проект
2. **Settings** → **Environment Variables**
3. Добавьте переменные **Frontend** из списка выше
4. Выберите окружения:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

#### Для Backend API проекта:

1. Vercel Dashboard → ваш API проект
2. **Settings** → **Environment Variables**
3. Добавьте переменные **Backend** из списка выше
4. Выберите окружения:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

## 🔗 Связывание проектов

### Важно! Обновите URL после создания проектов:

1. **В Frontend проекте** обновите:
   ```env
   VITE_API_URL=https://your-actual-api-url.vercel.app/api
   ```

2. **В API проекте** обновите:
   ```env
   CORS_ORIGIN=https://your-actual-frontend-url.vercel.app,http://localhost:3000
   ```

## 📋 Быстрый чеклист

### ✅ Frontend переменные проверены:
- [ ] `VITE_API_URL` указывает на правильный API URL
- [ ] `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` (если используете)
- [ ] `VITE_KV_REST_API_URL` и `VITE_KV_REST_API_TOKEN` (если используете)

### ✅ Backend переменные проверены:
- [ ] `JWT_SECRET` — криптографически стойкий ключ (32+ символа)
- [ ] `DATABASE_URL` — правильная строка подключения к PostgreSQL
- [ ] `SUPABASE_*` переменные — правильные ключи из Supabase
- [ ] `CORS_ORIGIN` — содержит URL frontend приложения

### ✅ Безопасность:
- [ ] Все секретные ключи уникальны и не используются в других проектах
- [ ] CORS настроен только для доверенных доменов
- [ ] Service Role Key Supabase не используется на фронтенде

## 🚨 Типичные ошибки

### Ошибка: "API connection failed"
**Причина**: Неправильный `VITE_API_URL`  
**Решение**: Убедитесь, что URL оканчивается на `/api`

### Ошибка: "CORS policy" 
**Причина**: Frontend URL не добавлен в `CORS_ORIGIN`  
**Решение**: Добавьте полный URL frontend в CORS_ORIGIN

### Ошибка: "JWT secret not set"
**Причина**: `JWT_SECRET` не задан или слишком короткий  
**Решение**: Сгенерируйте новый ключ: `openssl rand -base64 32`

### Ошибка: "Database connection refused"
**Причина**: Неправильные данные подключения к БД  
**Решение**: Проверьте все `DB_*` и `DATABASE_URL` переменные

## 🔄 Автоматическое обновление

После изменения переменных окружения:

1. **Vercel автоматически** пересобирает и разворачивает проекты
2. **Проверьте логи** в Dashboard → Functions → View Function Logs
3. **Тестируйте** функциональность после обновления

## 📞 Поддержка

Если возникли проблемы:

1. **Проверьте логи** в Vercel Dashboard
2. **Тестируйте локально** с теми же переменными
3. **Проверьте статус** Supabase/Vercel сервисов
4. **Валидируйте** каждую переменную отдельно

---

**💡 Совет**: Сохраните этот файл для будущих развертываний и держите резервную копию всех ключей в безопасном месте!
