// Простой тестовый API маршрут
export default async function handler(req, res) {
  // Поддерживаем GET и POST запросы
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use GET or POST.'
    });
  }

  try {
    console.log('📥 Received test request:', {
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'API is working correctly',
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
