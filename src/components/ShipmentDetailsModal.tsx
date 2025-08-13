import { Truck, Package, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Equipment } from "./EquipmentList";
import { Shipment } from "./ShipmentList";

interface ShipmentDetailsModalProps {
  shipment: Shipment | null;
  equipment: Equipment[];
  isOpen: boolean;
  onClose: () => void;
}

export function ShipmentDetailsModal({
  shipment,
  equipment,
  isOpen,
  onClose
}: ShipmentDetailsModalProps) {
  if (!shipment) return null;

  const getEquipmentInfo = (equipmentId: string) => {
    return equipment.find(item => item.id === equipmentId);
  };

  const getStackEquipment = (stackIds: string[]) => {
    return equipment.filter(item => stackIds.includes(item.id));
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Отгрузка {shipment.number}
          </DialogTitle>
          <DialogDescription>
            Подробная информация об отгрузке
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Информация об отгрузке</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Номер:</span>
                    <span className="font-medium">{shipment.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Дата:</span>
                    <span className="font-medium">{new Date(shipment.date).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус:</span>
                    {getStatusBadge(shipment.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ответственный:</span>
                    <span className="font-medium">{shipment.responsiblePerson}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Всего позиций:</span>
                    <span className="font-medium">{shipment.totalItems}</span>
                  </div>
                  {shipment.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Доставлено:</span>
                      <span className="font-medium">
                        {new Date(shipment.deliveredAt).toLocaleDateString('ru-RU')} в{' '}
                        {new Date(shipment.deliveredAt).toLocaleTimeString('ru-RU')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Получатель</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Наименование:</span>
                    <p className="font-medium">{shipment.recipient}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Адрес:</span>
                    <p className="font-medium">{shipment.recipientAddress}</p>
                  </div>
                </div>
              </div>
              {shipment.comments && (
                <div>
                  <h3 className="font-semibold mb-2">Комментарии</h3>
                  <p className="text-sm text-muted-foreground">{shipment.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Содержимое отгрузки */}
          <div className="space-y-6">
            {/* Оборудование */}
            {shipment.equipment.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Оборудование ({shipment.equipment.length} позиций)
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {shipment.equipment.map((item, index) => {
                    const equipmentItem = getEquipmentInfo(item.equipmentId);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {equipmentItem?.category} • {item.serialNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            x{item.quantity}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Стеки */}
            {shipment.stacks && shipment.stacks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Стеки техники ({shipment.stacks.length} стеков)
                </h3>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {shipment.stacks.map((stack, index) => {
                    const stackEquipment = getStackEquipment(stack.equipmentIds);
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium">{stack.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {stackEquipment.length} единиц техники
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            x{stack.quantity}
                          </Badge>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">Состав стека:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {stackEquipment.map((item) => (
                              <div key={item.id} className="text-sm flex items-center justify-between">
                                <span className="truncate">{item.name}</span>
                                <Badge variant="outline" className="text-xs ml-2">
                                  {item.serialNumber}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Аренда */}
            {shipment.rental && shipment.rental.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Аренда ({shipment.rental.length} позиций)
                </h3>
                <div className="space-y-2">
                  {shipment.rental.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.equipment}</p>
                        {item.link && (
                          <p className="text-sm text-muted-foreground">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              Ссылка на товар
                            </a>
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        x{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}