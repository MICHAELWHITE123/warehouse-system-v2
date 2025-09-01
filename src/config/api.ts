// Конфигурация API
export const API_CONFIG = {
  // Базовый URL API - автоматически определяется по окружению
  BASE_URL: (() => {
    // ПРИНУДИТЕЛЬНОЕ ПЕРЕКЛЮЧЕНИЕ НА VERCEL API В PRODUCTION
    if (window.location.hostname.includes('vercel.app')) {
      console.log('🔧 Принудительно переключаюсь на Vercel API в production');
      return ''; // Пустая строка заставит использовать Vercel API
    }
    
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
  
  // Upstash Redis конфигурация (KV)
  REDIS: {
    URL: import.meta.env.VITE_UPSTASH_REDIS_REST_URL || '',
    TOKEN: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || '',
    ENABLED: !!(import.meta.env.VITE_UPSTASH_REDIS_REST_URL && import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN)
  },
  
  // Neon Postgres конфигурация
  POSTGRES: {
    URL: import.meta.env.VITE_NEON_DATABASE_URL || '',
    HOST: import.meta.env.VITE_NEON_HOST || '',
    DATABASE: import.meta.env.VITE_NEON_DATABASE || '',
    USERNAME: import.meta.env.VITE_NEON_USERNAME || '',
    PASSWORD: import.meta.env.VITE_NEON_PASSWORD || '',
    ENABLED: !!(import.meta.env.VITE_NEON_DATABASE_URL && import.meta.env.VITE_NEON_PASSWORD)
  },
  
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
  
  console.log(`🔧 getApiUrl called with endpoint: ${endpoint}`);
  console.log(`🔧 API_CONFIG.BASE_URL: ${baseUrl}`);
  console.log(`🔧 window.location.hostname: ${window.location.hostname}`);
  
  // ПРИНУДИТЕЛЬНОЕ ПЕРЕКЛЮЧЕНИЕ НА VERCEL API В PRODUCTION
  if (window.location.hostname.includes('vercel.app')) {
    const url = `/api/${endpoint}`;
    console.log(`🔧 ПРИНУДИТЕЛЬНО использую Vercel API: ${url}`);
    return url;
  }
  
  // Если базовый URL пустой или не указан, используем Vercel API
  if (!baseUrl || baseUrl.trim() === '') {
    // На Vercel используем относительные пути к API
    if (window.location.hostname.includes('vercel.app')) {
      const url = `/api/${endpoint}`;
      console.log(`🔧 Using Vercel API: ${url}`);
      return url;
    }
    // В development используем localhost
    const url = `http://localhost:3001/${endpoint}`;
    console.log(`🔧 Using localhost API: ${url}`);
    return url;
  }
  
  // Если это Supabase URL, используем Edge Functions API
  if (baseUrl.includes('supabase.co')) {
    const cleanBaseUrl = baseUrl.replace(/\.supabase\.co.*$/, '.supabase.co'); // Убираем все после .supabase.co
    const url = `${cleanBaseUrl}/functions/v1/${endpoint}`;
    console.log(`🔧 Using Supabase API: ${url}`);
    return url;
  }
  
  // Если это Vercel API, используем прямые пути
  if (baseUrl.includes('/api')) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Убираем trailing slash
    const cleanEndpoint = endpoint.replace(/^\//, ''); // Убираем leading slash
    const url = `${cleanBaseUrl}/functions/v1/${cleanEndpoint}`;
    console.log(`🔧 Using configured Vercel API: ${url}`);
    return url;
  }
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Убираем trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Убираем leading slash
  const url = `${cleanBaseUrl}/${cleanEndpoint}`;
  console.log(`🔧 Using fallback API: ${url}`);
  return url;
};

// Функция для проверки доступности API
export const isApiAvailable = (): boolean => {
  // Если базовый URL не указан, но мы на Vercel, API доступен
  if (!API_CONFIG.BASE_URL || API_CONFIG.BASE_URL.trim() === '') {
    return window.location.hostname.includes('vercel.app');
  }
  return !!API_CONFIG.BASE_URL;
};

// Функция для проверки доступности Redis
export const isRedisAvailable = (): boolean => {
  return API_CONFIG.REDIS.ENABLED;
};

// Функция для проверки доступности Postgres
export const isPostgresAvailable = (): boolean => {
  return API_CONFIG.POSTGRES.ENABLED;
};

// Функция для получения заголовков с авторизацией
export const getAuthHeaders = (deviceId?: string): Record<string, string> => {
  const token = localStorage.getItem('auth-token');
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Если используем Supabase, добавляем специальные заголовки
  if (API_CONFIG.BASE_URL && API_CONFIG.BASE_URL.includes('supabase.co')) {
    return {
      ...API_CONFIG.DEFAULT_HEADERS,
      'apikey': supabaseKey || '',
      'Authorization': `Bearer ${supabaseKey || ''}`,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }
  
  // Для Vercel API или когда базовый URL не указан, используем стандартные заголовки
  return {
    ...API_CONFIG.DEFAULT_HEADERS,
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(deviceId && { 'X-Device-ID': deviceId })
  };
};

// Функция для получения заголовков Redis
export const getRedisHeaders = (): Record<string, string> => {
  return {
    'Authorization': `Bearer ${API_CONFIG.REDIS.TOKEN}`,
    'Content-Type': 'application/json'
  };
};

// Функция для получения заголовков Postgres
export const getPostgresHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json'
  };
};
