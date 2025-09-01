// Адаптер для преобразования данных между интерфейсами компонентов и базой данных

import type { Equipment } from '../components/EquipmentList';
import type { EquipmentStack } from '../components/StackManagement';

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
  // Извлекаем текст спецификации из объекта или строки
  let specifications: string | undefined;
  if (dbEquipment.specifications) {
    if (typeof dbEquipment.specifications === 'string') {
      try {
        const parsed = JSON.parse(dbEquipment.specifications);
        specifications = parsed.text || dbEquipment.specifications;
      } catch {
        specifications = dbEquipment.specifications;
      }
    } else if (typeof dbEquipment.specifications === 'object') {
      specifications = (dbEquipment.specifications as any).text || JSON.stringify(dbEquipment.specifications);
    }
  }

  return {
    id: dbEquipment.uuid,
    name: dbEquipment.name,
    category: dbEquipment.category_name || '',
    serialNumber: dbEquipment.serial_number || '',
    status: dbEquipment.status,
    location: dbEquipment.location_name || '',
    purchaseDate: dbEquipment.purchase_date || '',
    lastMaintenance: dbEquipment.last_maintenance,
    assignedTo: dbEquipment.assigned_to,
    specifications: specifications // Добавляю поле спецификации
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
    assigned_to: equipment.assignedTo,
    specifications: equipment.specifications ? { text: equipment.specifications } : undefined // Преобразуем строку в объект
  };
}

// Преобразование стека из БД в интерфейс компонента
export function adaptStackFromDB(dbStack: StackWithEquipment): EquipmentStack {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log('🔄 adaptStackFromDB input:', dbStack);
    console.log('🏷️ dbStack.tags:', dbStack.tags, 'type:', typeof dbStack.tags);
  }
  
  let tags: string[] = [];
  
  try {
    if (dbStack.tags && typeof dbStack.tags === 'string' && dbStack.tags.trim() !== '') {
      const parsed = JSON.parse(dbStack.tags);
      // Убеждаемся, что результат - это массив
      if (Array.isArray(parsed)) {
        tags = parsed;
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tags for stack is not an array:', dbStack.uuid, parsed);
        }
        tags = [];
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Failed to parse tags for stack:', dbStack.uuid, error);
      console.warn('📝 Raw tags value:', dbStack.tags);
    }
    tags = [];
  }
  
  const result = {
    id: dbStack.uuid,
    name: dbStack.name,
    description: dbStack.description || '',
    equipmentIds: dbStack.equipment.map(eq => eq.uuid),
    createdAt: dbStack.created_at,
    createdBy: dbStack.created_by,
    tags
  };
  
  if (import.meta.env.DEV) {
    console.log('✅ adaptStackFromDB result:', result);
  }
  return result;
}

// Преобразование стека из интерфейса компонента в БД
export function adaptStackToDB(
  stack: Omit<EquipmentStack, 'id'>,
  uuid?: string
): CreateEquipmentStack {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log('🔄 adaptStackToDB input:', stack);
    console.log('🏷️ stack.tags:', stack.tags);
  }
  
  const result = {
    uuid: uuid || Date.now().toString(),
    name: stack.name,
    description: stack.description,
    created_by: stack.createdBy,
    tags: stack.tags && stack.tags.length > 0 ? JSON.stringify(stack.tags) : undefined
  };
  
  if (import.meta.env.DEV) {
    console.log('✅ adaptStackToDB result:', result);
  }
  return result;
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
