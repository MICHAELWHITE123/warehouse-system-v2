# Интеграция функции быстрой отметки погрузки

## Обзор
Функция быстрой отметки погрузки позволяет пользователям отмечать технику как погруженную одним кликом, автоматически создавая отгрузки и обновляя статусы.

## Быстрый старт

### 1. Импорт компонента
```tsx
import { InventoryOverview } from './components/InventoryOverview';
```

### 2. Базовое использование
```tsx
function MyComponent() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  const handleStatusChange = (equipmentId: string, newStatus: string) => {
    // Обновление UI или перезагрузка данных
    console.log(`Статус техники ${equipmentId} изменен на: ${newStatus}`);
  };

  return (
    <InventoryOverview 
      equipment={equipment}
      onEquipmentStatusChange={handleStatusChange}
    />
  );
}
```

## API компонента

### Props
```tsx
interface InventoryOverviewProps {
  equipment: Equipment[];                    // Массив оборудования
  onEquipmentView?: (equipment: Equipment) => void;  // Просмотр деталей
  compactMode?: boolean;                     // Компактный режим
  onEquipmentStatusChange?: (equipmentId: string, newStatus: string) => void; // Изменение статуса
}
```

### Callbacks

#### onEquipmentStatusChange
Вызывается при изменении статуса техники:
```tsx
const handleStatusChange = (equipmentId: string, newStatus: string) => {
  // equipmentId - ID техники
  // newStatus - новый статус ("in-use", "available", "maintenance")
  
  // Пример: обновление локального состояния
  setEquipment(prev => prev.map(eq => 
    eq.id === equipmentId 
      ? { ...eq, status: newStatus as Equipment['status'] }
      : eq
  ));
};
```

## Интеграция с существующими компонентами

### 1. В форме отгрузки
```tsx
function ShipmentForm() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  const handleStatusChange = (equipmentId: string, newStatus: string) => {
    // Обновляем список оборудования
    setEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: newStatus as Equipment['status'] }
        : eq
    ));
    
    // Показываем уведомление
    toast.info(`Техника ${equipmentId} получила статус: ${newStatus}`);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        {/* Форма отгрузки */}
      </div>
      <div>
        <InventoryOverview 
          equipment={equipment}
          compactMode={true}
          onEquipmentStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
```

### 2. В дашборде
```tsx
function Dashboard() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  const handleStatusChange = (equipmentId: string, newStatus: string) => {
    // Обновляем статистику дашборда
    updateDashboardStats();
    
    // Обновляем список оборудования
    setEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: newStatus as Equipment['status'] }
        : eq
    ));
  };

  return (
    <div>
      <InventoryOverview 
        equipment={equipment}
        onEquipmentStatusChange={handleStatusChange}
      />
    </div>
  );
}
```

## Обработка ошибок

### 1. Базовая обработка
```tsx
const handleStatusChange = (equipmentId: string, newStatus: string) => {
  try {
    // Ваша логика
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    toast.error('Не удалось обновить статус техники');
  }
};
```

### 2. Расширенная обработка
```tsx
const handleStatusChange = async (equipmentId: string, newStatus: string) => {
  try {
    // Асинхронная операция
    await updateEquipmentStatus(equipmentId, newStatus);
    
    // Обновление UI
    setEquipment(prev => prev.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: newStatus as Equipment['status'] }
        : eq
    ));
    
    toast.success('Статус техники обновлен');
  } catch (error) {
    console.error('Ошибка:', error);
    
    if (error.code === 'NETWORK_ERROR') {
      toast.error('Ошибка сети. Проверьте соединение.');
    } else if (error.code === 'PERMISSION_DENIED') {
      toast.error('Недостаточно прав для изменения статуса');
    } else {
      toast.error('Произошла неизвестная ошибка');
    }
  }
};
```

## Кастомизация

