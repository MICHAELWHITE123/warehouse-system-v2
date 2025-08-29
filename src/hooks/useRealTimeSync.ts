import { useEffect, useRef, useCallback, useState } from 'react';

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
  const [lastUpdate, setLastUpdate] = useState<RealTimeEvent | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const connect = useCallback(() => {
    // Закрываем существующее соединение если есть
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Пробуем подключиться к Supabase Edge Function
      let eventSourceUrl = `${API_BASE_URL}/functions/v1/events?stream=stream`;
      
      // Если это Supabase, добавляем токен в URL
      if (API_BASE_URL.includes('supabase.co')) {
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseKey) {
          eventSourceUrl += `&apikey=${supabaseKey}`;
        }
      }
      
      console.log('🔗 Attempting to connect to:', eventSourceUrl);
      
      const eventSource = new EventSource(eventSourceUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🔗 Real-time connection established');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('✅ Real-time sync connected at:', data.timestamp);
            return;
          }

          console.log('📨 Real-time update received:', data);
          setLastUpdate(data);

          // Вызываем соответствующие обработчики
          switch (data.type) {
            case 'equipment_update':
              onEquipmentUpdate?.(data);
              break;
            case 'shipment_update':
              onShipmentUpdate?.(data);
              break;
            case 'category_update':
              onCategoryUpdate?.(data);
              break;
            case 'location_update':
              onLocationUpdate?.(data);
              break;
            case 'stack_update':
              onStackUpdate?.(data);
              break;
          }

          // Общий обработчик
          onAnyUpdate?.(data);

        } catch (error) {
          console.error('❌ Error parsing real-time event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Real-time connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection error');

        // Если это Supabase и получаем 401, пробуем локальный API
        if (API_BASE_URL.includes('supabase.co') && reconnectAttemptsRef.current === 0) {
          console.log('🔄 Supabase Edge Function недоступен, пробуем локальный API...');
          
          // Закрываем текущее соединение
          eventSource.close();
          
          // Пробуем локальный API
          const localEventSourceUrl = 'http://localhost:3001/functions/v1/events?stream=stream';
          console.log('🔗 Пробуем локальный API:', localEventSourceUrl);
          
          const localEventSource = new EventSource(localEventSourceUrl);
          eventSourceRef.current = localEventSource;
          
          localEventSource.onopen = () => {
            console.log('🔗 Локальное real-time соединение установлено');
            setIsConnected(true);
            setConnectionError(null);
            reconnectAttemptsRef.current = 0;
          };
          
          localEventSource.onmessage = eventSource.onmessage;
          localEventSource.onerror = eventSource.onerror;
          
          return;
        }

        if (autoReconnect && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/5)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setConnectionError('Failed to connect after multiple attempts');
        }
      };

    } catch (error) {
      console.error('❌ Failed to establish real-time connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [API_BASE_URL, autoReconnect, onEquipmentUpdate, onShipmentUpdate, onCategoryUpdate, onLocationUpdate, onStackUpdate, onAnyUpdate]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Функция для отправки уведомления об изменении
  const notifyUpdate = useCallback(async (type: string, action: 'create' | 'update' | 'delete', data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/functions/v1/events/notify/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, data })
      });

      if (!response.ok) {
        throw new Error(`Failed to notify update: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to notify update:', error);
      return false;
    }
  }, [API_BASE_URL]);

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

  // Подключение при монтировании
  useEffect(() => {
    connect();

    // Отключение при размонтировании
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    lastUpdate,
    connect,
    disconnect,
    notifyEquipmentUpdate,
    notifyShipmentUpdate,
    notifyCategoryUpdate,
    notifyLocationUpdate,
    notifyStackUpdate
  };
}
