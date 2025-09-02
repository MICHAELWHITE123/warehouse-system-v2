import { getDatabase } from '../index';
import { syncAdapter } from '../syncAdapter';
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
  async getEquipmentById(id: number): Promise<EquipmentWithRelations | null> {
    const equipment = await this.db.selectById('equipment', id);
    if (!equipment) return null;

    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');

    return {
      ...equipment,
      category_name: categories.find(c => c.id === equipment.category_id)?.name || '',
      location_name: locations.find(l => l.id === equipment.location_id)?.name || ''
    } as EquipmentWithRelations;
  }

  // Синхронная версия для совместимости
  getEquipmentByIdSync(id: number): EquipmentWithRelations | null {
    console.warn('getEquipmentByIdSync called - use async version instead');
    return null;
  }

  // Получить оборудование по UUID
  async getEquipmentByUuid(uuid: string): Promise<EquipmentWithRelations | null> {
    const equipment = await this.db.selectWhere('equipment', eq => eq.uuid === uuid);
    if (equipment.length === 0) return null;

    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');

    const eq = equipment[0];
    return {
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    } as EquipmentWithRelations;
  }

  // Синхронная версия для совместимости
  getEquipmentByUuidSync(uuid: string): EquipmentWithRelations | null {
    console.warn('getEquipmentByUuidSync called - use async version instead');
    return null;
  }

  // Получить оборудование по статусу
  async getEquipmentByStatus(status: string): Promise<EquipmentWithRelations[]> {
    const equipment = await this.db.selectWhere('equipment', eq => eq.status === status);
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  getEquipmentByStatusSync(status: string): EquipmentWithRelations[] {
    console.warn('getEquipmentByStatusSync called - use async version instead');
    return [];
  }

  // Получить оборудование по категории
  async getEquipmentByCategory(categoryId: number): Promise<EquipmentWithRelations[]> {
    const equipment = await this.db.selectWhere('equipment', eq => eq.category_id === categoryId);
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  getEquipmentByCategorySync(categoryId: number): EquipmentWithRelations[] {
    console.warn('getEquipmentByCategorySync called - use async version instead');
    return [];
  }

  // Получить оборудование по местоположению
  async getEquipmentByLocation(locationId: number): Promise<EquipmentWithRelations[]> {
    const equipment = await this.db.selectWhere('equipment', eq => eq.location_id === locationId);
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  getEquipmentByLocationSync(locationId: number): EquipmentWithRelations[] {
    console.warn('getEquipmentByLocationSync called - use async version instead');
    return [];
  }

  // Создать новое оборудование
  async createEquipment(equipment: CreateEquipment): Promise<DbEquipment> {
    const now = new Date().toISOString();
    const newEquipment = {
      ...equipment,
      created_at: now,
      updated_at: now
    };

    const result = await this.db.insert('equipment', newEquipment) as DbEquipment;
    
    // Добавляем в очередь синхронизации
    syncAdapter.addToSyncQueue('equipment', 'create', result);
    
    return result;
  }

  // Синхронная версия для совместимости
  createEquipmentSync(equipment: CreateEquipment): DbEquipment {
    console.warn('createEquipmentSync called - use async version instead');
    return {} as DbEquipment;
  }

  // Обновить оборудование
  async updateEquipment(equipment: UpdateEquipment & { id: number }): Promise<DbEquipment | null> {
    const updatedEquipment: UpdateEquipment = {
      ...equipment
    };

    const result = await this.db.update('equipment', equipment.id, updatedEquipment) as DbEquipment | null;
    
    if (result) {
      // Добавляем в очередь синхронизации
      syncAdapter.addToSyncQueue('equipment', 'update', result);
    }
    
    return result;
  }

  // Синхронная версия для совместимости
  updateEquipmentSync(equipment: UpdateEquipment & { id: number }): DbEquipment | null {
    console.warn('updateEquipmentSync called - use async version instead');
    return null;
  }

  // Удалить оборудование
  async deleteEquipment(id: number): Promise<boolean> {
    // Получаем данные перед удалением для синхронизации
    const equipment = await this.db.selectById('equipment', id);
    
    const result = await this.db.delete('equipment', id);
    
    if (result && equipment) {
      // Добавляем в очередь синхронизации
      syncAdapter.addToSyncQueue('equipment', 'delete', { id });
    }
    
    return result;
  }

  // Синхронная версия для совместимости
  deleteEquipmentSync(id: number): boolean {
    console.warn('deleteEquipmentSync called - use async version instead');
    return false;
  }

  // Поиск оборудования
  async searchEquipment(query: string): Promise<EquipmentWithRelations[]> {
    const equipment = await this.db.selectWhere('equipment', eq => 
      eq.name.toLowerCase().includes(query.toLowerCase()) ||
      (eq.serial_number && eq.serial_number.toLowerCase().includes(query.toLowerCase())) ||
      (eq.description && eq.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  searchEquipmentSync(query: string): EquipmentWithRelations[] {
    console.warn('searchEquipmentSync called - use async version instead');
    return [];
  }

  // Получить статистику по оборудованию
  async getEquipmentStats(): Promise<{ total: number; available: number; inUse: number; maintenance: number }> {
    const total = await this.db.count('equipment');
    const available = await this.db.count('equipment', eq => eq.status === 'available');
    const inUse = await this.db.count('equipment', eq => eq.status === 'in-use');
    const maintenance = await this.db.count('equipment', eq => eq.status === 'maintenance');

    return {
      total,
      available,
      inUse,
      maintenance
    };
  }

  // Синхронная версия для совместимости
  getEquipmentStatsSync(): { total: number; available: number; inUse: number; maintenance: number } {
    console.warn('getEquipmentStatsSync called - use async version instead');
    return { total: 0, available: 0, inUse: 0, maintenance: 0 };
  }

  // Получить оборудование, требующее обслуживания
  async getEquipmentRequiringMaintenance(): Promise<EquipmentWithRelations[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const equipment = await this.db.selectWhere('equipment', eq => 
      eq.status === 'maintenance' || 
      (eq.last_maintenance && eq.last_maintenance < sixMonthsAgoStr)
    );
    
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  getEquipmentRequiringMaintenanceSync(): EquipmentWithRelations[] {
    console.warn('getEquipmentRequiringMaintenanceSync called - use async version instead');
    return [];
  }

  // Получить оборудование по назначенному пользователю
  async getEquipmentByAssignedUser(assignedTo: string): Promise<EquipmentWithRelations[]> {
    const equipment = await this.db.selectWhere('equipment', eq => eq.assigned_to === assignedTo);
    const categories = await this.db.selectAll('categories');
    const locations = await this.db.selectAll('locations');
    
    return equipment.map(eq => ({
      ...eq,
      category_name: categories.find(c => c.id === eq.category_id)?.name || '',
      location_name: locations.find(l => l.id === eq.location_id)?.name || ''
    })) as EquipmentWithRelations[];
  }

  // Синхронная версия для совместимости
  getEquipmentByAssignedUserSync(assignedTo: string): EquipmentWithRelations[] {
    console.warn('getEquipmentByAssignedUserSync called - use async version instead');
    return [];
  }

  // Обновить статус оборудования
  async updateEquipmentStatus(id: number, status: string): Promise<boolean> {
    const updated = await this.db.update('equipment', id, { 
      status, 
      updated_at: new Date().toISOString() 
    });
    
    if (updated) {
      // Добавляем в очередь синхронизации
      const equipment = await this.db.selectById('equipment', id);
      if (equipment) {
        syncAdapter.addToSyncQueue('equipment', 'update', equipment);
      }
    }
    
    return !!updated;
  }

  // Синхронная версия для совместимости
  updateEquipmentStatusSync(id: number, status: string): boolean {
    console.warn('updateEquipmentStatusSync called - use async version instead');
    return false;
  }

  // Назначить оборудование пользователю
  async assignEquipment(id: number, assignedTo: string): Promise<boolean> {
    const updated = await this.db.update('equipment', id, { 
      assigned_to: assignedTo,
      status: 'in-use',
      updated_at: new Date().toISOString() 
    });
    
    if (updated) {
      // Добавляем в очередь синхронизации
      const equipment = await this.db.selectById('equipment', id);
      if (equipment) {
        syncAdapter.addToSyncQueue('equipment', 'update', equipment);
      }
    }
    
    return !!updated;
  }

  // Синхронная версия для совместимости
  assignEquipmentSync(id: number, assignedTo: string): boolean {
    console.warn('assignEquipmentSync called - use async version instead');
    return false;
  }

  // Освободить оборудование
  async unassignEquipment(id: number): Promise<boolean> {
    const updated = await this.db.update('equipment', id, { 
      assigned_to: null,
      status: 'available',
      updated_at: new Date().toISOString() 
    });
    
    if (updated) {
      // Добавляем в очередь синхронизации
      const equipment = await this.db.selectById('equipment', id);
      if (equipment) {
        syncAdapter.addToSyncQueue('equipment', 'update', equipment);
      }
    }
    
    return !!updated;
  }

  // Синхронная версия для совместимости
  unassignEquipmentSync(id: number): boolean {
    console.warn('unassignEquipmentSync called - use async version instead');
    return false;
  }

  // Получить остатки оборудования по категориям
  async getInventorySummary(): Promise<{ [categoryName: string]: { total: number; available: number; inUse: number; maintenance: number; } }> {
    const equipment = await this.getAllEquipment();
    const categories = await this.db.selectAll('categories');
    
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

  // Синхронная версия для совместимости
  getInventorySummarySync(): { [categoryName: string]: { total: number; available: number; inUse: number; maintenance: number; } } {
    console.warn('getInventorySummarySync called - use async version instead');
    return {};
  }

  // Получить остатки оборудования по местоположениям
  async getInventoryByLocation(): Promise<{ [locationName: string]: { total: number; available: number; inUse: number; maintenance: number; } }> {
    const equipment = await this.getAllEquipment();
    const locations = await this.db.selectAll('locations');
    
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

  // Синхронная версия для совместимости
  getInventoryByLocationSync(): { [locationName: string]: { total: number; available: number; inUse: number; maintenance: number; } } {
    console.warn('getInventoryByLocationSync called - use async version instead');
    return {};
  }

  // Получить детальную информацию о доступном оборудовании
  async getAvailableEquipmentDetails(): Promise<EquipmentWithRelations[]> {
    return this.getEquipmentByStatus('available');
  }

  // Синхронная версия для совместимости
  getAvailableEquipmentDetailsSync(): EquipmentWithRelations[] {
    console.warn('getAvailableEquipmentDetailsSync called - use async version instead');
    return [];
  }
}