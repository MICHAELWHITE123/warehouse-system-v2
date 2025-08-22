import { useState, useEffect } from "react";
import { Plus, Search, Eye, Edit, Truck, Clock, CheckCircle, XCircle, Filter, Package, Users, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

import { ShipmentDetailsModal } from "./ShipmentDetailsModal";
import { ShipmentPDFGenerator } from "./ShipmentPDFGenerator";
import { QRScanner } from "./QRScanner";

export interface ShipmentEquipment {
  equipmentId: string;
  name: string;
  serialNumber: string;
  quantity: number;
}

export interface RentalItem {
  id: string;
  equipment: string;
  quantity: number;
  link: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  isRequired: boolean;
}

export interface ShipmentStack {
  stackId: string;
  name: string;
  equipmentIds: string[];
  quantity: number;
}

export interface Shipment {
  id: string;
  number: string;
  date: string;
  recipient: string;
  recipientAddress: string;
  status: "pending" | "in-progress" | "in-transit" | "delivered" | "cancelled";
  responsiblePerson: string;
  equipment: ShipmentEquipment[];
  stacks?: ShipmentStack[];
  rental?: RentalItem[];
  totalItems: number;
  comments?: string;
  createdAt: string;
  deliveredAt?: string;
  checklist?: ChecklistItem[];
}

interface ShipmentListProps {
  shipments: Shipment[];
  onEdit: (shipment: Shipment) => void;
  onView: (shipment: Shipment) => void;
  onCreate: () => void;
}

// Компонент для отображения краткой информации об оборудовании и стеках
function ShipmentSummary({ 
  shipment, 
  loadedEquipment, 
  loadedStacks
}: { 
  shipment: Shipment;
  loadedEquipment: Set<string>;
  loadedStacks: Set<string>;

}) {
  const equipmentCount = shipment.equipment.length;
  const stacksCount = shipment.stacks?.length || 0;
  
  // Получаем названия первых нескольких единиц оборудования
  const firstEquipment = shipment.equipment.slice(0, 2);
  const equipmentNames = firstEquipment.map(item => item.name).join(', ');
  const remainingEquipment = equipmentCount > 2 ? ` +${equipmentCount - 2}` : '';
  
  // Получаем названия стеков
  const stackNames = shipment.stacks?.map(stack => stack.name).join(', ') || '';
  
  return (
    <div className="text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-1">
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>Оборудование ({equipmentCount})</span>
        </div>
        {equipmentCount > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
            Погружено: {loadedEquipment.size}/{equipmentCount}
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground break-words">
        {equipmentNames}{remainingEquipment}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-2">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>Стеки техники ({stacksCount})</span>
        </div>
        {stacksCount > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
            Погружено: {loadedStacks.size}/{stacksCount}
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground break-words">
        {stackNames || 'Стеки не добавлены'}
      </div>
    </div>
  );
}

export function ShipmentList({ shipments, onEdit, onCreate }: ShipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedShipmentForQR, setSelectedShipmentForQR] = useState<Shipment | null>(null);
  // Изменяем структуру: храним состояние для каждой отгрузки отдельно
  const [loadedEquipmentByShipment, setLoadedEquipmentByShipment] = useState<Record<string, Set<string>>>({});
  const [loadedStacksByShipment, setLoadedStacksByShipment] = useState<Record<string, Set<string>>>({});

  // Инициализация состояния для каждой отгрузки при загрузке данных
  useEffect(() => {
    // Пытаемся загрузить сохраненное состояние из localStorage
    const savedLoadedEquipment = localStorage.getItem('loadedEquipmentByShipment');
    const savedLoadedStacks = localStorage.getItem('loadedStacksByShipment');
    
    let initialLoadedEquipment: Record<string, Set<string>> = {};
    let initialLoadedStacks: Record<string, Set<string>> = {};
    
    if (savedLoadedEquipment) {
      try {
        const parsed = JSON.parse(savedLoadedEquipment);
        // Преобразуем обратно в Set для каждого ключа
        Object.keys(parsed).forEach(key => {
          initialLoadedEquipment[key] = new Set(parsed[key]);
        });
      } catch (e) {
        console.warn('Ошибка при загрузке состояния загрузки оборудования:', e);
      }
    }
    
    if (savedLoadedStacks) {
      try {
        const parsed = JSON.parse(savedLoadedStacks);
        Object.keys(parsed).forEach(key => {
          initialLoadedStacks[key] = new Set(parsed[key]);
        });
      } catch (e) {
        console.warn('Ошибка при загрузке состояния загрузки стеков:', e);
      }
    }
    
    // Инициализируем состояние для новых отгрузок
    shipments.forEach(shipment => {
      if (!initialLoadedEquipment[shipment.id]) {
        initialLoadedEquipment[shipment.id] = new Set();
      }
      if (!initialLoadedStacks[shipment.id]) {
        initialLoadedStacks[shipment.id] = new Set();
      }
    });
    
    setLoadedEquipmentByShipment(initialLoadedEquipment);
    setLoadedStacksByShipment(initialLoadedStacks);
  }, [shipments]);

  // Обновляем состояние при добавлении новых отгрузок
  useEffect(() => {
    setLoadedEquipmentByShipment(prev => {
      const newState = { ...prev };
      let hasChanges = false;
      
      shipments.forEach(shipment => {
        if (!newState[shipment.id]) {
          newState[shipment.id] = new Set();
          hasChanges = true;
        }
      });
      
      return hasChanges ? newState : prev;
    });
    
    setLoadedStacksByShipment(prev => {
      const newState = { ...prev };
      let hasChanges = false;
      
      shipments.forEach(shipment => {
        if (!newState[shipment.id]) {
          newState[shipment.id] = new Set();
          hasChanges = true;
        }
      });
      
      return hasChanges ? newState : prev;
    });
  }, [shipments]);

  // Фильтрация отгрузок
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Ожидает</Badge>;
      case "in-progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">В работе</Badge>;
      case "in-transit":
        return <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">В пути</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Доставлено</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменено</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case "in-progress":
        return <Truck className="h-6 w-6 text-blue-600" />;
      case "in-transit":
        return <Truck className="h-6 w-6 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
    }
  };

  const handleViewShipment = (shipment: Shipment) => {
    if (!shipment) return;
    
    console.log('=== handleViewShipment Debug ===');
    console.log('clicking on shipment:', shipment);
    console.log('shipment.equipment:', shipment.equipment);
    console.log('shipment.stacks:', shipment.stacks);
    console.log('shipment.rental:', shipment.rental);
    console.log('================================');
    setSelectedShipment(shipment);
    setIsViewDialogOpen(true);
  };

  // Обработчики изменения состояния загрузки
  const handleEquipmentLoadedChange = (shipmentId: string, equipmentId: string, isLoaded: boolean) => {
    setLoadedEquipmentByShipment(prev => {
      const newState = { ...prev };
      if (!newState[shipmentId]) {
        newState[shipmentId] = new Set();
      }
      
      if (isLoaded) {
        newState[shipmentId].add(equipmentId);
      } else {
        newState[shipmentId].delete(equipmentId);
      }
      
      // Сохраняем в localStorage
      const serialized = JSON.stringify(
        Object.fromEntries(
          Object.entries(newState).map(([key, value]) => [key, Array.from(value)])
        )
      );
      localStorage.setItem('loadedEquipmentByShipment', serialized);
      
      return newState;
    });
  };

  const handleStackLoadedChange = (shipmentId: string, stackId: string, isLoaded: boolean) => {
    setLoadedStacksByShipment(prev => {
      const newState = { ...prev };
      if (!newState[shipmentId]) {
        newState[shipmentId] = new Set();
      }
      
      if (isLoaded) {
        newState[shipmentId].add(stackId);
      } else {
        newState[shipmentId].delete(stackId);
      }
      
      // Сохраняем в localStorage
      const serialized = JSON.stringify(
        Object.fromEntries(
          Object.entries(newState).map(([key, value]) => [key, Array.from(value)])
        )
      );
      localStorage.setItem('loadedStacksByShipment', serialized);
      
      return newState;
    });
  };

  // Обработчики для QR сканера
  const handleEquipmentLoadedFromQR = (equipmentId: string, isLoaded: boolean, loadedBy: string) => {
    if (selectedShipmentForQR) {
      handleEquipmentLoadedChange(selectedShipmentForQR.id, equipmentId, isLoaded);
    }
  };

  const handleStackLoadedFromQR = (stackId: string, isLoaded: boolean, loadedBy: string) => {
    if (selectedShipmentForQR) {
      handleStackLoadedChange(selectedShipmentForQR.id, stackId, isLoaded);
    }
  };

  const openQRScanner = (shipment: Shipment) => {
    setSelectedShipmentForQR(shipment);
    setIsQRScannerOpen(true);
  };

  // Вычисление статистики
  const totalShipments = shipments.length;
  const pendingShipments = shipments.filter(s => s.status === "pending").length;
  const inTransitShipments = shipments.filter(s => s.status === "in-transit").length;
  const deliveredShipments = shipments.filter(s => s.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Отгрузки</h1>
          <p className="text-muted-foreground mt-2">
            Управление отгрузочными листами и доставкой оборудования
          </p>
        </div>
        <Button onClick={onCreate} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Создать отгрузку
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Всего отгрузок</p>
                <p className="text-lg sm:text-2xl font-bold">{totalShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Ожидают</p>
                <p className="text-lg sm:text-2xl font-bold">{pendingShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">В пути</p>
                <p className="text-lg sm:text-2xl font-bold">{inTransitShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Доставлено</p>
                <p className="text-lg sm:text-2xl font-bold">{deliveredShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск по номеру, получателю или ответственному..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Фильтр по статусу" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="in-progress">В работе</SelectItem>
            <SelectItem value="in-transit">В пути</SelectItem>
            <SelectItem value="delivered">Доставлено</SelectItem>
            <SelectItem value="cancelled">Отменено</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список отгрузок */}
      {filteredShipments.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {shipments.length === 0 ? "Отгрузки не созданы" : "Отгрузки не найдены"}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              {shipments.length === 0 
                ? "Создайте первую отгрузку для отправки оборудования"
                : "Попробуйте изменить поисковый запрос или фильтры"
              }
            </p>
            {shipments.length === 0 && (
              <Button onClick={onCreate} className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Создать первую отгрузку
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => {
            return (
              <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4 lg:gap-6">
                    {/* Левая часть - основная информация */}
                    <div className="flex items-start gap-4 flex-1 w-full lg:w-auto">
                      {/* Иконка статуса */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(shipment.status)}
                      </div>
                      
                      {/* Номер и получатель */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{shipment.number}</h3>
                          {getStatusBadge(shipment.status)}
                        </div>
                        <p className="text-muted-foreground text-sm">{shipment.recipient}</p>
                      </div>
                    </div>

                    {/* Центральная часть - статистика */}
                    <div className="flex flex-row lg:flex-col gap-4 lg:gap-6 flex-shrink-0 w-full lg:w-auto justify-between lg:justify-start">
                      {/* Всего позиций */}
                      <div className="text-center lg:text-left">
                        <p className="text-sm text-muted-foreground">Всего позиций</p>
                        <p className="font-medium text-lg">{shipment.totalItems}</p>
                      </div>

                      {/* Ответственный */}
                      <div className="text-center lg:text-left">
                        <p className="text-sm text-muted-foreground">Ответственный</p>
                        <p className="font-medium">{shipment.responsiblePerson}</p>
                      </div>

                      {/* Статус погрузки */}
                      <div className="text-center lg:text-left">
                        <p className="text-sm text-muted-foreground">Погрузка</p>
                        <div className="flex items-center gap-1 justify-center lg:justify-start">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">
                            {loadedEquipmentByShipment[shipment.id]?.size || 0} + {loadedStacksByShipment[shipment.id]?.size || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Информация об оборудовании и стеках */}
                    <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[200px]">
                      <ShipmentSummary 
                        shipment={shipment}
                        loadedEquipment={loadedEquipmentByShipment[shipment.id] || new Set()}
                        loadedStacks={loadedStacksByShipment[shipment.id] || new Set()}
                      />
                    </div>

                    {/* Правая часть - действия */}
                    <div className="flex flex-col items-start lg:items-end gap-4 flex-shrink-0 w-full lg:w-auto">
                      {/* Кнопки действий */}
                      <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openQRScanner(shipment)}
                          className="h-8 px-3 w-full sm:w-auto"
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          QR
                        </Button>
                        <ShipmentPDFGenerator 
                          shipment={shipment} 
                          equipment={[]}
                          className="h-8 px-3 w-full sm:w-auto"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewShipment(shipment)}
                          className="h-8 px-3 w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(shipment)}
                          className="h-8 px-3 w-full sm:w-auto"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Button>
                      </div>

                      {/* Дата создания */}
                      <div className="text-xs text-muted-foreground w-full lg:w-auto text-center lg:text-right">
                        {new Date(shipment.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Модальное окно просмотра отгрузки */}
      {selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          equipment={[]}
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          loadedEquipment={loadedEquipmentByShipment[selectedShipment.id] || new Set()}
          loadedStacks={loadedStacksByShipment[selectedShipment.id] || new Set()}
          onEquipmentLoadedChange={handleEquipmentLoadedChange}
          onStackLoadedChange={handleStackLoadedChange}
        />
      )}

      {/* QR сканер */}
      {selectedShipmentForQR && (
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={() => {
            setIsQRScannerOpen(false);
            setSelectedShipmentForQR(null);
          }}
          shipment={selectedShipmentForQR}
          onEquipmentLoaded={handleEquipmentLoadedFromQR}
          onStackLoaded={handleStackLoadedFromQR}
          loadedEquipment={loadedEquipmentByShipment[selectedShipmentForQR.id] || new Set()}
          loadedStacks={loadedStacksByShipment[selectedShipmentForQR.id] || new Set()}
        />
      )}
    </div>
  );
}