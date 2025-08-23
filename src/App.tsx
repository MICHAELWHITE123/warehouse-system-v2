import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { EquipmentList, Equipment } from "./components/EquipmentList";
import { EquipmentForm } from "./components/EquipmentForm";
import { EquipmentDetails } from "./components/EquipmentDetails";
import { CategoryManagement } from "./components/CategoryManagement";
import { LocationManagement } from "./components/LocationManagement";
import { StackManagement, EquipmentStack } from "./components/StackManagement";
import { StackForm } from "./components/StackForm";
import { ShipmentList } from "./components/ShipmentList";
import { ShipmentForm } from "./components/ShipmentForm";
import { AuthForm } from "./components/AuthForm";
import { AdminPanel } from "./components/AdminPanel";
import { SyncNotifications } from "./components/SyncNotifications";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Импорты для работы с базой данных
import { ExtendedShipment, ActiveView } from "./types";
import { calculateStats } from "./utils/statistics";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";
import { useDatabase, useEquipment, useCategories, useLocations, useStacks, useShipments, useStatistics } from "./hooks/useDatabase";
import { 
  adaptEquipmentFromDB, 
  adaptStackFromDB, 
  adaptShipmentFromDB,
  adaptEquipmentToDB,
  adaptStackToDB,
  adaptShipmentToDB,
  adaptCategoriesFromDB,
  adaptLocationsFromDB
} from "./adapters/databaseAdapter";
import { stackService } from "./database/services";

