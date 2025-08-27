# 🗄️ Детальная настройка базы данных Supabase для WeareHouse

## 📋 Шаг 1: Создание проекта Supabase

### 1.1 Регистрация и создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **"Start your project"** или **"Sign In"** если уже есть аккаунт
3. Войдите через GitHub/Google или создайте новый аккаунт
4. В дашборде нажмите **"New Project"**
5. Заполните данные проекта:
   - **Name**: `warehouse-system`
   - **Database Password**: Придумайте надежный пароль (сохраните его!)
   - **Region**: Выберите ближайший регион (например, `Central EU` для России)
   - **Pricing Plan**: `Free` (до 500MB и 50,000 запросов в месяц)
6. Нажмите **"Create new project"**
7. Ждите 1-2 минуты пока проект создается

### 1.2 Получение данных для подключения
После создания проекта, в дашборде найдите:
1. **Settings** → **API** → скопируйте:
   - `Project URL` (например: `https://xyzabc123.supabase.co`)
   - `anon public` ключ
   - `service_role` ключ (нажмите "Reveal" чтобы увидеть)

2. **Settings** → **Database** → скопируйте:
   - `Host`
   - `Database name`
   - `Port` (обычно 5432)
   - `User` (обычно postgres)
   - `Password` (тот что вводили при создании)

## 📊 Шаг 2: Выполнение миграций базы данных

### 2.1 Выполнение SQL через Supabase Dashboard
1. В дашборде проекта найдите **"SQL Editor"** в боковом меню
2. Нажмите **"New query"**
3. Скопируйте содержимое файла `supabase_setup.sql` (создан автоматически)
4. Вставьте SQL в редактор
5. Нажмите **"Run"** (Ctrl+Enter)
6. Дождитесь выполнения (может занять 30-60 секунд)

### 2.2 Проверка результата
После выполнения вы должны увидеть:
- ✅ Таблицы созданы (около 15 таблиц)
- ✅ Индексы созданы
- ✅ Триггеры созданы
- ✅ Начальные данные вставлены

Чтобы проверить, выполните:
```sql
-- Проверка созданных таблиц
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Проверка начальных данных
SELECT username, role FROM users;
SELECT name FROM categories;
SELECT name FROM locations;
```

### 2.3 Альтернативный способ - через psql (для продвинутых)
Если у вас установлен PostgreSQL клиент:
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" -f supabase_setup.sql
```

## 🔧 Шаг 3: Настройка переменных окружения

### 3.1 Переменные для API проекта (Vercel)
В настройках API проекта на Vercel добавьте:

```env
# Основные настройки
NODE_ENV=production
JWT_SECRET=yp7OY2hS+ruEY4FgiydPuxM6bSdEVuEhMG5diK6WegA=
CORS_ORIGIN=https://your-frontend-url.vercel.app

# Supabase подключение
SUPABASE_URL=https://xyzabc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# База данных (PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
DB_HOST=db.[PROJECT_ID].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_SSL=true
```

### 3.2 Переменные для Frontend проекта (Vercel)
```env
# API подключение
VITE_API_URL=https://your-api-url.vercel.app/api
VITE_APP_NAME=Система учета техники на складе

# Supabase для клиентской части
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 Шаг 4: Настройка безопасности (опционально)

### 4.1 Row Level Security (RLS)
Для дополнительной безопасности включите RLS:
```sql
-- Включение RLS для основных таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Политики доступа (пример для equipment)
CREATE POLICY "Users can view equipment" ON equipment
    FOR SELECT USING (true);

CREATE POLICY "Users can modify their equipment" ON equipment
    FOR ALL USING (created_by = auth.uid());
```

### 4.2 Настройка Authentication (если используете Supabase Auth)
```sql
-- Создание функции для создания пользователя в нашей таблице
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (uuid, email, full_name, username, nickname, login)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 
          new.email, new.email, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание пользователя
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## ✅ Шаг 5: Проверка подключения

### 5.1 Тестирование подключения
Создайте тестовый файл `test_connection.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xyzabc123.supabase.co',
  'your-anon-key'
);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, role')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Подключение успешно:', data);
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
  }
}

testConnection();
```

### 5.2 Проверка через API
После развертывания API, проверьте:
```bash
# Проверка статуса API
curl https://your-api-url.vercel.app/api/

# Проверка подключения к БД
curl https://your-api-url.vercel.app/api/auth/health
```

## 🚀 Шаг 6: Финальная настройка

### 6.1 Создание первого пользователя
1. Перейдите на ваш frontend сайт
2. Зарегистрируйте нового пользователя
3. Или используйте тестового пользователя:
   - **Username**: `Qstream`
   - **Password**: (нужно установить через API или админ панель)

### 6.2 Проверка функциональности
Протестируйте основные функции:
- ✅ Авторизация работает
- ✅ Создание оборудования
- ✅ Создание отгрузок
- ✅ Синхронизация данных

## 🔍 Полезные SQL запросы для мониторинга

```sql
-- Статистика по таблицам
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Последние синхронизации
SELECT 
    device_name,
    last_sync,
    is_active
FROM devices 
ORDER BY last_sync DESC 
LIMIT 10;

-- Статистика пользователей
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM users 
GROUP BY role;
```

## 🆘 Решение проблем

### Ошибка "relation does not exist"
- Проверьте что все миграции выполнены
- Убедитесь что используете правильную схему (public)

### Ошибка подключения
- Проверьте правильность переменных окружения
- Убедитесь что IP адрес Vercel добавлен в whitelist (если ограничен доступ)

### Медленные запросы
- Проверьте что все индексы созданы
- Используйте EXPLAIN ANALYZE для анализа запросов

---

## 📞 Поддержка

- 📖 **Документация Supabase**: [docs.supabase.com](https://docs.supabase.com)
- 💬 **Discord сообщество**: [discord.supabase.com](https://discord.supabase.com)
- 🐛 **Issues**: Создавайте issue в репозитории проекта

**Готово!** 🎉 Ваша база данных Supabase настроена и готова к работе!
