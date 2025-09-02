import { browserDb, BrowserDatabase } from './browserDatabase';
import { DATABASE_CONFIG } from '../config/databaseConfig';

let isInitialized = false;

// Функция для получения экземпляра базы данных
export function getDatabase(): BrowserDatabase {
  // Проверяем, разрешено ли использование локального хранилища
  if (!DATABASE_CONFIG.hybrid.allowLocalStorage) {
    throw new Error('Local storage is disabled. Use database storage only.');
  }
  return browserDb;
}

// Функция для закрытия соединения с базой данных
export function closeDatabase() {
  // Браузерная база автоматически сохраняется в localStorage
  console.log('Database connection closed');
}

// Функция для выполнения запросов в транзакции
export function withTransaction<T>(callback: (db: BrowserDatabase) => T): T {
  const database = getDatabase();
  // В браузерной базе каждая операция автоматически атомарна
  return callback(database);
}

// Экспортируем типы для использования в других файлах
export type { BrowserDatabase };

// Инициализируем базу данных
export async function initDatabase(): Promise<BrowserDatabase> {
  if (!isInitialized) {
    // Проверяем конфигурацию перед инициализацией
    if (!DATABASE_CONFIG.hybrid.allowLocalStorage) {
      throw new Error('Local storage is disabled. Database initialization requires database connection.');
    }
    
    await browserDb.initializeWithSeedData();
    isInitialized = true;
  }
  return browserDb;
}
