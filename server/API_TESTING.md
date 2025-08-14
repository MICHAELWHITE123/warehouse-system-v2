# 🧪 Тестирование API

## Быстрый тест API

### 1. Проверка статуса сервера
```bash
curl http://localhost:3001/
```
**Ожидаемый ответ:**
```json
{"message":"Warehouse Management System API","version":"1.0.0","status":"running"}
```

### 2. Проверка API endpoints
```bash
curl http://localhost:3001/api/
```
**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "API is working",
  "routes": ["/auth", "/users", "/categories", "/locations", "/equipment", "/stacks", "/shipments", "/statistics"]
}
```

### 3. Health check
```bash
curl http://localhost:3001/health
```
**Ожидаемый ответ:**
```json
{"status":"healthy","database":"connected","timestamp":"2025-08-14T07:48:55.000Z"}
```

## Тестирование аутентификации

### 1. Регистрация пользователя
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "full_name": "Test User"
  }'
```

### 2. Авторизация
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'
```

**Сохраните токен из ответа для дальнейших запросов!**

### 3. Тест защищенного endpoint (с токеном)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3001/api/categories
```

### 4. Тест без токена (должен вернуть 401)
```bash
curl http://localhost:3001/api/categories
```

## Тестирование CRUD операций

### Категории
```bash
# Получить все категории
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/categories

# Создать категорию
curl -X POST http://localhost:3001/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Новая категория", "description": "Описание"}'
```

### Оборудование
```bash
# Получить все оборудование
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/equipment

# Поиск оборудования
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/equipment/search?q=MacBook"
```

### Статистика
```bash
# Общая статистика
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/statistics

# Статистика по оборудованию
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/statistics/equipment

# Статистика по категориям
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/statistics/categories
```

## Автоматический тест-скрипт

Создайте файл `test-api.sh`:

```bash
#!/bin/bash

echo "🧪 Тестирование API..."

# Проверка сервера
echo "1. Проверка статуса сервера..."
curl -s http://localhost:3001/ | grep -q "running" && echo "✅ Сервер работает" || echo "❌ Сервер не отвечает"

# Проверка API
echo "2. Проверка API endpoints..."
curl -s http://localhost:3001/api/ | grep -q "success" && echo "✅ API работает" || echo "❌ API не работает"

# Проверка health
echo "3. Проверка health check..."
curl -s http://localhost:3001/health | grep -q "healthy" && echo "✅ Health OK" || echo "❌ Health failed"

echo "🎉 Тестирование завершено!"
```

Сделайте его исполняемым и запустите:
```bash
chmod +x test-api.sh
./test-api.sh
```
