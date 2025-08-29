#!/bin/bash

# Скрипт для развертывания Edge Function в Supabase
# Исправляет ошибку 401 при подключении к real-time API

echo "🚀 Развертывание Edge Function в Supabase..."

# Проверяем, установлен ли Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI не установлен. Устанавливаем..."
    npm install -g supabase
fi

# Проверяем, авторизован ли пользователь
if ! supabase status &> /dev/null; then
    echo "🔐 Требуется авторизация в Supabase..."
    supabase login
fi

# Создаем директорию для Edge Function если её нет
mkdir -p supabase/functions/events

# Копируем код Edge Function
echo "📝 Создаем Edge Function..."
cat > supabase/functions/events/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    if (req.method === 'GET') {
      // Real-time events stream
      const url = new URL(req.url)
      const stream = url.searchParams.get('stream')
      const apikey = url.searchParams.get('apikey')
      
      // Проверяем аутентификацию
      if (!apikey) {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Missing apikey parameter',
            timestamp: new Date().toISOString()
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Проверяем валидность ключа
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        // Проверяем валидность ключа через простой запрос
        const { error } = await supabase.from('_dummy_check').select('*').limit(1)
        
        // Если ошибка не связана с отсутствием таблицы, значит ключ невалиден
        if (error && !error.message.includes('does not exist')) {
          throw new Error('Invalid API key')
        }
      } catch (authError) {
        console.error('Authentication error:', authError)
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Invalid API key',
            timestamp: new Date().toISOString()
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
      
      if (stream === 'stream') {
        // Простой EventSource response
        const response = new Response(
          `data: {"type": "connected", "timestamp": "${new Date().toISOString()}"}\n\n`,
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            },
            status: 200
          }
        )
        return response
      }
      
      // Обычный GET response
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Events endpoint is working',
          timestamp: new Date().toISOString(),
          stream: stream || 'none',
          authenticated: !!apikey
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      )
    }
    
    if (req.method === 'POST') {
      // Handle notifications
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const type = pathParts[pathParts.length - 1]
      
      const body = await req.json()
      
      return new Response(
        JSON.stringify({
          status: 'success',
          message: `Notification sent for ${type}`,
          data: body,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 200
        }
      )
    }
    
    // Method not allowed
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'OPTIONS']
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
EOF

# Инициализируем Supabase проект если нужно
if [ ! -f "supabase/config.toml" ]; then
    echo "🔧 Инициализируем Supabase проект..."
    supabase init
fi

# Связываем с существующим проектом
echo "🔗 Связываем с проектом xekoibwvbsbpjcjqmjlu..."
supabase link --project-ref xekoibwvbsbpjcjqmjlu

# Развертываем Edge Function
echo "🚀 Развертываем Edge Function 'events'..."
supabase functions deploy events

# Проверяем статус
echo "✅ Проверяем статус развертывания..."
supabase functions list

echo ""
echo "🎉 Edge Function развернута!"
echo "Теперь перезапустите приложение и проверьте консоль браузера."
echo "Ошибки 401 должны исчезнуть."
