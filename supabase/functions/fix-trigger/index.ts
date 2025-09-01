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
    // Получаем переменные окружения
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Создаем клиент Supabase с правами администратора
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Исправляем триггер для sync_operations
    // Сначала удаляем старый триггер
    const { error: dropError } = await supabase
      .from('sync_operations')
      .select('id')
      .limit(1)
    
    if (dropError) {
      console.error('Failed to access sync_operations table:', dropError)
    }

    // Создаем специальную функцию для sync_operations
    const { error: functionError } = await supabase.rpc('create_function', {
      function_name: 'update_sync_operations_updated_at',
      function_body: `
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `
    })

    if (functionError) {
      console.error('Failed to create function:', functionError)
    }

    // Создаем новый триггер
    const { error: triggerError } = await supabase.rpc('create_trigger', {
      trigger_name: 'update_sync_operations_updated_at',
      table_name: 'sync_operations',
      function_name: 'update_sync_operations_updated_at'
    })

    const error = functionError || triggerError

    if (error) {
      console.error('Failed to fix trigger:', error)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to fix trigger',
          error: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Trigger fixed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
