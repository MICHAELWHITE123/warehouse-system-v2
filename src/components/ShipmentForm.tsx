import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

import { ArrowLeft, Plus, Trash2, Package, Users, Search } from "lucide-react";
import { Equipment } from "./EquipmentList";
import { Shipment, ShipmentEquipment, RentalItem } from "./ShipmentList";
import { EquipmentStack } from "./StackManagement";
import { InventoryOverview } from "./InventoryOverview";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";

interface ShipmentFormProps {
  shipment?: Shipment;
  equipment: Equipment[];
  stacks: EquipmentStack[];
  onSave: (shipment: Omit<Shipment, 'id'>) => void;
  onCancel: () => void;
  onEquipmentView?: (equipment: Equipment) => void;
  isEditing: boolean;
}

interface ShipmentStack {
  stackId: string;
  name: string;
  equipmentIds: string[];
  quantity: number;
}

export function ShipmentForm({
  shipment,
  equipment,
  stacks,
  onSave,
  onCancel,
  onEquipmentView,
  isEditing
}: ShipmentFormProps) {
  const [formData, setFormData] = useState<{
    number: string;
    date: string;
    recipient: string;
    recipientAddress: string;
    responsiblePerson: string;
    comments: string;
    status: "pending" | "in-progress" | "in-transit" | "delivered" | "cancelled";
  }>({
    number: "",
    date: new Date().toISOString().split('T')[0],
    recipient: "",
    recipientAddress: "",
    responsiblePerson: "",
    comments: "",
    status: "pending"
  });

  const [shipmentEquipment, setShipmentEquipment] = useState<ShipmentEquipment[]>([]);
  const [shipmentStacks, setShipmentStacks] = useState<ShipmentStack[]>([]);
  const [rentalItems, setRentalItems] = useState<RentalItem[]>([]);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [isStackDialogOpen, setIsStackDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stackSearchTerm, setStackSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Инициализация формы при редактировании
  useEffect(() => {
    if (shipment && isEditing) {
      setFormData({
        number: shipment.number,
        date: shipment.date,
        recipient: shipment.recipient,
        recipientAddress: shipment.recipientAddress,
        responsiblePerson: shipment.responsiblePerson,
        comments: shipment.comments || "",
        status: shipment.status
      });
      setShipmentEquipment(shipment.equipment);
      setRentalItems(shipment.rental || []);
      // Восстанавливаем стеки если они были сохранены
      setShipmentStacks(shipment.stacks || []);
    } else {
      // Генерируем номер отгрузки для нового документа
      const nextNumber = `SH-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`;
      setFormData(prev => ({ ...prev, number: nextNumber }));
    }
  }, [shipment, isEditing]);

  // Фильтруем доступное оборудование
  const availableEquipment = equipment.filter(item => {
    const isAlreadySelected = shipmentEquipment.some(se => se.equipmentId === item.id);
    const isInSelectedStack = shipmentStacks.some(stack => stack.equipmentIds.includes(item.id));
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    return !isAlreadySelected && !isInSelectedStack && matchesSearch;
  });

  // Фильтруем доступные стеки
  const availableStacks = stacks.filter(stack => {
    const isAlreadySelected = shipmentStacks.some(ss => ss.stackId === stack.id);
    const matchesSearch = stack.name.toLowerCase().includes(stackSearchTerm.toLowerCase()) ||
                         stack.description.toLowerCase().includes(stackSearchTerm.toLowerCase());
    
    return !isAlreadySelected && matchesSearch;
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddEquipment = (equipmentIds: string[]) => {
    const newEquipment = equipmentIds.map(id => {
      const item = equipment.find(e => e.id === id);
      if (!item) return null;
      
      return {
        equipmentId: id,
        name: item.name,
        serialNumber: item.serialNumber,
        quantity: 1
      };
    }).filter(Boolean) as ShipmentEquipment[];

    setShipmentEquipment(prev => [...prev, ...newEquipment]);
    setIsEquipmentDialogOpen(false);
  };

  const handleAddStack = (stackIds: string[]) => {
    const newStacks = stackIds.map(id => {
      const stack = stacks.find(s => s.id === id);
      if (!stack) return null;
      
      return {
        stackId: id,
        name: stack.name,
        equipmentIds: stack.equipmentIds,
        quantity: 1
      };
    }).filter(Boolean) as ShipmentStack[];

    setShipmentStacks(prev => [...prev, ...newStacks]);
    setIsStackDialogOpen(false);
  };

  // Обработчик изменения статуса техники
  const handleEquipmentStatusChange = (equipmentId: string, newStatus: string) => {
    console.log('=== ShipmentForm: handleEquipmentStatusChange ===');
    console.log('equipmentId:', equipmentId);
    console.log('newStatus:', newStatus);
    
    // Обновляем статус техники в локальном состоянии
    // Это позволит UI обновиться в реальном времени
    const updatedEquipment = equipment.map(eq => 
      eq.id === equipmentId 
        ? { ...eq, status: newStatus as Equipment['status'] }
        : eq
    );
    
    console.log('Обновленное оборудование:', updatedEquipment);
    console.log('===============================');
    
    // Показываем уведомление об изменении статуса
    toast.success(`Статус техники изменен на: ${newStatus === 'in-use' ? 'В работе' : newStatus}`);
  };

  const handleRemoveEquipment = (index: number) => {
    setShipmentEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveStack = (index: number) => {
    setShipmentStacks(prev => prev.filter((_, i) => i !== index));
  };

  const handleEquipmentQuantityChange = (index: number, quantity: number) => {
    if (quantity > 0) {
      setShipmentEquipment(prev => 
        prev.map((item, i) => i === index ? { ...item, quantity } : item)
      );
    }
  };

  const handleStackQuantityChange = (index: number, quantity: number) => {
    if (quantity > 0) {
      setShipmentStacks(prev => 
        prev.map((item, i) => i === index ? { ...item, quantity } : item)
      );
    }
  };

  const handleAddRental = () => {
    setRentalItems(prev => [...prev, {
      id: Date.now().toString(),
      equipment: "",
      quantity: 1,
      link: ""
    }]);
  };

  const handleRemoveRental = (index: number) => {
    setRentalItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRentalChange = (index: number, field: keyof RentalItem, value: string | number) => {
    setRentalItems(prev => 
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  };

  // Вычисляем общее количество позиций
  const getTotalItems = () => {
    const equipmentTotal = shipmentEquipment.reduce((sum, item) => sum + item.quantity, 0);
    const stacksTotal = shipmentStacks.reduce((sum, stack) => sum + (stack.equipmentIds.length * stack.quantity), 0);
    return equipmentTotal + stacksTotal;
  };

  // Получаем стек по ID
  const getStackById = (stackId: string) => {
    return stacks.find(stack => stack.id === stackId);
  };

  // Получаем оборудование стека
  const getStackEquipment = (stackId: string) => {
    const stack = getStackById(stackId);
    if (!stack) return [];
    return equipment.filter(item => stack.equipmentIds.includes(item.id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.number.trim()) {
      newErrors.number = "Номер отгрузки обязателен";
    }

    if (!formData.date) {
      newErrors.date = "Дата отгрузки обязательна";
    }

    if (!formData.recipient.trim()) {
      newErrors.recipient = "Получатель обязателен";
    }

    if (!formData.recipientAddress.trim()) {
      newErrors.recipientAddress = "Адрес получателя обязателен";
    }

    if (!formData.responsiblePerson.trim()) {
      newErrors.responsiblePerson = "Ответственное лицо обязательно";
    }

    if (shipmentEquipment.length === 0 && shipmentStacks.length === 0) {
      newErrors.equipment = "Добавьте хотя бы одну позицию в отгрузку";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    // Создаем чек-лист для новой отгрузки
    const checklist = isEditing ? shipment!.checklist : [
      {
        id: "1",
        title: "Проверить упаковку оборудования",
        description: "Убедиться в целостности упаковки всех позиций",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "2",
        title: "Сверить серийные номера",
        description: "Проверить соответствие серийных номеров документам",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "3",
        title: "Проверить комплектность стеков",
        description: "Убедиться в наличии всего оборудования в стеках",
        isCompleted: false,
        isRequired: shipmentStacks.length > 0
      },
      {
        id: "4",
        title: "Загрузить в транспорт",
        description: "Аккуратно разместить в транспортном средстве",
        isCompleted: false,
        isRequired: true
      },
      {
        id: "5",
        title: "Оформить документы",
        description: "Заполнить все необходимые документы",
        isCompleted: false,
        isRequired: true
      }
    ];

    const shipmentData: Omit<Shipment, 'id'> = {
      ...formData,
      equipment: shipmentEquipment,
      stacks: shipmentStacks,
      rental: rentalItems,
      totalItems: getTotalItems(),
      createdAt: shipment?.createdAt || new Date().toISOString(),
      checklist
    };

    onSave(shipmentData);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Редактировать отгрузку" : "Новая отгрузка"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Измените параметры отгрузки" : "Создайте новый отгрузочный лист"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Информация об отгрузке</CardTitle>
                <CardDescription>
                  Основные данные отгрузочного листа
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="number">Номер отгрузки *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange("number", e.target.value)}
                    className={errors.number ? "border-red-500" : ""}
                  />
                  {errors.number && (
                    <p className="text-sm text-red-500 mt-1">{errors.number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date">Дата отгрузки *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="responsiblePerson">Ответственное лицо *</Label>
                  <Input
                    id="responsiblePerson"
                    value={formData.responsiblePerson}
                    onChange={(e) => handleInputChange("responsiblePerson", e.target.value)}
                    placeholder="ФИО ответственного"
                    className={errors.responsiblePerson ? "border-red-500" : ""}
                  />
                  {errors.responsiblePerson && (
                    <p className="text-sm text-red-500 mt-1">{errors.responsiblePerson}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="comments">Комментарии</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange("comments", e.target.value)}
                    placeholder="Дополнительные комментарии"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Получатель</CardTitle>
                <CardDescription>
                  Информация о получателе груза
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient">Наименование получателя *</Label>
                  <Input
                    id="recipient"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange("recipient", e.target.value)}
                    placeholder="ООО Название компании"
                    className={errors.recipient ? "border-red-500" : ""}
                  />
                  {errors.recipient && (
                    <p className="text-sm text-red-500 mt-1">{errors.recipient}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="recipientAddress">Адрес получателя *</Label>
                  <Textarea
                    id="recipientAddress"
                    value={formData.recipientAddress}
                    onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
                    placeholder="Полный адрес доставки"
                    rows={3}
                    className={errors.recipientAddress ? "border-red-500" : ""}
                  />
                  {errors.recipientAddress && (
                    <p className="text-sm text-red-500 mt-1">{errors.recipientAddress}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Статистика отгрузки */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Статистика отгрузки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Единиц техники:</span>
                    <span className="font-semibold">{shipmentEquipment.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стеков:</span>
                    <span className="font-semibold">{shipmentStacks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Всего позиций:</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Аренда:</span>
                    <span className="font-semibold">{rentalItems.length}</span>
                  </div>
                  {errors.equipment && (
                    <p className="text-sm text-red-500">{errors.equipment}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Остатки на складе */}
            <InventoryOverview 
              equipment={equipment} 
              onEquipmentView={onEquipmentView}
              compactMode={true}
              onEquipmentStatusChange={handleEquipmentStatusChange}
            />
          </div>

          {/* Правая колонка - Содержимое отгрузки */}
          <div className="lg:col-span-2 space-y-6">
            {/* Оборудование */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Оборудование</CardTitle>
                    <CardDescription>
                      Отдельные единицы техники для отгрузки
                    </CardDescription>
                  </div>
                  <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить технику
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Выбор оборудования</DialogTitle>
                        <DialogDescription>
                          Выберите оборудование для добавления в отгрузку
                        </DialogDescription>
                      </DialogHeader>
                      <EquipmentSelectionDialog
                        equipment={availableEquipment}
                        onSelect={handleAddEquipment}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {shipmentEquipment.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Оборудование не добавлено
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shipmentEquipment.map((item, index) => {
                      const equipmentItem = equipment.find(e => e.id === item.equipmentId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {equipmentItem?.category} • {item.serialNumber}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleEquipmentQuantityChange(index, parseInt(e.target.value) || 1)}
                              className="w-20"
                              min="1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveEquipment(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Стеки */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Стеки техники</CardTitle>
                    <CardDescription>
                      Готовые комплекты оборудования
                    </CardDescription>
                  </div>
                  <Dialog open={isStackDialogOpen} onOpenChange={setIsStackDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Добавить стек
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Выбор стеков</DialogTitle>
                        <DialogDescription>
                          Выберите стеки техники для добавления в отгрузку
                        </DialogDescription>
                      </DialogHeader>
                      <StackSelectionDialog
                        stacks={availableStacks}
                        equipment={equipment}
                        onSelect={handleAddStack}
                        searchTerm={stackSearchTerm}
                        onSearchChange={setStackSearchTerm}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {shipmentStacks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Стеки не добавлены
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shipmentStacks.map((stack, index) => {
                      const stackData = getStackById(stack.stackId);
                      const stackEquipment = getStackEquipment(stack.stackId);
                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-medium">{stack.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {stackData?.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {stackEquipment.length} единиц техники
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={stack.quantity}
                                onChange={(e) => handleStackQuantityChange(index, parseInt(e.target.value) || 1)}
                                className="w-20"
                                min="1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveStack(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Состав стека */}
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
                )}
              </CardContent>
            </Card>

            {/* Аренда */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Аренда</CardTitle>
                    <CardDescription>
                      Арендованное оборудование от внешних поставщиков
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRental}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить аренду
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rentalItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Арендованное оборудование не добавлено
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rentalItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input
                            placeholder="Название оборудования"
                            value={item.equipment}
                            onChange={(e) => handleRentalChange(index, "equipment", e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Количество"
                            value={item.quantity}
                            onChange={(e) => handleRentalChange(index, "quantity", parseInt(e.target.value) || 1)}
                            min="1"
                          />
                          <Input
                            placeholder="Ссылка (опционально)"
                            value={item.link}
                            onChange={(e) => handleRentalChange(index, "link", e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRental(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {isEditing ? "Сохранить изменения" : "Создать отгрузку"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Компонент выбора оборудования
function EquipmentSelectionDialog({
  equipment,
  onSelect,
  searchTerm,
  onSearchChange
}: {
  equipment: Equipment[];
  onSelect: (equipmentIds: string[]) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleToggle = (equipmentId: string) => {
    setSelectedItems(prev => 
      prev.includes(equipmentId)
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const handleSelect = () => {
    onSelect(selectedItems);
    setSelectedItems([]);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Поиск оборудования..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {equipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Доступное оборудование не найдено
          </div>
        ) : (
          equipment.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.category} • {item.serialNumber} • {item.location}
                </p>
              </div>
              <Badge variant="outline">
                {item.status === "available" ? "Доступно" : item.status}
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Выбрано: {selectedItems.length} единиц
        </p>
        <Button onClick={handleSelect} disabled={selectedItems.length === 0}>
          Добавить выбранное
        </Button>
      </div>
    </div>
  );
}

// Компонент выбора стеков
function StackSelectionDialog({
  stacks,
  equipment,
  onSelect,
  searchTerm,
  onSearchChange
}: {
  stacks: EquipmentStack[];
  equipment: Equipment[];
  onSelect: (stackIds: string[]) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);

  const handleToggle = (stackId: string) => {
    setSelectedStacks(prev => 
      prev.includes(stackId)
        ? prev.filter(id => id !== stackId)
        : [...prev, stackId]
    );
  };

  const handleSelect = () => {
    onSelect(selectedStacks);
    setSelectedStacks([]);
  };

  const getStackEquipment = (stack: EquipmentStack) => {
    return equipment.filter(item => stack.equipmentIds.includes(item.id));
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Поиск стеков..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-3">
        {stacks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Доступные стеки не найдены
          </div>
        ) : (
          stacks.map((stack) => {
            const stackEquipment = getStackEquipment(stack);
            return (
              <div key={stack.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedStacks.includes(stack.id)}
                    onCheckedChange={() => handleToggle(stack.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{stack.name}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stack.description}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stackEquipment.length} единиц техники
                    </p>
                    
                    {/* Краткий список оборудования */}
                    <div className="bg-muted/50 rounded-lg p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {stackEquipment.slice(0, 4).map((item) => (
                          <div key={item.id} className="text-xs">
                            {item.name}
                          </div>
                        ))}
                        {stackEquipment.length > 4 && (
                          <div className="text-xs text-muted-foreground">
                            +{stackEquipment.length - 4} единиц
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          Выбрано: {selectedStacks.length} стеков
        </p>
        <Button onClick={handleSelect} disabled={selectedStacks.length === 0}>
          Добавить выбранные
        </Button>
      </div>
    </div>
  );
}