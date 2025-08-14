import { browserDb, BrowserDatabase } from './browserDatabase';

let isInitialized = false;

// Функция для получения экземпляра базы данных
export function getDatabase(): BrowserDatabase {
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
    await browserDb.initializeWithSeedData();
    isInitialized = true;
  }
  return browserDb;
}
