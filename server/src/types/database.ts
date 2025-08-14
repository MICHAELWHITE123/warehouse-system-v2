// Типы для работы с базой данных PostgreSQL

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  password_hash: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Location {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Equipment {
  id: number;
  uuid: string;
  name: string;
  category_id?: number;
  serial_number?: string;
  status: 'available' | 'in-use' | 'maintenance';
  location_id?: number;
  purchase_date?: Date;
  last_maintenance?: Date;
  assigned_to?: string;
  description?: string;
  specifications?: Record<string, any>;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface EquipmentStack {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  created_by?: number;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface StackEquipment {
  id: number;
  stack_id: number;
  equipment_id: number;
  created_at: Date;
}

export interface Shipment {
  id: number;
  uuid: string;
  number: string;
  date: Date;
  recipient: string;
  recipient_address: string;
  status: 'preparing' | 'in-transit' | 'delivered' | 'cancelled';
  responsible_person: string;
  total_items: number;
  comments?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  delivered_at?: Date;
}

export interface ShipmentEquipment {
  id: number;
  shipment_id: number;
  equipment_id: number;
  quantity: number;
  created_at: Date;
}

export interface ShipmentStack {
  id: number;
  shipment_id: number;
  stack_id: number;
  quantity: number;
  created_at: Date;
}

export interface ShipmentChecklist {
  id: number;
  uuid: string;
  shipment_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  is_required: boolean;
  completed_by?: string;
  completed_at?: Date;
  created_at: Date;
}

export interface ShipmentRental {
  id: number;
  uuid: string;
  shipment_id: number;
  equipment_name: string;
  quantity: number;
  link?: string;
  created_at: Date;
}

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: number;
  created_at: Date;
}

// Расширенные типы с join'ами
export interface EquipmentWithRelations extends Equipment {
  category_name?: string;
  location_name?: string;
  created_by_name?: string;
}

export interface StackWithEquipment extends EquipmentStack {
  equipment: EquipmentWithRelations[];
  created_by_name?: string;
}

export interface ShipmentWithDetails extends Shipment {
  equipment: (ShipmentEquipment & EquipmentWithRelations)[];
  stacks: (ShipmentStack & StackWithEquipment)[];
  checklist: ShipmentChecklist[];
  rental: ShipmentRental[];
  created_by_name?: string;
}

// DTO типы для создания/обновления
export interface CreateUser {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'user';
}

export interface UpdateUser {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: 'admin' | 'manager' | 'user';
  is_active?: boolean;
}

export interface CreateCategory {
  name: string;
  description?: string;
}

export interface CreateLocation {
  name: string;
  description?: string;
  address?: string;
}

export interface CreateEquipment {
  name: string;
  category_id?: number;
  serial_number?: string;
  status?: 'available' | 'in-use' | 'maintenance';
  location_id?: number;
  purchase_date?: string;
  last_maintenance?: string;
  assigned_to?: string;
  description?: string;
  specifications?: Record<string, any>;
}

export interface UpdateEquipment extends Partial<CreateEquipment> {}

export interface CreateEquipmentStack {
  name: string;
  description?: string;
  tags?: string[];
  equipment_ids?: number[];
}

export interface UpdateEquipmentStack extends Partial<CreateEquipmentStack> {}

export interface CreateShipment {
  number: string;
  date: string;
  recipient: string;
  recipient_address: string;
  status?: 'preparing' | 'in-transit' | 'delivered' | 'cancelled';
  responsible_person: string;
  comments?: string;
  equipment_items?: { equipment_id: number; quantity: number }[];
  stack_items?: { stack_id: number; quantity: number }[];
  checklist?: { title: string; description?: string; is_required?: boolean }[];
  rental?: { equipment_name: string; quantity: number; link?: string }[];
}

export interface UpdateShipment extends Partial<CreateShipment> {}

// API Response типы
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Статистика
export interface Statistics {
  equipment: {
    total: number;
    available: number;
    in_use: number;
    maintenance: number;
  };
  categories: number;
  locations: number;
  stacks: number;
  shipments: {
    total: number;
    preparing: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
  };
}
