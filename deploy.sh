#!/bin/bash

echo "🚀 Развертывание WeareHouse на Vercel и Supabase"

# Проверка наличия необходимых файлов
if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не найден"
    exit 1
fi

if [ ! -f "vercel.json" ]; then
    echo "❌ Файл vercel.json не найден"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Проверка переменных окружения
echo "🔍 Проверка переменных окружения..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Файл .env.local не найден. Скопируйте env.example в .env.local и заполните переменные"
    cp env.example .env.local
    echo "📝 Создан файл .env.local из env.example"
    echo "❗ Заполните переменные в .env.local перед продолжением"
    exit 1
fi

# Сборка проекта
echo "🔨 Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки проекта"
    exit 1
fi

echo "✅ Проект успешно собран"

# Инструкции по развертыванию
echo ""
echo "📋 Следующие шаги:"
echo "1. Создайте проект на https://supabase.com"
echo "2. Выполните миграции из папки supabase/migrations/"
echo "3. Скопируйте URL и anon key из Supabase"
echo "4. Обновите переменные в .env.local"
echo "5. Создайте проект на https://vercel.com"
echo "6. Подключите репозиторий и настройте переменные окружения"
echo "7. Деплойте проект на Vercel"
echo ""
echo "🎉 Готово! Ваше приложение готово к развертыванию"
