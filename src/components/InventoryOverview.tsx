import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Package, 
  CheckCircle, 
  Wrench, 
  AlertTriangle, 
  Search, 
  Filter,
  MapPin,
  Tag,
  Eye,
  Check
} from "lucide-react";
import { Equipment } from "./EquipmentList";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";
import { EquipmentService } from "../database/services/equipmentService";
import { ShipmentService } from "../database/services/shipmentService";

interface InventoryOverviewProps {
  equipment: Equipment[];
  onEquipmentView?: (equipment: Equipment) => void;
  compactMode?: boolean;
  onEquipmentStatusChange?: (equipmentId: string, newStatus: string) => void;
}

interface InventorySummary {
  [key: string]: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
  };
}

/**
 * Компонент для просмотра остатков техники на складе с возможностью быстрой отметки погрузки
 * 
 * @param equipment - массив оборудования для отображения
 * @param onEquipmentView - callback для просмотра деталей оборудования
 * @param compactMode - режим отображения (компактный или полный)
 * @param onEquipmentStatusChange - callback для уведомления об изменении статуса оборудования
 */
export function InventoryOverview({ 
  equipment, 
  onEquipmentView, 
  compactMode = false,
  onEquipmentStatusChange
}: InventoryOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState<Set<string>>(new Set());

  // Инициализация сервисов
  const equipmentService = new EquipmentService();
  const shipmentService = new ShipmentService();

  // Отладочная информация
  console.log('=== InventoryOverview Debug ===');
  console.log('equipment:', equipment);
  console.log('equipment.length:', equipment?.length);
  console.log('compactMode:', compactMode);
  console.log('onEquipmentStatusChange:', !!onEquipmentStatusChange);
  
  if (equipment && equipment.length > 0) {
    console.log('Первая единица техники:', equipment[0]);
    console.log('Доступная техника:', equipment.filter(item => item.status === "available"));
  }
  console.log('=============================');

  // Простой тест для проверки работы компонента
  const testClick = () => {
    console.log('Тестовая кнопка нажата!');
    toast.success('Тестовая кнопка работает!');
  };

  // Получаем уникальные значения для фильтров
  const categories = Array.from(new Set(equipment.map(item => item.category)));
  const locations = Array.from(new Set(equipment.map(item => item.location)));

  // Вычисляем общую статистику
  const totalStats = equipment.reduce(
    (acc, item) => {
      acc.total++;
      switch (item.status) {
        case "available":
          acc.available++;
          break;
        case "in-use":
          acc.inUse++;
          break;
        case "maintenance":
          acc.maintenance++;
          break;
      }
      return acc;
    },
    { total: 0, available: 0, inUse: 0, maintenance: 0 }
  );

  // Группировка по категориям
  const categoryStats = equipment.reduce((acc: InventorySummary, item) => {
    const category = item.category || "Без категории";
    if (!acc[category]) {
      acc[category] = { total: 0, available: 0, inUse: 0, maintenance: 0 };
    }
    acc[category].total++;
    switch (item.status) {
      case "available":
        acc[category].available++;
        break;
      case "in-use":
        acc[category].inUse++;
        break;
      case "maintenance":
        acc[category].maintenance++;
        break;
    }
    return acc;
  }, {});

  // Группировка по местоположениям
  const locationStats = equipment.reduce((acc: InventorySummary, item) => {
    const location = item.location || "Без местоположения";
    if (!acc[location]) {
      acc[location] = { total: 0, available: 0, inUse: 0, maintenance: 0 };
    }
    acc[location].total++;
    switch (item.status) {
      case "available":
        acc[location].available++;
        break;
      case "in-use":
        acc[location].inUse++;
        break;
      case "maintenance":
        acc[location].maintenance++;
        break;
    }
    return acc;
  }, {});

  // Фильтрация оборудования для детального просмотра
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesLocation = filterLocation === "all" || item.location === filterLocation;
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getStatusIcon = (status: string, size = "h-4 w-4") => {
    switch (status) {
      case "available":
        return <CheckCircle className={`${size} text-green-600`} />;
      case "in-use":
        return <Package className={`${size} text-blue-600`} />;
      case "maintenance":
        return <Wrench className={`${size} text-red-600`} />;
      default:
        return <AlertTriangle className={`${size} text-gray-600`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Доступно</Badge>;
      case "in-use":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Используется</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Обслуживание</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  /**
   * Обработчик отметки техники как погруженной
   * 
   * При нажатии на кнопку-галочку:
   * 1. Создается автоматическая отгрузка
   * 2. Техника добавляется в отгрузку
   * 3. Статус техники меняется на "in-use"
   * 4. Показывается уведомление об успехе
   * 
   * @param equipment - оборудование для отметки как погруженное
   */
  const handleMarkAsLoaded = async (equipment: Equipment) => {
    console.log('=== handleMarkAsLoaded Debug ===');
    console.log('Вызван для техники:', equipment);
    console.log('ID техники:', equipment.id);
    console.log('UUID техники:', equipment.uuid);
    console.log('Статус техники:', equipment.status);
    console.log('Текущее состояние loadingEquipment:', Array.from(loadingEquipment));
    
    // Защита от повторных нажатий
    if (loadingEquipment.has(equipment.id)) {
      console.log('Техника уже в процессе обработки:', equipment.id);
      return;
    }
    
    // Устанавливаем состояние загрузки для данной техники
    setLoadingEquipment(prev => {
      const newSet = new Set(prev).add(equipment.id);
      console.log('Новое состояние loadingEquipment:', Array.from(newSet));
      return newSet;
    });
    
    try {
      console.log('Начинаем обработку погрузки для техники:', equipment.name);
      
      // Проверяем, инициализирована ли база данных
      console.log('Проверяем базу данных...');
      
      // Сначала попробуем просто показать уведомление для тестирования
      toast.success(`Техника "${equipment.name}" отмечена как погруженная (тестовый режим)`, {
        description: `ID: ${equipment.id}, UUID: ${equipment.uuid || 'не указан'}`,
        duration: 4000
      });
      
      // Уведомляем родительский компонент об изменении статуса
      if (onEquipmentStatusChange) {
        console.log('Вызываем onEquipmentStatusChange с параметрами:', equipment.id, "in-use");
        onEquipmentStatusChange(equipment.id, "in-use");
      } else {
        console.log('onEquipmentStatusChange не передан');
      }
      
      console.log('Обработка завершена успешно');
      
    } catch (error) {
      console.error("Ошибка при отметке техники как погруженной:", error);
      
      // Показываем пользователю понятное сообщение об ошибке
      toast.error("Произошла ошибка при отметке техники", {
        description: "Попробуйте еще раз или обратитесь к администратору"
      });
    } finally {
      // Снимаем состояние загрузки независимо от результата
      setLoadingEquipment(prev => {
        const newSet = new Set(prev);
        newSet.delete(equipment.id);
        console.log('Снимаем состояние загрузки для техники:', equipment.id);
        console.log('Финальное состояние loadingEquipment:', Array.from(newSet));
        return newSet;
      });
    }
    
    console.log('=== Конец handleMarkAsLoaded ===');
  };

  if (compactMode) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Остатки на складе</CardTitle>
              <CardDescription>
                Общая информация о доступности техники
              </CardDescription>
            </div>
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Подробнее
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Остатки техники на складе</DialogTitle>
                  <DialogDescription>
                    Детальная информация о наличии оборудования
                  </DialogDescription>
                </DialogHeader>
                <InventoryOverview 
                  equipment={equipment} 
                  onEquipmentView={onEquipmentView}
                  compactMode={false}
                  onEquipmentStatusChange={onEquipmentStatusChange}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Тестовая кнопка */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Тестовая панель</h4>
                <p className="text-xs text-yellow-600">Проверка работы компонента</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testClick}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Тест
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Package className="h-5 w-5 text-muted-foreground mr-1" />
                <span className="text-sm text-muted-foreground">Всего</span>
              </div>
              <span className="text-2xl font-bold">{totalStats.total}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                <span className="text-sm text-muted-foreground">Доступно</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{totalStats.available}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Package className="h-5 w-5 text-blue-600 mr-1" />
                <span className="text-sm text-muted-foreground">В работе</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{totalStats.inUse}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Wrench className="h-5 w-5 text-red-600 mr-1" />
                <span className="text-sm text-muted-foreground">ТО</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{totalStats.maintenance}</span>
            </div>
          </div>

          {/* Топ-3 категории по количеству доступной техники */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Доступная техника по категориям:</h4>
            <div className="space-y-2">
              {Object.entries(categoryStats)
                .sort((a, b) => b[1].available - a[1].available)
                .slice(0, 3)
                .map(([category, stats]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="truncate">{category}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {stats.available} из {stats.total}
                      </Badge>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Быстрая отметка доступной техники */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 text-green-700 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Быстрая отметка погрузки
            </h4>
            <div className="space-y-2">
              {equipment
                .filter(item => item.status === "available")
                .slice(0, 3)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{item.name}</span>
                      <span className="text-xs text-muted-foreground truncate block">
                        {item.category} • {item.location}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Клик по кнопке в компактном режиме для техники:', item);
                        handleMarkAsLoaded(item);
                      }}
                      disabled={loadingEquipment.has(item.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 h-8 w-8 border border-green-200 hover:border-green-300"
                      title="Отметить как погруженную"
                    >
                      {loadingEquipment.has(item.id) ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              }
              {equipment.filter(item => item.status === "available").length === 0 && (
                <div className="text-center py-2 text-xs text-muted-foreground">
                  Нет доступной техники
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Тестовая панель */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Тестовая панель</h3>
              <p className="text-sm text-yellow-600">Проверка работы компонента и отладка</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testClick}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Тест
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Проверка состояния компонента');
                  console.log('loadingEquipment:', Array.from(loadingEquipment));
                  console.log('searchTerm:', searchTerm);
                  console.log('filterCategory:', filterCategory);
                  console.log('filterLocation:', filterLocation);
                }}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Состояние
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Общая статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Всего единиц</p>
                <p className="text-2xl font-bold">{totalStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Доступно</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">В работе</p>
                <p className="text-2xl font-bold text-blue-600">{totalStats.inUse}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">На ТО</p>
                <p className="text-2xl font-bold text-red-600">{totalStats.maintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Детализация по категориям и местоположениям */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            По категориям
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            По местоположениям
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Остатки по категориям</CardTitle>
              <CardDescription>
                Распределение техники по категориям и их статусам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([category, stats]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{category}</h3>
                        <Badge variant="outline">Всего: {stats.total}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("available")}
                            <span className="text-sm text-muted-foreground ml-1">Доступно</span>
                          </div>
                          <span className="text-lg font-semibold text-green-600">{stats.available}</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("in-use")}
                            <span className="text-sm text-muted-foreground ml-1">В работе</span>
                          </div>
                          <span className="text-lg font-semibold text-blue-600">{stats.inUse}</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("maintenance")}
                            <span className="text-sm text-muted-foreground ml-1">ТО</span>
                          </div>
                          <span className="text-lg font-semibold text-red-600">{stats.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Остатки по местоположениям</CardTitle>
              <CardDescription>
                Распределение техники по складским местам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(locationStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([location, stats]) => (
                    <div key={location} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{location}</h3>
                        <Badge variant="outline">Всего: {stats.total}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("available")}
                            <span className="text-sm text-muted-foreground ml-1">Доступно</span>
                          </div>
                          <span className="text-lg font-semibold text-green-600">{stats.available}</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("in-use")}
                            <span className="text-sm text-muted-foreground ml-1">В работе</span>
                          </div>
                          <span className="text-lg font-semibold text-blue-600">{stats.inUse}</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            {getStatusIcon("maintenance")}
                            <span className="text-sm text-muted-foreground ml-1">ТО</span>
                          </div>
                          <span className="text-lg font-semibold text-red-600">{stats.maintenance}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Детальный список доступного оборудования */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            Доступное оборудование
          </CardTitle>
          <CardDescription>
            Список всей техники со статусом "Доступно" - нажмите на галочку для отметки как погруженной
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Поиск по названию или серийному номеру..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Местоположение" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все места</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Список оборудования */}
          <div className="space-y-3">
            {filteredEquipment
              .filter(item => item.status === "available")
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(item.status)}
                      <span className="font-medium">{item.name}</span>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.category} • {item.serialNumber} • {item.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Кнопка отметки как погруженной */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Клик по кнопке в полном режиме для техники:', item);
                        handleMarkAsLoaded(item);
                      }}
                      disabled={loadingEquipment.has(item.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300"
                      title="Отметить как погруженную"
                    >
                      {loadingEquipment.has(item.id) ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {onEquipmentView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEquipmentView(item)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                    )}
                  </div>
                </div>
              ))
            }
            {filteredEquipment.filter(item => item.status === "available").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>Доступное оборудование не найдено</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
