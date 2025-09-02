# Настройка Redis и Postgres

## Redis (Upstash)

### 1. Создание Redis базы данных на Upstash

1. Перейдите на [https://upstash.com/](https://upstash.com/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новый Redis database:
   - Нажмите "Create Database"
   - Выберите регион (рекомендуется ближайший к вашим пользователям)
   - Выберите план (Free tier подходит для начала)
   - Нажмите "Create"

### 2. Получение учетных данных

После создания базы данных вы получите:
- **REST API URL** - скопируйте в `VITE_UPSTASH_REDIS_REST_URL`
- **REST API Token** - скопируйте в `VITE_UPSTASH_REDIS_REST_TOKEN`

### 3. Настройка переменных окружения

Добавьте в ваш `.env` файл:
```env
VITE_UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_token_here
```

## Postgres (Neon)

### 1. Создание Postgres базы данных на Neon

1. Перейдите на [https://neon.tech/](https://neon.tech/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новый проект:
   - Нажмите "Create Project"
   - Выберите регион
   - Выберите план (Free tier подходит для начала)
   - Нажмите "Create Project"

### 2. Получение connection string

После создания проекта:
1. Перейдите в раздел "Connection Details"
2. Скопируйте connection string
3. Разберите его на компоненты:
   ```
   postgresql://username:password@host/database
   ```

### 3. Настройка переменных окружения

Добавьте в ваш `.env` файл:
```env
VITE_NEON_DATABASE_URL=postgresql://username:password@host/database
VITE_NEON_HOST=your_host_here
VITE_NEON_DATABASE=your_database_name
VITE_NEON_USERNAME=your_username
VITE_NEON_PASSWORD=your_password
```

## Альтернатива: Vercel KV

Если вы используете Vercel, можете использовать Vercel KV вместо Upstash:

### 1. Создание Vercel KV

1. В вашем Vercel проекте перейдите в раздел "Storage"
2. Создайте новый KV database
3. Получите учетные данные

### 2. Настройка переменных окружения

```env
VITE_VERCEL_KV_URL=your_vercel_kv_url
VITE_VERCEL_KV_REST_API_URL=your_vercel_kv_rest_api_url
VITE_VERCEL_KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
VITE_VERCEL_KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_rest_api_read_only_token
```

## Проверка подключения

После настройки всех переменных окружения:

1. Перезапустите приложение
2. Откройте консоль браузера
3. Убедитесь, что нет ошибок подключения к базе данных
4. Проверьте, что данные сохраняются и загружаются корректно

## Приоритет подключений

Приложение использует следующий приоритет:
1. **Redis** (Upstash или Vercel KV) - для кэширования и быстрых операций
2. **Postgres** (Neon) - для постоянного хранения данных
3. **Local Storage** - как fallback, если внешние базы недоступны

## Безопасность

- Никогда не коммитьте реальные учетные данные в Git
- Используйте переменные окружения в production
- Регулярно ротируйте токены доступа
- Используйте read-only токены где это возможно
