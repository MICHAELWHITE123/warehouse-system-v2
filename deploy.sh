#!/bin/bash

# Скрипт для деплоя Warehouse Management System
# Автор: AI Assistant
# Дата: $(date)

set -e  # Остановка при ошибке

echo "🚀 Начинаем деплой Warehouse Management System..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Проверка зависимостей
check_dependencies() {
    log "Проверяем зависимости..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js не установлен. Установите Node.js 18+"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm не установлен"
    fi
    
    if ! command -v git &> /dev/null; then
        error "git не установлен"
    fi
    
    log "✅ Все зависимости установлены"
}

# Установка зависимостей
install_dependencies() {
    log "Устанавливаем зависимости..."
    
    # Установка зависимостей фронтенда
    log "Устанавливаем зависимости фронтенда..."
    npm install
    
    # Установка зависимостей сервера
    log "Устанавливаем зависимости сервера..."
    cd server
    npm install
    cd ..
    
    log "✅ Зависимости установлены"
}

# Проверка переменных окружения
check_env_vars() {
    log "Проверяем переменные окружения..."
    
    # Проверяем наличие .env файлов
    if [ ! -f ".env" ]; then
        warn "Файл .env не найден. Создайте его на основе env.example"
    fi
    
    if [ ! -f "server/.env" ]; then
        warn "Файл server/.env не найден. Создайте его на основе server/env.example"
    fi
    
    log "✅ Проверка переменных окружения завершена"
}

# Сборка проекта
build_project() {
    log "Собираем проект..."
    
    # Сборка фронтенда
    log "Собираем фронтенд..."
    npm run build
    
    # Сборка сервера
    log "Собираем сервер..."
    cd server
    npm run build
    cd ..
    
    log "✅ Проект собран"
}

# Проверка сборки
test_build() {
    log "Тестируем сборку..."
    
    # Проверяем наличие dist папки
    if [ ! -d "dist" ]; then
        error "Папка dist не найдена после сборки"
    fi
    
    # Проверяем наличие server/dist папки
    if [ ! -d "server/dist" ]; then
        error "Папка server/dist не найдена после сборки"
    fi
    
    log "✅ Сборка прошла успешно"
}

# Проверка Git статуса
check_git_status() {
    log "Проверяем Git статус..."
    
    if [ -n "$(git status --porcelain)" ]; then
        warn "Есть незакоммиченные изменения"
        echo "Незакоммиченные файлы:"
        git status --porcelain
        read -p "Продолжить деплой? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Деплой отменен"
            exit 0
        fi
    else
        log "✅ Все изменения закоммичены"
    fi
}

# Проверка подключения к Supabase
check_supabase() {
    log "Проверяем подключение к Supabase..."
    
    # Проверяем наличие переменных Supabase
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        warn "Переменные Supabase не настроены"
        echo "Убедитесь, что в .env файле указаны:"
        echo "- VITE_SUPABASE_URL"
        echo "- VITE_SUPABASE_ANON_KEY"
    else
        log "✅ Переменные Supabase настроены"
    fi
}

# Основная функция деплоя
main() {
    log "Начинаем процесс деплоя..."
    
    # Проверяем зависимости
    check_dependencies
    
    # Проверяем Git статус
    check_git_status
    
    # Проверяем переменные окружения
    check_env_vars
    
    # Проверяем Supabase
    check_supabase
    
    # Устанавливаем зависимости
    install_dependencies
    
    # Собираем проект
    build_project
    
    # Тестируем сборку
    test_build
    
    log "🎉 Деплой готов!"
    log ""
    log "Следующие шаги:"
    log "1. Зайдите на vercel.com и создайте новый проект"
    log "2. Подключите ваш GitHub репозиторий"
    log "3. Настройте переменные окружения в Vercel"
    log "4. Выполните деплой"
    log ""
    log "Подробные инструкции см. в файле DEPLOYMENT_GUIDE.md"
}

# Запуск основной функции
main "$@"
