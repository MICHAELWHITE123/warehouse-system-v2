# 🚀 ШАГИ ПО РАЗВЕРТЫВАНИЮ ОБНОВЛЕННОГО API

## Что было добавлено

✅ **Система авторизации**
- JWT Authentication для пользователей
- Device Authentication для устройств
- Hybrid Authentication для совместимости

✅ **Безопасность**
- Rate limiting для всех endpoints
- Валидация Device ID
- Логирование запросов

✅ **Новые API endpoints**
- Legacy sync с Device Auth
- Modern sync с Hybrid Auth
- Protected resources с JWT

## Шаги развертывания

### 1. Коммит изменений

```bash
# Добавляем все новые файлы
git add server/src/config/jwt.ts
git add server/src/middleware/auth.ts
git add server/src/middleware/rateLimit.ts
git add server/src/routes/sync.ts
git add server/src/index.ts
git add server/env.production
git add AUTHENTICATION_GUIDE.md
git add VERCEL_EMERGENCY_FIX.md
git add DEPLOYMENT_STEPS.md

# Коммитим
git commit -m "Add: Complete authentication system with JWT and Device auth + Rate limiting + Security improvements"
```

### 2. Пуш на GitHub

```bash
git push origin main
```

### 3. Автоматический деплой на Vercel

После пуша на GitHub, Vercel автоматически:
- Соберет проект
- Задеплоит обновления
- Обновит API endpoints

## Проверка работы

### 1. Legacy Sync (Device Auth)

```bash
# Отправка операций
curl -X POST "https://warehouse-api-zeta.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: device_test_device" \
  -d '{"operations":[{"id":"test1","table":"equipment","operation":"update","data":{"id":1,"name":"test"}}],"deviceId":"device_test_device"}'

# Получение операций
curl -H "X-Device-ID: device_test_device" \
  "https://warehouse-api-zeta.vercel.app/api/sync/operations?lastSync=0"
```

### 2. Modern Sync (Hybrid Auth)

```bash
# С Device ID
curl -X POST "https://warehouse-api-zeta.vercel.app/api/sync/v2" \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: device_test_device" \
  -d '{"operations":[],"metadata":{"source":"test"}}'

# С JWT токеном (если есть)
curl -X POST "https://warehouse-api-zeta.vercel.app/api/sync/v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"operations":[],"metadata":{"source":"test"}}'
```

### 3. Проверка авторизации

```bash
# Без авторизации (должно вернуть 401)
curl "https://warehouse-api-zeta.vercel.app/api/sync/operations"

# С неправильным форматом Device ID (должно вернуть 400)
curl -H "X-Device-ID: invalid_device" \
  "https://warehouse-api-zeta.vercel.app/api/sync/operations"
```

## Ожидаемые результаты

### ✅ Успешные запросы

- **Legacy sync**: 200 OK с Device ID
- **Modern sync**: 200 OK с JWT или Device ID
- **Protected resources**: 200 OK только с JWT

### 🚨 Ошибки авторизации

- **401**: Отсутствует авторизация
- **400**: Неправильный формат Device ID
- **429**: Превышен rate limit

## Мониторинг

### Логи Vercel

После деплоя в логах должны появиться:
```
🔐 [DEVICE] POST /api/sync - device_test_device
🔐 [DEVICE] GET /api/sync/operations - device_test_device
🛡️ Rate limiting enabled for API endpoints
```

### Проверка endpoints

```bash
# Проверка статуса API
curl "https://warehouse-api-zeta.vercel.app/api/debug/status"

# Проверка health
curl "https://warehouse-api-zeta.vercel.app/health"
```

## Переменные окружения

Убедитесь, что в Vercel установлены:

```bash
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_ENABLED=true
DEVICE_AUTH_ENABLED=true
```

## Время развертывания

- **Компиляция**: ~30 секунд
- **Деплой на Vercel**: ~2-3 минуты
- **Проверка**: ~5 минут
- **Общее время**: ~10 минут

## Поддержка

При проблемах:
1. Проверьте логи Vercel
2. Убедитесь в правильности Device ID формата
3. Проверьте переменные окружения
4. Обратитесь к [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)

---

**Статус**: 🚀 Готово к развертыванию!
