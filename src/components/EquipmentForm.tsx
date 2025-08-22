import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { ArrowLeft, Package, QrCode } from "lucide-react";
import { Equipment } from "./EquipmentList";
import { QRCodeModal } from "./QRCodeModal";
import { toast } from "sonner";

interface EquipmentFormProps {
  equipment?: Equipment;
  onSave: (equipment: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
  isEditing: boolean;
  categories: string[];
  locations: string[];
}

export function EquipmentForm({
  equipment,
  onSave,
  onCancel,
  isEditing,
  categories,
  locations
}: EquipmentFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    serialNumber: string;
    status: "available" | "in-use" | "maintenance";
    location: string;
    purchaseDate: string;
    lastMaintenance: string;
    assignedTo: string;
    specifications: string; // Спецификация/комментарии
  }>({
    name: "",
    category: "",
    serialNumber: "",
    status: "available",
    location: "",
    purchaseDate: "",
    lastMaintenance: "",
    assignedTo: "",
    specifications: "" // Инициализация поля спецификации
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Инициализация формы при редактировании
  useEffect(() => {
    if (equipment && isEditing) {
      setFormData({
        name: equipment.name,
        category: equipment.category,
        serialNumber: equipment.serialNumber,
        status: equipment.status,
        location: equipment.location,
        purchaseDate: equipment.purchaseDate,
        lastMaintenance: equipment.lastMaintenance || "",
        assignedTo: equipment.assignedTo || "",
        specifications: equipment.specifications || "" // Инициализация поля спецификации
      });
    }
  }, [equipment, isEditing]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Название оборудования обязательно";
    }

    if (!formData.category) {
      newErrors.category = "Выберите категорию";
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = "Серийный номер обязателен";
    }

    if (!formData.location) {
      newErrors.location = "Выберите местоположение";
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "Дата покупки обязательна";
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

    const equipmentData: Omit<Equipment, 'id'> = {
      name: formData.name.trim(),
      category: formData.category,
      serialNumber: formData.serialNumber.trim(),
      status: formData.status,
      location: formData.location,
      purchaseDate: formData.purchaseDate,
      lastMaintenance: formData.lastMaintenance || undefined,
      assignedTo: formData.assignedTo.trim() || undefined,
      specifications: formData.specifications.trim() || undefined
    };

    onSave(equipmentData);
  };

  const generateSerialNumber = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const number = String(Date.now()).slice(-4);
    const generated = `${prefix}-${number}`;
    setFormData(prev => ({ ...prev, serialNumber: generated }));
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

  const shouldShowAssignedField = isEditing && (formData.status === "in-use" || equipment?.assignedTo);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? "Редактировать оборудование" : "Добавить оборудование"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Измените информацию об оборудовании" : "Зарегистрируйте новое оборудование в системе"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>
                  Базовые данные об оборудовании
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Название оборудования *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Например: MacBook Pro 16"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="serialNumber">Серийный номер *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => handleInputChange("serialNumber", e.target.value)}
                      placeholder="Введите или сгенерируйте"
                      className={errors.serialNumber ? "border-red-500" : ""}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSerialNumber}
                      disabled={!formData.category}
                    >
                      Генерировать
                    </Button>
                  </div>
                  {errors.serialNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.serialNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Расположение и статус</CardTitle>
                <CardDescription>
                  Где находится оборудование и его текущий статус
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Местоположение *</Label>
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => handleInputChange("location", value)}
                  >
                    <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите местоположение" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-red-500 mt-1">{errors.location}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="status">Статус</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: "available" | "in-use" | "maintenance") => 
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Доступно</SelectItem>
                      <SelectItem value="in-use">Используется</SelectItem>
                      <SelectItem value="maintenance">Обслуживание</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {shouldShowAssignedField && (
                  <div>
                    <Label htmlFor="assignedTo">Назначено сотруднику</Label>
                    <Input
                      id="assignedTo"
                      value={formData.assignedTo}
                      onChange={(e) => handleInputChange("assignedTo", e.target.value)}
                      placeholder="ФИО сотрудника"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Даты</CardTitle>
                <CardDescription>
                  Важные даты для учета оборудования
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="purchaseDate">Дата покупки *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                    className={errors.purchaseDate ? "border-red-500" : ""}
                  />
                  {errors.purchaseDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.purchaseDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastMaintenance">Последнее обслуживание</Label>
                  <Input
                    id="lastMaintenance"
                    type="date"
                    value={formData.lastMaintenance}
                    onChange={(e) => handleInputChange("lastMaintenance", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="specifications">Спецификация/Комментарии</Label>
                  <textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => handleInputChange("specifications", e.target.value)}
                    placeholder="Введите технические характеристики, особенности или комментарии к оборудованию..."
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Правая колонка - Дополнительная информация */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Текущий статус
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {getStatusBadge(formData.status)}
                </div>
              </CardContent>
            </Card>

            {isEditing && equipment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR-код
                  </CardTitle>
                  <CardDescription>
                    Сгенерировать QR-код для оборудования
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsQRModalOpen(true)}
                    className="w-full"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Показать QR-код
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Краткая информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Категория:</span>
                  <span>{formData.category || "Не выбрана"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Серийный номер:</span>
                  <span>{formData.serialNumber || "Не указан"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Местоположение:</span>
                  <span>{formData.location || "Не выбрано"}</span>
                </div>
                {formData.specifications && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Спецификация:</span>
                    <span className="text-xs max-w-[150px] truncate" title={formData.specifications}>
                      {formData.specifications.length > 20 
                        ? formData.specifications.substring(0, 20) + "..." 
                        : formData.specifications}
                    </span>
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
            {isEditing ? "Сохранить изменения" : "Добавить оборудование"}
          </Button>
        </div>
      </form>

      {/* QR код модал */}
      {isEditing && equipment && (
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          equipment={equipment}
        />
      )}
    </div>
  );
}