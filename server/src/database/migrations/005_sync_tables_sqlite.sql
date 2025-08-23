-- Создание таблиц для синхронизации данных между устройствами (SQLite версия)

-- Таблица для отслеживания выполненных операций синхронизации
CREATE TABLE IF NOT EXISTS sync_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT UNIQUE NOT NULL,
    table_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
    data TEXT NOT NULL, -- JSON данные операции
    device_id TEXT NOT NULL,
    user_id INTEGER,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для операций, ожидающих синхронизации на других устройствах
CREATE TABLE IF NOT EXISTS pending_sync_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id TEXT UNIQUE NOT NULL,
    table_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'update', 'delete')),
    data TEXT NOT NULL, -- JSON данные операции
    source_device_id TEXT NOT NULL,
    user_id INTEGER,
    timestamp DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'acknowledged', 'failed')) DEFAULT 'pending',
    acknowledged_by TEXT,
    acknowledged_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отслеживания конфликтов синхронизации
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_operation_id TEXT NOT NULL,
    remote_operation_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    local_data TEXT NOT NULL, -- JSON данные локальной операции
    remote_data TEXT NOT NULL, -- JSON данные удаленной операции
    device_id TEXT NOT NULL,
    user_id INTEGER,
    conflict_reason TEXT,
    resolved INTEGER DEFAULT 0, -- 0 = false, 1 = true
    resolution TEXT CHECK (resolution IN ('local', 'remote', 'manual')) DEFAULT 'manual',
    resolved_by INTEGER,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отслеживания устройств пользователей
CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1, -- 0 = false, 1 = true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов синхронизации
CREATE INDEX IF NOT EXISTS idx_sync_operations_operation_id ON sync_operations(operation_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_table_name ON sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_operations_device_id ON sync_operations(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_operations_timestamp ON sync_operations(timestamp);

CREATE INDEX IF NOT EXISTS idx_pending_sync_operations_operation_id ON pending_sync_operations(operation_id);
CREATE INDEX IF NOT EXISTS idx_pending_sync_operations_table_name ON pending_sync_operations(table_name);
CREATE INDEX IF NOT EXISTS idx_pending_sync_operations_source_device_id ON pending_sync_operations(source_device_id);
CREATE INDEX IF NOT EXISTS idx_pending_sync_operations_status ON pending_sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_pending_sync_operations_timestamp ON pending_sync_operations(timestamp);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_device_id ON sync_conflicts(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON sync_conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_table_name ON sync_conflicts(table_name);

CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON user_devices(last_seen);
