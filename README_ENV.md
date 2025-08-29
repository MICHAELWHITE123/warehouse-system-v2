# 🎯 Итоговая настройка переменных окружения WeareHouse

## ✅ Что уже настроено

Все переменные окружения заново прописаны и структурированы для всех компонентов системы:

### 📁 Файлы переменных окружения

#### Основной проект
- `env.example` - Полный пример всех переменных
- `env.development` - Локальная разработка
- `env.production` - Production (Vercel)
- `.env.local` - Локальные настройки (создается автоматически)

#### Серверная часть
- `server/env.example` - Серверные переменные
- `server/env.development` - Серверная разработка
- `server/env.production` - Серверный production
- `server/env.vercel.example` - Vercel развертывание
- `server/env.supabase.example` - Supabase интеграция
- `server/.env` - Локальные серверные настройки

### 🚀 Автоматизация

#### NPM скрипты
```bash
# Frontend
npm run env:dev      # Настройка development
npm run env:prod     # Настройка production
npm run env:check    # Проверка переменных
npm run env:reset    # Сброс настроек

# Backend
cd server
npm run env:dev      # Серверная разработка
npm run env:prod     # Серверный production
npm run env:vercel   # Vercel настройки
npm run env:supabase # Supabase настройки
npm run env:check    # Проверка серверных переменных
npm run env:reset    # Сброс серверных настроек
```

#### Интерактивный скрипт
```bash
./setup-env.sh
```

## 🔧 Основные переменные

### Frontend (VITE_*)
- **Supabase**: URL, анонимный ключ
- **App**: название, версия, окружение
- **API**: URL, таймауты, повторные попытки
- **Database**: Redis (Upstash), PostgreSQL (Neon)
- **Sync**: интервалы, размеры пакетов, таймауты
- **Features**: QR сканер, PDF экспорт, регистрация устройств
- **Debug**: режим отладки, уровень логов, инструменты

### Backend
- **Server**: порт, хост, окружение
- **Database**: SQLite/PostgreSQL, параметры подключения
- **Supabase**: URL, ключи (анонимный и сервисный)
- **JWT**: секрет, время жизни, алгоритм
- **Security**: CORS, Helmet, rate limiting
- **Sync**: размеры пакетов, разрешение конфликтов
- **Features**: флаги функциональности

## 🎯 Готовые конфигурации

### 1. Development (локальная разработка)
- ✅ Отладка включена
- ✅ Локальный API (localhost:3001)
- ✅ Supabase для синхронизации
- ✅ SQLite база данных
- ✅ Rate limiting отключен

### 2. Production (Vercel)
- ✅ Отладка отключена
- ✅ Supabase API
- ✅ SQLite + PostgreSQL
- ✅ Rate limiting включен
- ✅ Безопасность усилена

### 3. Supabase интеграция
- ✅ Полная интеграция с Supabase
- ✅ PostgreSQL через Supabase
- ✅ Realtime синхронизация
- ✅ Автоматическое разрешение конфликтов

## 🚀 Быстрый старт

### Для разработчика
```bash
# 1. Клонируйте проект
git clone <repository>
cd WeareHouse

# 2. Установите зависимости
npm install
cd server && npm install && cd ..

# 3. Настройте окружение
npm run env:dev

# 4. Запустите
npm run dev          # Frontend
cd server && npm run dev  # Backend
```

### Для production
```bash
# 1. Настройте production
npm run env:prod

# 2. Соберите проект
npm run build

# 3. Разверните на Vercel
# Переменные автоматически загрузятся из env.production
```

## 📱 Мобильные устройства

Все настройки для мобильных устройств уже включены:
- ✅ Регистрация устройств
- ✅ QR сканер
- ✅ PDF экспорт
- ✅ Офлайн режим
- ✅ Синхронизация между устройствами

## 🔐 Безопасность

### Критически важные переменные
1. **JWT_SECRET** - минимум 32 символа
2. **SUPABASE_SERVICE_ROLE_KEY** - храните в секрете
3. **Database passwords** - сильные пароли
4. **API keys** - не коммитьте в git

### Рекомендации
- Разные JWT_SECRET для разных окружений
- Регулярная ротация ключей
- Ограничение CORS_ORIGIN
- Rate limiting в production

## 📊 Мониторинг и логи

### Логирование
- **Development**: подробные логи, формат dev
- **Production**: структурированные логи, формат JSON

### Health checks
- API endpoint: `/health`
- Supabase: автоматическая проверка
- Database: проверка подключения

## 🆘 Поддержка

### Частые проблемы
1. **CORS ошибки** → проверьте `CORS_ORIGIN`
2. **JWT ошибки** → проверьте `JWT_SECRET`
3. **Database connection** → проверьте параметры
4. **Rate limiting** → настройте лимиты

### Полезные команды
```bash
# Проверка переменных
npm run env:check

# Сброс настроек
npm run env:reset

# Интерактивная настройка
./setup-env.sh
```

## 📚 Документация

- **Быстрый старт**: [QUICK_ENV_SETUP.md](./QUICK_ENV_SETUP.md)
- **Полная документация**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Интерактивный скрипт**: `./setup-env.sh`

## 🎉 Готово!

Все переменные окружения настроены и готовы к использованию. Система WeareHouse полностью готова для:

- ✅ Локальной разработки
- ✅ Production развертывания
- ✅ Мобильных устройств
- ✅ Синхронизации между устройствами
- ✅ Supabase интеграции
- ✅ Vercel развертывания

**Следующий шаг**: Запустите `./setup-env.sh` или используйте npm команды для настройки нужного окружения!
