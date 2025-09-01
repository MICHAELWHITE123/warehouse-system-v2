# Настройка OAuth провайдеров для WeareHouse

## Обзор

Этот документ содержит инструкции по настройке OAuth провайдеров Google и GitHub для аутентификации в системе WeareHouse.

## Настройка Google OAuth

### 1. Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API

### 2. Создание OAuth 2.0 Client ID

1. Перейдите в **APIs & Services > Credentials**
2. Нажмите **Create Credentials > OAuth 2.0 Client IDs**
3. Выберите тип приложения: **Web application**
4. Заполните форму:
   - **Name**: WeareHouse Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     https://wearehouse.vercel.app
     https://your-domain.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     http://127.0.0.1:3000/auth/callback
     https://wearehouse.vercel.app/auth/callback
     https://your-domain.vercel.app/auth/callback
     ```

### 3. Получение учетных данных

После создания вы получите:
- **Client ID** - скопируйте в переменную окружения
- **Client Secret** - скопируйте в переменную окружения

### 4. Настройка переменных окружения

Добавьте в ваш `.env` файл:

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

## Настройка GitHub OAuth

### 1. Создание OAuth App в GitHub

1. Перейдите в [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Нажмите **New OAuth App**
3. Заполните форму:
   - **Application name**: WeareHouse
   - **Homepage URL**: `https://wearehouse.vercel.app`
   - **Application description**: Warehouse Management System
   - **Authorization callback URL**: `https://wearehouse.vercel.app/auth/callback`

### 2. Получение учетных данных

После создания вы получите:
- **Client ID** - скопируйте в переменную окружения
- **Client Secret** - скопируйте в переменную окружения

### 3. Настройка переменных окружения

Добавьте в ваш `.env` файл:

```bash
SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID=your_github_client_id
SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET=your_github_client_secret
```

## Настройка в Supabase Dashboard

### 1. Переход в настройки аутентификации

1. Войдите в панель управления Supabase
2. Перейдите в **Authentication > Providers**

### 2. Настройка Google

1. Найдите **Google** в списке провайдеров
2. Включите провайдер
3. Введите **Client ID** и **Client Secret**
4. Сохраните настройки

### 3. Настройка GitHub

1. Найдите **GitHub** в списке провайдеров
2. Включите провайдер
3. Введите **Client ID** и **Client Secret**
4. Сохраните настройки

## Настройка в приложении

### 1. Обновление Supabase клиента

Убедитесь, что в вашем приложении правильно настроен Supabase клиент:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 2. Функции аутентификации

```typescript
// Вход через Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

// Вход через GitHub
export const signInWithGitHub = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

// Выход
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

## Тестирование

### 1. Локальное тестирование

1. Запустите локальный сервер Supabase: `supabase start`
2. Откройте приложение в браузере
3. Попробуйте войти через Google или GitHub
4. Проверьте редирект и создание пользователя

### 2. Проверка в Supabase Dashboard

1. Перейдите в **Authentication > Users**
2. Убедитесь, что пользователь создался
3. Проверьте, что email и профиль заполнены

## Возможные проблемы

### 1. Ошибка "Invalid redirect URI"

- Проверьте, что URI в Google Cloud Console совпадает с вашим приложением
- Убедитесь, что в GitHub OAuth App указан правильный callback URL

### 2. Ошибка "Client ID not found"

- Проверьте правильность Client ID в переменных окружения
- Убедитесь, что провайдер включен в Supabase Dashboard

### 3. Ошибка "Invalid client secret"

- Проверьте правильность Client Secret в переменных окружения
- Убедитесь, что секрет не содержит лишних символов

## Безопасность

### 1. Переменные окружения

- Никогда не коммитьте секреты в git
- Используйте `.env.local` для локальной разработки
- Настройте секреты в Vercel для продакшена

### 2. Ограничения доступа

- Настройте RLS политики для защиты данных
- Ограничьте доступ к админ функциям
- Логируйте все попытки входа

## Заключение

После настройки OAuth провайдеров:

✅ Пользователи смогут входить через Google и GitHub  
✅ Не нужна регистрация по email  
✅ Автоматическое создание профилей пользователей  
✅ Безопасная аутентификация через проверенные провайдеры  

Система готова к использованию OAuth аутентификации!
