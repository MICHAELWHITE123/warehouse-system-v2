import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useRef, useCallback, useState } from 'react';

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

// Создаем клиент Supabase с оптимизированными настройками для Realtime
export function createOptimizedSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10, // Ограничиваем количество событий
        heartbeatIntervalMs: 30000, // Heartbeat каждые 30 секунд
        reconnectAfterMs: (tries: number) => {
          // Экспоненциальная задержка переподключения
          return Math.min(tries * 1000, 10000);
        }
      }
    }
  });
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
  
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Инициализация Supabase клиента
  useEffect(() => {
    try {
      supabaseRef.current = createOptimizedSupabaseClient();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to initialize Supabase');
    }
  }, []);

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
    if (!supabaseRef.current) {
      setConnectionError('Supabase client not initialized');
      return;
    }

    // Отключаем существующие каналы
    channelsRef.current.forEach(channel => {
      supabaseRef.current?.removeChannel(channel);
    });
    channelsRef.current = [];

    console.log('🔗 Connecting to Supabase Realtime for tables:', tables);

    try {
      // Создаем каналы для каждой таблицы
      tables.forEach(table => {
        const channel = supabaseRef.current!
          .channel(`public:${table}`)
          .on(
            'postgres_changes',
            {
              event: '*', // Слушаем все события (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: table
            },
            handleRealtimeEvent
          )
          .subscribe((status) => {
            console.log(`📡 Channel ${table} status:`, status);
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setIsConnected(false);
              setConnectionError(`Connection error for table ${table}`);
              
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
    }
  }, [tables, handleRealtimeEvent, autoReconnect]);

  // Отключение
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Supabase Realtime');
    
    channelsRef.current.forEach(channel => {
      supabaseRef.current?.removeChannel(channel);
    });
    channelsRef.current = [];
    
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Автоподключение при монтировании
  useEffect(() => {
    if (supabaseRef.current) {
      connect();
    }

    // Отключение при размонтировании
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Функция для уведомления других клиентов через изменение в БД
  const notifyChange = useCallback(async (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
    if (!supabaseRef.current) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Для Supabase Realtime уведомления происходят автоматически 
      // при изменении данных в таблице, но мы можем также использовать
      // специальную таблицу для кастомных уведомлений
      const { error } = await supabaseRef.current
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
    supabase: supabaseRef.current
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

// Экспорт готового клиента для использования в других частях приложения
export const supabaseClient = createOptimizedSupabaseClient();
