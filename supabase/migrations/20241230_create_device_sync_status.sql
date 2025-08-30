-- Создание таблицы device_sync_status
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

-- Индекс для быстрого поиска по device_id
CREATE INDEX IF NOT EXISTS idx_device_sync_status_device_id ON device_sync_status(device_id);

-- Вставляем начальные данные для тестирования
INSERT INTO device_sync_status (device_id, last_sync, sync_count) 
VALUES ('test-device-1', NOW(), 0)
ON CONFLICT (device_id) DO NOTHING;
