// Адаптер для преобразования данных между интерфейсами компонентов и базой данных

import type { Equipment } from '../components/EquipmentList';
import type { EquipmentStack } from '../components/StackManagement';
import type { Shipment } from '../components/ShipmentList';

import type { 
  EquipmentWithRelations, 
  StackWithEquipment, 
  ShipmentWithDetails,
  CreateEquipment,
  CreateEquipmentStack,
  CreateShipment,
  DbCategory,
  DbLocation
} from '../database/types';
import { ExtendedShipment } from '../types';

// Преобразование оборудования из БД в интерфейс компонента
export function adaptEquipmentFromDB(dbEquipment: EquipmentWithRelations): Equipment {
  return {
    id: dbEquipment.uuid,
    name: dbEquipment.name,
    category: dbEquipment.category_name || '',
    serialNumber: dbEquipment.serial_number || '',
    status: dbEquipment.status,
    location: dbEquipment.location_name || '',
    purchaseDate: dbEquipment.purchase_date || '',
    lastMaintenance: dbEquipment.last_maintenance,
    assignedTo: dbEquipment.assigned_to
  };
}

// Преобразование оборудования из интерфейса компонента в БД
export function adaptEquipmentToDB(
  equipment: Omit<Equipment, 'id'>, 
  categories: DbCategory[], 
  locations: DbLocation[],
  uuid?: string
): CreateEquipment {
  const category = categories.find(c => c.name === equipment.category);
  const location = locations.find(l => l.name === equipment.location);
  
  return {
    uuid: uuid || Date.now().toString(),
    name: equipment.name,
    category_id: category?.id,
    serial_number: equipment.serialNumber || undefined,
    status: equipment.status,
    location_id: location?.id,
    purchase_date: equipment.purchaseDate || undefined,
    last_maintenance: equipment.lastMaintenance,
    assigned_to: equipment.assignedTo
  };
}

// Преобразование стека из БД в интерфейс компонента
export function adaptStackFromDB(dbStack: StackWithEquipment): EquipmentStack {
  const tags = dbStack.tags ? JSON.parse(dbStack.tags) : [];
  
  return {
    id: dbStack.uuid,
    name: dbStack.name,
    description: dbStack.description || '',
    equipmentIds: dbStack.equipment.map(eq => eq.uuid),
    createdAt: dbStack.created_at,
    createdBy: dbStack.created_by,
    tags
  };
}

// Преобразование стека из интерфейса компонента в БД
export function adaptStackToDB(
  stack: Omit<EquipmentStack, 'id'>,
  uuid?: string
): CreateEquipmentStack {
  return {
    uuid: uuid || Date.now().toString(),
    name: stack.name,
    description: stack.description,
    created_by: stack.createdBy,
    tags: stack.tags
  };
}

// Преобразование отгрузки из БД в интерфейс компонента
export function adaptShipmentFromDB(dbShipment: ShipmentWithDetails): ExtendedShipment {
  const equipment = (dbShipment.equipment || []).map(eq => ({
    equipmentId: eq.uuid,
    name: eq.name,
    serialNumber: eq.serial_number || '',
    quantity: eq.quantity || 1
  }));

  const stacks = (dbShipment.stacks || []).map(stack => ({
    stackId: stack.uuid,
    name: stack.name,
    equipmentIds: (stack.equipment || []).map(eq => eq.uuid),
    quantity: stack.quantity || 1
  }));

  const checklist = (dbShipment.checklist || []).map(item => ({
    id: item.uuid,
    title: item.title,
    description: item.description || '',
    isCompleted: item.is_completed,
    completedBy: item.completed_by,
    completedAt: item.completed_at,
    isRequired: item.is_required
  }));

  const rental = (dbShipment.rental || []).map(item => ({
    id: item.uuid,
    equipment: item.equipment_name,
    quantity: item.quantity,
    link: item.link || ''
  }));

  return {
    id: dbShipment.uuid,
    number: dbShipment.number,
    date: dbShipment.date,
    recipient: dbShipment.recipient,
    recipientAddress: dbShipment.recipient_address,
    status: dbShipment.status as any,
    responsiblePerson: dbShipment.responsible_person,
    equipment,
    stacks,
    totalItems: dbShipment.total_items,
    comments: dbShipment.comments,
    createdAt: dbShipment.created_at,
    deliveredAt: dbShipment.delivered_at,
    checklist,
    rental
  };
}

// Преобразование отгрузки из интерфейса компонента в БД
export function adaptShipmentToDB(
  shipment: Omit<ExtendedShipment, 'id'>,
  uuid?: string
): CreateShipment {
  return {
    uuid: uuid || Date.now().toString(),
    number: shipment.number,
    date: shipment.date,
    recipient: shipment.recipient,
    recipient_address: shipment.recipientAddress,
    status: shipment.status as any, // приведение типов
    responsible_person: shipment.responsiblePerson,
    total_items: shipment.totalItems,
    comments: shipment.comments,
    delivered_at: shipment.deliveredAt
  };
}



// Преобразование категорий
export function adaptCategoriesFromDB(dbCategories: DbCategory[]): string[] {
  return dbCategories.map(cat => cat.name);
}

// Преобразование местоположений
export function adaptLocationsFromDB(dbLocations: DbLocation[]): string[] {
  return dbLocations.map(loc => loc.name);
}
