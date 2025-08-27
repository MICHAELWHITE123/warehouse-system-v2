# ⚡ Быстрое развертывание WeareHouse в Vercel

## 🎯 За 10 минут к готовому приложению

### Шаг 1: Подготовка (2 мин)
```bash
# Коммит всех изменений
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Шаг 2: Создание базы данных (3 мин)

**Вариант А - Supabase (рекомендуется):**
1. [supabase.com](https://supabase.com) → Create project
2. Скопировать: URL, anon key, service key, database password
3. SQL Editor → выполнить миграции из `server/src/database/migrations/`

**Вариант Б - Vercel KV (проще):**
1. Vercel Dashboard → Storage → Create KV → `warehouse-sync`
2. Скопировать: KV_REST_API_URL, KV_REST_API_TOKEN

### Шаг 3: Deploy Frontend (2 мин)
1. [vercel.com/new](https://vercel.com/new) → Import Git repo
2. **Root Directory**: пустое (корень)
3. **Environment Variables**:
```env
VITE_API_URL=https://your-api.vercel.app/api
# + Supabase или KV переменные (см. ниже)
```
4. Deploy

### Шаг 4: Deploy API (3 мин)
1. [vercel.com/new](https://vercel.com/new) → Import тот же repo
2. **Root Directory**: `server`
3. **Environment Variables**:
```env
NODE_ENV=production
JWT_SECRET=your-32-char-secret-from-openssl-rand-base64-32
# + Database переменные (см. ниже)
```
4. Deploy

### Шаг 5: Связывание проектов
1. Frontend → Settings → Environment Variables
   - Обновить `VITE_API_URL` на реальный URL API
2. API → Settings → Environment Variables  
   - Обновить `CORS_ORIGIN` на реальный URL Frontend

## 📋 Переменные окружения

### Для Frontend проекта:
```env
VITE_API_URL=https://your-api.vercel.app/api

# Если используете Supabase:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Если используете Vercel KV:
VITE_KV_REST_API_URL=https://your-kv.upstash.io
VITE_KV_REST_API_TOKEN=your-kv-token
```

### Для API проекта:
```env
NODE_ENV=production
JWT_SECRET=ваш-секретный-ключ-32-символа
CORS_ORIGIN=https://your-frontend.vercel.app

# Supabase:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Дополнительные настройки БД:
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=true
```

## 🔧 Генерация JWT Secret
```bash
openssl rand -base64 32
```

## ✅ Проверка работы

1. **Frontend**: `https://your-frontend.vercel.app`
   - Интерфейс загружается
   - Нет ошибок в консоли

2. **API**: `https://your-api.vercel.app/api/`
   - Ответ: `{"success": true, "message": "API is working"}`

3. **Функциональность**:
   - Регистрация пользователя работает
   - Создание оборудования работает
   - Синхронизация между устройствами работает

## 🚨 Если что-то не работает

### "API connection failed"
- Проверить `VITE_API_URL` в frontend переменных
- Убедиться что API отвечает на `/api/`

### "CORS error"  
- Добавить frontend URL в `CORS_ORIGIN` API переменных

### "Database error"
- Проверить все database переменные в API
- Убедиться что миграции выполнены в Supabase

### "JWT error"
- Сгенерировать новый `JWT_SECRET` (минимум 32 символа)

## 🎉 Готово!

После успешного развертывания:
- ✅ Приложение работает на `https://your-frontend.vercel.app`
- ✅ API работает на `https://your-api.vercel.app` 
- ✅ Синхронизация между устройствами включена
- ✅ Автоматические деплои при push в main

**Поделитесь ссылкой с командой!** 🚀

---

📚 **Подробные инструкции**: см. `VERCEL_DEPLOYMENT_FULL_GUIDE.md`  
🔧 **Настройка переменных**: см. `VERCEL_ENV_SETUP.md`
