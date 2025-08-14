import { Truck, Package, Users, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
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

  // Отладочная информация
  console.log('=== ShipmentDetailsModal Debug ===');
  console.log('shipment:', shipment);
  console.log('shipment.equipment:', shipment.equipment);
  console.log('shipment.stacks:', shipment.stacks);
  console.log('shipment.rental:', shipment.rental);
  console.log('shipment.checklist:', shipment.checklist);
  console.log('================================');

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

  // Функция для расчета прогресса чек-листа
  const getChecklistProgress = (shipment: Shipment) => {
    if (!shipment.checklist || shipment.checklist.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const completed = shipment.checklist.filter(item => item.isCompleted).length;
    const total = shipment.checklist.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Отгрузка {shipment.number}
          </DialogTitle>
          <DialogDescription>
            Подробная информация об отгрузке
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1">
          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Информация об отгрузке</h3>
                <div className="space-y-3 text-sm">
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
                  
                  {/* Статус погрузки - всегда отображается */}
                  {(() => {
                    const progress = getChecklistProgress(shipment);
                    const isLoaded = progress.percentage === 100 || shipment.status === 'delivered' || shipment.status === 'in-transit';
                    return (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Погружено:</span>
                        <div className="flex items-center gap-2">
                          {isLoaded ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Да</span>
                            </>
                          ) : (
                            <span className="font-medium text-muted-foreground">Нет</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Информация о доставке */}
                  {shipment.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Доставлено:</span>
                      <span className="font-medium">
                        {new Date(shipment.deliveredAt).toLocaleDateString('ru-RU')} в{' '}
                        {new Date(shipment.deliveredAt).toLocaleTimeString('ru-RU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Получатель</h3>
                <div className="space-y-3 text-sm">
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
              
              {/* Комментарии */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Комментарии</h3>
                <p className="text-sm">
                  {shipment.comments || "Срочная доставка"}
                </p>
              </div>
            </div>
          </div>

          {/* Содержимое отгрузки */}
          <div className="space-y-6">
            {/* Оборудование - всегда отображается */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Оборудование ({shipment.equipment.length} позиций)
              </h3>
              {shipment.equipment.length > 0 ? (
                <div className="space-y-3">
                  {shipment.equipment.map((item, index) => {
                    const equipmentItem = getEquipmentInfo(item.equipmentId);
                    return (
                      <div key={index} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                        <Checkbox checked={true} disabled className="mt-1" />
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
                          <p className="text-sm text-muted-foreground mt-1">
                            {equipmentItem?.category} • {item.serialNumber}
                          </p>
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

            {/* Стеки - всегда отображается */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Стеки техники ({(shipment.stacks && shipment.stacks.length) || 0} стеков)
              </h3>
              {shipment.stacks && shipment.stacks.length > 0 ? (
                <div className="space-y-4">
                  {shipment.stacks.map((stack, index) => {
                    const stackEquipment = getStackEquipment(stack.equipmentIds);
                    return (
                      <div key={index} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center gap-3 mb-4">
                          <Checkbox checked={true} disabled />
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

            {/* Аренда - всегда отображается */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}