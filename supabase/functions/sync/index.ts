import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  deviceId: string;
  userId?: string;
  hash: string;
  status: 'pending' | 'synced' | 'failed' | 'conflict';
  retryCount: number;
  lastRetry?: number;
  lastError?: string;
}

interface SyncRequest {
  operations: SyncOperation[];
  deviceId: string;
  lastSync: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request data
    const { operations, deviceId, lastSync }: SyncRequest = await req.json()

    console.log(`📥 Received sync request from device ${deviceId} with ${operations.length} operations`)

    if (!operations || !Array.isArray(operations)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid operations data' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const results = []
    const conflicts = []

    // Process each operation
    for (const operation of operations) {
      try {
        console.log(`🔄 Processing operation: ${operation.operation} on ${operation.table}`)

        // Check for conflicts first
        const conflictCheck = await checkForConflicts(supabase, operation, lastSync)
        
        if (conflictCheck.hasConflict) {
          console.log(`⚠️ Conflict detected for operation ${operation.id}`)
          conflicts.push({
            conflict: true,
            operationId: operation.id,
            localOperation: operation,
            remoteOperation: conflictCheck.remoteOperation
          })
          continue
        }

        // Apply the operation
        const result = await applyOperation(supabase, operation)
        
        if (result.success) {
          results.push({
            success: true,
            operationId: operation.id,
            message: `Operation ${operation.operation} on ${operation.table} applied successfully`
          })
        } else {
          results.push({
            success: false,
            operationId: operation.id,
            error: result.error
          })
        }

      } catch (error) {
        console.error(`❌ Error processing operation ${operation.id}:`, error)
        results.push({
          success: false,
          operationId: operation.id,
          error: error.message
        })
      }
    }

    // Store sync operations for tracking
    await storeSyncOperations(supabase, operations, deviceId)

    console.log(`✅ Sync completed: ${results.length} operations processed, ${conflicts.length} conflicts found`)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        conflicts,
        message: `Sync completed successfully`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Sync function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function checkForConflicts(supabase: any, operation: SyncOperation, lastSync: number) {
  // Check if there's a more recent version of the same record
  const { data: existingData, error } = await supabase
    .from(operation.table)
    .select('*')
    .eq('id', operation.data.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error
  }

  if (existingData) {
    // Check if the existing data is newer than our last sync
    const existingTimestamp = existingData.updated_at || existingData.created_at
    if (existingTimestamp && new Date(existingTimestamp).getTime() > lastSync) {
      return {
        hasConflict: true,
        remoteOperation: {
          id: `remote_${Date.now()}`,
          table: operation.table,
          operation: 'update',
          data: existingData,
          timestamp: new Date(existingTimestamp).getTime(),
          deviceId: 'remote',
          hash: createHash(existingData),
          status: 'synced',
          retryCount: 0
        }
      }
    }
  }

  return { hasConflict: false }
}

async function applyOperation(supabase: any, operation: SyncOperation) {
  try {
    switch (operation.operation) {
      case 'create':
        const { data: createdData, error: createError } = await supabase
          .from(operation.table)
          .insert(operation.data)
          .select()
          .single()

        if (createError) {
          // If it's a unique constraint violation, it might already exist
          if (createError.code === '23505') {
            console.log(`Record already exists in ${operation.table}, skipping create`)
            return { success: true }
          }
          throw createError
        }

        return { success: true, data: createdData }

      case 'update':
        const { data: updatedData, error: updateError } = await supabase
          .from(operation.table)
          .update(operation.data)
          .eq('id', operation.data.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        return { success: true, data: updatedData }

      case 'delete':
        const { error: deleteError } = await supabase
          .from(operation.table)
          .delete()
          .eq('id', operation.data.id)

        if (deleteError) {
          throw deleteError
        }

        return { success: true }

      default:
        throw new Error(`Unknown operation type: ${operation.operation}`)
    }
  } catch (error) {
    console.error(`Error applying operation ${operation.operation} on ${operation.table}:`, error)
    return { success: false, error: error.message }
  }
}

async function storeSyncOperations(supabase: any, operations: SyncOperation[], deviceId: string) {
  try {
    // Create sync_operations table if it doesn't exist
    await supabase.rpc('create_sync_operations_table_if_not_exists')

    // Store operations for tracking
    const syncRecords = operations.map(op => ({
      operation_id: op.id,
      table_name: op.table,
      operation_type: op.operation,
      data: op.data,
      timestamp: new Date(op.timestamp).toISOString(),
      device_id: deviceId,
      user_id: op.userId,
      hash: op.hash,
      status: op.status
    }))

    const { error } = await supabase
      .from('sync_operations')
      .insert(syncRecords)

    if (error) {
      console.warn('Failed to store sync operations:', error)
    }
  } catch (error) {
    console.warn('Failed to store sync operations:', error)
  }
}

function createHash(data: any): string {
  const stableData = { ...data }
  
  // Remove temporary fields
  delete stableData.created_at
  delete stableData.updated_at
  delete stableData.timestamp
  delete stableData.id
  delete stableData.uuid
  delete stableData.created_by
  delete stableData.updated_by
  
  // Sort keys for stable hash
  const sortedKeys = Object.keys(stableData).sort()
  const sortedData: any = {}
  
  for (const key of sortedKeys) {
    if (stableData[key] !== undefined && stableData[key] !== null) {
      sortedData[key] = stableData[key]
    }
  }
  
  const dataStr = JSON.stringify(sortedData)
  let hash = 0
  
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  
  return hash.toString(36)
}
