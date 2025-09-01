# Инструкция по настройке Supabase для WeareHouse

## Обзор

Этот документ содержит пошаговые инструкции по настройке базы данных Supabase для системы управления складом WeareHouse.

## Файлы для настройки

Созданы следующие SQL файлы:

1. **`setup_schema.sql`** - Основная схема базы данных
2. **`setup_functions.sql`** - Функции и API для базы данных  
3. **`setup_data.sql`** - Начальные данные
4. **`setup_realtime.sql`** - Настройка Realtime

## Порядок выполнения

**ВАЖНО:** Выполняйте шаги строго в указанном порядке, так как есть зависимости между таблицами и данными.

### Шаг 1: Открытие SQL Editor в Supabase

1. Войдите в панель управления Supabase
2. Перейдите в раздел **SQL Editor**
3. Создайте новый запрос или используйте существующий

### Шаг 2: Создание основной схемы

1. Скопируйте содержимое файла **`setup_schema.sql`**
2. Вставьте в SQL Editor
3. Нажмите **Run** для выполнения

**Что создается:**
- Все основные таблицы (equipment, categories, locations, shipments и др.)
- Индексы для производительности
- Триггеры для автоматического обновления
- Представления (views)
- Row Level Security (RLS) политики

### Шаг 3: Создание функций и API

1. Скопируйте содержимое файла **`setup_functions.sql`**
2. Вставьте в новый SQL Editor
3. Нажмите **Run** для выполнения

**Что создается:**
- Функции для работы с оборудованием
- Функции для работы с отгрузками
- Функции для синхронизации
- Функции для уведомлений
- Функции для отчетности
- Дополнительные триггеры

### Шаг 4: Вставка начальных данных

1. Скопируйте содержимое файла **`setup_data.sql`**
2. Вставьте в новый SQL Editor
3. Нажмите **Run** для выполнения

**Что создается:**
- Системный пользователь для created_by/updated_by полей
- Базовые категории оборудования
- Базовые местоположения
- Тестовое оборудование
- Тестовые стеки оборудования
- Тестовые отгрузки
- Тестовые данные синхронизации

### Шаг 5: Настройка Realtime

1. Скопируйте содержимое файла **`setup_realtime.sql`**
2. Вставьте в новый SQL Editor
3. Нажмите **Run** для выполнения

**Что создается:**
- Расширение Realtime
- Публикации для всех таблиц
- Триггеры для Realtime уведомлений
- Специализированные каналы уведомлений

## Проверка настройки

После выполнения всех шагов проверьте:

### 1. Созданные таблицы
```sql
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 2. Созданные функции
```sql
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

### 3. Созданные триггеры
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

### 4. Начальные данные
```sql
SELECT 'categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments;
```

## Настройка аутентификации

### 1. Включение аутентификации
1. Перейдите в **Authentication > Settings**
2. Включите **Enable email confirmations**
3. Настройте **Site URL** и **Redirect URLs**

### 2. Настройка провайдеров
1. **Email**: Настройте SMTP сервер
2. **Google**: Добавьте OAuth credentials
3. **GitHub**: Добавьте OAuth app

### 3. Настройка RLS
RLS уже настроен в схеме, но убедитесь что:
- Все таблицы имеют политики доступа
- Пользователи могут видеть только разрешенные данные

## Настройка Storage

### 1. Создание бакетов
1. Перейдите в **Storage**
2. Создайте бакет `equipment-images` для изображений оборудования
3. Создайте бакет `shipment-documents` для документов отгрузок

### 2. Настройка политик доступа
```sql
-- Политика для изображений оборудования
CREATE POLICY "Users can view equipment images" ON storage.objects
    FOR SELECT USING (bucket_id = 'equipment-images');

CREATE POLICY "Users can upload equipment images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'equipment-images');
```

## Настройка Edge Functions

### 1. Создание функций
1. Перейдите в **Edge Functions**
2. Создайте функции для:
   - Синхронизации данных
   - Уведомлений
   - Экспорта отчетов

### 2. Деплой функций
```bash
supabase functions deploy sync-data
supabase functions deploy notifications
supabase functions deploy export-reports
```

## Тестирование

### 1. Тест базовых операций
```sql
-- Тест поиска оборудования
SELECT * FROM search_equipment('ноутбук');

-- Тест статистики
SELECT * FROM get_equipment_statistics();

-- Тест создания отгрузки
SELECT create_shipment_with_equipment(
    '{"number": "TEST-001", "date": "2025-01-01", "recipient": "Тест", "recipient_address": "Тест"}',
    '[]',
    '[]'
);
```

### 2. Тест Realtime
1. Откройте консоль браузера
2. Подключитесь к каналу:
```javascript
const channel = supabase
  .channel('test')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'equipment' },
    (payload) => console.log('Change:', payload)
  )
  .subscribe()
```

3. Измените данные в таблице equipment
4. Проверьте получение уведомлений в консоли

## Возможные проблемы и решения

### 1. Ошибка "extension not found"
```sql
-- Создайте расширения вручную
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "realtime";
```

### 2. Ошибка foreign key constraint "categories_created_by_fkey"
```sql
-- Создайте системного пользователя вручную
INSERT INTO user_profiles (id, username, email, full_name, role) VALUES
('00000000-0000-0000-0000-000000000000', 'system', 'system@wearehouse.local', 'System User', 'admin')
ON CONFLICT (id) DO NOTHING;
```

### 3. Ошибка RLS
```sql
-- Проверьте политики
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Пересоздайте политики при необходимости
DROP POLICY IF EXISTS "Users can view all equipment" ON equipment;
CREATE POLICY "Users can view all equipment" ON equipment FOR SELECT USING (true);
```

### 4. Ошибка триггеров
```sql
-- Проверьте триггеры
SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Пересоздайте триггеры при необходимости
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Следующие шаги

После успешной настройки:

1. **Настройте переменные окружения** в вашем приложении
2. **Протестируйте все функции** API
3. **Настройте мониторинг** и логирование
4. **Создайте резервные копии** базы данных
5. **Настройте CI/CD** для автоматического деплоя

## Поддержка

При возникновении проблем:

1. Проверьте логи в **Logs** разделе Supabase
2. Используйте **Database** раздел для прямого доступа к базе
3. Обратитесь к документации Supabase
4. Создайте issue в репозитории проекта

## Заключение

Эта настройка создает полнофункциональную базу данных для системы управления складом WeareHouse с поддержкой:

- ✅ Управления оборудованием и отгрузками
- ✅ Синхронизации между устройствами
- ✅ Realtime уведомлений
- ✅ Безопасности и аутентификации
- ✅ API функций для клиентских приложений
- ✅ Логирования и аудита изменений

Система готова к использованию в продакшене после дополнительного тестирования и настройки под конкретные требования.
