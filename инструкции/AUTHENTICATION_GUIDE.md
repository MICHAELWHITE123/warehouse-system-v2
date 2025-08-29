# 🔐 РУКОВОДСТВО ПО АВТОРИЗАЦИИ API

## Обзор

API поддерживает два типа авторизации:
1. **JWT Authentication** - для пользователей с аккаунтами
2. **Device Authentication** - для устройств без аккаунтов

## 🔑 JWT Authentication

### Получение токена

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

### Использование JWT токена

```bash
Authorization: Bearer <your_jwt_token>
```

### Пример запроса

```bash
curl -X GET "https://warehouse-api-zeta.vercel.app/api/equipment" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 📱 Device Authentication

### Формат Device ID

Device ID должен начинаться с `device_`:
- ✅ `device_bipiuy_metwfxzb`
- ✅ `device_vry60l_metwgsru`
- ❌ `bipiuy_metwfxzb`

### Способы передачи Device ID

#### 1. Заголовок X-Device-ID (рекомендуется)

```bash
X-Device-ID: device_bipiuy_metwfxzb
```

#### 2. Query параметр

```bash
GET /api/sync/operations?deviceId=device_bipiuy_metwfxzb
```

#### 3. Body параметр (для POST запросов)

```json
{
  "deviceId": "device_bipiuy_metwfxzb",
  "operations": [...]
}
```

### Пример запроса с Device Authentication

```bash
curl -X GET "https://warehouse-api-zeta.vercel.app/api/sync/operations" \
  -H "X-Device-ID: device_bipiuy_metwfxzb"
```

## 🔄 Hybrid Authentication

Некоторые endpoints поддерживают оба типа авторизации:

```bash
# С JWT токеном
curl -X POST "https://warehouse-api-zeta.vercel.app/api/sync/v2" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"operations":[...]}'

# С Device ID
curl -X POST "https://warehouse-api-zeta.vercel.app/api/sync/v2" \
  -H "X-Device-ID: device_bipiuy_metwfxzb" \
  -H "Content-Type: application/json" \
  -d '{"operations":[...]}'
```

## 📊 Endpoints и их авторизация

### Legacy Sync Endpoints (только Device Auth)

| Endpoint | Метод | Авторизация | Описание |
|----------|-------|-------------|----------|
| `/api/sync` | POST | Device ID | Отправка операций |
| `/api/sync/operations` | GET | Device ID | Получение операций |
| `/api/sync/operations/:id/acknowledge` | POST | Device ID | Подтверждение операции |

### Modern Sync Endpoints (Hybrid Auth)

| Endpoint | Метод | Авторизация | Описание |
|----------|-------|-------------|----------|
| `/api/sync/v2` | POST | JWT или Device ID | Отправка операций |
| `/api/sync/v2/operations` | GET | JWT или Device ID | Получение операций |
| `/api/sync/v2/operations/:id/acknowledge` | POST | JWT или Device ID | Подтверждение операции |

### Protected Endpoints (только JWT)

| Endpoint | Метод | Авторизация | Описание |
|----------|-------|-------------|----------|
| `/api/equipment` | GET/POST/PUT/DELETE | JWT | Управление оборудованием |
| `/api/users` | GET/POST/PUT/DELETE | JWT | Управление пользователями |
| `/api/categories` | GET/POST/PUT/DELETE | JWT | Управление категориями |

## 🛡️ Безопасность

### Rate Limiting

- **API endpoints**: 100 запросов в 15 минут
- **Sync endpoints**: 30 запросов в минуту
- **Auth endpoints**: 5 попыток в 5 минут

### Валидация Device ID

- Device ID должен начинаться с `device_`
- Проверяется соответствие Device ID в заголовке и body
- Логируются все попытки доступа

### JWT Security

- Токены имеют срок действия (7 дней по умолчанию)
- Refresh токены (30 дней)
- Проверка подписи и срока действия

## 📝 Примеры использования

### 1. Legacy Sync (Device Auth)

```javascript
// Отправка операций
const response = await fetch('/api/sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'device_bipiuy_metwfxzb'
  },
  body: JSON.stringify({
    operations: [
      {
        id: 'op1',
        table: 'equipment',
        operation: 'update',
        data: { id: 1, name: 'Updated Equipment' }
      }
    ],
    deviceId: 'device_bipiuy_metwfxzb'
  })
});
```

### 2. Modern Sync (Hybrid Auth)

```javascript
// С JWT токеном
const response = await fetch('/api/sync/v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    operations: [...],
    metadata: { source: 'web_app' }
  })
});

// С Device ID
const response = await fetch('/api/sync/v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'device_bipiuy_metwfxzb'
  },
  body: JSON.stringify({
    operations: [...],
    metadata: { source: 'mobile_app' }
  })
});
```

### 3. Protected Resources (JWT only)

```javascript
// Получение списка оборудования
const response = await fetch('/api/equipment', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Создание нового оборудования
const response = await fetch('/api/equipment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    name: 'New Equipment',
    category: 'Electronics',
    location: 'Warehouse A'
  })
});
```

## 🚨 Ошибки авторизации

### Коды ошибок

| Код | Описание | Решение |
|-----|----------|---------|
| `NO_TOKEN` | Отсутствует JWT токен | Добавить заголовок Authorization |
| `INVALID_TOKEN` | Невалидный или истекший JWT | Обновить токен |
| `NO_DEVICE_ID` | Отсутствует Device ID | Добавить X-Device-ID заголовок |
| `INVALID_DEVICE_ID_FORMAT` | Неправильный формат Device ID | Device ID должен начинаться с "device_" |
| `DEVICE_ID_MISMATCH` | Несоответствие Device ID | Проверить Device ID в заголовке и body |
| `NO_AUTH` | Отсутствует авторизация | Предоставить JWT токен или Device ID |
| `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов | Уменьшить частоту запросов |

### Примеры ответов с ошибками

```json
{
  "success": false,
  "message": "Device ID is required for device authentication.",
  "code": "NO_DEVICE_ID"
}
```

```json
{
  "success": false,
  "message": "Invalid device ID format. Must start with \"device_\"",
  "code": "INVALID_DEVICE_ID_FORMAT"
}
```

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45
}
```

## 🔧 Настройка окружения

### Переменные окружения

```bash
# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Device Authentication
DEVICE_AUTH_ENABLED=true
DEVICE_ID_PREFIX=device_
```

## 📚 Дополнительные ресурсы

- [API Endpoints Documentation](./API_ENDPOINTS.md)
- [Sync API Guide](./SYNC_API_README.md)
- [Deployment Guide](./VERCEL_DEPLOYMENT.md)

## 🆘 Поддержка

При возникновении проблем с авторизацией:

1. Проверьте формат Device ID (должен начинаться с `device_`)
2. Убедитесь, что JWT токен не истек
3. Проверьте заголовки запроса
4. Обратитесь к логам сервера для диагностики

---

**Версия документации**: 2.0.0  
**Последнее обновление**: 29 августа 2024
