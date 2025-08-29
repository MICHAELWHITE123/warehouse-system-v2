# 🔧 Альтернативные способы настройки Environment Variables

## ❌ Проблема: Ошибка установки Vercel CLI

Если у вас возникла ошибка `EACCES: permission denied` при установке Vercel CLI, не беспокойтесь! Есть несколько способов решения.

---

## ✅ **Решение 1: Использование npx (Рекомендуется)**

### Преимущества:
- ✅ Не требует глобальной установки
- ✅ Всегда использует актуальную версию
- ✅ Нет проблем с правами доступа

### Команды:
```bash
# Вместо: vercel login
npx vercel login

# Вместо: vercel env add KEY production
npx vercel env add KEY production

# Вместо: vercel --prod
npx vercel --prod

# Вместо: vercel env ls
npx vercel env ls
```

### Обновленный скрипт:
```bash
# Запускаем исправленный скрипт
./vercel-env-setup.sh
```

---

## ✅ **Решение 2: Исправление прав npm (для постоянной установки)**

### Способ 2.1: Изменение глобальной папки npm
```bash
# Создаем папку для глобальных пакетов в домашней директории
mkdir ~/.npm-global

# Настраиваем npm на использование новой папки
npm config set prefix '~/.npm-global'

# Добавляем в PATH (в ~/.zshrc или ~/.bash_profile)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# Теперь можно устанавливать глобально без sudo
npm install -g vercel
```

### Способ 2.2: Использование Node Version Manager (nvm)
```bash
# Устанавливаем nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc

# Устанавливаем Node.js через nvm
nvm install node
nvm use node

# Теперь npm install -g работает без проблем
npm install -g vercel
```

---

## ✅ **Решение 3: Ручная настройка через Vercel Dashboard**

Если CLI не работает, всегда можно настроить всё через веб-интерфейс:

### Шаг 3.1: Получение Supabase ключей
1. Откройте https://supabase.com
2. Войдите в ваш проект
3. **Settings** → **API**
4. Скопируйте:
   ```
   Project URL: https://xyzabcdef.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIs...
   service_role: eyJhbGciOiJIUzI1NiIs...
   ```

### Шаг 3.2: Добавление в Vercel Dashboard
1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект
3. **Settings** → **Environment Variables**
4. Добавьте каждую переменную:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Production, Preview, Development |

### Шаг 3.3: Создание локального .env.local
```bash
# Создайте файл .env.local в корне проекта
cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://xyzabcdef.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# App Configuration
VITE_APP_NAME=Система учета техники на складе
VITE_API_URL=http://localhost:3000/api

# Server-side (для API functions)
SUPABASE_URL=https://xyzabcdef.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
EOF
```

---

## ✅ **Решение 4: Использование Vercel для GitHub**

### Преимущества:
- ✅ Автоматический деплой при push
- ✅ Не нужно устанавливать CLI
- ✅ Интегрированный CI/CD

### Настройка:
1. Загрузите код в GitHub репозиторий
2. Подключите репозиторий к Vercel:
   - https://vercel.com/new
   - Import Git Repository
   - Выберите ваш репозиторий
3. Настройте Environment Variables в Vercel Dashboard
4. Деплой произойдет автоматически

---

## 🧪 **Проверка настройки без CLI**

### Тест 1: Локальная проверка
```bash
npm run dev
# В браузере console:
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

### Тест 2: Онлайн тест
Откройте `test-supabase-realtime.html` и:
1. Введите ваши Supabase данные
2. Нажмите "Инициализировать Supabase"
3. Нажмите "Подключиться"
4. Протестируйте операции с данными

---

## 🎯 **Быстрая настройка без скриптов**

Если ничего не работает, вот минимальные шаги:

### 1. Создайте .env.local файл:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. В Vercel Dashboard добавьте те же переменные

### 3. Протестируйте локально:
```bash
npm run dev
```

### 4. Деплойте через GitHub или веб-интерфейс Vercel

---

## 🔍 **Диагностика проблем**

### Проблема: "Missing Supabase environment variables"
```bash
# Проверьте что файл .env.local существует
ls -la .env.local

# Проверьте содержимое
cat .env.local

# Перезапустите dev сервер
npm run dev
```

### Проблема: Переменные не загружаются в production
1. Проверьте Vercel Dashboard → Settings → Environment Variables
2. Убедитесь что выбраны все environments (Production, Preview, Development)
3. Сделайте новый деплой: git push или redeploy в Vercel

### Проблема: API функции не работают
```bash
# Проверьте логи в Vercel Dashboard
# Functions → View Logs
# Или используйте npx vercel logs
```

---

## 📝 **Чек-лист без CLI**

### ✅ Минимальная настройка
- [ ] Получены ключи из Supabase Dashboard
- [ ] Создан .env.local в корне проекта
- [ ] Переменные добавлены в Vercel Dashboard
- [ ] Протестировано `npm run dev`
- [ ] Сделан деплой на Vercel

### ✅ Проверка работы
- [ ] Открывается приложение на Vercel URL
- [ ] Нет ошибок в browser console
- [ ] API endpoints отвечают (если есть)
- [ ] Realtime работает (если настроен)

---

**Результат**: Даже без Vercel CLI вы можете полностью настроить и развернуть приложение с Supabase Realtime! 🚀
