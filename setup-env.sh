#!/bin/bash

# ========================================
# WeareHouse System - Environment Setup Script
# ========================================
# Этот скрипт помогает быстро настроить переменные окружения

set -e

echo "🚀 Настройка переменных окружения WeareHouse System"
echo "=================================================="

# Функция для выбора окружения
select_environment() {
    echo ""
    echo "Выберите окружение для настройки:"
    echo "1) Development (локальная разработка)"
    echo "2) Production (Vercel)"
    echo "3) Supabase (только Supabase)"
    echo "4) Проверить текущие настройки"
    echo "5) Выход"
    echo ""
    read -p "Введите номер (1-5): " choice
    
    case $choice in
        1) setup_development ;;
        2) setup_production ;;
        3) setup_supabase ;;
        4) check_environment ;;
        5) echo "Выход из скрипта"; exit 0 ;;
        *) echo "Неверный выбор. Попробуйте снова."; select_environment ;;
    esac
}

# Настройка development окружения
setup_development() {
    echo ""
    echo "🔧 Настройка Development окружения..."
    
    # Frontend
    if [ -f "env.development" ]; then
        cp env.development .env.local
        echo "✅ Frontend: env.development скопирован в .env.local"
    else
        echo "❌ Файл env.development не найден"
    fi
    
    # Backend
    if [ -d "server" ] && [ -f "server/env.development" ]; then
        cd server
        cp env.development .env
        echo "✅ Backend: env.development скопирован в .env"
        cd ..
    else
        echo "❌ Папка server или файл env.development не найден"
    fi
    
    echo ""
    echo "🎯 Development окружение настроено!"
    echo "Запустите приложение командой: npm run dev"
    echo "Запустите сервер командой: cd server && npm run dev"
}

# Настройка production окружения
setup_production() {
    echo ""
    echo "🚀 Настройка Production окружения..."
    
    # Frontend
    if [ -f "env.production" ]; then
        cp env.production .env.local
        echo "✅ Frontend: env.production скопирован в .env.local"
    else
        echo "❌ Файл env.production не найден"
    fi
    
    # Backend
    if [ -d "server" ] && [ -f "server/env.production" ]; then
        cd server
        cp env.production .env
        echo "✅ Backend: env.production скопирован в .env"
        cd ..
    else
        echo "❌ Папка server или файл env.production не найден"
    fi
    
    echo ""
    echo "🎯 Production окружение настроено!"
    echo "Для развертывания на Vercel используйте: npm run build"
}

# Настройка Supabase окружения
setup_supabase() {
    echo ""
    echo "🔗 Настройка Supabase окружения..."
    
    # Backend
    if [ -d "server" ] && [ -f "server/env.supabase.example" ]; then
        cd server
        cp env.supabase.example .env
        echo "✅ Backend: env.supabase.example скопирован в .env"
        cd ..
    else
        echo "❌ Папка server или файл env.supabase.example не найден"
    fi
    
    echo ""
    echo "🎯 Supabase окружение настроено!"
    echo "Не забудьте заполнить реальные значения в .env файле"
}

# Проверка текущих настроек
check_environment() {
    echo ""
    echo "🔍 Проверка текущих настроек..."
    
    # Frontend
    if [ -f ".env.local" ]; then
        echo "✅ Frontend: .env.local найден"
        echo "   Содержит переменные:"
        grep -E "^VITE_" .env.local | head -5
        if [ $(grep -c "^VITE_" .env.local) -gt 5 ]; then
            echo "   ... и еще $(($(grep -c "^VITE_" .env.local) - 5)) переменных"
        fi
    else
        echo "❌ Frontend: .env.local не найден"
    fi
    
    # Backend
    if [ -d "server" ] && [ -f "server/.env" ]; then
        echo "✅ Backend: .env найден"
        echo "   Содержит переменные:"
        grep -E "^(NODE_ENV|PORT|SUPABASE|DB_|JWT_)" server/.env | head -5
        if [ $(grep -c "^(NODE_ENV|PORT|SUPABASE|DB_|JWT_)" server/.env) -gt 5 ]; then
            echo "   ... и еще $(($(grep -c "^(NODE_ENV|PORT|SUPABASE|DB_|JWT_)" server/.env) - 5)) переменных"
        fi
    else
        echo "❌ Backend: .env не найден"
    fi
    
    echo ""
    echo "📋 Для изменения настроек выберите пункт 1, 2 или 3"
}

# Основное меню
main() {
    echo ""
    echo "Доступные команды:"
    echo "  npm run env:dev      - Настройка development окружения"
    echo "  npm run env:prod     - Настройка production окружения"
    echo "  npm run env:check    - Проверка переменных окружения"
    echo "  npm run env:reset    - Сброс локальных настроек"
    echo ""
    
    select_environment
}

# Запуск скрипта
main
