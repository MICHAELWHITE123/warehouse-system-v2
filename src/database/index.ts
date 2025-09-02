import { browserDb, BrowserDatabase } from './browserDatabase';
import { serviceDb, ServiceDatabase } from './serviceAdapter';
import { DATABASE_CONFIG } from '../config/databaseConfig';

let isInitialized = false;

// Функция для получения экземпляра базы данных
export function getDatabase(): BrowserDatabase {
  // Используем локальную базу данных для совместимости
  return browserDb;
}

// Функция для получения сервисного адаптера (для будущего использования)
export function getServiceDatabase(): ServiceDatabase {
  return serviceDb;
}

// Функция для получения локальной базы данных (для совместимости)
export function getLocalDatabase(): BrowserDatabase {
  return browserDb;
}

// Функция для закрытия соединения с базой данных
export function closeDatabase() {
  // Закрываем сервисный адаптер
  console.log('Database connection closed');
}

// Функция для выполнения запросов в транзакции
export function withTransaction<T>(callback: (db: BrowserDatabase) => T): T {
  const database = getDatabase();
  // В браузерной базе каждая операция автоматически атомарна
  return callback(database);
}

// Экспортируем типы для использования в других файлах
export type { BrowserDatabase, ServiceDatabase };

// Инициализируем базу данных
export async function initDatabase(): Promise<BrowserDatabase> {
  if (!isInitialized) {
    // Инициализируем локальную базу данных
    await browserDb.initializeWithSeedData();
    
    // Также инициализируем сервисный адаптер для будущего использования
    try {
      await serviceDb.init();
    } catch (error) {
      console.warn('Service database initialization failed, using local database only:', error);
    }
    
    isInitialized = true;
  }
  return browserDb;
}
