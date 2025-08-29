-- Исправленные функции для синхронизации
-- Выполните этот SQL в Supabase SQL Editor

-- Обновляем функцию get_sync_operations
CREATE OR REPLACE FUNCTION get_sync_operations(
  p_device_id TEXT,
  p_last_sync TIMESTAMPTZ DEFAULT '1970-01-01'::TIMESTAMPTZ
)
RETURNS TABLE (
  operation_id UUID,
  table_name TEXT,
  operation_type TEXT,
  data JSONB,
  operation_timestamp TIMESTAMPTZ,
  source_device_id TEXT,
  user_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.id,
    so.table_name,
    so.operation_type,
    so.data,
    so.operation_timestamp,
    so.source_device_id,
    so.user_id
  FROM sync_operations so
  WHERE so.operation_timestamp > p_last_sync
    AND so.source_device_id != p_device_id
  ORDER BY so.operation_timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для вставки операций синхронизации
CREATE OR REPLACE FUNCTION insert_sync_operation(
  p_table_name TEXT,
  p_operation_type TEXT,
  p_data JSONB,
  p_source_device_id TEXT,
  p_user_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_operation_id UUID;
BEGIN
  INSERT INTO sync_operations (
    table_name,
    operation_type,
    data,
    source_device_id,
    user_id
  ) VALUES (
    p_table_name,
    p_operation_type,
    p_data,
    p_source_device_id,
    p_user_id
  ) RETURNING id INTO v_operation_id;
  
  RETURN v_operation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для подтверждения получения операции
CREATE OR REPLACE FUNCTION acknowledge_sync_operation(
  p_operation_id UUID,
  p_device_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sync_operations 
  SET acknowledged_by = array_append(acknowledged_by, p_device_id)
  WHERE id = p_operation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки старых операций
CREATE OR REPLACE FUNCTION cleanup_old_sync_operations(
  p_days_to_keep INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM sync_operations 
  WHERE operation_timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days_to_keep
    AND acknowledged_by IS NOT NULL 
    AND array_length(acknowledged_by, 1) > 0;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Включаем real-time для таблицы sync_operations
ALTER PUBLICATION supabase_realtime ADD TABLE sync_operations;

-- Создаем политики доступа
DROP POLICY IF EXISTS "Users can read sync operations" ON sync_operations;
DROP POLICY IF EXISTS "Users can insert sync operations" ON sync_operations;
DROP POLICY IF EXISTS "Users can update own operations" ON sync_operations;

CREATE POLICY "Users can read sync operations" ON sync_operations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sync operations" ON sync_operations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own operations" ON sync_operations
  FOR UPDATE USING (source_device_id = current_setting('app.device_id', true));

-- Проверяем, что таблица создана правильно
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_operations'
ORDER BY ordinal_position;
