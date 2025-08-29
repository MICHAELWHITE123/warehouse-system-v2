# ⚡ Быстрая настройка переменных окружения

## 🚀 За 30 секунд

### 1. Автоматическая настройка
```bash
# Запустите интерактивный скрипт
./setup-env.sh

# Или используйте npm команды
npm run env:dev      # Development
npm run env:prod     # Production
```

### 2. Ручная настройка
```bash
# Frontend (Development)
cp env.development .env.local

# Backend (Development)
cd server
cp env.development .env
cd ..
```

## 📋 Что настроится

### Frontend (.env.local)
- ✅ Supabase URL и ключи
- ✅ API настройки
- ✅ Feature flags
- ✅ Debug режим

### Backend (.env)
- ✅ Серверные настройки
- ✅ База данных
- ✅ JWT конфигурация
- ✅ Supabase интеграция

## 🔧 Проверка настроек

```bash
# Проверить переменные
npm run env:check

# Серверные переменные
cd server && npm run env:check
```

## 🚀 Запуск

```bash
# Frontend
npm run dev

# Backend
cd server && npm run dev
```

## 📱 Для мобильных устройств

Все настройки синхронизации уже включены:
- ✅ Device registration
- ✅ QR scanner
- ✅ PDF export
- ✅ Offline mode

## 🆘 Если что-то не работает

1. **Проверьте .env файлы** - они должны существовать
2. **Перезапустите сервисы** - после изменения переменных
3. **Проверьте Supabase** - URL и ключи должны быть корректными
4. **Логи** - смотрите консоль браузера и сервера

## 📞 Подробная документация

Полная документация: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
