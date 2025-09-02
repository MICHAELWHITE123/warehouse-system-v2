# Инструкция по воссозданию проекта "Система управления складской техникой"

## Обзор проекта

Это веб-приложение для управления складской техникой, построенное на современном стеке технологий. Система позволяет вести учет оборудования, создавать стеки техники, управлять отгрузками и генерировать отчеты.

## Технологический стек

### Frontend
- **React 18.2.0** - основная библиотека для UI
- **TypeScript 5.2.2** - типизация
- **Vite 5.2.0** - сборщик и dev-сервер
- **Tailwind CSS 3.4.4** - CSS-фреймворк
- **shadcn/ui** - компонентная библиотека (на основе Radix UI)

### Backend
- **Node.js** с Express.js
- **TypeScript** для сервера
- **SQLite** - локальная база данных
- **Supabase** - облачная база данных (альтернатива)

### Ключевые библиотеки
- **@radix-ui/react-*** - примитивы UI компонентов
- **lucide-react** - иконки
- **react-hook-form** - управление формами
- **sonner** - уведомления
- **recharts** - графики и диаграммы
- **qrcode.react** - генерация QR-кодов
- **@yudiel/react-qr-scanner** - сканирование QR-кодов
- **jspdf** + **jspdf-autotable** - генерация PDF отчетов
- **cyrillic-to-translit-js** - транслитерация для QR-кодов

## Архитектура проекта

### Структура папок
```
src/
├── components/           # React компоненты
│   ├── ui/              # shadcn/ui компоненты
│   ├── admin/           # компоненты админ-панели
│   └── figma/           # компоненты из Figma
├── hooks/               # Пользовательские хуки
├── database/            # Работа с базой данных
│   ├── services/        # Сервисы для работы с данными
│   └── migrations/      # Миграции БД
├── adapters/            # Адаптеры для разных БД
├── types/               # TypeScript типы
├── utils/               # Утилиты
├── constants/           # Константы
└── styles/              # Стили
```

### Основные модули
1. **Аутентификация** - система входа/выхода
2. **Управление оборудованием** - CRUD операции с техникой
3. **Управление категориями** - категории оборудования
4. **Управление локациями** - места хранения
5. **Управление стеками** - группировка оборудования
6. **Управление отгрузками** - создание и отслеживание отгрузок
7. **QR-коды** - генерация и сканирование
8. **PDF экспорт** - генерация отчетов
9. **Статистика** - аналитика и дашборд
10. **Админ-панель** - управление системой

## Пошаговая инструкция воссоздания

### 1. Инициализация проекта

```bash
# Создание проекта с Vite
npm create vite@latest warehouse-system -- --template react-ts
cd warehouse-system

# Установка зависимостей
npm install
```

### 2. Установка основных зависимостей

```bash
# UI библиотеки
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip

# Утилиты для UI
npm install class-variance-authority clsx tailwind-merge

# Иконки и визуализация
npm install lucide-react recharts

# Формы и валидация
npm install react-hook-form

# QR-коды
npm install qrcode.react @yudiel/react-qr-scanner @types/qrcode

# PDF генерация
npm install jspdf jspdf-autotable jspdf-font @types/jspdf

# Уведомления
npm install sonner

# Дополнительные компоненты
npm install cmdk embla-carousel-react input-otp react-day-picker react-resizable-panels vaul

# Утилиты
npm install cyrillic-to-translit-js

# Шрифты
npm install @fontsource/roboto
```

### 3. Настройка Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 4. Настройка shadcn/ui

```bash
npx shadcn@latest init
```

### 5. Установка компонентов shadcn/ui

```bash
npx shadcn@latest add button card badge input label select textarea dialog popover dropdown-menu navigation-menu tabs accordion alert-dialog aspect-ratio avatar checkbox collapsible context-menu hover-card menubar progress radio-group scroll-area separator slider switch toast toggle toggle-group tooltip form calendar carousel command input-otp pagination resizable sheet skeleton sonner
```

### 6. Настройка базы данных

#### Для SQLite (локальная разработка):
```bash
npm install better-sqlite3 @types/better-sqlite3
```

#### Для Supabase (продакшн):
```bash
npm install @supabase/supabase-js
```

### 7. Настройка сервера (опционально)

```bash
mkdir server
cd server
npm init -y

# Зависимости сервера
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken express-validator uuid
npm install -D @types/express @types/cors @types/morgan @types/bcryptjs @types/jsonwebtoken @types/uuid nodemon ts-node typescript
```

## Ключевые особенности дизайна

### Цветовая схема
- **Светлая тема**: белый фон, темно-серый текст
- **Темная тема**: темно-серый фон, белый текст
- **Акцентный цвет**: синий (#3b82f6)
- **Статусы**: зеленый (доступно), синий (в работе), желтый (обслуживание), красный (ошибки)

### Компоненты интерфейса
1. **Навигация**: боковая панель с основными разделами
2. **Карточки**: для отображения статистики и информации
3. **Таблицы**: для списков оборудования, отгрузок
4. **Формы**: модальные окна для создания/редактирования
5. **QR-сканер**: камера для сканирования кодов
6. **Дашборд**: сводная информация с графиками

### Адаптивность
- Мобильная версия с адаптивным меню
- Таблицы с горизонтальной прокруткой
- Карточки с гибкой сеткой

## Основные функции

### 1. Управление оборудованием
- Добавление/редактирование/удаление техники
- Присвоение категорий и локаций
- Отслеживание статуса (доступно/в работе/обслуживание)
- Генерация QR-кодов для каждого элемента

### 2. Стеки оборудования
- Группировка техники в логические наборы
- Массовые операции с группами
- Отслеживание состава стеков

### 3. Отгрузки
- Создание отгрузок с оборудованием и стеками
- Чек-листы для проверки
- Арендное оборудование
- Генерация PDF документов

### 4. QR-коды
- Автоматическая генерация для каждого элемента
- Сканирование через камеру
- Быстрый поиск по коду

### 5. Статистика
- Общая статистика по складу
- Графики распределения
- Отчеты по категориям и локациям

### 6. Администрирование
- Управление пользователями
- Настройки системы
- Аудит действий

## Особенности реализации

### Состояние приложения
- Использование React hooks для управления состоянием
- Локальная база данных для автономной работы
- Синхронизация с облачной БД при наличии интернета

### Производительность
- Ленивая загрузка компонентов
- Виртуализация больших списков
- Кэширование данных

### Безопасность
- Валидация всех входных данных
- Хеширование паролей
- JWT токены для аутентификации

### Совместимость
- Поддержка современных браузеров
- PWA возможности
- Офлайн режим

## Команды для запуска

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Предпросмотр
npm run preview

# Линтинг
npm run lint
```

## Структура данных

### Основные сущности:
1. **Equipment** - оборудование
2. **Category** - категории
3. **Location** - локации
4. **Stack** - стеки оборудования
5. **Shipment** - отгрузки
6. **User** - пользователи

### Связи:
- Equipment → Category (многие к одному)
- Equipment → Location (многие к одному)
- Stack → Equipment (многие ко многим)
- Shipment → Equipment (многие ко многим)
- Shipment → Stack (многие ко многим)

Эта инструкция содержит всю необходимую информацию для полного воссоздания проекта с сохранением дизайна и функциональности.

