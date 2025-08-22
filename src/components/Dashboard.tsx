import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Package, AlertCircle, TrendingUp, Building, QrCode } from "lucide-react";
import { QRScanner } from "./QRScanner";
import { Equipment } from "./EquipmentList";
import { CanView } from "./ui/PermissionGate";

interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  categories: number;
}

interface DashboardProps {
  stats: DashboardStats;
  onEquipmentSelect?: (equipment: Equipment) => void;
}

export function Dashboard({ stats, onEquipmentSelect }: DashboardProps) {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const utilizationRate = Math.round((stats.inUseEquipment / stats.totalEquipment) * 100);

  const handleQRScanSuccess = (equipment: Equipment) => {
    setIsQRScannerOpen(false);
    if (onEquipmentSelect) {
      onEquipmentSelect(equipment);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Панель управления</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Обзор состояния техники на складе
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Всего техники</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{stats.totalEquipment}</div>
            <p className="text-xs text-muted-foreground">
              единиц оборудования
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">Доступно</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{stats.availableEquipment}</div>
            <p className="text-xs text-muted-foreground">
              готово к использованию
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">В использовании</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{stats.inUseEquipment}</div>
            <p className="text-xs text-muted-foreground">
              {utilizationRate}% загруженность
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm">На обслуживании</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl">{stats.maintenanceEquipment}</div>
            <p className="text-xs text-muted-foreground">
              требует внимания
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Статус оборудования</CardTitle>
            <CardDescription className="text-sm">
              Распределение по статусам
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                  Доступно
                </Badge>
              </span>
              <span>{stats.availableEquipment}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                  В работе
                </Badge>
              </span>
              <span>{stats.inUseEquipment}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                  Обслуживание
                </Badge>
              </span>
              <span>{stats.maintenanceEquipment}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Быстрые действия</CardTitle>
            <CardDescription className="text-sm">
              Часто используемые операции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CanView fallback={
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Нет доступа к функциям</p>
              </div>
            }>
              <Button 
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full"
                size="sm"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Сканировать QR-код
              </Button>
              
              <div className="grid gap-2 pt-2 border-t">
                <div className="text-sm">
                  <strong>Категорий:</strong> {stats.categories}
                </div>
                <div className="text-sm">
                  <strong>Загруженность:</strong> {utilizationRate}%
                </div>
                <div className="text-sm">
                  <strong>Доступность:</strong> {Math.round((stats.availableEquipment / stats.totalEquipment) * 100)}%
                </div>
              </div>
            </CanView>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}