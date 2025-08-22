import { useState } from "react";
import { Search, Eye, Edit, Filter, Package, AlertTriangle, CheckCircle, Wrench, QrCode, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { QRScanner } from "./QRScanner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { toast } from "sonner";

export interface Equipment {
  id: string;
  uuid?: string;
  name: string;
  category: string;
  serialNumber: string;
  status: "available" | "in-use" | "maintenance";
  location: string;
  purchaseDate: string;
  lastMaintenance?: string;
  assignedTo?: string;
  specifications?: string; // Спецификация/комментарии к технике
}

interface EquipmentListProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onView: (equipment: Equipment) => void;
  onDelete?: (equipmentId: string) => void;
}

export function EquipmentList({ equipment, onEdit, onView, onDelete }: EquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);


  // Получаем уникальные значения для фильтров
  const categories = Array.from(new Set(equipment.map(item => item.category)));
  const locations = Array.from(new Set(equipment.map(item => item.location)));

  // Фильтрация оборудования
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.specifications && item.specifications.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesLocation = locationFilter === "all" || item.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });

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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-use":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleQRScanSuccess = (scannedEquipment: Equipment) => {
    // Ищем оборудование в нашем списке по серийному номеру
    const foundEquipment = equipment.find(item => 
      item.serialNumber === scannedEquipment.serialNumber || 
      item.id === scannedEquipment.id
    );
    
    if (foundEquipment) {
      onView(foundEquipment);
      setIsQRScannerOpen(false);
    } else {
      // Если оборудование не найдено в списке, все равно показываем его данные
      onView(scannedEquipment);
      setIsQRScannerOpen(false);
    }
  };

  const handleDelete = (equipment: Equipment) => {
    if (onDelete) {
      onDelete(equipment.id);
      toast.success("Оборудование успешно удалено");
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Оборудование</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Управление техникой на складе
          </p>
        </div>
        <Button 
          onClick={() => setIsQRScannerOpen(true)}
          className="w-full sm:w-auto"
        >
          <QrCode className="h-4 w-4 mr-2" />
          Сканировать QR-код
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск по названию, серийному номеру или категории..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 lg:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="available">Доступно</SelectItem>
              <SelectItem value="in-use">Используется</SelectItem>
              <SelectItem value="maintenance">Обслуживание</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
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
      </div>

      {/* Список оборудования */}
      {filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Оборудование не найдено</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Попробуйте изменить критерии поиска или фильтры
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-1 flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="truncate">{item.name}</span>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {item.category}
                    </CardDescription>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  {/* Основная информация */}
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-muted-foreground">Серийный номер:</span>
                      <span className="font-medium break-words">{item.serialNumber}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-muted-foreground">Местоположение:</span>
                      <span className="font-medium break-words">{item.location}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-muted-foreground">Дата покупки:</span>
                      <span className="font-medium">
                        {new Date(item.purchaseDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {item.assignedTo && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-muted-foreground">Назначено:</span>
                        <span className="font-medium break-words">{item.assignedTo}</span>
                      </div>
                    )}
                    {item.lastMaintenance && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-muted-foreground">Последнее ТО:</span>
                        <span className="font-medium">
                          {new Date(item.lastMaintenance).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}
                    {item.specifications && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-muted-foreground">Спецификация:</span>
                        <span className="font-medium break-words max-w-[120px] text-xs" 
                              title={item.specifications}>
                          {item.specifications.length > 25 
                            ? item.specifications.substring(0, 25) + "..." 
                            : item.specifications}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(item)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Просмотр
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Удалить
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие нельзя отменить. Это удалит все данные о
                            оборудовании "{item.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item)}>Удалить</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Scanner */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}