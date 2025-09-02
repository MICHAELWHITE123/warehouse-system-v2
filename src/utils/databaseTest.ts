// Простой тест для проверки работы базы данных
import { getDatabase } from '../database/index';
import { DATABASE_CONFIG } from '../config/databaseConfig';

export async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...');
  
  try {
    // Проверяем конфигурацию
    console.log('📋 Database config:', {
      fallbackToLocal: DATABASE_CONFIG.fallbackToLocal,
      syncMode: DATABASE_CONFIG.syncMode,
      allowLocalStorage: DATABASE_CONFIG.hybrid.allowLocalStorage,
      allowLocalSync: DATABASE_CONFIG.sync.allowLocalSync
    });

    // Проверяем localStorage
    try {
      localStorage.setItem('test-key', 'test-value');
      const testValue = localStorage.getItem('test-key');
      localStorage.removeItem('test-key');
      console.log('✅ localStorage is working:', testValue === 'test-value');
    } catch (error) {
      console.error('❌ localStorage is not available:', error);
    }

    // Получаем базу данных
    const db = getDatabase();
    console.log('✅ Database instance created successfully');

    // Тестируем простую операцию
    const testTable = 'test_table';
    const testData = { name: 'Test Item', value: 123 };
    
    const result = db.insert(testTable, testData);
    console.log('✅ Insert operation successful:', result);

    const allItems = db.selectAll(testTable);
    console.log('✅ Select operation successful:', allItems);

    // Очищаем тестовые данные
    db.delete(testTable, result.id);
    console.log('✅ Delete operation successful');

    console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Функция для проверки доступности Supabase
export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('📋 Supabase config:', {
      url: supabaseUrl ? '✅ Set' : '❌ Not set',
      key: supabaseKey ? '✅ Set' : '❌ Not set'
    });

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not configured');
      return false;
    }

    // Простой тест подключения к Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      console.log('✅ Supabase connection successful');
      return true;
    } else {
      console.error('❌ Supabase connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return false;
  }
}

// Основная функция тестирования
export async function runAllTests() {
  console.log('🚀 Starting database tests...');
  
  const dbTest = await testDatabaseConnection();
  const supabaseTest = await testSupabaseConnection();
  
  console.log('📊 Test results:', {
    database: dbTest ? '✅ PASS' : '❌ FAIL',
    supabase: supabaseTest ? '✅ PASS' : '❌ FAIL'
  });
  
  return dbTest && supabaseTest;
}
