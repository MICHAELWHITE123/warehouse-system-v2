-- Исправление таблицы sync_operations
-- Добавляем недостающие колонки

-- Колонка status
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Колонка acknowledged_by
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;

-- Колонка acknowledged_at
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

-- Колонка operation_hash
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS operation_hash TEXT;

-- Колонка created_at
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Колонка updated_at
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_hash ON sync_operations(operation_hash);

-- Создаем таблицу device_sync_status если её нет
CREATE TABLE IF NOT EXISTS device_sync_status (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    user_id TEXT,
    last_sync TIMESTAMPTZ NOT NULL,
    sync_count BIGINT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для device_sync_status
CREATE INDEX IF NOT EXISTS idx_device_sync_status_device_id ON device_sync_status(device_id);

-- Вставляем тестовые данные
INSERT INTO device_sync_status (device_id, last_sync, sync_count) 
VALUES ('test-device-1', NOW(), 0)
ON CONFLICT (device_id) DO NOTHING;
