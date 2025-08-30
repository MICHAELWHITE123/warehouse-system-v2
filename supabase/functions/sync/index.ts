import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface SyncOperation {
  id: string
  table: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  deviceId: string
  userId?: string
  hash: string
}

interface SyncRequest {
  operations: SyncOperation[]
  deviceId: string
  userId?: string
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

    if (req.method === 'POST') {
      // Отправка операций (PUSH)
      const body: SyncRequest = await req.json()
      const { operations, deviceId, userId } = body

      if (!operations || !Array.isArray(operations) || !deviceId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid request: operations array and deviceId are required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`📤 PUSH: Received ${operations.length} operations from device ${deviceId}`)

      // Сохраняем операции в таблицу sync_operations
      const savedOperations = []
      for (const operation of operations) {
        try {
          const { data, error } = await supabase
            .from('sync_operations')
            .insert({
              operation_id: operation.id,
              table_name: operation.table,
              operation_type: operation.operation,
              data: JSON.stringify(operation.data),
              operation_timestamp: new Date(operation.timestamp).toISOString(),
              source_device_id: deviceId,
              user_id: userId || null,
              operation_hash: operation.hash,
              status: 'pending'
            })
            .select()
            .single()

          if (error) {
            console.error(`Failed to save operation ${operation.id}:`, error)
            continue
          }

          savedOperations.push(data)
        } catch (error) {
          console.error(`Error saving operation ${operation.id}:`, error)
        }
      }

      // Обновляем время последней синхронизации для устройства
      await supabase
        .from('device_sync_status')
        .upsert({
          device_id: deviceId,
          last_sync: new Date().toISOString(),
          user_id: userId || null,
          updated_at: new Date().toISOString()
        })

      console.log(`✅ PUSH: Successfully saved ${savedOperations.length} operations`)

      return new Response(
        JSON.stringify({
          success: true,
          syncedOperations: savedOperations.length,
          conflicts: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else if (req.method === 'GET') {
      // Получение операций (PULL)
      const url = new URL(req.url)
      const deviceId = url.searchParams.get('deviceId')
      const lastSync = url.searchParams.get('lastSync')

      if (!deviceId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'deviceId parameter is required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`📥 PULL: Requesting operations for device ${deviceId}, lastSync: ${lastSync}`)

      // Получаем операции от других устройств
      let query = supabase
        .from('sync_operations')
        .select('*')
        .neq('source_device_id', deviceId)
        .eq('status', 'pending')

      if (lastSync) {
        const lastSyncDate = new Date(parseInt(lastSync))
        query = query.gt('operation_timestamp', lastSyncDate.toISOString())
      }

      const { data: operations, error } = await query
        .order('operation_timestamp', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Failed to fetch operations:', error)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to fetch operations',
            error: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`📤 PULL: Returning ${operations?.length || 0} operations to device ${deviceId}`)

      return new Response(
        JSON.stringify({
          success: true,
          data: operations || [],
          serverTime: Date.now()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else if (req.method === 'PUT') {
      // Подтверждение получения операции (ACK)
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const operationId = pathParts[pathParts.length - 1]

      if (!operationId || operationId === 'acknowledge') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Operation ID is required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const body = await req.json()
      const { deviceId } = body

      if (!deviceId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'deviceId is required'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Помечаем операцию как подтвержденную
      const { error } = await supabase
        .from('sync_operations')
        .update({
          status: 'acknowledged',
          acknowledged_by: deviceId,
          acknowledged_at: new Date().toISOString()
        })
        .eq('operation_id', operationId)

      if (error) {
        console.error('Failed to acknowledge operation:', error)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to acknowledge operation'
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
          message: 'Operation acknowledged'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed',
          allowedMethods: ['GET', 'POST', 'PUT', 'OPTIONS']
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Sync function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
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
