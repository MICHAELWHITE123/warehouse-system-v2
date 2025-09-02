import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import { runAllTests } from './utils/databaseTest'

// Запускаем диагностику баз данных при загрузке приложения
if (import.meta.env.DEV) {
  console.log('🔧 Development mode detected, running database tests...');
  runAllTests().then(success => {
    if (success) {
      console.log('✅ Database tests completed successfully');
    } else {
      console.warn('⚠️ Some database tests failed, but app will continue');
    }
  }).catch(error => {
    console.error('❌ Database tests failed:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)