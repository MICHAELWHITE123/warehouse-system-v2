# API Endpoints Documentation

## Аутентификация

### POST /api/auth/login
Авторизация пользователя
```json
{
  "username": "string",
  "password": "string"
}
```

### POST /api/auth/register
Регистрация нового пользователя
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string (optional)",
  "role": "admin|manager|user (optional, default: user)"
}
```

### POST /api/auth/logout
Выход из системы

### GET /api/auth/me
Получение информации о текущем пользователе

### POST /api/auth/refresh
Обновление токена
```json
{
  "token": "string"
}
```

## Пользователи

### GET /api/users
Получить список пользователей (требует роль admin/manager)
- Query parameters: `page`, `limit`, `search`, `role`, `is_active`

### GET /api/users/:id
Получить пользователя по ID

### POST /api/users
Создать нового пользователя (требует роль admin)
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string (optional)",
  "role": "admin|manager|user (optional)"
}
```

### PUT /api/users/:id
Обновить пользователя

### DELETE /api/users/:id
Удалить пользователя (требует роль admin)

## Категории

### GET /api/categories
Получить список категорий
- Query parameters: `page`, `limit`, `search`

### GET /api/categories/:id
Получить категорию по ID

### POST /api/categories
Создать новую категорию (требует роль admin/manager)
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

### PUT /api/categories/:id
Обновить категорию (требует роль admin/manager)

### DELETE /api/categories/:id
Удалить категорию (требует роль admin/manager)

## Местоположения

### GET /api/locations
Получить список местоположений
- Query parameters: `page`, `limit`, `search`

### GET /api/locations/:id
Получить местоположение по ID

### POST /api/locations
Создать новое местоположение (требует роль admin/manager)
```json
{
  "name": "string",
  "description": "string (optional)",
  "address": "string (optional)"
}
```

### PUT /api/locations/:id
Обновить местоположение (требует роль admin/manager)

### DELETE /api/locations/:id
Удалить местоположение (требует роль admin/manager)

## Оборудование

### GET /api/equipment
Получить список оборудования
- Query parameters: `page`, `limit`, `search`, `category_id`, `location_id`, `status`

### GET /api/equipment/search
Поиск оборудования
- Query parameters: `q`, `limit`

### GET /api/equipment/:id
Получить оборудование по ID

### POST /api/equipment
Создать новое оборудование
```json
{
  "name": "string",
  "category_id": "number (optional)",
  "serial_number": "string (optional)",
  "status": "available|in-use|maintenance (optional, default: available)",
  "location_id": "number (optional)",
  "purchase_date": "string (optional)",
  "last_maintenance": "string (optional)",
  "assigned_to": "string (optional)",
  "description": "string (optional)",
  "specifications": "object (optional)"
}
```

### PUT /api/equipment/:id
Обновить оборудование

### DELETE /api/equipment/:id
Удалить оборудование (требует роль admin/manager)

### PATCH /api/equipment/:id/status
Изменить статус оборудования
```json
{
  "status": "available|in-use|maintenance"
}
```

## Стеки оборудования

### GET /api/stacks
Получить список стеков
- Query parameters: `page`, `limit`, `search`, `tags`

### GET /api/stacks/:id
Получить стек по ID с оборудованием

### POST /api/stacks
Создать новый стек
```json
{
  "name": "string",
  "description": "string (optional)",
  "tags": "array of strings (optional)",
  "equipment_ids": "array of numbers (optional)"
}
```

### PUT /api/stacks/:id
Обновить стек

### DELETE /api/stacks/:id
Удалить стек (требует роль admin/manager)

### POST /api/stacks/:id/equipment
Добавить оборудование в стек
```json
{
  "equipment_ids": "array of numbers"
}
```

### DELETE /api/stacks/:id/equipment/:equipmentId
Удалить оборудование из стека

## Отгрузки

### GET /api/shipments
Получить список отгрузок
- Query parameters: `page`, `limit`, `search`, `status`, `date_from`, `date_to`

### GET /api/shipments/:id
Получить отгрузку по ID

### POST /api/shipments
Создать новую отгрузку
```json
{
  "number": "string",
  "date": "string",
  "recipient": "string",
  "recipient_address": "string",
  "responsible_person": "string",
  "status": "preparing|in-transit|delivered|cancelled (optional, default: preparing)",
  "comments": "string (optional)",
  "equipment_items": "array of {equipment_id, quantity} (optional)",
  "stack_items": "array of {stack_id, quantity} (optional)",
  "checklist": "array of {title, description, is_required} (optional)",
  "rental": "array of {equipment_name, quantity, link} (optional)"
}
```

### PUT /api/shipments/:id
Обновить отгрузку

### DELETE /api/shipments/:id
Удалить отгрузку (требует роль admin/manager)

### PATCH /api/shipments/:id/status
Изменить статус отгрузки
```json
{
  "status": "preparing|in-transit|delivered|cancelled"
}
```

### POST /api/shipments/:id/checklist
Добавить пункт в чек-лист
```json
{
  "title": "string",
  "description": "string (optional)",
  "is_required": "boolean (optional, default: true)"
}
```

### PUT /api/shipments/:id/checklist/:itemId
Обновить пункт чек-листа
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "is_completed": "boolean (optional)",
  "is_required": "boolean (optional)",
  "completed_by": "string (optional)"
}
```

### DELETE /api/shipments/:id/checklist/:itemId
Удалить пункт чек-листа

### POST /api/shipments/:id/rental
Добавить аренду в отгрузку
```json
{
  "equipment_name": "string",
  "quantity": "number",
  "link": "string (optional)"
}
```

### PUT /api/shipments/:id/rental/:rentalId
Обновить аренду

### DELETE /api/shipments/:id/rental/:rentalId
Удалить аренду

## Статистика

### GET /api/statistics
Получить общую статистику

### GET /api/statistics/equipment
Статистика по оборудованию
- Query parameters: `period` (days, default: 30)

### GET /api/statistics/shipments
Статистика по отгрузкам
- Query parameters: `period` (days, default: 30)

### GET /api/statistics/categories
Статистика по категориям

### GET /api/statistics/locations
Статистика по местоположениям

## Заголовки аутентификации

Для всех защищенных endpoints необходимо передавать JWT токен в заголовке:
```
Authorization: Bearer <your-jwt-token>
```

## Роли пользователей

- **admin**: Полный доступ ко всем операциям
- **manager**: Доступ к управлению данными (CRUD категорий, местоположений, удаление оборудования и стеков)
- **user**: Базовый доступ (чтение всех данных, создание и редактирование оборудования)

## Ответы API

Все ответы имеют следующую структуру:

### Успешный ответ
```json
{
  "success": true,
  "data": {...},
  "message": "Success message (optional)"
}
```

### Ответ с пагинацией
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Ошибка
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (optional)"
}
```

### Ошибка валидации
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```
