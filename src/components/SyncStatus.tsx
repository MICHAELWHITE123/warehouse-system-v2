import React, { useState, useEffect } from 'react';
import { useSync } from '../hooks/useSync';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  RefreshCw, 
  AlertTriangle, 
  WifiOff,
  Server,
  HardDrive,
  Activity,
  Info,
  Settings,
  Database
} from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const { 
    syncStatus, 
    forceSync, 
    restartSync,
    forceLocalMode,
    tryHybridMode,
    forceServerMode,
    getDeviceInfo
  } = useSync();
  
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Получаем информацию об устройстве
  useEffect(() => {
    if (syncStatus) {
      setDeviceInfo(getDeviceInfo());
    }
  }, [syncStatus, getDeviceInfo]);

  if (!syncStatus) {
    return null;
  }

  const { isOnline, isSyncing, pendingOperations, conflicts, syncMode } = syncStatus;

  // Получаем иконку для режима синхронизации
  const getSyncModeIcon = (mode: string) => {
    switch (mode) {
      case 'server':
        return <Server className="w-5 h-5" />;
      case 'local':
        return <HardDrive className="w-5 h-5" />;
      case 'hybrid':
        return <Activity className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  // Получаем цвет для режима синхронизации
  const getSyncModeColor = (mode: string) => {
    switch (mode) {
      case 'server':
        return 'text-blue-600 bg-blue-100';
      case 'local':
        return 'text-orange-600 bg-orange-100';
      case 'hybrid':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Получаем статус синхронизации
  const getSyncStatus = () => {
    if (conflicts.length > 0) return { status: 'conflict', text: 'Конфликты', color: 'text-red-600' };
    if (pendingOperations.length > 0 && !isOnline) return { status: 'offline', text: 'Офлайн', color: 'text-orange-600' };
    if (pendingOperations.length > 0) return { status: 'pending', text: 'Ожидание', color: 'text-yellow-600' };
    if (isSyncing) return { status: 'syncing', text: 'Синхронизация...', color: 'text-blue-600' };
    return { status: 'success', text: 'Синхронизировано', color: 'text-green-600' };
  };

  const syncStatusInfo = getSyncStatus();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          Статус синхронизации
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Основной статус */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">Статус:</span>
            <Badge variant="outline" className={syncStatusInfo.color}>
              {syncStatusInfo.text}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Режим:</span>
            <Badge className={`${getSyncModeColor(syncMode)}`}>
              {getSyncModeIcon(syncMode)}
              <span className="ml-1 capitalize">{syncMode}</span>
            </Badge>
          </div>
        </div>

        {/* Сетевая информация */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <WifiOff className={`w-4 h-4 ${isOnline ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-sm">
              {isOnline ? 'Онлайн' : 'Офлайн'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-sm">
              {pendingOperations.length} операций в очереди
            </span>
          </div>
        </div>

        {/* Конфликты */}
        {conflicts.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">
              Обнаружено {conflicts.length} конфликтов синхронизации
            </span>
          </div>
        )}

        {/* Действия */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={forceSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Синхронизировать
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={restartSync}
          >
            <Settings className="w-4 h-4 mr-1" />
            Перезапустить
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Info className="w-4 h-4 mr-1" />
            {showAdvanced ? 'Скрыть детали' : 'Показать детали'}
          </Button>
        </div>

        {/* Расширенная информация */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Информация об устройстве */}
            {deviceInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Информация об устройстве</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>ID устройства:</strong> {deviceInfo.deviceId}</p>
                    <p><strong>Пользователь:</strong> {deviceInfo.userId || 'Не указан'}</p>
                    <p><strong>Последняя синхронизация:</strong></p>
                    <p className="text-gray-600">
                      {deviceInfo.lastSync ? new Date(deviceInfo.lastSync).toLocaleString() : 'Никогда'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Статистика операций</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Ожидающие:</strong> {deviceInfo.operationsStats?.pending || 0}</p>
                    <p><strong>Успешные:</strong> {deviceInfo.operationsStats?.synced || 0}</p>
                    <p><strong>Неудачные:</strong> {deviceInfo.operationsStats?.failed || 0}</p>
                    <p><strong>Всего:</strong> {deviceInfo.operationsStats?.total || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Управление режимами */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Управление режимами синхронизации</h4>
              <div className="flex flex-wrap gap-2">
                {syncMode === 'local' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={tryHybridMode}
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    Попробовать гибридный режим
                  </Button>
                )}
                
                {syncMode === 'hybrid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={forceServerMode}
                  >
                    <Server className="w-4 h-4 mr-1" />
                    Принудительно серверный режим
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={forceLocalMode}
                >
                  <HardDrive className="w-4 h-4 mr-1" />
                  Принудительно локальный режим
                </Button>
              </div>
            </div>

            {/* Описание режимов */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Описание режимов</h4>
              <div className="text-sm space-y-2">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="font-medium text-blue-900">Серверный режим</p>
                  <p className="text-blue-700">Данные синхронизируются с сервером в реальном времени. Требует стабильное интернет-соединение.</p>
                </div>
                
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <p className="font-medium text-green-900">Гибридный режим</p>
                  <p className="text-green-700">Комбинация серверной и локальной синхронизации. Автоматически переключается между режимами.</p>
                </div>
                
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="font-medium text-orange-900">Локальный режим</p>
                  <p className="text-orange-700">Данные синхронизируются только между вкладками браузера. Работает без интернета.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
