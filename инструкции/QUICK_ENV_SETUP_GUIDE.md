# ⚡ Быстрая настройка Environment Variables - Шаг 2

## 🎯 **Цель**: Настроить переменные окружения для Vercel + Supabase за 5 минут

---

## 📋 **Что нужно сделать:**

### **Шаг 2.1: Получить ключи из Supabase** ⏱️ 2 минуты

1. Откройте https://supabase.com и войдите в аккаунт
2. Выберите ваш проект (или создайте новый)
3. **Settings** → **API** 
4. Скопируйте эти значения:

```bash
# Project URL
https://xyzabcdef.supabase.co

# anon public key  
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# service_role key (СЕКРЕТНЫЙ!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **Шаг 2.2: Создать локальный .env.local** ⏱️ 1 минута

```bash
# В корне проекта WeareHouse создайте файл .env.local
cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://ВАШ_PROJECT_URL.supabase.co
VITE_SUPABASE_ANON_KEY=ВАШ_ANON_KEY

# App Configuration
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3000/api

# Server-side (для API functions)
SUPABASE_URL=https://ВАШ_PROJECT_URL.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ВАШ_SERVICE_ROLE_KEY
EOF
```

⚠️ **Замените** `ВАШ_PROJECT_URL`, `ВАШ_ANON_KEY`, `ВАШ_SERVICE_ROLE_KEY` на реальные значения!

---

### **Шаг 2.3: Добавить переменные в Vercel Dashboard** ⏱️ 2 минуты

1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект WeareHouse
3. **Settings** → **Environment Variables**
4. Добавьте **4 переменные**:

#### **Переменная 1:**
```
Key: VITE_SUPABASE_URL
Value: https://ВАШ_PROJECT_URL.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### **Переменная 2:**
```
Key: VITE_SUPABASE_ANON_KEY  
Value: ВАШ_ANON_KEY
Environments: ✅ Production ✅ Preview ✅ Development
```

#### **Переменная 3:**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: ВАШ_SERVICE_ROLE_KEY
Environments: ✅ Production ✅ Preview ✅ Development
```

#### **Переменная 4:**
```
Key: VITE_APP_NAME
Value: Система учета техники на складе
Environments: ✅ Production ✅ Preview ✅ Development
```

---

## ✅ **Проверка настройки**

### **Локальная проверка:**
```bash
npm run dev
# Откройте http://localhost:5173
# В browser console проверьте:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

### **Тест Supabase подключения:**
Откройте файл `test-supabase-realtime.html` в браузере и протестируйте подключение.

---

## 🎉 **Готово! Переходим к Шагу 3**

Если всё работает локально, можете переходить к **Шагу 3: Деплой на Vercel**:

```bash
# Если CLI работает:
npx vercel --prod

# Или через GitHub:
git add .
git commit -m "Add environment variables setup"
git push origin main
# (Auto-deploy через Vercel GitHub integration)
```

---

## 🆘 **Если что-то не работает**

### **Проблема: Переменные не загружаются**
1. Убедитесь что файл `.env.local` в корне проекта
2. Перезапустите `npm run dev`
3. Проверьте что в названиях нет опечаток

### **Проблема: "Missing Supabase environment variables"**
1. Проверьте что ключи скопированы правильно (без лишних пробелов)
2. Убедитесь что используете `anon public` key, а не `service_role` для клиента

### **Нужна помощь?**
Читайте подробные руководства:
- `VERCEL_ENV_DETAILED_SETUP.md` - полное руководство
- `VERCEL_ENV_ALTERNATIVE_SETUP.md` - альтернативные способы

---

**🚀 Результат**: Environment Variables настроены и готовы для production деплоя с Supabase Realtime!
