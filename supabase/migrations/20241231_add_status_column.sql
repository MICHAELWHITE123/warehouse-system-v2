-- Добавление колонки status в таблицу sync_operations
ALTER TABLE sync_operations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Создание индекса для колонки status
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status);
