// Конфигурация API
export const API_CONFIG = {
  // Базовый URL API - автоматически определяется по окружению
  BASE_URL: (() => {
    // Если указан переменная окружения, используем её
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Если на Vercel, используем production API или отключаем синхронизацию
    if (window.location.hostname.includes('vercel.app')) {
      // В production на Vercel у нас нет backend сервера
      // Возвращаем пустую строку чтобы отключить синхронизацию
      return '';
    }
    
    // По умолчанию локальный сервер для разработки
    return 'http://localhost:3001/api';
  })(),
  
  // Таймауты
  TIMEOUT: 30000, // 30 секунд
  
  // Интервалы синхронизации
  SYNC: {
    AUTO_SYNC_INTERVAL: 30000, // 30 секунд
    STATUS_UPDATE_INTERVAL: 5000, // 5 секунд
    RETRY_DELAY: 1000, // 1 секунда
    MAX_RETRIES: 3
  },
  
  // Заголовки по умолчанию
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Функция для получения полного URL API
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  
  // Если базовый URL пустой (production без backend), возвращаем пустую строку
  if (!baseUrl) {
    return '';
  }
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Убираем trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Убираем leading slash
  return `${cleanBaseUrl}/${cleanEndpoint}`;
};

// Функция для проверки доступности API
export const isApiAvailable = (): boolean => {
  return !!API_CONFIG.BASE_URL;
};

// Функция для получения заголовков с авторизацией
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth-token');
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
