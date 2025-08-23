# 🚀 Быстрый деплой на Vercel

## ⚡ Суперкраткая инструкция

### 1. Создайте KV базу данных в Vercel
1. Перейдите в https://vercel.com/dashboard
2. Storage → Create Database → KV → Назовите `warehouse-sync`
3. Скопируйте `KV_REST_API_URL` и `KV_REST_API_TOKEN`

### 2. Загрузите проект на GitHub
```bash
git add .
git commit -m "Add Vercel sync support"
git push
```

### 3. Подключите к Vercel
1. https://vercel.com/new
2. Import Git Repository → Выберите ваш репозиторий
3. Environment Variables → Добавьте:
   - `KV_REST_API_URL` = ваш KV URL
   - `KV_REST_API_TOKEN` = ваш KV токен

### 4. Деплой
Нажмите **Deploy** - всё готово!

## ✅ Проверка
- Откройте `https://your-app.vercel.app`
- Создайте оборудование
- Откройте сайт с телефона - должно синхронизироваться

## 🎯 Результат
✅ Полная синхронизация между всеми устройствами  
✅ Работает на телефонах, планшетах, компьютерах  
✅ Данные сохраняются в облаке  
✅ Работает без интернета (локально)  

**Готово за 5 минут!** 🚀
