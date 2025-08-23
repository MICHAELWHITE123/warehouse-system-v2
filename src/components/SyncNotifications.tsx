import React, { useEffect, useState } from 'react';
import { useSync } from '../hooks/useSync';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const SyncNotifications: React.FC = () => {
  const { syncStatus, forceSync } = useSync();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    if (!syncStatus) return;

    // Добавляем уведомления о статусе синхронизации
    if (syncStatus.isSyncing) {
      addNotification('info', 'Синхронизация в процессе...');
    }

    if (syncStatus.pendingOperations.length > 0) {
      addNotification('warning', `${syncStatus.pendingOperations.length} операций ожидают синхронизации`);
    }

    if (syncStatus.conflicts.length > 0) {
      addNotification('error', `${syncStatus.conflicts.length} конфликтов синхронизации требуют разрешения`);
    }

    // Удаляем старые уведомления через 10 секунд
    const timeout = setTimeout(() => {
      setNotifications(prev => prev.filter(n => 
        Date.now() - n.timestamp < 10000
      ));
    }, 10000);

    return () => clearTimeout(timeout);
  }, [syncStatus]);

  const addNotification = (type: 'success' | 'warning' | 'info' | 'error', message: string) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setNotifications(prev => [...prev, {
      id,
      type,
      message,
      timestamp: Date.now()
    }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={getNotificationVariant(notification.type)}
          className="animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start gap-2">
            {getNotificationIcon(notification.type)}
            <AlertDescription className="flex-1">
              {notification.message}
            </AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeNotification(notification.id)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          {notification.type === 'warning' && (
            <div className="mt-2">
              <Button
                size="sm"
                onClick={() => {
                  forceSync();
                  removeNotification(notification.id);
                }}
                className="h-6 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Синхронизировать
              </Button>
            </div>
          )}
        </Alert>
      ))}
    </div>
  );
};
