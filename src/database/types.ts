// Типы для работы с базой данных

// Базовые типы для таблиц
export interface DbCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DbLocation {
  id: number;
  name: string;
  description?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface DbEquipment {
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
  specifications?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DbEquipmentStack {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  created_by: string;
  tags?: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DbStackEquipment {
  id: number;
  stack_id: number;
  equipment_id: number;
  created_at: string;
}

export interface DbShipment {
  id: number;
  uuid: string;
  number: string;
  date: string;
  recipient: string;
  recipient_address: string;
  status: 'preparing' | 'in-transit' | 'delivered' | 'cancelled';
  responsible_person: string;
  total_items: number;
  comments?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
}

export interface DbShipmentEquipment {
  id: number;
  shipment_id: number;
  equipment_id: number;
  quantity: number;
  created_at: string;
}

export interface DbShipmentStack {
  id: number;
  shipment_id: number;
  stack_id: number;
  quantity: number;
  created_at: string;
}

export interface DbShipmentChecklist {
  id: number;
  uuid: string;
  shipment_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  is_required: boolean;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
}

export interface DbShipmentRental {
  id: number;
  uuid: string;
  shipment_id: number;
  equipment_name: string;
  quantity: number;
  link?: string;
  created_at: string;
}

// Типы для создания новых записей (без автогенерируемых полей)
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
  uuid: string;
  name: string;
  category_id?: number;
  serial_number?: string;
  status?: 'available' | 'in-use' | 'maintenance';
  location_id?: number;
  purchase_date?: string;
  last_maintenance?: string;
  assigned_to?: string;
  description?: string;
  specifications?: Record<string, any>; // Будет преобразовано в JSON
}

export interface CreateEquipmentStack {
  uuid: string;
  name: string;
  description?: string;
  created_by: string;
  tags?: string[];
}

export interface CreateShipment {
  uuid: string;
  number: string;
  date: string;
  recipient: string;
  recipient_address: string;
  status?: 'preparing' | 'in-transit' | 'delivered' | 'cancelled';
  responsible_person: string;
  total_items?: number;
  comments?: string;
  delivered_at?: string;
}

export interface CreateShipmentChecklist {
  uuid: string;
  shipment_id: number;
  title: string;
  description?: string;
  is_completed?: boolean;
  is_required?: boolean;
  completed_by?: string;
  completed_at?: string;
}

export interface CreateShipmentRental {
  uuid: string;
  shipment_id: number;
  equipment_name: string;
  quantity: number;
  link?: string;
}

// Типы для обновления записей (все поля опциональны)
export interface UpdateCategory extends Partial<CreateCategory> {
}

export interface UpdateLocation extends Partial<CreateLocation> {
}

export interface UpdateEquipment extends Partial<CreateEquipment> {
}

export interface UpdateEquipmentStack extends Partial<CreateEquipmentStack> {
}

export interface UpdateShipment extends Partial<CreateShipment> {
}

export interface UpdateShipmentChecklist extends Partial<CreateShipmentChecklist> {
}

// Альтернативные типы для совместимости
export type ShipmentChecklistItem = DbShipmentChecklist;
export type ShipmentRentalItem = DbShipmentRental;
export type CreateShipmentChecklistItem = CreateShipmentChecklist;
export type CreateShipmentRentalItem = CreateShipmentRental;

// Расширенные типы с join'ами
export interface EquipmentWithRelations extends DbEquipment {
  category_name?: string;
  location_name?: string;
}

export interface StackWithEquipment extends DbEquipmentStack {
  equipment: EquipmentWithRelations[];
}

export interface ShipmentWithDetails extends DbShipment {
  equipment: (DbShipmentEquipment & EquipmentWithRelations)[];
  stacks: (DbShipmentStack & StackWithEquipment)[];
  checklist: DbShipmentChecklist[];
  rental: DbShipmentRental[];
}
