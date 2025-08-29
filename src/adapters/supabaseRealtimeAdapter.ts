import { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from './supabaseAdapter'; // Используем единый экземпляр

// Типы для real-time событий
interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp: string;
}

interface UseSupabaseRealtimeOptions {
  tables?: string[];
  onEquipmentChange?: (event: RealtimeEvent) => void;
  onShipmentChange?: (event: RealtimeEvent) => void;
  onCategoryChange?: (event: RealtimeEvent) => void;
  onLocationChange?: (event: RealtimeEvent) => void;
  onStackChange?: (event: RealtimeEvent) => void;
  onAnyChange?: (event: RealtimeEvent) => void;
  autoReconnect?: boolean;
}

// Основной хук для работы с Supabase Realtime
export function useSupabaseRealtime(options: UseSupabaseRealtimeOptions = {}) {
  const {
    tables = ['equipment', 'shipments', 'categories', 'locations', 'equipment_stacks'],
    onEquipmentChange,
    onShipmentChange,
    onCategoryChange,
    onLocationChange,
    onStackChange,
    onAnyChange,
    autoReconnect = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const isConnectingRef = useRef(false);
  const isDisconnectingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Обработчик событий
  const handleRealtimeEvent = useCallback((payload: any) => {
    const event: RealtimeEvent = {
      type: payload.eventType,
      table: payload.table,
      record: payload.new || payload.old,
      old_record: payload.old,
      timestamp: new Date().toISOString()
    };

    console.log('📨 Supabase Realtime event:', event);
    
    setLastEvent(event);

    // Вызываем специфичные обработчики
    switch (event.table) {
      case 'equipment':
        onEquipmentChange?.(event);
        break;
      case 'shipments':
        onShipmentChange?.(event);
        break;
      case 'categories':
        onCategoryChange?.(event);
        break;
      case 'locations':
        onLocationChange?.(event);
        break;
      case 'equipment_stacks':
        onStackChange?.(event);
        break;
    }

    // Общий обработчик
    onAnyChange?.(event);
  }, [onEquipmentChange, onShipmentChange, onCategoryChange, onLocationChange, onStackChange, onAnyChange]);

  // Подключение к таблицам
  const connect = useCallback(() => {
    if (isConnectingRef.current || isDisconnectingRef.current || isConnected) {
      return; // Предотвращаем повторные подключения
    }

    isConnectingRef.current = true;
    console.log('🔗 Connecting to Supabase Realtime for tables:', tables);

    try {
      // Отключаем существующие каналы
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];

      // Создаем каналы для каждой таблицы
      tables.forEach(table => {
        const channel = supabase
          .channel(`public:${table}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: table
            },
            (payload) => {
              console.log(`📨 Realtime event for table ${table}:`, payload);
              console.log(`🔍 Payload type:`, typeof payload);
              console.log(`🔍 Payload keys:`, Object.keys(payload || {}));
              
              // Преобразуем payload в формат, ожидаемый обработчиками
              const event = {
                eventType: payload.eventType,
                table: payload.table,
                new: payload.new,
                old: payload.old,
                timestamp: new Date().toISOString()
              };
              
              console.log(`🔍 Transformed event:`, event);
              
              // Вызываем обработчик события
              console.log(`🔍 Calling handleRealtimeEvent for table ${table}`);
              handleRealtimeEvent(event);
            }
          )
          .subscribe((status) => {
            console.log(`📡 Channel ${table} status:`, status);
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
              isConnectingRef.current = false;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setIsConnected(false);
              setConnectionError(`Connection error for table ${table}`);
              isConnectingRef.current = false;
              
              if (autoReconnect) {
                setTimeout(() => connect(), 5000);
              }
            }
          });

        channelsRef.current.push(channel);
      });

    } catch (error) {
      console.error('❌ Failed to connect to Supabase Realtime:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      isConnectingRef.current = false;
    }
  }, [tables, handleRealtimeEvent, autoReconnect, isConnected]);

  // Отключение
  const disconnect = useCallback(() => {
    if (isDisconnectingRef.current || !isConnected) {
      return; // Предотвращаем повторные отключения
    }

    isDisconnectingRef.current = true;
    console.log('🔌 Disconnecting from Supabase Realtime');
    
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    
    setIsConnected(false);
    setConnectionError(null);
    isDisconnectingRef.current = false;
  }, [isConnected]);

  // Автоподключение при монтировании
  useEffect(() => {
    if (!isConnected && !isConnectingRef.current && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      connect();
    }

    // Отключение при размонтировании
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Функция для уведомления других клиентов через изменение в БД
  const notifyChange = useCallback(async (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
    try {
      // Для Supabase Realtime уведомления происходят автоматически 
      // при изменении данных в таблице, но мы можем также использовать
      // специальную таблицу для кастомных уведомлений
      const { error } = await supabase
        .from('realtime_events') // Опциональная таблица для кастомных событий
        .insert({
          table_name: table,
          event_type: action,
          event_data: data,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to log realtime event:', error);
        // Не фейлим, т.к. основные события все равно пройдут через изменения в таблицах
      }

      return true;
    } catch (error) {
      console.error('Failed to notify change:', error);
      return false;
    }
  }, []);

  return {
    isConnected,
    connectionError,
    lastEvent,
    connect,
    disconnect,
    notifyChange,
    supabase
  };
}

// Хелперы для работы с конкретными таблицами
export function useEquipmentRealtime() {
  return useSupabaseRealtime({
    tables: ['equipment'],
    onEquipmentChange: (event) => {
      console.log('📦 Equipment realtime update:', event);
    }
  });
}

export function useShipmentRealtime() {
  return useSupabaseRealtime({
    tables: ['shipments'],
    onShipmentChange: (event) => {
      console.log('🚚 Shipment realtime update:', event);
    }
  });
}

// Экспортируем единый экземпляр клиента
export { supabase as supabaseClient };