export default function App() {
  const { user, handleLogin, handleLogout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Инициализация базы данных
  const { isInitialized, error: dbError } = useDatabase();
  
  // Хуки для работы с данными из БД
  const { equipment: dbEquipment, createEquipment, updateEquipment, deleteEquipment } = useEquipment();
  const { categories: dbCategories } = useCategories();
  const { locations: dbLocations } = useLocations();
  const { stacks: dbStacks, createStack, updateStack, deleteStack } = useStacks();
  const { shipments: dbShipments, createShipmentWithDetails, updateShipment, deleteShipment } = useShipments();
  const { stats: dbStats } = useStatistics();
  
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEquipmentDetailsVisible, setIsEquipmentDetailsVisible] = useState(false); // Состояние для отображения деталей
  
  // Состояние для стеков
  const [selectedStack, setSelectedStack] = useState<EquipmentStack | null>(null);
  const [isStackFormVisible, setIsStackFormVisible] = useState(false);
  
  // Состояние для отгрузок
  const [selectedShipment, setSelectedShipment] = useState<ExtendedShipment | null>(null);
  const [isShipmentFormVisible, setIsShipmentFormVisible] = useState(false);

  // Преобразуем данные из БД в формат компонентов
  const equipment: Equipment[] = dbEquipment.map(adaptEquipmentFromDB);
  const categories: string[] = adaptCategoriesFromDB(dbCategories);
  const locations: string[] = adaptLocationsFromDB(dbLocations);
  
  console.log('=== App.tsx Debug ===');
  console.log('dbStacks from database:', dbStacks);
  
  const stacks: EquipmentStack[] = dbStacks.map(adaptStackFromDB);
  
  console.log('stacks after adaptation:', stacks);
  console.log('dbShipments from database:', dbShipments);
  
  const shipments: ExtendedShipment[] = dbShipments.map(adaptShipmentFromDB);
  
  console.log('shipments after adaptation:', shipments);
  console.log('=====================');

  // Используем статистику из БД или рассчитываем локально как fallback
  const stats = dbStats || calculateStats(equipment, stacks, shipments);

  const notificationCount = stats.maintenanceEquipment;

  // Обработчики для оборудования
  const handleAddEquipment = async (newEquipment: Omit<Equipment, 'id'>) => {
    try {
      const equipmentData = adaptEquipmentToDB(newEquipment, dbCategories, dbLocations);
      await createEquipment(equipmentData);
      setIsFormVisible(false);
      toast.success("Оборудование успешно добавлено");
    } catch (error) {
      toast.error("Ошибка при добавлении оборудования");
      console.error(error);
    }
  };

  const handleEditEquipment = async (updatedEquipment: Omit<Equipment, 'id'>) => {
    if (selectedEquipment) {
      try {
        const dbEquipmentItem = dbEquipment.find(eq => eq.uuid === selectedEquipment.id);
        if (dbEquipmentItem) {
          const equipmentData = adaptEquipmentToDB(updatedEquipment, dbCategories, dbLocations, selectedEquipment.id);
          await updateEquipment({ ...equipmentData, id: dbEquipmentItem.id });
          
          // Обновляем выбранное оборудование с новыми данными
          const updatedEquipmentWithId = { ...updatedEquipment, id: selectedEquipment.id };
          setSelectedEquipment(updatedEquipmentWithId);
          
          setIsFormVisible(false);
          // Возвращаемся к деталям, если пользователь был там
          if (isEquipmentDetailsVisible) {
            setActiveView("view-equipment");
          } else {
            setSelectedEquipment(null);
            setActiveView("equipment");
          }
          
          toast.success("Оборудование успешно обновлено");
        }
      } catch (error) {
        toast.error("Ошибка при обновлении оборудования");
        console.error(error);
      }
    }
  };

  const handleViewEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsEquipmentDetailsVisible(true);
    setActiveView("view-equipment");
  };

  const handleEquipmentDetailsBack = () => {
    setIsEquipmentDetailsVisible(false);
    setSelectedEquipment(null);
    setActiveView("equipment");
  };

  const handleEditEquipmentClick = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsFormVisible(true);
    setIsEquipmentDetailsVisible(false); // Скрываем детали при редактировании
    setActiveView("edit-equipment");
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    try {
      const dbEquipmentItem = dbEquipment.find(eq => eq.uuid === equipmentId);
      if (dbEquipmentItem) {
        await deleteEquipment(dbEquipmentItem.id);
        toast.success("Оборудование успешно удалено");
      }
    } catch (error) {
      toast.error("Ошибка при удалении оборудования");
      console.error(error);
    }
  };

  // Обработчики для стеков
  const handleAddStack = async (newStack: Omit<EquipmentStack, 'id'>) => {
    try {
      const stackData = adaptStackToDB(newStack);
      await createStack(stackData);
      
      // После создания стека, получаем его из БД для получения ID
      const dbStack = stackService.getStackByUuid(stackData.uuid);
      
      // Добавляем оборудование в стек
      if (newStack.equipmentIds.length > 0 && dbStack) {
        const equipmentDbIds = newStack.equipmentIds
          .map(uuid => dbEquipment.find(eq => eq.uuid === uuid)?.id)
          .filter(Boolean) as number[];
        
        if (equipmentDbIds.length > 0) {
          stackService.addEquipmentToStack(dbStack.id, equipmentDbIds);
        }
      }
      
      setIsStackFormVisible(false);
      toast.success("Стек успешно создан");
    } catch (error) {
      toast.error("Ошибка при создании стека");
      console.error(error);
    }
  };

  const handleEditStack = async (updatedStack: Omit<EquipmentStack, 'id'>) => {
    if (selectedStack) {
      try {
        const dbStackItem = dbStacks.find(stack => stack.uuid === selectedStack.id);
        if (dbStackItem) {
          const stackData = adaptStackToDB(updatedStack, selectedStack.id);
          await updateStack({ ...stackData, id: dbStackItem.id });
          
          // Обновляем оборудование в стеке
          const equipmentDbIds = updatedStack.equipmentIds
            .map(uuid => dbEquipment.find(eq => eq.uuid === uuid)?.id)
            .filter(Boolean) as number[];
          
          stackService.replaceStackEquipment(dbStackItem.id, equipmentDbIds);
          
          setSelectedStack(null);
          setIsStackFormVisible(false);
          toast.success("Стек успешно обновлен");
        }
      } catch (error) {
        toast.error("Ошибка при обновлении стека");
        console.error(error);
      }
    }
  };

  const handleEditStackClick = (stack: EquipmentStack) => {
    setSelectedStack(stack);
    setIsStackFormVisible(true);
    setActiveView("edit-stack");
  };

  const handleDeleteStack = async (stackId: string) => {
    try {
      const dbStackItem = dbStacks.find(stack => stack.uuid === stackId);
      if (dbStackItem) {
        await deleteStack(dbStackItem.id);
        toast.success("Стек успешно удален");
      }
    } catch (error) {
      toast.error("Ошибка при удалении стека");
      console.error(error);
    }
  };

  const handleCreateStack = () => {
    setSelectedStack(null);
    setIsStackFormVisible(true);
    setActiveView("add-stack");
  };

  const handleStackFormCancel = () => {
    setIsStackFormVisible(false);
    setSelectedStack(null);
    setActiveView("stacks");
  };

  const handleStacksChange = () => {
    // Этот метод больше не нужен, так как мы работаем напрямую с БД
    console.log("StacksChange called but ignored - using database directly");
  };

  // Обработчики для отгрузок
  const handleAddShipment = async (newShipment: Omit<ExtendedShipment, 'id'>) => {
    try {
      console.log('=== handleAddShipment Debug ===');
      console.log('newShipment from form:', newShipment);
      console.log('newShipment.equipment:', newShipment.equipment);
      console.log('newShipment.stacks:', newShipment.stacks);
      console.log('newShipment.rental:', newShipment.rental);
      console.log('newShipment.checklist:', newShipment.checklist);
      
      // Создаем данные для БД, включая связанные записи
      const fullShipmentData = {
        uuid: Date.now().toString(),
        number: newShipment.number,
        date: newShipment.date,
        recipient: newShipment.recipient,
        recipient_address: newShipment.recipientAddress,
        status: newShipment.status,
        responsible_person: newShipment.responsiblePerson,
        total_items: newShipment.totalItems,
        comments: newShipment.comments,
        delivered_at: newShipment.deliveredAt,
        equipment: newShipment.equipment,
        stacks: newShipment.stacks,
        rental: newShipment.rental,
        checklist: newShipment.checklist
      };
      
      console.log('fullShipmentData for DB:', fullShipmentData);
      
      // Используем новый метод для создания отгрузки со всеми связанными данными
      await createShipmentWithDetails(fullShipmentData);
      
      setIsShipmentFormVisible(false);
      toast.success("Отгрузка успешно создана");
      console.log('===============================');
    } catch (error) {
      toast.error("Ошибка при создании отгрузки");
      console.error(error);
    }
  };

  const handleEditShipment = async (updatedShipment: Omit<ExtendedShipment, 'id'>) => {
    if (selectedShipment) {
      try {
        const dbShipmentItem = dbShipments.find(shipment => shipment.uuid === selectedShipment.id);
        if (dbShipmentItem) {
          const shipmentData = adaptShipmentToDB(updatedShipment, selectedShipment.id);
          await updateShipment({ ...shipmentData, id: dbShipmentItem.id });
          setSelectedShipment(null);
          setIsShipmentFormVisible(false);
          toast.success("Отгрузка успешно обновлена");
        }
      } catch (error) {
        toast.error("Ошибка при обновлении отгрузки");
        console.error(error);
      }
    }
  };

  const handleViewShipment = (_shipment: ExtendedShipment) => {
    // Просмотр обрабатывается в компоненте ShipmentList
  };

  const handleEditShipmentClick = (shipment: ExtendedShipment) => {
    setSelectedShipment(shipment);
    setIsShipmentFormVisible(true);
    setActiveView("edit-shipment");
  };

  const handleDeleteShipment = async (shipmentId: string) => {
    try {
      const dbShipmentItem = dbShipments.find(shipment => shipment.uuid === shipmentId);
      if (dbShipmentItem) {
        await deleteShipment(dbShipmentItem.id);
        toast.success("Отгрузка успешно удалена");
      }
    } catch (error) {
      toast.error("Ошибка при удалении отгрузки");
      console.error(error);
    }
  };

  const handleCreateShipment = () => {
    setSelectedShipment(null);
    setIsShipmentFormVisible(true);
    setActiveView("add-shipment");
  };

  const handleShipmentFormCancel = () => {
    setIsShipmentFormVisible(false);
    setSelectedShipment(null);
    setActiveView("shipments");
  };

  // Обработчик для выбора оборудования из Dashboard QR сканера
  const handleDashboardEquipmentSelect = (equipment: Equipment) => {
    handleViewEquipment(equipment);
  };

  // Общие обработчики
  const handleViewChange = (view: string) => {
    const typedView = view as ActiveView;
    setActiveView(typedView);
    if (view === "add-equipment") {
      setSelectedEquipment(null);
      setIsFormVisible(true);
      setIsShipmentFormVisible(false);
      setIsStackFormVisible(false);
    } else if (view === "add-stack") {
      setSelectedStack(null);
      setIsStackFormVisible(true);
      setIsFormVisible(false);
      setIsShipmentFormVisible(false);
    } else {
      setIsFormVisible(false);
      setSelectedEquipment(null);
      setIsShipmentFormVisible(false);
      setSelectedShipment(null);
      setIsStackFormVisible(false);
      setSelectedStack(null);
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    if (isEquipmentDetailsVisible) {
      // Если пользователь был в деталях, возвращаемся туда
      setActiveView("view-equipment");
    } else {
      // Иначе возвращаемся к списку
      setSelectedEquipment(null);
      setActiveView("equipment");
    }
  };

  const handleCategoriesChange = async () => {
    // Обновляем список категорий после изменений
    try {
      // Принудительно обновляем данные из базы
      window.location.reload();
    } catch (error) {
      console.error('Ошибка обновления категорий:', error);
    }
  };

  const renderContent = () => {
    if (isEquipmentDetailsVisible && selectedEquipment) {
      return (
        <EquipmentDetails
          equipment={selectedEquipment}
          onBack={handleEquipmentDetailsBack}
          onEdit={handleEditEquipmentClick}
        />
      );
    }

    if (isFormVisible) {
      return (
        <EquipmentForm
          equipment={selectedEquipment || undefined}
          onSave={selectedEquipment ? handleEditEquipment : handleAddEquipment}
          onCancel={handleFormCancel}
          isEditing={!!selectedEquipment}
          categories={categories}
          locations={locations}
        />
      );
    }

    if (isStackFormVisible) {
      return (
        <StackForm
          stack={selectedStack || undefined}
          equipment={equipment}
          onSave={selectedStack ? handleEditStack : handleAddStack}
          onCancel={handleStackFormCancel}
          isEditing={!!selectedStack}
        />
      );
    }

    if (isShipmentFormVisible) {
      return (
        <ShipmentForm
          shipment={selectedShipment || undefined}
          equipment={equipment}
          stacks={stacks}
          onSave={selectedShipment ? handleEditShipment : handleAddShipment}
          onCancel={handleShipmentFormCancel}
          onEquipmentView={handleViewEquipment}
          isEditing={!!selectedShipment}
        />
      );
    }

    switch (activeView) {
      case "dashboard":
        return <Dashboard stats={stats} onEquipmentSelect={handleDashboardEquipmentSelect} />;
      case "equipment":
        return (
          <EquipmentList
            equipment={equipment}
            onEdit={handleEditEquipmentClick}
            onView={handleViewEquipment}
            onDelete={handleDeleteEquipment}
          />
        );
      case "stacks":
        return (
          <StackManagement
            stacks={stacks}
            equipment={equipment}
            onStacksChange={handleStacksChange}
            onCreateStack={handleCreateStack}
            onEditStack={handleEditStackClick}
            onDeleteStack={handleDeleteStack}
          />
        );
      case "shipments":
        return (
          <ShipmentList
            shipments={shipments}
            onEdit={handleEditShipmentClick}
            onView={handleViewShipment}
            onCreate={handleCreateShipment}
            onDelete={handleDeleteShipment}
          />
        );
      case "categories":
        return (
          <CategoryManagement
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
          />
        );
      case "locations":
        return <LocationManagement />;
      case "admin":
        return user ? <AdminPanel user={user} /> : null;
      default:
        return <Dashboard stats={stats} onEquipmentSelect={handleDashboardEquipmentSelect} />;
    }
  };

  // Эффект для автоматических уведомлений
  useEffect(() => {
    if (notificationCount > 0 && activeView === "dashboard") {
      const timer = setTimeout(() => {
        toast.warning(
          `Внимание: ${notificationCount} единиц техники требует обслуживания`,
          {
            duration: 5000,
          }
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [notificationCount, activeView]);

  // Показываем ошибку базы данных, если есть
  if (dbError) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">Ошибка базы данных</h1>
          <p className="text-gray-600 text-sm sm:text-base">{dbError}</p>
        </div>
        <Toaster 
          position="top-right"
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    );
  }

  // Показываем загрузку, пока база данных не инициализирована
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-base sm:text-lg text-gray-600">Инициализация базы данных...</p>
        </div>
        <Toaster 
          position="top-right"
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    );
  }

  // Если пользователь не авторизован, показываем форму входа
  if (!user) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <AuthForm onLogin={handleLogin} />
        <Toaster 
          position="top-right"
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation 
        activeView={activeView} 
        onViewChange={handleViewChange}
        notificationCount={notificationCount}
        isDarkMode={isDarkMode}
        onThemeToggle={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="lg:pl-64">
        <main className="p-3 sm:p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Уведомления о синхронизации */}
      <SyncNotifications />

      <Toaster 
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}