### 1. Изменение стилей кнопки
```tsx
// В компоненте InventoryOverview
<Button
  variant="ghost"
  size="sm"
  onClick={() => handleMarkAsLoaded(item)}
  disabled={loadingEquipment.has(item.id)}
  className="text-green-600 hover:text-green-700 hover:bg-green-50"
  title="Отметить как погруженную"
>
  {/* Кастомная иконка */}
  <CustomCheckIcon className="h-4 w-4" />
</Button>
```

### 2. Кастомные уведомления
```tsx
// В handleMarkAsLoaded
toast.success(`Техника "${equipment.name}" отмечена как погруженная`, {
  description: `Создана отгрузка ${shipment.number}`,
  duration: 5000, // Кастомная длительность
  action: {
    label: "Открыть отгрузку",
    onClick: () => openShipmentDetails(shipment.id)
  }
});
```

## Тестирование

### 1. Unit тесты
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryOverview } from './InventoryOverview';

test('отмечает технику как погруженную', async () => {
  const mockEquipment = [
    {
      id: '1',
      name: 'Test Equipment',
      status: 'available',
      // ... другие поля
    }
  ];
  
  const mockOnStatusChange = jest.fn();
  
  render(
    <InventoryOverview 
      equipment={mockEquipment}
      onEquipmentStatusChange={mockOnStatusChange}
    />
  );
  
  const checkButton = screen.getByTitle('Отметить как погруженную');
  fireEvent.click(checkButton);
  
  expect(mockOnStatusChange).toHaveBeenCalledWith('1', 'in-use');
});
```

### 2. Интеграционные тесты
```tsx
test('создает отгрузку при отметке техники', async () => {
  // Тест интеграции с базой данных
  const shipmentService = new ShipmentService();
  const equipmentService = new EquipmentService();
  
  // ... тестовая логика
});
```

## Производительность

### 1. Оптимизация рендеринга
```tsx
// Мемоизация списка оборудования
const memoizedEquipment = useMemo(() => 
  equipment.filter(item => item.status === "available"),
  [equipment]
);

// Мемоизация обработчика
const handleStatusChange = useCallback((equipmentId: string, newStatus: string) => {
  // логика
}, []);
```

### 2. Виртуализация для больших списков
```tsx
import { FixedSizeList as List } from 'react-window';

// Для списков с большим количеством элементов
<List
  height={400}
  itemCount={filteredEquipment.length}
  itemSize={80}
  itemData={filteredEquipment}
>
  {({ index, style, data }) => (
    <EquipmentItem 
      equipment={data[index]} 
      style={style}
      onMarkAsLoaded={handleMarkAsLoaded}
    />
  )}
</List>
```

## Отладка

### 1. Логирование
```tsx
const handleMarkAsLoaded = async (equipment: Equipment) => {
  console.log('Начало обработки погрузки:', equipment);
  
  try {
    // ... логика
    console.log('Отгрузка создана:', shipment);
  } catch (error) {
    console.error('Ошибка при создании отгрузки:', error);
  }
};
```

### 2. DevTools
```tsx
// В режиме разработки
if (process.env.NODE_ENV === 'development') {
  console.log('Состояние загрузки:', loadingEquipment);
  console.log('Оборудование:', equipment);
}
```

## Безопасность

### 1. Валидация входных данных
```tsx
const handleMarkAsLoaded = async (equipment: Equipment) => {
  // Проверка существования оборудования
  if (!equipment || !equipment.id) {
    toast.error('Некорректные данные оборудования');
    return;
  }
  
  // Проверка статуса
  if (equipment.status !== 'available') {
    toast.error('Техника недоступна для погрузки');
    return;
  }
  
  // ... основная логика
};
```

### 2. Проверка прав доступа
```tsx
const handleMarkAsLoaded = async (equipment: Equipment) => {
  // Проверка прав пользователя
  if (!hasPermission('equipment:mark_loaded')) {
    toast.error('Недостаточно прав для выполнения операции');
    return;
  }
  
  // ... основная логика
};
```
