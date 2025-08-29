import React, { useState } from 'react';
import { useSync } from '../hooks/useSync';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  WifiOff,
  Server,
  HardDrive,
  Activity
} from 'lucide-react';

export const SyncNotifications: React.FC = () => {
  const { 
    syncStatus, 
    forceSync, 
    clearSyncQueue, 
    autoResolveConflicts, 
    restartSync 
  } = useSync();
  const [showNotifications, setShowNotifications] = useState(true);

  if (!syncStatus || !showNotifications) {
    return null;
  }

  const { isOnline, isSyncing, pendingOperations, conflicts, syncMode } = syncStatus;

  // Определяем тип уведомления
  const getNotificationType = () => {
    if (conflicts.length > 0) return 'conflict';
    if (pendingOperations.length > 0 && !isOnline) return 'offline';
    if (pendingOperations.length > 0) return 'pending';
    if (isSyncing) return 'syncing';
    return 'success';
  };

  const notificationType = getNotificationType();

  // Получаем иконку для режима синхронизации
  const getSyncModeIcon = (mode: string) => {
    switch (mode) {
      case 'server':
        return <Server className="w-4 h-4" />;
      case 'local':
        return <HardDrive className="w-4 h-4" />;
      case 'hybrid':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Получаем цвет для режима синхронизации
  const getSyncModeColor = (mode: string) => {
    switch (mode) {
      case 'server':
        return 'text-blue-600';
      case 'local':
        return 'text-orange-600';
      case 'hybrid':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Рендерим уведомление в зависимости от типа
  const renderNotification = () => {
    switch (notificationType) {
      case 'conflict':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Обнаружены конфликты синхронизации</span>
                <Badge variant="destructive">{conflicts.length}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNotifications(false)}
                >
                  Скрыть
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'offline':
        return (
          <Alert className="border-orange-200 bg-orange-50">
            <WifiOff className="h-4 w-4 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Офлайн режим</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  {pendingOperations.length} операций в очереди
                </Badge>
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  {getSyncModeIcon(syncMode)}
                  <span className={getSyncModeColor(syncMode)}>Локальная синхронизация</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  variant="ghost"
                  onClick={() => setShowNotifications(false)}
                >
                  Скрыть
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'pending':
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <RefreshCw className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Ожидание синхронизации</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                  {pendingOperations.length} операций
                </Badge>
                <div className="flex items-center gap-1 text-sm text-yellow-600">
                  {getSyncModeIcon(syncMode)}
                  <span className={getSyncModeColor(syncMode)}>
                    {syncMode === 'hybrid' ? 'Гибридная синхронизация' : 
                     syncMode === 'server' ? 'Серверная синхронизация' : 'Локальная синхронизация'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  variant="ghost"
                  onClick={() => setShowNotifications(false)}
                >
                  Скрыть
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'syncing':
        return (
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Синхронизация...</span>
                <div className="flex items-center gap-1 text-sm text-blue-600">
                  {getSyncModeIcon(syncMode)}
                  <span className={getSyncModeColor(syncMode)}>
                    {syncMode === 'hybrid' ? 'Гибридная синхронизация' : 
                     syncMode === 'server' ? 'Серверная синхронизация' : 'Локальная синхронизация'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotifications(false)}
                >
                  Скрыть
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'success':
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Синхронизация завершена</span>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  {getSyncModeIcon(syncMode)}
                  <span className={getSyncModeColor(syncMode)}>
                    {syncMode === 'hybrid' ? 'Гибридная синхронизация' : 
                     syncMode === 'server' ? 'Серверная синхронизация' : 'Локальная синхронизация'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNotifications(false)}
                >
                  Скрыть
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-2">
      {renderNotification()}
      
      {/* Дополнительные действия для конфликтов */}
      {notificationType === 'conflict' && (
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-700">
            Обнаружены конфликты синхронизации. Выберите действие для их разрешения.
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={autoResolveConflicts}
              className="text-orange-600 border-orange-200"
            >
              Авто-разрешить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={restartSync}
              className="text-blue-600 border-blue-200"
            >
              Перезапустить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearSyncQueue}
            >
              Очистить очередь
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
