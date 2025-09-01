import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Создаем единый экземпляр Supabase клиента для всего приложения
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Auth helpers
export const auth = {
  // OAuth аутентификация
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  signInWithGitHub: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Выход из системы
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Получение текущего пользователя
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Получение текущей сессии
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Слушатель изменений состояния аутентификации
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Обновление профиля пользователя
  updateProfile: async (updates: any) => {
    const { data, error } = await supabase.auth.updateUser(updates);
    return { data, error };
  },

  // Сброс пароля (если понадобится в будущем)
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  }
};

// Database helpers
export const db = {
  // Equipment
  getEquipment: async () => {
    const { data, error } = await supabase
      .from('equipment')
      .select(`
        *,
        category:categories(name),
        location:locations(name)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createEquipment: async (equipment: any) => {
    const { data, error } = await supabase
      .from('equipment')
      .insert(equipment)
      .select()
      .single();
    return { data, error };
  },

  updateEquipment: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('equipment')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deleteEquipment: async (id: string) => {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    return { data, error };
  },

  // Locations
  getLocations: async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');
    return { data, error };
  },

  // Shipments
  getShipments: async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        created_by:users(email)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createShipment: async (shipment: any) => {
    const { data, error } = await supabase
      .from('shipments')
      .insert(shipment)
      .select()
      .single();
    return { data, error };
  },

  // Statistics
  getStatistics: async () => {
    const { data: equipmentCount } = await supabase
      .from('equipment')
      .select('*', { count: 'exact', head: true });

    const { data: categoryStats } = await supabase
      .from('equipment')
      .select('category_id, categories(name)')
      .not('category_id', 'is', null);

    const { data: locationStats } = await supabase
      .from('equipment')
      .select('location_id, locations(name)')
      .not('location_id', 'is', null);

    return {
      totalEquipment: equipmentCount,
      categoryStats,
      locationStats
    };
  }
};

export default supabase;
