# WeareHouse - Система управления складом

Профессиональная система управления складом с поддержкой синхронизации данных между устройствами.

## Быстрое развертывание

### 1. Настройка Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. Перейдите в SQL Editor
3. Выполните миграции в порядке:
   - `supabase/migrations/20250101_001_initial_schema.sql`
   - `supabase/migrations/20250101_002_initial_data.sql`
4. Скопируйте URL проекта и anon key из Settings > API

### 2. Настройка Vercel

1. Создайте аккаунт на [vercel.com](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Настройте переменные окружения в Vercel:
   - `VITE_SUPABASE_URL` - URL вашего Supabase проекта
   - `VITE_SUPABASE_ANON_KEY` - Anon key из Supabase
   - `VITE_API_URL` - URL вашего Vercel приложения (будет доступен после деплоя)

### 3. Локальная разработка

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Или с локальным Supabase
npm run dev:local
```

### 4. Сборка для продакшена

```bash
# Сборка с production переменными
npm run build:prod

# Предварительный просмотр
npm run preview
```

## Структура проекта

```
src/
├── components/          # React компоненты
├── database/           # Адаптеры базы данных
├── hooks/              # React хуки
├── utils/              # Утилиты
└── types/              # TypeScript типы

supabase/
├── migrations/         # SQL миграции
└── config.toml         # Конфигурация Supabase
```

## Основные функции

- ✅ Управление оборудованием
- ✅ Управление отгрузками
- ✅ Синхронизация между устройствами
- ✅ QR-коды для быстрого поиска
- ✅ Экспорт в PDF
- ✅ Аутентификация пользователей
- ✅ Административная панель

## Переменные окружения

Скопируйте `env.example` в `.env.local` и заполните:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_vercel_url
```

## Поддержка

При возникновении проблем проверьте:
1. Правильность переменных окружения
2. Доступность Supabase проекта
3. Логи в консоли браузера
