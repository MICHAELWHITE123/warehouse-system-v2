# Настройка Supabase для Warehouse Management System

## Обзор
Это руководство поможет вам настроить Supabase для работы с системой учета техники на складе.

## Шаг 1: Создание проекта Supabase

### 1.1 Регистрация
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите или создайте аккаунт

### 1.2 Создание проекта
1. Нажмите "New Project"
2. Выберите организацию или создайте новую
3. Заполните форму:
   - **Name**: `warehouse-system` (или любое другое)
   - **Database Password**: создайте надежный пароль
   - **Region**: выберите ближайший к вашим пользователям
4. Нажмите "Create new project"

### 1.3 Ожидание инициализации
- Процесс займет 1-2 минуты
- Дождитесь сообщения "Your project is ready"

## Шаг 2: Настройка базы данных

### 2.1 Выполнение миграций
1. В Dashboard перейдите в **SQL Editor**
2. Нажмите "New query"
3. Скопируйте содержимое файла `server/supabase-migrations.sql`
4. Вставьте в редактор
5. Нажмите "Run" (Ctrl+Enter)

### 2.2 Проверка таблиц
1. Перейдите в **Table Editor**
2. Убедитесь, что созданы таблицы:
   - `users`
   - `categories`
   - `locations`
   - `equipment`
   - `stacks`
   - `shipments`
   - `shipment_items`
   - `audit_logs`

### 2.3 Проверка данных
1. Откройте таблицу `categories`
2. Убедитесь, что есть тестовые данные:
   - Компьютеры
   - Сетевое оборудование
   - Принтеры
   - Мебель

## Шаг 3: Настройка аутентификации

### 3.1 Включение аутентификации
1. Перейдите в **Authentication** → **Settings**
2. Убедитесь, что **Enable email confirmations** включено
3. Настройте **Site URL** (пока оставьте пустым)

### 3.2 Настройка провайдеров
1. В **Authentication** → **Providers**
2. Убедитесь, что **Email** включен
3. При необходимости настройте другие провайдеры (Google, GitHub)

### 3.3 Создание первого пользователя
1. Перейдите в **Authentication** → **Users**
2. Нажмите "Add user"
3. Заполните форму:
   - **Email**: admin@example.com
   - **Password**: надежный пароль
   - **Role**: admin
4. Нажмите "Create user"

## Шаг 4: Настройка Row Level Security (RLS)

### 4.1 Включение RLS
Все таблицы уже настроены с RLS в миграциях. В продакшене настройте политики:

### 4.2 Политики для разработки
Для разработки используются простые политики "Allow all". В продакшене замените их:

```sql
-- Пример политики для equipment
CREATE POLICY "Users can view equipment" ON equipment
FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment" ON equipment
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update equipment" ON equipment
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete equipment" ON equipment
FOR DELETE USING (auth.role() = 'authenticated');
```

## Шаг 5: Получение ключей API

### 5.1 Переход в настройки API
1. Перейдите в **Settings** → **API**
2. Скопируйте следующие значения:

### 5.2 Ключи для фронтенда
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5.3 Ключи для бэкенда
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Шаг 6: Настройка переменных окружения

### 6.1 Локальная разработка
Создайте файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3001/api
```

### 6.2 Сервер разработки
Создайте файл `server/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-jwt-secret-key
```

## Шаг 7: Тестирование подключения

### 7.1 Тест фронтенда
1. Запустите фронтенд: `npm run dev`
2. Откройте браузер
3. Проверьте консоль на ошибки подключения

### 7.2 Тест бэкенда
1. Запустите сервер: `cd server && npm run dev`
2. Проверьте endpoint: `http://localhost:3001/api/health`
3. Убедитесь, что статус "healthy"

## Шаг 8: Настройка для продакшена

### 8.1 Обновление Site URL
1. В **Authentication** → **Settings**
2. Установите **Site URL**: `https://your-app.vercel.app`
3. Добавьте **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### 8.2 Настройка CORS
1. В **Settings** → **API**
2. Добавьте в **Additional Allowed Origins**:
   - `https://your-app.vercel.app`
   - `https://your-custom-domain.com` (если есть)

### 8.3 Настройка политик безопасности
Замените простые политики на более строгие:

```sql
-- Пример для equipment
DROP POLICY IF EXISTS "Allow all operations for now" ON equipment;

CREATE POLICY "Authenticated users can view equipment" ON equipment
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage equipment" ON equipment
FOR ALL USING (auth.role() = 'authenticated');
```

## Шаг 9: Мониторинг и поддержка

### 9.1 Логи
- **Authentication**: Authentication → Logs
- **Database**: Logs → Database
- **API**: Logs → API

### 9.2 Метрики
- **Usage**: Dashboard → Usage
- **Performance**: Dashboard → Performance

### 9.3 Бэкапы
- **Database**: Settings → Database → Backups
- Настройте автоматические бэкапы

## Troubleshooting

### Проблема: "Missing Supabase environment variables"
**Решение**: Проверьте, что все переменные окружения настроены правильно

### Проблема: "Database connection failed"
**Решение**: 
1. Проверьте URL и ключи
2. Убедитесь, что проект активен
3. Проверьте RLS политики

### Проблема: "CORS error"
**Решение**:
1. Добавьте домен в CORS настройки
2. Проверьте Site URL в Authentication

### Проблема: "RLS policy violation"
**Решение**:
1. Проверьте политики в Table Editor
2. Убедитесь, что пользователь аутентифицирован
3. Проверьте роли пользователя

## Безопасность

### Рекомендации
1. **Никогда не делитесь** service role key
2. Используйте **сильные пароли**
3. Настройте **двухфакторную аутентификацию**
4. Регулярно **обновляйте ключи**
5. Мониторьте **логи доступа**

### Мониторинг
1. Настройте **алерты** в Supabase
2. Регулярно проверяйте **логи**
3. Мониторьте **использование ресурсов**

## Поддержка

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Community**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

🎉 **Поздравляем!** Ваш Supabase проект настроен и готов к работе!
