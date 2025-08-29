import { useState, useEffect, useCallback } from 'react';
import { useSupabaseRealtime } from '../adapters/supabaseRealtimeAdapter';
import { supabaseClient } from '../adapters/supabaseRealtimeAdapter';
import type { Equipment } from '../components/EquipmentList';

// Типы для Supabase схемы
interface SupabaseEquipment {
  id: number;
  uuid: string;
  name: string;
  category_id?: number;
  serial_number?: string;
  status: 'available' | 'in-use' | 'maintenance';
  location_id?: number;
  purchase_date?: string;
  last_maintenance?: string;
  assigned_to?: string;
  description?: string;
  specifications?: any;
  created_at: string;
  updated_at: string;
  // Связанные данные
  categories?: { name: string };
  locations?: { name: string };
}

// Функция для преобразования данных из Supabase в формат компонента
function adaptSupabaseEquipment(data: SupabaseEquipment): Equipment {
  return {
    id: data.uuid,
    uuid: data.uuid,
    name: data.name,
    category: data.categories?.name || '',
    serialNumber: data.serial_number || '',
    status: data.status,
    location: data.locations?.name || '',
    purchaseDate: data.purchase_date || '',
    lastMaintenance: data.last_maintenance,
    assignedTo: data.assigned_to,
    specifications: typeof data.specifications === 'object' 
      ? data.specifications?.text || JSON.stringify(data.specifications)
      : data.specifications
  };
}

// Основной хук для работы с оборудованием через Supabase Realtime
export function useEquipmentSupabaseSync() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Настройка Realtime подключения
  const { 
    isConnected, 
    connectionError, 
    lastEvent,
    connect,
    notifyChange
  } = useSupabaseRealtime({
    tables: ['equipment'],
    onEquipmentChange: (event) => {
      console.log('📦 Equipment real-time update:', event);
      // Перезагружаем данные при получении обновления
      loadEquipment();
    },
    autoReconnect: true
  });

  // Загрузка всего оборудования из Supabase
  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabaseClient
        .from('equipment')
        .select(`
          *,
          categories:category_id(name),
          locations:location_id(name)
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Преобразуем данные в формат компонента
      const adaptedEquipment = (data || []).map(adaptSupabaseEquipment);
      setEquipment(adaptedEquipment);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load equipment';
      setError(errorMessage);
      console.error('Equipment loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Создание нового оборудования
  const createEquipment = useCallback(async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      // Получаем ID категории и локации по именам
      const [categoriesResult, locationsResult] = await Promise.all([
        supabaseClient.from('categories').select('id, name'),
        supabaseClient.from('locations').select('id, name')
      ]);

      const category = categoriesResult.data?.find(c => c.name === equipmentData.category);
      const location = locationsResult.data?.find(l => l.name === equipmentData.location);

      const newEquipmentData = {
        uuid: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: equipmentData.name,
        category_id: category?.id,
        serial_number: equipmentData.serialNumber || null,
        status: equipmentData.status,
        location_id: location?.id,
        purchase_date: equipmentData.purchaseDate || null,
        last_maintenance: equipmentData.lastMaintenance || null,
        assigned_to: equipmentData.assignedTo || null,
        specifications: equipmentData.specifications ? { text: equipmentData.specifications } : null,
        description: equipmentData.specifications || null
      };

      const { data, error: supabaseError } = await supabaseClient
        .from('equipment')
        .insert(newEquipmentData)
        .select(`
          *,
          categories:category_id(name),
          locations:location_id(name)
        `)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const adaptedEquipment = adaptSupabaseEquipment(data);
      
      // Уведомляем Vercel API (опционально, для дополнительной обработки)
      await notifyChange('equipment', 'INSERT', adaptedEquipment);

      // Данные автоматически обновятся через Realtime
      return adaptedEquipment;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create equipment';
      throw new Error(errorMessage);
    }
  }, [notifyChange]);

  // Обновление оборудования
  const updateEquipment = useCallback(async (equipmentData: Equipment) => {
    try {
      // Получаем ID категории и локации по именам
      const [categoriesResult, locationsResult] = await Promise.all([
        supabaseClient.from('categories').select('id, name'),
        supabaseClient.from('locations').select('id, name')
      ]);

      const category = categoriesResult.data?.find(c => c.name === equipmentData.category);
      const location = locationsResult.data?.find(l => l.name === equipmentData.location);

      const updateData = {
        name: equipmentData.name,
        category_id: category?.id,
        serial_number: equipmentData.serialNumber || null,
        status: equipmentData.status,
        location_id: location?.id,
        purchase_date: equipmentData.purchaseDate || null,
        last_maintenance: equipmentData.lastMaintenance || null,
        assigned_to: equipmentData.assignedTo || null,
        specifications: equipmentData.specifications ? { text: equipmentData.specifications } : null,
        description: equipmentData.specifications || null,
        updated_at: new Date().toISOString()
      };

      const { data, error: supabaseError } = await supabaseClient
        .from('equipment')
        .update(updateData)
        .eq('uuid', equipmentData.id)
        .select(`
          *,
          categories:category_id(name),
          locations:location_id(name)
        `)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const adaptedEquipment = adaptSupabaseEquipment(data);
      
      // Уведомляем Vercel API
      await notifyChange('equipment', 'UPDATE', adaptedEquipment);

      return adaptedEquipment;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update equipment';
      throw new Error(errorMessage);
    }
  }, [notifyChange]);

  // Удаление оборудования
  const deleteEquipment = useCallback(async (equipmentId: string) => {
    try {
      const { error: supabaseError } = await supabaseClient
        .from('equipment')
        .delete()
        .eq('uuid', equipmentId);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Уведомляем Vercel API
      await notifyChange('equipment', 'DELETE', { id: equipmentId });

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete equipment';
      throw new Error(errorMessage);
    }
  }, [notifyChange]);

  // Загрузка данных при монтировании
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
      lastEvent,
      reconnect: connect
    }
  };
}

// Хук для получения категорий и локаций для форм
export function useEquipmentOptions() {
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoriesResult, locationsResult] = await Promise.all([
          supabaseClient.from('categories').select('name').order('name'),
          supabaseClient.from('locations').select('name').order('name')
        ]);

        setCategories(categoriesResult.data?.map(c => c.name) || []);
        setLocations(locationsResult.data?.map(l => l.name) || []);
      } catch (error) {
        console.error('Failed to load options:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  return { categories, locations, loading };
}
