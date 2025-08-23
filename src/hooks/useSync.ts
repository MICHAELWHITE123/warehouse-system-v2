import { useState, useEffect, useCallback } from 'react';
import { syncAdapter, type SyncStatus, type SyncConflict } from '../database/syncAdapter';
import { useAuth } from './useAuth';

export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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
    syncAdapter.startAutoSync(intervalMs);
  }, []);

  // Остановка автоматической синхронизации
  const stopAutoSync = useCallback(() => {
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

  useEffect(() => {
    // Устанавливаем пользователя в адаптер синхронизации
    if (user?.id) {
      syncAdapter.setUser(user.id.toString());
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
      stopAutoSync();
    };
  }, [user?.id, updateStatus, startAutoSync, stopAutoSync]);

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
    updateStatus
  };
};
