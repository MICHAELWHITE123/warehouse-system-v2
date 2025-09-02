# 🚀 Краткая инструкция по деплою

## ✅ Проект готов к деплою!

Ваш проект использует **только Supabase** (без собственного API), что упрощает деплой.

## 📋 Что нужно настроить

### 1. Supabase (2 минуты)
1. Создайте проект на [supabase.com](https://supabase.com)
2. Скопируйте **Project URL** и **anon public key**
3. В SQL Editor выполните миграции из `supabase/migrations/`

### 2. Vercel (3 минуты)
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "New Project"
3. Подключите GitHub: `MICHAELWHITE123/warehouse-system-v2`
4. **Настройте переменные окружения в Vercel Dashboard:**

#### В Vercel Dashboard → Settings → Environment Variables добавьте:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your_anon_key_here` | Production, Preview, Development |
| `VITE_APP_NAME` | `Система учета техники на складе` | Production, Preview, Development |

### 3. CORS в Supabase
В Supabase Dashboard → Settings → API добавьте:
```
https://your-app.vercel.app
```

## ✅ Проверка

1. Откройте ваш Vercel URL
2. Зарегистрируйтесь/войдите
3. Проверьте работу с оборудованием
4. Проверьте генерацию PDF и QR-коды

## 🆘 Если что-то не работает

1. **Ошибки сборки** - проверьте логи в Vercel Dashboard
2. **Ошибки Supabase** - проверьте URL и ключи в Environment Variables
3. **CORS ошибки** - добавьте домен в Supabase CORS

## 📚 Документация

- `DEPLOYMENT_GUIDE.md` - подробная инструкция
- `QUICK_DEPLOY.md` - быстрый старт
- `DEPLOYMENT_CHECKLIST.md` - чек-лист

---

**Готово! Ваше приложение работает на Vercel! 🎉**
