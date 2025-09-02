import { Pool } from 'pg';
import { testSupabaseConnection } from './supabase';

let pool: Pool | null = null;

// Создаем пул подключений к PostgreSQL
const createPool = () => {
  if (process.env.NODE_ENV === 'production') {
    // В продакшене используем Supabase
    return new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } else {
    // В разработке используем локальную базу
    return new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'warehouse_db',
      user: process.env.DB_USER || 'warehouse_user',
      password: process.env.DB_PASSWORD || '',
    });
  }
};

// Получаем пул подключений
export const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

// Тестируем подключение к базе данных
export const testConnection = async (): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // В продакшене тестируем Supabase
      return await testSupabaseConnection();
    } else {
      // В разработке тестируем PostgreSQL
      const client = await getPool().connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Закрываем пул подключений
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Выполнение SQL запроса
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error', { text, duration, error });
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

// Транзакция
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
