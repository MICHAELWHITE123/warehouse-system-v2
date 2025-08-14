import Database from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Типы для SQLite адаптера
interface SqliteDatabase {
  run(sql: string, params?: any[]): Promise<any>;
  get(sql: string, params?: any[]): Promise<any>;
  all(sql: string, params?: any[]): Promise<any[]>;
  close(): Promise<void>;
}

class SqliteAdapter implements SqliteDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database.Database(dbPath);
  }

  async run(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            lastID: this.lastID, 
            changes: this.changes,
            rows: []
          });
        }
      });
    });
  }

  async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Путь к файлу базы данных SQLite
const dbPath = path.join(process.cwd(), 'warehouse.db');

// Создаем экземпляр адаптера
export const sqliteDb = new SqliteAdapter(dbPath);

// Тестирование подключения к SQLite
export const testSqliteConnection = async (): Promise<boolean> => {
  try {
    await sqliteDb.run('SELECT 1');
    console.log('✅ SQLite connection successful');
    return true;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error);
    return false;
  }
};

// Универсальные функции для работы с запросами
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    // Определяем тип запроса
    const trimmedText = text.trim().toUpperCase();
    let res;
    
    if (trimmedText.startsWith('SELECT')) {
      const rows = await sqliteDb.all(text, params);
      res = { rows, rowCount: rows.length };
    } else {
      const result = await sqliteDb.run(text, params);
      res = { rows: [], rowCount: result.changes, lastInsertRowid: result.lastID };
    }
    
    const duration = Date.now() - start;
    console.log('Query executed', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { text: text.substring(0, 100), duration, error });
    throw error;
  }
};

// Выполнение запроса с возвратом одной строки
export const queryOne = async (text: string, params?: any[]): Promise<any> => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

// Выполнение запроса с возвратом всех строк
export const queryMany = async (text: string, params?: any[]): Promise<any[]> => {
  const result = await query(text, params);
  return result.rows;
};

// Транзакция для SQLite
export const withTransaction = async <T>(
  callback: (db: SqliteAdapter) => Promise<T>
): Promise<T> => {
  try {
    await sqliteDb.run('BEGIN TRANSACTION');
    const result = await callback(sqliteDb);
    await sqliteDb.run('COMMIT');
    return result;
  } catch (error) {
    await sqliteDb.run('ROLLBACK');
    throw error;
  }
};

export default sqliteDb;
