import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Создаем Supabase клиент для серверной части
function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    const supabase = createServerSupabaseClient();

    // Логируем событие в специальную таблицу для отслеживания
    const { error: logError } = await supabase
      .from('realtime_events')
      .insert({
        table_name: table,
        event_type: action,
        event_data: data,
        created_at: new Date().toISOString(),
        source: 'api'
      });

    if (logError) {
      console.warn('Failed to log realtime event:', logError);
    }

    // В Supabase Realtime события автоматически отправляются при изменении данных
    // Здесь мы можем добавить дополнительную логику если нужно
    
    // Опционально: можем триггерить webhook или отправить push-уведомление
    // await sendPushNotification(data);

    return res.status(200).json({
      success: true,
      message: 'Notification processed',
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
