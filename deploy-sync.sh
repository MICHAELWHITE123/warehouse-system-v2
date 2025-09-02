#!/bin/bash

# Скрипт для быстрого развертывания синхронизации Supabase

echo "🚀 Развертывание синхронизации Supabase..."

# Проверяем, установлен ли Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI не установлен. Устанавливаем..."
    npm install -g supabase
fi

# Проверяем, авторизован ли пользователь
if ! supabase projects list &> /dev/null; then
    echo "❌ Не авторизован в Supabase. Выполните: supabase login"
    exit 1
fi

# Запрашиваем Project Reference
echo "📋 Введите Project Reference из Supabase Dashboard (Settings > General):"
read -p "Project Reference: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project Reference не указан"
    exit 1
fi

echo "🔗 Связываем проект..."
supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при связывании проекта"
    exit 1
fi

echo "📦 Развертываем Edge Function..."
supabase functions deploy sync

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при развертывании Edge Function"
    exit 1
fi

echo "🗄️ Применяем миграции базы данных..."
supabase db push

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при применении миграций"
    exit 1
fi

echo "✅ Развертывание завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Проверьте переменные окружения в Vercel Dashboard"
echo "2. Убедитесь, что установлены:"
echo "   - VITE_SUPABASE_URL=https://$PROJECT_REF.supabase.co"
echo "   - VITE_SUPABASE_ANON_KEY=ваш_anon_key"
echo "3. Перезапустите приложение на Vercel"
echo "4. Проверьте работу синхронизации в браузере"
echo ""
echo "🔍 Для проверки логов:"
echo "- Supabase Dashboard > Edge Functions > Logs"
echo "- Supabase Dashboard > Database > Logs"
