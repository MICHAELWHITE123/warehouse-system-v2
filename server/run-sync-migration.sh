#!/bin/bash

# Скрипт для запуска миграции синхронизации

echo "🚀 Запуск миграции синхронизации..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ Ошибка: package.json не найден. Запустите скрипт из директории server/"
    exit 1
fi

# Проверяем, что база данных существует
if [ ! -f "database.sqlite" ]; then
    echo "❌ Ошибка: База данных database.sqlite не найдена"
    echo "Сначала создайте базу данных с помощью init-production-db.sh"
    exit 1
fi

echo "📊 Применение миграции синхронизации..."

# Запускаем миграцию
sqlite3 database.sqlite < src/database/migrations/005_sync_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Миграция синхронизации успешно применена!"
    echo ""
    echo "📋 Созданные таблицы:"
    echo "   - sync_operations - выполненные операции синхронизации"
    echo "   - pending_sync_operations - операции в очереди"
    echo "   - sync_conflicts - конфликты синхронизации"
    echo "   - user_devices - информация об устройствах пользователей"
    echo ""
    echo "🔧 Теперь можно запускать сервер с поддержкой синхронизации:"
    echo "   npm run dev"
else
    echo "❌ Ошибка при применении миграции"
    exit 1
fi
