import { useEffect, useRef, useCallback, useState } from 'react';
import { useSupabaseRealtime } from '../adapters/supabaseRealtimeAdapter';

interface RealTimeEvent {
  type: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

interface UseRealTimeSyncOptions {
  onEquipmentUpdate?: (event: RealTimeEvent) => void;
  onShipmentUpdate?: (event: RealTimeEvent) => void;
  onCategoryUpdate?: (event: RealTimeEvent) => void;
  onLocationUpdate?: (event: RealTimeEvent) => void;
  onStackUpdate?: (event: RealTimeEvent) => void;
  onAnyUpdate?: (event: RealTimeEvent) => void;
  autoReconnect?: boolean;
}

export function useRealTimeSync(options: UseRealTimeSyncOptions = {}) {
  const {
    onEquipmentUpdate,
    onShipmentUpdate,
    onCategoryUpdate,
    onLocationUpdate,
    onStackUpdate,
    onAnyUpdate,
    autoReconnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] => useState<RealTimeEvent | null>(null);

  // Используем Supabase Realtime адаптер
  const {
    isConnected: supabaseConnected,
    connectionError: supabaseError,
    lastEvent: supabaseEvent,
    connect: supabaseConnect,
    disconnect: supabaseDisconnect
  } = useSupabaseRealtime({
    tables: ['equipment', 'shipments', 'categories', 'locations', 'equipment_stacks'],
    onEquipmentChange: (event) => {
      const realtimeEvent: RealTimeEvent = {
        type: 'equipment_update',
        action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
        data: event.record,
        timestamp: event.timestamp
      };
      onEquipmentUpdate?.(realtimeEvent);
      onAnyUpdate?.(realtimeEvent);
      setLastUpdate(realtimeEvent);
    },
    onShipmentChange: (event) => {
      const realtimeEvent: RealTimeEvent = {
        type: 'shipment_update',
        action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
        data: event.record,
        timestamp: event.timestamp
      };
      onShipmentUpdate?.(realtimeEvent);
      onAnyUpdate?.(realtimeEvent);
      setLastUpdate(realtimeEvent);
    },
    onCategoryChange: (event) => {
      const realtimeEvent: RealTimeEvent = {
        type: 'category_update',
        action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
        data: event.record,
        timestamp: event.timestamp
      };
      onCategoryUpdate?.(realtimeEvent);
      onAnyUpdate?.(realtimeEvent);
      setLastUpdate(realtimeEvent);
    },
    onLocationChange: (event) => {
      const realtimeEvent: RealTimeEvent = {
        type: 'location_update',
        action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
        data: event.record,
        timestamp: event.timestamp
      };
      onLocationUpdate?.(realtimeEvent);
      onAnyUpdate?.(realtimeEvent);
      setLastUpdate(realtimeEvent);
    },
    onStackChange: (event) => {
      const realtimeEvent: RealTimeEvent = {
        type: 'stack_update',
        action: event.type === 'INSERT' ? 'create' : event.type === 'UPDATE' ? 'update' : 'delete',
        data: event.record,
        timestamp: event.timestamp
      };
      onStackUpdate?.(realtimeEvent);
      onAnyUpdate?.(realtimeEvent);
      setLastUpdate(realtimeEvent);
    },
    autoReconnect
  });

  // Синхронизируем состояние
  useEffect(() => {
    setIsConnected(supabaseConnected);
    setConnectionError(supabaseError);
  }, [supabaseConnected, supabaseError]);

  // Функция для отправки уведомления об изменении
  const notifyUpdate = useCallback(async (type: string, action: 'create' | 'update' | 'delete', data: any) => {
    try {
      // Для Supabase Realtime уведомления происходят автоматически
      // при изменении данных в таблице
      console.log(`📢 Notifying ${type} ${action}:`, data);
      return true;
    } catch (error) {
      console.error('❌ Failed to notify update:', error);
      return false;
    }
  }, []);

  // Специфичные функции для уведомлений
  const notifyEquipmentUpdate = useCallback((action: 'create' | 'update' | 'delete', data: any) => {
    return notifyUpdate('equipment', action, data);
  }, [notifyUpdate]);

  const notifyShipmentUpdate = useCallback((action: 'create' | 'update' | 'delete', data: any) => {
    return notifyUpdate('shipment', action, data);
  }, [notifyUpdate]);

  const notifyCategoryUpdate = useCallback((action: 'create' | 'update' | 'delete', data: any) => {
    return notifyUpdate('category', action, data);
  }, [notifyUpdate]);

  const notifyLocationUpdate = useCallback((action: 'create' | 'update' | 'delete', data: any) => {
    return notifyUpdate('location', action, data);
  }, [notifyUpdate]);

  const notifyStackUpdate = useCallback((action: 'create' | 'update' | 'delete', data: any) => {
    return notifyUpdate('stack', action, data);
  }, [notifyUpdate]);

  return {
    isConnected,
    connectionError,
    lastUpdate,
    connect: supabaseConnect,
    disconnect: supabaseDisconnect,
    notifyEquipmentUpdate,
    notifyShipmentUpdate,
    notifyCategoryUpdate,
    notifyLocationUpdate,
    notifyStackUpdate
  };
}
