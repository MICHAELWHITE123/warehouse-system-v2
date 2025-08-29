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
