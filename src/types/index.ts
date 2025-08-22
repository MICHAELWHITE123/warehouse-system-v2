// Реэкспорт типов из базы данных
export * from '../database/types';

// Реэкспорт типов для системы прав доступа
export * from './permissions';

// Импорт интерфейса отгрузки из компонента (для обратной совместимости)
import { Shipment } from "../components/ShipmentList";

// Расширенный интерфейс отгрузки с поддержкой стеков
export interface ExtendedShipment extends Shipment {
  stacks?: {
    stackId: string;
    name: string;
    equipmentIds: string[];
    quantity: number;
  }[];
}

// Интерфейс для статистики приложения
export interface AppStats {
  totalEquipment: number;
  availableEquipment: number;
  inUseEquipment: number;
  maintenanceEquipment: number;
  categories: number;
  totalStacks: number;
  totalShipments: number;
}

// Тип для активных видов приложения
export type ActiveView = 
  | "dashboard"
  | "equipment"
  | "stacks"
  | "shipments"
  | "categories"
  | "locations"
  | "add-equipment"
  | "add-stack"
  | "add-shipment"
  | "edit-equipment"
  | "edit-stack"
  | "edit-shipment"
  | "view-equipment"
  | "admin";

// Интерфейс для подсчета по категориям/местоположениям
export interface CountMap {
  [key: string]: number;
}

export interface User {
  id: string;
  username: string;
  login: string;
  nickname: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}