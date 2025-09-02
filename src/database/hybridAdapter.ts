import { isRedisAvailable, isPostgresAvailable } from '../config/api';
import VercelKVAdapter, { VercelKVConfig } from './vercelKVAdapter';

export interface HybridDatabaseConfig {
  redis?: VercelKVConfig;
  postgres?: {
    url: string;
    host: string;
    database: string;
    username: string;
    password: string;
  };
  fallbackToLocal?: boolean;
}

export interface DatabaseOperation {
  type: 'redis' | 'postgres' | 'local';
  success: boolean;
  data?: any;
  error?: string;
}

class HybridDatabaseAdapter {
  private redisAdapter?: VercelKVAdapter;
  // private postgresAdapter?: any; // Будет добавлен позже
  private config: HybridDatabaseConfig;
  private isInitialized: boolean = false;
  private fallbackToLocal: boolean = false; // Отключаем fallback к локальному хранилищу
  private localStorage: Map<string, any> = new Map();

  constructor(config: HybridDatabaseConfig) {
    this.config = config;
    this.fallbackToLocal = config.fallbackToLocal ?? true; // Разрешаем fallback к локальному хранилищу по умолчанию
  }

  // Инициализация адаптера
  async init(): Promise<void> {
    try {
      console.log('Initializing Hybrid Database Adapter...');

      // Инициализируем Redis если доступен
      if (isRedisAvailable() && this.config.redis) {
        try {
          this.redisAdapter = new VercelKVAdapter(this.config.redis);
          await this.redisAdapter.init();
          console.log('Redis adapter initialized successfully');
        } catch (error) {
          console.warn('Failed to initialize Redis adapter:', error);
        }
      }

      // Инициализируем Postgres если доступен
      if (isPostgresAvailable() && this.config.postgres) {
        try {
          // TODO: Добавить Postgres адаптер
          console.log('Postgres adapter will be added later');
        } catch (error) {
          console.warn('Failed to initialize Postgres adapter:', error);
        }
      }

      // Проверяем, что хотя бы один адаптер БД инициализирован или разрешен fallback
      if (!this.redisAdapter && !isPostgresAvailable() && !this.fallbackToLocal) {
        throw new Error('No database adapters available. Cannot initialize without database connection.');
      }

      // Если нет внешних баз данных, но разрешен fallback, используем локальное хранилище
      if (!this.redisAdapter && !isPostgresAvailable() && this.fallbackToLocal) {
        console.log('No external databases available, using local storage fallback');
      }

      this.isInitialized = true;
      console.log('Hybrid Database Adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hybrid Database Adapter:', error);
      // Разрешаем fallback к локальному хранилищу
      if (this.fallbackToLocal) {
        console.log('Using local storage fallback due to initialization error');
        this.isInitialized = true;
      } else {
        throw new Error('Database initialization failed. No fallback to local storage allowed.');
      }
    }
  }

  // Проверка инициализации
  private checkInit(): void {
    if (!this.isInitialized) {
      throw new Error('Hybrid Database Adapter not initialized. Call init() first.');
    }
  }

