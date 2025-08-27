#!/bin/bash

# 🚀 Автоматическая настройка Environment Variables для Vercel + Supabase
# Этот скрипт поможет настроить все необходимые переменные окружения

echo "🚀 Настройка Environment Variables для WeareHouse"
echo "================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода цветного текста
print_color() {
    printf "${1}${2}${NC}\n"
}

# Функция для выполнения команд Vercel
vercel_cmd() {
    npx vercel "$@"
}

# Проверяем работу Vercel CLI через npx
print_color $BLUE "🔍 Проверяем Vercel CLI..."
if vercel_cmd --version &> /dev/null; then
    print_color $GREEN "✅ Vercel CLI доступен через npx"
else
    print_color $RED "❌ Не удается запустить Vercel CLI"
    print_color $YELLOW "Попробуйте обновить Node.js или npm"
    exit 1
fi

# Проверяем авторизацию в Vercel
print_color $BLUE "🔍 Проверяем авторизацию в Vercel..."
if ! vercel_cmd whoami &> /dev/null; then
    print_color $YELLOW "Необходимо войти в Vercel..."
    vercel_cmd login
fi

print_color $GREEN "✅ Вы авторизованы в Vercel"

# Получаем данные от пользователя
echo ""
print_color $BLUE "📝 Введите данные вашего Supabase проекта:"
echo ""

read -p "Supabase Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY

# Валидация введенных данных
if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_KEY" ]]; then
    print_color $RED "❌ Все поля обязательны для заполнения"
    exit 1
fi

# Проверяем формат URL
if [[ ! "$SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
    print_color $RED "❌ Неверный формат Supabase URL"
    print_color $YELLOW "Должен быть в формате: https://xxx.supabase.co"
    exit 1
fi

echo ""
print_color $BLUE "🔧 Настраиваем переменные окружения..."

# Функция для добавления переменной в Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    local environments=${3:-"production,preview,development"}
    
    print_color $YELLOW "Добавляем $key..."
    
    # Удаляем существующую переменную если есть
    vercel_cmd env rm $key production --yes 2>/dev/null || true
    vercel_cmd env rm $key preview --yes 2>/dev/null || true
    vercel_cmd env rm $key development --yes 2>/dev/null || true
    
    # Добавляем новую переменную
    echo "$value" | vercel_cmd env add $key production
    echo "$value" | vercel_cmd env add $key preview  
    echo "$value" | vercel_cmd env add $key development
    
    if [ $? -eq 0 ]; then
        print_color $GREEN "✅ $key добавлен"
    else
        print_color $RED "❌ Ошибка добавления $key"
        return 1
    fi
}

# Добавляем переменные
print_color $BLUE "Добавляем клиентские переменные (VITE_)..."
add_vercel_env "VITE_SUPABASE_URL" "$SUPABASE_URL"
add_vercel_env "VITE_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"
add_vercel_env "VITE_APP_NAME" "Система учета техники на складе"

print_color $BLUE "Добавляем серверные переменные..."
add_vercel_env "SUPABASE_URL" "$SUPABASE_URL"
add_vercel_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY"

# Создаем локальный .env.local файл
print_color $BLUE "📄 Создаем локальный .env.local файл..."

cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# App Configuration
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3000/api

# Server-side (для API functions)
SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
EOF

print_color $GREEN "✅ Файл .env.local создан"

# Проверяем .gitignore
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    print_color $YELLOW "Добавляем .env.local в .gitignore..."
    echo "" >> .gitignore
    echo "# Environment files" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env*.local" >> .gitignore
    print_color $GREEN "✅ .gitignore обновлен"
fi

# Проверяем настройку
echo ""
print_color $BLUE "🔍 Проверяем настройку переменных..."
vercel_cmd env ls

echo ""
print_color $GREEN "🎉 Настройка завершена!"
echo ""
print_color $BLUE "📋 Что дальше:"
echo "1. Выполните: npm run dev (для локальной разработки)"
echo "2. Выполните: vercel --prod (для деплоя в production)"
echo "3. Откройте test-supabase-realtime.html для тестирования"
echo ""
print_color $YELLOW "💡 Полезные команды:"
echo "npx vercel env ls           - просмотр всех переменных"
echo "npx vercel env pull         - скачивание переменных локально"
echo "npx vercel logs --follow    - просмотр логов в реальном времени"
echo ""

# Предлагаем запустить тест
read -p "Хотите запустить тест подключения к Supabase? (y/n): " test_connection

if [[ "$test_connection" =~ ^[Yy]$ ]]; then
    print_color $BLUE "🧪 Запускаем тест подключения..."
    
    # Создаем временный тестовый файл
    cat > test-connection.js << EOF
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '$SUPABASE_URL',
  process.env.VITE_SUPABASE_ANON_KEY || '$SUPABASE_ANON_KEY'
);

async function testConnection() {
  try {
    console.log('🔗 Тестируем подключение к Supabase...');
    
    const { data, error } = await supabase
      .from('equipment')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Ошибка подключения:', error.message);
    } else {
      console.log('✅ Подключение успешно! Записей в equipment:', data);
    }
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
  }
}

testConnection();
EOF

    # Запускаем тест (нужен Node.js с поддержкой ES modules)
    if command -v node &> /dev/null; then
        node test-connection.js 2>/dev/null || print_color $YELLOW "⚠️ Для теста нужно сначала настроить Supabase таблицы"
        rm test-connection.js
    fi
fi

print_color $GREEN "🚀 Готово! Ваш проект настроен для работы с Vercel + Supabase"
