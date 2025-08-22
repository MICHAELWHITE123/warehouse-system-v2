# 🖥️ WeareHouse Server

Серверная часть системы управления складом WeareHouse.

## 🚀 Быстрый запуск

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
```bash
cp env.example .env
# Отредактируйте .env файл
```

### 3. Инициализация базы данных
```bash
# Автоматически
./init-production-db.sh

# Или вручную
npm run build
npm run migrate
```

### 4. Запуск сервера
```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

## 🔧 Доступ к системе

- **Сервер:** http://localhost:3001
- **Админ:** Qstream / QstreamPro2023

## 📁 Структура проекта

```
src/
├── config/           # Конфигурация базы данных
├── controllers/      # Контроллеры API
├── database/         # Миграции и схемы БД
├── middleware/       # Промежуточное ПО
├── models/          # Модели данных
├── routes/          # API маршруты
├── types/           # TypeScript типы
└── utils/           # Утилиты
```

## 🗄️ База данных

Система использует SQLite для продакшн среды:

- **Файл:** `warehouse.db`
- **Миграции:** `src/database/migrations/`
- **Запуск миграций:** `npm run migrate`

## 🔐 Аутентификация

- **JWT токены** для аутентификации
- **bcrypt** для хеширования паролей
- **Middleware** для защиты маршрутов

## 📊 API Endpoints

Подробная документация API находится в [API_ENDPOINTS.md](API_ENDPOINTS.md)

### Основные группы:
- `/auth` - Аутентификация
- `/equipment` - Управление оборудованием
- `/categories` - Категории техники
- `/locations` - Местоположения
- `/shipments` - Отгрузки
- `/stacks` - Стеки оборудования
- `/statistics` - Статистика
- `/users` - Пользователи

## 🛡️ Безопасность

- **Helmet** для защиты заголовков
- **CORS** настройки
- **Rate limiting** (опционально)
- **Валидация** входящих данных

## 📝 Логирование

Логи выводятся в консоль. Для продакшн среды рекомендуется настроить логирование в файл.

## 🔄 Обновление

```bash
# Остановка сервера
# Ctrl+C или kill процесс

# Обновление кода
git pull origin main

# Переустановка зависимостей
npm install

# Пересборка и запуск
npm run build
npm start
```

## 🆘 Устранение неполадок

### Порт занят
```bash
lsof -i :3001
kill -9 <PID>
```

### Проблемы с БД
```bash
rm warehouse.db
npm run migrate
```

### Проблемы с зависимостями
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Документация

- [API Endpoints](API_ENDPOINTS.md)
- [Развертывание](../PRODUCTION_SETUP.md)
- [Быстрый старт](../QUICK_START.md)

---

**Система готова к работе! 🎉**
