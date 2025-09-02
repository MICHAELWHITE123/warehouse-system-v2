import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowLeft, Package, QrCode, Edit, FileText } from "lucide-react";
import { Equipment } from "./EquipmentList";
import { QRCodeModal } from "./QRCodeModal";
import { useState } from "react";

interface EquipmentDetailsProps {
  equipment: Equipment;
  onBack: () => void;
  onEdit: (equipment: Equipment) => void;
}

export function EquipmentDetails({ equipment, onBack, onEdit }: EquipmentDetailsProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Package className="h-4 w-4 text-green-600" />;
      case "in-use":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "maintenance":
        return <Package className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {getStatusIcon(equipment.status)}
            {equipment.name}
          </h1>
          <p className="text-muted-foreground">
            Детальная информация об оборудовании
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка - Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Базовые данные об оборудовании
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Название</label>
                  <p className="text-base font-medium">{equipment.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Категория</label>
                  <p className="text-base font-medium">{equipment.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Серийный номер</label>
                  <p className="text-base font-medium font-mono">{equipment.serialNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Статус</label>
                  <div className="mt-1">{getStatusBadge(equipment.status)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Расположение и назначение */}
          <Card>
            <CardHeader>
              <CardTitle>Расположение и назначение</CardTitle>
              <CardDescription>
                Где находится оборудование и кому назначено
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Местоположение</label>
                  <p className="text-base font-medium">{equipment.location}</p>
                </div>
                {equipment.assignedTo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Назначено сотруднику</label>
                    <p className="text-base font-medium">{equipment.assignedTo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Даты */}
          <Card>
            <CardHeader>
              <CardTitle>Важные даты</CardTitle>
              <CardDescription>
                Даты покупки и обслуживания
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Дата покупки</label>
                  <p className="text-base font-medium">
                    {new Date(equipment.purchaseDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                {equipment.lastMaintenance && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Последнее обслуживание</label>
                    <p className="text-base font-medium">
                      {new Date(equipment.lastMaintenance).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Спецификация */}
          {equipment.specifications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Спецификация/Комментарии
                </CardTitle>
                <CardDescription>
                  Технические характеристики и особенности оборудования
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-base whitespace-pre-wrap">{equipment.specifications}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Правая колонка - Действия и QR-код */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => onEdit(equipment)}
                className="w-full"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button
                onClick={() => setIsQRModalOpen(true)}
                className="w-full"
                variant="outline"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Показать QR-код
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Краткая информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Категория:</span>
                <span>{equipment.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Серийный номер:</span>
                <span className="font-mono">{equipment.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Местоположение:</span>
                <span>{equipment.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Статус:</span>
                <span>{getStatusBadge(equipment.status)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR код модал */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        equipment={equipment}
      />
    </div>
  );
}
