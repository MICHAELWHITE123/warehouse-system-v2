import React, { useState, useEffect } from 'react';
import { useSync } from '../hooks/useSync';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Server,
  HardDrive,
  Activity,
  Trash2,
  RotateCcw,
  CheckCircle
} from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const { 
    syncStatus, 
    forceSync, 
    resolveConflict, 
    clearFailedOperations, 
    clearSyncedOperations, 
    autoResolveConflicts, 
    restartSync, 
    getOperationsStats, 
    cleanupOldOperations,
    resetCriticalErrorFlag
  } = useSync();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    // Обновляем время последнего обновления
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleResolveConflict = (conflictId: string, resolution: 'local' | 'remote') => {
    resolveConflict(conflictId, resolution);
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

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

  const getSyncModeLabel = (mode: string) => {
    switch (mode) {
      case 'server':
        return 'Сервер';
      case 'local':
        return 'Локально';
      case 'hybrid':
        return 'Гибрид';
      default:
        return 'Неизвестно';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  if (!syncStatus) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span>Загрузка статуса синхронизации...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { isOnline, isSyncing, pendingOperations, conflicts, lastSync, syncMode, deviceId, userId } = syncStatus;
  const operationsStats = getOperationsStats();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Статус синхронизации</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Синхронизировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={restartSync}
              disabled={isSyncing}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Перезапуск
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Скрыть' : 'Подробнее'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Основной статус */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {isOnline ? 'Онлайн' : 'Офлайн'}
              </span>
            </div>

            {isSyncing && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-blue-600">Синхронизация...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? 'Подключен' : 'Отключен'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              {getSyncModeIcon(syncMode)}
              {getSyncModeLabel(syncMode)}
            </Badge>
            {pendingOperations.length > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {pendingOperations.length} в очереди
              </Badge>
            )}
            {conflicts.length > 0 && (
              <Badge variant="destructive">
                {conflicts.length} конфликт(ов)
              </Badge>
            )}
          </div>
        </div>

        {/* Информация об устройстве */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getDeviceIcon()}
              <span className="font-medium">Устройство:</span>
              <span className="text-gray-600">{deviceId.substring(0, 8)}...</span>
            </div>
            <div className="text-gray-500">
              Последнее обновление: {formatTimestamp(lastUpdate.getTime())}
            </div>
          </div>
          {userId && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className="font-medium">Пользователь:</span>
              <span className="text-gray-600">{userId}</span>
            </div>
          )}
        </div>

        {/* Расширенная информация */}
        {isExpanded && (
          <>
            <Separator />
            
            {/* Очередь синхронизации */}
            {pendingOperations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">
                  Операции в очереди ({pendingOperations.length})
                </h4>
                <div className="space-y-1">
                  {pendingOperations.slice(0, 5).map((op) => (
                    <div key={op.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{op.operation}</span>
                        <span className="text-gray-500">{op.table}</span>
                        {op.retryCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Попытка {op.retryCount}/3
                          </Badge>
                        )}
                      </div>
                      <span className="text-gray-400">
                        {formatTimestamp(op.timestamp)}
                      </span>
                    </div>
                  ))}
                  {pendingOperations.length > 5 && (
                    <div className="text-xs text-gray-500 text-center">
                      ... и еще {pendingOperations.length - 5} операций
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Конфликты */}
            {conflicts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Конфликты синхронизации ({conflicts.length})
                </h4>
                <div className="space-y-2">
                  {conflicts.map((conflict) => (
                    <Alert key={conflict.id} className="border-red-200 bg-red-50">
                      <AlertDescription className="text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Конфликт в таблице {conflict.localOperation.table}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(conflict.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          Локальная операция: {conflict.localOperation.operation}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveConflict(conflict.id, 'local')}
                          >
                            Использовать локальную
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveConflict(conflict.id, 'remote')}
                          >
                            Использовать удаленную
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Время последней синхронизации */}
            {lastSync > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Последняя синхронизация: {formatTimestamp(lastSync)}</span>
              </div>
            )}

            {/* Статистика */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {operationsStats.pending}
                </div>
                <div className="text-xs text-blue-600">В очереди</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {operationsStats.failed}
                </div>
                <div className="text-xs text-red-600">Неудачных</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {operationsStats.synced}
                </div>
                <div className="text-xs text-green-600">Синхронизировано</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {conflicts.length}
                </div>
                <div className="text-xs text-gray-600">Конфликтов</div>
              </div>
            </div>

            {/* Действия по управлению операциями */}
            <div className="flex flex-wrap gap-2 pt-2">
              {operationsStats.failed > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearFailedOperations}
                  className="text-red-600 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Очистить неудачные ({operationsStats.failed})
                </Button>
              )}
              {operationsStats.synced > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSyncedOperations}
                  className="text-green-600 border-green-200"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Очистить синхронизированные ({operationsStats.synced})
                </Button>
              )}
              {conflicts.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={autoResolveConflicts}
                  className="text-orange-600 border-orange-200"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Авто-разрешить конфликты
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={cleanupOldOperations}
                className="text-gray-600 border-gray-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Очистить старые
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetCriticalErrorFlag}
                className="text-purple-600 border-purple-200"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Сбросить ошибки
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
