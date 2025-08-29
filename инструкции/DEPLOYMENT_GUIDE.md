# 🚀 Руководство по деплою на Vercel + Supabase

## 📋 Предварительные требования

1. **GitHub аккаунт** с вашим репозиторием
2. **Vercel аккаунт** ([vercel.com](https://vercel.com))
3. **Supabase аккаунт** ([supabase.com](https://supabase.com))

## 🔧 Шаг 1: Настройка Supabase

### 1.1 Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "New Project"
3. Выберите организацию или создайте новую
4. Введите название проекта: `warehouse-system`
5. Введите пароль для базы данных
6. Выберите регион (ближайший к вашим пользователям)
7. Нажмите "Create new project"

### 1.2 Настройка базы данных
1. В вашем проекте перейдите в **SQL Editor**
2. Скопируйте содержимое файла `server/supabase-migrations.sql`
3. Вставьте в SQL Editor и нажмите "Run"
4. Дождитесь выполнения всех команд

### 1.3 Получение credentials
1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (например: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key
   - **service_role** key (храните в секрете!)

## 🔧 Шаг 2: Настройка Vercel

### 2.1 Подключение репозитория
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий `WeareHouse`

### 2.2 Настройка переменных окружения
В Vercel добавьте следующие переменные:

**Frontend переменные:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend переменные:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 2.3 Настройка сборки
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔧 Шаг 3: Деплой

### 3.1 Первый деплой
1. Нажмите "Deploy" в Vercel
2. Дождитесь завершения сборки
3. Проверьте, что приложение работает

### 3.2 Настройка домена (опционально)
1. В Vercel перейдите в **Settings** → **Domains**
2. Добавьте ваш домен
3. Настройте DNS записи

## 🔧 Шаг 4: Тестирование

### 4.1 Проверка frontend
1. Откройте ваше приложение в браузере
2. Проверьте, что все страницы загружаются
3. Проверьте работу аутентификации

### 4.2 Проверка backend
1. Проверьте API endpoints
2. Проверьте работу с базой данных
3. Проверьте логи в Vercel

## 🔧 Шаг 5: Мониторинг и поддержка

### 5.1 Vercel Analytics
- Включите **Analytics** для отслеживания производительности
- Настройте **Speed Insights** для мониторинга скорости

### 5.2 Supabase Monitoring
- Отслеживайте использование базы данных
- Мониторьте API запросы
- Проверяйте логи аутентификации

## 🚨 Решение проблем

### Проблема: "Missing Supabase environment variables"
**Решение**: Проверьте, что все переменные окружения добавлены в Vercel

### Проблема: "Database connection failed"
**Решение**: Проверьте credentials Supabase и настройки RLS

### Проблема: "CORS error"
**Решение**: Убедитесь, что `CORS_ORIGIN` правильно настроен

### Проблема: "Build failed"
**Решение**: Проверьте логи сборки в Vercel, убедитесь что все зависимости установлены

## 💰 Стоимость

### Supabase (бесплатный план)
- **База данных**: 500MB
- **Трафик**: 2GB/мес
- **API запросы**: 50,000/мес
- **Аутентификация**: 50,000/мес

### Vercel (бесплатный план)
- **Хостинг**: 100GB/мес
- **Serverless функции**: 100GB/мес
- **Домены**: 1 кастомный домен

## 🔄 Автоматический деплой

После настройки, каждый push в `main` ветку будет автоматически деплоить приложение.

## 📞 Поддержка

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/support](https://supabase.com/support)
- **GitHub Issues**: Создайте issue в вашем репозитории

---

🎉 **Поздравляем!** Ваше приложение успешно размещено на Vercel + Supabase!
