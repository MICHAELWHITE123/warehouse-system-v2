# 🚀 Деплой на Vercel с синхронизацией между устройствами

## 📋 Пошаговая инструкция

### 1. Подготовка проекта

Убедитесь, что у вас есть файлы:
- ✅ `api/sync.js` - основной API синхронизации
- ✅ `api/sync/operations.js` - получение операций
- ✅ `api/sync/operations/[id]/acknowledge.js` - подтверждение операций
- ✅ `api/status.js` - статус системы
- ✅ `vercel.json` - конфигурация Vercel

### 2. Настройка Vercel KV (база данных)

1. **Перейдите в Vercel Dashboard**: https://vercel.com/dashboard
2. **Создайте новый проект** или выберите существующий
3. **Перейдите в Storage**: Storage → Create Database → KV
4. **Создайте KV базу**: назовите её `warehouse-sync`
5. **Получите переменные окружения**: 
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### 3. Настройка переменных окружения

В Vercel Dashboard → Settings → Environment Variables добавьте:

```bash
# Vercel KV (обязательно)
KV_REST_API_URL=https://your-kv-url.kv.vercel-storage.com
KV_REST_API_TOKEN=your-kv-token

# Опционально (для кастомного API URL)
VITE_API_URL=https://your-app.vercel.app/api
```

### 4. Деплой

```bash
# Вариант 1: Через GitHub
1. Пушьте код в GitHub
2. Подключите репозиторий к Vercel
3. Деплой произойдёт автоматически

# Вариант 2: Через Vercel CLI
npm install -g vercel
vercel --prod
```

### 5. Проверка работы

После деплоя проверьте:

1. **Статус API**: `https://your-app.vercel.app/api/status`
2. **Синхронизация**: создайте оборудование на одном устройстве
3. **Проверьте на другом устройстве**: должно появиться автоматически

## 🔧 Структура API

### Основные эндпоинты:

- `POST /api/sync` - отправка операций на сервер
- `GET /api/sync/operations` - получение операций для синхронизации
- `POST /api/sync/operations/[id]/acknowledge` - подтверждение обработки
- `GET /api/status` - статус системы

### Примеры запросов:

```javascript
// Отправка операций
POST https://your-app.vercel.app/api/sync
{
  "operations": [...],
  "deviceId": "device_123",
  "userId": "user1"
}

// Получение операций
GET https://your-app.vercel.app/api/sync/operations?deviceId=device_123&lastSync=1234567890
```

## 🎯 Что получится

✅ **Полная синхронизация между устройствами**  
✅ **Работает на любом количестве устройств**  
✅ **Автоматическое обновление данных**  
✅ **Работает без интернета** (локальное хранилище)  
✅ **Синхронизируется при появлении интернета**  

## 🚨 Устранение проблем

### Проблема: API не работает
**Решение**: Проверьте переменные KV в Environment Variables

### Проблема: Операции не синхронизируются
**Решение**: Откройте DevTools и проверьте Network вкладку

### Проблема: "Failed to fetch"
**Решение**: Убедитесь, что API доступен: `/api/status`

## 📊 Мониторинг

- **Статус системы**: `https://your-app.vercel.app/api/status`
- **Vercel Dashboard**: следите за логами функций
- **KV Storage**: проверяйте количество операций

## 🎉 Готово!

После деплоя ваше приложение будет работать на:
```
https://your-app.vercel.app
```

Синхронизация будет работать между **всеми устройствами автоматически**! 🚀

---

**💡 Совет**: Поделитесь ссылкой с коллегами - они смогут работать с теми же данными!