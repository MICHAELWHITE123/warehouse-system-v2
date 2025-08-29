import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    // Проверяем аутентификацию
    const authHeader = req.headers.get('authorization')
    const apikeyHeader = req.headers.get('apikey')
    
    if (!authHeader && !apikeyHeader) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing authentication headers',
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
    
    if (req.method === 'POST') {
      // Handle sync operations
      const body = await req.json()
      
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Sync operations processed',
          operations: body.operations || [],
          deviceId: body.deviceId,
          lastSync: body.lastSync,
          timestamp: new Date().toISOString(),
          result: 'synced',
          authenticated: true
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
    
    if (req.method === 'GET') {
      // Handle sync operations retrieval
      const url = new URL(req.url)
      const deviceId = url.searchParams.get('deviceId')
      const lastSync = url.searchParams.get('lastSync')
      
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Sync operations retrieved',
          deviceId: deviceId || 'unknown',
          lastSync: lastSync || 0,
          timestamp: new Date().toISOString(),
          data: [], // Пустой массив для тестирования
          authenticated: true
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
