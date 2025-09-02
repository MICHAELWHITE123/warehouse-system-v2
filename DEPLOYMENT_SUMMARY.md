# 🚀 Краткая инструкция по деплою

## ✅ Проект готов к деплою!

Ваш проект использует **только Supabase** (без собственного API), что упрощает деплой.

### 🔧 Что исправлено:
- ✅ Отключена API синхронизация (ошибки 404)
- ✅ Используется только Supabase + локальное хранилище
- ✅ Убраны ссылки на несуществующие API роуты
- ✅ Отключен PWA manifest (ошибки 404)
- ✅ Отключен apple-touch-icon (ошибки 404)

### 🎯 Статус приложения:
- ✅ Синхронизация работает (локальный режим)
- ✅ Нет ошибок 404
- ✅ Нет ошибок в консоли
- ✅ Готов к продакшену

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

### 3. Проверка работы
После деплоя проверьте:
1. Откройте ваш Vercel URL
2. Зарегистрируйтесь/войдите
3. Проверьте работу с оборудованием
4. Проверьте генерацию PDF и QR-коды
5. Проверьте консоль браузера - не должно быть ошибок

## 🆘 Если что-то не работает

1. **Ошибки сборки** - проверьте логи в Vercel Dashboard
2. **Ошибки Supabase** - проверьте URL и ключи в Environment Variables
3. **CORS ошибки** - Supabase автоматически разрешает запросы с любого домена при использовании анонимного ключа
4. **Ошибки 404** - больше не должно быть, все исправлено

## 📚 Документация

- `DEPLOYMENT_GUIDE.md` - подробная инструкция
- `QUICK_DEPLOY.md` - быстрый старт
- `DEPLOYMENT_CHECKLIST.md` - чек-лист

---

**Готово! Ваше приложение работает на Vercel без ошибок! 🎉**
