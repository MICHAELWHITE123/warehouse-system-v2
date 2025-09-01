#!/bin/bash

# Скрипт для применения миграций базы данных WeareHouse
# Дата: 2025-01-01

echo "🚀 Применение миграций базы данных WeareHouse..."

# Проверяем, запущен ли Supabase
if ! supabase status > /dev/null 2>&1; then
    echo "⚠️  Supabase не запущен. Запускаем..."
    supabase start
fi

echo "📋 Применяем миграции..."

# Применяем все миграции
supabase db reset --linked

echo "✅ Миграции применены успешно!"

echo "🔍 Проверяем структуру базы данных..."

# Проверяем созданные таблицы
echo "📊 Созданные таблицы:"
supabase db reset --linked --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" --schema-only

echo ""
echo "🎉 Миграции успешно применены!"
echo ""
echo "📚 Для проверки базы данных используйте:"
echo "   - Supabase Studio: http://127.0.0.1:54323"
echo "   - SQL Editor в Studio для выполнения запросов"
echo ""
echo "🔧 Полезные команды:"
echo "   - supabase status          - статус Supabase"
echo "   - supabase logs            - логи"
echo "   - supabase db reset        - сброс базы"
echo "   - supabase stop            - остановка"

