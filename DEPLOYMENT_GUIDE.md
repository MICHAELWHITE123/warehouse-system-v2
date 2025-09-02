# Руководство по деплою Warehouse Management System

## Обзор
Этот проект состоит из:
- **Frontend**: React + Vite приложение
- **Backend**: Express.js API сервер
- **Database**: Supabase (PostgreSQL)

## Шаг 1: Настройка Supabase

### 1.1 Создание проекта в Supabase
1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Запишите:
   - Project URL
   - Anon (public) key
   - Service role key

### 1.2 Настройка базы данных
1. В Supabase Dashboard перейдите в SQL Editor
2. Выполните SQL из файла `server/supabase-migrations.sql`
3. Это создаст все необходимые таблицы и заполнит их тестовыми данными

### 1.3 Настройка Row Level Security (RLS)
В продакшене настройте политики безопасности в Supabase Dashboard:
- Authentication > Policies
- Настройте политики для каждой таблицы

## Шаг 2: Настройка Vercel

### 2.1 Подготовка проекта
1. Убедитесь, что все изменения закоммичены в Git
2. Проект уже настроен для деплоя на Vercel

### 2.2 Создание проекта в Vercel
1. Зайдите на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Настройте проект:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.3 Настройка переменных окружения
В Vercel Dashboard добавьте следующие переменные:

#### Frontend переменные:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=https://your-vercel-app.vercel.app/api
```

#### Backend переменные:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_database_url
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=your_jwt_secret_key_here
```

## Шаг 3: Деплой

### 3.1 Первый деплой
1. В Vercel нажмите "Deploy"
2. Дождитесь завершения сборки
3. Проверьте, что приложение работает

### 3.2 Проверка работоспособности
1. Откройте деплой URL
2. Проверьте API: `https://your-app.vercel.app/api/health`
3. Убедитесь, что подключение к Supabase работает

## Шаг 4: Настройка домена (опционально)

### 4.1 Кастомный домен
1. В Vercel Dashboard перейдите в Settings > Domains
2. Добавьте ваш домен
3. Настройте DNS записи

### 4.2 Обновление переменных окружения
После настройки домена обновите:
- `VITE_API_URL`
- `CORS_ORIGIN`

## Шаг 5: Мониторинг и поддержка

### 5.1 Логи
- Vercel: Dashboard > Functions > Logs
- Supabase: Dashboard > Logs

### 5.2 Метрики
- Vercel: Dashboard > Analytics
- Supabase: Dashboard > Usage

## Структура проекта после деплоя

```
Production URLs:
- Frontend: https://your-app.vercel.app
- API: https://your-app.vercel.app/api
- Database: Supabase (managed)

Environment:
- Frontend: Vercel Edge Functions
- Backend: Vercel Serverless Functions
- Database: Supabase PostgreSQL
```

## Troubleshooting

### Проблемы с подключением к базе данных
1. Проверьте переменные окружения
2. Убедитесь, что Supabase проект активен
3. Проверьте RLS политики

### Проблемы с CORS
1. Проверьте `CORS_ORIGIN` в переменных окружения
2. Убедитесь, что домен указан правильно

### Проблемы с авторизацией
1. Проверьте Supabase ключи
2. Убедитесь, что Auth настроен в Supabase

## Команды для локальной разработки

```bash
# Установка зависимостей
npm install
cd server && npm install

# Запуск в режиме разработки
npm run dev
cd server && npm run dev

# Сборка для продакшена
npm run build
cd server && npm run build
```

## Безопасность

### Рекомендации для продакшена
1. Настройте RLS политики в Supabase
2. Используйте сильные JWT секреты
3. Ограничьте CORS origins
4. Настройте rate limiting
5. Включите HTTPS
6. Регулярно обновляйте зависимости

### Мониторинг безопасности
1. Настройте Supabase Auth hooks
2. Включите аудит в Supabase
3. Мониторьте логи Vercel
4. Настройте алерты

## Поддержка

При возникновении проблем:
1. Проверьте логи в Vercel и Supabase
2. Убедитесь, что все переменные окружения настроены
3. Проверьте документацию Vercel и Supabase
4. Создайте issue в репозитории проекта
