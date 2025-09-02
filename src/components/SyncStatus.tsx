import React, { useState, useEffect } from 'react';
import { syncAdapter } from '../database/syncAdapter';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  Database,
  Server
} from 'lucide-react';

interface SyncStatusProps {
  className?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ className }) => {
  const [status, setStatus] = useState(syncAdapter.getSyncStatus());
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = (event: Event) => {
      setStatus(syncAdapter.getSyncStatus());
    };

    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.error) {
        setLastError(customEvent.detail.error);
      }
    };

    window.addEventListener('sync-status-updated', handleStatusUpdate);
    window.addEventListener('sync-error', handleError);

    // Обновляем статус каждые 5 секунд
    const interval = setInterval(handleStatusUpdate, 5000);

    return () => {
      window.removeEventListener('sync-status-updated', handleStatusUpdate);
      window.removeEventListener('sync-error', handleError);
      clearInterval(interval);
    };
  }, []);

  const getStatusIcon = () => {
    if (status.isSyncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (status.pendingOperations.length === 0 && status.conflicts.length === 0) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status.conflicts.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <Database className="h-4 w-4 text-blue-500" />;
  };

  const getStatusText = () => {
    if (status.isSyncing) {
      return 'Синхронизация...';
    }
    if (status.pendingOperations.length === 0 && status.conflicts.length === 0) {
      return 'Синхронизировано';
    }
    if (status.conflicts.length > 0) {
      return `${status.conflicts.length} конфликт(ов)`;
    }
    return `${status.pendingOperations.length} в очереди`;
  };

  const getStatusColor = () => {
    if (status.isSyncing) {
      return 'bg-blue-100 text-blue-800';
    }
    if (status.pendingOperations.length === 0 && status.conflicts.length === 0) {
      return 'bg-green-100 text-green-800';
    }
    if (status.conflicts.length > 0) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  const handleForceSync = async () => {
    try {
      setLastError(null);
      await syncAdapter.forceSync();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const handleRestartSync = () => {
    try {
      setLastError(null);
      syncAdapter.restartSync();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const handleForceServerMode = () => {
    try {
      setLastError(null);
      syncAdapter.forceServerMode();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const formatLastSync = () => {
    if (status.lastSync === 0) {
      return 'Никогда';
    }
    return new Date(status.lastSync).toLocaleString('ru-RU');
  };

  const getErrorMessage = (error: string) => {
    if (error.includes('404') && error.includes('Supabase Edge Function not deployed')) {
      return {
        title: 'Edge Function не развернута',
        description: 'Для работы синхронизации необходимо развернуть Supabase Edge Function. Выполните команду: supabase functions deploy sync',
        action: 'Инструкция по настройке'
      };
    }
    if (error.includes('401')) {
      return {
        title: 'Ошибка аутентификации',
        description: 'Проверьте правильность API ключей Supabase в настройках',
        action: 'Проверить настройки'
      };
    }
    if (error.includes('Failed to fetch')) {
      return {
        title: 'Ошибка сети',
        description: 'Проверьте подключение к интернету и доступность Supabase',
        action: 'Повторить попытку'
      };
    }
    return {
      title: 'Ошибка синхронизации',
      description: error,
      action: 'Повторить попытку'
    };
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          Статус синхронизации
          <Badge className={`ml-auto ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Основная информация */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            {status.isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <span>{status.isOnline ? 'Онлайн' : 'Офлайн'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Server className="h-3 w-3 text-blue-500" />
            <span>{status.syncMode}</span>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          Последняя синхронизация: {formatLastSync()}
        </div>

        {/* Ошибка */}
        {lastError && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <div className="font-medium">{getErrorMessage(lastError).title}</div>
              <div className="text-sm mt-1">{getErrorMessage(lastError).description}</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Детальная информация */}
        {isExpanded && (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>Устройство: {status.deviceId.slice(0, 8)}...</div>
              <div>Пользователь: {status.userId || 'Не указан'}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>В очереди: {status.pendingOperations.length}</div>
              <div>Конфликты: {status.conflicts.length}</div>
              <div>Статус: {status.syncMode}</div>
            </div>

            {status.pendingOperations.length > 0 && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="font-medium mb-1">Операции в очереди:</div>
                {status.pendingOperations.slice(0, 3).map((op, index) => (
                  <div key={index} className="text-gray-600">
                    {op.operation} {op.table} (попытка {op.retryCount + 1})
                  </div>
                ))}
                {status.pendingOperations.length > 3 && (
                  <div className="text-gray-500">
                    ...и еще {status.pendingOperations.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleForceSync}
            disabled={status.isSyncing}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Синхронизировать
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestartSync}
            disabled={status.isSyncing}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Перезапустить
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Скрыть' : 'Подробности'}
          </Button>
        </div>

        {/* Специальная кнопка для принудительного серверного режима */}
        {lastError && lastError.includes('404') && (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleForceServerMode}
            className="w-full"
          >
            <Server className="h-3 w-3 mr-1" />
            Принудительно подключиться к серверу
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
