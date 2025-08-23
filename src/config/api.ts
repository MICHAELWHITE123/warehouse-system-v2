// Конфигурация API
export const API_CONFIG = {
  // Базовый URL API - автоматически определяется по окружению
  BASE_URL: (() => {
    // Если указан переменная окружения, используем её
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Если на Vercel, используем локальный сервер (для разработки)
    if (window.location.hostname.includes('vercel.app')) {
      return 'http://localhost:3001/api';
    }
    
    // По умолчанию локальный сервер
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
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Убираем trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Убираем leading slash
  return `${baseUrl}/${cleanEndpoint}`;
};

// Функция для получения заголовков с авторизацией
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth-token');
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
