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

if [ $? -ne 0 ]; then
    echo "❌ Ошибка установки зависимостей"
    exit 1
fi

# Проверка переменных окружения
echo "🔍 Проверка переменных окружения..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Файл .env.local не найден. Создаем из env.example..."
    cp env.example .env.local
    echo "📝 Создан файл .env.local из env.example"
    echo "❗ ВАЖНО: Заполните переменные в .env.local перед продолжением!"
    echo ""
    echo "Необходимые переменные:"
    echo "- VITE_SUPABASE_URL"
    echo "- VITE_SUPABASE_ANON_KEY"
    echo "- VITE_API_URL"
    echo ""
    read -p "Нажмите Enter после заполнения переменных..."
fi

# Проверка TypeScript
echo "🔍 Проверка TypeScript..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "❌ Ошибки TypeScript. Исправьте их перед сборкой."
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
echo "📋 Следующие шаги для развертывания:"
echo ""
echo "1. 🌐 SUPABASE:"
echo "   - Создайте проект на https://supabase.com"
echo "   - Выполните миграции из папки supabase/migrations/"
echo "   - Скопируйте URL и anon key из Settings > API"
echo ""
echo "2. 🚀 VERCEL:"
echo "   - Создайте аккаунт на https://vercel.com"
echo "   - Подключите ваш GitHub репозиторий"
echo "   - Настройте переменные окружения:"
echo "     * VITE_SUPABASE_URL"
echo "     * VITE_SUPABASE_ANON_KEY"
echo "     * VITE_API_URL (будет доступен после деплоя)"
echo ""
echo "3. 🔧 ЛОКАЛЬНАЯ РАЗРАБОТКА:"
echo "   - npm run dev (обычный режим)"
echo "   - npm run dev:local (с локальным Supabase)"
echo ""
echo "4. 📊 МОНИТОРИНГ:"
echo "   - Включите аналитику в Vercel"
echo "   - Настройте мониторинг в Supabase"
echo ""
echo "🎉 Готово! Ваше приложение готово к развертыванию"
echo "📖 Подробная инструкция: DEPLOYMENT_GUIDE.md"
