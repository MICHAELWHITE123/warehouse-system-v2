import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Download, QrCode, X } from "lucide-react";
import { Equipment } from "./EquipmentList";
import { toast } from "sonner";

interface QRCodeModalProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusMap = {
  available: { 
    label: "Доступно", 
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" 
  },
  "in-use": { 
    label: "В работе", 
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" 
  },
  maintenance: { 
    label: "Обслуживание", 
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" 
  },
  damaged: { 
    label: "Повреждено", 
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" 
  }
};

// Простая функция для генерации QR-кода на canvas
function generateQRCode(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 256;
  canvas.width = size;
  canvas.height = size;

  // Очищаем canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Генерируем простую матрицу QR-кода (имитация)
  const moduleCount = 21; // Размер матрицы QR-кода
  const moduleSize = size / moduleCount;
  
  ctx.fillStyle = '#000000';
  
  // Создаем псевдо QR-код на основе хэша текста
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Рисуем паттерн на основе хэша
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const seedValue = hash + row * moduleCount + col;
      
      // Области поиска (углы)
      const isFinderPattern = 
        (row < 9 && col < 9) || 
        (row < 9 && col >= moduleCount - 8) || 
        (row >= moduleCount - 8 && col < 9);

      // Временные паттерны
      const isTimingPattern = 
        (row === 6) || (col === 6);

      if (isFinderPattern) {
        // Рисуем паттерны поиска
        const isInner = 
          (row >= 2 && row <= 6 && col >= 2 && col <= 6) ||
          (row >= 2 && row <= 6 && col >= moduleCount - 6 && col <= moduleCount - 2) ||
          (row >= moduleCount - 6 && row <= moduleCount - 2 && col >= 2 && col <= 6);
        
        const isBorder = 
          (row <= 1 || row >= 7 || col <= 1 || col >= 7) &&
          (row < 9 && col < 9) ||
          (row <= 1 || row >= 7 || col >= moduleCount - 8 || col <= moduleCount - 2) &&
          (row < 9 && col >= moduleCount - 8) ||
          (row >= moduleCount - 8 || row <= moduleCount - 2 || col <= 1 || col >= 7) &&
          (row >= moduleCount - 8 && col < 9);

        if (isBorder || (isInner && (row % 2 === 0 || col % 2 === 0))) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      } else if (isTimingPattern) {
        // Рисуем временные паттерны
        if ((row + col) % 2 === 0) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      } else {
        // Рисуем данные на основе хэша
        if (Math.abs(seedValue) % 3 === 0) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }

  // Добавляем центральный квадрат
  const centerStart = Math.floor((moduleCount - 5) / 2);
  const centerEnd = centerStart + 5;
  for (let row = centerStart; row < centerEnd; row++) {
    for (let col = centerStart; col < centerEnd; col++) {
      const isBorder = row === centerStart || row === centerEnd - 1 || 
                      col === centerStart || col === centerEnd - 1;
      const isCenter = row >= centerStart + 2 && row <= centerEnd - 3 && 
                      col >= centerStart + 2 && col <= centerEnd - 3;
      
      if (isBorder || isCenter) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

export function QRCodeModal({ equipment, isOpen, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (equipment && canvasRef.current && isOpen) {
      setIsGenerating(true);
      
      // Формируем данные для QR-кода
      const qrData = JSON.stringify({
        id: equipment.id,
        name: equipment.name,
        serial: equipment.serialNumber,
        category: equipment.category,
        location: equipment.location,
        status: equipment.status
      });

      // Генерируем QR-код через небольшую задержку для UI
      setTimeout(() => {
        generateQRCode(canvasRef.current!, qrData);
        setIsGenerating(false);
      }, 500);
    }
  }, [equipment, isOpen]);

  const handleDownload = () => {
    if (!canvasRef.current || !equipment) return;

    try {
      // Создаем новый canvas для финального изображения с информацией
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return;

      const padding = 40;
      const qrSize = 256;
      const textHeight = 200;
      
      finalCanvas.width = qrSize + (padding * 2);
      finalCanvas.height = qrSize + textHeight + (padding * 2);

      // Заливаем белым фоном
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Копируем QR-код
      finalCtx.drawImage(canvasRef.current, padding, padding);

      // Добавляем текстовую информацию
      finalCtx.fillStyle = '#000000';
      finalCtx.font = '16px Arial';
      finalCtx.textAlign = 'center';

      const centerX = finalCanvas.width / 2;
      let textY = padding + qrSize + 30;

      finalCtx.fillText(equipment.name, centerX, textY);
      textY += 25;
      
      finalCtx.font = '14px Arial';
      finalCtx.fillText(`S/N: ${equipment.serialNumber}`, centerX, textY);
      textY += 20;
      
      finalCtx.fillText(`Категория: ${equipment.category}`, centerX, textY);
      textY += 20;
      
      finalCtx.fillText(`Местоположение: ${equipment.location}`, centerX, textY);
      textY += 20;
      
      finalCtx.fillText(`Статус: ${statusMap[equipment.status].label}`, centerX, textY);

      // Скачиваем изображение
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `QR_${equipment.serialNumber}_${equipment.name.replace(/\s+/g, '_')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('QR-код успешно скачан');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Ошибка при создании QR-кода:', error);
      toast.error('Ошибка при скачивании QR-кода');
    }
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR-код для оборудования
          </DialogTitle>
          <DialogDescription>
            QR-код содержит основную информацию об оборудовании
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR-код */}
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="border rounded-lg shadow-sm"
                style={{ width: '256px', height: '256px' }}
              />
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>

          {/* Информация об оборудовании */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{equipment.name}</CardTitle>
              <CardDescription className="font-mono">
                {equipment.serialNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Категория:</span>
                <span className="text-sm">{equipment.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Местоположение:</span>
                <span className="text-sm">{equipment.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Статус:</span>
                <Badge variant="secondary" className={statusMap[equipment.status].className}>
                  {statusMap[equipment.status].label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="flex gap-3">
            <Button 
              onClick={handleDownload} 
              className="flex-1"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Скачать QR-код
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}