#!/bin/bash

echo "🧪 Тестирование API Warehouse Management System..."
echo ""

# Проверка сервера
echo "1. 🔍 Проверка статуса сервера..."
if curl -s http://localhost:3001/ | grep -q "running"; then
    echo "   ✅ Сервер работает"
else
    echo "   ❌ Сервер не отвечает"
    exit 1
fi

# Проверка API
echo "2. 🔍 Проверка API endpoints..."
if curl -s http://localhost:3001/api/ | grep -q "success"; then
    echo "   ✅ API работает"
else
    echo "   ❌ API не работает"
    exit 1
fi

# Проверка health
echo "3. 🔍 Проверка health check..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "   ✅ Health check OK"
else
    echo "   ❌ Health check failed"
    exit 1
fi

# Проверка базы данных
echo "4. 🔍 Проверка подключения к базе данных..."
if curl -s http://localhost:3001/health | grep -q "connected"; then
    echo "   ✅ База данных подключена"
else
    echo "   ❌ Проблемы с базой данных"
    exit 1
fi

# Проверка регистрации (создаем временного пользователя)
echo "5. 🔍 Тестирование регистрации..."
RANDOM_USER="testuser_$(date +%s)"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$RANDOM_USER\",\"email\":\"$RANDOM_USER@example.com\",\"password\":\"TestPass123\",\"full_name\":\"Test User\"}")

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo "   ✅ Регистрация работает"
else
    echo "   ❌ Проблемы с регистрацией"
    echo "   Response: $REGISTER_RESPONSE"
fi

# Проверка авторизации
echo "6. 🔍 Тестирование авторизации..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$RANDOM_USER\",\"password\":\"TestPass123\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "   ✅ Авторизация работает"
    
    # Извлекаем токен
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Проверка защищенного endpoint
    echo "7. 🔍 Тестирование защищенных endpoints..."
    PROTECTED_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/categories)
    
    if echo "$PROTECTED_RESPONSE" | grep -q "data"; then
        echo "   ✅ Защищенные endpoints работают"
    else
        echo "   ❌ Проблемы с защищенными endpoints"
    fi
else
    echo "   ❌ Проблемы с авторизацией"
    echo "   Response: $LOGIN_RESPONSE"
fi

echo ""
echo "🎉 Тестирование API завершено!"
echo "📊 Сервер готов к работе на http://localhost:3001"
