import { Equipment } from "../components/EquipmentList";
import { EquipmentStack } from "../components/StackManagement";
import { ExtendedShipment, AppStats, CountMap } from "../types";

// Вычисляем общую статистику приложения
export const calculateStats = (
  equipment: Equipment[],
  stacks: EquipmentStack[],
  shipments: ExtendedShipment[]
): AppStats => {
  return {
    totalEquipment: equipment.length,
    availableEquipment: equipment.filter(item => item.status === "available").length,
    inUseEquipment: equipment.filter(item => item.status === "in-use").length,
    maintenanceEquipment: equipment.filter(item => item.status === "maintenance").length,
    categories: new Set(equipment.map(item => item.category)).size,
    totalStacks: stacks.length,
    totalShipments: shipments.length
  };
};

// Вычисляем количество оборудования по категориям
export const calculateEquipmentCountByCategory = (equipment: Equipment[]): CountMap => {
  return equipment.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as CountMap);
};

// Вычисляем количество оборудования по местоположениям
export const calculateEquipmentCountByLocation = (equipment: Equipment[]): CountMap => {
  return equipment.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {} as CountMap);
};