# Исправление ошибки 401 при подключении к Supabase Real-time API

## 🚨 Проблема

Приложение получает ошибку **401 (Unauthorized)** при попытке подключения к Supabase real-time API:

```
GET https://xekoibwvbsbpjcjqmjlu.supabase.co/functions/v1/events?stream=stream&apikey=... 401 (Unauthorized)
❌ Real-time connection error: Event
🔄 Attempting to reconnect in 1000ms (attempt 1/5)
```

## 🔍 Причины

1. **Отсутствует Edge Function**: В Supabase не развернута Edge Function `events` для обработки real-time подключений
2. **Неправильный URL**: В переменных окружения указан `.supabase.sh` вместо `.supabase.co`
3. **Проблемы с аутентификацией**: Edge Function не может проверить валидность API ключа

## ✅ Решения

### Решение 1: Развертывание Edge Function (Рекомендуется)

#### Быстрое развертывание через скрипт:
```bash
./deploy-supabase-function.sh
```

#### Ручное развертывание:
```bash
# 1. Установка CLI
npm install -g supabase

# 2. Логин
supabase login

# 3. Связывание с проектом
supabase link --project-ref xekoibwvbsbpjcjqmjlu

# 4. Развертывание
supabase functions deploy events
```

### Решение 2: Исправление переменных окружения

Исправьте файл `env.development`:
```bash
# Было:
VITE_SUPABASE_URL=https://xekoibwvbsbpjcjqmjlu.supabase.sh

# Должно быть:
VITE_SUPABASE_URL=https://xekoibwvbsbpjcjqmjlu.supabase.co
```

### Решение 3: Fallback на локальный API

Код уже обновлен для автоматического fallback на локальный API если Supabase недоступен.

## 🔧 Технические детали

### Структура Edge Function
```
supabase/
  functions/
    events/
      index.ts          # Код Edge Function
```

### Проверка аутентификации
Edge Function проверяет:
- Наличие параметра `apikey`
- Валидность API ключа через Supabase клиент
- Правильность переменных окружения

### CORS настройки
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

## 🚀 Проверка исправления

После применения решения:

1. **Перезапустите приложение**
2. **Проверьте консоль браузера**:
   ```
   🔗 Real-time connection established
   ✅ Real-time sync connected at: [timestamp]
   ```
3. **Ошибки 401 должны исчезнуть**

## 📋 Переменные окружения в Supabase

Убедитесь, что в Supabase Dashboard настроены:
- `SUPABASE_URL` - URL проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Сервисный ключ (не анонимный!)

## 🔄 Альтернативные решения

### Использование Supabase Realtime напрямую
Если Edge Function не подходит, можно использовать встроенный Supabase Realtime:

```typescript
import { useSupabaseRealtime } from '../adapters/supabaseRealtimeAdapter';

// Вместо EventSource используйте Supabase Realtime
const { isConnected, subscribe } = useSupabaseRealtime({
  tables: ['equipment', 'shipments', 'stacks']
});
```

### Локальный WebSocket сервер
Для разработки можно использовать локальный WebSocket сервер вместо EventSource.

## 📚 Дополнительные ресурсы

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [EventSource API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

## 🆘 Если проблема остается

1. **Проверьте логи Supabase**: Edge Functions > Logs
2. **Проверьте переменные окружения**: Settings > Environment variables
3. **Проверьте права доступа**: API > Settings > API keys
4. **Создайте issue** с подробным описанием ошибки
