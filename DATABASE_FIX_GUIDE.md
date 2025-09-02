# Руководство по исправлению проблем с базой данных

## Проблема
При запуске приложения возникают ошибки:
- "Local storage is disabled. Use database storage only."
- "Database initialization failed"
- "SyncAdapter initialization failed. Local sync is disabled."
- "HTTP 405: Method Not Allowed" для `/api/sync`

## Причина
1. Приложение пытается использовать внешние базы данных (Redis/Postgres), которые не настроены, и при этом отключило fallback к localStorage.
2. Отсутствует API маршрут `/api/sync` на Vercel.

## Решение

### 1. Обновлена конфигурация базы данных
Файл: `src/config/databaseConfig.ts`
- Разрешён fallback к localStorage
- Включена гибридная синхронизация
- Отключён принудительный режим "только сервер"

### 2. Исправлен HybridAdapter
Файл: `src/database/hybridAdapter.ts`
- Добавлена поддержка локального хранилища как fallback
- Исправлена обработка ошибок инициализации
- Добавлены методы `setInLocal`, `getFromLocal`, `deleteFromLocal`

### 3. Исправлен SyncAdapter
Файл: `src/database/syncAdapter.ts`
- Изменён режим синхронизации с 'server' на 'hybrid'
- Отключён принудительный локальный режим
- Улучшена обработка ошибок инициализации
- **ИСПРАВЛЕНО**: Убраны ошибки, которые вызывали зацикливание
- **ИСПРАВЛЕНО**: Добавлена логика остановки повторных попыток при критических ошибках

### 4. Обновлена production конфигурация
Файл: `env.production`
- Отключены все внешние базы данных (Redis, Postgres, Vercel KV)
- Оставлен только Supabase + localStorage fallback

### 5. Добавлены тесты
Файл: `src/utils/databaseTest.ts`
- Тесты подключения к базе данных
- Тесты подключения к Supabase
- Проверка работы localStorage

### 6. Созданы API маршруты для Vercel
Файл: `api/sync.js`
- API маршрут для синхронизации данных
- Поддержка POST запросов
- Обработка ошибок

Файл: `api/test.js`
- Тестовый API маршрут
- Поддержка GET и POST запросов

### 7. Обновлена конфигурация Vercel
Файл: `vercel.json`
- Добавлена поддержка API маршрутов
- Настроена маршрутизация для `/api/*`

## Текущая архитектура

```
Приложение
├── Supabase (основная БД)
├── localStorage (fallback)
├── BrowserDatabase (локальная БД)
└── Vercel API (sync endpoint)
```

## Как проверить исправление

1. Запустите приложение в development режиме:
```bash
npm run dev
```

2. Откройте консоль браузера и проверьте:
- Нет ошибок "Local storage is disabled"
- Нет ошибок "Database initialization failed"
- Нет ошибок "HTTP 405" для `/api/sync`
- Есть сообщения о успешной инициализации

3. В development режиме автоматически запускаются тесты:
- Тест подключения к базе данных
- Тест подключения к Supabase
- Проверка localStorage

4. Для production (Vercel):
- API маршруты будут доступны по адресу `/api/sync` и `/api/test`
- Синхронизация будет работать через Vercel API

## Конфигурация для разных окружений

### Development
- Использует Supabase + localStorage
- Включены все тесты и диагностика
- Локальный сервер на порту 3001

### Production (Vercel)
- Использует Supabase + localStorage fallback
- API маршруты через Vercel Functions
- Отключены внешние базы данных
- Минимальная диагностика

## Если проблемы остаются

1. Проверьте, что переменные окружения Supabase настроены:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Убедитесь, что localStorage доступен в браузере

3. Проверьте консоль на наличие других ошибок

4. Если используете Vercel, убедитесь, что переменные окружения настроены в проекте

5. Проверьте, что API маршруты развернуты на Vercel:
   - `/api/test` должен возвращать JSON ответ
   - `/api/sync` должен принимать POST запросы

## Дополнительные исправления

### Исправлена зацикленность синхронизации
- Убраны ошибки, которые вызывали бесконечные повторные попытки
- Добавлена логика остановки при критических ошибках
- Улучшена обработка сетевых ошибок

### Добавлена поддержка Vercel API
- Созданы API маршруты в папке `api/`
- Обновлена конфигурация Vercel
- Добавлена маршрутизация для API endpoints
