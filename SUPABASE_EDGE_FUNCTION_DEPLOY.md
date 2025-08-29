# Развертывание Edge Function в Supabase для исправления ошибки 401

## Проблема
Приложение получает ошибку 401 (Unauthorized) при попытке подключения к Supabase real-time API через EventSource.

## Решение
Нужно развернуть Edge Function `events` в Supabase для обработки real-time подключений.

## Шаги развертывания

### 1. Установка Supabase CLI
```bash
git
```

### 2. Логин в Supabase
```bash
supabase login
```

### 3. Инициализация проекта (если еще не инициализирован)
```bash
cd /path/to/your/project
supabase init
```

### 4. Связывание с существующим проектом
```bash
supabase link --project-ref xekoibwvbsbpjcjqmjlu
```

### 5. Развертывание Edge Function
```bash
supabase functions deploy events
```

### 6. Проверка развертывания
```bash
supabase functions list
```

## Альтернативное решение через веб-интерфейс

### 1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
### 2. Выберите проект `xekoibwvbsbpjcjqmjlu`
### 3. Перейдите в раздел "Edge Functions"
### 4. Создайте новую функцию с именем `events`
### 5. Скопируйте код из файла `supabase/functions/events/index.ts`
### 6. Разверните функцию

## Проверка работы

После развертывания Edge Function:

1. Перезапустите приложение
2. Проверьте консоль браузера - ошибки 401 должны исчезнуть
3. Должно появиться сообщение "Real-time connection established"

## Переменные окружения

Убедитесь, что в Supabase Dashboard настроены следующие переменные:
- `SUPABASE_URL` - URL вашего проекта
- `SUPABASE_SERVICE_ROLE_KEY` - сервисный ключ (не анонимный!)

## Структура файлов

```
supabase/
  functions/
    events/
      index.ts          # Edge Function код
```

## Примечания

- Edge Function должна быть развернута в том же проекте Supabase
- Используйте сервисный ключ, а не анонимный для проверки аутентификации
- После развертывания может потребоваться несколько минут для активации
