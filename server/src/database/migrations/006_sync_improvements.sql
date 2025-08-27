-- Обновленные таблицы для улучшенной синхронизации данных между устройствами (PostgreSQL)

-- Удаление старых таблиц если они существуют
DROP TABLE IF EXISTS sync_conflicts CASCADE;
DROP TABLE IF EXISTS pending_sync_operations CASCADE;
DROP TABLE IF EXISTS sync_operations CASCADE;
DROP TABLE IF EXISTS user_devices CASCADE;

-- Таблица устройств пользователей
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100), -- 'desktop', 'mobile', 'tablet', 'web'
    platform VARCHAR(100), -- 'windows', 'macos', 'ios', 'android', 'linux'
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица записей синхронизации
CREATE TABLE sync_entries (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_status VARCHAR(20) NOT NULL CHECK (sync_status IN ('pending', 'processed', 'failed', 'conflict')) DEFAULT 'pending',
    conflict_resolution VARCHAR(20) CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица конфликтов синхронизации
CREATE TABLE sync_conflicts (
    id SERIAL PRIMARY KEY,
    sync_entry_id INTEGER NOT NULL REFERENCES sync_entries(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    local_data JSONB NOT NULL,
    remote_data JSONB NOT NULL,
    local_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    remote_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('concurrent_update', 'delete_update', 'update_delete')),
    resolved BOOLEAN DEFAULT false,
    resolution VARCHAR(20) CHECK (resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации производительности
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_last_sync ON devices(last_sync);
CREATE INDEX idx_devices_is_active ON devices(is_active);

CREATE INDEX idx_sync_entries_user_id ON sync_entries(user_id);
CREATE INDEX idx_sync_entries_device_id ON sync_entries(device_id);
CREATE INDEX idx_sync_entries_table_record ON sync_entries(table_name, record_id);
CREATE INDEX idx_sync_entries_timestamp ON sync_entries(timestamp);
CREATE INDEX idx_sync_entries_sync_status ON sync_entries(sync_status);
CREATE INDEX idx_sync_entries_operation ON sync_entries(operation);

CREATE INDEX idx_sync_conflicts_sync_entry_id ON sync_conflicts(sync_entry_id);
CREATE INDEX idx_sync_conflicts_table_record ON sync_conflicts(table_name, record_id);
CREATE INDEX idx_sync_conflicts_resolved ON sync_conflicts(resolved);
CREATE INDEX idx_sync_conflicts_conflict_type ON sync_conflicts(conflict_type);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_entries_updated_at BEFORE UPDATE ON sync_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция очистки старых записей синхронизации
CREATE OR REPLACE FUNCTION cleanup_old_sync_entries(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sync_entries 
    WHERE sync_status = 'processed' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE devices IS 'Таблица для отслеживания устройств пользователей';
COMMENT ON TABLE sync_entries IS 'Таблица записей синхронизации между устройствами';
COMMENT ON TABLE sync_conflicts IS 'Таблица для управления конфликтами синхронизации';

COMMENT ON COLUMN devices.device_id IS 'Уникальный идентификатор устройства';
COMMENT ON COLUMN devices.last_sync IS 'Время последней успешной синхронизации';
COMMENT ON COLUMN sync_entries.data IS 'JSON данные записи для синхронизации';
COMMENT ON COLUMN sync_entries.timestamp IS 'Время создания операции на устройстве';
COMMENT ON COLUMN sync_conflicts.conflict_type IS 'Тип конфликта: concurrent_update, delete_update, update_delete';

-- Вставка записи о миграции
INSERT INTO migrations (filename, executed_at) VALUES ('006_sync_improvements.sql', CURRENT_TIMESTAMP);
