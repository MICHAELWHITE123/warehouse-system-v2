import { useState, useEffect, useCallback } from 'react';
import { 
  equipmentService, 
  categoryService, 
  locationService, 
  stackService, 
  shipmentService 
} from '../database/services';
import type { 
  EquipmentWithRelations,
  DbCategory,
  DbLocation,
  StackWithEquipment,
  ShipmentWithDetails
} from '../database/types';
import { initDatabase } from '../database';

// Хук для инициализации базы данных
export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      initDatabase();
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database initialization failed');
    }
  }, []);

  return { isInitialized, error };
}

// Хук для работы с оборудованием
export function useEquipment() {
  const [equipment, setEquipment] = useState<EquipmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = equipmentService.getAllEquipment();
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, []);

  const createEquipment = useCallback(async (data: any) => {
    try {
      await equipmentService.createEquipment(data);
      await loadEquipment();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create equipment');
    }
  }, [loadEquipment]);

  const updateEquipment = useCallback(async (data: any) => {
    try {
      await equipmentService.updateEquipment(data);
      await loadEquipment();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update equipment');
    }
  }, [loadEquipment]);

  const deleteEquipment = useCallback(async (id: number) => {
    try {
      await equipmentService.deleteEquipment(id);
      await loadEquipment();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete equipment');
    }
  }, [loadEquipment]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  return {
    equipment,
    loading,
    error,
    loadEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
  };
}

// Хук для работы с категориями
export function useCategories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: any) => {
    try {
      await categoryService.createCategory(data);
      await loadCategories();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create category');
    }
  }, [loadCategories]);

  const updateCategory = useCallback(async (id: number, data: any) => {
    try {
      await categoryService.updateCategory(id, data);
      await loadCategories();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update category');
    }
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      await categoryService.deleteCategory(id);
      await loadCategories();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }, [loadCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}

// Хук для работы с местоположениями
export function useLocations() {
  const [locations, setLocations] = useState<DbLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = locationService.getAllLocations();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLocation = useCallback(async (data: any) => {
    try {
      await locationService.createLocation(data);
      await loadLocations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create location');
    }
  }, [loadLocations]);

  const updateLocation = useCallback(async (id: number, data: any) => {
    try {
      await locationService.updateLocation(id, data);
      await loadLocations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update location');
    }
  }, [loadLocations]);

  const deleteLocation = useCallback(async (id: number) => {
    try {
      await locationService.deleteLocation(id);
      await loadLocations();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete location');
    }
  }, [loadLocations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return {
    locations,
    loading,
    error,
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation
  };
}

// Хук для работы со стеками
export function useStacks() {
  const [stacks, setStacks] = useState<StackWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = stackService.getAllStacksWithEquipment();
      setStacks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stacks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStack = useCallback(async (data: any) => {
    try {
      await stackService.createStack(data);
      await loadStacks();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create stack');
    }
  }, [loadStacks]);

  const updateStack = useCallback(async (data: any) => {
    try {
      await stackService.updateStack(data);
      await loadStacks();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update stack');
    }
  }, [loadStacks]);

  const deleteStack = useCallback(async (id: number) => {
    try {
      await stackService.deleteStack(id);
      await loadStacks();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete stack');
    }
  }, [loadStacks]);

  useEffect(() => {
    loadStacks();
  }, [loadStacks]);

  return {
    stacks,
    loading,
    error,
    loadStacks,
    createStack,
    updateStack,
    deleteStack
  };
}

// Хук для работы с отгрузками
export function useShipments() {
  const [shipments, setShipments] = useState<ShipmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const basicShipments = shipmentService.getAllShipments();
      const detailedShipments = basicShipments.map(shipment => 
        shipmentService.getShipmentWithDetails(shipment.id)
      ).filter(Boolean) as ShipmentWithDetails[];
      setShipments(detailedShipments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  const createShipment = useCallback(async (data: any) => {
    try {
      await shipmentService.createShipment(data);
      await loadShipments();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create shipment');
    }
  }, [loadShipments]);

  const createShipmentWithDetails = useCallback(async (data: any) => {
    try {
      await shipmentService.createShipmentWithDetails(data);
      await loadShipments();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create shipment with details');
    }
  }, [loadShipments]);

  const updateShipment = useCallback(async (data: any) => {
    try {
      await shipmentService.updateShipment(data);
      await loadShipments();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update shipment');
    }
  }, [loadShipments]);

  const deleteShipment = useCallback(async (id: number) => {
    try {
      await shipmentService.deleteShipment(id);
      await loadShipments();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete shipment');
    }
  }, [loadShipments]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return {
    shipments,
    loading,
    error,
    loadShipments,
    createShipment,
    createShipmentWithDetails,
    updateShipment,
    deleteShipment
  };
}

// Хук для получения статистики
export function useStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const equipmentStats = equipmentService.getEquipmentStats();
      const categoriesCount = categoryService.getAllCategories().length;
      const stackStats = stackService.getStackStats();
      const shipmentStats = shipmentService.getShipmentStats();
      
      setStats({
        totalEquipment: equipmentStats.total,
        availableEquipment: equipmentStats.available,
        inUseEquipment: equipmentStats.inUse,
        maintenanceEquipment: equipmentStats.maintenance,
        categories: categoriesCount,
        totalStacks: stackStats.totalStacks,
        totalShipments: shipmentStats.total
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats
  };
}
