// Конфигурация API
export const API_CONFIG = {
  // Базовый URL API - автоматически определяется по окружению
  BASE_URL: (() => {
    // Если указан переменная окружения, используем её
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Если на Vercel, используем собственный API
    if (window.location.hostname.includes('vercel.app')) {
      // В production на Vercel используем встроенный API
      return `${window.location.origin}/api`;
    }
    
    // По умолчанию локальный сервер для разработки
    return 'http://localhost:3001';
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
  
  // Если это Supabase URL, используем REST API
  if (baseUrl.includes('supabase.co')) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Убираем trailing slash
    return `${cleanBaseUrl}/rest/v1/${endpoint}`;
  }
  
  // Если это Vercel API, используем прямые пути
  if (baseUrl.includes('/api')) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Убираем trailing slash
    const cleanEndpoint = endpoint.replace(/^\//, ''); // Убираем leading slash
    return `${cleanBaseUrl}/${cleanEndpoint}`;
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
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Если используем Supabase, добавляем специальные заголовки
  if (API_CONFIG.BASE_URL.includes('supabase.co')) {
    return {
      ...API_CONFIG.DEFAULT_HEADERS,
      'apikey': supabaseKey || '',
      'Authorization': `Bearer ${supabaseKey || ''}`,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  // Для Vercel API используем стандартные заголовки
  if (API_CONFIG.BASE_URL.includes('/api')) {
    return {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
