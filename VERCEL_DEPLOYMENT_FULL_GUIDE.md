# 🚀 Полная инструкция по развертыванию WeareHouse в Vercel

Этот проект состоит из двух частей:
- **Frontend (React + Vite)** - пользовательский интерфейс
- **Backend (Node.js + TypeScript)** - API сервер с синхронизацией

## 📋 Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Подготовка проекта](#подготовка-проекта)
3. [Настройка баз данных](#настройка-баз-данных)
4. [Развертывание Frontend](#развертывание-frontend)
5. [Развертывание Backend API](#развертывание-backend-api)
6. [Настройка переменных окружения](#настройка-переменных-окружения)
7. [Проверка и тестирование](#проверка-и-тестирование)
8. [Troubleshooting](#troubleshooting)

## 📝 Предварительные требования

1. **Аккаунт Vercel**: [vercel.com](https://vercel.com)
2. **Аккаунт GitHub**: для подключения репозитория
3. **Аккаунт Supabase**: [supabase.com](https://supabase.com) (для основной базы данных)
4. **Node.js 18+**: локальная разработка
5. **Git**: управление версиями

## 🔧 Подготовка проекта

### 1. Подготовка репозитория

```bash
# Убедитесь, что все изменения закоммичены
git add .
git commit -m "Подготовка к Vercel деплою"
git push origin main
```

### 2. Проверка структуры файлов

Убедитесь, что у вас есть эти важные файлы:

```
WeareHouse/
├── package.json                    # Frontend зависимости
├── vercel.json                     # Конфигурация Vercel для frontend
├── vite.config.ts                  # Конфигурация сборки
├── server/
│   ├── package.json                # Backend зависимости
│   ├── vercel.json                 # Конфигурация Vercel для API
│   ├── env.vercel.example          # Пример переменных окружения
│   └── src/                        # Исходный код API
└── api/                            # Legacy API файлы (для простой синхронизации)
```

## 🗄️ Настройка баз данных

### Вариант А: Supabase (Рекомендуется для продакшена)

#### 1. Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запишите:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: публичный ключ
   - **Service Role Key**: приватный ключ
   - **Database Password**: пароль БД

#### 2. Настройка базы данных

```sql
-- Выполните миграции в Supabase SQL Editor
-- Файлы в порядке выполнения:
-- 1. server/src/database/migrations/001_create_tables.sql
-- 2. server/src/database/migrations/003_password_history.sql
-- 3. server/src/database/migrations/004_add_nickname.sql
-- 4. server/src/database/migrations/006_sync_improvements.sql
```

#### 3. Настройка RLS (Row Level Security)

```sql
-- Включите RLS для безопасности
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_entries ENABLE ROW LEVEL SECURITY;

-- Создайте политики доступа
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = uuid::text);
```

### Вариант Б: Vercel KV (Простая синхронизация)

#### 1. Создание Vercel KV базы

1. В Vercel Dashboard → Storage
2. Create Database → KV
3. Назовите `warehouse-sync`
4. Сохраните:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## 🌐 Развертывание Frontend

### 1. Создание проекта в Vercel

1. Перейдите на [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository**
3. Выберите ваш репозиторий WeareHouse
4. **Root Directory**: оставьте пустым (корень проекта)
5. **Framework Preset**: Vite
6. **Build Command**: `npm run build`
7. **Output Directory**: `dist`

### 2. Настройка переменных окружения для Frontend

В Vercel Dashboard → Settings → Environment Variables:

```env
# API Configuration
VITE_API_URL=https://your-api.vercel.app/api

# Supabase (если используете)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Vercel KV (если используете)
VITE_KV_REST_API_URL=https://your-kv.upstash.io
VITE_KV_REST_API_TOKEN=your-kv-token
```

### 3. Deploy Frontend

Нажмите **Deploy** - Vercel автоматически соберет и развернет frontend.

URL будет примерно: `https://wearehouse-system.vercel.app`

## ⚙️ Развертывание Backend API

### 1. Создание отдельного проекта для API

1. Создайте новый проект в Vercel
2. Import тот же Git репозиторий
3. **Root Directory**: `server` (указать папку server)
4. **Framework Preset**: Other
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### 2. Настройка переменных окружения для API

```env
# Application
NODE_ENV=production
JWT_SECRET=ваш-супер-секретный-ключ-минимум-32-символа
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

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000

# Sync Settings
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT_MS=30000
CONFLICT_RESOLUTION_STRATEGY=latest_wins

# Features
ENABLE_DEVICE_REGISTRATION=true
ENABLE_SYNC_VALIDATION=true
ENABLE_CONFLICT_AUTO_RESOLUTION=true
```

### 3. Генерация JWT Secret

```bash
# Используйте этот ключ для JWT_SECRET
openssl rand -base64 32
```

### 4. Deploy API

Нажмите **Deploy** - Vercel соберет и развернет API.

URL будет примерно: `https://wearehouse-api.vercel.app`

## 🔗 Связывание Frontend и Backend

### 1. Обновите переменную в Frontend

В настройках Frontend проекта обновите:

```env
VITE_API_URL=https://your-api.vercel.app/api
```

### 2. Обновите CORS в Backend

В настройках API проекта обновите:

```env
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:3000
```

### 3. Redeploy оба проекта

После изменения переменных окружения проекты автоматически пересоберутся.

## ✅ Проверка и тестирование

### 1. Проверка Frontend

1. Откройте `https://your-frontend.vercel.app`
2. Убедитесь, что интерфейс загружается
3. Проверьте консоль браузера на ошибки

### 2. Проверка API

```bash
# Статус API
curl https://your-api.vercel.app/api/

# Ожидаемый ответ:
{
  "success": true,
  "message": "API is working",
  "version": "2.0.0",
  "features": ["auth", "sync", "devices", "inventory"]
}
```

### 3. Тестирование функциональности

1. **Регистрация пользователя**:
   ```bash
   curl -X POST https://your-api.vercel.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "SecurePass123!",
       "email": "test@example.com"
     }'
   ```

2. **Аутентификация**:
   ```bash
   curl -X POST https://your-api.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "SecurePass123!"
     }'
   ```

3. **Создание оборудования в UI** и проверка синхронизации между устройствами

## 🔄 Автоматическое развертывание

### Настройка GitHub Actions (опционально)

1. Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

2. Добавьте секреты в GitHub Repository Settings

## 🚨 Troubleshooting

### Проблема: Frontend не подключается к API

**Решение:**
1. Проверьте `VITE_API_URL` в переменных frontend
2. Убедитесь, что API доступен: `curl https://your-api.vercel.app/api/`
3. Проверьте CORS настройки в API

### Проблема: "Database connection failed"

**Решение:**
1. Проверьте все DATABASE_* переменные в API
2. Убедитесь, что Supabase проект активен
3. Проверьте, что миграции выполнены

### Проблема: "JWT secret not configured"

**Решение:**
1. Сгенерируйте новый ключ: `openssl rand -base64 32`
2. Добавьте в переменную `JWT_SECRET` (минимум 32 символа)

### Проблема: Build fails

**Решение:**
1. Проверьте версию Node.js (должна быть 18+)
2. Убедитесь, что все зависимости установлены
3. Проверьте TypeScript ошибки локально

### Проблема: API timeout

**Решение:**
1. Увеличьте `maxDuration` в `server/vercel.json`
2. Оптимизируйте медленные запросы
3. Проверьте размер батчей синхронизации

## 📊 Мониторинг

### Vercel Dashboard

- **Functions**: мониторинг выполнения API функций
- **Analytics**: статистика использования
- **Logs**: логи ошибок и выполнения

### Supabase Dashboard

- **Database**: мониторинг запросов и производительности
- **Auth**: статистика аутентификации
- **Real-time**: логи в реальном времени

## 🎯 Результат

После успешного развертывания у вас будет:

✅ **Frontend приложение**: `https://your-frontend.vercel.app`  
✅ **API сервер**: `https://your-api.vercel.app`  
✅ **Синхронизация между устройствами**  
✅ **Автоматические деплои при push в main**  
✅ **Масштабируемая архитектура**  

## 🚀 Дальнейшие шаги

1. **Настройте custom domain** для приложения
2. **Добавьте мониторинг** ошибок (Sentry)
3. **Настройте backup** для базы данных
4. **Оптимизируйте производительность** запросов
5. **Добавьте уведомления** о деплоях в Slack/Discord

---

**💡 Совет**: Сохраните все URL и ключи в безопасном месте. Поделитесь ссылкой на приложение с командой для тестирования!

**🎉 Готово!** Ваш проект WeareHouse развернут в Vercel с полной функциональностью синхронизации!
