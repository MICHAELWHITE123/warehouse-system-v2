#!/bin/bash

# Скрипт для деплоя Supabase Edge Function синхронизации
# Использование: ./deploy-supabase-sync.sh

set -e

echo "🚀 Деплой Supabase Edge Function для синхронизации..."

# Проверяем наличие Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI не установлен. Установите его:"
    echo "npm install -g supabase"
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f ".env.local" ]; then
    echo "⚠️  Файл .env.local не найден. Создаю из примера..."
    if [ -f "env.example" ]; then
        cp env.example .env.local
        echo "✅ Файл .env.local создан из env.example"
        echo "⚠️  Отредактируйте .env.local и добавьте ваши Supabase ключи"
        exit 1
    else
        echo "❌ Файл env.example не найден"
        exit 1
    fi
fi

# Загружаем переменные окружения
source .env.local

# Проверяем наличие необходимых переменных
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Необходимые переменные окружения не установлены в .env.local:"
    echo "   VITE_SUPABASE_URL"
    echo "   VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✅ Переменные окружения загружены"
echo "   Supabase URL: $VITE_SUPABASE_URL"

# Проверяем подключение к Supabase
echo "🔍 Проверяем подключение к Supabase..."
if ! supabase status &> /dev/null; then
    echo "❌ Не удалось подключиться к Supabase"
    echo "   Убедитесь что вы залогинены: supabase login"
    exit 1
fi

echo "✅ Подключение к Supabase установлено"

# Создаем директорию для функции если её нет
if [ ! -d "supabase/functions/sync" ]; then
    echo "📁 Создаю директорию для функции синхронизации..."
    mkdir -p supabase/functions/sync
fi

# Копируем функцию синхронизации
echo "📝 Копирую функцию синхронизации..."
cp supabase/functions/sync/index.ts supabase/functions/sync/index.ts.bak 2>/dev/null || true

# Проверяем что функция существует
if [ ! -f "supabase/functions/sync/index.ts" ]; then
    echo "❌ Файл функции синхронизации не найден: supabase/functions/sync/index.ts"
    exit 1
fi

echo "✅ Функция синхронизации найдена"

# Деплоим функцию
echo "🚀 Деплою функцию синхронизации..."
cd supabase

# Проверяем что мы в правильной директории
if [ ! -f "config.toml" ]; then
    echo "❌ Файл config.toml не найден. Убедитесь что вы в корне проекта"
    exit 1
fi

# Деплоим функцию
echo "📤 Загружаю функцию на Supabase..."
supabase functions deploy sync --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Функция синхронизации успешно задеплоена!"
else
    echo "❌ Ошибка при деплое функции"
    exit 1
fi

# Возвращаемся в корневую директорию
cd ..

# Проверяем статус
echo "🔍 Проверяем статус деплоя..."
supabase functions list

echo ""
echo "🎉 Деплой завершен успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Примените SQL миграцию в Supabase Dashboard:"
echo "   - Откройте: $VITE_SUPABASE_URL"
echo "   - Перейдите в SQL Editor"
echo "   - Выполните содержимое файла: supabase/migrations/20241230_create_sync_tables.sql"
echo ""
echo "2. Проверьте что функция работает:"
echo "   curl -X POST $VITE_SUPABASE_URL/functions/v1/sync \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer $VITE_SUPABASE_ANON_KEY' \\"
echo "     -d '{\"operations\":[], \"deviceId\": \"test\"}'"
echo ""
echo "3. Перезапустите приложение для использования новой синхронизации"
echo ""
echo "🔗 Документация: https://supabase.com/docs/guides/functions"
