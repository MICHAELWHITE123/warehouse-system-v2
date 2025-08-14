import { getDatabase } from '../index';
import type {
  DbShipment,
  CreateShipment,
  UpdateShipment,
  ShipmentWithDetails,
  ShipmentChecklistItem,
  ShipmentRentalItem,
  CreateShipmentChecklistItem,
  CreateShipmentRentalItem
} from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class ShipmentService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все отгрузки
  getAllShipments(): DbShipment[] {
    return this.db.selectAll('shipments').sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    ) as DbShipment[];
  }

  // Получить отгрузку по ID
  getShipmentById(id: number): DbShipment | null {
    return this.db.selectById('shipments', id) as DbShipment | null;
  }

  // Получить отгрузку по UUID
  getShipmentByUuid(uuid: string): DbShipment | null {
    const shipments = this.db.selectWhere('shipments', shipment => shipment.uuid === uuid);
    return shipments.length > 0 ? shipments[0] as DbShipment : null;
  }

  // Получить отгрузку с деталями
  getShipmentWithDetails(id: number): ShipmentWithDetails | null {
    const shipment = this.getShipmentById(id);
    if (!shipment) return null;

    // Получаем оборудование отгрузки
    const shipmentEquipment = this.db.selectWhere('shipment_equipment', se => se.shipment_id === id);
    const equipment = shipmentEquipment.map(se => {
      const eq = this.db.selectById('equipment', se.equipment_id);
      if (!eq) return null;
      return {
        ...eq,
        quantity: se.quantity || 1
      };
    }).filter(Boolean);

    // Получаем стеки отгрузки
    const shipmentStacks = this.db.selectWhere('shipment_stacks', ss => ss.shipment_id === id);
    const stacks = shipmentStacks.map(ss => {
      const stack = this.db.selectById('equipment_stacks', ss.stack_id);
      if (!stack) return null;
      
      // Получаем оборудование стека
      const stackEquipment = this.db.selectWhere('stack_equipment', se => se.stack_id === stack.id);
      const stackEq = stackEquipment.map(se => {
        const eq = this.db.selectById('equipment', se.equipment_id);
        if (!eq) return null;
        
        const categories = this.db.selectAll('categories');
        const locations = this.db.selectAll('locations');
        
        return {
          ...eq,
          category_name: categories.find(c => c.id === eq.category_id)?.name || '',
          location_name: locations.find(l => l.id === eq.location_id)?.name || ''
        };
      }).filter(Boolean);

      return {
        ...stack,
        equipment: stackEq,
        quantity: ss.quantity || 1
      };
    }).filter(Boolean);

    // Получаем чек-лист отгрузки
    const checklist = this.db.selectWhere('shipment_checklist', sc => sc.shipment_id === id) as ShipmentChecklistItem[];

    // Получаем аренду отгрузки
    const rental = this.db.selectWhere('shipment_rental', sr => sr.shipment_id === id) as ShipmentRentalItem[];

    return {
      ...shipment,
      equipment,
      stacks,
      checklist,
      rental
    } as ShipmentWithDetails;
  }

  // Создать новую отгрузку
  createShipment(shipment: CreateShipment): DbShipment {
    const now = new Date().toISOString();
    const newShipment = {
      ...shipment,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('shipments', newShipment) as DbShipment;
  }

  // Обновить отгрузку
  updateShipment(shipment: UpdateShipment): DbShipment | null {
    const now = new Date().toISOString();
    const updatedShipment = {
      ...shipment,
      updated_at: now
    };

    return this.db.update('shipments', shipment.id, updatedShipment) as DbShipment | null;
  }

  // Удалить отгрузку
  deleteShipment(id: number): boolean {
    // Удаляем связанные записи
    const shipmentEquipment = this.db.selectWhere('shipment_equipment', se => se.shipment_id === id);
    shipmentEquipment.forEach(se => this.db.delete('shipment_equipment', se.id));

    const shipmentStacks = this.db.selectWhere('shipment_stacks', ss => ss.shipment_id === id);
    shipmentStacks.forEach(ss => this.db.delete('shipment_stacks', ss.id));

    const checklist = this.db.selectWhere('shipment_checklist', sc => sc.shipment_id === id);
    checklist.forEach(sc => this.db.delete('shipment_checklist', sc.id));

    const rental = this.db.selectWhere('shipment_rental', sr => sr.shipment_id === id);
    rental.forEach(sr => this.db.delete('shipment_rental', sr.id));

    // Удаляем саму отгрузку
    return this.db.delete('shipments', id);
  }

  // Добавить оборудование в отгрузку
  addEquipmentToShipment(shipmentId: number, equipmentId: number, quantity: number = 1): boolean {
    try {
      this.db.insert('shipment_equipment', {
        shipment_id: shipmentId,
        equipment_id: equipmentId,
        quantity,
        added_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error adding equipment to shipment:', error);
      return false;
    }
  }

  // Добавить стек в отгрузку
  addStackToShipment(shipmentId: number, stackId: number, quantity: number = 1): boolean {
    try {
      this.db.insert('shipment_stacks', {
        shipment_id: shipmentId,
        stack_id: stackId,
        quantity,
        added_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error adding stack to shipment:', error);
      return false;
    }
  }

  // Получить отгрузки по статусу
  getShipmentsByStatus(status: string): DbShipment[] {
    return this.db.selectWhere('shipments', shipment => shipment.status === status) as DbShipment[];
  }

  // Получить отгрузки по периоду
  getShipmentsByDateRange(startDate: string, endDate: string): DbShipment[] {
    return this.db.selectWhere('shipments', shipment => 
      shipment.date >= startDate && shipment.date <= endDate
    ) as DbShipment[];
  }

  // Создать элемент чек-листа
  createChecklistItem(item: CreateShipmentChecklistItem): ShipmentChecklistItem {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('shipment_checklist', newItem) as ShipmentChecklistItem;
  }

  // Обновить элемент чек-листа
  updateChecklistItem(id: number, updates: Partial<ShipmentChecklistItem>): ShipmentChecklistItem | null {
    const now = new Date().toISOString();
    const updatedItem = {
      ...updates,
      updated_at: now
    };

    return this.db.update('shipment_checklist', id, updatedItem) as ShipmentChecklistItem | null;
  }

  // Удалить элемент чек-листа
  deleteChecklistItem(id: number): boolean {
    return this.db.delete('shipment_checklist', id);
  }

  // Создать элемент аренды
  createRentalItem(item: CreateShipmentRentalItem): ShipmentRentalItem {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('shipment_rental', newItem) as ShipmentRentalItem;
  }

  // Удалить элемент аренды
  deleteRentalItem(id: number): boolean {
    return this.db.delete('shipment_rental', id);
  }

  // Получить статистику по отгрузкам
  getShipmentStats() {
    const total = this.db.count('shipments');
    const preparing = this.db.count('shipments', s => s.status === 'preparing');
    const inTransit = this.db.count('shipments', s => s.status === 'in-transit');
    const delivered = this.db.count('shipments', s => s.status === 'delivered');
    const cancelled = this.db.count('shipments', s => s.status === 'cancelled');

    return {
      total,
      preparing,
      inTransit,
      delivered,
      cancelled
    };
  }

  // Поиск отгрузок
  searchShipments(query: string): DbShipment[] {
    return this.db.selectWhere('shipments', shipment => 
      shipment.number.toLowerCase().includes(query.toLowerCase()) ||
      shipment.recipient.toLowerCase().includes(query.toLowerCase()) ||
      (shipment.recipient_address && shipment.recipient_address.toLowerCase().includes(query.toLowerCase())) ||
      (shipment.comments && shipment.comments.toLowerCase().includes(query.toLowerCase()))
    ) as DbShipment[];
  }

  // Получить отгрузки по ответственному лицу
  getShipmentsByResponsiblePerson(responsiblePerson: string): DbShipment[] {
    return this.db.selectWhere('shipments', shipment => 
      shipment.responsible_person === responsiblePerson
    ) as DbShipment[];
  }

  // Обновить статус отгрузки
  updateShipmentStatus(id: number, status: string): boolean {
    const updated = this.db.update('shipments', id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    return !!updated;
  }

  // Отметить отгрузку как доставленную
  markAsDelivered(id: number): boolean {
    const now = new Date().toISOString();
    const updated = this.db.update('shipments', id, { 
      status: 'delivered',
      delivered_at: now,
      updated_at: now
    });
    return !!updated;
  }
}