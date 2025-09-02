# Настройка синхронизации в Supabase Dashboard

## 1. Создание Edge Function

### Шаг 1: Установка Supabase CLI
```bash
npm install -g supabase
```

### Шаг 2: Логин в Supabase
```bash
supabase login
```

### Шаг 3: Связывание проекта
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Шаг 4: Развертывание Edge Function
```bash
supabase functions deploy sync
```

## 2. Настройка переменных окружения

В Supabase Dashboard перейдите в **Settings > API** и убедитесь, что у вас есть:

### Переменные окружения для Edge Functions:
- `SUPABASE_URL` - URL вашего проекта (например: `https://your-project.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (находится в Settings > API)

### Переменные окружения для клиента:
В файле `.env` или в Vercel:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Настройка базы данных

### Шаг 1: Применение миграций
```bash
supabase db push
```

### Шаг 2: Проверка таблиц в Dashboard
В Supabase Dashboard перейдите в **Table Editor** и убедитесь, что созданы таблицы:
- `equipment`
- `categories`
- `locations`
- `sync_operations` (новая таблица для отслеживания синхронизации)

### Шаг 3: Настройка Row Level Security (RLS)
В **Authentication > Policies** убедитесь, что для всех таблиц настроены политики:

#### Для таблицы `equipment`:
```sql
-- Политика для чтения
CREATE POLICY "Users can view equipment" ON equipment
  FOR SELECT USING (auth.uid()::text = created_by);

-- Политика для создания
CREATE POLICY "Users can create equipment" ON equipment
  FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- Политика для обновления
CREATE POLICY "Users can update equipment" ON equipment
  FOR UPDATE USING (auth.uid()::text = created_by);

-- Политика для удаления
CREATE POLICY "Users can delete equipment" ON equipment
  FOR DELETE USING (auth.uid()::text = created_by);
```

#### Для таблицы `sync_operations`:
```sql
-- Политика для чтения
CREATE POLICY "Users can view their own sync operations" ON sync_operations
  FOR SELECT USING (auth.uid()::text = user_id);

-- Политика для создания
CREATE POLICY "Users can insert their own sync operations" ON sync_operations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

## 4. Настройка аутентификации

### Шаг 1: Настройка провайдеров аутентификации
В **Authentication > Providers** настройте:
- Email (включен по умолчанию)
- Google (опционально)
- GitHub (опционально)

### Шаг 2: Настройка URL перенаправления
В **Authentication > URL Configuration**:
- Site URL: `https://your-vercel-app.vercel.app`
- Redirect URLs: `https://your-vercel-app.vercel.app/**`

## 5. Настройка Realtime (опционально)

### Шаг 1: Включение Realtime
В **Database > Replication** включите Realtime для таблиц:
- `equipment`
- `categories`
- `locations`

### Шаг 2: Настройка каналов
```sql
-- Подписка на изменения оборудования
supabase
  .channel('equipment_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'equipment' }, 
    (payload) => {
      console.log('Equipment changed:', payload);
    }
  )
  .subscribe();
```

## 6. Тестирование синхронизации

### Шаг 1: Проверка Edge Function
```bash
# Тест локально
supabase functions serve sync

# Тест в production
curl -X POST https://your-project.supabase.co/functions/v1/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "operations": [],
    "deviceId": "test-device",
    "lastSync": 0
  }'
```

### Шаг 2: Проверка в браузере
Откройте консоль разработчика и проверьте:
1. Нет ли ошибок 404 при синхронизации
2. Правильно ли отправляются запросы к Supabase Edge Functions
3. Возвращаются ли корректные ответы

## 7. Мониторинг и отладка

### Шаг 1: Логи Edge Functions
В Supabase Dashboard перейдите в **Edge Functions > Logs** для просмотра логов синхронизации.

### Шаг 2: Мониторинг базы данных
В **Database > Logs** можно отслеживать запросы к базе данных.

### Шаг 3: Проверка таблицы sync_operations
```sql
-- Просмотр операций синхронизации
SELECT * FROM sync_operations ORDER BY created_at DESC LIMIT 10;

-- Статистика по устройствам
SELECT device_id, COUNT(*) as operations_count 
FROM sync_operations 
GROUP BY device_id;
```

## 8. Устранение неполадок

### Проблема: 404 ошибка при синхронизации
**Решение:**
1. Убедитесь, что Edge Function развернута: `supabase functions list`
2. Проверьте URL в конфигурации API
3. Убедитесь, что переменные окружения настроены правильно

### Проблема: Ошибки аутентификации
**Решение:**
1. Проверьте правильность `VITE_SUPABASE_ANON_KEY`
2. Убедитесь, что пользователь аутентифицирован
3. Проверьте политики RLS

### Проблема: Конфликты синхронизации
**Решение:**
1. Проверьте логи Edge Function
2. Убедитесь, что хеши данных генерируются корректно
3. Проверьте временные метки операций

## 9. Оптимизация производительности

### Шаг 1: Индексы
Убедитесь, что созданы все необходимые индексы:
```sql
-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_equipment_created_by ON equipment(created_by);
CREATE INDEX IF NOT EXISTS idx_equipment_updated_at ON equipment(updated_at);
```

### Шаг 2: Очистка старых данных
```sql
-- Автоматическая очистка старых операций синхронизации
SELECT cron.schedule('cleanup-sync-operations', '0 2 * * *', 'SELECT cleanup_old_sync_operations();');
```

## 10. Безопасность

### Шаг 1: Проверка политик доступа
Убедитесь, что все таблицы защищены RLS и имеют соответствующие политики.

### Шаг 2: Мониторинг подозрительной активности
Регулярно проверяйте логи на предмет подозрительных запросов.

### Шаг 3: Обновление ключей
Периодически обновляйте API ключи в Supabase Dashboard.

---

После выполнения всех этих шагов синхронизация должна работать корректно. Если возникнут проблемы, проверьте логи в Supabase Dashboard и консоль браузера для диагностики.
