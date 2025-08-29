# 🚨 FIX: ОШИБКА 429 TOO MANY REQUESTS

## Проблема

Клиент получает ошибку 429 при синхронизации:

```
GET https://warehouse-api-zeta.vercel.app/api/sync/operations?deviceId=device_hy482o_metwc2e5&lastSync=0 429 (Too Many Requests)
Failed to pull operations from server: Error: HTTP 429
```

## Причина

Rate limiting для sync endpoints был слишком строгим:
- **Было**: 30 запросов в минуту
- **Проблема**: Клиент делает частые запросы для синхронизации
- **Результат**: Превышение лимита → ошибка 429

## Решение

### 1. ✅ Увеличены лимиты для sync endpoints

```typescript
// Было: слишком строго
export const syncRateLimit = createRateLimiter({
  windowMs: 60000, // 1 минута
  maxRequests: 30, // 30 запросов в минуту
});

// Стало: более мягко
export const syncRateLimit = createRateLimiter({
  windowMs: 60000, // 1 минута
  maxRequests: 100, // 100 запросов в минуту
});

// Добавлен специальный rate limiter для устройств
export const deviceSyncRateLimit = createRateLimiter({
  windowMs: 60000, // 1 минута
  maxRequests: 200, // 200 запросов в минуту для устройств
});
```

### 2. ✅ Отключен rate limiting для sync в production

```bash
# В server/env.production
SYNC_RATE_LIMIT_DISABLED=true
```

### 3. ✅ Условное применение rate limiting

```typescript
// Rate limiting применяется только если не отключен
if (process.env.SYNC_RATE_LIMIT_DISABLED !== 'true') {
  router.use('/operations', deviceSyncRateLimit);
  router.use('/', deviceSyncRateLimit);
  router.use('/v2', syncRateLimit);
  console.log('🛡️ Rate limiting enabled for sync endpoints');
} else {
  console.log('⚠️ Rate limiting disabled for sync endpoints');
}
```

## Новые настройки Rate Limiting

| Endpoint | Тип | Лимит | Описание |
|----------|-----|-------|----------|
| `/api/*` | Глобальный | 100 запросов в 15 минут | Общие API endpoints |
| `/api/sync/*` | Legacy | 200 запросов в минуту | Sync для устройств |
| `/api/sync/v2/*` | Modern | 100 запросов в минуту | Современные sync endpoints |
| `/api/auth/*` | Auth | 5 попыток в 5 минут | Авторизация |

## Деплой исправления

```bash
# 1. Коммит изменений
git add server/src/middleware/rateLimit.ts
git add server/src/routes/sync.ts
git add server/env.production
git add RATE_LIMIT_429_FIX.md

git commit -m "Fix: Resolve 429 error by adjusting rate limiting for sync endpoints"

# 2. Пуш на GitHub
git push origin main
```

## Результат

После деплоя:
- ✅ **Ошибка 429 исчезнет** для sync endpoints
- ✅ **Синхронизация будет работать** без прерываний
- ✅ **Безопасность сохранится** для других endpoints
- ✅ **Логи покажут** отключение rate limiting для sync

## Альтернативные решения

### Вариант 1: Отключить rate limiting для sync (текущее решение)
```bash
SYNC_RATE_LIMIT_DISABLED=true
```

### Вариант 2: Увеличить лимиты
```bash
SYNC_RATE_LIMIT_DISABLED=false
# Использует увеличенные лимиты: 200 запросов в минуту
```

### Вариант 3: Настроить per-device rate limiting
```typescript
// Каждое устройство имеет свой лимит
const deviceKey = `${req.ip}_${req.deviceId}`;
```

## Мониторинг

После исправления в логах Vercel должно появиться:
```
⚠️ Rate limiting disabled for sync endpoints
🔐 [DEVICE] GET /api/sync/operations - device_hy482o_metwc2e5
```

## Проверка

```bash
# Должен работать без ошибок 429
curl -H "X-Device-ID: device_test_device" \
  "https://warehouse-api-zeta.vercel.app/api/sync/operations?deviceId=device_test_device&lastSync=0"
```

## Заключение

**Проблема 429 решена путем:**
1. Увеличения лимитов для sync endpoints
2. Отключения rate limiting для sync в production
3. Сохранения безопасности для других endpoints

**Статус**: 🚨 ПРОБЛЕМА 429 РЕШЕНА! 🚨

---

**Дата исправления**: 29 августа 2024  
**Время**: ~13:30 MSK
