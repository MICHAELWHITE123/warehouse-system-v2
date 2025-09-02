# Быстрая настройка Redis и Postgres

## 🚀 Быстрый старт (5 минут)

### 1. Redis (Upstash) - 2 минуты
1. Перейдите на [https://upstash.com/](https://upstash.com/)
2. Нажмите "Create Database"
3. Выберите Free план
4. Скопируйте **REST API URL** и **REST API Token**

### 2. Postgres (Neon) - 3 минуты
1. Перейдите на [https://neon.tech/](https://neon.tech/)
2. Нажмите "Create Project"
3. Выберите Free план
4. Скопируйте connection string

### 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Redis (Upstash)
VITE_UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_token_here

# Postgres (Neon)
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
VITE_NEON_HOST=your_host_here
VITE_NEON_DATABASE=your_database_name
VITE_NEON_USERNAME=your_username
VITE_NEON_PASSWORD=your_password
```

### 4. Проверка

1. Запустите приложение: `npm run dev`
2. Откройте консоль браузера (F12)
3. Убедитесь, что видите сообщения о доступности баз данных

## 🔧 Альтернативы

### Vercel KV (вместо Upstash)
Если используете Vercel:
1. В Vercel Dashboard → Storage → Create KV
2. Используйте переменные `VITE_VERCEL_KV_*`

### Supabase (вместо Neon)
Если используете Supabase:
1. В Supabase Dashboard → Settings → Database
2. Используйте connection string из Supabase

## 🆘 Если что-то не работает

1. **Проверьте переменные окружения** - убедитесь, что они правильно скопированы
2. **Перезапустите приложение** - после изменения переменных окружения
3. **Проверьте консоль браузера** - там будут сообщения об ошибках
4. **Используйте fallback** - приложение автоматически переключится на локальное хранилище

## 📊 Мониторинг

В консоли браузера вы увидите:
```
🔍 Проверка доступности баз данных...
📊 Результаты проверки баз данных:
  Redis: ✅ Доступен
  Postgres: ✅ Доступен
  Local Storage: ✅ Доступен
📈 Всего доступно баз данных: 3/3
✅ Множественные базы данных доступны (оптимальная работа)
```

## 💡 Советы

- **Free планы** подходят для разработки и небольших проектов
- **Регион** выбирайте ближайший к вашим пользователям
- **Backup** - регулярно делайте резервные копии данных
- **Мониторинг** - следите за использованием ресурсов
