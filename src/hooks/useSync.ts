import { useState, useEffect, useCallback, useRef } from 'react';
import { syncAdapter, type SyncStatus } from '../database/syncAdapter';
import { useAuth } from './useAuth';

// Флаг для отслеживания инициализации
let isInitialized = false;

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const initializationRef = useRef(false);

  // Обновление статуса синхронизации
  const updateStatus = useCallback(() => {
    const status = syncAdapter.getSyncStatus();
    setSyncStatus(status);
  }, []);

  // Принудительная синхронизация
  const forceSync = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await syncAdapter.forceSync();
      updateStatus();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, updateStatus]);

  // Разрешение конфликта
  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote') => {
    syncAdapter.resolveConflict(conflictId, resolution);
    updateStatus();
  }, [updateStatus]);

  // Очистка очереди синхронизации
  const clearSyncQueue = useCallback(() => {
    syncAdapter.clearSyncQueue();
    updateStatus();
  }, [updateStatus]);

  // Запуск автоматической синхронизации
  const startAutoSync = useCallback((intervalMs: number = 30000) => {
    // Предотвращаем повторный запуск
    if (isInitialized) {
      console.log('Auto sync already running, skipping...');
      return;
    }
    syncAdapter.startAutoSync(intervalMs);
  }, []);

  // Остановка автоматической синхронизации
  const stopAutoSync = useCallback(() => {
    // Предотвращаем повторную остановку
    if (!isInitialized) {
      console.log('Auto sync not running, skipping...');
      return;
    }
    syncAdapter.stopAutoSync();
  }, []);

  // Получение информации об устройстве
  const getDeviceInfo = useCallback(() => {
    return syncAdapter.getDeviceInfo();
  }, []);

  // Получение количества операций в очереди
  const getPendingOperationsCount = useCallback(() => {
    return syncAdapter.getPendingOperationsCount();
  }, []);

  // Получение количества конфликтов
  const getConflictsCount = useCallback(() => {
    return syncAdapter.getConflictsCount();
  }, []);

  // Сброс флага критических ошибок
  const resetCriticalErrorFlag = useCallback(() => {
    syncAdapter.resetCriticalErrorFlag();
    updateStatus();
  }, [updateStatus]);

  // Очистка неудачных операций
  const clearFailedOperations = useCallback(() => {
    syncAdapter.clearFailedOperations();
    updateStatus();
  }, [updateStatus]);

  // Очистка синхронизированных операций
  const clearSyncedOperations = useCallback(() => {
    syncAdapter.clearSyncedOperations();
    updateStatus();
  }, [updateStatus]);

  // Автоматическое разрешение конфликтов
  const autoResolveConflicts = useCallback(() => {
    syncAdapter.autoResolveConflicts();
    updateStatus();
  }, [updateStatus]);

  // Перезапуск синхронизации
  const restartSync = useCallback(() => {
    syncAdapter.restartSync();
    updateStatus();
  }, [updateStatus]);

  // Получение статистики операций
  const getOperationsStats = useCallback(() => {
    return syncAdapter.getOperationsStats();
  }, []);

  // Очистка старых операций
  const cleanupOldOperations = useCallback(() => {
    syncAdapter.cleanupOldOperations();
    updateStatus();
  }, [updateStatus]);

  // Принудительно переключиться в локальный режим
  const forceLocalMode = useCallback(() => {
    syncAdapter.forceLocalMode();
    updateStatus();
  }, [updateStatus]);

  // Попытаться вернуться в гибридный режим
  const tryHybridMode = useCallback(() => {
    syncAdapter.tryHybridMode();
    updateStatus();
  }, [updateStatus]);

  // Принудительно попробовать подключиться к серверу
  const forceServerMode = useCallback(() => {
    syncAdapter.forceServerMode();
    updateStatus();
  }, [updateStatus]);

  useEffect(() => {
    // Предотвращаем повторную инициализацию
    if (initializationRef.current || isInitialized) {
      return;
    }

    initializationRef.current = true;
    isInitialized = true;

    // Устанавливаем пользователя в адаптер синхронизации
    if (user?.username) {
      syncAdapter.setUser(user.username);
      
      // Принудительно синхронизируемся при входе пользователя
      setTimeout(() => {
        forceSync();
      }, 1000);
    }

    // Обновляем статус при монтировании
    updateStatus();

    // Слушаем события синхронизации
    const handleSyncEvent = () => updateStatus();
    window.addEventListener('sync-conflict', handleSyncEvent);

    // Запускаем автоматическую синхронизацию каждые 30 секунд
    startAutoSync(30000);

    return () => {
      window.removeEventListener('sync-conflict', handleSyncEvent);
      // НЕ останавливаем автосинхронизацию при размонтировании компонента
      // Это позволит другим компонентам продолжать использовать синхронизацию
    };
  }, [user?.username, updateStatus, startAutoSync, forceSync]);

  // Обновляем статус каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, [updateStatus]);

  return {
    syncStatus,
    isLoading,
    forceSync,
    resolveConflict,
    clearSyncQueue,
    startAutoSync,
    stopAutoSync,
    getDeviceInfo,
    getPendingOperationsCount,
    getConflictsCount,
    resetCriticalErrorFlag,
    clearFailedOperations,
    clearSyncedOperations,
    autoResolveConflicts,
    restartSync,
    getOperationsStats,
    cleanupOldOperations,
    forceLocalMode,
    tryHybridMode,
    forceServerMode,
    updateStatus
  };
};
