export default async function handler(req: any, res: any) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { table, action, data } = req.body;

    if (!table || !action || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: table, action, data'
      });
    }

    // Простое логирование события
    console.log('Realtime notification:', { table, action, data });

    // В будущем здесь можно добавить интеграцию с Supabase
    // или другими системами уведомлений

    return res.status(200).json({
      success: true,
      message: 'Notification processed',
      table,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Realtime notification error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Добавляем CORS для кросс-доменных запросов
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
