-- Проверка структуры таблицы sync_operations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_operations'
ORDER BY ordinal_position;

-- Проверка существующих данных
SELECT COUNT(*) as total_operations FROM sync_operations;

-- Проверка таблицы device_sync_status
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'device_sync_status'
ORDER BY ordinal_position;
