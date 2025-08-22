#!/bin/bash

echo "🚀 Инициализация продакшн базы данных WeareHouse..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18+. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js версии $(node -v) найден"

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build

# Запускаем миграции
echo "🗄️ Запуск миграций базы данных..."
npm run migrate

echo "✅ База данных успешно инициализирована!"
echo "🔐 Админ пользователь: Qstream / QstreamPro2023"
echo "🚀 Запуск сервера: npm start"
