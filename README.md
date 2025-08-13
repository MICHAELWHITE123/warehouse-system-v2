# Система учета техники на складе

Веб-приложение для управления складской техникой, построенное на React + TypeScript + Vite + Tailwind CSS.

## Структура проекта

```
src/
├── main.tsx                 # Точка входа
├── App.tsx                  # Главный компонент
├── components/              # React компоненты
│   ├── AuthForm.tsx         
│   ├── Dashboard.tsx        
│   ├── EquipmentList.tsx    
│   ├── EquipmentForm.tsx    
│   ├── CategoryManagement.tsx
│   ├── LocationManagement.tsx
│   ├── Navigation.tsx       
│   ├── QRCodeModal.tsx      
│   ├── StackManagement.tsx
│   ├── StackForm.tsx
│   ├── ShipmentList.tsx
│   ├── ShipmentForm.tsx
│   ├── ShipmentDetailsModal.tsx
│   ├── ShipmentChecklist.tsx
│   ├── figma/               # Figma компоненты
│   └── ui/                  # shadcn/ui компоненты
├── hooks/                   # Пользовательские хуки
├── data/                    # Данные приложения  
├── types/                   # TypeScript типы
├── constants/               # Константы
├── utils/                   # Утилиты
└── styles/                  # Стили
```

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

