# 🔧 Подробная настройка Environment Variables в Vercel

## 📋 Шаг 2: Environment Variables - Детальное руководство

### **2.1 Получение ключей из Supabase**

#### **Шаг 2.1.1: Переход в Supabase Dashboard**
1. Откройте https://supabase.com
2. Войдите в ваш аккаунт
3. Выберите ваш проект или создайте новый:
   ```
   New Project → 
   Organization: [выберите организацию]
   Name: warehouse-system
   Database Password: [создайте надежный пароль]
   Region: [выберите ближайший регион]
   Pricing Plan: Free (для начала)
   ```

#### **Шаг 2.1.2: Получение API credentials**
1. В левом меню: **Settings** → **API**
2. Скопируйте следующие значения:

```bash
# Project URL (выглядит как)
https://xyzabcdef.supabase.co

# API Keys
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **ВАЖНО**: `service_role` ключ имеет полные права доступа к БД. Никогда не используйте его в клиентском коде!

---

### **2.2 Настройка переменных в Vercel Dashboard**

#### **Шаг 2.2.1: Переход в настройки Vercel**
1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект WeareHouse
3. Перейдите в **Settings** → **Environment Variables**

#### **Шаг 2.2.2: Добавление переменных по одной**

**Для клиентской части (VITE_ переменные):**

1. **VITE_SUPABASE_URL**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://xyzabcdef.supabase.co
   Environment: Production, Preview, Development (все)
   ```

2. **VITE_SUPABASE_ANON_KEY**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon public key)
   Environment: Production, Preview, Development (все)
   ```

3. **VITE_APP_NAME**
   ```
   Key: VITE_APP_NAME
   Value: Система учета техники на складе
   Environment: Production, Preview, Development (все)
   ```

**Для серверной части (API functions):**

4. **SUPABASE_URL**
   ```
   Key: SUPABASE_URL
   Value: https://xyzabcdef.supabase.co
   Environment: Production, Preview, Development (все)
   ```

5. **SUPABASE_SERVICE_ROLE_KEY**
   ```
   Key: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
   Environment: Production, Preview, Development (все)
   ```

---

### **2.3 Автоматическая настройка через Vercel CLI**

Если у вас установлен Vercel CLI, можно настроить переменные быстрее:

```bash
# Устанавливаем Vercel CLI (если еще не установлен)
npm i -g vercel

# Логинимся
vercel login

# Переходим в папку проекта
cd /Users/ml/Documents/WeareHouse

# Добавляем переменные одной командой
vercel env add VITE_SUPABASE_URL production
# Вводим значение: https://xyzabcdef.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Вводим значение: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Вводим значение: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Копируем переменные на все environments
vercel env pull .env.local
```

---

### **2.4 Создание локальных env файлов**

Для локальной разработки создайте файлы с переменными:

#### **Шаг 2.4.1: Корневой .env.local**
```bash
# Создаем файл в корне проекта
touch .env.local
```

Содержимое `.env.local`:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xyzabcdef.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration  
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3000/api

# Server-side (для API functions)
SUPABASE_URL=https://xyzabcdef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Шаг 2.4.2: Проверяем .gitignore**
Убедитесь что `.env.local` добавлен в `.gitignore`:
```gitignore
# Environment files
.env.local
.env.production
.env*.local

# Vercel
.vercel
```

---

### **2.5 Проверка настройки переменных**

#### **Шаг 2.5.1: Локальная проверка**
```bash
# В корне проекта
npm run dev

# Открываем браузер console
# Проверяем что переменные доступны
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
// Должно показать ваш URL
```

#### **Шаг 2.5.2: Проверка в Vercel**
```bash
# Деплоим с проверкой
vercel --prod

# Проверяем логи функций
vercel logs --follow
```

Или в Vercel Dashboard:
1. **Functions** → выберите функцию → **View Logs**
2. **Deployments** → последний деплой → **View Function Logs**

---

### **2.6 Дополнительные переменные (опционально)**

Для расширенной конфигурации можете добавить:

```env
# Настройки Realtime
VITE_REALTIME_EVENTS_PER_SECOND=10
VITE_REALTIME_HEARTBEAT_INTERVAL=30000

# Настройки безопасности
VITE_ENABLE_DEVELOPMENT_LOGS=false

# Настройки UI
VITE_THEME=light
VITE_DEFAULT_LANGUAGE=ru

# Мониторинг (если используете)
VITE_SENTRY_DSN=https://...
VITE_ANALYTICS_ID=G-...
```

---

### **2.7 Troubleshooting Environment Variables**

#### **Проблема: Переменные не загружаются**
```bash
# Проверяем что переменные добавлены в Vercel
vercel env ls

# Должно показать список всех переменных
```

#### **Проблема: "Missing Supabase environment variables"**
1. Проверьте что названия переменных точно совпадают
2. Перезапустите development сервер
3. Проверьте что используете правильный анon key (не service_role в клиенте!)

#### **Проблема: API функции не работают**
```bash
# Проверяем логи функций
vercel logs --follow

# Проверяем что SUPABASE_SERVICE_ROLE_KEY установлен
# В коде API функции добавьте:
console.log('Service key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
```

---

### **2.8 Безопасность переменных окружения**

#### **Что можно публиковать (VITE_ переменные):**
✅ `VITE_SUPABASE_URL` - публичный URL
✅ `VITE_SUPABASE_ANON_KEY` - публичный ключ (с RLS защитой)
✅ `VITE_APP_NAME` - название приложения

#### **Что НИКОГДА не публиковать:**
❌ `SUPABASE_SERVICE_ROLE_KEY` - только для серверных функций
❌ `JWT_SECRET` - секретный ключ для токенов
❌ `DATABASE_PASSWORD` - пароли базы данных

#### **Row Level Security (RLS)**
Убедитесь что в Supabase включен RLS для всех таблиц:
```sql
-- Включаем RLS для таблицы equipment
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Создаем политику доступа
CREATE POLICY "Users can view equipment" ON equipment
  FOR SELECT TO authenticated USING (true);
```

---

### **2.9 Мониторинг переменных**

Создайте простую функцию для проверки конфигурации:

```typescript
// utils/config-check.ts
export function checkConfiguration() {
  const requiredEnvVars = {
    'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  const missing = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    return false;
  }

  console.log('✅ All environment variables configured');
  return true;
}
```

Используйте в `main.tsx`:
```typescript
import { checkConfiguration } from './utils/config-check';

if (!checkConfiguration()) {
  console.error('Please configure environment variables');
}
```

---

### **2.10 Чек-лист Environment Variables**

#### ✅ **Перед deployment**
- [ ] Получены все ключи из Supabase Dashboard
- [ ] Переменные добавлены в Vercel (Production, Preview, Development)
- [ ] Создан локальный `.env.local` файл
- [ ] `.env.local` добавлен в `.gitignore`
- [ ] Протестировано подключение к Supabase локально

#### ✅ **После deployment**
- [ ] Проверены логи Vercel Functions
- [ ] Протестировано подключение к Supabase на production
- [ ] Работает Realtime синхронизация
- [ ] API endpoints отвечают корректно

---

**Готово!** Теперь ваше приложение правильно настроено для работы с Supabase в production среде Vercel. 🚀
