// Экспорты классов сервисов
export { EquipmentService } from './equipmentService';
export { CategoryService } from './categoryService';
export { LocationService } from './locationService';
export { StackService } from './stackService';
export { ShipmentService } from './shipmentService';

// Экспорты экземпляров сервисов
import { EquipmentService } from './equipmentService';
import { CategoryService } from './categoryService';
import { LocationService } from './locationService';
import { StackService } from './stackService';
import { ShipmentService } from './shipmentService';

export const equipmentService = new EquipmentService();
export const categoryService = new CategoryService();
export const locationService = new LocationService();
export const stackService = new StackService();
export const shipmentService = new ShipmentService();