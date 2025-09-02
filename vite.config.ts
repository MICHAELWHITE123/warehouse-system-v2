import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Загружаем переменные окружения в зависимости от режима
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      global: 'globalThis',
      // Добавляем глобальные переменные для отладки
      __DEV__: mode === 'development',
      __PROD__: mode === 'production',
    },
    optimizeDeps: {
      exclude: ['better-sqlite3']
    },
    build: {
      rollupOptions: {
        external: ['better-sqlite3', 'fs', 'path']
      },
      // Добавляем source maps для production
      sourcemap: mode === 'development',
    },
    server: {
      port: 5173,
      host: true,
      // Добавляем CORS для разработки
      cors: true,
    },
    // Добавляем поддержку переменных окружения
    envPrefix: ['VITE_', 'SUPABASE_'],
    // Добавляем логирование переменных окружения в development
    logLevel: mode === 'development' ? 'info' : 'warn',
  }
})

