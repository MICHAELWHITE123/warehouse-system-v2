import { getDatabase } from '../index';
import type { DbLocation, CreateLocation, UpdateLocation } from '../types';
import type { BrowserDatabase } from '../browserDatabase';

export class LocationService {
  private get db(): BrowserDatabase {
    return getDatabase();
  }

  // Получить все местоположения
  getAllLocations(): DbLocation[] {
    return this.db.selectAll('locations') as DbLocation[];
  }

  // Получить местоположение по ID
  getLocationById(id: number): DbLocation | null {
    return this.db.selectById('locations', id) as DbLocation | null;
  }

  // Получить местоположение по имени
  getLocationByName(name: string): DbLocation | null {
    const locations = this.db.selectWhere('locations', loc => loc.name === name);
    return locations.length > 0 ? locations[0] as DbLocation : null;
  }

  // Создать новое местоположение
  createLocation(location: CreateLocation): DbLocation {
    const now = new Date().toISOString();
    const newLocation = {
      ...location,
      created_at: now,
      updated_at: now
    };

    return this.db.insert('locations', newLocation) as DbLocation;
  }

  // Обновить местоположение
  updateLocation(id: number, location: UpdateLocation): DbLocation | null {
    const now = new Date().toISOString();
    const updatedLocation = {
      ...location,
      updated_at: now
    };

    return this.db.update('locations', id, updatedLocation) as DbLocation | null;
  }

  // Проверить, используется ли местоположение
  isLocationInUse(id: number): boolean {
    const equipmentCount = this.db.count('equipment', eq => eq.location_id === id);
    return equipmentCount > 0;
  }

  // Удалить местоположение
  deleteLocation(id: number): boolean {
    return this.db.delete('locations', id);
  }

  // Получить количество оборудования в местоположении
  getEquipmentCountByLocation(id: number): number {
    return this.db.count('equipment', eq => eq.location_id === id);
  }

  // Получить статистику по местоположениям
  getLocationStats(): Array<{ location: DbLocation; equipmentCount: number }> {
    const locations = this.getAllLocations();
    return locations.map(location => ({
      location,
      equipmentCount: this.getEquipmentCountByLocation(location.id)
    }));
  }

  // Поиск местоположений
  searchLocations(query: string): DbLocation[] {
    return this.db.selectWhere('locations', loc => 
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      (loc.description && loc.description.toLowerCase().includes(query.toLowerCase())) ||
      (loc.address && loc.address.toLowerCase().includes(query.toLowerCase()))
    ) as DbLocation[];
  }
}