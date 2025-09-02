-- Create sync_operations table for tracking sync operations
CREATE TABLE IF NOT EXISTS sync_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
  data JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  device_id TEXT NOT NULL,
  user_id TEXT,
  hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'synced', 'failed', 'conflict')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sync_operations_device_id ON sync_operations(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table_name ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_timestamp ON sync_operations(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_hash ON sync_operations(hash);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for sync_operations table
CREATE TRIGGER update_sync_operations_updated_at 
  BEFORE UPDATE ON sync_operations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to create sync_operations table if it doesn't exist
CREATE OR REPLACE FUNCTION create_sync_operations_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- This function is called from Edge Functions to ensure the table exists
  -- The table creation is handled by the migration above
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE sync_operations ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view their own sync operations" ON sync_operations
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sync operations" ON sync_operations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create function to clean up old sync operations (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_operations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_operations 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old sync operations (optional)
-- This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-sync-operations', '0 2 * * *', 'SELECT cleanup_old_sync_operations();');
