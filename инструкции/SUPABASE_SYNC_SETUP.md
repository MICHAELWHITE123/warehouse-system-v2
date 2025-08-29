# Настройка Supabase для синхронизации между устройствами

## Проблема
В текущей конфигурации на Vercel синхронизация между устройствами не работает, так как:
- `VITE_API_URL` не установлен
- Приложение работает только в локальном режиме
- Данные не передаются между телефонами/компьютерами

## Решение: Настройка Supabase

### 1. Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запишите:
   - Project URL (например: `https://abcdefgh.supabase.co`)
   - Anon Key (публичный ключ)

### 2. Настройка переменных окружения

В вашем Vercel проекте установите следующие переменные окружения:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=https://your-project-ref.supabase.co
```

### 3. Настройка базы данных

Выполните SQL скрипт из `supabase_setup.sql` в SQL Editor Supabase:

```sql
-- Создание таблиц для синхронизации
CREATE TABLE IF NOT EXISTS sync_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_device_id TEXT NOT NULL,
  user_id TEXT,
  acknowledged_by TEXT[]
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_sync_operations_timestamp ON sync_operations(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_operations_device ON sync_operations(source_device_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_user ON sync_operations(user_id);

-- RLS (Row Level Security) для безопасности
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (все авторизованные пользователи)
CREATE POLICY "Users can read sync operations" ON sync_operations
  FOR SELECT USING (true);

-- Политика для записи (все авторизованные пользователи)
CREATE POLICY "Users can insert sync operations" ON sync_operations
  FOR INSERT WITH CHECK (true);

-- Политика для обновления (только создатель операции)
CREATE POLICY "Users can update own operations" ON sync_operations
  FOR UPDATE USING (source_device_id = current_setting('app.device_id', true));
```

### 4. Настройка функций для синхронизации

Создайте следующие функции в Supabase:

```sql
-- Функция для получения операций синхронизации
CREATE OR REPLACE FUNCTION get_sync_operations(
  p_device_id TEXT,
  p_last_sync TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ
)
RETURNS TABLE (
  operation_id UUID,
  table_name TEXT,
  operation_type TEXT,
  data JSONB,
  timestamp TIMESTAMPTZ,
  source_device_id TEXT,
  user_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.table_name,
    so.operation_type,
    so.data,
    so.timestamp,
    so.source_device_id,
    so.user_id
  FROM sync_operations so
  WHERE so.timestamp > p_last_sync
    AND so.source_device_id != p_device_id
  ORDER BY so.timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для подтверждения получения операции
CREATE OR REPLACE FUNCTION acknowledge_sync_operation(
  p_operation_id UUID,
  p_device_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sync_operations 
  SET acknowledged_by = array_append(acknowledged_by, p_device_id)
  WHERE id = p_operation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Настройка Real-time подписок (опционально)

Для мгновенной синхронизации настройте real-time подписки:

```sql
-- Включение real-time для таблицы sync_operations
ALTER PUBLICATION supabase_realtime ADD TABLE sync_operations;
```

### 6. Проверка работы

После настройки:

1. Перезапустите приложение на Vercel
2. Откройте на двух разных устройствах
3. Создайте/измените оборудование на одном устройстве
4. Проверьте, появилось ли оно на другом устройстве

## Альтернативное решение: Vercel KV

Если Supabase не подходит, можно использовать Vercel KV (Redis):

```bash
# Установка Vercel KV
vercel kv add

# Переменные окружения
VITE_UPSTASH_REDIS_REST_URL=your_redis_url
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token
VITE_API_URL=https://your-app.vercel.app/api
```

## Устранение неполадок

### Проверка подключения
Откройте консоль браузера и проверьте:
- Подключение к Supabase
- Ошибки синхронизации
- Статус real-time соединения

### Логи синхронизации
В консоли должны быть сообщения:
- `🔗 Real-time connection established`
- `📨 Real-time update received`
- `✅ Real-time sync connected`

### Проверка переменных окружения
Убедитесь, что в Vercel установлены все необходимые переменные:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
