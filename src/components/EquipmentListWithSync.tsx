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
import { CanView, CanEdit, CanDelete } from "./ui/PermissionGate";
import { RealTimeStatus } from "./RealTimeStatus";
import { useEquipmentWithSync } from "../hooks/useEquipmentWithSync";
import { adaptEquipmentFromDB } from "../adapters/databaseAdapter";

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
  specifications?: string;
}

interface EquipmentListWithSyncProps {
  onEdit: (equipment: Equipment) => void;
  onView: (equipment: Equipment) => void;
}

export function EquipmentListWithSync({ onEdit, onView }: EquipmentListWithSyncProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Используем хук с real-time синхронизацией
  const { 
    equipment: dbEquipment, 
    loading, 
    error, 
    deleteEquipment,
    realTime 
  } = useEquipmentWithSync();

  // Преобразуем данные из БД в формат компонента
  const equipment: Equipment[] = dbEquipment.map(adaptEquipmentFromDB);

  // Получаем уникальные значения для фильтров
  const categories = Array.from(new Set(equipment.map(item => item.category)));
  const locations = Array.from(new Set(equipment.map(item => item.location)));

  // Фильтрация оборудования
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.specifications?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesLocation = locationFilter === "all" || item.location === locationFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
  });

  const getStatusIcon = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in-use":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return "default";
      case "in-use":
        return "secondary";
      case "maintenance":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: Equipment["status"]) => {
    switch (status) {
      case "available":
        return "Доступно";
      case "in-use":
        return "В использовании";
      case "maintenance":
        return "На обслуживании";
      default:
        return status;
    }
  };

  const handleDelete = async (equipmentId: string) => {
    try {
      const equipment = dbEquipment.find(eq => eq.uuid === equipmentId);
      if (equipment?.id) {
        await deleteEquipment(equipment.id);
        toast.success("Оборудование удалено");
      }
    } catch (error) {
      toast.error("Ошибка при удалении оборудования");
      console.error("Delete error:", error);
    }
  };

  const handleQRScan = (scannedEquipment: Equipment) => {
    // Если QR-код содержит данные оборудования, используем их напрямую
    if (scannedEquipment && scannedEquipment.id) {
      onView(scannedEquipment);
      setIsQRScannerOpen(false);
      toast.success(`Найдено: ${scannedEquipment.name}`);
    } else {
      toast.error("Неверный формат QR-кода");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setLocationFilter("all");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Загрузка оборудования...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Ошибка загрузки
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Список оборудования ({filteredEquipment.length})
            </CardTitle>
            <CardDescription>
              Управление складским оборудованием
            </CardDescription>
          </div>
          <RealTimeStatus
            isConnected={realTime.isConnected}
            connectionError={realTime.connectionError}
            lastUpdate={realTime.lastUpdate}
            onReconnect={realTime.reconnect}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Фильтры и поиск */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Поиск по названию, серийному номеру, ответственному или спецификации..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsQRScannerOpen(true)}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR
            </Button>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="available">Доступно</SelectItem>
                <SelectItem value="in-use">В использовании</SelectItem>
                <SelectItem value="maintenance">На обслуживании</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все местоположения" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все местоположения</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
          </div>
        </div>

        {/* Список оборудования */}
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Оборудование не найдено</p>
            {(searchTerm || categoryFilter !== "all" || statusFilter !== "all" || locationFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters} className="mt-2">
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEquipment.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.category}</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(item.status)} className="flex items-center gap-1">
                      {getStatusIcon(item.status)}
                      {getStatusText(item.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Серийный номер:</p>
                      <p className="font-mono">{item.serialNumber || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Местоположение:</p>
                      <p>{item.location || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Дата покупки:</p>
                      <p>{item.purchaseDate || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ответственный:</p>
                      <p>{item.assignedTo || "—"}</p>
                    </div>
                  </div>
                  
                  {item.lastMaintenance && (
                    <div>
                      <p className="text-gray-500 text-sm">Последнее обслуживание:</p>
                      <p className="text-sm">{item.lastMaintenance}</p>
                    </div>
                  )}
                  
                  {item.specifications && (
                    <div>
                      <p className="text-gray-500 text-sm">Спецификация:</p>
                      <p className="text-sm bg-gray-50 p-2 rounded text-gray-700">
                        {item.specifications}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <CanView>
                      <Button variant="outline" size="sm" onClick={() => onView(item)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Просмотр
                      </Button>
                    </CanView>
                    <CanEdit>
                      <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                    </CanEdit>
                    <CanDelete>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить оборудование?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Вы уверены, что хотите удалить "{item.name}"? Это действие нельзя отменить.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)}>
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CanDelete>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScan}
        />
      </CardContent>
    </Card>
  );
}
