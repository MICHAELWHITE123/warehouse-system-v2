// Конфигурация для принудительного использования только базы данных
// Локальная синхронизация отключена

export const DATABASE_CONFIG = {
  // Принудительно отключаем fallback к локальному хранилищу
  fallbackToLocal: false,
  
  // Режим синхронизации - только сервер
  syncMode: 'server' as const,
  
  // Принудительно отключаем локальный режим
  forceLocalMode: false,
  
  // Настройки для гибридного адаптера
  hybrid: {
    // Отключаем fallback к локальному хранилищу
    fallbackToLocal: false,
    
    // Приоритет хранилищ (только БД)
    storagePriority: ['redis', 'postgres'] as const,
    
    // Запрещаем использование локального хранилища
    allowLocalStorage: false
  },
  
  // Настройки синхронизации
  sync: {
    // Только серверная синхронизация
    mode: 'server' as const,
    
    // Отключаем локальную синхронизацию
    allowLocalSync: false,
    
    // Отключаем fallback к localStorage
    allowLocalStorageFallback: false,
    
    // Принудительно используем только сервер
    forceServerOnly: true
  }
};

// Функция для проверки, разрешена ли локальная синхронизация
export function isLocalSyncAllowed(): boolean {
  return DATABASE_CONFIG.sync.allowLocalSync;
}

// Функция для проверки, разрешено ли локальное хранилище
export function isLocalStorageAllowed(): boolean {
  return DATABASE_CONFIG.hybrid.allowLocalStorage;
}

// Функция для получения режима синхронизации
export function getSyncMode(): 'server' | 'local' | 'hybrid' {
  return DATABASE_CONFIG.sync.mode;
}

// Функция для проверки, нужно ли принудительно использовать только сервер
export function isServerOnlyMode(): boolean {
  return DATABASE_CONFIG.sync.forceServerOnly;
}
