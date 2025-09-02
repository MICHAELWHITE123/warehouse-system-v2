# Настройка Vercel для Warehouse Management System

## Обзор
Это руководство поможет вам настроить Vercel для деплоя системы учета техники на складе.

## Шаг 1: Подготовка проекта

### 1.1 Проверка Git репозитория
Убедитесь, что ваш проект находится в Git репозитории:

```bash
# Проверка статуса
git status

# Если не инициализирован
git init
git add .
git commit -m "Initial commit"

# Если нужно добавить remote
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 1.2 Проверка файлов конфигурации
Убедитесь, что у вас есть следующие файлы:
- `vercel.json` - конфигурация Vercel
- `package.json` - зависимости и скрипты
- `server/package.json` - зависимости сервера

## Шаг 2: Создание аккаунта Vercel

### 2.1 Регистрация
1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите "Sign Up"
3. Выберите способ регистрации:
   - GitHub (рекомендуется)
   - GitLab
   - Bitbucket
   - Email

### 2.2 Подтверждение email
1. Проверьте email
2. Подтвердите аккаунт
3. Заполните профиль (опционально)

## Шаг 3: Создание проекта

### 3.1 Подключение репозитория
1. В Vercel Dashboard нажмите "New Project"
2. Выберите "Import Git Repository"
3. Найдите ваш репозиторий
4. Нажмите "Import"

### 3.2 Настройка проекта
Заполните форму:

**Project Name**: `warehouse-system` (или любое другое)

**Framework Preset**: `Other`

**Root Directory**: `./` (оставьте пустым)

**Build Command**: `npm run build`

**Output Directory**: `dist`

**Install Command**: `npm install`

### 3.3 Настройка переменных окружения
Добавьте переменные окружения:

#### Frontend переменные:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=https://your-app-name.vercel.app/api
```

#### Backend переменные:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_URL=your_supabase_database_url
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.vercel.app
JWT_SECRET=your_jwt_secret_key_here
```

### 3.4 Деплой
1. Нажмите "Deploy"
2. Дождитесь завершения сборки
3. Проверьте логи на наличие ошибок

## Шаг 4: Настройка доменов

### 4.1 Просмотр доменов
После деплоя вы получите:
- **Production URL**: `https://your-app-name.vercel.app`
- **Preview URLs**: для каждого pull request

### 4.2 Кастомный домен (опционально)
1. Перейдите в **Settings** → **Domains**
2. Нажмите "Add Domain"
3. Введите ваш домен
4. Настройте DNS записи:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## Шаг 5: Настройка функций

### 5.1 Serverless Functions
Проект настроен для работы с Vercel Serverless Functions:
- API маршруты: `/api/*`
- Функции: `server/src/index.ts`
- Таймаут: 30 секунд

### 5.2 Оптимизация
Для лучшей производительности:

1. **Edge Functions** (если нужно):
   ```javascript
   export const config = {
     runtime: 'edge'
   }
   ```

2. **Кэширование**:
   ```javascript
   res.setHeader('Cache-Control', 's-maxage=86400')
   ```

## Шаг 6: Мониторинг и аналитика

### 6.1 Vercel Analytics
1. Перейдите в **Analytics**
2. Включите **Web Analytics**
3. Добавьте код отслеживания в `index.html`

### 6.2 Speed Insights
1. Включите **Speed Insights**
2. Получайте отчеты о производительности
3. Оптимизируйте на основе данных

### 6.3 Логи
1. Перейдите в **Functions** → **Logs**
2. Мониторьте ошибки и производительность
3. Настройте алерты

## Шаг 7: Автоматический деплой

### 7.1 Настройка Git
Vercel автоматически деплоит при:
- Push в `main` ветку
- Создание pull request
- Слияние pull request

### 7.2 Preview Deployments
Каждый pull request получает:
- Уникальный URL
- Изолированную среду
- Возможность тестирования

### 7.3 Branch Deployments
Настройте деплой для других веток:
1. **Settings** → **Git**
2. Включите **Branch Deployments**
3. Укажите ветки для деплоя

## Шаг 8: Безопасность

### 8.1 Переменные окружения
- **Production**: только для production деплоев
- **Preview**: для preview деплоев
- **Development**: для локальной разработки

### 8.2 Защита от DDoS
Vercel автоматически защищает от:
- DDoS атак
- Брутфорс атак
- SQL инъекций

### 8.3 HTTPS
- Автоматические SSL сертификаты
- HTTP/2 поддержка
- HSTS заголовки

## Шаг 9: Оптимизация

### 9.1 Изображения
Используйте Vercel Image Optimization:
```jsx
import Image from 'next/image'

<Image
  src="/image.jpg"
  width={500}
  height={300}
  alt="Description"
/>
```

### 9.2 Статические файлы
- Поместите в `public/` папку
- Автоматическое кэширование
- CDN распространение

### 9.3 API Routes
Оптимизируйте API:
```javascript
// Кэширование
export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=86400')
  // ... ваш код
}
```

## Шаг 10: Troubleshooting

### Проблема: "Build failed"
**Решение**:
1. Проверьте логи сборки
2. Убедитесь, что все зависимости установлены
3. Проверьте TypeScript ошибки

### Проблема: "Function timeout"
**Решение**:
1. Оптимизируйте код
2. Увеличьте таймаут в `vercel.json`
3. Используйте кэширование

### Проблема: "Environment variables missing"
**Решение**:
1. Проверьте переменные в Vercel Dashboard
2. Убедитесь, что они добавлены для правильной среды
3. Перезапустите деплой

### Проблема: "CORS error"
**Решение**:
1. Проверьте `CORS_ORIGIN` переменную
2. Убедитесь, что домен указан правильно
3. Настройте CORS в коде

## Шаг 11: Продвинутые настройки

### 11.1 Edge Config
Для глобальных переменных:
```javascript
import { get } from '@vercel/edge-config'

const value = await get('myKey')
```

### 11.2 Cron Jobs
Для периодических задач:
```javascript
// api/cron.js
export default function handler(req, res) {
  // Ваш код
}
```

### 11.3 Middleware
Для обработки запросов:
```javascript
// middleware.js
export function middleware(request) {
  // Ваш код
}
```

## Шаг 12: Мониторинг и поддержка

### 12.1 Метрики
- **Performance**: Core Web Vitals
- **Reliability**: Uptime и ошибки
- **Usage**: Трафик и функции

### 12.2 Алерты
Настройте уведомления для:
- Ошибок деплоя
- Высокого времени ответа
- Превышения лимитов

### 12.3 Поддержка
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel](https://github.com/vercel/vercel)
- **Discord**: [discord.gg/vercel](https://discord.gg/vercel)

## Стоимость

### Бесплатный план
- **Хостинг**: 100GB/мес
- **Serverless Functions**: 100GB/мес
- **Домены**: 1 кастомный домен
- **Аналитика**: Базовые метрики

### Pro план ($20/мес)
- **Хостинг**: 1TB/мес
- **Serverless Functions**: 1TB/мес
- **Домены**: Неограниченно
- **Аналитика**: Расширенные метрики

---

🎉 **Поздравляем!** Ваше приложение успешно размещено на Vercel!
