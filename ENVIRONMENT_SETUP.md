# 🚀 Настройка переменных окружения WeareHouse System

## 📋 Обзор

Этот документ описывает настройку всех переменных окружения для системы WeareHouse, включая фронтенд, серверную часть и различные окружения развертывания.

## 🏗️ Структура проекта

```
WeareHouse/
├── env.example              # Основной пример переменных
├── env.development         # Локальная разработка
├── env.production          # Production окружение
├── server/
│   ├── env.example         # Серверные переменные
│   ├── env.development     # Серверная разработка
│   ├── env.production      # Серверный production
│   ├── env.vercel.example  # Vercel развертывание
│   └── env.supabase.example # Supabase интеграция
└── ENVIRONMENT_SETUP.md    # Этот файл
```

## 🔧 Основные переменные окружения

### Frontend (VITE_*)

#### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### App Configuration
```bash
VITE_APP_NAME=Система учета техники на складе
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

#### API Configuration
```bash
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_API_RETRY_ATTEMPTS=3
```

#### Database Configuration
```bash
# Upstash Redis (KV)
VITE_UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# Neon Postgres
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
VITE_NEON_HOST=your-postgres-host.neon.tech
VITE_NEON_DATABASE=your_database_name
VITE_NEON_USERNAME=your_username
VITE_NEON_PASSWORD=your_password
```

#### Sync Configuration
```bash
VITE_SYNC_ENABLED=true
VITE_SYNC_INTERVAL=30000
VITE_SYNC_BATCH_SIZE=100
VITE_SYNC_TIMEOUT=30000
```

#### Feature Flags
```bash
VITE_ENABLE_QR_SCANNER=true
VITE_ENABLE_PDF_EXPORT=true
VITE_ENABLE_DEVICE_REGISTRATION=true
VITE_ENABLE_OFFLINE_MODE=true
```

#### Development Settings
```bash
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
VITE_DEV_TOOLS_ENABLED=false
```

### Backend (Server)

#### Server Configuration
```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
```

#### Database Configuration
```bash
# SQLite (по умолчанию)
DB_TYPE=sqlite
DB_PATH=./warehouse.db

# PostgreSQL (опционально)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warehouse_db
DB_USER=warehouse_user
DB_PASSWORD=your_password_here
DB_SSL=false
```

#### Supabase Configuration
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### JWT Configuration
```bash
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ALGORITHM=HS256
```

#### Security Configuration
```bash
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
HELMET_ENABLED=true
RATE_LIMIT_ENABLED=true
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
```

#### Device Authentication
```bash
DEVICE_AUTH_ENABLED=true
DEVICE_ID_PREFIX=device_
DEVICE_TOKEN_EXPIRES_IN=365d
```

#### Sync Configuration
```bash
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT_MS=30000
CONFLICT_RESOLUTION_STRATEGY=latest_wins
SYNC_RATE_LIMIT_DISABLED=false
```

#### Logging Configuration
```bash
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE=./logs/server.log
```

#### Feature Flags
```bash
ENABLE_DEVICE_REGISTRATION=true
ENABLE_SYNC_VALIDATION=true
ENABLE_CONFLICT_AUTO_RESOLUTION=true
ENABLE_CLEANUP_CRON=true
```

## 🚀 Настройка для разных окружений

### 1. Локальная разработка

#### Frontend
```bash
# Скопируйте env.development в .env.local
cp env.development .env.local

# Или создайте .env.local вручную
VITE_APP_ENV=development
VITE_API_URL=http://localhost:3001
VITE_DEBUG_MODE=true
```

#### Backend
```bash
# В папке server скопируйте env.development в .env
cd server
cp env.development .env
```

### 2. Production (Vercel)

#### Frontend
```bash
# Переменные автоматически загружаются из env.production
# Или настройте в Vercel Dashboard:
# Environment Variables -> Add New
```

#### Backend
```bash
# В Vercel Dashboard добавьте переменные из env.vercel.example
# Или скопируйте env.vercel.example в .env.production
```

### 3. Supabase интеграция

```bash
# Используйте env.supabase.example для настройки Supabase
cd server
cp env.supabase.example .env
```

## 🔐 Безопасность

### Критически важные переменные

1. **JWT_SECRET** - минимум 32 символа, уникальный для каждого окружения
2. **SUPABASE_SERVICE_ROLE_KEY** - храните в секрете
3. **Database passwords** - используйте сильные пароли
4. **API keys** - не коммитьте в git

### Рекомендации

- Используйте разные JWT_SECRET для development и production
- Регулярно ротируйте ключи доступа
- Ограничивайте CORS_ORIGIN только необходимыми доменами
- Включайте rate limiting в production

## 📱 Устройства и синхронизация

### Настройка для мобильных устройств

```bash
# Включите регистрацию устройств
VITE_ENABLE_DEVICE_REGISTRATION=true
ENABLE_DEVICE_REGISTRATION=true

# Настройте префикс для ID устройств
DEVICE_ID_PREFIX=device_

# Время жизни токена устройства
DEVICE_TOKEN_EXPIRES_IN=365d
```

### Синхронизация

```bash
# Основные настройки синхронизации
VITE_SYNC_ENABLED=true
VITE_SYNC_INTERVAL=30000
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT_MS=30000

# Стратегия разрешения конфликтов
CONFLICT_RESOLUTION_STRATEGY=latest_wins
```

## 🐛 Отладка

### Development режим

```bash
# Включите отладку
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_DEV_TOOLS_ENABLED=true

# Серверная отладка
LOG_LEVEL=debug
LOG_FORMAT=dev
```

### Production режим

```bash
# Отключите отладку
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=warn
VITE_DEV_TOOLS_ENABLED=false

# Серверная отладка
LOG_LEVEL=warn
LOG_FORMAT=json
```

## 📊 Мониторинг

### Логирование

```bash
# Настройте пути для логов
LOG_FILE=./logs/server.log

# Форматы логов
LOG_FORMAT=combined  # development
LOG_FORMAT=json      # production
```

### Health checks

```bash
# API health endpoint
VITE_API_URL=http://localhost:3001/health

# Supabase health check
VITE_SUPABASE_URL=https://your-project.supabase.co
```

## 🔄 Миграции и обновления

### База данных

```bash
# Запуск миграций
npm run migrate

# Production миграции
npm run migrate:prod
```

### Переменные окружения

При обновлении системы:

1. Проверьте новые переменные в `env.example`
2. Обновите локальные `.env` файлы
3. Обновите переменные в Vercel Dashboard
4. Перезапустите сервисы

## 📞 Поддержка

### Частые проблемы

1. **CORS ошибки** - проверьте `CORS_ORIGIN`
2. **JWT ошибки** - проверьте `JWT_SECRET` и время жизни
3. **Database connection** - проверьте параметры подключения
4. **Rate limiting** - настройте лимиты для вашего случая

### Полезные команды

```bash
# Проверка переменных окружения
echo $VITE_SUPABASE_URL

# Запуск в development режиме
npm run dev

# Запуск сервера
cd server && npm run dev

# Сборка для production
npm run build
```

## 📝 Заключение

Правильная настройка переменных окружения критически важна для работы системы WeareHouse. Следуйте этому руководству для корректной настройки всех компонентов системы.

**Важно**: Никогда не коммитьте реальные значения переменных окружения в git. Используйте `.env.local` для локальной разработки и настройте переменные в Vercel Dashboard для production.
