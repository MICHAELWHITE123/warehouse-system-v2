import HybridDatabaseAdapter from './hybridAdapter';
import { isRedisAvailable, isPostgresAvailable } from '../config/api';

// Интерфейс для совместимости с BrowserDatabase
export interface ServiceDatabase {
  selectAll(tableName: string): Promise<any[]>;
  selectById(tableName: string, id: number): Promise<any | null>;
  selectWhere(tableName: string, condition: (record: any) => boolean): Promise<any[]>;
  insert(tableName: string, data: any): Promise<any>;
  update(tableName: string, id: number, data: any): Promise<any>;
  delete(tableName: string, id: number): Promise<boolean>;
  count(tableName: string, condition?: (record: any) => boolean): Promise<number>;
}

class ServiceDatabaseAdapter implements ServiceDatabase {
  private hybridAdapter: HybridDatabaseAdapter;
  private isInitialized: boolean = false;

  constructor() {
    // Инициализируем гибридный адаптер с конфигурацией только для БД
    this.hybridAdapter = new HybridDatabaseAdapter({
      fallbackToLocal: false,
      redis: {
        url: import.meta.env.VITE_VERCEL_KV_URL,
        restApiUrl: import.meta.env.VITE_VERCEL_KV_REST_API_URL,
        restApiToken: import.meta.env.VITE_VERCEL_KV_REST_API_TOKEN,
        restApiReadOnlyToken: import.meta.env.VITE_VERCEL_KV_REST_API_READ_ONLY_TOKEN
      } as any, // Временно используем any для обхода ошибки типов
      postgres: {
        url: import.meta.env.VITE_POSTGRES_URL,
        host: import.meta.env.VITE_POSTGRES_HOST,
        database: import.meta.env.VITE_POSTGRES_DATABASE,
        username: import.meta.env.VITE_POSTGRES_USERNAME,
        password: import.meta.env.VITE_POSTGRES_PASSWORD
      }
    });
  }

  async init(): Promise<void> {
    if (!this.isInitialized) {
      await this.hybridAdapter.init();
      this.isInitialized = true;
    }
  }

  private checkInit(): void {
    if (!this.isInitialized) {
      throw new Error('ServiceDatabaseAdapter not initialized. Call init() first.');
    }
  }

  // Получить все записи из таблицы
  async selectAll(tableName: string): Promise<any[]> {
    this.checkInit();
    
    try {
      const result = await this.hybridAdapter.get(`${tableName}:all`, { table: tableName });
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }
      return [];
    } catch (error) {
      console.error(`Failed to selectAll from ${tableName}:`, error);
      return [];
    }
  }

  // Получить запись по ID
  async selectById(tableName: string, id: number): Promise<any | null> {
    this.checkInit();
    
    try {
      const result = await this.hybridAdapter.get(`${tableName}:${id}`, { table: tableName });
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to selectById from ${tableName}:`, error);
      return null;
    }
  }

  // Поиск записей по условию
  async selectWhere(tableName: string, condition: (record: any) => boolean): Promise<any[]> {
    this.checkInit();
    
    try {
      const allRecords = await this.selectAll(tableName);
      return allRecords.filter(condition);
    } catch (error) {
      console.error(`Failed to selectWhere from ${tableName}:`, error);
      return [];
    }
  }

  // Подсчет записей
  async count(tableName: string, condition?: (record: any) => boolean): Promise<number> {
    this.checkInit();
    
    try {
      const allRecords = await this.selectAll(tableName);
      if (condition) {
        return allRecords.filter(condition).length;
      }
      return allRecords.length;
    } catch (error) {
      console.error(`Failed to count from ${tableName}:`, error);
      return 0;
    }
  }

  // Вставка записи
  async insert(tableName: string, data: any): Promise<any> {
    this.checkInit();
    
    try {
      const id = Date.now(); // Простой способ генерации ID
      const record = { id, ...data, created_at: new Date().toISOString() };
      
      // Сохраняем запись
      await this.hybridAdapter.set(`${tableName}:${id}`, record, { table: tableName });
      
      // Обновляем список всех записей
      const allRecords = await this.selectAll(tableName);
      allRecords.push(record);
      await this.hybridAdapter.set(`${tableName}:all`, allRecords, { table: tableName });
      
      return record;
    } catch (error) {
      console.error(`Failed to insert into ${tableName}:`, error);
      throw error;
    }
  }

  // Обновление записи
  async update(tableName: string, id: number, data: any): Promise<any> {
    this.checkInit();
    
    try {
      const existingRecord = await this.selectById(tableName, id);
      if (!existingRecord) {
        throw new Error(`Record with id ${id} not found in ${tableName}`);
      }
      
      const updatedRecord = { 
        ...existingRecord, 
        ...data, 
        id, // Сохраняем оригинальный ID
        updated_at: new Date().toISOString() 
      };
      
      // Обновляем запись
      await this.hybridAdapter.set(`${tableName}:${id}`, updatedRecord, { table: tableName });
      
      // Обновляем список всех записей
      const allRecords = await this.selectAll(tableName);
      const recordIndex = allRecords.findIndex((r: any) => r.id === id);
      if (recordIndex !== -1) {
        allRecords[recordIndex] = updatedRecord;
        await this.hybridAdapter.set(`${tableName}:all`, allRecords, { table: tableName });
      }
      
      return updatedRecord;
    } catch (error) {
      console.error(`Failed to update ${tableName}:`, error);
      throw error;
    }
  }

  // Удаление записи
  async delete(tableName: string, id: number): Promise<boolean> {
    this.checkInit();
    
    try {
      // Удаляем запись
      await this.hybridAdapter.delete(`${tableName}:${id}`, { table: tableName });
      
      // Обновляем список всех записей
      const allRecords = await this.selectAll(tableName);
      const filteredRecords = allRecords.filter((r: any) => r.id !== id);
      await this.hybridAdapter.set(`${tableName}:all`, filteredRecords, { table: tableName });
      
      return true;
    } catch (error) {
      console.error(`Failed to delete from ${tableName}:`, error);
      return false;
    }
  }

  // Синхронные версии методов для совместимости
  selectAllSync(tableName: string): any[] {
    // Для совместимости возвращаем пустой массив
    // В реальном приложении нужно использовать асинхронные методы
    console.warn(`selectAllSync called for ${tableName} - use async version instead`);
    return [];
  }

  selectByIdSync(tableName: string, id: number): any | null {
    console.warn(`selectByIdSync called for ${tableName} - use async version instead`);
    return null;
  }

  selectWhereSync(tableName: string, condition: (record: any) => boolean): any[] {
    console.warn(`selectWhereSync called for ${tableName} - use async version instead`);
    return [];
  }

  countSync(tableName: string, condition?: (record: any) => boolean): number {
    console.warn(`countSync called for ${tableName} - use async version instead`);
    return 0;
  }

  insertSync(tableName: string, data: any): any {
    console.warn(`insertSync called for ${tableName} - use async version instead`);
    return { id: Date.now(), ...data };
  }

  updateSync(tableName: string, id: number, data: any): any {
    console.warn(`updateSync called for ${tableName} - use async version instead`);
    return { id, ...data };
  }

  deleteSync(tableName: string, id: number): boolean {
    console.warn(`deleteSync called for ${tableName} - use async version instead`);
    return false;
  }
}

// Создаем единственный экземпляр адаптера
export const serviceDb = new ServiceDatabaseAdapter();
