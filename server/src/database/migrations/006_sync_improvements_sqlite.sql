-- Обновленные таблицы для улучшенной синхронизации данных между устройствами (SQLite)

-- Удаление старых таблиц если они существуют
DROP TABLE IF EXISTS sync_conflicts;
DROP TABLE IF EXISTS pending_sync_operations;
DROP TABLE IF EXISTS sync_operations;
DROP TABLE IF EXISTS user_devices;

-- Таблица устройств пользователей
CREATE TABLE devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id INTEGER NOT NULL,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'web'
    platform TEXT, -- 'windows', 'macos', 'ios', 'android', 'linux'
    last_sync DATETIME,
    is_active INTEGER DEFAULT 1, -- 0 = false, 1 = true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица записей синхронизации
CREATE TABLE sync_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    user_id INTEGER NOT NULL,
    device_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    data TEXT NOT NULL, -- JSON данные
    timestamp DATETIME NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'processed', 'failed', 'conflict')) DEFAULT 'pending',
    conflict_resolution TEXT CHECK (conflict_resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица конфликтов синхронизации
CREATE TABLE sync_conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_entry_id INTEGER NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    local_data TEXT NOT NULL, -- JSON данные
    remote_data TEXT NOT NULL, -- JSON данные
    local_timestamp DATETIME NOT NULL,
    remote_timestamp DATETIME NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('concurrent_update', 'delete_update', 'update_delete')),
    resolved INTEGER DEFAULT 0, -- 0 = false, 1 = true
    resolution TEXT CHECK (resolution IN ('local_wins', 'remote_wins', 'merged', 'manual')),
    resolved_at DATETIME,
    resolved_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sync_entry_id) REFERENCES sync_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
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

-- Триггер для автоматического обновления updated_at в devices
CREATE TRIGGER update_devices_updated_at 
    AFTER UPDATE ON devices
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE devices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Триггер для автоматического обновления updated_at в sync_entries
CREATE TRIGGER update_sync_entries_updated_at 
    AFTER UPDATE ON sync_entries
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE sync_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
