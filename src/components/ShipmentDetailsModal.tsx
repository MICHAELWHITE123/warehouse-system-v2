import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  Package, 
  Users, 
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Equipment } from "./EquipmentList";
import { Shipment } from "./ShipmentList";

interface ShipmentDetailsModalProps {
  shipment: Shipment | null;
  equipment?: Equipment[];
  isOpen: boolean;
  onClose: () => void;
  loadedEquipment?: Set<string>;
  loadedStacks?: Set<string>;
  onEquipmentLoadedChange?: (shipmentId: string, equipmentId: string, isLoaded: boolean) => void;
  onStackLoadedChange?: (shipmentId: string, stackId: string, isLoaded: boolean) => void;
}

export function ShipmentDetailsModal({
  shipment,
  equipment = [],
  isOpen,
  onClose,
  loadedEquipment = new Set(),
  loadedStacks = new Set(),
  onEquipmentLoadedChange,
  onStackLoadedChange
}: ShipmentDetailsModalProps) {
  // Если отгрузка не выбрана, не рендерим модальное окно
  if (!shipment) return null;

  const [localLoadedEquipment, setLocalLoadedEquipment] = useState<Set<string>>(new Set());
  const [localLoadedStacks, setLocalLoadedStacks] = useState<Set<string>>(new Set());

  // Инициализация состояния
  useEffect(() => {
    if (shipment) {
      setLocalLoadedEquipment(new Set(loadedEquipment));
      setLocalLoadedStacks(new Set(loadedStacks));
    }
  }, [shipment, loadedEquipment, loadedStacks]);

  // Синхронизация локального состояния с пропсами
  useEffect(() => {
    if (shipment && loadedEquipment) {
      setLocalLoadedEquipment(new Set(loadedEquipment));
    }
  }, [shipment, loadedEquipment]);

  useEffect(() => {
    if (shipment && loadedStacks) {
      setLocalLoadedStacks(new Set(loadedStacks));
    }
  }, [shipment, loadedStacks]);

  const handleEquipmentLoaded = (equipmentId: string, isLoaded: boolean) => {
    setLocalLoadedEquipment(prev => {
      const newSet = new Set(prev);
      if (isLoaded) {
        newSet.add(equipmentId);
      } else {
        newSet.delete(equipmentId);
      }
      return newSet;
    });
    
    // Вызываем callback для обновления состояния в родительском компоненте
    if (onEquipmentLoadedChange) {
      onEquipmentLoadedChange(shipment.id, equipmentId, isLoaded);
    }
    
    toast.success(
      isLoaded 
        ? `Техника отмечена как погруженная` 
        : `Техника отмечена как не погруженная`
    );
  };

  const handleStackLoaded = (stackId: string, isLoaded: boolean) => {
    setLocalLoadedStacks(prev => {
      const newSet = new Set(prev);
      if (isLoaded) {
        newSet.add(stackId);
      } else {
        newSet.delete(stackId);
      }
      return newSet;
    });
    
    // Вызываем callback для обновления состояния в родительском компоненте
    if (onStackLoadedChange) {
      onStackLoadedChange(shipment.id, stackId, isLoaded);
    }
    
    toast.success(
      isLoaded 
        ? `Стек отмечен как погруженный` 
        : `Стек отмечен как не погруженный`
    );
  };

  const getEquipmentInfo = (equipmentId: string) => {
    return equipment?.find(item => item.id === equipmentId);
  };

  const getStackEquipment = (stackIds: string[]) => {
    return equipment?.filter(item => stackIds.includes(item.id)) || [];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ожидает</Badge>;
      case "in-progress":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">В работе</Badge>;
      case "in-transit":
        return <Badge variant="default" className="bg-purple-100 text-purple-800">В пути</Badge>;
      case "delivered":
        return <Badge variant="default" className="bg-green-100 text-green-800">Доставлено</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменено</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Отгрузка #{shipment.number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Информация об отгрузке</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Номер отгрузки</p>
                  <p className="font-medium">{shipment.number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  {getStatusBadge(shipment.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Получатель</p>
                  <p className="font-medium">{shipment.recipient}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
                  <p className="font-medium">{new Date(shipment.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Оборудование */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Оборудование ({shipment.equipment.length} позиций)
              </div>
              {localLoadedEquipment.size > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                  Погружено: {localLoadedEquipment.size}/{shipment.equipment.length}
                </Badge>
              )}
            </h3>
            {shipment.equipment.length > 0 ? (
              <div className="space-y-3">
                {shipment.equipment.map((item, index) => {
                  const equipmentInfo = getEquipmentInfo(item.equipmentId);
                  const isLoaded = localLoadedEquipment.has(item.equipmentId);
                  return (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
                      <Checkbox 
                        checked={isLoaded} 
                        onCheckedChange={(checked) => handleEquipmentLoaded(item.equipmentId, checked || false)}
                        className="mt-1 sm:mt-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h4 className="font-medium text-green-700 truncate">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              x{item.quantity}
                            </Badge>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        {equipmentInfo?.serialNumber && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">
                            Серийный номер: {equipmentInfo.serialNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Оборудование не добавлено</p>
              </div>
            )}
          </div>

          {/* Стеки */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Стеки техники ({(shipment.stacks && shipment.stacks.length) || 0} стеков)
              </div>
              {localLoadedStacks.size > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                  Погружено: {localLoadedStacks.size}/{(shipment.stacks && shipment.stacks.length) || 0}
                </Badge>
              )}
            </h3>
            {shipment.stacks && shipment.stacks.length > 0 ? (
              <div className="space-y-4">
                {shipment.stacks.map((stack, index) => {
                  const stackEquipment = getStackEquipment(stack.equipmentIds);
                  const isLoaded = localLoadedStacks.has(stack.stackId);
                  return (
                    <div key={index} className="border rounded-lg p-3 sm:p-4 bg-muted/30">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <Checkbox 
                          checked={isLoaded} 
                          onCheckedChange={(checked) => handleStackLoaded(stack.stackId, checked || false)}
                          className="mt-1 sm:mt-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h4 className="font-medium text-green-700 truncate">{stack.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                x{stack.quantity}
                              </Badge>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stackEquipment.length} единиц техники
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-0 sm:ml-6">
                        <p className="text-sm font-medium mb-3">Состав стека:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          {stackEquipment.map((item) => (
                            <div key={item.id} className="text-center">
                              <div className="bg-muted rounded-lg p-2 sm:p-3 border">
                                <p className="text-sm font-medium truncate">{item.name.split(' ')[0]}</p>
                                <p className="text-xs text-muted-foreground mt-1 break-words">{item.serialNumber}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Стеки техники не добавлены</p>
              </div>
            )}
          </div>

          {/* Аренда */}
          <div>
            <h3 className="font-semibold text-lg mb-4">
              Аренда ({(shipment.rental && shipment.rental.length) || 0} позиций)
            </h3>
            {shipment.rental && shipment.rental.length > 0 ? (
              <div className="space-y-3">
                {shipment.rental.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
                    <Checkbox checked={true} disabled className="mt-1 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <h4 className="font-medium text-green-700 truncate">{item.equipment}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      {item.link && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Ссылка на товар
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Арендованное оборудование не добавлено</p>
              </div>
            )}
          </div>
        </div>

        {/* Действия */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-3 sm:p-6 border-t">
          <Button variant="outline" className="h-10 px-4 order-2 sm:order-1">
            Скачать PDF
          </Button>
          <Button variant="outline" onClick={onClose} className="order-1 sm:order-2">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


