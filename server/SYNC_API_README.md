# WeareHouse Sync API v2.0

Полнофункциональное API для синхронизации данных между устройствами и аккаунтами в системе управления складом WeareHouse.

## 🚀 Особенности

- **Двунаправленная синхронизация**: PUSH/PULL операции
- **Конфликт-резолвинг**: Автоматическое и ручное разрешение конфликтов
- **Офлайн поддержка**: Работа без интернета с последующей синхронизацией
- **Управление устройствами**: Регистрация и мониторинг устройств
- **Безопасность**: JWT аутентификация + валидация данных
- **Производительность**: Батчинг операций и оптимизированные запросы
- **Scalability**: Serverless архитектура на Vercel + Supabase

## 📋 Техническая архитектура

### Стек технологий
- **Runtime**: Node.js 18+ с TypeScript
- **Framework**: Express.js
- **База данных**: SQLite (dev) / PostgreSQL (Supabase prod)
- **Аутентификация**: JWT + bcryptjs
- **Валидация**: express-validator
- **Безопасность**: Helmet, CORS
- **Логирование**: Morgan
- **Деплой**: Vercel.com

### Структура проекта
```
src/
├── controllers/
│   ├── AuthController.ts      # Аутентификация + регистрация устройств
│   ├── DeviceController.ts    # Управление устройствами
│   └── SyncController.ts      # Основной контроллер синхронизации
├── models/
│   ├── DeviceModel.ts         # Модель устройств
│   ├── SyncEntryModel.ts      # Модель записей синхронизации
│   └── UserModel.ts           # Модель пользователей
├── middleware/
│   ├── auth.ts                # JWT аутентификация
│   └── validation.ts          # Валидация входных данных
├── utils/
│   ├── syncEngine.ts          # Движок синхронизации
│   └── conflictResolver.ts    # Разрешение конфликтов
├── routes/
│   ├── auth.ts               # Роуты аутентификации
│   ├── devices.ts            # Роуты устройств
│   └── sync.ts               # Роуты синхронизации
└── database/
    └── migrations/           # SQL миграции
```

## 🔧 Установка и настройка

### 1. Клонирование и установка зависимостей

```bash
cd server
npm install
```

### 2. Конфигурация окружения

```bash
# Скопируйте пример конфигурации
cp env.example .env

# Настройте переменные окружения
```

Основные переменные:
```env
NODE_ENV=development
JWT_SECRET=your-secure-jwt-secret-32-chars-minimum
DATABASE_URL=your-database-url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Развертывание базы данных

```bash
# Для разработки (SQLite)
npm run migrate

# Для продакшна (Supabase)
# Выполните миграции через Supabase Dashboard
```

### 4. Запуск

```bash
# Разработка
npm run dev

# Продакшн
npm run build
npm start
```

## 📊 Модели данных

### Users (пользователи)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  login VARCHAR(50) UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Devices (устройства)
```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100), -- 'desktop', 'mobile', 'tablet', 'web'
  platform VARCHAR(100),    -- 'windows', 'macos', 'ios', 'android', 'linux'
  last_sync TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sync Entries (записи синхронизации)
