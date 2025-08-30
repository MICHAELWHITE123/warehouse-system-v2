-- Исправление структуры таблиц синхронизации
-- Дата: 2024-12-30
-- Описание: Добавляем недостающие колонки к существующим таблицам

-- Проверяем и добавляем недостающие колонки в sync_operations
DO $$ 
BEGIN
    -- Добавляем колонку status если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'status') THEN
        ALTER TABLE sync_operations ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
        RAISE NOTICE 'Added status column to sync_operations';
    END IF;
    
    -- Добавляем колонку acknowledged_by если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'acknowledged_by') THEN
        ALTER TABLE sync_operations ADD COLUMN acknowledged_by TEXT;
        RAISE NOTICE 'Added acknowledged_by column to sync_operations';
    END IF;
    
    -- Добавляем колонку acknowledged_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'acknowledged_at') THEN
        ALTER TABLE sync_operations ADD COLUMN acknowledged_at TIMESTAMPTZ;
        RAISE NOTICE 'Added acknowledged_at column to sync_operations';
    END IF;
    
    -- Добавляем колонку operation_hash если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'operation_hash') THEN
        ALTER TABLE sync_operations ADD COLUMN operation_hash TEXT;
        RAISE NOTICE 'Added operation_hash column to sync_operations';
    END IF;
    
    -- Добавляем колонку created_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'created_at') THEN
        ALTER TABLE sync_operations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to sync_operations';
    END IF;
    
    -- Добавляем колонку updated_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sync_operations' AND column_name = 'updated_at') THEN
        ALTER TABLE sync_operations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to sync_operations';
        RAISE NOTICE 'Added updated_at column to sync_operations';
    END IF;
END $$;

-- Проверяем и добавляем недостающие колонки в device_sync_status
DO $$ 
BEGIN
    -- Добавляем колонку sync_count если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_sync_status' AND column_name = 'sync_count') THEN
        ALTER TABLE device_sync_status ADD COLUMN sync_count BIGINT DEFAULT 0;
        RAISE NOTICE 'Added sync_count column to device_sync_status';
    END IF;
    
    -- Добавляем колонку last_error если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_sync_status' AND column_name = 'last_error') THEN
        ALTER TABLE device_sync_status ADD COLUMN last_error TEXT;
        RAISE NOTICE 'Added last_error column to device_sync_status';
    END IF;
    
    -- Добавляем колонку created_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_sync_status' AND column_name = 'created_at') THEN
        ALTER TABLE device_sync_status ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to device_sync_status';
    END IF;
    
    -- Добавляем колонку updated_at если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_sync_status' AND column_name = 'updated_at') THEN
        ALTER TABLE device_sync_status ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to device_sync_status';
    END IF;
END $$;

-- Создаем недостающие индексы
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_hash ON sync_operations(operation_hash);

-- Создаем недостающие таблицы если их нет
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id BIGSERIAL PRIMARY KEY,
    conflict_id TEXT NOT NULL UNIQUE,
    local_operation_id TEXT NOT NULL,
    remote_operation_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('data_conflict', 'timestamp_conflict', 'hash_conflict')),
    resolution TEXT DEFAULT 'manual' CHECK (resolution IN ('manual', 'local', 'remote', 'merge')),
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индексы для таблицы конфликтов
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table ON sync_conflicts(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolution ON sync_conflicts(resolution);

-- Создаем функцию для автоматического обновления updated_at если её нет
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создаем триггеры если их нет
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sync_operations_updated_at') THEN
        CREATE TRIGGER update_sync_operations_updated_at 
            BEFORE UPDATE ON sync_operations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for sync_operations';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_device_sync_status_updated_at') THEN
        CREATE TRIGGER update_device_sync_status_updated_at 
            BEFORE UPDATE ON device_sync_status 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for device_sync_status';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sync_conflicts_updated_at') THEN
        CREATE TRIGGER update_sync_conflicts_updated_at 
            BEFORE UPDATE ON sync_conflicts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger for sync_conflicts';
    END IF;
END $$;

-- Создаем представление для статистики синхронизации
CREATE OR REPLACE VIEW sync_statistics AS
SELECT 
    d.device_id,
    d.user_id,
    d.last_sync,
    d.sync_count,
    COUNT(o.id) as pending_operations,
    COUNT(CASE WHEN o.status = 'acknowledged' THEN 1 END) as acknowledged_operations,
    COUNT(CASE WHEN o.status = 'failed' THEN 1 END) as failed_operations
FROM device_sync_status d
LEFT JOIN sync_operations o ON d.device_id = o.source_device_id
GROUP BY d.device_id, d.user_id, d.last_sync, d.sync_count;

-- Вставляем начальные данные для тестирования если их нет
INSERT INTO device_sync_status (device_id, last_sync, sync_count) 
VALUES ('test-device-1', NOW(), 0)
ON CONFLICT (device_id) DO NOTHING;

-- Проверяем структуру таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('sync_operations', 'device_sync_status', 'sync_conflicts')
ORDER BY table_name, ordinal_position;
