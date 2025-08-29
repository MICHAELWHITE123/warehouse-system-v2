import React, { useState } from 'react';
import { useSync } from '../hooks/useSync';
import { useRealTimeSync } from '../hooks/useRealTimeSync';

interface SyncStatusProps {
  showDetails?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ showDetails = false }) => {
  const { syncStatus, forceSync, restartSync, forceServerMode, forceLocalMode } = useSync();
  const { isConnected, connectionError, lastUpdate } = useRealTimeSync();
  const [showFullDetails, setShowFullDetails] = useState(showDetails);

  const getStatusColor = () => {
    if (syncStatus?.isSyncing) return 'text-blue-600';
    if (syncStatus?.isOnline && syncStatus.syncMode !== 'local') return 'text-green-600';
    if (syncStatus?.syncMode === 'local') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (syncStatus?.isSyncing) return 'Синхронизация...';
    if (syncStatus?.isOnline && syncStatus.syncMode !== 'local') return 'Онлайн';
    if (syncStatus?.syncMode === 'local') return 'Локальный режим';
    return 'Офлайн';
  };

  const getSyncModeText = () => {
    switch (syncStatus?.syncMode) {
      case 'server': return 'Серверный';
      case 'hybrid': return 'Гибридный';
      case 'local': return 'Локальный';
      default: return 'Неизвестно';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'Никогда';
    const date = new Date(timestamp);
    return date.toLocaleString('ru-RU');
  };

  const handleForceSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleRestartSync = () => {
    try {
      restartSync();
    } catch (error) {
      console.error('Restart sync failed:', error);
    }
  };

  const handleForceServerMode = () => {
    try {
      forceServerMode();
    } catch (error) {
      console.error('Force server mode failed:', error);
    }
  };

  const handleForceLocalMode = () => {
    try {
      forceLocalMode();
    } catch (error) {
      console.error('Force local mode failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Статус синхронизации
        </h3>
        <button
          onClick={() => setShowFullDetails(!showFullDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showFullDetails ? 'Скрыть' : 'Подробности'}
        </button>
      </div>

      {/* Основной статус */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="font-medium">{getStatusText()}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Режим:</span>
            <span className="ml-2 font-medium">{getSyncModeText()}</span>
          </div>
          <div>
            <span className="text-gray-600">Real-time:</span>
            <span className={`ml-2 font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </div>

        {syncStatus?.lastSync && (
          <div className="text-sm text-gray-600">
            Последняя синхронизация: {formatTimestamp(syncStatus.lastSync)}
          </div>
        )}

        {connectionError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Ошибка подключения: {connectionError}
          </div>
        )}
      </div>

      {/* Детальная информация */}
      {showFullDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Устройство ID:</span>
              <span className="ml-2 font-mono text-xs">{syncStatus?.deviceId}</span>
            </div>
            <div>
              <span className="text-gray-600">Пользователь:</span>
              <span className="ml-2">{syncStatus?.userId || 'Не авторизован'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">В очереди:</span>
              <span className="ml-2 font-medium">{syncStatus?.pendingOperations?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Конфликты:</span>
              <span className="ml-2 font-medium">{syncStatus?.conflicts?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Онлайн:</span>
              <span className={`ml-2 font-medium ${syncStatus?.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {syncStatus?.isOnline ? 'Да' : 'Нет'}
              </span>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-sm text-gray-600">
              Последнее обновление: {lastUpdate.type} ({lastUpdate.action}) в {formatTimestamp(new Date(lastUpdate.timestamp).getTime())}
            </div>
          )}

          {/* Действия */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleForceSync}
              disabled={syncStatus?.isSyncing}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Принудительная синхронизация
            </button>
            
            <button
              onClick={handleRestartSync}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Перезапустить
            </button>
            
            <button
              onClick={handleForceServerMode}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Принудительно сервер
            </button>
            
            <button
              onClick={handleForceLocalMode}
              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Принудительно локально
            </button>
          </div>

          {/* Диагностика проблем */}
          <div className="bg-gray-50 p-3 rounded text-sm">
            <h4 className="font-medium text-gray-800 mb-2">Диагностика проблем:</h4>
            <ul className="space-y-1 text-gray-600">
              {!syncStatus?.isOnline && (
                <li>• Проверьте интернет соединение</li>
              )}
              {syncStatus?.syncMode === 'local' && syncStatus?.isOnline && (
                <li>• API недоступен, проверьте переменные окружения</li>
              )}
              {!isConnected && (
                <li>• Real-time соединение не установлено</li>
              )}
              {/* Временно закомментировано для исправления ошибок TypeScript
              {syncStatus?.pendingOperations?.length > 10 && (
                <li>• Много операций в очереди, возможно проблемы с синхронизацией</li>
              )}
              {syncStatus?.conflicts?.length > 0 && (
                <li>• Есть конфликты синхронизации, требуется разрешение</li>
              )}
              */}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatus;
