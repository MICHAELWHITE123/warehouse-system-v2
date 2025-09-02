# Warehouse Management System

Система учета техники на складе с современным веб-интерфейсом и API.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd WeareHouse

# Установка зависимостей
npm install
cd server && npm install && cd ..

# Запуск в режиме разработки
npm run dev          # Frontend (порт 5173)
cd server && npm run dev  # Backend (порт 3001)
```

### Деплой на Vercel + Supabase

```bash
# Подготовка к деплою
./deploy.sh

# Следуйте инструкциям в DEPLOYMENT_GUIDE.md
```

## 📋 Функциональность

### 🏢 Управление оборудованием
- Добавление, редактирование, удаление оборудования
- Категоризация и поиск
- Отслеживание местоположения
- QR-коды для быстрой идентификации

### 📦 Управление отгрузками
- Создание отгрузок
- Добавление оборудования в отгрузки
- Отслеживание статуса
- Генерация PDF отчетов

### 📊 Аналитика и отчеты
- Статистика по категориям
- Распределение по локациям
- Экспорт данных
- Аудит изменений

### 👥 Пользователи и права
- Система аутентификации
- Роли пользователей
- Административная панель

## 🛠 Технологии

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик
- **Tailwind CSS** - стили
- **Radix UI** - компоненты
- **React Hook Form** - формы
- **Recharts** - графики

### Backend
- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **TypeScript** - типизация
- **PostgreSQL** - база данных
- **Supabase** - BaaS платформа

### Инфраструктура
- **Vercel** - хостинг и деплой
- **Supabase** - база данных и аутентификация
- **GitHub** - версионный контроль

## 📁 Структура проекта

```
WeareHouse/
├── src/                    # Frontend код
│   ├── components/         # React компоненты
│   ├── hooks/             # Кастомные хуки
│   ├── database/          # Локальная база данных
│   ├── adapters/          # Адаптеры для API
│   └── types/             # TypeScript типы
├── server/                # Backend код
│   ├── src/
│   │   ├── controllers/   # Контроллеры API
│   │   ├── models/        # Модели данных
│   │   ├── routes/        # Маршруты API
│   │   └── config/        # Конфигурация
│   └── database/          # Миграции и схемы
├── dist/                  # Собранный фронтенд
└── docs/                  # Документация
```

## 🔧 Конфигурация

### Переменные окружения

Создайте файлы `.env` на основе примеров:

```bash
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3001/api

# Backend (server/.env)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
```

## 🚀 Деплой

### На Vercel + Supabase

1. **Настройка Supabase**
   - Создайте проект на [supabase.com](https://supabase.com)
   - Выполните миграции из `server/supabase-migrations.sql`
   - Получите ключи API

2. **Настройка Vercel**
   - Подключите GitHub репозиторий
   - Настройте переменные окружения
   - Выполните деплой

Подробные инструкции: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 📚 Документация

- [Руководство по деплою](./DEPLOYMENT_GUIDE.md)
- [API Endpoints](./server/API_ENDPOINTS.md)
- [Тестирование API](./server/API_TESTING.md)
- [Интеграция для разработчиков](./DEVELOPER_INTEGRATION.md)

## 🤝 Разработка

### Команды

```bash
# Разработка
npm run dev              # Запуск фронтенда
cd server && npm run dev # Запуск бэкенда

# Сборка
npm run build            # Сборка фронтенда
cd server && npm run build # Сборка бэкенда

# Линтинг
npm run lint             # Проверка кода

# Тестирование
cd server && npm test    # Тесты API
```

### Структура базы данных

Основные таблицы:
- `users` - пользователи системы
- `categories` - категории оборудования
- `locations` - местоположения
- `equipment` - оборудование
- `shipments` - отгрузки
- `audit_logs` - логи изменений

## 🔒 Безопасность

- Аутентификация через Supabase Auth
- Row Level Security (RLS) в базе данных
- Валидация данных на сервере
- CORS настройки
- Rate limiting

## 📊 Мониторинг

- Логи в Vercel Dashboard
- Метрики Supabase
- Health check endpoint: `/api/health`

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи в Vercel и Supabase
2. Убедитесь, что все переменные окружения настроены
3. Проверьте документацию
4. Создайте issue в репозитории

## 📄 Лицензия

MIT License

---

**Warehouse Management System** - современное решение для учета техники на складе.

