import { useState } from "react";
import { Plus, Search, Eye, Edit, Truck, Package, Clock, CheckCircle, XCircle, Users, Filter } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { Equipment } from "./EquipmentList";
import { ShipmentDetailsModal } from "./ShipmentDetailsModal";

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
  description: string;
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
  equipment: Equipment[];
  onEdit: (shipment: Shipment) => void;
  onView: (shipment: Shipment) => void;
  onCreate: () => void;
}

export function ShipmentList({ shipments, equipment, onEdit, onView, onCreate }: ShipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Фильтрация отгрузок
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.responsiblePerson.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Получение информации об оборудовании
  const getEquipmentInfo = (equipmentId: string) => {
    return equipment.find(item => item.id === equipmentId);
  };

  // Получение информации о стеке
  const getStackEquipmentNames = (stack: ShipmentStack) => {
    const equipmentNames = stack.equipmentIds
      .map(id => {
        const item = getEquipmentInfo(id);
        return item ? item.name : "Неизвестное оборудование";
      })
      .slice(0, 3);
    
    return equipmentNames.join(", ") + (stack.equipmentIds.length > 3 ? ` +${stack.equipmentIds.length - 3}` : "");
  };

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
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <Package className="h-4 w-4" />;
      case "in-transit":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsViewDialogOpen(true);
  };

  // Вычисление статистики
  const totalShipments = shipments.length;
  const pendingShipments = shipments.filter(s => s.status === "pending").length;
  const inTransitShipments = shipments.filter(s => s.status === "in-transit").length;
  const deliveredShipments = shipments.filter(s => s.status === "delivered").length;

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Отгрузки</h1>
          <p className="text-muted-foreground mt-2">
            Управление отгрузочными листами и доставкой оборудования
          </p>
        </div>
        <Button onClick={onCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Создать отгрузку
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Всего отгрузок</p>
                <p className="text-2xl font-bold">{totalShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ожидают</p>
                <p className="text-2xl font-bold">{pendingShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">В пути</p>
                <p className="text-2xl font-bold">{inTransitShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Доставлено</p>
                <p className="text-2xl font-bold">{deliveredShipments}</p>
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
          <CardContent className="p-12 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {shipments.length === 0 ? "Отгрузки не созданы" : "Отгрузки не найдены"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {shipments.length === 0 
                ? "Создайте первую отгрузку для отправки оборудования"
                : "Попробуйте изменить поисковый запрос или фильтры"
              }
            </p>
            {shipments.length === 0 && (
              <Button onClick={onCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать первую отгрузку
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      {getStatusIcon(shipment.status)}
                      {shipment.number}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {shipment.recipient}
                    </CardDescription>
                  </div>
                  {getStatusBadge(shipment.status)}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Основная информация */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Дата отгрузки</p>
                      <p className="font-medium">{new Date(shipment.date).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Всего позиций</p>
                      <p className="font-medium">{shipment.totalItems}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Ответственный</p>
                      <p className="font-medium">{shipment.responsiblePerson}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Содержимое отгрузки */}
                  <div className="space-y-3">
                    {/* Отдельное оборудование */}
                    {shipment.equipment.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          Оборудование ({shipment.equipment.length})
                        </p>
                        <div className="space-y-1">
                          {shipment.equipment.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm flex items-center justify-between">
                              <span className="truncate">{item.name}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                x{item.quantity}
                              </Badge>
                            </div>
                          ))}
                          {shipment.equipment.length > 2 && (
                            <p className="text-sm text-muted-foreground">
                              +{shipment.equipment.length - 2} позиций
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Стеки техники */}
                    {shipment.stacks && shipment.stacks.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Стеки ({shipment.stacks.length})
                        </p>
                        <div className="space-y-1">
                          {shipment.stacks.slice(0, 2).map((stack, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium truncate">{stack.name}</span>
                                <Badge variant="outline" className="text-xs ml-2">
                                  x{stack.quantity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {getStackEquipmentNames(stack)}
                              </p>
                            </div>
                          ))}
                          {shipment.stacks.length > 2 && (
                            <p className="text-sm text-muted-foreground">
                              +{shipment.stacks.length - 2} стеков
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Аренда */}
                    {shipment.rental && shipment.rental.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Аренда ({shipment.rental.length})
                        </p>
                        <div className="space-y-1">
                          {shipment.rental.slice(0, 1).map((item, index) => (
                            <div key={index} className="text-sm flex items-center justify-between">
                              <span className="truncate">{item.equipment}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                x{item.quantity}
                              </Badge>
                            </div>
                          ))}
                          {shipment.rental.length > 1 && (
                            <p className="text-sm text-muted-foreground">
                              +{shipment.rental.length - 1} позиций
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewShipment(shipment)}
                        className="h-8 px-3"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(shipment)}
                        className="h-8 px-3"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(shipment.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно просмотра отгрузки */}
      <ShipmentDetailsModal
        shipment={selectedShipment}
        equipment={equipment}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      />
    </div>
  );
}