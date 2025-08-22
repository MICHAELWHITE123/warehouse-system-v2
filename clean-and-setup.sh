#!/bin/bash

echo "🧹 Очистка и настройка WeareHouse для продакшн..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js не установлен. Установите Node.js 18+ и попробуйте снова."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Требуется Node.js версии 18+. Текущая версия: $(node -v)"
    exit 1
fi

print_status "Node.js версии $(node -v) найден"

# Очистка тестовых файлов
echo "🧹 Удаление тестовых файлов..."

# Удаление тестовых данных
if [ -f "src/data/mockData.ts" ]; then
    rm "src/data/mockData.ts"
    print_status "Удален файл mockData.ts"
fi

# Удаление тестовых миграций
if [ -f "server/src/database/migrations/002_seed_data_sqlite.sql" ]; then
    rm "server/src/database/migrations/002_seed_data_sqlite.sql"
    print_status "Удалена тестовая миграция seed_data_sqlite.sql"
fi

if [ -f "server/src/database/migrations/002_seed_data.sql" ]; then
    rm "server/src/database/migrations/002_seed_data.sql"
    print_status "Удалена тестовая миграция seed_data.sql"
fi

# Удаление тестовых баз данных
if [ -f "server/warehouse.db" ]; then
    rm "server/warehouse.db"
    print_status "Удалена тестовая база данных warehouse.db"
fi

if [ -f "server/server.log" ]; then
    rm "server/server.log"
    print_status "Удален лог файл server.log"
fi

if [ -f "server/test-api.sh" ]; then
    rm "server/test-api.sh"
    print_status "Удален тестовый скрипт test-api.sh"
fi

# Удаление тестовой документации
if [ -f "DEBUG_INSTRUCTIONS.md" ]; then
    rm "DEBUG_INSTRUCTIONS.md"
    print_status "Удален файл DEBUG_INSTRUCTIONS.md"
fi

print_status "Очистка тестовых файлов завершена"

# Установка зависимостей
echo "📦 Установка зависимостей..."

# Клиентская часть
print_status "Установка зависимостей клиентской части..."
npm install

# Серверная часть
print_status "Установка зависимостей серверной части..."
cd server
npm install
cd ..

print_status "Зависимости установлены"

# Настройка сервера
echo "🔧 Настройка сервера..."

cd server

# Создание .env файла если не существует
if [ ! -f ".env" ]; then
    print_status "Создание .env файла..."
    cp env.example .env
    print_warning "Отредактируйте .env файл перед запуском!"
fi

# Сборка сервера
print_status "Сборка сервера..."
npm run build

# Инициализация базы данных
print_status "Инициализация базы данных..."
npm run migrate

cd ..

print_status "Сервер настроен"

# Финальная проверка
echo "🔍 Финальная проверка..."

# Проверка наличия основных файлов
if [ -f "src/components/AuthForm.tsx" ] && [ -f "server/src/index.js" ]; then
    print_status "Основные файлы на месте"
else
    print_error "Проблема с основными файлами"
    exit 1
fi

# Проверка базы данных
if [ -f "server/warehouse.db" ]; then
    print_status "База данных создана"
else
    print_error "База данных не создана"
    exit 1
fi

echo ""
echo "🎉 Система WeareHouse успешно очищена и настроена для продакшн!"
echo ""
echo "🔐 Админ пользователь: Qstrem / QstreamPro2023"
echo "🚀 Запуск клиента: npm run dev"
echo "🚀 Запуск сервера: cd server && npm run dev"
echo ""
echo "📚 Документация:"
echo "   - Быстрый старт: QUICK_START.md"
echo "   - Полная настройка: PRODUCTION_SETUP.md"
echo "   - Сервер: server/README.md"
echo ""
print_status "Готово к работе!"
