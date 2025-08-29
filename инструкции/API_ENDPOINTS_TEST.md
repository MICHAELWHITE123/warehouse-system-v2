# 🧪 Тестирование API endpoints после исправления

## ✅ **Исправления, которые были сделаны:**

1. **Обновлен `vercel.json`** - современная конфигурация для Vite + API functions
2. **Упрощены API handlers** - убраны сложные зависимости для быстрого запуска
3. **Добавлены типы** - `@vercel/node` и `@types/node` для TypeScript поддержки

---

## 🚀 **Как протестировать после deployment:**

### **1. Health Check API**
```bash
curl https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/api/health
```

**Ожидаемый ответ:**
```json
{
  "status": "healthy",
  "message": "WeareHouse API is running",
  "environment": {
    "SUPABASE_URL": false,
    "SUPABASE_SERVICE_ROLE_KEY": false,
    "NODE_ENV": "production"
  },
  "system": {
    "timestamp": "2024-08-27T18:30:00.000Z",
    "uptime": 1.234,
    "memory": {...},
    "nodeVersion": "v18.x.x"
  },
  "endpoints": {
    "health": "/api/health",
    "realtime_notify": "/api/realtime/notify"
  }
}
```

### **2. Realtime Notify API**
```bash
curl -X POST https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/api/realtime/notify \
  -H "Content-Type: application/json" \
  -d '{"table":"equipment","action":"update","data":{"id":1,"name":"test"}}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Notification processed",
  "table": "equipment",
  "action": "update",
  "timestamp": "2024-08-27T18:30:00.000Z"
}
```

---

## 🌐 **Тестирование через браузер:**

### **Health Check (GET):**
```
https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/api/health
```

### **Диагностическая страница:**
```
https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/health.html
```

---

## 🔧 **Если API все еще не работает:**

### **Проверьте логи Vercel:**
1. Откройте https://vercel.com/dashboard
2. Найдите проект **warehouse-d2mdr5hqt**
3. **Functions** → **View Logs**

### **Проверьте build:**
1. **Deployments** → последний deployment
2. **View Build Logs**
3. Убедитесь что нет ошибок TypeScript

### **Принудительный redeploy:**
1. **Deployments** → последний deployment
2. **⋯** → **Redeploy**
3. Подождите 2-3 минуты

---

## 📱 **Простое тестирование API в браузере:**

Откройте Developer Console на любой странице и выполните:

```javascript
// Тест Health API
fetch('https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/api/health')
  .then(r => r.json())
  .then(data => console.log('Health API:', data))
  .catch(err => console.error('Health API Error:', err));

// Тест Notify API
fetch('https://warehouse-d2mdr5hqt-mikhails-projects-62f0388c.vercel.app/api/realtime/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'equipment',
    action: 'test',
    data: { message: 'API test from browser' }
  })
})
  .then(r => r.json())
  .then(data => console.log('Notify API:', data))
  .catch(err => console.error('Notify API Error:', err));
```

---

## ✅ **Ожидаемые результаты после исправления:**

- ✅ **`/api/health`** возвращает JSON вместо 404
- ✅ **`/api/realtime/notify`** принимает POST запросы
- ✅ **Основное приложение** открывается без 401 ошибки
- ✅ **Favicon** загружается без 404 ошибок

---

## 🎯 **Следующие шаги после успешного тестирования:**

1. **Настроить Environment Variables** (SUPABASE_URL, etc.)
2. **Протестировать Supabase integration**
3. **Проверить real-time синхронизацию**

**Проверьте API endpoints через 5-10 минут после commit/push!** 🚀