```sql
CREATE TABLE sync_entries (
  id SERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  operation VARCHAR(10) CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
  data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  sync_status VARCHAR(20) CHECK (sync_status IN ('pending', 'processed', 'failed', 'conflict')),
  conflict_resolution VARCHAR(20) CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sync Conflicts (конфликты синхронизации)
```sql
CREATE TABLE sync_conflicts (
  id SERIAL PRIMARY KEY,
  sync_entry_id INTEGER REFERENCES sync_entries(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  local_data JSONB NOT NULL,
  remote_data JSONB NOT NULL,
  local_timestamp TIMESTAMP NOT NULL,
  remote_timestamp TIMESTAMP NOT NULL,
  conflict_type VARCHAR(20) CHECK (conflict_type IN ('concurrent_update', 'delete_update', 'update_delete')),
  resolved BOOLEAN DEFAULT false,
  resolution VARCHAR(20) CHECK (resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🌐 API Endpoints

### Аутентификация `/api/auth`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/login` | Вход в систему |
| POST | `/register` | Регистрация пользователя |
| POST | `/device` | Регистрация устройства |
| GET | `/me` | Информация о текущем пользователе |
| POST | `/refresh` | Обновление JWT токена |
| POST | `/logout` | Выход из системы |

### Устройства `/api/devices`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/register` | Регистрация устройства |
| GET | `/` | Список устройств пользователя |
| GET | `/stats` | Статистика устройств |
| GET | `/:id` | Информация об устройстве |
| PUT | `/:id` | Обновление устройства |
| POST | `/:id/deactivate` | Деактивация устройства |
| DELETE | `/:id` | Удаление устройства |
| POST | `/heartbeat` | Heartbeat от устройства |

### Синхронизация `/api/sync`

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/push` | Отправка изменений на сервер |
| POST | `/pull` | Получение изменений с сервера |
| GET | `/status` | Статус синхронизации |
| GET | `/history` | История синхронизации |
| GET | `/conflicts` | Список конфликтов |
| GET | `/conflicts/:id/recommendation` | Рекомендация по разрешению |
| POST | `/conflicts/:id/resolve` | Разрешение конфликта |
| GET | `/validate` | Проверка целостности данных |
| POST | `/cleanup` | Очистка старых записей (admin) |
| POST | `/force/:deviceId` | Принудительная синхронизация |

## 🔄 Логика синхронизации

### PUSH Синхронизация

```typescript
// Отправка изменений с устройства
POST /api/sync/push
{
  "device_id": "device-001",
  "changes": [
    {
      "table": "equipment",
      "operation": "CREATE",
      "record_id": "eq-001",
      "data": {
        "name": "New Equipment",
        "status": "available"
      },
      "timestamp": 1703001234567
    }
  ]
}
```

### PULL Синхронизация

```typescript
// Получение изменений с сервера
POST /api/sync/pull
{
  "device_id": "device-001",
  "last_sync": 1703001234567
}

// Ответ
{
  "success": true,
  "data": {
    "changes": [
      {
        "id": "uuid-123",
        "table": "equipment",
        "operation": "UPDATE",
        "record_id": "eq-002",
        "data": { "status": "maintenance" },
        "timestamp": 1703001235000
      }
    ],
    "count": 1,
    "timestamp": 1703001236000
  }
}
```

### Разрешение конфликтов

1. **Автоматическое разрешение**:
   - `latest_wins` - побеждает последнее изменение
   - `local_wins` - приоритет локальным данным
   - `remote_wins` - приоритет удаленным данным
   - `table_logic` - специфическая логика для таблицы

2. **Ручное разрешение**:
   - Показ пользователю интерфейса слияния
   - Возможность выбора конкретных полей
   - Создание полностью новых данных

## 🔒 Безопасность

### Аутентификация
- JWT токены с configurable expiration
- Secure bcrypt hashing (12 rounds)
- Device-based authentication

### Валидация
- Полная валидация всех входных данных
- Проверка типов операций синхронизации
- Санитизация JSON данных

### Авторизация
- User-scoped access control
- Device ownership verification
- Role-based permissions (admin functions)

### Защита от атак
- Rate limiting
- CORS configuration
- Helmet security headers
- SQL injection protection

## 📈 Производительность

### Оптимизации базы данных
- Индексы на часто запрашиваемые поля
- JSONB для эффективного хранения данных
- Connection pooling через Supabase

### Пакетная обработка
- Batching операций (до 100 за раз)
- Асинхронная обработка конфликтов
- Оптимистичные блокировки

### Кеширование
- Статус синхронизации кешируется
- Device heartbeat throttling
- Client-side caching рекомендации

## 🚀 Развертывание на Vercel

### 1. Подготовка

```bash
npm run build
```

### 2. Конфигурация Vercel

```json
{
  "version": 2,
  "builds": [
    { "src": "dist/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "dist/index.js" }
  ]
}
```

### 3. Environment Variables

Настройте в Vercel Dashboard:
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

### 4. Деплой

```bash
vercel --prod
```

## 📖 Примеры использования

### Базовая настройка клиента

```typescript
const client = new SyncClient('https://your-api.vercel.app', 'device-123');
await client.authenticate('username', 'password');
```

### Создание записи с синхронизацией

```typescript
const equipment = await client.createEquipment({
  name: 'New Equipment',
  status: 'available',
  location_id: 1
});
```

### Периодическая синхронизация

```typescript
const periodicSync = new PeriodicSync(client);
// Автоматическая синхронизация каждые 30 секунд
```

### Обработка конфликтов

```typescript
const conflicts = await client.getConflicts();
for (const conflict of conflicts) {
  const recommendation = await client.getConflictRecommendation(conflict.id);
  if (recommendation.can_auto_resolve) {
    await client.resolveConflict(conflict.id, recommendation.strategy);
  }
}
```

Подробные примеры смотрите в `SYNC_API_EXAMPLES.md`.

## 🧪 Тестирование

### Ручное тестирование

```bash
# Регистрация пользователя
curl -X POST https://your-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","login":"test","nickname":"Test","email":"test@example.com","password":"SecurePass123!"}'

# Аутентификация
curl -X POST https://your-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"SecurePass123!"}'
```

### Автоматизированное тестирование

```bash
# Добавьте тесты в будущем
npm test
```

## 📝 Мониторинг и отладка

### Логирование
- Morgan HTTP request logging
- Console logging для операций синхронизации
- Error tracking для конфликтов

### Статистика
```typescript
GET /api/sync/status
// Возвращает полную статистику синхронизации
```

### Проверка целостности
```typescript
GET /api/sync/validate
// Проверяет консистентность данных синхронизации
```

## 🔮 Roadmap

### v2.1 (Planned)
- [ ] WebSocket поддержка для real-time sync
- [ ] File synchronization
- [ ] Advanced conflict resolution UI
- [ ] Metrics and analytics dashboard

### v2.2 (Future)
- [ ] Multi-tenant support
- [ ] GraphQL API alternative
- [ ] Advanced caching strategies
- [ ] Performance monitoring integration

## 🤝 Contributing

1. Форк репозитория
2. Создайте feature branch
3. Делайте коммиты с описательными сообщениями
4. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE

## 📧 Поддержка

Для вопросов и поддержки:
- Создайте Issue в GitHub
- Обратитесь к документации
- Проверьте примеры использования

---

**WeareHouse Sync API v2.0** - Профессиональное решение для синхронизации данных между устройствами с поддержкой офлайн-режима, автоматическим разрешением конфликтов и enterprise-grade безопасностью.
