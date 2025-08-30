-- Проверка структуры таблиц синхронизации
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_operations'
ORDER BY ordinal_position;

-- Проверка существующих индексов
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'sync_operations';
