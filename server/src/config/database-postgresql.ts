import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // время ожидания перед закрытием неактивного подключения
  connectionTimeoutMillis: 10000, // увеличиваем время ожидания подключения
};

export const pool = new Pool(poolConfig);

// Обработка ошибок подключения
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Тестирование подключения
export const testConnection = async (): Promise<boolean> => {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Environment variables check:');
    console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('- DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
    console.log('- DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) || 'N/A');
    console.log('- DB_SSL:', process.env.DB_SSL);
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    console.log('✅ Database connection successful!');
    console.log('- Time:', result.rows[0]?.current_time);
    console.log('- Version:', result.rows[0]?.version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      detail: (error as any)?.detail,
      hint: (error as any)?.hint,
      stack: error instanceof Error ? error.stack?.split('\n')[0] : undefined
    });
    return false;
  }
};

// Выполнение SQL запроса
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
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
  const client = await pool.connect();
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

export default pool;
