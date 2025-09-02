import { useState, useEffect, useCallback } from 'react';
import { 
  equipmentService
} from '../database/services';
import type { 
  EquipmentWithRelations
} from '../database/types';
import { useRealTimeSync } from './useRealTimeSync';

// Хук для работы с оборудованием с real-time синхронизацией
export function useEquipmentWithSync() {
  const [equipment, setEquipment] = useState<EquipmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipmentService.getAllEquipment();
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEquipment = useCallback(async (data: any) => {
    try {
      const newEquipment = await equipmentService.createEquipment(data);
      await loadEquipment();
      
      // Уведомляем других клиентов
      await notifyEquipmentUpdate('create', newEquipment);
      
      return newEquipment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create equipment');
    }
  }, [loadEquipment]);

  const updateEquipment = useCallback(async (data: any) => {
    try {
      const updatedEquipment = await equipmentService.updateEquipment(data);
      await loadEquipment();
      
      // Уведомляем других клиентов
      await notifyEquipmentUpdate('update', updatedEquipment);
      
      return updatedEquipment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update equipment');
    }
  }, [loadEquipment]);

  const deleteEquipment = useCallback(async (id: number) => {
    try {
      await equipmentService.deleteEquipment(id);
      await loadEquipment();
      
      // Уведомляем других клиентов
      await notifyEquipmentUpdate('delete', { id });
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete equipment');
    }
  }, [loadEquipment]);

  // Настройка real-time синхронизации
  const { 
    isConnected, 
    connectionError, 
    lastUpdate, 
    connect, 
    notifyEquipmentUpdate 
  } = useRealTimeSync({
    onEquipmentUpdate: (event) => {
      console.log('📦 Equipment real-time update received:', event);
      // Перезагружаем данные при получении обновления от других клиентов
      loadEquipment();
    },
    autoReconnect: true
  });

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  return {
    equipment,
    loading,
    error,
    loadEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    // Real-time статус
    realTime: {
      isConnected,
      connectionError,
      lastUpdate,
      reconnect: connect
    }
  };
}
