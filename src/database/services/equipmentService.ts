import { getDatabase } from '../index';
import type {
  DbEquipment,
  CreateEquipment,
  UpdateEquipment,
  EquipmentWithRelations
} from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class EquipmentService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все оборудование с категориями и местоположениями
  getAllEquipment(): EquipmentWithRelations[] {
    const equipment = this.db.selectAll('equipment');
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    const enrichedEquipment = equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];

    return enrichedEquipment.sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return bDate - aDate;
    });
  }

  // Получить оборудование по ID
  getEquipmentById(id: number): EquipmentWithRelations | null {
    const equipment = this.db.selectById('equipment', id);
    if (!equipment) return null;

    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');

    return {
      ...equipment,
      category_name: categories.find(c => c.id === equipment.category_id)?.name || '',
      location_name: locations.find(l => l.id === equipment.location_id)?.name || ''
    } as EquipmentWithRelations;
  }

  // Получить оборудование по UUID
  getEquipmentByUuid(uuid: string): EquipmentWithRelations | null {
    const equipment = this.db.selectWhere('equipment', eq => eq.uuid === uuid);
    if (equipment.length === 0) return null;

    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');

    const eq = equipment[0];
    return {
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    } as EquipmentWithRelations;
  }

  // Получить оборудование по статусу
  getEquipmentByStatus(status: string): EquipmentWithRelations[] {
    const equipment = this.db.selectWhere('equipment', eq => eq.status === status);
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Получить оборудование по категории
  getEquipmentByCategory(categoryId: number): EquipmentWithRelations[] {
    const equipment = this.db.selectWhere('equipment', eq => eq.category_id === categoryId);
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Получить оборудование по местоположению
  getEquipmentByLocation(locationId: number): EquipmentWithRelations[] {
    const equipment = this.db.selectWhere('equipment', eq => eq.location_id === locationId);
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Создать новое оборудование
  createEquipment(equipment: CreateEquipment): DbEquipment {
    const now = new Date().toISOString();
    const newEquipment = {
      ...equipment,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('equipment', newEquipment) as DbEquipment;
  }

  // Обновить оборудование
  updateEquipment(equipment: UpdateEquipment & { id: number }): DbEquipment | null {
    const updatedEquipment: UpdateEquipment = {
      ...equipment
    };

    return this.db.update('equipment', equipment.id, updatedEquipment) as DbEquipment | null;
  }

  // Удалить оборудование
  deleteEquipment(id: number): boolean {
    return this.db.delete('equipment', id);
  }

  // Поиск оборудования
  searchEquipment(query: string): EquipmentWithRelations[] {
    const equipment = this.db.selectWhere('equipment', eq => 
      eq.name.toLowerCase().includes(query.toLowerCase()) ||
      (eq.serial_number && eq.serial_number.toLowerCase().includes(query.toLowerCase())) ||
      (eq.description && eq.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Получить статистику по оборудованию
  getEquipmentStats() {
    const total = this.db.count('equipment');
    const available = this.db.count('equipment', eq => eq.status === 'available');
    const inUse = this.db.count('equipment', eq => eq.status === 'in-use');
    const maintenance = this.db.count('equipment', eq => eq.status === 'maintenance');

    return {
      total,
      available,
      inUse,
      maintenance
    };
  }

  // Получить оборудование, требующее обслуживания
  getEquipmentRequiringMaintenance(): EquipmentWithRelations[] {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const equipment = this.db.selectWhere('equipment', eq => 
      eq.status === 'maintenance' || 
      (eq.last_maintenance && eq.last_maintenance < sixMonthsAgoStr)
    );
    
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Получить оборудование по назначенному пользователю
  getEquipmentByAssignedUser(assignedTo: string): EquipmentWithRelations[] {
    const equipment = this.db.selectWhere('equipment', eq => eq.assigned_to === assignedTo);
    const categories = this.db.selectAll('categories');
    const locations = this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Обновить статус оборудования
  updateEquipmentStatus(id: number, status: string): boolean {
    const updated = this.db.update('equipment', id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    return !!updated;
  }

  // Назначить оборудование пользователю
  assignEquipment(id: number, assignedTo: string): boolean {
    const updated = this.db.update('equipment', id, { 
      assigned_to: assignedTo,
      status: 'in-use',
      updated_at: new Date().toISOString() 
    });
    return !!updated;
  }

  // Освободить оборудование
  unassignEquipment(id: number): boolean {
    const updated = this.db.update('equipment', id, { 
      assigned_to: null,
      status: 'available',
      updated_at: new Date().toISOString() 
    });
    return !!updated;
  }

  // Получить остатки оборудования по категориям
  getInventorySummary(): { [categoryName: string]: { total: number; available: number; inUse: number; maintenance: number; } } {
    const equipment = this.getAllEquipment();
    const categories = this.db.selectAll('categories');
    
    const summary: { [categoryName: string]: { total: number; available: number; inUse: number; maintenance: number; } } = {};
    
    // Инициализируем все категории
    categories.forEach(category => {
      summary[category.name] = {
        total: 0,
        available: 0,
        inUse: 0,
        maintenance: 0
      };
    });
    
    // Подсчитываем оборудование по категориям
    equipment.forEach(eq => {
      const categoryName = eq.category_name || 'Без категории';
      
      if (!summary[categoryName]) {
        summary[categoryName] = {
          total: 0,
          available: 0,
          inUse: 0,
          maintenance: 0
        };
      }
      
      summary[categoryName].total++;
      
      switch (eq.status) {
        case 'available':
          summary[categoryName].available++;
          break;
        case 'in-use':
          summary[categoryName].inUse++;
          break;
        case 'maintenance':
          summary[categoryName].maintenance++;
          break;
      }
    });
    
    return summary;
  }

  // Получить остатки оборудования по местоположениям
  getInventoryByLocation(): { [locationName: string]: { total: number; available: number; inUse: number; maintenance: number; } } {
    const equipment = this.getAllEquipment();
    const locations = this.db.selectAll('locations');
    
    const summary: { [locationName: string]: { total: number; available: number; inUse: number; maintenance: number; } } = {};
    
    // Инициализируем все местоположения
    locations.forEach(location => {
      summary[location.name] = {
        total: 0,
        available: 0,
        inUse: 0,
        maintenance: 0
      };
    });
    
    // Подсчитываем оборудование по местоположениям
    equipment.forEach(eq => {
      const locationName = eq.location_name || 'Без местоположения';
      
      if (!summary[locationName]) {
        summary[locationName] = {
          total: 0,
          available: 0,
          inUse: 0,
          maintenance: 0
        };
      }
      
      summary[locationName].total++;
      
      switch (eq.status) {
        case 'available':
          summary[locationName].available++;
          break;
        case 'in-use':
          summary[locationName].inUse++;
          break;
        case 'maintenance':
          summary[locationName].maintenance++;
          break;
      }
    });
    
    return summary;
  }

  // Получить детальную информацию о доступном оборудовании
  getAvailableEquipmentDetails(): EquipmentWithRelations[] {
    return this.getEquipmentByStatus('available');
  }
}