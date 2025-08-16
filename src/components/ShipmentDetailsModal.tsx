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
}

export function ShipmentDetailsModal({
  shipment,
  equipment = [],
  isOpen,
  onClose,
  loadedEquipment = new Set(),
  loadedStacks = new Set()
}: ShipmentDetailsModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Отгрузка #{shipment.number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Информация об отгрузке</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Оборудование ({shipment.equipment.length} позиций)
              {localLoadedEquipment.size > 0 && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
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
                    <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                      <Checkbox 
                        checked={isLoaded} 
                        onCheckedChange={(checked) => handleEquipmentLoaded(item.equipmentId, checked || false)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-700">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              x{item.quantity}
                            </Badge>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        {equipmentInfo?.serialNumber && (
                          <p className="text-sm text-muted-foreground mt-1">
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
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Стеки техники ({(shipment.stacks && shipment.stacks.length) || 0} стеков)
              {localLoadedStacks.size > 0 && (
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
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
                    <div key={index} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-center gap-3 mb-4">
                        <Checkbox 
                          checked={isLoaded} 
                          onCheckedChange={(checked) => handleStackLoaded(stack.stackId, checked || false)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-green-700">{stack.name}</h4>
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
                      
                      <div className="ml-6">
                        <p className="text-sm font-medium mb-3">Состав стека:</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {stackEquipment.map((item) => (
                            <div key={item.id} className="text-center">
                              <div className="bg-muted rounded-lg p-3 border">
                                <p className="text-sm font-medium truncate">{item.name.split(' ')[0]}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.serialNumber}</p>
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
                  <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                    <Checkbox checked={true} disabled className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-green-700">{item.equipment}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      {item.link && (
                        <p className="text-sm text-muted-foreground mt-1">
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
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" className="h-10 px-4">
            Скачать PDF
          </Button>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

