export interface VercelKVConfig {
  url: string;
  token: string;
}

export interface KVOperation {
  key: string;
  value: any;
  expiration?: number;
}

export interface KVQueryOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

class VercelKVAdapter {
  private config: VercelKVConfig;
  private isInitialized: boolean = false;

  constructor(config: VercelKVConfig) {
    this.config = config;
  }

  // Инициализация адаптера
  async init(): Promise<void> {
    try {
      // Проверяем подключение к KV
      const testResponse = await fetch(`${this.config.url}/get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: 'test-connection' })
      });

      if (!testResponse.ok) {
        throw new Error(`KV connection test failed: ${testResponse.status}`);
      }

      this.isInitialized = true;
      console.log('Vercel KV adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Vercel KV adapter:', error);
      throw error;
    }
  }

  // Проверка инициализации
  private checkInit(): void {
    if (!this.isInitialized) {
      throw new Error('Vercel KV adapter not initialized. Call init() first.');
    }
  }

  // Установка значения
  async set(key: string, value: any, expiration?: number): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/set`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value,
          expiration
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set key: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  // Получение значения
  async get(key: string): Promise<any> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/get`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Ключ не найден
        }
        throw new Error(`Failed to get key: ${response.status}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  // Удаление ключа
  async delete(key: string): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/del`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete key: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  // Получение списка ключей по префиксу
  async list(prefix: string = '', limit: number = 100): Promise<string[]> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/list`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prefix,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to list keys: ${response.status}`);
      }

      const result = await response.json();
      return result.result || [];
    } catch (error) {
      console.error(`Failed to list keys with prefix ${prefix}:`, error);
      throw error;
    }
  }

  // Получение нескольких значений по ключам
  async mget(keys: string[]): Promise<Record<string, any>> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/mget`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });

      if (!response.ok) {
        throw new Error(`Failed to get multiple keys: ${response.status}`);
      }

      const result = await response.json();
      return result.result || {};
    } catch (error) {
      console.error(`Failed to get multiple keys:`, error);
      throw error;
    }
  }

  // Установка нескольких значений
  async mset(operations: KVOperation[]): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/mset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operations })
      });

      if (!response.ok) {
        throw new Error(`Failed to set multiple keys: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to set multiple keys:`, error);
      throw error;
    }
  }

  // Проверка существования ключа
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  // Установка времени жизни ключа
  async expire(key: string, seconds: number): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/expire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          seconds
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set expiration for key: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to set expiration for key ${key}:`, error);
      throw error;
    }
  }

  // Получение времени жизни ключа
  async ttl(key: string): Promise<number> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/ttl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        throw new Error(`Failed to get TTL for key: ${response.status}`);
      }

      const result = await response.json();
      return result.result || -1;
    } catch (error) {
      console.error(`Failed to get TTL for key ${key}:`, error);
      throw error;
    }
  }

  // Увеличение числового значения
  async incr(key: string, amount: number = 1): Promise<number> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/incr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          amount
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to increment key: ${response.status}`);
      }

      const result = await response.json();
      return result.result || 0;
    } catch (error) {
      console.error(`Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  // Добавление в список
  async lpush(key: string, value: any): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/lpush`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to push to list: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to push to list ${key}:`, error);
      throw error;
    }
  }

  // Получение элемента из списка
  async lpop(key: string): Promise<any> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/lpop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Список пуст
        }
        throw new Error(`Failed to pop from list: ${response.status}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      console.error(`Failed to pop from list ${key}:`, error);
      throw error;
    }
  }

  // Получение длины списка
  async llen(key: string): Promise<number> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/llen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        throw new Error(`Failed to get list length: ${response.status}`);
      }

      const result = await response.json();
      return result.result || 0;
    } catch (error) {
      console.error(`Failed to get list length for ${key}:`, error);
      throw error;
    }
  }

  // Получение всех элементов списка
  async lrange(key: string, start: number = 0, stop: number = -1): Promise<any[]> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/lrange`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          start,
          stop
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get list range: ${response.status}`);
      }

      const result = await response.json();
      return result.result || [];
    } catch (error) {
      console.error(`Failed to get list range for ${key}:`, error);
      throw error;
    }
  }

  // Очистка всех данных (только для разработки)
  async flush(): Promise<void> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/flush`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to flush database: ${response.status}`);
      }

      console.log('Database flushed successfully');
    } catch (error) {
      console.error('Failed to flush database:', error);
      throw error;
    }
  }

  // Получение статистики
  async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: number;
    connectedClients: number;
  }> {
    this.checkInit();

    try {
      const response = await fetch(`${this.config.url}/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get stats: ${response.status}`);
      }

      const result = await response.json();
      return {
        totalKeys: result.total_keys || 0,
        memoryUsage: result.memory_usage || 0,
        connectedClients: result.connected_clients || 0
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }

  // Закрытие соединения
  async close(): Promise<void> {
    this.isInitialized = false;
    console.log('Vercel KV adapter closed');
  }
}

export default VercelKVAdapter;