  // Установка значения с автоматическим выбором хранилища
  async set(key: string, value: any, options?: { 
    storage?: 'redis' | 'postgres' | 'local' | 'auto';
    expiration?: number;
    table?: string;
  }): Promise<DatabaseOperation> {
    this.checkInit();

    const storage = options?.storage || 'auto';
    const expiration = options?.expiration;
    const table = options?.table;

    try {
      // Автоматический выбор хранилища
      if (storage === 'auto') {
        if (table && this.shouldUsePostgres(table)) {
          return await this.setInPostgres(key, value, table);
        } else if (this.redisAdapter) {
          return await this.setInRedis(key, value, expiration);
        } else {
          throw new Error('No database adapters available. Cannot use local storage.');
        }
      }

      // Ручной выбор хранилища
      switch (storage) {
        case 'redis':
          if (this.redisAdapter) {
            return await this.setInRedis(key, value, expiration);
          } else {
            throw new Error('Redis adapter not available');
          }
        case 'postgres':
          if (table) {
            return await this.setInPostgres(key, value, table);
          } else {
            throw new Error('Table name required for Postgres storage');
          }
        case 'local':
          // Используем локальное хранилище как fallback
          return await this.setInLocal(key, value);
        default:
          throw new Error(`Unknown storage type: ${storage}`);
      }
    } catch (error) {
      console.error(`Failed to set key ${key}:`, error);
      
      // Не используем fallback к локальному хранилищу
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Получение значения с автоматическим поиском по всем хранилищам
  async get(key: string, options?: {
    storage?: 'redis' | 'postgres' | 'local' | 'auto';
    table?: string;
  }): Promise<DatabaseOperation> {
    this.checkInit();

    const storage = options?.storage || 'auto';
    const table = options?.table;

    try {
      if (storage === 'auto') {
        // Пробуем все доступные хранилища
        if (table && this.shouldUsePostgres(table)) {
          try {
            const result = await this.getFromPostgres(key, table);
            if (result.success) return result;
          } catch (error) {
            console.log(`Postgres get failed for ${key}, trying Redis...`);
          }
        }

        if (this.redisAdapter) {
          try {
            const result = await this.getFromRedis(key);
            if (result.success) return result;
          } catch (error) {
            console.log(`Redis get failed for ${key}, no local fallback available.`);
          }
        }

        // Нет доступных хранилищ
        throw new Error('No database adapters available. Cannot use local storage.');
      }

      // Ручной выбор хранилища
      switch (storage) {
        case 'redis':
          if (this.redisAdapter) {
            return await this.getFromRedis(key);
          } else {
            throw new Error('Redis adapter not available');
          }
        case 'postgres':
          if (table) {
            return await this.getFromPostgres(key, table);
          } else {
            throw new Error('Table name required for Postgres storage');
          }
        case 'local':
          throw new Error('Local storage is disabled. Use database storage only.');
        default:
          throw new Error(`Unknown storage type: ${storage}`);
      }
    } catch (error) {
      console.error(`Failed to get key ${key}:`, error);
      
      // Не используем fallback к локальному хранилищу
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Удаление ключа
  async delete(key: string, options?: {
    storage?: 'redis' | 'postgres' | 'local' | 'auto';
    table?: string;
  }): Promise<DatabaseOperation> {
    this.checkInit();

    const storage = options?.storage || 'auto';
    const table = options?.table;

    try {
      if (storage === 'auto') {
        // Удаляем из всех хранилищ
        const results: DatabaseOperation[] = [];

        if (table && this.shouldUsePostgres(table)) {
          try {
            results.push(await this.deleteFromPostgres(key, table));
          } catch (error) {
            console.log(`Postgres delete failed for ${key}`);
          }
        }

        if (this.redisAdapter) {
          try {
            results.push(await this.deleteFromRedis(key));
          } catch (error) {
            console.log(`Redis delete failed for ${key}`);
          }
        }

        // Не удаляем из локального хранилища
        if (results.length === 0) {
          throw new Error('No database adapters available. Cannot use local storage.');
        }

        // Возвращаем успешный результат если хотя бы одна операция удалась
        const hasSuccess = results.some(r => r.success);
        return {
          type: 'redis' as const, // Используем redis как fallback тип
          success: hasSuccess,
          data: { results }
        };
      }

      // Ручной выбор хранилища
      switch (storage) {
        case 'redis':
          if (this.redisAdapter) {
            return await this.deleteFromRedis(key);
          } else {
            throw new Error('Redis adapter not available');
          }
        case 'postgres':
          if (table) {
            return await this.deleteFromPostgres(key, table);
          } else {
            throw new Error('Table name required for Postgres storage');
          }
        case 'local':
          throw new Error('Local storage is disabled. Use database storage only.');
        default:
          throw new Error(`Unknown storage type: ${storage}`);
      }
    } catch (error) {
      console.error(`Failed to delete key ${key}:`, error);
      
      // Не используем fallback к локальному хранилищу
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Redis операции
  private async setInRedis(key: string, value: any, expiration?: number): Promise<DatabaseOperation> {
    if (!this.redisAdapter) {
      throw new Error('Redis adapter not available');
    }

    await this.redisAdapter.set(key, value, expiration);
    return {
      type: 'redis',
      success: true,
      data: value
    };
  }

  private async getFromRedis(key: string): Promise<DatabaseOperation> {
    if (!this.redisAdapter) {
      throw new Error('Redis adapter not available');
    }

    const value = await this.redisAdapter.get(key);
    return {
      type: 'redis',
      success: true,
      data: value
    };
  }

  private async deleteFromRedis(key: string): Promise<DatabaseOperation> {
    if (!this.redisAdapter) {
      throw new Error('Redis adapter not available');
    }

    await this.redisAdapter.delete(key);
    return {
      type: 'redis',
      success: true
    };
  }

  // Postgres операции (заглушки для будущего)
  private async setInPostgres(key: string, _value: any, table: string): Promise<DatabaseOperation> {
    // TODO: Реализовать Postgres операции
    console.log(`Postgres set not implemented yet: ${key} -> ${table}`);
    throw new Error('Postgres operations not implemented yet');
  }

  private async getFromPostgres(key: string, table: string): Promise<DatabaseOperation> {
    // TODO: Реализовать Postgres операции
    console.log(`Postgres get not implemented yet: ${key} from ${table}`);
    throw new Error('Postgres operations not implemented yet');
  }

  private async deleteFromPostgres(key: string, table: string): Promise<DatabaseOperation> {
    // TODO: Реализовать Postgres операции
    console.log(`Postgres delete not implemented yet: ${key} from ${table}`);
    throw new Error('Postgres operations not implemented yet');
  }

  // Локальные операции
  private async setInLocal(key: string, value: any): Promise<DatabaseOperation> {
    this.localStorage.set(key, value);
    
    // Также сохраняем в localStorage для персистентности
    try {
      localStorage.setItem(`hybrid-db-${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }

    return {
      type: 'local',
      success: true,
      data: value
    };
  }

  private async getFromLocal(key: string): Promise<DatabaseOperation> {
    // Сначала проверяем память
    if (this.localStorage.has(key)) {
      return {
        type: 'local',
        success: true,
        data: this.localStorage.get(key)
      };
    }

    // Затем проверяем localStorage
    try {
      const stored = localStorage.getItem(`hybrid-db-${key}`);
      if (stored) {
        const value = JSON.parse(stored);
        this.localStorage.set(key, value); // Кэшируем в память
        return {
          type: 'local',
          success: true,
          data: value
        };
      }
    } catch (error) {
      console.warn('Failed to parse localStorage value:', error);
    }

    return {
      type: 'local',
      success: false,
      error: 'Key not found'
    };
  }

  private async deleteFromLocal(key: string): Promise<DatabaseOperation> {
    this.localStorage.delete(key);
    
    try {
      localStorage.removeItem(`hybrid-db-${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }

    return {
      type: 'local',
      success: true
    };
  }

  // Определение, когда использовать Postgres
  private shouldUsePostgres(table: string): boolean {
    // Используем Postgres для структурированных данных
    const postgresTables = ['equipment', 'categories', 'locations', 'shipments', 'stacks', 'users'];
    return postgresTables.includes(table.toLowerCase());
  }

  // Получение статистики
  async getStats(): Promise<{
    redis: { available: boolean; keys?: number };
    postgres: { available: boolean; tables?: number };
    local: { keys: number };
    total: number;
  }> {
    this.checkInit();

    const stats = {
      redis: { available: false, keys: 0 },
      postgres: { available: false, tables: 0 },
      local: { keys: 0 }, // Локальное хранилище отключено
      total: 0
    };

    // Redis статистика
    if (this.redisAdapter) {
      try {
        const redisStats = await this.redisAdapter.getStats();
        stats.redis = { available: true, keys: redisStats.totalKeys };
      } catch (error) {
        console.warn('Failed to get Redis stats:', error);
      }
    }

    // Postgres статистика
    if (isPostgresAvailable()) {
      stats.postgres.available = true;
      // TODO: Добавить получение статистики Postgres
    }

    stats.total = (stats.redis.keys || 0) + (stats.postgres.tables || 0);

    return stats;
  }

  // Очистка всех данных
  async clear(): Promise<void> {
    this.checkInit();

    // Очищаем Redis
    if (this.redisAdapter) {
      try {
        await this.redisAdapter.flush();
      } catch (error) {
        console.warn('Failed to clear Redis:', error);
      }
    }

    // Очищаем Postgres (TODO)
    if (isPostgresAvailable()) {
      console.log('Postgres clear not implemented yet');
    }

    // Не очищаем локальное хранилище - оно отключено
    console.log('Database storage cleared successfully');
  }

  // Закрытие соединений
  async close(): Promise<void> {
    if (this.redisAdapter) {
      await this.redisAdapter.close();
    }

    // TODO: Закрыть Postgres соединение

    this.isInitialized = false;
    console.log('Hybrid Database Adapter closed');
  }
}

export default HybridDatabaseAdapter;
