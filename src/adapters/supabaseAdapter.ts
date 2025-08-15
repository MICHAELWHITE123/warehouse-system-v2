import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
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
