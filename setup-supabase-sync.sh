#!/bin/bash

# Скрипт для настройки Supabase синхронизации
echo "🚀 Настройка Supabase синхронизации для WeareHouse"

# Проверяем наличие необходимых файлов
if [ ! -f "env.production" ]; then
    echo "❌ Файл env.production не найден"
    exit 1
fi

echo "📝 Обновление переменных окружения..."

# Запрашиваем данные Supabase
read -p "Введите URL вашего Supabase проекта (например: https://abcdefgh.supabase.co): " SUPABASE_URL
read -p "Введите Anon Key вашего Supabase проекта: " SUPABASE_ANON_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ URL и Anon Key не могут быть пустыми"
    exit 1
fi

# Обновляем env.production
sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" env.production
sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" env.production
sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$SUPABASE_URL|" env.production

# Удаляем backup файл
rm env.production.bak

echo "✅ Переменные окружения обновлены"

# Создаем инструкцию для Vercel
echo "📋 Следующие переменные окружения нужно добавить в Vercel:"
echo ""
echo "VITE_SUPABASE_URL=$SUPABASE_URL"
echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
echo "VITE_API_URL=$SUPABASE_URL"
echo ""

echo "🔧 Теперь выполните следующие шаги:"
echo "1. Перейдите в настройки вашего проекта на Vercel"
echo "2. Добавьте переменные окружения выше"
echo "3. Перезапустите деплой"
echo "4. Выполните SQL скрипты из supabase_setup.sql в Supabase SQL Editor"
echo ""

echo "📖 Подробная инструкция находится в файле SUPABASE_SYNC_SETUP.md"
echo "🎯 После настройки синхронизация между устройствами должна заработать!"
