import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Camera, X, CheckCircle, AlertCircle, FileText, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { Equipment } from "./EquipmentList";
import { Shipment, ShipmentEquipment, ShipmentStack } from "./ShipmentList";
import { useAuth } from "../hooks/useAuth";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (equipment: Equipment) => void;
  // Новые пропсы для работы с отгрузками
  shipment?: Shipment;
  onEquipmentLoaded?: (equipmentId: string, isLoaded: boolean, loadedBy: string) => void;
  onStackLoaded?: (stackId: string, isLoaded: boolean, loadedBy: string) => void;
  loadedEquipment?: Set<string>;
  loadedStacks?: Set<string>;
}

interface ScannedEquipment {
  id: string;
  name: string;
  serial: string;
  serialNumber: string;
  category: string;
  location: string;
  status: "available" | "in-use" | "maintenance";
  purchaseDate: string;
}

export function QRScanner({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  shipment,
  onEquipmentLoaded,
  onStackLoaded,
  loadedEquipment = new Set(),
  loadedStacks = new Set()
}: QRScannerProps) {
  const { user } = useAuth();
  const [scannedData, setScannedData] = useState<ScannedEquipment | null>(null);
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(true);
  const [scanMode, setScanMode] = useState<"equipment" | "shipment">("equipment");

  useEffect(() => {
    if (isOpen) {
      setScannedData(null);
      setError("");
      setIsScanning(true);
      // Определяем режим сканирования на основе наличия отгрузки
      setScanMode(shipment ? "shipment" : "equipment");
    }
  }, [isOpen, shipment]);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes.length === 0) return;
    
    const result = detectedCodes[0].rawValue;
    try {
      setIsScanning(false);
      
      // Пытаемся распарсить JSON данные
      const parsedData = JSON.parse(result);
      
      // Проверяем, что это данные оборудования
      if (parsedData.id && parsedData.name && (parsedData.serial || parsedData.serialNumber)) {
        const equipment: ScannedEquipment = {
          id: parsedData.id,
          name: parsedData.name,
          serial: parsedData.serial || parsedData.serialNumber,
          serialNumber: parsedData.serial || parsedData.serialNumber,
          category: parsedData.category || "Не указано",
          location: parsedData.location || "Не указано",
          status: (parsedData.status as "available" | "in-use" | "maintenance") || "available",
          purchaseDate: parsedData.purchaseDate || new Date().toISOString().split('T')[0]
        };
        
        setScannedData(equipment);
        setError("");
        
        // Если это режим отгрузки, проверяем, есть ли оборудование в отгрузке
        if (scanMode === "shipment" && shipment) {
          handleShipmentScan(equipment);
        } else {
          toast.success("QR-код успешно отсканирован!");
          // Вызываем callback если он передан
          if (onScanSuccess) {
            onScanSuccess(equipment);
          }
        }
      } else {
        throw new Error("Неверный формат данных оборудования");
      }
    } catch (err) {
      console.error("Ошибка при обработке QR-кода:", err);
      setError("Неверный формат QR-кода. Убедитесь, что это QR-код оборудования.");
      setScannedData(null);
      toast.error("Ошибка сканирования QR-кода");
    }
  };

  // Обработка сканирования в режиме отгрузки
  const handleShipmentScan = (equipment: ScannedEquipment) => {
    if (!shipment || !user) return;

    // Проверяем, есть ли оборудование в отгрузке
    const shipmentEquipment = shipment.equipment.find(item => 
      item.equipmentId === equipment.id || 
      item.serialNumber === equipment.serialNumber
    );

    if (shipmentEquipment) {
      // Оборудование найдено в отгрузке
      const isAlreadyLoaded = loadedEquipment.has(equipment.id);
      
      if (onEquipmentLoaded) {
        onEquipmentLoaded(equipment.id, !isAlreadyLoaded, user.displayName);
        toast.success(
          isAlreadyLoaded 
            ? `Оборудование "${equipment.name}" отмечено как не погруженное` 
            : `Оборудование "${equipment.name}" отмечено как погруженное пользователем ${user.displayName}`
        );
      }
      
      setScannedData(null);
      setIsScanning(true);
      return;
    }

    // Проверяем, есть ли оборудование в стеках отгрузки
    if (shipment.stacks) {
      for (const stack of shipment.stacks) {
        if (stack.equipmentIds.includes(equipment.id)) {
          const isAlreadyLoaded = loadedStacks.has(stack.stackId);
          
          if (onStackLoaded) {
            onStackLoaded(stack.stackId, !isAlreadyLoaded, user.displayName);
            toast.success(
              isAlreadyLoaded 
                ? `Стек "${stack.name}" отмечен как не погруженный` 
                : `Стек "${stack.name}" отмечен как погруженный пользователем ${user.displayName}`
            );
          }
          
          setScannedData(null);
          setIsScanning(true);
          return;
        }
      }
    }

    // Оборудование не найдено в отгрузке
    toast.error(`Оборудование "${equipment.name}" не найдено в отгрузке ${shipment.number}`);
    setScannedData(null);
    setIsScanning(true);
  };

  const handleError = (error: any) => {
    console.error("Ошибка сканера:", error);
    setError("Ошибка доступа к камере. Проверьте разрешения.");
    toast.error("Ошибка доступа к камере");
  };

  const handleStartNewScan = () => {
    setScannedData(null);
    setError("");
    setIsScanning(true);
  };

  const statusMap = {
    available: { 
      label: "Доступно", 
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
    },
    "in-use": { 
      label: "В работе", 
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
    },
    maintenance: { 
      label: "Обслуживание", 
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" 
    },
    damaged: { 
      label: "Повреждено", 
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
    },
    unknown: {
      label: "Не определен",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {scanMode === "shipment" ? "Сканер QR-кодов для отгрузки" : "Сканер QR-кодов"}
          </DialogTitle>
          <DialogDescription>
            {scanMode === "shipment" 
              ? `Наведите камеру на QR-код оборудования для отметки погрузки в отгрузку ${shipment?.number}`
              : "Наведите камеру на QR-код оборудования для сканирования"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Информация об отгрузке */}
        {scanMode === "shipment" && shipment && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                <Package className="h-4 w-4" />
                Отгрузка #{shipment.number}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p>Получатель: {shipment.recipient}</p>
                <p>Оборудование: {shipment.equipment.length} позиций</p>
                <p>Стеки: {shipment.stacks?.length || 0}</p>
                <p>Погружено: {loadedEquipment.size + loadedStacks.size} позиций</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Области сканирования */}
          {isScanning && !scannedData && !error && (
            <div className="relative">
              <div className="aspect-square rounded-lg overflow-hidden border">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  styles={{
                    container: {
                      width: "100%",
                      height: "100%"
                    },
                    video: {
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }
                  }}
                />
              </div>
              
              {/* Overlay с рамкой для сканирования */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary border-dashed rounded-lg bg-transparent">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-primary rounded-tl"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-primary rounded-tr"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-primary rounded-bl"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-primary rounded-br"></div>
                </div>
              </div>
            </div>
          )}

          {/* Результат сканирования */}
          {scannedData && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Оборудование найдено
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Название:</span>
                    <span className="text-sm">{scannedData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Серийный номер:</span>
                    <span className="text-sm font-mono">{scannedData.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Категория:</span>
                    <span className="text-sm">{scannedData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Местоположение:</span>
                    <span className="text-sm">{scannedData.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Статус:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusMap[scannedData.status as keyof typeof statusMap]?.className || statusMap.unknown.className}`}>
                      {statusMap[scannedData.status as keyof typeof statusMap]?.label || statusMap.unknown.label}
                    </span>
                  </div>
                </div>
                
                {/* Информация о пользователе для режима отгрузки */}
                {scanMode === "shipment" && user && (
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Сканирование выполнил: <strong>{user.displayName}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ошибка */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Кнопки действий */}
          <div className="flex gap-3">
            {scannedData || error ? (
              <Button 
                onClick={handleStartNewScan} 
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Сканировать еще
              </Button>
            ) : null}
            
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>

          {/* Подсказка */}
          {isScanning && !scannedData && !error && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  <p>Убедитесь, что:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>QR-код хорошо освещен</li>
                    <li>Камера находится на расстоянии 10-30 см</li>
                    <li>QR-код полностью помещается в рамку</li>
                  </ul>
                  {scanMode === "shipment" && (
                    <p className="mt-2 font-medium text-blue-600">
                      При сканировании оборудование автоматически отметится как погруженное
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
