import { useState, useEffect } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { EquipmentList, Equipment } from "./components/EquipmentList";
import { EquipmentForm } from "./components/EquipmentForm";
import { CategoryManagement } from "./components/CategoryManagement";
import { LocationManagement } from "./components/LocationManagement";
import { StackManagement, EquipmentStack } from "./components/StackManagement";
import { StackForm } from "./components/StackForm";
import { ShipmentList } from "./components/ShipmentList";
import { ShipmentForm } from "./components/ShipmentForm";
import { AuthForm } from "./components/AuthForm";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Импорты созданных модулей
import { mockEquipment, mockStacks, mockShipments } from "./data/mockData";
import { ExtendedShipment, ActiveView } from "./types";
import { DEFAULT_CATEGORIES, DEFAULT_LOCATIONS } from "./constants/defaults";
import { calculateStats, calculateEquipmentCountByCategory, calculateEquipmentCountByLocation } from "./utils/statistics";
import { useTheme } from "./hooks/useTheme";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const { user, handleLogin, handleLogout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);
  
  // Состояние для стеков
  const [stacks, setStacks] = useState<EquipmentStack[]>(mockStacks);
  const [selectedStack, setSelectedStack] = useState<EquipmentStack | null>(null);
  const [isStackFormVisible, setIsStackFormVisible] = useState(false);
  
  // Состояние для отгрузок
  const [shipments, setShipments] = useState<ExtendedShipment[]>(mockShipments);
  const [selectedShipment, setSelectedShipment] = useState<ExtendedShipment | null>(null);
  const [isShipmentFormVisible, setIsShipmentFormVisible] = useState(false);

  // Вычисляем статистику и счетчики
  const stats = calculateStats(equipment, stacks, shipments);
  const equipmentCountByCategory = calculateEquipmentCountByCategory(equipment);
  const equipmentCountByLocation = calculateEquipmentCountByLocation(equipment);
  const notificationCount = stats.maintenanceEquipment;

  // Обработчики для оборудования
  const handleAddEquipment = (newEquipment: Omit<Equipment, 'id'>) => {
    const equipment_item: Equipment = {
      ...newEquipment,
      id: Date.now().toString()
    };
    setEquipment(prev => [...prev, equipment_item]);
    setIsFormVisible(false);
    toast.success("Оборудование успешно добавлено");
  };

  const handleEditEquipment = (updatedEquipment: Omit<Equipment, 'id'>) => {
    if (selectedEquipment) {
      setEquipment(prev => 
        prev.map(item => 
          item.id === selectedEquipment.id 
            ? { ...updatedEquipment, id: selectedEquipment.id }
            : item
        )
      );
      setSelectedEquipment(null);
      setIsFormVisible(false);
      toast.success("Оборудование успешно обновлено");
    }
  };

  const handleViewEquipment = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsFormVisible(true);
    setActiveView("view-equipment");
  };

  const handleEditEquipmentClick = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsFormVisible(true);
    setActiveView("edit-equipment");
  };

  // Обработчики для стеков
  const handleAddStack = (newStack: Omit<EquipmentStack, 'id'>) => {
    const stack: EquipmentStack = {
      ...newStack,
      id: Date.now().toString()
    };
    setStacks(prev => [...prev, stack]);
    setIsStackFormVisible(false);
    toast.success("Стек успешно создан");
  };

  const handleEditStack = (updatedStack: Omit<EquipmentStack, 'id'>) => {
    if (selectedStack) {
      setStacks(prev => 
        prev.map(item => 
          item.id === selectedStack.id 
            ? { ...updatedStack, id: selectedStack.id }
            : item
        )
      );
      setSelectedStack(null);
      setIsStackFormVisible(false);
      toast.success("Стек успешно обновлен");
    }
  };

  const handleEditStackClick = (stack: EquipmentStack) => {
    setSelectedStack(stack);
    setIsStackFormVisible(true);
    setActiveView("edit-stack");
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

  const handleStacksChange = (newStacks: EquipmentStack[]) => {
    setStacks(newStacks);
  };

  // Обработчики для отгрузок
  const handleAddShipment = (newShipment: Omit<ExtendedShipment, 'id'>) => {
    const shipment: ExtendedShipment = {
      ...newShipment,
      id: Date.now().toString()
    };
    setShipments(prev => [...prev, shipment]);
    setIsShipmentFormVisible(false);
    toast.success("Отгрузка успешно создана");
  };

  const handleEditShipment = (updatedShipment: Omit<ExtendedShipment, 'id'>) => {
    if (selectedShipment) {
      setShipments(prev => 
        prev.map(item => 
          item.id === selectedShipment.id 
            ? { ...updatedShipment, id: selectedShipment.id }
            : item
        )
      );
      setSelectedShipment(null);
      setIsShipmentFormVisible(false);
      toast.success("Отгрузка успешно обновлена");
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
    setSelectedEquipment(null);
    setActiveView("equipment");
  };

  const handleCategoriesChange = (newCategories: string[]) => {
    setCategories(newCategories);
  };

  const handleLocationsChange = (newLocations: string[]) => {
    setLocations(newLocations);
  };

  const renderContent = () => {
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
          isEditing={!!selectedShipment}
        />
      );
    }

    switch (activeView) {
      case "dashboard":
        return <Dashboard stats={stats} />;
      case "equipment":
        return (
          <EquipmentList
            equipment={equipment}
            onEdit={handleEditEquipmentClick}
            onView={handleViewEquipment}
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
          />
        );
      case "shipments":
        return (
          <ShipmentList
            shipments={shipments}
            equipment={equipment}
            onEdit={handleEditShipmentClick}
            onView={handleViewShipment}
            onCreate={handleCreateShipment}
          />
        );
      case "categories":
        return (
          <CategoryManagement
            categories={categories}
            onCategoriesChange={handleCategoriesChange}
            equipmentCount={equipmentCountByCategory}
          />
        );
      case "locations":
        return (
          <LocationManagement
            locations={locations}
            onLocationsChange={handleLocationsChange}
            equipmentCount={equipmentCountByLocation}
          />
        );
      default:
        return <Dashboard stats={stats} />;
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
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <Toaster 
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
      />
    </div>
  );
}