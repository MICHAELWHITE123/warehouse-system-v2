// Конфигурация для гибридного использования базы данных и локального хранилища
// Локальная синхронизация разрешена как fallback

export const DATABASE_CONFIG = {
  // Разрешаем fallback к локальному хранилищу для совместимости
  fallbackToLocal: true,
  
  // Режим синхронизации - гибридный (БД + локальное)
  syncMode: 'hybrid' as const,
  
  // НЕ принудительно отключаем локальный режим
  forceLocalMode: false,
  
  // Настройки для гибридного адаптера
  hybrid: {
    // Разрешаем fallback к локальному хранилищу
    fallbackToLocal: true,
    
    // Приоритет хранилищ (БД в приоритете, но локальное разрешено)
    storagePriority: ['redis', 'postgres', 'local'] as const,
    
    // Разрешаем использование локального хранилища
    allowLocalStorage: true
  },
  
  // Настройки синхронизации
  sync: {
    // Гибридная синхронизация
    mode: 'hybrid' as const,
    
    // Разрешаем локальную синхронизацию
    allowLocalSync: true,
    
    // Разрешаем fallback к localStorage
    allowLocalStorageFallback: true,
    
    // НЕ принудительно используем только сервер
    forceServerOnly: false
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
