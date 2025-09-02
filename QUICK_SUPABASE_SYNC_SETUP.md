# Быстрая настройка синхронизации Supabase

## Что нужно сделать для исправления ошибки 404:

### 1. Установить Supabase CLI
```bash
npm install -g supabase
```

### 2. Войти в Supabase
```bash
supabase login
```

### 3. Связать проект (замените YOUR_PROJECT_REF на ваш Project Reference)
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Развернуть Edge Function
```bash
supabase functions deploy sync
```

### 5. Применить миграции базы данных
```bash
supabase db push
```

### 6. Проверить переменные окружения в Vercel
Убедитесь, что в Vercel Dashboard > Settings > Environment Variables есть:
- `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = ваш anon key

### 7. Перезапустить приложение
После развертывания Edge Function перезапустите приложение на Vercel.

## Проверка работы:

1. Откройте приложение в браузере
2. Откройте консоль разработчика (F12)
3. Попробуйте создать/удалить оборудование
4. Проверьте, что нет ошибок 404 в консоли

## Если все еще есть проблемы:

1. Проверьте логи Edge Function в Supabase Dashboard > Edge Functions > Logs
2. Убедитесь, что Edge Function развернута: `supabase functions list`
3. Проверьте, что URL в конфигурации правильный

## Где найти Project Reference:

1. Откройте Supabase Dashboard
2. Перейдите в Settings > General
3. Скопируйте "Reference ID" (например: `abcdefghijklmnop`)

## Где найти API ключи:

1. В Supabase Dashboard перейдите в Settings > API
2. Скопируйте:
   - Project URL (для `VITE_SUPABASE_URL`)
   - anon public key (для `VITE_SUPABASE_ANON_KEY`)
